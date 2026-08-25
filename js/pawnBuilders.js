// ============================================================
// SISTEMA DE PERSONAGENS: MONTAGEM DO MODELO VISUAL
// ============================================================
// Isolado do resto da renderização de propósito: o resto do jogo (scene.js,
// state.js, câmera) só enxerga o THREE.Group que sai daqui — nunca sabe (nem
// precisa saber) como o modelo foi montado por dentro. Isso é o que permite
// trocar o visual dos personagens no futuro (modelos 3D importados, por
// exemplo) sem tocar em mais nada: basta registrar um novo builder aqui e
// apontar CHARACTER_MODEL_KEY (js/data/characters.js) pra ele.
const PAWN_BUILDERS = {
    default: buildDefaultPawn,
    bob: buildBobEsponjaPawn,
    patrick: buildPatrickPawn,
    lula: buildLulaMoluscoPawn,
    siriguejo: buildSrSiriguejoPawn,
};

// Escalação usada quando CHARACTER_MODEL_KEY === 'roster': cada índice de
// jogador (0-based) pega o personagem correspondente nesta lista, repetindo
// o ciclo se houver mais jogadores que personagens (até 6 jogadores, só 4
// personagens temáticos). O anel da base (ver charBaseRing) sempre usa a cor
// de verdade do jogador, então mesmo repetindo personagem dois jogadores
// continuam visualmente distinguíveis.
const CHARACTER_ROSTER = ['bob', 'patrick', 'lula', 'siriguejo'];

function createCharacterPawn(colorHex, index, modelKey) {
    const key = modelKey || CHARACTER_MODEL_KEY;
    const builderKey = key === 'roster' ? CHARACTER_ROSTER[index % CHARACTER_ROSTER.length] : key;
    const builder = PAWN_BUILDERS[builderKey] || PAWN_BUILDERS.default;
    const group = builder(colorHex);
    group.userData = { index: index, colorHex: colorHex, position: 0 };
    return group;
}

// ---- helpers compartilhados pelos personagens temáticos abaixo ----
function charMaterial(colorHex, roughness = 0.35, metalness = 0.0, emissiveIntensity = 0.08) {
    const color = new THREE.Color(colorHex);
    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness,
        emissive: color.clone().multiplyScalar(emissiveIntensity),
    });
}

// Base circular (disco + anel), no mesmo espírito da base do peão padrão: o
// disco fica na cor temática do personagem (identidade visual fixa), o anel
// fino por cima leva a cor de verdade do jogador (distingue slots repetidos).
function charBaseRing(themeColorHex, playerColorHex, radius = 0.38, height = 0.1) {
    const group = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(radius, radius * 1.1, height, 32);
    const base = new THREE.Mesh(baseGeo, charMaterial(themeColorHex, 0.3, 0.15, 0.1));
    base.position.y = height / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const ringGeo = new THREE.TorusGeometry(radius, 0.025, 12, 32);
    const ring = new THREE.Mesh(ringGeo, charMaterial(playerColorHex, 0.2, 0.55, 0.4));
    ring.position.y = height / 2;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
}

// Peão "padrão": um bonequinho redondo estilizado, geometria pura (sem
// texturas/assets externos). Lê todas as suas medidas de PAWN_APPEARANCE.
// Mantido como builder de fallback (chave 'default' em PAWN_BUILDERS).
function buildDefaultPawn(colorHex) {
    const a = PAWN_APPEARANCE;
    const group = new THREE.Group();
    const color = new THREE.Color(colorHex);

    // Corpo principal
    const bodyGeo = new THREE.CylinderGeometry(a.body.radiusTop, a.body.radiusBottom, a.body.height, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = a.body.y;
    body.castShadow = true;
    group.add(body);

    // Cabeça
    const headGeo = new THREE.SphereGeometry(a.head.radius, 10, 8);
    const headMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.25,
        metalness: 0.15,
        emissive: color,
        emissiveIntensity: 0.2,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = a.head.y;
    head.castShadow = true;
    group.add(head);

    // Olhos
    const e = a.eyes;
    const eyeWhiteGeo = new THREE.SphereGeometry(e.radius, 6, 4);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-e.spacing, e.y, e.forward);
    group.add(leftEyeWhite);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(e.spacing, e.y, e.forward);
    group.add(rightEyeWhite);

    const pupilGeo = new THREE.SphereGeometry(e.pupilRadius, 4, 3);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-e.spacing + 0.01, e.y, e.pupilForward);
    group.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(e.spacing - 0.01, e.y, e.pupilForward);
    group.add(rightPupil);

    // Sorriso
    const s = a.smile;
    const smileGeo = new THREE.TorusGeometry(s.radius, s.tube, 4, 8, Math.PI);
    const smileMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, s.y, s.forward);
    smile.rotation.z = Math.PI;
    smile.rotation.y = Math.PI;
    group.add(smile);

    // Anel base
    const br = a.baseRing;
    const baseRingGeo = new THREE.TorusGeometry(br.radius, br.tube, 6, 16);
    const baseRingMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.5,
        emissive: color,
        emissiveIntensity: 0.4,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.position.y = br.y;
    baseRing.rotation.x = -Math.PI / 2;
    group.add(baseRing);

    // Luz pontual (dá um brilhinho de cor no chão ao redor do peão)
    const pl = a.pointLight;
    const pointLight = new THREE.PointLight(colorHex, pl.intensity, pl.distance);
    pointLight.position.y = pl.y;
    group.add(pointLight);

    return group;
}

// ============================================================
// PERSONAGENS TEMÁTICOS (portados de tokens.html)
// ============================================================
// Todos construídos na mesma escala do tabuleiro (casas ~1.2-1.4 de
// diâmetro), com a base do modelo originalmente em y=-0.22 — por isso cada
// builder monta o personagem num grupo interno e desloca esse grupo pra
// cima (+0.22) dentro de um grupo externo "neutro" (posição sempre em
// 0,0,0). O grupo externo é o que scene.js manipula livremente
// (pawn.position) pra andar pelo tabuleiro; o deslocamento interno garante
// que a base/pés fiquem coladas no chão da casa, igual ao peão padrão.

// ==================== BOB ESPONJA ====================
function buildBobEsponjaPawn(colorHex) {
    const grupo = new THREE.Group();
    const amarelo = 0xffe135;
    const amareloEscuro = 0xe8c520;
    const marrom = 0x8b5a2b;
    const branco = 0xffffff;
    const azulPupila = 0x1e90ff;
    const vermelhoGravata = 0xdc143c;
    const preto = 0x222222;

    // Corpo principal (cubo amarelo)
    const corpoGeo = new THREE.BoxGeometry(0.75, 0.95, 0.4);
    const corpoMat = charMaterial(amarelo, 0.35, 0.0, 0.08);
    const corpo = new THREE.Mesh(corpoGeo, corpoMat);
    corpo.position.y = 0.48;
    corpo.castShadow = true;
    corpo.receiveShadow = true;
    grupo.add(corpo);

    // Buracos de esponja (pequenos discos na frente)
    const buracoGeo = new THREE.CircleGeometry(0.035, 8);
    const buracoMat = charMaterial(amareloEscuro, 0.6, 0, 0.03);
    const posicoesBuracos = [
        [-0.2, 0.62, 0.205],
        [-0.05, 0.68, 0.205],
        [0.15, 0.6, 0.205],
        [0.22, 0.48, 0.205],
        [-0.25, 0.52, 0.205],
        [-0.1, 0.38, 0.205],
        [0.1, 0.34, 0.205],
        [0.2, 0.7, 0.205],
        [-0.18, 0.75, 0.205],
        [0.05, 0.8, 0.205],
        [-0.28, 0.42, 0.205],
        [0.25, 0.38, 0.205],
    ];
    posicoesBuracos.forEach((pos) => {
        const buraco = new THREE.Mesh(buracoGeo, buracoMat);
        buraco.position.set(pos[0], pos[1], pos[2]);
        buraco.rotation.y = 0;
        grupo.add(buraco);
    });

    // Buracos nas laterais
    const buracosLateral = [
        [0.379, 0.6, 0],
        [0.379, 0.45, 0.1],
        [0.379, 0.7, -0.1],
        [-0.379, 0.55, 0.05],
        [-0.379, 0.65, -0.08],
        [-0.379, 0.4, 0.12],
    ];
    buracosLateral.forEach((pos) => {
        const buraco = new THREE.Mesh(buracoGeo, buracoMat);
        buraco.position.set(pos[0], pos[1], pos[2]);
        buraco.rotation.y = Math.PI / 2;
        grupo.add(buraco);
    });

    // Olhos (esferas brancas grandes com pupilas azuis)
    const olhoBrancoGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const olhoBrancoMat = charMaterial(branco, 0.15, 0, 0.05);
    const olhoEsq = new THREE.Mesh(olhoBrancoGeo, olhoBrancoMat);
    olhoEsq.position.set(-0.14, 0.72, 0.2);
    olhoEsq.castShadow = true;
    grupo.add(olhoEsq);

    const olhoDir = new THREE.Mesh(olhoBrancoGeo, olhoBrancoMat);
    olhoDir.position.set(0.14, 0.72, 0.2);
    olhoDir.castShadow = true;
    grupo.add(olhoDir);

    // Pupilas
    const pupilaGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const pupilaMat = charMaterial(azulPupila, 0.1, 0, 0.1);
    const pupilaEsq = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaEsq.position.set(-0.14, 0.72, 0.29);
    grupo.add(pupilaEsq);
    const pupilaDir = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaDir.position.set(0.14, 0.72, 0.29);
    grupo.add(pupilaDir);

    // Brilho nos olhos
    const brilhoGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const brilhoMat = charMaterial(0xffffff, 0.0, 0, 0.5);
    const brilhoEsq = new THREE.Mesh(brilhoGeo, brilhoMat);
    brilhoEsq.position.set(-0.12, 0.74, 0.32);
    grupo.add(brilhoEsq);
    const brilhoDir = new THREE.Mesh(brilhoGeo, brilhoMat);
    brilhoDir.position.set(0.16, 0.74, 0.32);
    grupo.add(brilhoDir);

    // Nariz (cilindro amarelo comprido)
    const narizGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.18, 12);
    const narizMat = charMaterial(amarelo, 0.3, 0, 0.06);
    const nariz = new THREE.Mesh(narizGeo, narizMat);
    nariz.position.set(0, 0.56, 0.28);
    nariz.rotation.x = 0.15;
    nariz.castShadow = true;
    grupo.add(nariz);

    // Bochechas (esferas rosadas)
    const bochechaGeo = new THREE.SphereGeometry(0.045, 10, 10);
    const bochechaMat = charMaterial(0xff9999, 0.4, 0, 0.1);
    const bochechaEsq = new THREE.Mesh(bochechaGeo, bochechaMat);
    bochechaEsq.position.set(-0.22, 0.55, 0.22);
    grupo.add(bochechaEsq);
    const bochechaDir = new THREE.Mesh(bochechaGeo, bochechaMat);
    bochechaDir.position.set(0.22, 0.55, 0.22);
    grupo.add(bochechaDir);

    // Boca (sorriso com torus parcial)
    const bocaGeo = new THREE.TorusGeometry(0.14, 0.025, 8, 16, Math.PI);
    const bocaMat = charMaterial(0x8b4513, 0.3, 0, 0.03);
    const boca = new THREE.Mesh(bocaGeo, bocaMat);
    boca.position.set(0, 0.47, 0.22);
    boca.rotation.z = Math.PI;
    boca.castShadow = true;
    grupo.add(boca);

    // Dentes (dois pequenos cubos brancos)
    const denteGeo = new THREE.BoxGeometry(0.05, 0.06, 0.03);
    const denteMat = charMaterial(0xffffff, 0.1, 0, 0.1);
    const denteEsq = new THREE.Mesh(denteGeo, denteMat);
    denteEsq.position.set(-0.05, 0.5, 0.22);
    grupo.add(denteEsq);
    const denteDir = new THREE.Mesh(denteGeo, denteMat);
    denteDir.position.set(0.05, 0.5, 0.22);
    grupo.add(denteDir);

    // Gravata (cone vermelho)
    const gravataGeo = new THREE.ConeGeometry(0.06, 0.14, 8);
    const gravataMat = charMaterial(vermelhoGravata, 0.25, 0, 0.1);
    const gravata = new THREE.Mesh(gravataGeo, gravataMat);
    gravata.position.set(0, 0.28, 0.21);
    gravata.rotation.x = Math.PI;
    gravata.castShadow = true;
    grupo.add(gravata);

    // Cinto (faixa marrom)
    const cintoGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.08, 16);
    const cintoMat = charMaterial(marrom, 0.5, 0, 0.03);
    const cinto = new THREE.Mesh(cintoGeo, cintoMat);
    cinto.position.y = 0.06;
    cinto.castShadow = true;
    grupo.add(cinto);

    // Fivela do cinto
    const fivelaGeo = new THREE.BoxGeometry(0.06, 0.06, 0.04);
    const fivelaMat = charMaterial(0xffd700, 0.2, 0.5, 0.2);
    const fivela = new THREE.Mesh(fivelaGeo, fivelaMat);
    fivela.position.set(0, 0.06, 0.39);
    grupo.add(fivela);

    // Calça (parte inferior marrom)
    const calcaGeo = new THREE.BoxGeometry(0.74, 0.12, 0.39);
    const calcaMat = charMaterial(marrom, 0.5, 0, 0.03);
    const calca = new THREE.Mesh(calcaGeo, calcaMat);
    calca.position.y = 0.015;
    calca.castShadow = true;
    calca.receiveShadow = true;
    grupo.add(calca);

    // Pernas (cilindros amarelos)
    const pernaGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.16, 10);
    const pernaMat = charMaterial(amarelo, 0.35, 0, 0.05);
    const pernaEsq = new THREE.Mesh(pernaGeo, pernaMat);
    pernaEsq.position.set(-0.16, -0.09, 0.02);
    pernaEsq.castShadow = true;
    grupo.add(pernaEsq);
    const pernaDir = new THREE.Mesh(pernaGeo, pernaMat);
    pernaDir.position.set(0.16, -0.09, 0.02);
    pernaDir.castShadow = true;
    grupo.add(pernaDir);

    // Sapatos (esferas pretas alongadas)
    const sapatoGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const sapatoMat = charMaterial(preto, 0.3, 0, 0.02);
    const sapatoEsq = new THREE.Mesh(sapatoGeo, sapatoMat);
    sapatoEsq.position.set(-0.16, -0.17, 0.06);
    sapatoEsq.scale.set(1, 0.6, 1.5);
    sapatoEsq.castShadow = true;
    grupo.add(sapatoEsq);
    const sapatoDir = new THREE.Mesh(sapatoGeo, sapatoMat);
    sapatoDir.position.set(0.16, -0.17, 0.06);
    sapatoDir.scale.set(1, 0.6, 1.5);
    sapatoDir.castShadow = true;
    grupo.add(sapatoDir);

    // Braços (cilindros amarelos finos)
    const bracoGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.25, 8);
    const bracoMat = charMaterial(amarelo, 0.35, 0, 0.05);
    const bracoEsq = new THREE.Mesh(bracoGeo, bracoMat);
    bracoEsq.position.set(-0.42, 0.38, 0);
    bracoEsq.rotation.z = 0.3;
    bracoEsq.castShadow = true;
    grupo.add(bracoEsq);
    const bracoDir = new THREE.Mesh(bracoGeo, bracoMat);
    bracoDir.position.set(0.42, 0.38, 0);
    bracoDir.rotation.z = -0.3;
    bracoDir.castShadow = true;
    grupo.add(bracoDir);

    // Base do peão (disco temático amarelo/dourado + anel na cor do jogador)
    const base = charBaseRing(0xffd700, colorHex, 0.38, 0.1);
    base.position.y = -0.22;
    grupo.add(base);

    grupo.position.y = 0.22;
    const outer = new THREE.Group();
    outer.add(grupo);
    return outer;
}

// ==================== PATRICK ESTRELA ====================
function buildPatrickPawn(colorHex) {
    const grupo = new THREE.Group();
    const rosa = 0xff91a4;
    const rosaEscuro = 0xe87a90;
    const verdeShorts = 0x6b8e23;
    const branco = 0xffffff;
    const preto = 0x222222;

    // Corpo em forma de estrela (5 pontas)
    function criarShapeEstrela(raioExt, raioInt, numPontas) {
        const shape = new THREE.Shape();
        const totalPontos = numPontas * 2;
        for (let i = 0; i < totalPontos; i++) {
            const raio = i % 2 === 0 ? raioExt : raioInt;
            const angulo = (i / totalPontos) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angulo) * raio;
            const y = Math.sin(angulo) * raio;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }

    const shapeEstrela = criarShapeEstrela(0.44, 0.2, 5);
    const extrusaoConfig = {
        depth: 0.32,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.04,
        bevelSegments: 3,
    };
    const corpoGeo = new THREE.ExtrudeGeometry(shapeEstrela, extrusaoConfig);
    const corpoMat = charMaterial(rosa, 0.35, 0, 0.08);
    const corpo = new THREE.Mesh(corpoGeo, corpoMat);
    corpo.position.y = 0.28;
    corpo.castShadow = true;
    corpo.receiveShadow = true;
    grupo.add(corpo);

    // Olhos (característica: próximos um do outro)
    const olhoGeo = new THREE.SphereGeometry(0.1, 14, 14);
    const olhoMat = charMaterial(branco, 0.15, 0, 0.06);
    const olhoEsq = new THREE.Mesh(olhoGeo, olhoMat);
    olhoEsq.position.set(-0.07, 0.5, 0.22);
    olhoEsq.castShadow = true;
    grupo.add(olhoEsq);
    const olhoDir = new THREE.Mesh(olhoGeo, olhoMat);
    olhoDir.position.set(0.07, 0.5, 0.22);
    olhoDir.castShadow = true;
    grupo.add(olhoDir);

    // Pupilas (pretas)
    const pupilaGeo = new THREE.SphereGeometry(0.05, 10, 10);
    const pupilaMat = charMaterial(preto, 0.1, 0, 0.03);
    const pupilaEsq = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaEsq.position.set(-0.07, 0.5, 0.3);
    grupo.add(pupilaEsq);
    const pupilaDir = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaDir.position.set(0.07, 0.5, 0.3);
    grupo.add(pupilaDir);

    // Brilho nos olhos
    const brilhoGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const brilhoMat = charMaterial(0xffffff, 0, 0, 0.6);
    const brilhoEsq = new THREE.Mesh(brilhoGeo, brilhoMat);
    brilhoEsq.position.set(-0.05, 0.52, 0.34);
    grupo.add(brilhoEsq);
    const brilhoDir = new THREE.Mesh(brilhoGeo, brilhoMat);
    brilhoDir.position.set(0.09, 0.52, 0.34);
    grupo.add(brilhoDir);

    // Boca (shape largo e arredondado)
    const bocaShape = new THREE.Shape();
    bocaShape.moveTo(-0.14, 0);
    bocaShape.quadraticCurveTo(-0.1, -0.08, -0.05, -0.06);
    bocaShape.quadraticCurveTo(0, -0.1, 0.05, -0.06);
    bocaShape.quadraticCurveTo(0.1, -0.08, 0.14, 0);
    bocaShape.quadraticCurveTo(0.08, -0.02, 0, -0.03);
    bocaShape.quadraticCurveTo(-0.08, -0.02, -0.14, 0);
    const bocaGeo = new THREE.ShapeGeometry(bocaShape);
    const bocaMat = charMaterial(0x8b3a3a, 0.3, 0, 0.05);
    const boca = new THREE.Mesh(bocaGeo, bocaMat);
    boca.position.set(0, 0.36, 0.25);
    boca.rotation.x = -0.1;
    grupo.add(boca);

    // Shorts (cilindro verde na parte inferior)
    const shortsGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.22, 16);
    const shortsMat = charMaterial(verdeShorts, 0.5, 0, 0.04);
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 0.08;
    shorts.castShadow = true;
    grupo.add(shorts);

    // Pernas (cilindros rosa)
    const pernaGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.14, 8);
    const pernaMat = charMaterial(rosa, 0.35, 0, 0.05);
    const pernaEsq = new THREE.Mesh(pernaGeo, pernaMat);
    pernaEsq.position.set(-0.14, -0.08, 0);
    pernaEsq.castShadow = true;
    grupo.add(pernaEsq);
    const pernaDir = new THREE.Mesh(pernaGeo, pernaMat);
    pernaDir.position.set(0.14, -0.08, 0);
    pernaDir.castShadow = true;
    grupo.add(pernaDir);

    // Pés (esferas rosa achatadas)
    const peGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const peMat = charMaterial(rosaEscuro, 0.35, 0, 0.04);
    const peEsq = new THREE.Mesh(peGeo, peMat);
    peEsq.position.set(-0.14, -0.16, 0.04);
    peEsq.scale.set(1, 0.5, 1.4);
    grupo.add(peEsq);
    const peDir = new THREE.Mesh(peGeo, peMat);
    peDir.position.set(0.14, -0.16, 0.04);
    peDir.scale.set(1, 0.5, 1.4);
    grupo.add(peDir);

    // Base do peão (disco temático rosa + anel na cor do jogador)
    const base = charBaseRing(0xff91a4, colorHex, 0.38, 0.1);
    base.position.y = -0.22;
    grupo.add(base);

    grupo.position.y = 0.22;
    const outer = new THREE.Group();
    outer.add(grupo);
    return outer;
}

// ==================== LULA MOLUSCO ====================
function buildLulaMoluscoPawn(colorHex) {
    const grupo = new THREE.Group();
    const azul = 0x6b9bd1;
    const azulClaro = 0x8ab8e0;
    const marromCamisa = 0xa0522d;
    const branco = 0xffffff;
    const preto = 0x222222;

    // Cabeça (esfera alongada)
    const cabecaGeo = new THREE.SphereGeometry(0.28, 20, 20);
    const cabecaMat = charMaterial(azul, 0.3, 0, 0.06);
    const cabeca = new THREE.Mesh(cabecaGeo, cabecaMat);
    cabeca.position.y = 0.52;
    cabeca.scale.set(0.85, 1.15, 0.75);
    cabeca.castShadow = true;
    cabeca.receiveShadow = true;
    grupo.add(cabeca);

    // Topo da cabeça (domo adicional)
    const topoGeo = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const topoMat = charMaterial(azulClaro, 0.3, 0, 0.05);
    const topo = new THREE.Mesh(topoGeo, topoMat);
    topo.position.y = 0.7;
    topo.scale.set(0.8, 0.8, 0.7);
    topo.castShadow = true;
    grupo.add(topo);

    // Olhos (grandes, meio caídos)
    const olhoGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const olhoMat = charMaterial(branco, 0.15, 0, 0.06);
    const olhoEsq = new THREE.Mesh(olhoGeo, olhoMat);
    olhoEsq.position.set(-0.1, 0.58, 0.2);
    olhoEsq.scale.set(0.9, 1.1, 0.7);
    olhoEsq.castShadow = true;
    grupo.add(olhoEsq);
    const olhoDir = new THREE.Mesh(olhoGeo, olhoMat);
    olhoDir.position.set(0.1, 0.58, 0.2);
    olhoDir.scale.set(0.9, 1.1, 0.7);
    olhoDir.castShadow = true;
    grupo.add(olhoDir);

    // Pálpebras (meias-esferas sobre os olhos)
    const palpebraGeo = new THREE.SphereGeometry(0.095, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const palpebraMat = charMaterial(azul, 0.3, 0, 0.04);
    const palpebraEsq = new THREE.Mesh(palpebraGeo, palpebraMat);
    palpebraEsq.position.set(-0.1, 0.62, 0.2);
    palpebraEsq.scale.set(0.92, 0.7, 0.72);
    grupo.add(palpebraEsq);
    const palpebraDir = new THREE.Mesh(palpebraGeo, palpebraMat);
    palpebraDir.position.set(0.1, 0.62, 0.2);
    palpebraDir.scale.set(0.92, 0.7, 0.72);
    grupo.add(palpebraDir);

    // Pupilas
    const pupilaGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilaMat = charMaterial(preto, 0.1, 0, 0.03);
    const pupilaEsq = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaEsq.position.set(-0.1, 0.57, 0.28);
    grupo.add(pupilaEsq);
    const pupilaDir = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaDir.position.set(0.1, 0.57, 0.28);
    grupo.add(pupilaDir);

    // Nariz (comprido e caído)
    const narizGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.22, 10);
    const narizMat = charMaterial(azulClaro, 0.3, 0, 0.05);
    const nariz = new THREE.Mesh(narizGeo, narizMat);
    nariz.position.set(0, 0.46, 0.25);
    nariz.rotation.x = 0.4;
    nariz.castShadow = true;
    grupo.add(nariz);

    // Boca (pequena, expressão entediada)
    const bocaShape = new THREE.Shape();
    bocaShape.moveTo(-0.06, 0);
    bocaShape.quadraticCurveTo(-0.04, -0.04, 0, -0.05);
    bocaShape.quadraticCurveTo(0.04, -0.04, 0.06, 0);
    bocaShape.quadraticCurveTo(0.03, -0.01, 0, -0.02);
    bocaShape.quadraticCurveTo(-0.03, -0.01, -0.06, 0);
    const bocaGeo = new THREE.ShapeGeometry(bocaShape);
    const bocaMat = charMaterial(0x5a3a3a, 0.3, 0, 0.04);
    const boca = new THREE.Mesh(bocaGeo, bocaMat);
    boca.position.set(0, 0.36, 0.27);
    grupo.add(boca);

    // Camisa (cilindro marrom no corpo)
    const camisaGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.3, 14);
    const camisaMat = charMaterial(marromCamisa, 0.5, 0, 0.04);
    const camisa = new THREE.Mesh(camisaGeo, camisaMat);
    camisa.position.y = 0.12;
    camisa.castShadow = true;
    grupo.add(camisa);

    // Tentáculos (6 cilindros azuis saindo da camisa)
    const tentaculoGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.28, 8);
    const tentaculoMat = charMaterial(azul, 0.35, 0, 0.05);
    const angulosTentaculos = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
    angulosTentaculos.forEach((angulo) => {
        const tentaculo = new THREE.Mesh(tentaculoGeo, tentaculoMat);
        const raio = 0.28;
        tentaculo.position.set(Math.cos(angulo) * raio, -0.04, Math.sin(angulo) * raio);
        tentaculo.rotation.z = Math.cos(angulo) * 0.35;
        tentaculo.rotation.x = Math.sin(angulo) * 0.35;
        tentaculo.castShadow = true;
        grupo.add(tentaculo);

        // Pé do tentáculo (pequena esfera)
        const peTentGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const peTentMat = charMaterial(azulClaro, 0.35, 0, 0.04);
        const peTent = new THREE.Mesh(peTentGeo, peTentMat);
        peTent.position.set(Math.cos(angulo) * (raio + 0.03), -0.18, Math.sin(angulo) * (raio + 0.03));
        peTent.scale.set(1, 0.6, 1.3);
        grupo.add(peTent);
    });

    // Base do peão (disco temático azul + anel na cor do jogador)
    const base = charBaseRing(0x6b9bd1, colorHex, 0.38, 0.1);
    base.position.y = -0.22;
    grupo.add(base);

    grupo.position.y = 0.22;
    const outer = new THREE.Group();
    outer.add(grupo);
    return outer;
}

// ==================== SR. SIRIGUEJO ====================
function buildSrSiriguejoPawn(colorHex) {
    const grupo = new THREE.Group();
    const vermelho = 0xe74c3c;
    const vermelhoEscuro = 0xc0392b;
    const branco = 0xffffff;
    const preto = 0x222222;
    const amarelo = 0xf4d03f;
    const marromCinto = 0x4a3728;

    // Corpo (esfera achatada vermelha)
    const corpoGeo = new THREE.SphereGeometry(0.3, 18, 18);
    const corpoMat = charMaterial(vermelho, 0.3, 0, 0.08);
    const corpo = new THREE.Mesh(corpoGeo, corpoMat);
    corpo.position.y = 0.35;
    corpo.scale.set(1.15, 0.7, 0.85);
    corpo.castShadow = true;
    corpo.receiveShadow = true;
    grupo.add(corpo);

    // Olhos em hastes (característica do Sr. Siriguejo)
    const hasteGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.18, 8);
    const hasteMat = charMaterial(vermelhoEscuro, 0.3, 0, 0.04);
    const hasteEsq = new THREE.Mesh(hasteGeo, hasteMat);
    hasteEsq.position.set(-0.12, 0.5, 0.1);
    hasteEsq.castShadow = true;
    grupo.add(hasteEsq);
    const hasteDir = new THREE.Mesh(hasteGeo, hasteMat);
    hasteDir.position.set(0.12, 0.5, 0.1);
    hasteDir.castShadow = true;
    grupo.add(hasteDir);

    // Olhos (esferas brancas no topo das hastes)
    const olhoGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const olhoMat = charMaterial(branco, 0.15, 0, 0.06);
    const olhoEsq = new THREE.Mesh(olhoGeo, olhoMat);
    olhoEsq.position.set(-0.12, 0.6, 0.1);
    olhoEsq.castShadow = true;
    grupo.add(olhoEsq);
    const olhoDir = new THREE.Mesh(olhoGeo, olhoMat);
    olhoDir.position.set(0.12, 0.6, 0.1);
    olhoDir.castShadow = true;
    grupo.add(olhoDir);

    // Pupilas (pequenas e pretas)
    const pupilaGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const pupilaMat = charMaterial(preto, 0.1, 0, 0.03);
    const pupilaEsq = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaEsq.position.set(-0.12, 0.6, 0.16);
    grupo.add(pupilaEsq);
    const pupilaDir = new THREE.Mesh(pupilaGeo, pupilaMat);
    pupilaDir.position.set(0.12, 0.6, 0.16);
    grupo.add(pupilaDir);

    // Nariz (pequeno triângulo)
    const narizGeo = new THREE.ConeGeometry(0.035, 0.06, 6);
    const narizMat = charMaterial(vermelhoEscuro, 0.3, 0, 0.04);
    const nariz = new THREE.Mesh(narizGeo, narizMat);
    nariz.position.set(0, 0.42, 0.27);
    nariz.rotation.x = Math.PI;
    grupo.add(nariz);

    // Boca larga
    const bocaShape = new THREE.Shape();
    bocaShape.moveTo(-0.16, 0);
    bocaShape.quadraticCurveTo(-0.1, -0.07, 0, -0.07);
    bocaShape.quadraticCurveTo(0.1, -0.07, 0.16, 0);
    bocaShape.quadraticCurveTo(0.08, -0.03, 0, -0.04);
    bocaShape.quadraticCurveTo(-0.08, -0.03, -0.16, 0);
    const bocaGeo = new THREE.ShapeGeometry(bocaShape);
    const bocaMat = charMaterial(0x5a2020, 0.3, 0, 0.04);
    const boca = new THREE.Mesh(bocaGeo, bocaMat);
    boca.position.set(0, 0.34, 0.28);
    boca.rotation.x = -0.15;
    grupo.add(boca);

    // Dentes (pequenos cubos)
    const denteGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    const denteMat = charMaterial(0xffffff, 0.1, 0, 0.1);
    const denteEsq = new THREE.Mesh(denteGeo, denteMat);
    denteEsq.position.set(-0.04, 0.36, 0.27);
    grupo.add(denteEsq);
    const denteDir = new THREE.Mesh(denteGeo, denteMat);
    denteDir.position.set(0.04, 0.36, 0.27);
    grupo.add(denteDir);

    // Garras grandes (esferas vermelhas)
    const garraGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const garraMat = charMaterial(vermelho, 0.25, 0, 0.07);
    const garraEsq = new THREE.Mesh(garraGeo, garraMat);
    garraEsq.position.set(-0.35, 0.22, 0.05);
    garraEsq.scale.set(1.3, 0.9, 1.1);
    garraEsq.castShadow = true;
    grupo.add(garraEsq);
    const garraDir = new THREE.Mesh(garraGeo, garraMat);
    garraDir.position.set(0.35, 0.22, 0.05);
    garraDir.scale.set(1.3, 0.9, 1.1);
    garraDir.castShadow = true;
    grupo.add(garraDir);

    // Braços (cilindros finos)
    const bracoGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8);
    const bracoMat = charMaterial(vermelhoEscuro, 0.3, 0, 0.04);
    const bracoEsq = new THREE.Mesh(bracoGeo, bracoMat);
    bracoEsq.position.set(-0.26, 0.28, 0.02);
    bracoEsq.rotation.z = 0.7;
    bracoEsq.castShadow = true;
    grupo.add(bracoEsq);
    const bracoDir = new THREE.Mesh(bracoGeo, bracoMat);
    bracoDir.position.set(0.26, 0.28, 0.02);
    bracoDir.rotation.z = -0.7;
    bracoDir.castShadow = true;
    grupo.add(bracoDir);

    // Cinto (faixa marrom escura)
    const cintoGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.08, 14);
    const cintoMat = charMaterial(marromCinto, 0.5, 0, 0.03);
    const cinto = new THREE.Mesh(cintoGeo, cintoMat);
    cinto.position.y = 0.14;
    cinto.castShadow = true;
    grupo.add(cinto);

    // Fivela do cinto
    const fivelaGeo = new THREE.BoxGeometry(0.08, 0.07, 0.04);
    const fivelaMat = charMaterial(amarelo, 0.2, 0.5, 0.25);
    const fivela = new THREE.Mesh(fivelaGeo, fivelaMat);
    fivela.position.set(0, 0.14, 0.33);
    grupo.add(fivela);

    // Pernas (finas e compridas)
    const pernaGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.2, 8);
    const pernaMat = charMaterial(vermelhoEscuro, 0.3, 0, 0.04);
    const pernaEsq = new THREE.Mesh(pernaGeo, pernaMat);
    pernaEsq.position.set(-0.14, -0.02, 0);
    pernaEsq.castShadow = true;
    grupo.add(pernaEsq);
    const pernaDir = new THREE.Mesh(pernaGeo, pernaMat);
    pernaDir.position.set(0.14, -0.02, 0);
    pernaDir.castShadow = true;
    grupo.add(pernaDir);

    // Pés (pequenos)
    const peGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const peMat = charMaterial(vermelhoEscuro, 0.3, 0, 0.03);
    const peEsq = new THREE.Mesh(peGeo, peMat);
    peEsq.position.set(-0.14, -0.12, 0.03);
    peEsq.scale.set(1, 0.5, 1.3);
    grupo.add(peEsq);
    const peDir = new THREE.Mesh(peGeo, peMat);
    peDir.position.set(0.14, -0.12, 0.03);
    peDir.scale.set(1, 0.5, 1.3);
    grupo.add(peDir);

    // Base do peão (disco temático vermelho + anel na cor do jogador)
    const base = charBaseRing(0xe74c3c, colorHex, 0.38, 0.1);
    base.position.y = -0.22;
    grupo.add(base);

    grupo.position.y = 0.22;
    const outer = new THREE.Group();
    outer.add(grupo);
    return outer;
}
