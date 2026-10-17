// ============================================================
// INTERAÇÃO COM O TABULEIRO (clique/toque numa casa)
// ============================================================
// Só faz a ponte entre "o que foi clicado na cena 3D" (raycasting) e "mostrar
// essa informação na UI" (ui.js/showTileInfo) — não sabe desenhar nada nem
// conhece HTML/CSS. Fica fácil trocar COMO a informação é exibida (painel,
// tooltip, card) sem tocar em como ela é detectada, e vice-versa.
let tileRaycaster = null;
let tilePointer = null;
let pointerDownAt = null; // { x, y } — pra distinguir toque de arrastar (girar câmera)

// Limiar de movimento (em pixels) abaixo do qual um pointerdown->pointerup
// ainda conta como "toque/clique" e não como início de um arraste pra girar
// a câmera (o OrbitControls escuta os mesmos eventos). Sem isso, começar a
// girar a câmera em cima de uma casa sempre abria o card de informação —
// bem comum de acontecer no celular.
const TAP_MOVE_THRESHOLD = 8;

function initTileInteraction() {
    tileRaycaster = new THREE.Raycaster();
    tilePointer = new THREE.Vector2();
    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
        // Só o botão principal/toque consulta casa — o direito arrasta o mapa (camera.js).
        pointerDownAt = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
    });
    el.addEventListener('pointerup', onBoardPointerUp);
    el.addEventListener('pointercancel', () => {
        pointerDownAt = null;
    });
}

function onBoardPointerUp(event) {
    if (!pointerDownAt) return;
    const dx = event.clientX - pointerDownAt.x;
    const dy = event.clientY - pointerDownAt.y;
    pointerDownAt = null;
    if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD) return; // foi arraste, não toque

    if (!tileMeshes || !tileMeshes.length || !camera || !gameState) return;
    const rect = renderer.domElement.getBoundingClientRect();
    tilePointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    tilePointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    tileRaycaster.setFromCamera(tilePointer, camera);
    const hits = tileRaycaster.intersectObjects(tileMeshes, false);
    if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data && data.effect) {
            showTileInfo(data);
            flashTileSelection(data.visualMesh);
        }
    }
}

// Feedback visual imediato de "essa casa foi selecionada" — um pulso de
// escala + brilho no disco de verdade da casa (não no alvo de toque
// invisível). Curto e discreto de propósito, só pra deixar claro qual casa
// foi tocada; não mexe em nenhum estado de jogo.
function flashTileSelection(mesh) {
    if (!mesh || typeof gsap === 'undefined') return;
    gsap.killTweensOf(mesh.scale);
    mesh.scale.set(1, 1, 1);
    gsap.to(mesh.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.out' });

    const mat = mesh.material;
    if (mat && 'emissiveIntensity' in mat) {
        const baseIntensity = mat.emissiveIntensity;
        gsap.killTweensOf(mat);
        gsap.to(mat, {
            emissiveIntensity: baseIntensity + 1,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power1.out',
            onComplete: () => {
                mat.emissiveIntensity = baseIntensity;
            },
        });
    }
}
