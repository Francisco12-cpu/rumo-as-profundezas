// ============================================================
// ATMOSFERA DO FUNDO DO MAR E LIMITES DO MUNDO
// ============================================================
// Portado/adaptado do arquivo de referência (motelos/fundo-do-mar-3d.html):
// céu em degradê, cáusticas na areia, raios de luz da superfície e neve
// marinha. Mais o que esconde a borda do mapa: domo de céu com o horizonte na
// cor exata da névoa (a areia some no azul em vez de terminar numa linha),
// paredões de rocha em anel e navios afundados bem ao longe.
//
// Céu, raios e neve são criados uma vez (initAtmosphere, chamada por
// initThreeJS) e valem pra qualquer partida e pro menu; cáusticas e o anel
// de rochas dependem do chão de cada partida (ver createOceanEnvironment).

// Cor da água no horizonte: névoa e base do domo usam a MESMA cor, senão
// aparece uma linha onde o chão encontra o céu.
const WATER_HORIZON_COLOR = 0x0f5d78;
const WATER_SURFACE_COLOR = 0x5fcfdc;
const WATER_ABYSS_COLOR = 0x03182a;

// Menor que o far da câmera (renderizador.js), senão o domo é cortado.
const SKY_DOME_RADIUS = 180;

let causticLayers = [];
let godRays = null;
let marineSnow = null;
let worldEdgeGroup = null;

let waterSurface = null;

function initAtmosphere() {
    scene.background = new THREE.Color(WATER_HORIZON_COLOR);
    scene.add(createSkyDome());
    waterSurface = createWaterSurface();
    scene.add(waterSurface.mesh);
    godRays = createGodRays();
    scene.add(godRays);
    marineSnow = createMarineSnow();
    scene.add(marineSnow);
}

// Esfera por dentro, com o degradê preso à DIREÇÃO (não à tela): no
// horizonte é exatamente a cor da névoa; pra cima clareia até a superfície,
// pra baixo escurece até o abismo. Segue a câmera, então nunca tem borda.
function createSkyDome() {
    const geo = new THREE.SphereGeometry(SKY_DOME_RADIUS, 32, 20);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const horizon = new THREE.Color(WATER_HORIZON_COLOR).convertSRGBToLinear();
    const surface = new THREE.Color(WATER_SURFACE_COLOR).convertSRGBToLinear();
    const abyss = new THREE.Color(WATER_ABYSS_COLOR).convertSRGBToLinear();
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / SKY_DOME_RADIUS;
        // Abaixo do horizonte continua na cor da névoa por um bom trecho: de
        // cima, o chão que some na névoa "encontra" o domo nessa faixa.
        if (y > 0) c.copy(horizon).lerp(surface, Math.pow(y, 0.7));
        else c.copy(horizon).lerp(abyss, THREE.MathUtils.smoothstep(-y, 0.45, 0.95));
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const dome = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    dome.renderOrder = -10;
    dome.onBeforeRender = (r, s, cam) => dome.position.copy(cam.position);
    dome.frustumCulled = false;
    return dome;
}

// ---------- Cáusticas (luz ondulando na areia) ----------
// Mesma textura Voronoi da referência: bordas das células claras = onde a
// luz se concentra. Duas camadas aditivas andando em direções diferentes
// formam o padrão "vivo".
let causticTexture = null;

function getCausticTexture() {
    if (causticTexture) return causticTexture;
    const N = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = N;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(N, N);
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pts = Array.from({ length: 26 }, () => [rand(), rand()]);
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            let f1 = 9;
            let f2 = 9;
            for (const [px, py] of pts) {
                let dx = Math.abs(x / N - px);
                let dy = Math.abs(y / N - py);
                dx = Math.min(dx, 1 - dx);
                dy = Math.min(dy, 1 - dy);
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < f1) {
                    f2 = f1;
                    f1 = d;
                } else if (d < f2) f2 = d;
            }
            const v = Math.pow(Math.max(0, 1 - (f2 - f1) / 0.075), 1.7) * 255;
            const i = (y * N + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    // Desfoque leve: a luz na água tem borda macia (com borda dura parecia
    // um piso de azulejos).
    const soft = document.createElement('canvas');
    soft.width = soft.height = N;
    const sctx = soft.getContext('2d');
    if ('filter' in sctx) {
        sctx.filter = 'blur(2px)';
        for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) sctx.drawImage(canvas, ox, oy);
    } else sctx.drawImage(canvas, 0, 0);
    causticTexture = new THREE.CanvasTexture(soft);
    causticTexture.wrapS = causticTexture.wrapT = THREE.RepeatWrapping;
    return causticTexture;
}

// floorGeo: a geometria do chão (já com relevo e UV em unidades de mundo).
function createCaustics(floorGeo, parent) {
    causticLayers = [];
    const layers = isLowPowerDevice
        ? [[1, 0.16, 0.012, 0.008]]
        : [
              [1, 0.14, 0.012, 0.008],
              [1.37, 0.11, -0.01, 0.013],
          ];
    layers.forEach(([k, opacity, vx, vy]) => {
        const tex = getCausticTexture().clone();
        tex.needsUpdate = true;
        tex.repeat.set(0.55 * k, 0.55 * k);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            color: new THREE.Color(0x9feaff).convertSRGBToLinear(),
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(floorGeo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = SEABED_BASE_Y + 0.02;
        mesh.renderOrder = 1;
        parent.add(mesh);
        causticLayers.push({ tex, vx, vy });
    });
}

// ---------- Superfície da água (vista de baixo) ----------
// O "teto" do mar: ondas de luz se mexendo lá em cima, mais claras no meio e
// sumindo nas bordas. Aparece quando a câmera olha pra cima (voo, menu,
// câmera rente ao chão) — antes lá em cima era só um degradê parado.
function createWaterSurface() {
    const fade = document.createElement('canvas');
    fade.width = fade.height = 128;
    const fctx = fade.getContext('2d');
    const g = fctx.createRadialGradient(64, 64, 6, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    fctx.fillStyle = g;
    fctx.fillRect(0, 0, 128, 128);
    const layers = [];
    const group = new THREE.Group();
    [
        [5, 0.5, 0.004, 0.003],
        [7.3, 0.35, -0.003, 0.005],
    ].forEach(([rep, opacity, vx, vy], i) => {
        if (i > 0 && isLowPowerDevice) return;
        const tex = getCausticTexture().clone();
        tex.needsUpdate = true;
        tex.repeat.set(rep, rep);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            alphaMap: new THREE.CanvasTexture(fade),
            color: new THREE.Color(0xd6fbff).convertSRGBToLinear(),
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.y = 26 + i * 0.4;
        mesh.renderOrder = -5;
        group.add(mesh);
        layers.push({ tex, vx, vy });
    });
    return { mesh: group, layers };
}

// ---------- Raios de luz vindos da superfície ----------
function createGodRays() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(64, 256);
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 64; x++) {
            const h = Math.exp(-(((x - 32) / 13) ** 2));
            const v = Math.pow(1 - y / 256, 1.6) * Math.min(1, y / 30);
            const i = (y * 64 + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
            img.data[i + 3] = 255 * h * v;
        }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    const group = new THREE.Group();
    const count = q3(5, 8, 11);
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const d = 4 + Math.random() * 22;
        const w = 2 + Math.random() * 3;
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            color: new THREE.Color(0xcff8ff).convertSRGBToLinear(),
            transparent: true,
            opacity: 0.1 + Math.random() * 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: false,
        });
        const ray = new THREE.Mesh(new THREE.PlaneGeometry(w, 26), mat);
        // Inclinado como luz de sol entrando na água (vem do mesmo lado do sol).
        ray.position.set(Math.cos(a) * d, 11, Math.sin(a) * d);
        ray.userData = { x: ray.position.x, phase: Math.random() * 6, opacity: mat.opacity };
        group.add(ray);
    }
    return group;
}

// Pontinho redondo e macio (neve marinha, correnteza do caminho).
let softDotTexture = null;

function getSoftDotTexture() {
    if (softDotTexture) return softDotTexture;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    softDotTexture = new THREE.CanvasTexture(canvas);
    return softDotTexture;
}

// ---------- Neve marinha (partículas em suspensão) ----------
const MARINE_SNOW_BOX = { x: 44, y: 16, z: 44 };

function createMarineSnow() {
    const n = q3(220, 420, 650);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * MARINE_SNOW_BOX.x;
        pos[i * 3 + 1] = Math.random() * MARINE_SNOW_BOX.y;
        pos[i * 3 + 2] = (Math.random() - 0.5) * MARINE_SNOW_BOX.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
            size: 0.09,
            map: getSoftDotTexture(),
            color: new THREE.Color(0xd8f6ff).convertSRGBToLinear(),
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
        })
    );
    points.frustumCulled = false;
    return points;
}

// ---------- Borda do mundo: paredões de rocha e naufrágios distantes ----------
// Rochas grandes em anel (uma só InstancedMesh), bem dentro da névoa — de
// longe viram silhuetas de recife, que é o que o olho espera ver no fundo.
function createWorldEdge(parent) {
    worldEdgeGroup = new THREE.Group();
    parent.add(worldEdgeGroup);
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    const p = rockGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const k = 1 + Math.sin(p.getX(i) * 3.1 + p.getZ(i) * 2.3) * 0.18 + Math.cos(p.getY(i) * 4.7) * 0.12;
        p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    rockGeo.computeVertexNormals();
    const rockMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x5f8f9c).convertSRGBToLinear(),
        roughness: 0.95,
        flatShading: true,
    });
    const count = isLowPowerDevice ? 46 : 80;
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
        const r = 72 + Math.random() * 30;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const s = 5 + Math.random() * 9;
        dummy.position.set(x, getSeabedHeight(x, z) + s * 0.25, z);
        dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        dummy.scale.set(s * (0.8 + Math.random() * 0.6), s * (0.7 + Math.random() * 1.1), s);
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;
    worldEdgeGroup.add(rocks);

    // Navios afundados ao longe: inclinados e meio enterrados. São estáticos,
    // então entram "assados" (poucas malhas) como as pedras do cenário.
    if (hasSeaKit()) {
        const wrecks = [];
        const spots = [
            [-0.9, 58],
            [2.3, 64],
        ];
        spots.forEach(([a, r], i) => {
            const m = makeSeaModel('navio', null, 4.2 + i * 0.6, false);
            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            m.objeto.position.set(x, getSeabedHeight(x, z) - 0.8, z);
            m.objeto.rotation.set(0.18 * (i ? -1 : 1), a + 1.2, 0.22 * (i ? 1 : -1));
            wrecks.push(m);
        });
        bakeStaticSeaModels(wrecks, worldEdgeGroup);
    }
}

// Chamada todo frame por animate() (main.js).
function updateAtmosphere(elapsed, deltaTime) {
    for (let i = 0; i < causticLayers.length; i++) {
        const l = causticLayers[i];
        // Deriva + leve vaivém: a luz "respira" em vez de só escorregar.
        l.tex.offset.set(
            elapsed * l.vx + Math.sin(elapsed * 0.35 + i) * 0.03,
            elapsed * l.vy + Math.cos(elapsed * 0.3 + i) * 0.03
        );
    }
    if (waterSurface) {
        waterSurface.mesh.position.x = camera.position.x;
        waterSurface.mesh.position.z = camera.position.z;
        waterSurface.layers.forEach((l, i) => {
            l.tex.offset.set(elapsed * l.vx + camera.position.x / 48, elapsed * l.vy - camera.position.z / 48);
            l.tex.rotation = Math.sin(elapsed * 0.05 + i) * 0.05;
        });
    }
    if (godRays) {
        const camAngle = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
        godRays.children.forEach((ray) => {
            const d = ray.userData;
            // Gira em Y pra ficar de frente pra câmera (só em Y: continua "vertical").
            ray.rotation.set(0, camAngle, 0.18);
            ray.position.x = d.x + Math.sin(elapsed * 0.15 + d.phase) * 0.8;
            ray.material.opacity = d.opacity * (0.75 + Math.sin(elapsed * 0.4 + d.phase) * 0.25);
        });
    }
    if (marineSnow) {
        // Caixa de partículas sempre em volta do que a câmera olha; quem sai
        // por um lado volta pelo outro.
        const pos = marineSnow.geometry.attributes.position;
        const cx = controls.target.x;
        const cz = controls.target.z;
        const hx = MARINE_SNOW_BOX.x / 2;
        const hz = MARINE_SNOW_BOX.z / 2;
        const drift = Math.min(deltaTime, 0.1);
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i) + Math.sin(elapsed * 0.3 + i) * 0.05 * drift + 0.12 * drift;
            let y = pos.getY(i) - 0.08 * drift;
            let z = pos.getZ(i) + Math.cos(elapsed * 0.25 + i * 1.3) * 0.05 * drift;
            if (x - cx > hx) x -= MARINE_SNOW_BOX.x;
            else if (x - cx < -hx) x += MARINE_SNOW_BOX.x;
            if (z - cz > hz) z -= MARINE_SNOW_BOX.z;
            else if (z - cz < -hz) z += MARINE_SNOW_BOX.z;
            if (y < -0.2) y += MARINE_SNOW_BOX.y;
            pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
    }
}
