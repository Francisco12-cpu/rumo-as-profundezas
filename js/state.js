// ============ GERENCIAMENTO DE ESTADO ============
function createGameState() {
    const players = [];
    const totalPlayers = currentMode === 'solo' ? 1 + numBots : numPlayers;
    const names = ['Bob Esponja', 'Patrick', 'Sandy', 'Lula Molusco'];
    const botNames = ['Bot Patrick', 'Bot Sandy', 'Bot Lula'];
    let botIdx = 0;
    for (let i = 0; i < totalPlayers; i++) {
        const isBot = currentMode === 'solo' && i > 0;
        const name = isBot ? botNames[botIdx++] : names[i] || 'Jogador ' + (i + 1);
        players.push({
            id: i,
            name: name,
            colorIndex: selectedColors[i] !== undefined ? selectedColors[i] : i,
            position: 0,
            isBot: isBot,
            skipNextTurn: false,
            hasPlayedBonus: false,
        });
    }
    return {
        players: players,
        currentPlayerIndex: 0,
        boardLength: boardLength,
        turnNumber: 0,
        gameOver: false,
        winner: null,
        diceResult: null,
        lastQuestionCorrect: null,
        roomCode: roomCodeGlobal,
    };
}

// ============ SALVAR / CONTINUAR PARTIDA ============
// Só faz sentido persistir modo solo/local — numa sala P2P a conexão em si
// não sobrevive a um fechar de aba, então não tem o que "continuar" sozinho.
// Limitação aceita: o layout das casas especiais é sorteado de novo ao
// continuar (não é salvo), só a posição/vez dos jogadores é preservada.
const SAVE_KEY = 'trivia3d_saved_game';

function saveGameProgress() {
    if (!gameState || gameState.gameOver) return;
    if (currentMode !== 'solo' && currentMode !== 'local') return;
    try {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify({
                mode: currentMode,
                boardLength: boardLength,
                numPlayers: numPlayers,
                numBots: numBots,
                selectedColors: selectedColors,
                gameState: gameState,
                savedAt: Date.now(),
            })
        );
    } catch (e) {}
}

function hasSavedGame() {
    try {
        return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
        return false;
    }
}

function loadSavedGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function clearSavedGame() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
}

function getCurrentPlayer() {
    return gameState ? gameState.players[gameState.currentPlayerIndex] : null;
}

// Um jogador é "controlável" NESTA tela quando um clique local aqui pode
// legitimamente agir por ele: em solo/local (sem P2P) qualquer humano é
// controlável (o dispositivo passa de mão em mão); em P2P só o próprio
// jogador que este cliente representa (myPlayerId) é controlável — inclusive
// pro host, que também é só "o jogador 0", não um controle remoto dos
// outros. Bots nunca são controláveis por clique (ver botPlay/botAnswerQuestion).
// Usado por updateRollButton() (ui.js) e pelo modal de pergunta (questions.js)
// pra não deixar quem está de olho na tela do host/guest errado decidir a
// jogada de outra pessoa.
function isPlayerLocallyControllable(player) {
    if (!player || player.isBot) return false;
    if (isHost || isGuest) return player.id === myPlayerId;
    return true;
}

function nextTurn() {
    if (!gameState || gameState.gameOver) return;
    gamePhase = GAME_PHASE.IDLE;
    let safety = 0;
    do {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        safety++;
    } while (gameState.players[gameState.currentPlayerIndex].skipNextTurn && safety < gameState.players.length);
    if (safety < gameState.players.length) {
        gameState.players[gameState.currentPlayerIndex].skipNextTurn = false;
    }
    gameState.turnNumber++;
    updateHUD();
    updateRollButton();
    setCameraFocus(gameState.currentPlayerIndex);
    saveGameProgress();
    if (isHost) {
        broadcastToGuests({ type: 'turn_changed', currentPlayerIndex: gameState.currentPlayerIndex });
    }
    const current = getCurrentPlayer();
    if (current && current.isBot && !gameState.gameOver) {
        setTimeout(() => botPlay(), 1500);
    }
}

function movePlayer(playerIndex, newPosition, callback = null) {
    if (!gameState) return;
    const player = gameState.players[playerIndex];
    const fromTile = player.position;
    player.position = Math.max(0, Math.min(newPosition, gameState.boardLength - 1));
    const pawnIdx = player.pawnIndex !== undefined ? player.pawnIndex : playerIndex;
    // Casa por casa (não um arraste direto) — é isso que faz o peão parecer
    // estar andando pelo tabuleiro de verdade.
    movePlayerAlongPath(pawnIdx, fromTile, player.position, callback);
    if (player.position >= gameState.boardLength - 1 && !gameState.gameOver) {
        gameState.gameOver = true;
        gameState.winner = playerIndex;
        onGameWin(playerIndex);
    }
}

function onGameWin(playerIndex) {
    const player = gameState.players[playerIndex];
    clearSavedGame();
    playVictorySound();
    hapticFeedback('victory');
    const pawnPos = pawns[playerIndex] ? pawns[playerIndex].position.clone() : new THREE.Vector3(0, 3, 0);
    spawnConfetti(pawnPos, 150);
    spawnBubbles(pawnPos, 30);
    setTimeout(() => spawnConfetti(pawnPos, 100), 600);
    setTimeout(() => spawnConfetti(pawnPos, 80), 1200);
    setTimeout(() => spawnBubbles(pawnPos, 50), 1500);
    setCameraOverview();
    if (isHost) {
        broadcastToGuests({ type: 'game_over', winner: playerIndex });
    }
    setTimeout(() => {
        alert(
            player.name +
                ' venceu a partida! Chegou à casa ' +
                gameState.boardLength +
                ' em ' +
                gameState.turnNumber +
                ' rodadas!'
        );
        resetToMenu();
    }, 2200);
}

function resetToMenu() {
    gameState = null;
    currentMode = null;
    gameOver = false;
    rollInProgress = false;
    questionInProgress = false;
    gamePhase = GAME_PHASE.IDLE;
    myPlayerId = 0;
    closeAllModals();
    document.getElementById('hud').classList.remove('active');
    document.getElementById('screen-menu').classList.add('active');
    document.getElementById('screen-menu').classList.remove('hidden');
    document.getElementById('screen-setup').classList.add('hidden');
    document.getElementById('screen-setup').classList.remove('active');
    setCameraOverview();
    while (pawnsGroup.children.length) pawnsGroup.remove(pawnsGroup.children[0]);
    pawns = [];
    if (peer) {
        try {
            peer.destroy();
        } catch (e) {}
        peer = null;
    }
    connections = [];
    isHost = false;
    isGuest = false;
    stopAmbientSound();
    updateResumeButtonVisibility();
}

// ============ MECÂNICAS DA CASA ============
function handleLanding(playerIndex) {
    if (!gameState || gameState.gameOver) return;
    const player = gameState.players[playerIndex];
    const tileIndex = player.position;
    const tileData = tileMeshes[tileIndex] ? tileMeshes[tileIndex].userData : null;
    if (!tileData) {
        nextTurn();
        return;
    }
    gamePhase = GAME_PHASE.HOUSE_EFFECT;

    const effect = tileData.effect;
    switch (effect.type) {
        case 'start':
            nextTurn();
            break;
        case 'finish':
            break;
        case 'normal':
            askQuestion(playerIndex);
            break;
        case 'avancar_2':
            playBubbleSound();
            spawnBubbles(pawns[playerIndex].position.clone(), 15);
            hapticFeedback('correct');
            const advancePos = Math.min(player.position + 2, gameState.boardLength - 1);
            movePlayer(playerIndex, advancePos, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: advancePos });
                }
                setTimeout(() => nextTurn(), 500);
            });
            break;
        case 'voltar_2':
            playIncorrectSound();
            hapticFeedback('incorrect');
            const backPos = Math.max(player.position - 2, 0);
            movePlayer(playerIndex, backPos, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: backPos });
                }
                setTimeout(() => nextTurn(), 500);
            });
            break;
        case 'pular_vez':
            playBubbleSound();
            hapticFeedback('correct');
            const nextPlayerIdx = (playerIndex + 1) % gameState.players.length;
            gameState.players[nextPlayerIdx].skipNextTurn = true;
            setTimeout(() => nextTurn(), 700);
            break;
        case 'trocar_lugar':
            playBubbleSound();
            spawnBubbles(pawns[playerIndex].position.clone(), 12);
            hapticFeedback('correct');
            const lastPlaceIdx = getLastPlaceIndex();
            if (lastPlaceIdx !== -1 && lastPlaceIdx !== playerIndex) {
                const tempPos = player.position;
                gameState.players[playerIndex].position = gameState.players[lastPlaceIdx].position;
                gameState.players[lastPlaceIdx].position = tempPos;
                updatePawnPosition(playerIndex, gameState.players[playerIndex].position, true);
                updatePawnPosition(lastPlaceIdx, gameState.players[lastPlaceIdx].position, true);
                if (isHost) {
                    broadcastToGuests({
                        type: 'pawn_move',
                        playerIndex: playerIndex,
                        position: gameState.players[playerIndex].position,
                    });
                    broadcastToGuests({
                        type: 'pawn_move',
                        playerIndex: lastPlaceIdx,
                        position: gameState.players[lastPlaceIdx].position,
                    });
                }
            }
            setTimeout(() => nextTurn(), 700);
            break;
        case 'pergunta_bonus':
            askQuestion(playerIndex, true);
            break;
        default:
            askQuestion(playerIndex);
    }
}

function getLastPlaceIndex() {
    if (!gameState || gameState.players.length === 0) return -1;
    let minPos = Infinity;
    let minIdx = -1;
    gameState.players.forEach((p, i) => {
        if (p.position < minPos) {
            minPos = p.position;
            minIdx = i;
        }
    });
    return minIdx;
}
