// ============ SISTEMA DE CÂMERA ============
// As transições automáticas continuam animando camera.position/controls.target
// diretamente; o OrbitControls (ver initThreeJS) recalcula sua órbita a partir
// da posição atual da câmera a cada frame, então o jogador pode a qualquer
// momento pegar o mouse e girar/dar zoom por cima dessas transições sem conflito.
function setCameraFocus(pawnIndex) {
    cameraMode = 'focus';
    activePawnToFollow = pawnIndex;
    if (pawns[pawnIndex]) {
        const pawnPos = pawns[pawnIndex].position.clone();
        const tileIndex = gameState.players[pawnIndex].position;
        const tangent = getTileTangent(tileIndex);
        const behind = tangent.clone().multiplyScalar(-6);
        const target = pawnPos.clone().add(behind);
        target.y += 5;
        const lookAt = pawnPos.clone();
        lookAt.y += 0.5;
        gsap.to(camera.position, { x: target.x, y: target.y, z: target.z, duration: 1.0, ease: 'power2.inOut' });
        gsap.to(controls.target, { x: lookAt.x, y: lookAt.y, z: lookAt.z, duration: 1.0, ease: 'power2.inOut' });
    }
}

function setCameraOverview() {
    cameraMode = 'overview';
    activePawnToFollow = null;
    // Tabuleiros com mais fileiras (boardLength maior) são mais "compridos" em
    // Z — a visão geral recua proporcionalmente pra sempre enquadrar o
    // caminho inteiro, em vez de uma distância fixa que corta as pontas.
    const rows = getBoardRowCount(boardLength);
    const dist = 20 + rows * 2.2;
    gsap.to(camera.position, { x: 0, y: dist * 0.75, z: dist, duration: 1.2, ease: 'power2.inOut' });
    gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.2, ease: 'power2.inOut' });
}

function setCameraDiceFocus() {
    cameraMode = 'dice';
    gsap.to(camera.position, {
        x: diceMesh.position.x + 4,
        y: diceMesh.position.y + 3,
        z: diceMesh.position.z + 6,
        duration: 0.8,
        ease: 'power2.inOut',
    });
    gsap.to(controls.target, {
        x: diceMesh.position.x,
        y: diceMesh.position.y,
        z: diceMesh.position.z,
        duration: 0.8,
        ease: 'power2.inOut',
    });
}

function toggleCamera() {
    if (cameraMode === 'overview') {
        const currentIdx = gameState ? gameState.currentPlayerIndex : 0;
        setCameraFocus(currentIdx);
    } else {
        setCameraOverview();
    }
}
