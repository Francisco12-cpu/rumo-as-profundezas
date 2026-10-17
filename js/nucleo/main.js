function syncPawnPositions() {
    if (!gameState || !pawns) return;
    gameState.players.forEach((player, idx) => {
        const pawnIdx = player.pawnIndex !== undefined ? player.pawnIndex : idx;
        if (pawns[pawnIdx]) {
            const pos = getPawnTilePosition(player.position, idx);
            pos.y += 0.3;
            pawns[pawnIdx].position.copy(pos);
            pawns[pawnIdx].scale.setScalar(getTileCrowdScale(getPawnsOnTile(player.position).length));
        }
    });
}

// ============ LOOP DE ANIMAÇÃO ============
function animate(now) {
    requestAnimationFrame(animate);
    updateFpsMeter(now || performance.now());
    const deltaTime = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    updateParticles(deltaTime);
    updateSeaProps(elapsed, deltaTime);
    updateTurnMarker(elapsed);
    updateDistanceFog();
    updateAtmosphere(elapsed, deltaTime);
    updatePathCurrent(elapsed, deltaTime);
    updateCoinModels(elapsed);
    updateMenuShowcase(elapsed);

    // Bolhas ambientais — um pouco mais frequentes em aparelhos com folga de
    // desempenho, só pra dar mais vida ao cenário de água (puramente visual).
    if (Math.random() < (isLowPowerDevice ? 0.05 : 0.09)) {
        const randomPos = new THREE.Vector3((Math.random() - 0.5) * 16, -0.1, (Math.random() - 0.5) * 16);
        spawnBubbles(randomPos, 1);
    }

    updateTileGlows(elapsed);

    // Balanço suave dos peões parados — só dá vida aos personagens (rotation),
    // nunca mexe em position: hopPawnToTile/refreshTileOccupants (tabuleiro/peoes.js)
    // são donos exclusivos de pawn.position via GSAP, então animar rotation
    // aqui não entra em conflito nem durante um pulo em andamento. Offset por
    // índice (userData.index, ver createCharacterPawn em pawnBuilders.js) pra
    // os peões não balançarem todos em uníssono.
    // Personagens: respirar, piscar, nadar, reagir (modelos/animacaoPeoes.js).
    // Só mexe no corpo/rotação; a posição no tabuleiro é do GSAP (peoes.js).
    updatePawnAnimations(elapsed, deltaTime);
    updateDice();
    updateCardDeck(elapsed);

    // Câmera: em modo "focus" alvo E câmera seguem o peão da vez juntos; o
    // jogador continua livre pra girar/zoom com o mouse ou o dedo ao redor
    // dele (ver camera.js/updateCameraFollow e initThreeJS/OrbitControls).
    updateCameraFollow(deltaTime);
    updateCameraExplore(deltaTime);

    const targetBeforeX = controls.target.x;
    const targetBeforeZ = controls.target.z;
    // No voo a câmera é controlada só por camera.js (o OrbitControls desligado
    // ainda reposicionaria a câmera em update()).
    if (cameraMode !== 'fly' && cameraMode !== 'menu') controls.update();
    detectCameraPan(targetBeforeX, targetBeforeZ);
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
    on('btn-hud-mute', 'click', toggleMute);
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
    on('btn-camera-overview', 'click', setCameraOverview);
    on('btn-camera-focus', 'click', focusCurrentPlayer);
    on('btn-camera-fly', 'click', toggleFlyMode);
    on('btn-legend', 'click', openLegend);
    on('btn-legend-close', 'click', closeLegend);
    on('btn-roll-dice', 'click', onRollDice);
    on('btn-tile-intro-ok', 'click', () => continueTileIntro());
    on('btn-victory-menu', 'click', closeVictoryAndReset);

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
    on('setup-token-set', 'change', (e) => setTokenSet(e.target.value));
    on('setup-question-bank', 'change', (e) => {
        selectedBankId = e.target.value;
        try {
            localStorage.setItem('trivia3d_selected_bank', selectedBankId);
        } catch (err) {}
    });
}

// Aplica GAME_NAME (js/data/gameInfo.js) — único lugar onde o nome do jogo
// é definido — no título da aba e no menu principal.
// Aba escondida (trocou de app, bloqueou a tela): o navegador já para o
// requestAnimationFrame; aqui pausamos o áudio também (e o relógio, pra
// animação não "pular" ao voltar).
document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) audioCtx.suspend();
    else audioCtx.resume();
    if (clock) clock.getDelta();
});

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
    applyTranslations(); // também aplica os ícones SVG (data-icon)
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
        else if (openModal.id === 'victory-modal') closeVictoryAndReset();
        else if (openModal.id === 'legend-modal') closeLegend();
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
                '.btn, .btn-roll, .btn-camera, .btn-leave-game, .btn-mute, .btn-copy, .btn-settings-fab, .settings-lang-btn, .tile-info-close'
            )
        ) {
            playClickSound();
        }
    });

    createMenuShowcase();
    initSplash();

    // Partículas iniciais
    for (let i = 0; i < 40; i++) {
        const randomPos = new THREE.Vector3((Math.random() - 0.5) * 18, Math.random() * 6, (Math.random() - 0.5) * 18);
        spawnBubbles(randomPos, 1);
    }
}

// Iniciar o jogo
init();
