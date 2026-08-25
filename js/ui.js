// ============ UI CONTROLLERS ============
function openSetup(mode) {
    initAudio();
    currentMode = mode;
    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-menu').classList.remove('active');
    document.getElementById('screen-setup').classList.remove('hidden');
    document.getElementById('screen-setup').classList.add('active');

    const botsGroup = document.getElementById('setup-bots-group');
    const roomCodeGroup = document.getElementById('setup-room-code-group');
    const numPlayersSelect = document.getElementById('setup-num-players');

    if (mode === 'solo') {
        botsGroup.style.display = 'block';
        roomCodeGroup.style.display = 'none';
        numPlayersSelect.value = '1';
        numPlayersSelect.disabled = true;
    } else if (mode === 'local') {
        botsGroup.style.display = 'none';
        roomCodeGroup.style.display = 'none';
        numPlayersSelect.disabled = false;
    } else if (mode === 'p2p_host') {
        botsGroup.style.display = 'none';
        roomCodeGroup.style.display = 'none';
        numPlayersSelect.disabled = false;
        numPlayersSelect.value = '2';
    } else if (mode === 'p2p_guest') {
        botsGroup.style.display = 'none';
        roomCodeGroup.style.display = 'block';
        numPlayersSelect.disabled = false;
        numPlayersSelect.value = '1';
    }

    updateColorOptions();
    refreshBankSelectOptions();
}

// Preenche o <select> de banco de perguntas com "Todos" + cada banco
// carregado (ver questions.js/loadQuestionBanks) + "Personalizado" quando
// existir um baralho salvo pela tela Gerenciar Perguntas.
function refreshBankSelectOptions() {
    const select = document.getElementById('setup-question-bank');
    if (!select) return;
    const previous = select.value || selectedBankId;
    const banks = getAllSelectableBanks();

    select.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = t('bank_all');
    select.appendChild(allOpt);

    banks.forEach((bank) => {
        const opt = document.createElement('option');
        opt.value = bank.id;
        const label = bank.id === 'custom' ? t('bank_custom') : bank.nome;
        opt.textContent = label + ' (' + bank.perguntas.length + ')';
        select.appendChild(opt);
    });

    const validIds = ['all'].concat(banks.map((b) => b.id));
    select.value = validIds.includes(previous) ? previous : 'all';
    selectedBankId = select.value;
}

function closeSetup() {
    document.getElementById('screen-setup').classList.add('hidden');
    document.getElementById('screen-setup').classList.remove('active');
    document.getElementById('screen-menu').classList.remove('hidden');
    document.getElementById('screen-menu').classList.add('active');
    currentMode = null;
}

function updateColorOptions() {
    const container = document.getElementById('color-options-container');
    container.innerHTML = '';
    const totalPlayers =
        currentMode === 'solo'
            ? 1 + (parseInt(document.getElementById('setup-num-bots').value) || 1)
            : parseInt(document.getElementById('setup-num-players').value) || 2;
    const maxPlayers = Math.min(Math.max(totalPlayers, 1), 6);
    while (selectedColors.length < maxPlayers) selectedColors.push(selectedColors.length % PLAYER_COLORS.length);
    selectedColors.length = maxPlayers;

    selectedColors.forEach((colorIdx, playerIdx) => {
        const dot = document.createElement('div');
        dot.className = 'color-dot';
        dot.style.backgroundColor = PLAYER_COLORS[colorIdx].css;
        dot.title = 'Jogador ' + (playerIdx + 1) + ': ' + PLAYER_COLORS[colorIdx].name;
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute(
            'aria-label',
            'Cor do jogador ' + (playerIdx + 1) + ': ' + PLAYER_COLORS[colorIdx].name + '. Ativar para trocar.'
        );
        dot.innerHTML = '<span>' + (playerIdx + 1) + '</span>';
        const cycleColor = () => {
            selectedColors[playerIdx] = (selectedColors[playerIdx] + 1) % PLAYER_COLORS.length;
            updateColorOptions();
        };
        dot.addEventListener('click', cycleColor);
        dot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cycleColor();
            }
        });
        container.appendChild(dot);
    });
}

function showJoinRoom() {
    initAudio();
    document.getElementById('join-room-modal').classList.remove('hidden');
    document.getElementById('join-room-input').value = '';
    document.getElementById('join-room-input').focus();
}

function closeJoinRoom() {
    document.getElementById('join-room-modal').classList.add('hidden');
}

function joinRoomFromInput() {
    const code = document.getElementById('join-room-input').value.trim();
    if (!code) {
        alert('Digite um código de sala válido.');
        return;
    }
    roomCodeGlobal = code;
    closeJoinRoom();
    currentMode = 'p2p_guest';
    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-menu').classList.remove('active');
    document.getElementById('screen-setup').classList.remove('hidden');
    document.getElementById('screen-setup').classList.add('active');
    document.getElementById('setup-room-code').value = code;
    document.getElementById('setup-room-code-group').style.display = 'block';
    document.getElementById('setup-bots-group').style.display = 'none';
    document.getElementById('setup-num-players').value = '1';
    document.getElementById('setup-num-players').disabled = true;
    updateColorOptions();
}

async function startGame() {
    initAudio();
    boardLength = parseInt(document.getElementById('setup-board-size').value) || 30;
    numPlayers = parseInt(document.getElementById('setup-num-players').value) || 2;
    numBots = parseInt(document.getElementById('setup-num-bots').value) || 0;

    const totalPlayers = currentMode === 'solo' ? 1 + numBots : numPlayers;
    while (selectedColors.length < totalPlayers) {
        selectedColors.push(selectedColors.length % PLAYER_COLORS.length);
    }
    selectedColors.length = totalPlayers;

    if (currentMode === 'p2p_host') {
        try {
            await initPeerForHost();
            document.getElementById('hud-room-code').style.display = 'flex';
            document.getElementById('hud-room-code-text').textContent = roomCodeGlobal;
        } catch (e) {
            alert('Erro ao criar sala P2P: ' + e.message);
            return;
        }
    } else if (currentMode === 'p2p_guest') {
        const code = document.getElementById('setup-room-code').value.trim();
        if (!code) {
            alert('Digite o código da sala.');
            return;
        }
        roomCodeGlobal = code;
        try {
            await initPeerForGuest(code);
        } catch (e) {
            alert('Erro ao entrar na sala: ' + e.message);
            return;
        }
    }

    gameState = createGameState();
    gameOver = false;
    rollInProgress = false;
    questionInProgress = false;

    document.getElementById('screen-setup').classList.add('hidden');
    document.getElementById('screen-setup').classList.remove('active');
    document.getElementById('hud').classList.add('active');

    createOceanEnvironment();
    createBoardCurve();
    createTiles();
    createPawns();
    createDice();
    updateHUD();
    setCameraFocus(0);
    saveGameProgress();

    if (isHost) {
        broadcastToGuests({ type: 'sync_state', gameState: gameState });
    }

    const firstPlayer = getCurrentPlayer();
    if (firstPlayer && firstPlayer.isBot && !gameState.gameOver) {
        setTimeout(() => botPlay(), 1200);
    }

    updateRollButton();
}

function updateHUD() {
    const container = document.getElementById('hud-players');
    if (!container || !gameState) return;
    container.innerHTML = '';
    gameState.players.forEach((player, idx) => {
        const chip = document.createElement('div');
        chip.className = 'hud-player-chip' + (idx === gameState.currentPlayerIndex ? ' active' : '');
        const colorIdx = player.colorIndex !== undefined ? player.colorIndex : idx;
        chip.innerHTML =
            '<span class="hud-color-indicator" style="background-color:' +
            PLAYER_COLORS[colorIdx].css +
            '"></span>' +
            '<span>' +
            player.name +
            '</span>' +
            '<span class="hud-pos">Casa ' +
            (player.position + 1) +
            '/' +
            gameState.boardLength +
            '</span>';
        container.appendChild(chip);
    });
    const turnInfo = document.getElementById('hud-turn-info');
    if (turnInfo && getCurrentPlayer()) {
        turnInfo.textContent = 'Vez de: ' + getCurrentPlayer().name;
    }

    // Banner "SUA VEZ!" só aparece quando é realmente a vez de quem está
    // olhando pra essa tela (o jogador local, não os outros jogadores/bots).
    const banner = document.getElementById('turn-banner');
    if (banner) {
        const current = getCurrentPlayer();
        const isMyTurn =
            current &&
            !current.isBot &&
            (!isGuest || current.id === myPlayerId) &&
            (currentMode !== 'p2p_guest' || isGuest);
        banner.classList.toggle('hidden', !isMyTurn);
    }
}

function updateRollButton() {
    const btn = document.getElementById('btn-roll-dice');
    const hint = document.getElementById('roll-hint');
    if (!btn || !gameState) return;
    const current = getCurrentPlayer();
    // Só habilita o botão quando o jogador da vez é realmente controlável
    // por ESTA tela (ver isPlayerLocallyControllable em state.js) — em P2P
    // isso vale tanto pra convidados quanto pro próprio host, que não pode
    // rolar o dado no lugar de outro jogador só porque está na tela dele.
    const isMyTurnLocally = isPlayerLocallyControllable(current);
    const canRoll = !rollInProgress && !questionInProgress && !gameState.gameOver && isMyTurnLocally;
    btn.disabled = !canRoll;
    if (gameState.gameOver) btn.disabled = true;

    if (hint) {
        if (gameState.gameOver) hint.textContent = '';
        else if (questionInProgress) hint.textContent = 'Aguardando resposta da pergunta...';
        else if (rollInProgress) hint.textContent = '';
        else if (current && current.isBot) hint.textContent = current.name + ' (bot) está jogando...';
        else if (current && !isMyTurnLocally) hint.textContent = 'Aguardando a vez de ' + current.name + '...';
        else hint.textContent = '';
    }
}

function onRollDice() {
    if (!gameState || gameState.gameOver || rollInProgress || questionInProgress) return;
    const current = getCurrentPlayer();
    if (!current || current.isBot) return;

    if (isGuest) {
        // Não é permitido decidir o resultado localmente: o convidado pede ao
        // host para rolar por ele, e só aplica o que vier de 'dice_result'/'pawn_move'.
        if (current.id !== myPlayerId) return;
        initAudio();
        sendToHost({ type: 'roll_request' });
        return;
    }

    // Mesmo sendo o host (autoritativo sobre o estado), este clique só vale
    // quando a vez é do PRÓPRIO host (myPlayerId) — senão a tela do host
    // poderia rolar o dado no lugar de um convidado. O botão já fica
    // desabilitado nesse caso (updateRollButton/isPlayerLocallyControllable);
    // esta checagem é a trava real, contra chamada direta da função.
    if (isHost && current.id !== myPlayerId) return;

    performRoll();
}

// Lógica real da rolagem (host e modos solo/local). Também usada quando o
// host recebe um 'roll_request' válido de um convidado, e pelos bots.
//
// Sequência (câmera + ritmo pensados como uma cena curta, não um corte seco —
// todos os tempos vêm de TIMING em config.js, fonte única do ritmo):
//   ROLLING (câmera no dado, dado gira — TIMING.diceSpinMs)
//   -> RESULT (dado parado, confirmação visual do número, pausa — TIMING.diceResultHoldMs)
//   -> câmera passa pro peão, que fica parado um instante (TIMING.standStillMs)
//   -> MOVING (peão pula casa por casa até o destino, ver movePlayerAlongPath)
//   -> pequena pausa ao aterrissar na casa final (TIMING.preLandingBurstMs)
//   -> LANDING (efeito de chegada, mais pausa — TIMING.postLandingPauseMs)
//   -> handleLanding() decide o efeito da casa / dispara a pergunta
// A pergunta nunca aparece durante ROLLING/MOVING — só depois que tudo isso
// termina, então ela nunca corta uma animação em andamento.
function performRoll() {
    if (gamePhase !== GAME_PHASE.IDLE) return; // trava extra contra jogada dupla
    gamePhase = GAME_PHASE.ROLLING;
    initAudio();
    rollInProgress = true;
    updateRollButton();
    const result = Math.floor(Math.random() * 6) + 1;
    gameState.diceResult = result;
    playDiceRollSound();
    hapticFeedback('roll');

    showDiceRoll(result);
    setCameraDiceFocus();

    if (isHost) {
        broadcastToGuests({ type: 'dice_result', result: result });
    }

    // RESULT: dado já parou, mostra o número por um instante com uma
    // confirmação visual antes de qualquer outra coisa acontecer.
    // Os setTimeout abaixo checam gameState de novo porque a sequência
    // inteira dura vários segundos — tempo suficiente pro jogador clicar
    // "Sair" (que zera gameState) antes deles disparar. Sem essa checagem, o
    // callback tentaria ler propriedades de "null" e estouraria uma exceção.
    setTimeout(() => {
        if (!gameState || gameState.gameOver) return;
        gamePhase = GAME_PHASE.RESULT;
        if (diceMesh) spawnDiceConfirmBurst(diceMesh.position.clone());
        playBubbleSound();
    }, TIMING.diceSpinMs);

    // Câmera + início do movimento: só depois que o resultado já deu tempo
    // de ser "apreciado" pelo jogador.
    setTimeout(() => {
        if (!gameState || gameState.gameOver) return;
        const playerIndex = gameState.currentPlayerIndex;
        const fromTile = gameState.players[playerIndex].position;
        const newPos = Math.min(fromTile + result, gameState.boardLength - 1);
        gamePhase = GAME_PHASE.MOVING;
        setCameraFocus(playerIndex);

        // Personagem fica parado um instante na casa atual antes de começar
        // a pular — dá tempo da câmera "chegar" nele antes do movimento.
        setTimeout(() => {
            if (!gameState || gameState.gameOver) return;
            movePlayer(playerIndex, newPos, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: newPos });
                }
                if (!gameState || gameState.gameOver) {
                    rollInProgress = false;
                    updateRollButton();
                    return;
                }
                // Pequena pausa ao aterrissar na casa final, antes do efeito
                // de chegada — evita o corte seco "pulo -> efeito".
                setTimeout(() => {
                    if (!gameState || gameState.gameOver) return;
                    gamePhase = GAME_PHASE.LANDING;
                    const pawn = pawns[playerIndex];
                    if (pawn) spawnLandingConfirmBurst(pawn.position.clone());
                    playBubbleSound();
                    // Mais uma pequena pausa depois do efeito de chegada,
                    // antes do efeito da casa / pergunta.
                    setTimeout(() => {
                        rollInProgress = false;
                        updateRollButton();
                        handleLanding(playerIndex);
                    }, TIMING.postLandingPauseMs);
                }, TIMING.preLandingBurstMs);
            });
        }, TIMING.standStillMs);
    }, TIMING.diceSpinMs + TIMING.diceResultHoldMs);
}

function resumeSavedGame() {
    const saved = loadSavedGame();
    const btn = document.getElementById('btn-resume-game');
    if (!saved || !saved.gameState) {
        alert('Não há partida salva pra continuar.');
        if (btn) btn.classList.add('hidden');
        return;
    }
    initAudio();
    currentMode = saved.mode;
    boardLength = saved.boardLength;
    numPlayers = saved.numPlayers;
    numBots = saved.numBots;
    selectedColors = saved.selectedColors;
    gameState = saved.gameState;
    gameOver = false;
    rollInProgress = false;
    questionInProgress = false;

    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-menu').classList.remove('active');
    document.getElementById('hud').classList.add('active');

    createOceanEnvironment();
    createBoardCurve();
    createTiles();
    createPawns();
    syncPawnPositions(); // createPawns() sempre bota os peões na casa 0; aqui a
    // gente os reposiciona nas casas salvas de verdade.
    createDice();
    updateHUD();
    updateRollButton();
    setCameraFocus(gameState.currentPlayerIndex);

    const current = getCurrentPlayer();
    if (current && current.isBot && !gameState.gameOver) {
        setTimeout(() => botPlay(), 1200);
    }
}

// Mostra/esconde o botão "Continuar Partida" no menu principal conforme
// existe ou não uma partida solo/local salva.
function updateResumeButtonVisibility() {
    const btn = document.getElementById('btn-resume-game');
    if (btn) btn.classList.toggle('hidden', !hasSavedGame());
}

function openDocs() {
    initAudio();
    document.getElementById('docs-modal').classList.remove('hidden');
}

function closeDocs() {
    document.getElementById('docs-modal').classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.add('hidden'));
    if (questionTimer) clearInterval(questionTimer);
}

// ============ INFORMAÇÃO DA CASA (clique/toque no tabuleiro) ============
// tileData vem direto do userData da casa clicada (ver scene.js/createTiles):
// { index, effect: <objeto de js/data/tileTypes.js> }. Nada de texto é
// escrito à mão aqui — tudo (label, descrição, cor, símbolo) vem do dado real.
let tileInfoHideTimeout = null;

function showTileInfo(tileData) {
    const card = document.getElementById('tile-info-card');
    if (!card) return;
    const type = tileData.effect;
    document.getElementById('tile-info-number').textContent = String(tileData.index + 1);
    document.getElementById('tile-info-symbol').textContent = type.symbol || '?';
    document.getElementById('tile-info-label').textContent = type.label;
    document.getElementById('tile-info-desc').textContent = type.description;
    card.style.setProperty('--tile-info-color', '#' + type.color.toString(16).padStart(6, '0'));
    card.classList.remove('hidden');
    card.classList.add('visible');

    if (tileInfoHideTimeout) clearTimeout(tileInfoHideTimeout);
    tileInfoHideTimeout = setTimeout(hideTileInfo, 5000);
}

function hideTileInfo() {
    const card = document.getElementById('tile-info-card');
    if (!card) return;
    card.classList.remove('visible');
    if (tileInfoHideTimeout) clearTimeout(tileInfoHideTimeout);
}

// ============ CONFIGURAÇÕES (áudio, idioma, qualidade) ============
// Único lugar que junta os 3 assuntos na UI; a lógica de cada um continua
// isolada no sistema dono dela (audio.js, i18n.js, config.js/qualityOverride).
function openSettings() {
    initAudio();
    document.getElementById('settings-quality').value = qualityOverride;
    document.getElementById('settings-bot-difficulty').value = String(botDifficulty);
    updateVolumeUI();
    applyTranslations();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function setQuality(value) {
    qualityOverride = value === 'high' || value === 'low' ? value : 'auto';
    try {
        localStorage.setItem('trivia3d_quality', qualityOverride);
    } catch (e) {}
}

function setBotDifficulty(value) {
    const parsed = parseFloat(value);
    botDifficulty = parsed === 0.5 || parsed === 1 ? parsed : 0.75;
    try {
        localStorage.setItem('trivia3d_bot_difficulty', String(botDifficulty));
    } catch (e) {}
}

function confirmLeaveGame() {
    if (!gameState || gameState.gameOver) {
        resetToMenu();
        return;
    }
    if (confirm('Sair da partida em andamento? O progresso desta partida será perdido.')) {
        resetToMenu();
    }
}

function copyRoomCode() {
    if (!roomCodeGlobal) return;
    navigator.clipboard
        .writeText(roomCodeGlobal)
        .then(() => {
            alert('Código copiado: ' + roomCodeGlobal);
        })
        .catch(() => {
            const tempInput = document.createElement('input');
            tempInput.value = roomCodeGlobal;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('Código copiado: ' + roomCodeGlobal);
        });
}
