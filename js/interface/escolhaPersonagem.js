// ============================================================
// ESCOLHA DE PERSONAGEM (tela de configuração)
// ============================================================
// Cada jogador humano escolhe o seu personagem numa grade de cartões com a
// "foto" de cada um; quem não escolher (e os bots) é sorteado na hora de
// começar (assignCharacters, nucleo/state.js), sem repetir. As fotos são os
// próprios modelos 3D, desenhados uma vez num renderizador pequeno à parte e
// guardados como imagem — nada de arquivo de imagem extra.

const PICKABLE_CHARACTERS = [
    'bob',
    'patrick',
    'lula',
    'siriguejo',
    'polvo',
    'estrela',
    'caracol',
    'caranguejo',
    'esponja',
];
const portraitCache = {};
let portraitQueue = [];
let portraitTimer = null;
let activePickSlot = 0;

// Quem escolhe nesta tela (índices de jogador). Convidado P2P escolhe "o
// seu" (índice 0 aqui; o host aplica no lugar certo — ver pick_character).
function getPickSlots() {
    if (currentMode === 'local') {
        const n = parseInt(document.getElementById('setup-num-players').value) || 2;
        return Array.from({ length: Math.min(Math.max(n, 1), 6) }, (_, i) => i);
    }
    return [0];
}

// Um renderizador pequeno só pras fotos, liberado quando a fila acaba.
let portraitRenderer = null;
function getPortraitRenderer() {
    if (!portraitRenderer) {
        portraitRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        portraitRenderer.setPixelRatio(1);
        portraitRenderer.setSize(160, 160);
        portraitRenderer.outputEncoding = THREE.sRGBEncoding;
    }
    return portraitRenderer;
}

function releasePortraitRenderer() {
    if (!portraitRenderer) return;
    portraitRenderer.dispose();
    if (portraitRenderer.forceContextLoss) portraitRenderer.forceContextLoss();
    portraitRenderer = null;
}

function renderCharacterPortrait(key) {
    if (portraitCache[key]) return portraitCache[key];
    const r = getPortraitRenderer();
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x5a7a99, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(1.5, 3, 4);
    scene.add(sun);
    const pawn = createCharacterPawn(PLAYER_COLORS[0].hex, 0, key);
    linearizeModelColors(pawn);
    scene.add(pawn);
    pawn.updateMatrixWorld(true);
    // Só o corpo (sem a base do peão, que é larga) e sem as partes
    // transparentes (bolhas da esponja), senão os bichos baixinhos e a
    // esponja do kit saíam miúdos na foto.
    const box = new THREE.Box3();
    const target = (pawn.userData.rig && pawn.userData.rig.body) || pawn;
    target.traverse((o) => {
        if (!o.isMesh || !o.visible) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        if (mats.some((m) => m.transparent && m.opacity < 0.95)) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    });
    if (box.isEmpty()) box.setFromObject(pawn);
    // Enquadra pelo lado maior (altura ou largura): o caranguejo é largo e
    // a esponja do kit é um tubo alto — os dois cabem inteiros na foto.
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = Math.max(size.y, size.x * 0.95, size.z * 0.8);
    const cam = new THREE.PerspectiveCamera(28, 1, 0.05, 30);
    const dist = (s * 0.56) / Math.tan(THREE.MathUtils.degToRad(14)) + size.z * 0.5;
    cam.position.set(0, center.y + s * 0.12, center.z + dist);
    cam.lookAt(0, center.y, center.z);
    r.render(scene, cam);
    const url = r.domElement.toDataURL('image/png');
    pawn.traverse((o) => o.geometry && o.geometry.dispose());
    portraitCache[key] = url;
    return url;
}

// Uma foto por vez (com pausa entre elas), pra tela não travar no celular.
function queuePortraits() {
    portraitQueue = PICKABLE_CHARACTERS.filter((k) => !portraitCache[k]);
    if (portraitTimer) return;
    const step = () => {
        const key = portraitQueue.shift();
        if (!key) {
            portraitTimer = null;
            releasePortraitRenderer();
            return;
        }
        try {
            renderCharacterPortrait(key);
            document.querySelectorAll('.char-card[data-char="' + key + '"] img').forEach((img) => {
                img.src = portraitCache[key];
                img.classList.add('pronta');
            });
        } catch (e) {}
        portraitTimer = setTimeout(step, 40);
    };
    portraitTimer = setTimeout(step, 60);
}

function renderCharacterPicker() {
    const tabs = document.getElementById('char-tabs');
    const grid = document.getElementById('char-grid');
    if (!tabs || !grid) return;
    const slots = getPickSlots();
    characterPicks.length = Math.max(characterPicks.length, slots.length);
    if (activePickSlot >= slots.length) activePickSlot = 0;

    tabs.innerHTML = '';
    tabs.classList.toggle('hidden', slots.length < 2);
    slots.forEach((slot) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'char-tab' + (slot === activePickSlot ? ' ativo' : '');
        const color =
            PLAYER_COLORS[(selectedColors[slot] !== undefined ? selectedColors[slot] : slot) % PLAYER_COLORS.length];
        chip.style.setProperty('--cor', color.css);
        const pick = characterPicks[slot];
        chip.innerHTML =
            '<span class="char-tab-dot"></span>Jogador ' +
            (slot + 1) +
            '<small>' +
            (pick ? CHARACTER_NAMES[pick] : 'Sorteio') +
            '</small>';
        chip.addEventListener('click', () => {
            activePickSlot = slot;
            renderCharacterPicker();
        });
        tabs.appendChild(chip);
    });

    grid.innerHTML = '';
    const mine = characterPicks[activePickSlot] || null;
    const takenBy = {};
    slots.forEach((slot) => {
        if (slot !== activePickSlot && characterPicks[slot]) takenBy[characterPicks[slot]] = slot;
    });
    [null].concat(PICKABLE_CHARACTERS).forEach((key) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'char-card' + (key === mine ? ' escolhido' : '') + (key === null ? ' sorteio' : '');
        card.dataset.char = key || 'sorteio';
        const taken = key !== null && takenBy[key] !== undefined;
        if (taken) {
            card.classList.add('ocupado');
            card.disabled = true;
        }
        const pic =
            key === null
                ? '<span class="char-dice">' + iconSvg('dado') + '</span>'
                : '<img alt="" src="' +
                  (portraitCache[key] || '') +
                  '"' +
                  (portraitCache[key] ? ' class="pronta"' : '') +
                  ' />';
        card.innerHTML =
            pic +
            '<span class="char-name">' +
            (key === null ? 'Sorteio' : CHARACTER_NAMES[key]) +
            '</span>' +
            (taken ? '<span class="char-badge">J' + (takenBy[key] + 1) + '</span>' : '');
        card.setAttribute('aria-pressed', key === mine ? 'true' : 'false');
        card.addEventListener('click', () => pickCharacter(key));
        grid.appendChild(card);
    });
    queuePortraits();
}

function pickCharacter(key) {
    characterPicks[activePickSlot] = key;
    playBubbleSound();
    if (activePickSlot === 0) {
        try {
            localStorage.setItem('trivia3d_character', key || '');
        } catch (e) {}
    }
    // Vários jogadores no mesmo aparelho: depois de escolher, passa a vez
    // da escolha pro próximo (as crianças não precisam achar a aba).
    const slots = getPickSlots();
    const i = slots.indexOf(activePickSlot);
    if (key && i >= 0 && i < slots.length - 1) activePickSlot = slots[i + 1];
    renderCharacterPicker();
}
