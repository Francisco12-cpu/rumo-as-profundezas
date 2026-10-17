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

// ==================== LULA MOLUSCO ====================
// Raio da cabeça (lâmpada: queixo estreito, domo largo e redondo em cima).
const LULA_HEAD_H = 0.62;
function lulaHeadRadius(u) {
    if (u < 0.35) return 0.1 + 0.05 * (u / 0.35);
    const k = (u - 0.35) / 0.65; // 0..1 até o topo
    // Domo: cresce e fecha como uma esfera achatada.
    return (
        0.15 +
        0.1 * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) -
        (k > 0.62 ? 0.25 * (1 - Math.sqrt(1 - ((k - 0.62) / 0.38) ** 2)) : 0)
    );
}

function buildLulaMoluscoPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const skin = toyMaterial(0x9fd4c4, { roughness: 0.5, clearcoat: 0.35 });
    const skinDark = toyMaterial(0x7fb9a8, { roughness: 0.55, clearcoat: 0.25 });
    const shirt = toyMaterial(0x9a5d2c, { roughness: 0.7, clearcoat: 0.1 });
    const HEAD_Y = 0.48;

    const prof = [];
    for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        prof.push(new THREE.Vector2(Math.max(0.002, lulaHeadRadius(u)), u * LULA_HEAD_H));
    }
    prof.push(new THREE.Vector2(0.001, LULA_HEAD_H));
    const head = addMesh(new THREE.LatheGeometry(prof, cseg(28)), skin, b, 0, HEAD_Y, 0);
    head.scale.z = 0.9;
    // Ponto da superfície da cabeça, de frente, numa altura y (o rosto vai ali).
    const surfaceZ = (y, x = 0) => {
        const r = lulaHeadRadius((y - HEAD_Y) / LULA_HEAD_H) * 0.9;
        return Math.sqrt(Math.max(0, r * r - x * x));
    };
    // Olhos grandes com pálpebras pesadas (o jeito mal-humorado dele).
    for (const sx of [-1, 1]) {
        const ex = sx * 0.07;
        const ey = 0.78;
        const ez = surfaceZ(ey, ex) - 0.02;
        rig.eyes.push(
            classicEye(b, 0.064, new THREE.Vector3(ex, ey, ez), 0xd94a2a, new THREE.Vector3(sx * 0.18, 0, 1))
        );
        const lid = addMesh(
            new THREE.SphereGeometry(0.069, cseg(16), cseg(8), 0, Math.PI * 2, 0, Math.PI * 0.5),
            skinDark,
            b,
            ex,
            ey + 0.004,
            ez
        );
        lid.rotation.x = 0.5;
        lid.castShadow = false;
    }
    // Nariz comprido e caído (a marca dele): sai do meio do rosto, vai pra
    // frente e cai por cima da boca, AFINANDO até a ponta, que é arredondada e
    // do mesmo tamanho do tubo — sem bola na ponta (que dava outra impressão).
    const nz = surfaceZ(0.74) - 0.012;
    const noseTip = new THREE.Vector3(0, 0.575, nz + 0.13);
    const nose = limb(
        b,
        [
            new THREE.Vector3(0, 0.745, nz),
            new THREE.Vector3(0, 0.73, nz + 0.075),
            new THREE.Vector3(0, 0.665, nz + 0.12),
            noseTip,
        ],
        0.04,
        skin,
        0.026
    );
    nose.scale.x = 1.15;
    addMesh(new THREE.SphereGeometry(0.026, 12, 10), skin, b, noseTip.x, noseTip.y, noseTip.z).scale.x = 1.15;
    // Dobrinha na raiz do nariz (entre os olhos), pra ele não parecer colado.
    const bridge = addMesh(new THREE.SphereGeometry(0.05, 14, 10), skin, b, 0, 0.75, nz - 0.01);
    bridge.scale.set(1.1, 0.7, 0.6);
    // Boca torta (meio sorriso pra baixo), embaixo do nariz.
    const mouth = smileArc(
        b,
        0.045,
        0.009,
        new THREE.Vector3(0.05, 0.57, surfaceZ(0.57, 0.05) + 0.004),
        0x2b1418,
        Math.PI * 0.7
    );
    mouth.rotation.z = 0.35;
    // Camisa marrom.
    addMesh(new THREE.CylinderGeometry(0.11, 0.16, 0.22, cseg(20)), shirt, b, 0, 0.38, 0);
    // Braços finos (pivô no ombro).
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.13, 0.46, 0);
        b.add(pivot);
        addMesh(new THREE.CylinderGeometry(0.04, 0.035, 0.06, 10), shirt, pivot, side * 0.02, 0, 0).rotation.z =
            side * 1.1;
        limb(
            pivot,
            [
                new THREE.Vector3(side * 0.03, -0.01, 0),
                new THREE.Vector3(side * 0.07, -0.14, 0.03),
                new THREE.Vector3(side * 0.06, -0.25, 0.06),
            ],
            0.017,
            skin
        );
        rig.arms.push({ pivot, side });
    }
    // Quatro tentáculos-pernas enrolando na ponta.
    for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const dx = Math.cos(a);
        const dz = Math.sin(a);
        limb(
            b,
            [
                new THREE.Vector3(dx * 0.06, 0.28, dz * 0.06),
                new THREE.Vector3(dx * 0.12, 0.12, dz * 0.12),
                new THREE.Vector3(dx * 0.22, 0.03, dz * 0.22),
                new THREE.Vector3(dx * 0.27, 0.07, dz * 0.27),
            ],
            0.04,
            skin,
            0.016
        );
    }
    return root;
}

// ==================== SR. SIRIGUEJO ====================
function buildSrSiriguejoPawn(colorHex) {
    const root = makeRig(colorHex);
    const rig = root.userData.rig;
    const b = rig.body;
    const red = toyMaterial(0xe8483a, { roughness: 0.4, clearcoat: 0.6 });
    const redDark = toyMaterial(0xb8322a, { roughness: 0.45, clearcoat: 0.5 });
    const shirt = toyMaterial(0x5aa7e6, { roughness: 0.6, clearcoat: 0.15 });
    const dark = toyMaterial(0x2b1418, { roughness: 0.5, clearcoat: 0 });

    // Corpo largo e achatado.
    const body = addMesh(new THREE.SphereGeometry(0.3, cseg(28), cseg(20)), red, b, 0, 0.42, 0);
    body.scale.set(1.15, 1, 0.85);
    // Camisa azul na metade de baixo + cinto.
    const shirtM = addMesh(
        new THREE.SphereGeometry(0.305, cseg(28), cseg(12), 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.32),
        shirt,
        b,
        0,
        0.42,
        0
    );
    shirtM.scale.set(1.15, 1, 0.85);
    addMesh(new THREE.TorusGeometry(0.33, 0.018, 6, cseg(28)), toyMaterial(0x3b2a1e), b, 0, 0.3, 0).scale.set(
        1.04,
        0.86,
        1
    );
    // Olhos em antenas.
    for (const sx of [-1, 1]) {
        limb(
            b,
            [
                new THREE.Vector3(sx * 0.08, 0.66, 0.08),
                new THREE.Vector3(sx * 0.1, 0.8, 0.1),
                new THREE.Vector3(sx * 0.11, 0.9, 0.1),
            ],
            0.018,
            red
        );
        rig.eyes.push(
            classicEye(b, 0.065, new THREE.Vector3(sx * 0.11, 0.93, 0.11), 0x1a6ad9, new THREE.Vector3(sx * 0.1, 0, 1))
        );
        const brow = addMesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), dark, b, sx * 0.1, 1.01, 0.13);
        brow.rotation.z = Math.PI / 2 - sx * 0.3;
    }
    // Sorrisão com dentes.
    smileArc(b, 0.12, 0.018, new THREE.Vector3(0, 0.52, 0.24));
    for (const x of [-0.06, 0, 0.06])
        addMesh(new THREE.BoxGeometry(0.035, 0.03, 0.02), toyMaterial(0xffffff), b, x, 0.485, 0.245);
    // Garras grandes (pivô no ombro), cada uma com duas "pinças".
    for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.32, 0.44, 0.04);
        b.add(pivot);
        limb(
            pivot,
            [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(side * 0.1, 0.05, 0.05),
                new THREE.Vector3(side * 0.14, 0.14, 0.09),
            ],
            0.035,
            red
        );
        const claw = new THREE.Group();
        claw.position.set(side * 0.15, 0.2, 0.1);
        pivot.add(claw);
        const upper = addMesh(new THREE.SphereGeometry(0.09, cseg(16), cseg(12)), redDark, claw, 0, 0.03, 0);
        upper.scale.set(0.8, 1.2, 0.6);
        const tip = addMesh(new THREE.ConeGeometry(0.045, 0.1, 10), red, claw, side * 0.04, 0.14, 0);
        tip.rotation.z = -side * 0.4;
        const lower = addMesh(new THREE.ConeGeometry(0.035, 0.08, 10), red, claw, -side * 0.04, 0.12, 0);
        lower.rotation.z = side * 0.5;
        rig.arms.push({ pivot, side });
    }
    // Perninhas pontudas.
    for (const side of [-1, 1]) {
        for (let k = 0; k < 2; k++) {
            const z = (k - 0.5) * 0.14;
            limb(
                b,
                [
                    new THREE.Vector3(side * 0.18, 0.2, z),
                    new THREE.Vector3(side * 0.24, 0.1, z),
                    new THREE.Vector3(side * 0.22, 0.01, z),
                ],
                0.022,
                red,
                0.008
            );
        }
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
