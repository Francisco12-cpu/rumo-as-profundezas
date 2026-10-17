// ============================================================
// DADO
// ============================================================
// Visual do dado e a animação de rolagem. Quem SORTEIA o número é
// performRoll (js/interface/ui.js; no P2P só o host) — aqui só se mostra.
//
// A rolagem é um arremesso de verdade, sempre com o mesmo "percurso longo"
// (TIMING.diceSpinMs, ~2 s), não importa o número: o dado cai na areia ao
// lado do personagem da vez, quica três vezes cada vez mais baixo, dá várias
// voltas completas desacelerando e só então assenta na face sorteada. (Antes
// ele girava só até um ângulo fixo: se o número já estava "perto", dava um
// giro curto e duro.) O truque que garante a face certa: a rotação é
// slerp(orientação inicial -> final) vezes N voltas completas em torno de um
// eixo — voltas completas não mudam a orientação final.

const DICE_SIZE = 0.8;
// Momentos (fração da rolagem) em que o dado bate na areia, e a altura de
// cada quique depois deles.
const DICE_IMPACTS = [0.36, 0.62, 0.8, 0.92];
const DICE_BOUNCE_HEIGHTS = [0.75, 0.34, 0.13];
const DICE_DROP_HEIGHT = 2.6;

let diceRoll = null;
let diceFx = null;

function createDice() {
    while (diceGroup.children.length) diceGroup.remove(diceGroup.children[0]);

    // Com o kit, o dado é o modelo arredondado dele (ver createSeaDiceVisual);
    // sem o kit, um cubo com as faces desenhadas. Nos dois casos a rotação é
    // aplicada em diceMesh e a face que fica pra cima segue DICE_FACE_NORMALS.
    const seaDice = createSeaDiceVisual(DICE_SIZE);
    if (seaDice) {
        diceMesh = new THREE.Group();
        diceMesh.add(seaDice);
        setSeaModelShadows(seaDice, true);
    } else {
        diceMesh = new THREE.Mesh(
            new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE),
            createFallbackDiceMaterials()
        );
        diceMesh.castShadow = true;
    }
    diceGroup.add(diceMesh);
    diceFx = createDiceEffects();
    diceGroup.visible = false;
}

// Cubo de reserva: uma textura por NÚMERO, montadas na ordem de
// DICE_MATERIAL_FACE_ORDER (mesma referência de getDiceTargetRotation).
function createFallbackDiceMaterials() {
    return DICE_MATERIAL_FACE_ORDER.map((n) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#001a33';
        getDiceDotPattern(n).forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.arc(24 + dx * 40, 24 + dy * 40, 13, 0, Math.PI * 2);
            ctx.fill();
        });
        return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.3 });
    });
}

// Efeitos de quando o dado para: anel de luz na areia, brilho na face de
// cima e o número grande flutuando em cima do dado.
function createDiceEffects() {
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = ringCanvas.height = 128;
    const rc = ringCanvas.getContext('2d');
    const rg = rc.createRadialGradient(64, 64, 20, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,0)');
    rg.addColorStop(0.7, 'rgba(255,255,255,0.9)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    rc.fillStyle = rg;
    rc.fillRect(0, 0, 128, 128);
    const ring = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(ringCanvas),
            color: new THREE.Color(0xffe680).convertSRGBToLinear(),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 4;
    diceGroup.add(ring);

    const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(DICE_SIZE * 1.6, DICE_SIZE * 1.6),
        new THREE.MeshBasicMaterial({
            map: getSoftDotTexture(),
            color: new THREE.Color(0xfff2a8).convertSRGBToLinear(),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.renderOrder = 4;
    diceGroup.add(glow);

    const numberCanvas = document.createElement('canvas');
    numberCanvas.width = numberCanvas.height = 256;
    const numberTex = new THREE.CanvasTexture(numberCanvas);
    numberTex.encoding = THREE.sRGBEncoding;
    const number = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: numberTex, transparent: true, depthWrite: false, fog: false })
    );
    number.renderOrder = 6;
    number.visible = false;
    diceGroup.add(number);
    return { ring, glow, number, numberCanvas, numberTex };
}

function drawDiceNumber(result) {
    const c = diceFx.numberCanvas;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(110, 100, 10, 128, 128, 112);
    g.addColorStop(0, '#ffe680');
    g.addColorStop(1, '#ffa62b');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.font = 'bold 150px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(80,40,0,0.6)';
    ctx.strokeText(String(result), 128, 136);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(result), 128, 136);
    diceFx.numberTex.needsUpdate = true;
}

// Onde o dado cai: na areia, um pouco à frente (lado da câmera) e ao lado
// do personagem da vez — dá pra ver o dado e o personagem no mesmo quadro.
function getDiceLandingSpot() {
    const idx = gameState ? gameState.currentPlayerIndex : 0;
    const pawn = pawns[idx];
    const base = pawn ? pawn.position : new THREE.Vector3();
    const x = base.x + 1.1;
    const z = base.z + 1.3;
    return new THREE.Vector3(x, getSeabedHeight(x, z) + DICE_SIZE / 2, z);
}

// Orientação final: a face sorteada pra cima, girada à toa em torno do eixo
// vertical (cada rolagem para "de um jeito").
function getDiceTargetQuaternion(result) {
    const n = DICE_FACE_NORMALS[result] ? result : 1;
    const normal = new THREE.Vector3(DICE_FACE_NORMALS[n].x, DICE_FACE_NORMALS[n].y, DICE_FACE_NORMALS[n].z);
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion()
        .setFromUnitVectors(normal, up)
        .premultiply(new THREE.Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2));
}

// Mesma conta em Euler (usada pelos testes de face).
function getDiceTargetRotation(result) {
    const n = DICE_FACE_NORMALS[result] ? result : 1;
    const faceNormal = new THREE.Vector3(DICE_FACE_NORMALS[n].x, DICE_FACE_NORMALS[n].y, DICE_FACE_NORMALS[n].z);
    const quat = new THREE.Quaternion().setFromUnitVectors(faceNormal, new THREE.Vector3(0, 1, 0));
    return new THREE.Euler().setFromQuaternion(quat, 'XYZ');
}

function randomQuaternion() {
    return new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28))
        .normalize();
}

// Faz o dado ser arremessado e parar mostrando "result".
function showDiceRoll(result) {
    if (!diceGroup || !diceMesh) return;
    if (diceRollHideTimeout) clearTimeout(diceRollHideTimeout);
    const end = getDiceLandingSpot();
    const start = end.clone().add(new THREE.Vector3(-1.7, DICE_DROP_HEIGHT, -1.4));
    diceRoll = {
        t0: pawnAnimTime,
        dur: TIMING.diceSpinMs / 1000,
        start,
        end,
        q0: randomQuaternion(),
        q1: getDiceTargetQuaternion(result),
        axis: new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.4, Math.random() - 0.5).normalize(),
        turns: 3 + Math.floor(Math.random() * 2),
        impact: 0,
        result,
        settled: false,
    };
    gsap.killTweensOf(diceGroup.scale);
    diceGroup.scale.set(1, 1, 1);
    diceGroup.visible = true;
    diceMesh.position.copy(start);
    diceMesh.quaternion.copy(diceRoll.q0);
    diceFx.number.visible = false;
    diceFx.ring.material.opacity = 0;
    diceFx.glow.material.opacity = 0;
}

// Altura do dado (acima do ponto de pouso) numa fração u da rolagem.
function diceHeightAt(u) {
    if (u < DICE_IMPACTS[0]) {
        const s = u / DICE_IMPACTS[0];
        return DICE_DROP_HEIGHT * (1 - s * s);
    }
    for (let k = 0; k < DICE_BOUNCE_HEIGHTS.length; k++) {
        const a = DICE_IMPACTS[k];
        const b = DICE_IMPACTS[k + 1];
        if (u < b) {
            const s = (u - a) / (b - a);
            return 4 * DICE_BOUNCE_HEIGHTS[k] * s * (1 - s);
        }
    }
    return 0;
}

const _diceSpin = new THREE.Quaternion();

// Chamada todo frame por animate() (main.js).
function updateDice() {
    const r = diceRoll;
    if (!r || r.settled) return;
    const u = Math.min(1, (pawnAnimTime - r.t0) / r.dur);
    const ease = 1 - Math.pow(1 - u, 2.2);
    diceMesh.position.lerpVectors(r.start, r.end, ease);
    diceMesh.position.y = r.end.y + diceHeightAt(u);
    // Voltas completas desacelerando + caminho até a orientação final.
    const e = 1 - Math.pow(1 - u, 3);
    diceMesh.quaternion.slerpQuaternions(r.q0, r.q1, e);
    _diceSpin.setFromAxisAngle(r.axis, r.turns * Math.PI * 2 * e);
    diceMesh.quaternion.premultiply(_diceSpin);
    // Cada batida na areia: som e um pouco de areia levantando.
    while (r.impact < DICE_IMPACTS.length && u >= DICE_IMPACTS[r.impact]) {
        const strength = 1 - r.impact / DICE_IMPACTS.length;
        playDiceBounceSound(strength);
        const p = diceMesh.position.clone();
        p.y -= DICE_SIZE / 2;
        spawnDustParticles(p);
        r.impact++;
    }
    if (u >= 1) settleDice(r);
}

function settleDice(r) {
    r.settled = true;
    diceMesh.position.copy(r.end);
    diceMesh.quaternion.copy(r.q1);
    const floor = r.end.clone();
    floor.y -= DICE_SIZE / 2 - 0.03;
    // Anel de luz que se espalha na areia.
    diceFx.ring.position.copy(floor);
    diceFx.ring.scale.setScalar(0.6);
    diceFx.ring.material.opacity = 0.95;
    gsap.to(diceFx.ring.scale, { x: 3.2, y: 3.2, z: 3.2, duration: 0.9, ease: 'power2.out' });
    gsap.to(diceFx.ring.material, { opacity: 0, duration: 0.9, ease: 'power1.in' });
    // Brilho na face de cima (que é a do número sorteado).
    diceFx.glow.position.copy(r.end);
    diceFx.glow.position.y += DICE_SIZE / 2 + 0.02;
    diceFx.glow.material.opacity = 1;
    gsap.to(diceFx.glow.material, { opacity: 0.35, duration: 1.2, ease: 'power1.out' });
    // Número grande pulando em cima do dado.
    drawDiceNumber(r.result);
    const n = diceFx.number;
    n.position.copy(r.end);
    n.position.y += DICE_SIZE / 2 + 0.75;
    n.scale.setScalar(0.01);
    n.visible = true;
    gsap.to(n.scale, { x: 0.95, y: 0.95, z: 0.95, duration: 0.45, ease: 'back.out(2.6)' });
    gsap.to(n.position, { y: n.position.y + 0.2, duration: 0.8, yoyo: true, repeat: 3, ease: 'sine.inOut' });
    // Pulinho de "pronto!" do dado.
    gsap.fromTo(
        diceMesh.scale,
        { x: 1.18, y: 0.82, z: 1.18 },
        { x: 1, y: 1, z: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' }
    );
    spawnCoinSparkle(n.position.clone(), 3);
    spawnBubbles(r.end.clone(), 12);
    playDiceLandSound();
    // Fica um tempo mostrando o número, depois some.
    diceRollHideTimeout = setTimeout(() => {
        gsap.to(diceGroup.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 0.35,
            ease: 'power1.in',
            onComplete: () => {
                diceGroup.visible = false;
                diceGroup.scale.set(1, 1, 1);
                diceFx.number.visible = false;
            },
        });
    }, TIMING.diceResultHoldMs);
}

// Ponto pra câmera olhar enquanto o dado rola (o lugar onde ele vai parar).
function getDiceFocusPoint() {
    return diceRoll ? diceRoll.end.clone() : getDiceLandingSpot();
}

// ============ VISUAL DO KIT ============
// Visual do kit dentro do dado do jogo. As faces do kit (1 = +Y, 2 = +Z,
// 3 = +X) são uma rotação fixa de 120° das faces do jogo (1 = +X, 2 = +Y,
// 3 = +Z, ver js/data/diceFaces.js): girando o modelo uma vez com
// SEA_DICE_FACE_ALIGN, a face que fica pra cima continua sendo decidida só
// por DICE_FACE_NORMALS — testado em test/run.js.
const SEA_DICE_FACE_ALIGN = new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1);

function createSeaDiceVisual(size) {
    if (!hasSeaKit()) return null;
    const model = makeSeaModel('dado', { cor: 'perola' }, 1, false);
    const align = new THREE.Group();
    align.quaternion.setFromRotationMatrix(SEA_DICE_FACE_ALIGN);
    // O kit tem a base no chão (centro em y = 0,25 com lado 0,5): desce pra
    // girar em torno do centro.
    model.objeto.position.y = -0.25;
    align.add(model.objeto);
    align.scale.setScalar(size / 0.5);
    return align;
}
