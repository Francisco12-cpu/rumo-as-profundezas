// ============================================================
// TABULEIRO: CASAS
// ============================================================
// Visual de cada casa: plataforma de pedra com o centro colorido, número
// (com o ícone do tipo nas casas especiais), brilho pulsando nas especiais e
// o objeto do kit que explica a regra. As REGRAS de cada tipo moram em
// js/data/tileTypes.js, js/cartas/questions.js (getTileQuestionOutcome) e
// js/nucleo/state.js (handleLanding).

// Casas de pergunta comum são a maioria do caminho: ficam em dois tons calmos
// de "vidro do mar", alternados — assim as casas especiais (cor forte, brilho,
// ícone e objeto) saltam aos olhos em vez de competir com um arco-íris.
const NORMAL_TILE_TONES = [0x86d7d0, 0xa9dcc4];
const TILE_TOP_RADIUS = 0.6;
const TILE_RIM_STONES = 16;
// Altura do topo do disco da casa (objetos chatos do kit ficam em cima dele).
const TILE_TOP_Y = 0.075;

let tileGlows = [];
let tileLabels = [];

function createTiles() {
    // Libera também as texturas geradas por partida (número de cada casa) —
    // antes ficavam presas na memória da GPU.
    tilesGroup.children.forEach((child) => {
        if (child.isSprite && child.material.map) child.material.map.dispose();
    });
    disposeGroupChildren(tilesGroup);
    tileMeshes = [];
    tileGlows = [];
    tileLabels = [];

    // Tipo de cada casa vem do mapa da partida (sorteado uma vez, igual em
    // todos os aparelhos — ver tabuleiro/layout.js).
    const layout = getBoardLayout();
    const topGeo = new THREE.CylinderGeometry(TILE_TOP_RADIUS, TILE_TOP_RADIUS + 0.06, 0.1, 32);
    const topTexture = getTileTopTexture();
    const hitGeo = new THREE.CylinderGeometry(1.0, 1.05, 0.05, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    // Bordinha de pedras de todas as casas numa InstancedMesh só (1 chamada de desenho).
    const rimGeo = new THREE.IcosahedronGeometry(0.075, 1);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
    const rim = new THREE.InstancedMesh(rimGeo, rimMat, boardLength * TILE_RIM_STONES);
    const dummy = new THREE.Object3D();
    const stoneColor = new THREE.Color();
    let rimIndex = 0;

    for (let i = 0; i < boardLength; i++) {
        const pos = getTilePosition(i);
        const isStart = i === 0;
        const isFinish = i === boardLength - 1;
        const typeId = layout ? layout.tiles[i] : isStart ? 'start' : isFinish ? 'finish' : 'normal';
        const isSpecial = typeId !== 'normal';
        let tileType = getTileType(typeId);
        if (!isSpecial)
            tileType = Object.assign({}, tileType, { color: NORMAL_TILE_TONES[i % NORMAL_TILE_TONES.length] });

        // Centro da casa: um disco baixo (a casa é uma plataforma rente à
        // areia, não um pedestal), com textura de pedra polida tingida da cor
        // do tipo. Material próprio por casa: o toque faz só ESTA brilhar.
        const topMat = new THREE.MeshStandardMaterial({
            map: topTexture,
            color: tileType.color,
            roughness: 0.55,
            metalness: 0.05,
            emissive: tileType.color,
            emissiveIntensity: isSpecial ? 0.22 : 0.04,
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.copy(pos);
        top.position.y += 0.02;
        top.receiveShadow = true;
        top.userData = { index: i, effect: tileType, isSpecial };
        tilesGroup.add(top);

        // Alvo de clique/toque BEM maior que o disco visual (invisível) —
        // resolve casas difíceis de acertar (sobretudo no celular).
        // tileMeshes[i] é ESTE alvo, alinhado 1:1 com o índice da casa
        // (state.js/handleLanding lê tileMeshes[tileIndex]).
        const hitTarget = new THREE.Mesh(hitGeo, hitMat);
        hitTarget.position.copy(top.position);
        hitTarget.userData = { index: i, effect: tileType, isSpecial, visualMesh: top };
        tilesGroup.add(hitTarget);
        tileMeshes.push(hitTarget);

        // Pedrinhas em volta: tom de areia/pedra; nas especiais, puxado pra
        // cor do tipo.
        for (let k = 0; k < TILE_RIM_STONES; k++) {
            const a = (k / TILE_RIM_STONES) * Math.PI * 2 + i * 0.7;
            const r = TILE_TOP_RADIUS + 0.05;
            const s = 0.8 + ((k * 37 + i * 11) % 10) / 25;
            dummy.position.set(pos.x + Math.cos(a) * r, pos.y + 0.02, pos.z + Math.sin(a) * r);
            dummy.rotation.set(k, i + k * 2, k * 0.5);
            dummy.scale.set(s * 1.2, s * 0.55, s);
            dummy.updateMatrix();
            rim.setMatrixAt(rimIndex, dummy.matrix);
            stoneColor
                .set(isSpecial ? tileType.color : 0xcbb898)
                .lerp(new THREE.Color(0x8d8270), isSpecial ? 0.35 : 0.2 + (k % 3) * 0.12)
                .convertSRGBToLinear(); // cor por instância não passa por linearizeModelColors
            rim.setColorAt(rimIndex, stoneColor);
            rimIndex++;
        }

        // Número (sprite: sempre de frente pra câmera) + ícone do tipo nas especiais.
        const labelMat = new THREE.SpriteMaterial({
            map: createTileLabel(i + 1, tileType, isSpecial),
            transparent: true,
            depthWrite: false,
            fog: false, // de longe (visão geral) a névoa apagava os números
        });
        const label = new THREE.Sprite(labelMat);
        label.renderOrder = 5; // depois das cáusticas e da correnteza (aditivas), que senão riscam o número
        label.position.copy(pos);
        label.position.y += isSpecial ? 0.95 : 0.72;
        label.scale.setScalar(isSpecial ? 0.95 : 0.74);
        tilesGroup.add(label);
        tileLabels.push(label);

        // Brilho pulsando em volta das casas especiais: identifica o tipo de
        // longe sem precisar ler nada.
        if (isSpecial) {
            const glow = new THREE.Mesh(
                getTileGlowGeometry(),
                new THREE.MeshBasicMaterial({
                    map: getTileGlowTexture(),
                    color: tileType.color,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            glow.rotation.x = -Math.PI / 2;
            glow.position.copy(pos);
            glow.position.y += 0.035;
            glow.renderOrder = 3;
            tilesGroup.add(glow);
            tileGlows.push({ mesh: glow, phase: i * 0.7 });
        }
    }
    rim.instanceMatrix.needsUpdate = true;
    rim.instanceColor.needsUpdate = true;
    rim.receiveShadow = true;
    tilesGroup.add(rim);
    // Só o que nunca muda de lugar/escala: alvos de toque e pedrinhas. (Os
    // discos pulsam ao tocar; brilhos e números animam.)
    tilesGroup.children.forEach((c) => {
        if (c === rim || (c.isMesh && c.material && c.material.visible === false)) freezeStatic(c);
    });
    linearizeModelColors(tilesGroup);
    // Objetos do kit que explicam as casas especiais (ver abaixo).
    createTileProps();
}

// Textura do centro das casas: pedra clara polida com um degradê radial e
// pintinhas — branca, porque a cor vem do material (tingida por tipo).
let tileTopTexture = null;

function getTileTopTexture() {
    if (tileTopTexture) return tileTopTexture;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.75, '#e9e9e9');
    grad.addColorStop(1, '#b8b8b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '90,90,90'},${0.05 + Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, 0.6 + Math.random() * 1.6, 0, Math.PI * 2);
        ctx.fill();
    }
    tileTopTexture = new THREE.CanvasTexture(canvas);
    tileTopTexture.encoding = THREE.sRGBEncoding;
    return tileTopTexture;
}

let tileGlowTexture = null;
let tileGlowGeometry = null;

function getTileGlowGeometry() {
    if (!tileGlowGeometry) tileGlowGeometry = new THREE.PlaneGeometry(2.3, 2.3);
    return tileGlowGeometry;
}

function getTileGlowTexture() {
    if (tileGlowTexture) return tileGlowTexture;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(0.62, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tileGlowTexture = new THREE.CanvasTexture(canvas);
    return tileGlowTexture;
}

// Chamada todo frame por animate() (main.js). Também apaga de leve o número
// da casa onde tem personagem (senão o número fica atrás da cabeça dele).
function updateTileGlows(elapsed) {
    if (gameState) {
        for (let i = 0; i < tileLabels.length; i++) {
            const occupied = gameState.players.some((p) => p.position === i);
            const m = tileLabels[i].material;
            m.opacity += ((occupied ? 0.18 : 1) - m.opacity) * 0.15;
        }
    }
    for (let i = 0; i < tileGlows.length; i++) {
        const g = tileGlows[i];
        const k = 0.5 + 0.5 * Math.sin(elapsed * 2.2 + g.phase);
        g.mesh.material.opacity = 0.45 + 0.45 * k;
        g.mesh.scale.setScalar(0.95 + 0.08 * k);
    }
}

function createTileLabel(number, tileType, withIcon) {
    // Fundo ESCURO + número branco com contorno: alto contraste com qualquer
    // cor de casa e sem estourar no bloom. Nas especiais, o aro grosso tem a
    // cor do tipo e o ícone vem embaixo do número.
    const size = 256;
    const c = size / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const colorCss = '#' + tileType.color.toString(16).padStart(6, '0');

    ctx.beginPath();
    ctx.arc(c, c, 110, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 30, 52, 0.93)';
    ctx.fill();
    ctx.lineWidth = withIcon ? 20 : 12;
    ctx.strokeStyle = withIcon ? colorCss : 'rgba(255,255,255,0.55)';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const numberY = withIcon ? c - 26 : c + 4;
    ctx.font = 'bold ' + (withIcon ? 84 : number >= 10 ? 104 : 120) + 'px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.strokeText(String(number), c, numberY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(number), c, numberY);
    if (withIcon && tileType.icon) drawIcon(ctx, tileType.icon, c, c + 52, 76, colorCss, 2.6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding; // mesma codificação do renderer, senão as cores saem lavadas
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

// ============ LARGADA: PORTAL DE CORAL ============
// Arco de coral por cima da casa 1 (o caminho passa por dentro), com
// pólipos, anêmonas e corais do kit nos pés — marca o começo de longe.
function createStartPortal() {
    const pos = getTilePosition(0);
    const t = getTileTangent(0);
    const group = new THREE.Group();
    group.position.set(pos.x, pos.y, pos.z);
    // O arco fica no plano perpendicular ao caminho.
    group.rotation.y = Math.atan2(t.x, t.z) + Math.PI / 2;
    const span = 1.35;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
        const a = Math.PI * (i / 24);
        const wob = Math.sin(i * 1.7) * 0.05;
        pts.push(
            new THREE.Vector3(Math.cos(a) * (span + wob), Math.sin(a) * (span * 1.25 + wob), Math.sin(i * 2.3) * 0.06)
        );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 72, 0.17, 10, false);
    const p = tube.attributes.position;
    const colors = new Float32Array(p.count * 3);
    const cBase = new THREE.Color(0xff6f7d);
    const cTip = new THREE.Color(0xffb38a);
    const tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        // Superfície irregular de coral (calombos).
        const k = 1 + 0.12 * Math.sin(x * 11 + y * 7) * Math.cos(z * 13 + y * 5);
        p.setXYZ(i, x * (1 + (k - 1) * 0.15), y * (1 + (k - 1) * 0.1), z * k);
        tmp.copy(cBase).lerp(cTip, Math.min(1, y / (span * 1.25)));
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
    }
    tube.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    tube.computeVertexNormals();
    const arch = new THREE.Mesh(tube, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 }));
    arch.castShadow = true;
    group.add(arch);
    // Pólipos (bolinhas claras) espalhados pelo arco.
    const polyp = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffe3c9, emissive: 0xff9a7a, emissiveIntensity: 0.25 }),
        40
    );
    const d = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
        const u = (i + 0.5) / 40;
        const c = curve.getPointAt(u);
        const a = i * 2.4;
        d.position.set(c.x + Math.cos(a) * 0.16, c.y + Math.sin(a) * 0.16, c.z + Math.sin(a * 1.3) * 0.16);
        d.scale.setScalar(0.7 + (i % 4) * 0.2);
        d.updateMatrix();
        polyp.setMatrixAt(i, d.matrix);
    }
    group.add(polyp);
    linearizeModelColors(group);
    tilePropsGroup.add(group);
    // Pés do arco: corais e anêmonas do kit (assados, balançando na GPU).
    if (hasSeaKit()) {
        const corals = [];
        const anemones = [];
        [-1, 1].forEach((s) => {
            const foot = {
                x: pos.x + Math.cos(group.rotation.y) * span * s,
                z: pos.z - Math.sin(group.rotation.y) * span * s,
            };
            const coral = makeSeaModel('coral', { cor: s < 0 ? 'rosa' : 'laranja' }, 1.1, false);
            coral.objeto.position.set(foot.x, pos.y - 0.05, foot.z);
            corals.push(coral);
            const anem = makeSeaModel('anemona', null, 0.8, false);
            anem.objeto.position.set(foot.x + t.x * 0.6 * s, pos.y - 0.05, foot.z + t.z * 0.6 * s);
            anemones.push(anem);
        });
        bakeStaticSeaModels(corals, tilePropsGroup);
        bakeSwayingSeaModels(anemones, tilePropsGroup);
    }
}

// ============ CHEGADA: BAÚ DO TESOURO ============
let finishChest = null;

// Abre o baú da chegada com brilho e uma fonte de moedas (chamada ao vencer).
function openFinishChest() {
    if (!finishChest || !finishChest.definirAbertura) return;
    const state = { v: 0 };
    gsap.to(state, {
        v: 1,
        duration: 1.4,
        ease: 'back.out(1.6)',
        onUpdate: () => finishChest.definirAbertura(state.v),
    });
    const pos = finishChest.objeto.position.clone();
    pos.y += 0.9;
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            spawnCoinSparkle(pos, 4);
            spawnBubbles(pos, 6);
        }, i * 220);
    }
    playCoinSound();
}

// ============ OBJETOS DO KIT NAS CASAS ============
// Globais dos objetos das casas (limpos a cada partida em createTileProps).
let tilePropsGroup = null;
let tilePropModels = [];

// ============ OBJETOS DAS CASAS ESPECIAIS ============
// Ficam rentes à casa (corrente, redemoinho) ou ao lado dela, do lado oposto
// à câmera (âncora, concha, bandeira), pra nunca tampar o número nem o peão.
function getTileSideOffset(index, distance) {
    const t = getTileTangent(index);
    let nx = -t.z;
    let nz = t.x;
    if (Math.abs(nz) > 0.3) {
        if (nz > 0) {
            nx = -nx;
            nz = -nz;
        }
    } else {
        // Trecho de curva (tangente ~Z): vai pro lado de fora do tabuleiro.
        const p = getTilePosition(index);
        if (Math.sign(nx) !== Math.sign(p.x || 1)) {
            nx = -nx;
            nz = -nz;
        }
    }
    return { x: nx * distance, z: nz * distance };
}

function clearTileProps() {
    stopAnimatingSeaModels(tilePropModels);
    tilePropModels.forEach((m) => {
        m.descartar();
    });
    tilePropModels = [];
    if (tilePropsGroup && tilePropsGroup.parent) tilePropsGroup.parent.remove(tilePropsGroup);
    tilePropsGroup = null;
}

function addTileProp(id, opts, scale, index, options) {
    const model = makeSeaModel(id, opts, scale);
    const pos = getTilePosition(index);
    const side = options.side ? getTileSideOffset(index, options.side) : { x: 0, z: 0 };
    if (options.along) {
        // Ao longo do caminho (+ pra frente, - pra trás): largada e chegada
        // ficam na ponta de uma fileira, então "além da ponta" é espaço livre.
        const t = getTileTangent(index);
        side.x += t.x * options.along;
        side.z += t.z * options.along;
    }
    model.objeto.position.set(pos.x + side.x, pos.y + (options.lift || 0), pos.z + side.z);
    if (options.alongPath) {
        const t = getTileTangent(index);
        model.objeto.rotation.y = Math.atan2(t.x, t.z) + (options.reverse ? Math.PI : 0);
    } else if (options.rotationY !== undefined) {
        model.objeto.rotation.y = options.rotationY;
    }
    if (options.tint) tintSeaModel(model.objeto, options.tint);
    setSeaModelShadows(model.objeto, !!options.shadow);
    tilePropsGroup.add(model.objeto);
    tilePropModels.push(model);
    return model;
}

function createTileProps() {
    if (!hasSeaKit() || !tileMeshes.length) return;
    clearTileProps();
    tilePropsGroup = new THREE.Group();
    boardGroup.add(tilePropsGroup);
    coinModels = {};
    const last = tileMeshes.length - 1;
    tileMeshes.forEach((hit, i) => {
        const type = hit.userData.effect.type;
        if (type === 'avanco') addTileProp('corrente', null, 1.15, i, { alongPath: true, lift: TILE_TOP_Y });
        else if (type === 'voltar_2') {
            addTileProp('corrente', null, 1.15, i, {
                alongPath: true,
                reverse: true,
                lift: TILE_TOP_Y,
                tint: { color: 0xc6283c, emissive: 0xff5252, amount: 0.75 },
            });
        } else if (type === 'trocar_lugar') addTileProp('redemoinho', null, 1.25, i, { lift: TILE_TOP_Y });
        else if (type === 'pular_vez') addTileProp('aguaViva', null, 0.7, i, { side: 1.2, lift: 0.6 });
        else if (type === 'pergunta_bonus') addTileProp('concha', null, 0.95, i, { side: 1.15, rotationY: -0.3 });
        else if (i === last) addTileProp('bandeira', { corJogador: '#ffd740' }, 1.1, i, { side: 1.0, shadow: true });
    });
    // Moedas ainda não pegas (ver tabuleiro/layout.js e collectCoinAt).
    const layout = getBoardLayout();
    if (layout) layout.coins.forEach((i) => addCoinModel(i));
    // Baú do tesouro (fechado; abre na vitória) além da chegada, e o portal
    // de coral + casa-concha na largada: marcam começo e fim de longe.
    finishChest = addTileProp('bau', { fechado: true }, 1.25, last, { along: 2.1, rotationY: -0.4, shadow: true });
    addTileProp('casaConcha', null, 0.85, 0, { along: -2.8, rotationY: 0.3, shadow: true });
    createStartPortal();
    createCardDeck();
}

// ============ MOEDAS NO CAMINHO ============
let coinModels = {};

function addCoinModel(tileIndex) {
    const coin = flattenSeaModel(addTileProp('moeda', null, 0.9, tileIndex, { side: 0.55, lift: 0.75 }));
    coin.objeto.userData.coinBaseY = coin.objeto.position.y;
    coinModels[tileIndex] = coin;
}

// Efeito de pegar moeda(s): a moeda da casa (se houver) sobe girando e some;
// moedas ganhas por resposta aparecem em cima do peão. Puro visual.
function showCoinsAwarded(playerIndex, amount, tileIndex, gotShield) {
    const pawn = pawns[playerIndex];
    const coin = coinModels[tileIndex];
    playCoinSound();
    if (coin) {
        delete coinModels[tileIndex];
        const o = coin.objeto;
        gsap.to(o.position, { y: o.position.y + 1.6, duration: 0.7, ease: 'power2.out' });
        gsap.to(o.rotation, { y: o.rotation.y + Math.PI * 6, duration: 0.7, ease: 'power1.out' });
        gsap.to(o.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 0.35,
            delay: 0.45,
            ease: 'power1.in',
            onComplete: () => {
                stopAnimatingSeaModels([coin]);
                tilePropModels = tilePropModels.filter((m) => m !== coin);
                coin.descartar();
            },
        });
        spawnCoinSparkle(o.position.clone());
    } else if (pawn) {
        const pos = pawn.position.clone();
        pos.y += 1.2;
        spawnCoinSparkle(pos, amount);
    }
    if (gotShield && pawn) {
        setTimeout(() => {
            spawnBubbles(pawn.position.clone(), 26);
            playBubbleSound();
            const player = gameState && gameState.players[playerIndex];
            if (player) showTurnToast(player, 'ganhou uma bolha protetora!');
        }, 500);
    }
}

function showShieldUsed(playerIndex) {
    const pawn = pawns[playerIndex];
    if (!pawn) return;
    spawnBubbles(pawn.position.clone(), 30);
    playBubbleSound();
}

// Chamada todo frame por animate() (main.js): moedas girando e boiando.
function updateCoinModels(elapsed) {
    for (const k in coinModels) {
        const o = coinModels[k].objeto;
        if (o.userData.coinBaseY === undefined) continue;
        o.rotation.y = elapsed * 1.8 + Number(k);
        o.position.y = o.userData.coinBaseY + Math.sin(elapsed * 2 + Number(k)) * 0.08;
    }
}
