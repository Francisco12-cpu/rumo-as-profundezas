// ============================================================
// MINI-MENUS DA PARTIDA (Ajustes e Câmera)
// ============================================================
// No celular não cabiam todos os botões soltos (um ficava em cima do outro).
// Durante a partida, a engrenagem abre um menuzinho (som, legenda das casas,
// configurações, sair) e um botão de câmera abre as três opções de câmera.
// Os botões de dentro são os mesmos de antes (mesmos ids e funções).

function isInMatch() {
    const hud = document.getElementById('hud');
    return !!(gameState && hud && hud.classList.contains('active'));
}

function onSettingsFab() {
    if (!isInMatch()) {
        closeQuickMenu();
        openSettings();
        return;
    }
    toggleQuickMenu();
}

function toggleQuickMenu(force) {
    const menu = document.getElementById('quick-menu');
    if (!menu) return;
    const open = force !== undefined ? force : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    document.getElementById('btn-open-settings').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
        toggleCameraMenu(false);
        updateVolumeUI();
        playBubbleSound();
    }
}

function closeQuickMenu() {
    toggleQuickMenu(false);
}

function toggleCameraMenu(force) {
    const box = document.getElementById('camera-buttons');
    if (!box) return;
    const open = force !== undefined ? force : !box.classList.contains('aberto');
    box.classList.toggle('aberto', open);
    document.getElementById('btn-camera-menu').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) closeQuickMenu();
}

// Escolher uma opção fecha o menu; tocar fora dele também.
function initMiniMenus() {
    const quick = document.getElementById('quick-menu');
    const cams = document.getElementById('camera-buttons');
    if (quick) quick.addEventListener('click', (e) => e.target.closest('.quick-item') && closeQuickMenu());
    if (cams)
        cams.addEventListener(
            'click',
            (e) => e.target.closest('.camera-options .btn-camera') && toggleCameraMenu(false)
        );
    document.addEventListener('pointerdown', (e) => {
        if (quick && !quick.classList.contains('hidden') && !e.target.closest('#quick-menu, #btn-open-settings')) {
            closeQuickMenu();
        }
        if (cams && cams.classList.contains('aberto') && !e.target.closest('#camera-buttons')) toggleCameraMenu(false);
    });
}
