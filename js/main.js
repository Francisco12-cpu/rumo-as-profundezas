function syncPawnPositions() {
    if (!gameState || !pawns) return;
    gameState.players.forEach((player, idx) => {
        const pawnIdx = player.pawnIndex !== undefined ? player.pawnIndex : idx;
        if (pawns[pawnIdx]) {
            const pos = getPawnTilePosition(player.position, idx);
            pos.y += 0.3;
            pawns[pawnIdx].position.copy(pos);
        }
    });
}

// ============ LOOP DE ANIMAÇÃO ============
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    updateParticles(deltaTime);
    updateCrabs(deltaTime, elapsed);

    // Bolhas ambientais — um pouco mais frequentes em aparelhos com folga de
    // desempenho, só pra dar mais vida ao cenário de água (puramente visual).
    if (Math.random() < (isLowPowerDevice ? 0.05 : 0.09)) {
        const randomPos = new THREE.Vector3((Math.random() - 0.5) * 16, -0.1, (Math.random() - 0.5) * 16);
        spawnBubbles(randomPos, 1);
    }

    // Animar algas
    environmentGroup.children.forEach((child) => {
        if (child.userData && child.userData.swaySpeed) {
            child.rotation.z = Math.sin(elapsed * child.userData.swaySpeed + child.userData.swayOffset) * 0.1;
        }
    });

    // Animar anéis das casas
    if (tilesGroup) {
        tilesGroup.children.forEach((child, idx) => {
            if (child.geometry && child.geometry.type === 'TorusGeometry') {
                child.scale.setScalar(0.85 + Math.sin(elapsed * 2.5 + idx * 0.3) * 0.08);
            }
        });
    }

    // Balanço suave dos peões parados — só dá vida aos personagens (rotation),
    // nunca mexe em position: hopPawnToTile/refreshTileOccupants (scene.js)
    // são donos exclusivos de pawn.position via GSAP, então animar rotation
    // aqui não entra em conflito nem durante um pulo em andamento. Offset por
    // índice (userData.index, ver createCharacterPawn em pawnBuilders.js) pra
    // os peões não balançarem todos em uníssono.
    pawns.forEach((pawn) => {
        if (!pawn) return;
        const phase = pawn.userData && typeof pawn.userData.index === 'number' ? pawn.userData.index : 0;
        pawn.rotation.y = Math.sin(elapsed * 1.1 + phase * 1.7) * 0.18;
    });

    // Câmera: em modo "focus" o alvo (controls.target) segue o peão da vez
    // automaticamente; o jogador continua livre pra girar/zoom com o mouse
    // ao redor desse alvo (ver initThreeJS/OrbitControls).
    if (cameraMode === 'focus' && activePawnToFollow !== null && pawns[activePawnToFollow]) {
        const lookAt = pawns[activePawnToFollow].position.clone();
        lookAt.y += 0.5;
        controls.target.lerp(lookAt, 0.1);
    }

    controls.update();
    composer.render();
}

// ============ LIGAÇÃO DE EVENTOS ============
// Todos os botões estáticos do HTML são ligados aqui via addEventListener,
// em vez de onclick="..." espalhado pelo markup (mais fácil de manter e de
// testar, e evita expor as funções do jogo como "API" implícita do HTML).
function wireUpEventListeners() {
    const on = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    on('btn-open-settings', 'click', openSettings);
    on('btn-settings-close', 'click', closeSettings);
    on('btn-mute', 'click', toggleMute);
    on('settings-volume-master', 'input', (e) => setMasterVolume(e.target.value));
    on('settings-volume-music', 'input', (e) => setMusicVolume(e.target.value));
    on('settings-volume-sfx', 'input', (e) => setSfxVolume(e.target.value));
    on('btn-lang-pt', 'click', () => setLanguage('pt'));
    on('btn-lang-en', 'click', () => setLanguage('en'));
    on('settings-quality', 'change', (e) => setQuality(e.target.value));
    on('settings-bot-difficulty', 'change', (e) => setBotDifficulty(e.target.value));

    on('btn-resume-game', 'click', resumeSavedGame);
    on('btn-new-solo', 'click', () => openSetup('solo'));
    on('btn-new-local', 'click', () => openSetup('local'));
    on('btn-create-room', 'click', () => openSetup('p2p_host'));
    on('btn-join-room', 'click', showJoinRoom);
    on('btn-open-deck', 'click', openDeckManager);
    on('btn-open-docs', 'click', openDocs);

    on('btn-setup-back', 'click', closeSetup);
    on('btn-start-game', 'click', startGame);

    on('btn-copy-room', 'click', copyRoomCode);
    on('btn-leave-game', 'click', confirmLeaveGame);
    on('btn-tile-info-close', 'click', hideTileInfo);
    on('btn-camera-toggle', 'click', toggleCamera);
    on('btn-roll-dice', 'click', onRollDice);

    on('btn-deck-save', 'click', saveDeckFromTextarea);
    on('btn-deck-default', 'click', loadDefaultDeck);
    on('btn-deck-export', 'click', exportDeck);
    on('btn-deck-close', 'click', closeDeckManager);
    on('btn-docs-close', 'click', closeDocs);

    on('btn-join-cancel', 'click', closeJoinRoom);
    on('btn-join-confirm', 'click', joinRoomFromInput);

    on('setup-num-players', 'change', () => {
        if (currentMode !== 'solo') updateColorOptions();
    });
    on('setup-num-bots', 'change', () => {
        if (currentMode === 'solo') updateColorOptions();
    });
    on('setup-board-size', 'change', () => {
        boardLength = parseInt(document.getElementById('setup-board-size').value);
    });
    on('setup-question-bank', 'change', (e) => {
        selectedBankId = e.target.value;
        try {
            localStorage.setItem('trivia3d_selected_bank', selectedBankId);
        } catch (err) {}
    });
}

// Aplica GAME_NAME (js/data/gameInfo.js) — único lugar onde o nome do jogo
// é definido — no título da aba e no menu principal.
function applyGameName() {
    document.title = GAME_NAME;
    const heading = document.getElementById('menu-game-title');
    if (heading) heading.textContent = GAME_NAME;
}

// ============ INICIALIZAÇÃO ============
function init() {
    initThreeJS();
    applyGameName();
    loadDeckFromStorage();
    loadQuestionBanks(); // assíncrono — não bloqueia; ver questions.js
    wireUpEventListeners();

    updateColorOptions();
    updateVolumeUI();
    updateResumeButtonVisibility();
    applyTranslations();
    animate();

    // Esc fecha o modal aberto no momento (acessibilidade via teclado).
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const openModal = Array.from(document.querySelectorAll('.modal-overlay')).find(
            (m) => !m.classList.contains('hidden')
        );
        if (!openModal) return;
        if (openModal.id === 'deck-modal') closeDeckManager();
        else if (openModal.id === 'docs-modal') closeDocs();
        else if (openModal.id === 'join-room-modal') closeJoinRoom();
        else if (openModal.id === 'settings-modal') closeSettings();
        else if (openModal.id === 'question-modal')
            return; // não deixa "escapar" de responder
        else openModal.classList.add('hidden');
    });

    // Som de "clique" em qualquer botão do menu/HUD — um único listener
    // delegado no documento, em vez de mexer em cada onclick individual.
    document.addEventListener('click', (e) => {
        if (
            e.target &&
            e.target.closest &&
            e.target.closest(
                '.btn, .btn-roll, .btn-camera-toggle, .btn-leave-game, .btn-mute, .btn-copy, .btn-settings-fab, .settings-lang-btn, .tile-info-close'
            )
        ) {
            playClickSound();
        }
    });

    // Na primeira visita (sem partida nenhuma ainda), mostra as regras uma vez.
    try {
        if (!localStorage.getItem('trivia3d_seen_intro')) {
            openDocs();
            localStorage.setItem('trivia3d_seen_intro', '1');
        }
    } catch (e) {}

    // Partículas iniciais
    for (let i = 0; i < 40; i++) {
        const randomPos = new THREE.Vector3((Math.random() - 0.5) * 18, Math.random() * 6, (Math.random() - 0.5) * 18);
        spawnBubbles(randomPos, 1);
    }
}

// Iniciar o jogo
init();
