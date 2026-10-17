// ============ SISTEMA DE CÂMERA ============
// Modos (cameraMode):
//   'focus'    câmera de jogo: segue o personagem da vez em 3/4, suave;
//   'shot'     enquadramento especial curto (casa especial, troca de lugar);
//   'dice'     acompanhando o arremesso do dado;
//   'overview' visão geral do tabuleiro inteiro;
//   'fly'      câmera livre "modo criativo" (voar pelo mapa);
//   'free'     câmera parada onde o jogador (ou a ferramenta de fotos) deixou.
// Nos modos com OrbitControls o jogador pode girar/dar zoom por cima das
// transições (o OrbitControls recalcula a órbita a partir da posição atual).

// Câmera de jogo: alta, de frente e um pouco de lado (3/4). O mundo fica
// sempre "do mesmo jeito" na tela (a 1ª versão ia atrás do peão e girava 180°
// a cada fileira, deixando o personagem de costas).
const CAMERA_FOLLOW_OFFSET = { x: 2.2, y: 5.3, z: 6.4 };
const CAMERA_FOLLOW_LOOK_HEIGHT = 0.5;
// O alvo fica um pouco à frente do peão (na direção da câmera, pro personagem
// ficar acima dos botões de baixo) e puxado pras próximas casas do caminho.
const CAMERA_FOLLOW_LOOK_AHEAD_Z = 1.2;
const CAMERA_FOLLOW_NEXT_TILES = 1.4;
// Velocidade com que o alvo alcança o peão (por segundo, independente do FPS).
const CAMERA_FOLLOW_SPEED = 4.2;
// Marcos grandes (vulcão, navios, florestas) que a câmera não atravessa —
// preenchido pela decoração (cenario/decoracao.js).
const cameraObstacles = [];

function getFollowOffsetGoal(wide) {
    // Celular em pé enxerga bem menos pros lados: afasta um pouco.
    const scale = (camera.aspect && camera.aspect < 1 ? 1.45 : 1) * (wide ? 1.35 : 1);
    return {
        x: CAMERA_FOLLOW_OFFSET.x * scale,
        y: CAMERA_FOLLOW_OFFSET.y * scale,
        z: CAMERA_FOLLOW_OFFSET.z * scale,
    };
}

// options.resetAngle (padrão true): volta ao enquadramento padrão.
// options.wide: enquadramento mais aberto (corrente/vulcão empurrando várias casas).
function setCameraFocus(pawnIndex, options) {
    if (cameraMode === 'fly') exitFlyMode();
    cameraMode = 'focus';
    activePawnToFollow = pawnIndex;
    const resetAngle = !options || options.resetAngle !== false;
    const startOffset = {
        x: camera.position.x - controls.target.x,
        y: camera.position.y - controls.target.y,
        z: camera.position.z - controls.target.z,
    };
    cameraFollowOffset = Object.assign({}, startOffset);
    updateCameraButtons();
    if (!resetAngle) return;
    // Transição só do DESLOCAMENTO (não de uma posição absoluta): o alvo segue
    // o peão a cada frame em updateCameraFollow, e a câmera vai junto.
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    const goal = getFollowOffsetGoal(options && options.wide);
    const tween = { p: 0 };
    cameraOffsetTweening = true;
    gsap.to(tween, {
        p: 1,
        duration: 1.1,
        ease: 'power2.inOut',
        onUpdate: () => {
            cameraFollowOffset.x = startOffset.x + (goal.x - startOffset.x) * tween.p;
            cameraFollowOffset.y = startOffset.y + (goal.y - startOffset.y) * tween.p;
            cameraFollowOffset.z = startOffset.z + (goal.z - startOffset.z) * tween.p;
        },
        onComplete: () => {
            cameraOffsetTweening = false;
        },
    });
}

// Pra onde o caminho segue a partir da casa do peão (as próximas casas).
function getUpcomingPathDirection(pawnIndex) {
    const player = gameState && gameState.players[pawnIndex];
    if (!player || !boardCurve) return { x: 0, z: 0 };
    const last = gameState.boardLength - 1;
    const a = getTilePosition(Math.min(player.position, last));
    const b = getTilePosition(Math.min(player.position + 2, last));
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len };
}

// Chamada todo frame por animate() (main.js). Em modo 'focus', move o alvo
// suavemente até o peão e leva a câmera junto com o mesmo deslocamento.
function updateCameraFollow(deltaTime) {
    if (cameraMode !== 'focus' || activePawnToFollow === null || !pawns[activePawnToFollow]) return;
    const pawnPos = pawns[activePawnToFollow].position;
    // Deslocamento atual: se não há transição rolando, é o que o jogador deixou
    // (girou/deu zoom com o mouse ou o dedo) — isso é preservado.
    const offset = cameraOffsetTweening
        ? cameraFollowOffset
        : {
              x: camera.position.x - controls.target.x,
              y: camera.position.y - controls.target.y,
              z: camera.position.z - controls.target.z,
          };
    const ahead = getUpcomingPathDirection(activePawnToFollow);
    const k = 1 - Math.exp(-CAMERA_FOLLOW_SPEED * Math.min(deltaTime, 0.1));
    controls.target.x += (pawnPos.x + ahead.x * CAMERA_FOLLOW_NEXT_TILES - controls.target.x) * k;
    // Altura acompanha mais devagar: o peão sobe e desce a cada pulinho, e a
    // câmera não deve "quicar" junto.
    controls.target.y += (pawnPos.y + CAMERA_FOLLOW_LOOK_HEIGHT - controls.target.y) * k * 0.3;
    controls.target.z +=
        (pawnPos.z + CAMERA_FOLLOW_LOOK_AHEAD_Z + ahead.z * CAMERA_FOLLOW_NEXT_TILES - controls.target.z) * k;
    camera.position.set(controls.target.x + offset.x, controls.target.y + offset.y, controls.target.z + offset.z);
    keepCameraOutOfObstacles();
}

// Nunca embaixo da areia nem dentro de um marco grande (sobe por cima dele).
function keepCameraOutOfObstacles() {
    const p = camera.position;
    const floor = getSeabedHeight(p.x, p.z) + 0.9;
    if (p.y < floor) p.y = floor;
    for (let i = 0; i < cameraObstacles.length; i++) {
        const o = cameraObstacles[i];
        const d = Math.hypot(p.x - o.x, p.z - o.z);
        if (d < o.r && p.y < o.top + 0.8) p.y += (o.top + 0.8 - p.y) * 0.2;
    }
}

// ============ ENQUADRAMENTOS ESPECIAIS ============
// Curtos e suaves; quem chama volta pra câmera de jogo (setCameraFocus) quando
// o momento passa.
function setCameraShot(position, target, duration = 0.9) {
    if (cameraMode === 'fly') exitFlyMode();
    cameraMode = 'shot';
    activePawnToFollow = null;
    cameraOffsetTweening = false;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    gsap.to(camera.position, Object.assign({ duration, ease: 'power2.inOut' }, position));
    gsap.to(controls.target, Object.assign({ duration, ease: 'power2.inOut' }, target));
    updateCameraButtons();
}

// Chegou numa casa especial: chega mais perto do personagem e da casa.
function setCameraTileShot(playerIndex) {
    const pawn = pawns[playerIndex];
    if (!pawn) return;
    const p = pawn.position;
    const portrait = camera.aspect < 1 ? 1.35 : 1;
    setCameraShot(
        { x: p.x + 1.5 * portrait, y: p.y + 3.1 * portrait, z: p.z + 4.3 * portrait },
        { x: p.x, y: p.y + 0.5, z: p.z + 0.6 }
    );
}

// Troca de lugar: enquadra os dois personagens ao mesmo tempo.
function setCameraSwapShot(indexA, indexB) {
    const a = pawns[indexA];
    const b = pawns[indexB];
    if (!a || !b) return;
    const mid = a.position.clone().lerp(b.position, 0.5);
    const span = Math.max(4, a.position.distanceTo(b.position));
    const d = span * (camera.aspect < 1 ? 1.4 : 0.85);
    setCameraShot(
        { x: mid.x + d * 0.3, y: mid.y + d * 0.75, z: mid.z + d * 0.85 },
        { x: mid.x, y: mid.y, z: mid.z + 0.8 },
        1
    );
}

function setCameraOverview() {
    if (cameraMode === 'fly') exitFlyMode();
    cameraMode = 'overview';
    activePawnToFollow = null;
    cameraOffsetTweening = false;
    const view = getOverviewCameraPose();
    gsap.to(camera.position, Object.assign({ duration: 1.2, ease: 'power2.inOut' }, view.position));
    gsap.to(controls.target, Object.assign({ duration: 1.2, ease: 'power2.inOut' }, view.target));
    updateCameraButtons();
}

// Distância calculada pelo tamanho do tabuleiro (fileiras/largura) e pelo
// formato da tela. Ângulo de 45° (menos perspectiva = fileira da frente e de
// trás com tamanhos parecidos) e alvo um pouco à frente do centro, pra última
// fileira não ficar atrás do botão do dado. Em tela vertical a largura é o
// limite e não há botão nas laterais do tabuleiro, então a margem é menor.
const OVERVIEW_MARGIN = 1.2;
const OVERVIEW_MARGIN_PORTRAIT = 1.05;
const OVERVIEW_TARGET_SHIFT_Z = 1.5;

function getOverviewCameraPose() {
    const rows = getBoardRowCount(boardLength);
    const halfX = BOARD_ROW_WIDTH / 2 + 1.6;
    const halfZ = ((rows - 1) * BOARD_ROW_SPACING) / 2 + 1.6;
    const elev = Math.PI / 4;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    const margin = camera.aspect < 1 ? OVERVIEW_MARGIN_PORTRAIT : OVERVIEW_MARGIN;
    const range = Math.max(halfX / tanH, (halfZ * Math.sin(elev)) / tanV) * margin + halfZ * Math.cos(elev);
    const tz = OVERVIEW_TARGET_SHIFT_Z;
    return {
        position: { x: 0, y: range * Math.sin(elev), z: tz + range * Math.cos(elev) },
        target: { x: 0, y: 0, z: tz },
    };
}

// Enquadra o lugar onde o dado vai cair (perto do personagem da vez), de um
// ângulo um pouco de lado — dá pra ver o arremesso inteiro e quem joga.
function setCameraDiceFocus() {
    if (cameraMode === 'fly') exitFlyMode();
    cameraMode = 'dice';
    cameraOffsetTweening = false;
    const p = getDiceFocusPoint();
    gsap.to(camera.position, { x: p.x + 1.6, y: p.y + 3.6, z: p.z + 4.8, duration: 0.9, ease: 'power2.inOut' });
    gsap.to(controls.target, { x: p.x - 0.3, y: p.y + 0.4, z: p.z - 0.4, duration: 0.9, ease: 'power2.inOut' });
    updateCameraButtons();
}

// Botão "Ver personagem": volta pro jogador da vez com o enquadramento padrão,
// mesmo que o jogador tenha girado/afastado a câmera ou esteja voando.
function focusCurrentPlayer() {
    const currentIdx = gameState ? gameState.currentPlayerIndex : 0;
    setCameraFocus(currentIdx);
}

// Câmera parada onde está (sem seguir ninguém).
function enterFreeCamera() {
    if (cameraMode === 'fly') exitFlyMode();
    cameraMode = 'free';
    activePawnToFollow = null;
    cameraOffsetTweening = false;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    updateCameraButtons();
}

// ============ CÂMERA LIVRE: VOAR ("modo criativo") ============
// PC: WASD/setas andam, Espaço sobe, Shift desce, arrastar com o mouse olha
// em volta, a rodinha muda a velocidade. Celular: joystick (esquerda) anda,
// arrastar no resto da tela olha, botões sobem/descem, pinça vai pra frente
// e pra trás. Não sai do mundo nem atravessa o chão. Só mexe na câmera.
const FLY_LIMIT = 62;
const FLY_MAX_Y = 26;
const fly = {
    yaw: 0,
    pitch: -0.4,
    speed: 6,
    keys: new Set(),
    joy: { x: 0, y: 0 },
    vertical: 0,
    lookPointer: null,
    lastLook: null,
    pinch: null,
    hud: null,
};

function enterFlyMode() {
    if (cameraMode === 'fly') return;
    cameraMode = 'fly';
    activePawnToFollow = null;
    cameraOffsetTweening = false;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);
    controls.enabled = false;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    fly.yaw = Math.atan2(dir.x, dir.z);
    fly.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    showFlyHud(true);
    updateCameraButtons();
}

function exitFlyMode() {
    if (cameraMode !== 'fly') return;
    controls.enabled = true;
    // O OrbitControls volta a girar em torno de um ponto à frente da câmera.
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    controls.target.copy(camera.position).addScaledVector(dir, 8);
    fly.keys.clear();
    fly.joy.x = fly.joy.y = 0;
    fly.vertical = 0;
    cameraMode = 'free';
    showFlyHud(false);
}

function toggleFlyMode() {
    if (cameraMode === 'fly') focusCurrentPlayer();
    else enterFlyMode();
}

function isTypingTarget(e) {
    const tag = e.target && e.target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

const FLY_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'];

function initCameraExplore() {
    controls.enablePan = false;
    const el = renderer.domElement;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
        if (isTypingTarget(e) || !gameState) return;
        const k = e.key.toLowerCase();
        if (!FLY_KEYS.includes(k)) return;
        // Andar com o teclado já entra no voo (não precisa achar o botão).
        if (cameraMode !== 'fly' && k !== ' ' && k !== 'shift') enterFlyMode();
        if (cameraMode !== 'fly') return;
        fly.keys.add(k);
        if (k === ' ') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => fly.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => fly.keys.clear());
    // Olhar em volta: arrastar (mouse ou um dedo) no canvas.
    el.addEventListener('pointerdown', (e) => {
        if (cameraMode !== 'fly') return;
        fly.lookPointer = e.pointerId;
        fly.lastLook = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('pointermove', (e) => {
        if (cameraMode !== 'fly' || fly.lookPointer !== e.pointerId || !fly.lastLook || fly.pinch) return;
        const dx = e.clientX - fly.lastLook.x;
        const dy = e.clientY - fly.lastLook.y;
        fly.lastLook = { x: e.clientX, y: e.clientY };
        fly.yaw -= dx * 0.005;
        fly.pitch = Math.max(-1.35, Math.min(1.2, fly.pitch - dy * 0.005));
    });
    const endLook = (e) => {
        if (fly.lookPointer === e.pointerId) fly.lookPointer = null;
    };
    window.addEventListener('pointerup', endLook);
    window.addEventListener('pointercancel', endLook);
    // Rodinha: velocidade do voo.
    el.addEventListener(
        'wheel',
        (e) => {
            if (cameraMode !== 'fly') return;
            e.preventDefault();
            fly.speed = Math.max(2, Math.min(22, fly.speed * (e.deltaY > 0 ? 0.85 : 1.18)));
            showFlySpeed();
        },
        { passive: false }
    );
    // Pinça (dois dedos): vai pra frente/pra trás.
    el.addEventListener('touchstart', (e) => {
        if (cameraMode !== 'fly' || e.touches.length !== 2) return;
        fly.pinch = touchDistance(e.touches);
    });
    el.addEventListener('touchmove', (e) => {
        if (cameraMode !== 'fly' || !fly.pinch || e.touches.length !== 2) return;
        const d = touchDistance(e.touches);
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        camera.position.addScaledVector(dir, (d - fly.pinch) * 0.03);
        fly.pinch = d;
        clampFlyCamera();
    });
    el.addEventListener('touchend', () => (fly.pinch = null));
}

function touchDistance(touches) {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

// (Compatibilidade com main.js: o arraste com dois dedos não troca mais de modo.)
function detectCameraPan() {}

function clampFlyCamera() {
    const p = camera.position;
    const r = Math.hypot(p.x, p.z);
    if (r > FLY_LIMIT) {
        p.x *= FLY_LIMIT / r;
        p.z *= FLY_LIMIT / r;
    }
    p.y = Math.max(getSeabedHeight(p.x, p.z) + 0.6, Math.min(FLY_MAX_Y, p.y));
}

// Chamada todo frame por animate().
function updateCameraExplore(deltaTime) {
    if (cameraMode !== 'fly') return;
    const dt = Math.min(deltaTime, 0.1);
    const k = fly.keys;
    let fwd = fly.joy.y;
    let right = fly.joy.x;
    if (k.has('w') || k.has('arrowup')) fwd += 1;
    if (k.has('s') || k.has('arrowdown')) fwd -= 1;
    if (k.has('d') || k.has('arrowright')) right += 1;
    if (k.has('a') || k.has('arrowleft')) right -= 1;
    let up = fly.vertical;
    if (k.has(' ')) up += 1;
    if (k.has('shift')) up -= 1;
    const step = fly.speed * dt;
    const fx = Math.sin(fly.yaw);
    const fz = Math.cos(fly.yaw);
    camera.position.x += (fx * fwd - fz * right) * step;
    camera.position.z += (fz * fwd + fx * right) * step;
    camera.position.y += up * step;
    clampFlyCamera();
    const look = new THREE.Vector3(
        Math.sin(fly.yaw) * Math.cos(fly.pitch),
        Math.sin(fly.pitch),
        Math.cos(fly.yaw) * Math.cos(fly.pitch)
    );
    camera.lookAt(camera.position.clone().add(look));
    // Mantém o alvo do OrbitControls à frente (névoa e efeitos usam a distância até ele).
    controls.target.copy(camera.position).addScaledVector(look, 8);
}

// ---------- Controles na tela (voo) ----------
function showFlyHud(show) {
    if (!fly.hud) fly.hud = createFlyHud();
    fly.hud.classList.toggle('hidden', !show);
    if (show) showFlySpeed();
}

function showFlySpeed() {
    const label = document.getElementById('fly-speed');
    if (label) label.textContent = 'Velocidade ' + Math.round(fly.speed);
}

function createFlyHud() {
    const hud = document.createElement('div');
    hud.id = 'fly-hud';
    hud.className = 'fly-hud hidden';
    hud.innerHTML =
        '<div class="fly-hint">' +
        '<span class="fly-hint-pc">WASD: andar · Espaço/Shift: subir/descer · arraste: olhar · rodinha: velocidade</span>' +
        '<span class="fly-hint-touch">Joystick: andar · arraste: olhar · pinça: frente/trás</span>' +
        ' <span id="fly-speed" class="fly-speed"></span></div>' +
        '<div class="fly-joystick" id="fly-joystick"><div class="fly-stick" id="fly-stick"></div></div>' +
        '<div class="fly-updown">' +
        '<button class="fly-btn" id="fly-up" aria-label="Subir">' +
        iconSvg('subir') +
        '</button>' +
        '<button class="fly-btn" id="fly-down" aria-label="Descer">' +
        iconSvg('descer') +
        '</button>' +
        '</div>';
    document.getElementById('hud').appendChild(hud);
    // Joystick virtual.
    const joy = hud.querySelector('#fly-joystick');
    const stick = hud.querySelector('#fly-stick');
    let joyId = null;
    const moveJoy = (e) => {
        const r = joy.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > 1) {
            dx /= len;
            dy /= len;
        }
        fly.joy.x = dx;
        fly.joy.y = -dy;
        stick.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
    };
    joy.addEventListener('pointerdown', (e) => {
        joyId = e.pointerId;
        joy.setPointerCapture(e.pointerId);
        moveJoy(e);
        e.stopPropagation();
    });
    joy.addEventListener('pointermove', (e) => e.pointerId === joyId && moveJoy(e));
    const endJoy = (e) => {
        if (e.pointerId !== joyId) return;
        joyId = null;
        fly.joy.x = fly.joy.y = 0;
        stick.style.transform = '';
    };
    joy.addEventListener('pointerup', endJoy);
    joy.addEventListener('pointercancel', endJoy);
    // Subir/descer (segurando).
    [
        ['#fly-up', 1],
        ['#fly-down', -1],
    ].forEach(([sel, v]) => {
        const b = hud.querySelector(sel);
        b.addEventListener('pointerdown', (e) => {
            fly.vertical = v;
            e.stopPropagation();
        });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
            b.addEventListener(ev, () => (fly.vertical = 0))
        );
    });
    return hud;
}

// Botões de câmera: o do modo atual fica destacado.
function updateCameraButtons() {
    const overviewBtn = document.getElementById('btn-camera-overview');
    const focusBtn = document.getElementById('btn-camera-focus');
    const flyBtn = document.getElementById('btn-camera-fly');
    if (overviewBtn) overviewBtn.classList.toggle('active', cameraMode === 'overview');
    if (focusBtn) focusBtn.classList.toggle('active', cameraMode === 'focus');
    if (flyBtn) flyBtn.classList.toggle('active', cameraMode === 'fly');
}

// Chamada todo frame por animate() (main.js): a névoa linear acompanha a
// distância até o ponto que a câmera olha (ver FOG_DEPTH, renderizador.js).
function updateDistanceFog() {
    if (!scene.fog || !controls) return;
    const dist = camera.position.distanceTo(controls.target);
    scene.fog.near = Math.max(6, dist * 0.85);
    scene.fog.far = dist + FOG_DEPTH;
}
