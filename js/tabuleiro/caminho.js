// ============================================================
// TABULEIRO: CAMINHO
// ============================================================
// Transforma o traçado (js/data/boardPath.js) em algo visível e responde onde
// fica cada casa (getTilePosition/getTileTangent).
//
// O caminho NÃO é mais uma faixa por cima da areia (parecia uma estrada, ou
// uma cobra com bolinhas): é a própria areia, um pouco mais úmida e escavada
// por onde a correnteza passa, com bordas irregulares. Quem chama atenção são
// as casas; a trilha é lida pela correnteza (faixa de água em movimento +
// partículas) que corre por cima dela, na direção do jogo.

// Casa um pouco acima da areia: getTilePosition soma 0,15 ao ponto da curva,
// então -0,12 deixa o centro da casa ~3 cm acima do chão.
const PATH_LIFT = -0.12;
const PATH_HALF_WIDTH = 0.95;
const CURRENT_HALF_WIDTH = 0.72;

let pathCurrent = null;
// Índice das amostras do caminho numa grade (ver getPathDistance).
let pathIndex = null;
const PATH_INDEX_CELL = 2;

function createBoardCurve() {
    // Mesmo motivo de createOceanEnvironment: o caminho da partida anterior
    // ficava embaixo do novo.
    disposeGroupChildren(boardGroup, (child) => child.userData.boardPath);
    const pts = generateBoardPath(boardLength);
    pts.forEach((p) => {
        p.y = getSeabedHeight(p.x, p.z) + PATH_LIFT;
    });
    boardCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const samples = samplePath(boardCurve, Math.max(240, boardLength * 14));
    pathIndex = buildPathIndex(samples);
    if (seabedMesh) carvePathIntoSeabed(seabedMesh.geometry, samples);
    pathCurrent = createPathCurrent(samples);
    boardGroup.add(pathCurrent.ribbon);
    boardGroup.add(pathCurrent.particles);
}

// Pontos igualmente espaçados ao longo da curva, com a distância percorrida
// (s) e a normal no plano do chão — base pra escavar a areia e pra correnteza.
function samplePath(curve, count) {
    const length = curve.getLength();
    const samples = [];
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const p = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        samples.push({ x: p.x, z: p.z, s: t * length, nx: n.x, nz: n.z });
    }
    return samples;
}

function buildPathIndex(samples) {
    const grid = new Map();
    samples.forEach((sm) => {
        const key = Math.floor(sm.x / PATH_INDEX_CELL) + ',' + Math.floor(sm.z / PATH_INDEX_CELL);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(sm);
    });
    return grid;
}

// Distância (aproximada, pelas amostras) de um ponto até o meio do caminho.
// Longe de tudo devolve um valor grande — quem usa só quer saber se está perto.
function getPathDistance(x, z) {
    if (!pathIndex) return Infinity;
    const cx = Math.floor(x / PATH_INDEX_CELL);
    const cz = Math.floor(z / PATH_INDEX_CELL);
    let best = Infinity;
    for (let r = 0; r <= 3 && best === Infinity; r++) {
        for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
                if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
                const list = pathIndex.get(cx + dx + ',' + (cz + dz));
                if (!list) continue;
                for (let k = 0; k < list.length; k++) {
                    const d = (list[k].x - x) ** 2 + (list[k].z - z) ** 2;
                    if (d < best) best = d;
                }
            }
        }
    }
    return best === Infinity ? 99 : Math.sqrt(best);
}

// Largura da trilha varia devagar ao longo do caminho — borda irregular,
// "natural", em vez de uma faixa de largura constante.
function pathWidthAt(s) {
    return PATH_HALF_WIDTH * (1 + 0.2 * Math.sin(s * 0.9) + 0.12 * Math.sin(s * 2.7 + 1.3));
}

// Escava a trilha na geometria do chão (já com relevo): fundo levemente mais
// baixo, uma bordinha de areia empurrada pros lados, e areia mais escura e
// úmida no meio (cor por vértice), quase sem contraste com o resto.
function carvePathIntoSeabed(geo, samples) {
    const pos = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const colors = colorAttr ? colorAttr.array : new Float32Array(pos.count * 3).fill(1);
    // Grade de busca: cada vértice só é comparado com as amostras próximas.
    const cell = 2;
    const grid = new Map();
    samples.forEach((sm) => {
        const key = Math.floor(sm.x / cell) + ',' + Math.floor(sm.z / cell);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(sm);
    });
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = -pos.getY(i); // o chão é girado -90° em X: y local = -z do mundo
        const cx = Math.floor(x / cell);
        const cz = Math.floor(z / cell);
        let best = Infinity;
        let bestS = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const list = grid.get(cx + dx + ',' + (cz + dz));
                if (!list) continue;
                for (let k = 0; k < list.length; k++) {
                    const d = (list[k].x - x) ** 2 + (list[k].z - z) ** 2;
                    if (d < best) {
                        best = d;
                        bestS = list[k].s;
                    }
                }
            }
        }
        if (best === Infinity) continue;
        const t = Math.sqrt(best) / pathWidthAt(bestS);
        if (t > 1.8) continue;
        const groove = -0.05 * (1 - THREE.MathUtils.smoothstep(t, 0, 1));
        const berm = 0.045 * Math.exp(-(((t - 1.2) / 0.25) ** 2));
        pos.setZ(i, pos.getZ(i) + groove + berm);
        const wet = 1 - THREE.MathUtils.smoothstep(t, 0.7, 1.25);
        colors[i * 3] *= 1 - 0.3 * wet;
        colors[i * 3 + 1] *= 1 - 0.25 * wet;
        colors[i * 3 + 2] *= 1 - 0.16 * wet;
    }
    pos.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
    else geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
}

// ---------- Correnteza ----------
function createCurrentTexture() {
    const w = 256;
    const h = 64;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // Riscos claros e compridos (faixas de água se mexendo), repetidos em
    // x±w pra textura emendar sem costura.
    for (let i = 0; i < 40; i++) {
        const y = 8 + Math.random() * (h - 16);
        const x = Math.random() * w;
        const len = 40 + Math.random() * 90;
        const alpha = 0.25 + Math.random() * 0.45;
        const width = 1.5 + Math.random() * 2.5;
        const bend = (Math.random() - 0.5) * 6;
        for (const ox of [-w, 0, w]) {
            const grad = ctx.createLinearGradient(x + ox, 0, x + ox + len, 0);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(x + ox, y);
            ctx.quadraticCurveTo(x + ox + len / 2, y + bend, x + ox + len, y);
            ctx.stroke();
        }
    }
    // Some nas laterais da faixa (topo e base da textura).
    ctx.globalCompositeOperation = 'destination-in';
    const fade = ctx.createLinearGradient(0, 0, 0, h);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.3, 'rgba(0,0,0,1)');
    fade.addColorStop(0.7, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
}

function createPathCurrent(samples) {
    // Faixa de água: uma fita colada no chão, com u = distância ao longo do
    // caminho — a textura andando em u faz a água "correr" pra frente.
    const n = samples.length;
    const positions = new Float32Array(n * 2 * 3);
    const uvs = new Float32Array(n * 2 * 2);
    const index = [];
    samples.forEach((sm, i) => {
        const w = CURRENT_HALF_WIDTH * (pathWidthAt(sm.s) / PATH_HALF_WIDTH);
        for (let side = 0; side < 2; side++) {
            const k = side ? 1 : -1;
            const x = sm.x + sm.nx * w * k;
            const z = sm.z + sm.nz * w * k;
            const j = i * 2 + side;
            positions[j * 3] = x;
            positions[j * 3 + 1] = getSeabedHeight(x, z) - 0.02;
            positions[j * 3 + 2] = z;
            uvs[j * 2] = sm.s / 3.2;
            uvs[j * 2 + 1] = side;
        }
        if (i < n - 1) {
            const a = i * 2;
            index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(index);
    const texture = createCurrentTexture();
    const ribbon = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
            map: texture,
            color: new THREE.Color(0xc8f6ff).convertSRGBToLinear(),
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    );
    ribbon.renderOrder = 2; // depois das cáusticas, antes dos números das casas
    ribbon.userData.boardPath = true;

    // Partículas da correnteza: pontinhos de água e grãos de areia levantando,
    // levados pra frente ao longo do caminho.
    const count = q3(80, 130, 190);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const water = new THREE.Color(0xd8fbff).convertSRGBToLinear();
    const sand = new THREE.Color(0xe2c58e).convertSRGBToLinear();
    const items = [];
    for (let i = 0; i < count; i++) {
        const isSand = i % 4 === 0;
        const c = isSand ? sand : water;
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
        items.push({
            u: Math.random(),
            side: (Math.random() - 0.5) * 1.3,
            height: isSand ? 0 : 0.05 + Math.random() * 0.35,
            speed: (isSand ? 0.35 : 0.7) + Math.random() * 0.5,
            sand: isSand,
            phase: Math.random() * 10,
        });
    }
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pgeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const particles = new THREE.Points(
        pgeo,
        new THREE.PointsMaterial({
            size: 0.08,
            map: getSoftDotTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
        })
    );
    particles.frustumCulled = false;
    particles.userData.boardPath = true;
    return { ribbon, texture, particles, items, samples, length: samples[samples.length - 1].s };
}

// Chamada todo frame por animate() (main.js).
function updatePathCurrent(elapsed, deltaTime) {
    if (!pathCurrent) return;
    const dt = Math.min(deltaTime, 0.1);
    pathCurrent.texture.offset.x -= dt * 0.22;
    const { items, samples, length } = pathCurrent;
    const pos = pathCurrent.particles.geometry.attributes.position;
    const last = samples.length - 1;
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        it.u += (it.speed * dt) / length;
        if (it.u >= 1) it.u -= 1;
        const f = it.u * last;
        const a = samples[Math.floor(f)];
        const b = samples[Math.min(last, Math.floor(f) + 1)];
        const k = f - Math.floor(f);
        const x = a.x + (b.x - a.x) * k + a.nx * it.side;
        const z = a.z + (b.z - a.z) * k + a.nz * it.side;
        // Areia: sobe um pouquinho e assenta de novo (levantada pela corrente).
        const lift = it.sand ? Math.max(0, Math.sin(elapsed * 1.7 + it.phase)) * 0.18 : it.height;
        pos.setXYZ(i, x, getSeabedHeight(x, z) + lift, z);
    }
    pos.needsUpdate = true;
}

function getTilePosition(index) {
    if (!boardCurve || boardLength === 0) return new THREE.Vector3(0, 0.3, 0);
    const t = boardLength === 1 ? 0 : index / (boardLength - 1);
    const point = boardCurve.getPointAt(Math.min(Math.max(t, 0), 1));
    point.y += 0.15;
    return point;
}

function getTileTangent(index) {
    if (!boardCurve || boardLength === 0) return new THREE.Vector3(1, 0, 0);
    const t = boardLength === 1 ? 0 : index / (boardLength - 1);
    const tangent = boardCurve.getTangentAt(Math.min(Math.max(t, 0), 1));
    tangent.y = 0;
    tangent.normalize();
    return tangent;
}
