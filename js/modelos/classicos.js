// ============================================================
// PERSONAGENS CLÁSSICOS (refeitos no padrão do kit de modelos)
// ============================================================
// Bob, Patrick, Lula e Siriguejo, refeitos com o mesmo acabamento dos
// personagens novos do kit: materiais "de brinquedo" com verniz, formas
// arredondadas, olhos com íris/pupila/brilho (que piscam), e a mesma base de
// peão com o anel na cor do jogador. Mesma escala do kit: origem no chão,
// frente = +Z, base de raio ~0,48.
//
// Cada builder devolve o grupo do peão com userData.rig, que o animador
// (js/modelos/animacaoPeoes.js) usa pra respirar, piscar, nadar, comemorar
// e se frustrar:
//   rig.body  — o que se mexe (o corpo, sem a base)
//   rig.eyes  — grupos dos olhos (piscar = achatar em Y)
//   rig.arms  — pivôs dos braços { pivot, side } (abanar ao comemorar)

const CLASSIC_SEG = () => (isLowPowerDevice ? 0.6 : 1);
const cseg = (n) => Math.max(3, Math.round(n * CLASSIC_SEG()));

function toyMaterial(color, extra) {
    return new THREE.MeshPhysicalMaterial(
        Object.assign({ color, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 }, extra || {})
    );
}

function addMesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
}

// Base de peão igual à do kit: pedestal escuro, topo de areia, anel na cor
// do jogador (é o anel que distingue dois jogadores com o mesmo personagem).
function classicBase(parent, playerColor) {
    const perfil = [
        [0, 0],
        [0.44, 0],
        [0.468, 0.01],
        [0.48, 0.035],
        [0.47, 0.06],
        [0.445, 0.075],
        [0, 0.075],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    addMesh(new THREE.LatheGeometry(perfil, cseg(48)), toyMaterial(0x22333f, { roughness: 0.45 }), parent);
    const ring = addMesh(
        new THREE.TorusGeometry(0.481, 0.016, cseg(8), cseg(64)),
        new THREE.MeshStandardMaterial({
            color: playerColor,
            emissive: playerColor,
            emissiveIntensity: 0.6,
            roughness: 0.35,
        }),
        parent,
        0,
        0.036,
        0
    );
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
    addMesh(
        new THREE.CylinderGeometry(0.43, 0.43, 0.004, cseg(40)),
        new THREE.MeshStandardMaterial({ color: 0xe3cf9f, roughness: 0.95 }),
        parent,
        0,
        0.0755,
        0
    );
}

// Calota (pedaço de esfera) virada pra +Z: íris, pupila e brilho ficam na
// SUPERFÍCIE do olho (antes eram esferas menores dentro do branco do olho e
// sumiam — os olhos do Bob e do Patrick ficavam todos brancos).
function eyeCap(radius, angle, mat, parent) {
    const geo = new THREE.SphereGeometry(radius, cseg(28), cseg(10), 0, Math.PI * 2, 0, angle);
    geo.rotateX(Math.PI / 2);
    const m = addMesh(geo, mat, parent);
    m.castShadow = false;
    return m;
}

// Olho: branco + íris colorida (com aro escuro) + pupila + dois brilhos,
// num grupo virado pra `look`. O grupo achata em Y pra piscar.
const EYE_WHITE = () => toyMaterial(0xffffff, { roughness: 0.12, clearcoat: 1 });
function classicEye(parent, r, pos, irisColor, look, opts = {}) {
    const g = new THREE.Group();
    g.position.copy(pos);
    if (look) g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), look.clone().normalize());
    parent.add(g);
    addMesh(new THREE.SphereGeometry(r, cseg(28), cseg(18)), EYE_WHITE(), g);
    const iris = opts.iris || 0.62;
    eyeCap(r * 1.006, iris, toyMaterial(new THREE.Color(irisColor).multiplyScalar(0.55).getHex(), { clearcoat: 1 }), g);
    eyeCap(r * 1.012, iris * 0.86, toyMaterial(irisColor, { clearcoat: 1, roughness: 0.2 }), g);
    eyeCap(r * 1.018, iris * 0.48, toyMaterial(0x0b0d10, { roughness: 0.08, clearcoat: 1 }), g);
    const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const s1 = addMesh(new THREE.SphereGeometry(r * 0.15, 10, 8), shine, g, r * 0.24, r * 0.26, r * 0.98);
    const s2 = addMesh(new THREE.SphereGeometry(r * 0.07, 8, 6), shine, g, -r * 0.18, -r * 0.2, r * 1.0);
    s1.castShadow = s2.castShadow = false;
    return g;
}

function smileArc(parent, r, tube, pos, color = 0x2b1418, arc = Math.PI) {
    const m = addMesh(
        new THREE.TorusGeometry(r, tube, 8, cseg(20), arc),
        toyMaterial(color, { roughness: 0.5, clearcoat: 0 }),
        parent,
        pos.x,
        pos.y,
        pos.z
    );
    m.rotation.z = Math.PI + (Math.PI - arc) / 2;
    m.castShadow = false;
    return m;
}

function cheek(parent, pos, s = 0.045, color = 0xff8fb1) {
    const m = addMesh(
        new THREE.SphereGeometry(1, 14, 10),
        toyMaterial(color, { roughness: 0.7, clearcoat: 0 }),
        parent,
        pos.x,
        pos.y,
        pos.z
    );
    m.scale.set(s, s * 0.62, s * 0.25);
    m.castShadow = false;
    return m;
}

// Membro em tubo seguindo pontos (braços, pernas, tentáculos, nariz do Lula).
function limb(parent, points, radius, mat, radiusEnd) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, cseg(16), radius, cseg(8), false);
    if (radiusEnd !== undefined) {
        const p = geo.attributes.position;
        const P = new THREE.Vector3();
        const v = new THREE.Vector3();
        const ts = cseg(16);
        const rs = cseg(8);
        for (let i = 0; i <= ts; i++) {
            curve.getPointAt(i / ts, P);
            const k = (radius + (radiusEnd - radius) * (i / ts)) / radius;
            for (let j = 0; j <= rs; j++) {
                const idx = i * (rs + 1) + j;
                v.fromBufferAttribute(p, idx).sub(P).multiplyScalar(k).add(P);
                p.setXYZ(idx, v.x, v.y, v.z);
            }
        }
        geo.computeVertexNormals();
    }
    return addMesh(geo, mat, parent);
}

function makeRig(playerColor) {
    const root = new THREE.Group();
    classicBase(root, playerColor);
    const body = new THREE.Group();
    body.position.y = 0.075;
    root.add(body);
    root.userData.rig = { body, baseY: 0.075, eyes: [], arms: [] };
    return root;
}

// Textura de esponja: amarelo com furinhos mais escuros (sem costura nas bordas).
let spongeTexture = null;
function getSpongeTexture() {
    if (spongeTexture) return spongeTexture;
    const s = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = s;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffe23a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 5 + Math.random() * 13;
        for (const ox of [-s, 0, s]) {
            for (const oy of [-s, 0, s]) {
                const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
                g.addColorStop(0, 'rgba(176,150,20,0.95)');
                g.addColorStop(0.7, 'rgba(196,170,30,0.6)');
                g.addColorStop(1, 'rgba(196,170,30,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    spongeTexture = new THREE.CanvasTexture(canvas);
    spongeTexture.encoding = THREE.sRGBEncoding;
    return spongeTexture;
}

// Boca do Bob: um sorrisão escuro (uma peça só, no plano do rosto), com os
// dois dentões pendurados no lábio de cima e a língua no fundo. Tudo no mesmo
// plano z — antes os dentes ficavam soltos embaixo de um arco de sorriso.
function bobMouth(parent, z) {
    const top = 0.565;
    const w = 0.15;
    const shape = new THREE.Shape();
    shape.moveTo(-w, top + 0.012);
    shape.quadraticCurveTo(0, top - 0.025, w, top + 0.012);
    shape.quadraticCurveTo(w * 0.95, 0.43, 0, 0.42);
    shape.quadraticCurveTo(-w * 0.95, 0.43, -w, top + 0.012);
    const dark = toyMaterial(0x4a1416, { roughness: 0.6, clearcoat: 0 });
    const mouth = addMesh(new THREE.ShapeGeometry(shape, cseg(16)), dark, parent, 0, 0, z);
    mouth.castShadow = false;
    // Língua (no fundo da boca).
    const tongueShape = new THREE.Shape();
    tongueShape.moveTo(-0.075, 0.455);
    tongueShape.quadraticCurveTo(0, 0.5, 0.075, 0.455);
    tongueShape.quadraticCurveTo(0.06, 0.428, 0, 0.424);
    tongueShape.quadraticCurveTo(-0.06, 0.428, -0.075, 0.455);
    addMesh(
        new THREE.ShapeGeometry(tongueShape, cseg(12)),
        toyMaterial(0xff6f86, { clearcoat: 0 }),
        parent,
        0,
        0,
        z + 0.001
    ).castShadow = false;
    // Dentões: pendurados na borda de cima (que é curva: acompanha a altura).
    const tooth = toyMaterial(0xffffff, { roughness: 0.25 });
    for (const x of [-0.034, 0.034]) {
        const edge = top - 0.025 * (1 - (x / w) ** 2) + 0.004;
        const t = addMesh(
            new THREE.RoundedBoxGeometry(0.056, 0.06, 0.012, 2, 0.01),
            tooth,
            parent,
            x,
            edge - 0.03,
            z + 0.004
        );
        t.castShadow = false;
    }
    // Contorno do lábio (fino, só pra dar acabamento).
    const lip = new THREE.Mesh(
        new THREE.ShapeGeometry(shape, cseg(16)),
        toyMaterial(0xc98a1c, { roughness: 0.6, clearcoat: 0 })
    );
    lip.scale.set(1.06, 1.04, 1);
    lip.position.set(0, -0.02, z - 0.002);
    parent.add(lip);
}

// ==================== BOB ESPONJA ====================
function buildBobEsponjaPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const yellow = toyMaterial(0xffffff, { map: getSpongeTexture(), roughness: 0.75, clearcoat: 0.15 });
    const skin = toyMaterial(0xffe23a, { roughness: 0.6, clearcoat: 0.2 });
    const shirt = toyMaterial(0xf7f7f2, { roughness: 0.6, clearcoat: 0.1 });
    const pants = toyMaterial(0x8a5a2b, { roughness: 0.7, clearcoat: 0.1 });
    const dark = toyMaterial(0x1d1d22, { roughness: 0.4 });
    const red = toyMaterial(0xd7262e);

    // Corpo: bloco de esponja arredondado, um pouco mais largo em cima.
    const bodyGeo = new THREE.RoundedBoxGeometry(0.6, 0.56, 0.3, cseg(4), 0.07);
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const k = 1 + (y / 0.56) * 0.12;
        pos.setX(i, pos.getX(i) * k);
        // Bordas levemente onduladas (esponja não é um cubo perfeito).
        pos.setZ(i, pos.getZ(i) * (1 + 0.04 * Math.sin(pos.getX(i) * 18 + y * 9)));
    }
    bodyGeo.computeVertexNormals();
    addMesh(bodyGeo, yellow, b, 0, 0.62, 0);
    // Camisa branca + calça marrom com cinto.
    addMesh(new THREE.RoundedBoxGeometry(0.6, 0.1, 0.31, 2, 0.03), shirt, b, 0, 0.32, 0);
    addMesh(new THREE.RoundedBoxGeometry(0.6, 0.13, 0.31, 2, 0.03), pants, b, 0, 0.22, 0);
    addMesh(new THREE.BoxGeometry(0.61, 0.025, 0.315), dark, b, 0, 0.25, 0);
    for (const x of [-0.18, -0.06, 0.06, 0.18])
        addMesh(new THREE.BoxGeometry(0.035, 0.026, 0.02), dark, b, x, 0.25, 0.16);
    // Gravata.
    addMesh(new THREE.ConeGeometry(0.035, 0.03, 4), red, b, 0, 0.36, 0.165).rotation.x = Math.PI;
    const tie = addMesh(new THREE.ConeGeometry(0.045, 0.13, 4), red, b, 0, 0.29, 0.17);
    tie.rotation.set(Math.PI, Math.PI / 4, 0);
    tie.scale.z = 0.4;
    // Rosto.
    for (const sx of [-1, 1]) {
        rig.eyes.push(
            classicEye(
                b,
                0.095,
                new THREE.Vector3(sx * 0.11, 0.72, 0.16),
                0x3aa0ff,
                new THREE.Vector3(sx * 0.12, 0.05, 1)
            )
        );
        // Cílios (três por olho).
        for (let k = -1; k <= 1; k++) {
            const lash = addMesh(
                new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5),
                dark,
                b,
                sx * 0.11 + k * 0.04,
                0.83,
                0.2
            );
            lash.rotation.z = -k * 0.4;
        }
        cheek(b, new THREE.Vector3(sx * 0.2, 0.56, 0.165), 0.045, 0xffa0a0);
        for (let k = 0; k < 3; k++) {
            addMesh(
                new THREE.SphereGeometry(0.008, 6, 4),
                toyMaterial(0xb06b3a),
                b,
                sx * (0.18 + (k % 2) * 0.035),
                0.57 + k * 0.02,
                0.172
            ).castShadow = false;
        }
    }
    const nose = limb(
        b,
        [new THREE.Vector3(0, 0.62, 0.15), new THREE.Vector3(0, 0.64, 0.24), new THREE.Vector3(0, 0.67, 0.29)],
        0.03,
        skin,
        0.034
    );
    nose.castShadow = false;
    addMesh(new THREE.SphereGeometry(0.036, 10, 8), skin, b, 0, 0.675, 0.295);
    bobMouth(b, 0.158);
    // Braços (pivô no ombro) com mangas e mãos.
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.33, 0.42, 0);
        b.add(pivot);
        addMesh(new THREE.CylinderGeometry(0.05, 0.045, 0.07, 10), shirt, pivot, side * 0.02, 0, 0).rotation.z =
            side * 1.2;
        limb(
            pivot,
            [
                new THREE.Vector3(side * 0.03, -0.02, 0),
                new THREE.Vector3(side * 0.07, -0.12, 0.02),
                new THREE.Vector3(side * 0.06, -0.22, 0.04),
            ],
            0.018,
            skin
        );
        addMesh(new THREE.SphereGeometry(0.04, 10, 8), skin, pivot, side * 0.06, -0.24, 0.045);
        rig.arms.push({ pivot, side });
    }
    // Pernas com meias listradas e sapatos.
    for (const side of [-1, 1]) {
        limb(b, [new THREE.Vector3(side * 0.12, 0.16, 0), new THREE.Vector3(side * 0.12, 0.06, 0.01)], 0.02, skin);
        addMesh(new THREE.CylinderGeometry(0.026, 0.026, 0.06, 10), shirt, b, side * 0.12, 0.06, 0.01);
        addMesh(new THREE.TorusGeometry(0.027, 0.006, 6, 12), red, b, side * 0.12, 0.075, 0.01).rotation.x =
            Math.PI / 2;
        addMesh(
            new THREE.TorusGeometry(0.027, 0.006, 6, 12),
            toyMaterial(0x2f6bd9),
            b,
            side * 0.12,
            0.055,
            0.01
        ).rotation.x = Math.PI / 2;
        const shoe = addMesh(new THREE.SphereGeometry(0.055, 14, 10), dark, b, side * 0.12, 0.02, 0.04);
        shoe.scale.set(1, 0.6, 1.5);
    }
    return root;
}

// ==================== PATRICK ESTRELA ====================
// Estrela gordinha: retas entre as pontas e só as PONTAS arredondadas (se os
// cantos de dentro também forem curvas, a estrela vira uma bolha).
function roundStarShape(rOut, rIn, points) {
    const shape = new THREE.Shape();
    const n = points * 2;
    const pt = (i) => {
        const a = (i / n) * Math.PI * 2 + Math.PI / 2;
        const r = i % 2 === 0 ? rOut : rIn;
        return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
    };
    for (let i = 0; i < n; i += 2) {
        const tip = pt(i);
        const before = pt(i - 1);
        const after = pt(i + 1);
        const a = tip.clone().lerp(before, 0.28);
        const b = tip.clone().lerp(after, 0.28);
        if (i === 0) shape.moveTo(a.x, a.y);
        else shape.lineTo(a.x, a.y);
        shape.quadraticCurveTo(tip.x, tip.y, b.x, b.y);
        // Canto de dentro levemente suavizado.
        const inner = pt(i + 1);
        const c1 = inner.clone().lerp(tip, 0.12);
        const c2 = inner.clone().lerp(pt(i + 2), 0.12);
        shape.lineTo(c1.x, c1.y);
        shape.quadraticCurveTo(inner.x, inner.y, c2.x, c2.y);
    }
    shape.closePath();
    return shape;
}

let flowerTexture = null;
function getFlowerShortsTexture() {
    if (flowerTexture) return flowerTexture;
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = s;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8fd14f';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9; i++) {
        const x = ((i * 47) % s) + 8;
        const y = ((i * 71) % s) + 8;
        ctx.fillStyle = '#8e5bd9';
        for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    flowerTexture = new THREE.CanvasTexture(canvas);
    flowerTexture.encoding = THREE.sRGBEncoding;
    flowerTexture.wrapS = flowerTexture.wrapT = THREE.RepeatWrapping;
    flowerTexture.repeat.set(3, 1);
    return flowerTexture;
}

function buildPatrickPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const pink = toyMaterial(0xff9db0, { roughness: 0.5, clearcoat: 0.4 });
    const pinkDark = toyMaterial(0xf07c93, { roughness: 0.55, clearcoat: 0.3 });
    const dark = toyMaterial(0x2b1418, { roughness: 0.5, clearcoat: 0 });
    const R = 0.5;
    const DEPTH = 0.12;
    const BEVEL = 0.07;
    const front = DEPTH / 2 + BEVEL; // z da "barriga" da estrela

    const starGeo = new THREE.ExtrudeGeometry(roundStarShape(R, 0.24, 5), {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: 0.05,
        bevelSegments: cseg(4),
        curveSegments: cseg(8),
    });
    starGeo.translate(0, 0, -DEPTH / 2);
    addMesh(starGeo, pink, b, 0, 0.5, 0);
    // Bermuda verde com flores: um "cinto" largo de tecido na altura da
    // cintura, por cima da estrela (frente e costas).
    const shortsShape = new THREE.Shape();
    shortsShape.moveTo(-0.27, 0.06);
    shortsShape.lineTo(0.27, 0.06);
    shortsShape.lineTo(0.31, -0.1);
    shortsShape.lineTo(0.06, -0.12);
    shortsShape.lineTo(0, -0.06);
    shortsShape.lineTo(-0.06, -0.12);
    shortsShape.lineTo(-0.31, -0.1);
    shortsShape.closePath();
    const shortsGeo = new THREE.ExtrudeGeometry(shortsShape, {
        depth: DEPTH + BEVEL * 2 + 0.02,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
    });
    shortsGeo.translate(0, 0, -(DEPTH + BEVEL * 2 + 0.02) / 2);
    const uv = shortsGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 2.2);
    addMesh(
        shortsGeo,
        toyMaterial(0xffffff, { map: getFlowerShortsTexture(), roughness: 0.65, clearcoat: 0.1 }),
        b,
        0,
        0.36,
        0
    );
    // Rosto (na frente da estrela, na ponta de cima).
    for (const sx of [-1, 1]) {
        rig.eyes.push(
            classicEye(
                b,
                0.068,
                new THREE.Vector3(sx * 0.07, 0.76, front + 0.02),
                0x4b2e1e,
                new THREE.Vector3(sx * 0.1, 0.05, 1)
            )
        );
        const brow = addMesh(new THREE.CapsuleGeometry(0.014, 0.06, 4, 8), dark, b, sx * 0.075, 0.855, front + 0.03);
        brow.rotation.z = Math.PI / 2 + sx * 0.3;
        cheek(b, new THREE.Vector3(sx * 0.15, 0.64, front + 0.005), 0.045, 0xff6f93);
    }
    // Boca aberta sorrindo, com língua.
    const mouth = addMesh(new THREE.CircleGeometry(0.075, cseg(20), Math.PI, Math.PI), dark, b, 0, 0.65, front + 0.006);
    mouth.castShadow = false;
    const tongue = addMesh(
        new THREE.CircleGeometry(0.04, cseg(14), Math.PI, Math.PI),
        toyMaterial(0xff5c7a, { clearcoat: 0 }),
        b,
        0,
        0.62,
        front + 0.008
    );
    tongue.castShadow = false;
    smileArc(b, 0.075, 0.012, new THREE.Vector3(0, 0.65, front + 0.008), 0x2b1418);
    // Umbigo (detalhe que dá "personalidade" à barriga).
    addMesh(new THREE.SphereGeometry(0.015, 8, 6), pinkDark, b, 0, 0.46, front);
    // As pontas laterais da estrela são os braços: um pivô em cada lado mexe
    // a "mãozinha" (bolinha da mesma cor) ao comemorar.
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.4, 0.66, 0);
        b.add(pivot);
        addMesh(new THREE.SphereGeometry(0.07, 12, 10), pink, pivot, side * 0.05, 0.02, 0);
        rig.arms.push({ pivot, side });
    }
    return root;
}

// Peças do rosto que "abraçam" a superfície curva (boca, dentes, gola): a
// forma é desenhada no plano e cada vértice é empurrado até a superfície da
// frente (zAt(x, y) + lift). Assim a boca não fica flutuando nem enterrada
// num corpo redondo (uma forma plana num corpo curvo só encosta num ponto).
// Os triângulos do ShapeGeometry são divididos até ficarem pequenos (o
// contorno continua exato): um triângulo comprido atravessaria a curva por
// dentro e o corpo "furaria" a peça no meio (listra vermelha nos dentes).
function surfaceDecal(shape, zAt, mat, parent, lift = 0.002, curveSegs = 16) {
    const flat = new THREE.ShapeGeometry(shape, cseg(curveSegs)).toNonIndexed();
    const src = flat.attributes.position.array;
    const pos = [];
    const MAX = 0.012;
    const split = (a, b, c, depth) => {
        const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (depth > 6 || Math.max(d(a, b), d(b, c), d(c, a)) < MAX) {
            for (const v of [a, b, c]) pos.push(v[0], v[1], zAt(v[0], v[1]) + lift);
            return;
        }
        const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const ab = m(a, b);
        const bc = m(b, c);
        const ca = m(c, a);
        split(a, ab, ca, depth + 1);
        split(ab, b, bc, depth + 1);
        split(ca, bc, c, depth + 1);
        split(ab, bc, ca, depth + 1);
    };
    for (let i = 0; i < src.length; i += 9) {
        split([src[i], src[i + 1]], [src[i + 3], src[i + 4]], [src[i + 6], src[i + 7]], 0);
    }
    flat.dispose();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const m = addMesh(geo, mat, parent);
    m.castShadow = false;
    return m;
}

function roundedRectShape(cx, cy, w, h, r) {
    const s = new THREE.Shape();
    const x = cx - w / 2;
    const y = cy - h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

// Esfera deformada: largura em X/Z varia com a altura (widthAt(yn), yn de -1
// embaixo a 1 em cima). Devolve a malha e a função da superfície da frente.
function shapedBlob(parent, mat, cx, cy, rx, ry, rz, widthAt, opts = {}) {
    const geo = new THREE.SphereGeometry(
        1,
        cseg(opts.ws || 40),
        cseg(opts.hs || 28),
        0,
        Math.PI * 2,
        opts.thetaStart || 0,
        opts.thetaLength || Math.PI
    );
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const w = widthAt(y);
        p.setXYZ(i, p.getX(i) * rx * w, y * ry, p.getZ(i) * rz * (opts.zWidth === false ? 1 : w));
    }
    geo.computeVertexNormals();
    const mesh = addMesh(geo, mat, parent, cx, cy, 0);
    const zAt = (x, y) => {
        const yn = Math.max(-1, Math.min(1, (y - cy) / ry));
        const w = widthAt(yn);
        const q = 1 - yn * yn - ((x - cx) / (rx * w)) ** 2;
        return rz * (opts.zWidth === false ? 1 : w) * Math.sqrt(Math.max(0, q));
    };
    return { mesh, zAt };
}

// Tubo que segue pontos com a grossura variando ao longo dele (rAt(t), t de 0
// a 1) e ponta arredondada (meia esfera do mesmo raio do fim).
function shapedTube(parent, points, rAt, mat, capEnd = true) {
    const curve = new THREE.CatmullRomCurve3(points);
    const ts = cseg(24);
    const rs = cseg(12);
    const geo = new THREE.TubeGeometry(curve, ts, 1, rs, false);
    const p = geo.attributes.position;
    const P = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let i = 0; i <= ts; i++) {
        curve.getPointAt(i / ts, P);
        const r = rAt(i / ts);
        for (let j = 0; j <= rs; j++) {
            const idx = i * (rs + 1) + j;
            v.fromBufferAttribute(p, idx).sub(P).multiplyScalar(r).add(P);
            p.setXYZ(idx, v.x, v.y, v.z);
        }
    }
    geo.computeVertexNormals();
    const m = addMesh(geo, mat, parent);
    if (capEnd) {
        const end = curve.getPointAt(1);
        addMesh(new THREE.SphereGeometry(rAt(1), cseg(14), cseg(10)), mat, parent, end.x, end.y, end.z);
    }
    return m;
}

// ==================== LULA MOLUSCO ====================
// 3ª versão, "fofinha" (no estilo dos bichos do kit): cabeção liso em forma
// de ovo, olhos enormes e brilhantes com pálpebra leve, narizinho em gota
// caído entre os olhos, bochechas rosadas e um sorrisinho de canto. Corpo
// pequeno: camiseta curta, bracinhos e quatro tentáculos gordinhos.
function buildLulaMoluscoPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const skin = toyMaterial(0x97d9cb, { roughness: 0.38, clearcoat: 0.55 });
    const skinShade = toyMaterial(0x7ec4b5, { roughness: 0.42, clearcoat: 0.45 });
    const shirt = toyMaterial(0xa8642f, { roughness: 0.65, clearcoat: 0.1 });
    const dark = toyMaterial(0x2b1418, { roughness: 0.6, clearcoat: 0 });

    // Cabeça: larga em cima, queixo mais estreito (mas tudo redondinho).
    const HY = 0.67;
    const headW = (yn) => 0.84 + 0.13 * yn - 0.05 * yn * yn;
    const head = shapedBlob(b, skin, 0, HY, 0.25, 0.28, 0.23, headW);
    const zAt = head.zAt;

    // Olhos grandes, com a pálpebra cobrindo só o alto (cara de sono, não de bravo).
    const EY = 0.69;
    for (const sx of [-1, 1]) {
        const ex = sx * 0.088;
        const ez = zAt(ex, EY) - 0.04;
        rig.eyes.push(
            classicEye(b, 0.085, new THREE.Vector3(ex, EY, ez), 0x7a2a1c, new THREE.Vector3(sx * 0.16, 0, 1), {
                iris: 0.66,
            })
        );
        const lid = addMesh(
            new THREE.SphereGeometry(0.09, cseg(20), cseg(10), 0, Math.PI * 2, 0, Math.PI * 0.5),
            skinShade,
            b,
            ex,
            EY,
            ez
        );
        lid.rotation.set(-0.62, 0, -sx * 0.1);
        lid.castShadow = false;
    }

    // Narizinho: uma gota macia que nasce entre os olhos e cai um pouco pra
    // frente, até logo acima da boca.
    const nose = addMesh(new THREE.SphereGeometry(1, cseg(18), cseg(14)), skin, b, 0, 0.6, zAt(0, 0.6) + 0.03);
    nose.scale.set(0.04, 0.095, 0.047);
    nose.rotation.x = -0.32;
    const root2 = addMesh(new THREE.SphereGeometry(0.04, cseg(14), cseg(10)), skin, b, 0, 0.66, zAt(0, 0.66) - 0.01);
    root2.scale.set(1.1, 0.9, 0.8);

    // Sorrisinho de canto e bochechas.
    const MY = 0.505;
    const smile = new THREE.Shape();
    smile.moveTo(-0.055, MY + 0.008);
    smile.quadraticCurveTo(0, MY - 0.03, 0.06, MY + 0.014);
    smile.quadraticCurveTo(0, MY - 0.014, -0.055, MY + 0.008);
    surfaceDecal(smile, zAt, dark, b, 0.003);
    for (const sx of [-1, 1]) {
        const cx = sx * 0.155;
        cheek(b, new THREE.Vector3(cx, 0.565, zAt(cx, 0.565) + 0.003), 0.04, 0xff9fb6).rotation.y = sx * 0.55;
    }

    // Camiseta curtinha (torno), mangas e bracinhos.
    const prof = [
        [0.001, 0.16],
        [0.15, 0.16],
        [0.16, 0.18],
        [0.15, 0.3],
        [0.12, 0.4],
        [0.001, 0.41],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    addMesh(new THREE.LatheGeometry(prof, cseg(28)), shirt, b).scale.z = 0.88;
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.13, 0.35, 0);
        b.add(pivot);
        addMesh(new THREE.SphereGeometry(0.05, cseg(14), cseg(10)), shirt, pivot, side * 0.015, 0, 0);
        shapedTube(
            pivot,
            [
                new THREE.Vector3(side * 0.04, -0.02, 0),
                new THREE.Vector3(side * 0.08, -0.09, 0.02),
                new THREE.Vector3(side * 0.08, -0.15, 0.04),
            ],
            () => 0.022,
            skin,
            false
        );
        addMesh(new THREE.SphereGeometry(0.036, cseg(12), cseg(10)), skin, pivot, side * 0.08, -0.165, 0.045);
        rig.arms.push({ pivot, side });
    }

    // Quatro tentáculos gordinhos, enrolando pra fora na pontinha.
    for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const dx = Math.cos(a);
        const dz = Math.sin(a);
        shapedTube(
            b,
            [
                new THREE.Vector3(dx * 0.06, 0.18, dz * 0.05),
                new THREE.Vector3(dx * 0.11, 0.07, dz * 0.1),
                new THREE.Vector3(dx * 0.18, 0.03, dz * 0.16),
                new THREE.Vector3(dx * 0.22, 0.07, dz * 0.2),
            ],
            (t) => 0.06 * (1 - t * 0.55),
            skin
        );
    }
    return root;
}

// ==================== SR. SIRIGUEJO ====================
// 3ª versão, "fofinha": uma bola vermelha lisa com olhões em antenas
// curtinhas, sorrisão simples com uma fileira de dentes, bochechas, camisa
// azul-clara na parte de baixo e garras redondas de pinça (como o
// caranguejo do kit). Perninhas curtas.
function buildSrSiriguejoPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const red = toyMaterial(0xec4632, { roughness: 0.32, clearcoat: 0.8 });
    const redDark = toyMaterial(0xc03224, { roughness: 0.4, clearcoat: 0.6 });
    const shirt = toyMaterial(0x95d2f4, { roughness: 0.55, clearcoat: 0.2 });
    const dark = toyMaterial(0x220707, { roughness: 0.7, clearcoat: 0 });

    const CY = 0.42;
    const RX = 0.29;
    const RY = 0.28;
    const RZ = 0.26;
    const bodyW = (yn) => 1 + 0.07 * yn;
    const body = shapedBlob(b, red, 0, CY, RX, RY, RZ, bodyW);
    const zAt = body.zAt;

    // Camisa: a metade de baixo, com uma golinha.
    shapedBlob(b, shirt, 0, CY, RX * 1.025, RY * 1.02, RZ * 1.03, bodyW, {
        thetaStart: Math.PI * 0.64,
        thetaLength: Math.PI * 0.36,
        hs: 12,
    });
    const shirtTop = CY + Math.cos(Math.PI * 0.64) * RY * 1.02;
    const zShirt = (x, y) => zAt(x, y) * 1.03 + 0.004;
    for (const sx of [-1, 1]) {
        const g = new THREE.Shape();
        g.moveTo(sx * 0.01, shirtTop + 0.003);
        g.quadraticCurveTo(sx * 0.07, shirtTop + 0.02, sx * 0.1, shirtTop + 0.006);
        g.quadraticCurveTo(sx * 0.06, shirtTop - 0.04, sx * 0.01, shirtTop + 0.003);
        surfaceDecal(g, zShirt, toyMaterial(0x6fb3dd, { roughness: 0.55 }), b, 0.004, 8);
    }

    // Sorrisão: forma de meia-lua escura, com os dentes de cima numa faixa
    // só (arredondada) e a língua no fundo.
    const MY = 0.47;
    const mouth = new THREE.Shape();
    mouth.moveTo(-0.13, MY + 0.02);
    mouth.quadraticCurveTo(0, MY + 0.005, 0.13, MY + 0.02);
    mouth.quadraticCurveTo(0.12, MY - 0.09, 0, MY - 0.1);
    mouth.quadraticCurveTo(-0.12, MY - 0.09, -0.13, MY + 0.02);
    surfaceDecal(mouth, zAt, dark, b, 0.003);
    const tongue = new THREE.Shape();
    tongue.moveTo(-0.06, MY - 0.065);
    tongue.quadraticCurveTo(0, MY - 0.035, 0.06, MY - 0.065);
    tongue.quadraticCurveTo(0, MY - 0.105, -0.06, MY - 0.065);
    surfaceDecal(tongue, zAt, toyMaterial(0xff7f93, { clearcoat: 0 }), b, 0.005);
    const teeth = new THREE.Shape();
    teeth.moveTo(-0.1, MY + 0.012);
    teeth.quadraticCurveTo(0, MY + 0.0, 0.1, MY + 0.012);
    teeth.lineTo(0.092, MY - 0.018);
    teeth.quadraticCurveTo(0, MY - 0.03, -0.092, MY - 0.018);
    teeth.lineTo(-0.1, MY + 0.012);
    surfaceDecal(teeth, zAt, new THREE.MeshBasicMaterial({ color: 0xfbfbf4 }), b, 0.009);
    for (const sx of [-1, 1]) {
        const cx = sx * 0.19;
        cheek(b, new THREE.Vector3(cx, 0.5, zAt(cx, 0.5) + 0.004), 0.045, 0xff9fb0).rotation.y = sx * 0.6;
    }

    // Olhões em antenas curtinhas.
    for (const sx of [-1, 1]) {
        const baseY = CY + RY * 0.85;
        const bx = sx * 0.08;
        const bz = zAt(bx, baseY) - 0.03;
        shapedTube(
            b,
            [
                new THREE.Vector3(bx, baseY, bz),
                new THREE.Vector3(sx * 0.095, 0.75, bz + 0.02),
                new THREE.Vector3(sx * 0.105, 0.8, bz + 0.03),
            ],
            () => 0.024,
            red,
            false
        );
        rig.eyes.push(
            classicEye(
                b,
                0.085,
                new THREE.Vector3(sx * 0.108, 0.86, bz + 0.04),
                0x1c2f66,
                new THREE.Vector3(sx * 0.1, 0, 1),
                {
                    iris: 0.66,
                }
            )
        );
    }

    // Garras redondas: um "C" grosso (pinça aberta pra cima), num bracinho curto.
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.27, CY - 0.02, 0.03);
        b.add(pivot);
        shapedTube(
            pivot,
            [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(side * 0.08, 0.05, 0.03),
                new THREE.Vector3(side * 0.11, 0.12, 0.06),
            ],
            () => 0.035,
            red,
            false
        );
        const claw = addMesh(
            new THREE.TorusGeometry(0.075, 0.048, cseg(12), cseg(24), Math.PI * 1.55),
            red,
            pivot,
            side * 0.12,
            0.2,
            0.07
        );
        // A abertura do "C" fica pra cima e um pouco pra fora.
        claw.rotation.set(0, side * 0.35, Math.PI * 0.5 + Math.PI * 0.225 - side * 0.25);
        addMesh(new THREE.SphereGeometry(0.05, cseg(14), cseg(10)), redDark, pivot, side * 0.115, 0.135, 0.065);
        rig.arms.push({ pivot, side });
    }

    // Perninhas curtas e pontudas.
    for (const side of [-1, 1]) {
        shapedTube(
            b,
            [
                new THREE.Vector3(side * 0.09, CY - RY + 0.05, 0),
                new THREE.Vector3(side * 0.11, 0.07, 0.01),
                new THREE.Vector3(side * 0.12, 0.0, 0.03),
            ],
            (t) => 0.034 * (1 - t * 0.6),
            red
        );
    }
    return root;
}

// ==================== PEÃO PADRÃO (reserva) ====================
// Usado só se um modelo não puder ser montado (ex.: kit faltando).
function buildDefaultPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const mat = toyMaterial(colorHex);
    addMesh(new THREE.CylinderGeometry(0.2, 0.3, 0.45, cseg(20)), mat, b, 0, 0.25, 0);
    addMesh(new THREE.SphereGeometry(0.2, cseg(20), cseg(16)), mat, b, 0, 0.6, 0);
    for (const sx of [-1, 1]) rig.eyes.push(classicEye(b, 0.06, new THREE.Vector3(sx * 0.08, 0.63, 0.16), 0x333333));
    smileArc(b, 0.06, 0.012, new THREE.Vector3(0, 0.53, 0.18));
    return root;
}
