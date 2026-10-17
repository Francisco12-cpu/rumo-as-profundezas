// ============ GERENCIAMENTO DE ESTADO ============
// Personagem de cada jogador: quem escolheu fica com o escolhido (se ninguém
// antes pegou); os outros são sorteados do conjunto setId sem repetir — se o
// conjunto acabar, sorteia entre todos; só repete se não sobrar nenhum.
function assignCharacters(total, picks, setId, random) {
    const rand = random || Math.random;
    const all = Object.keys(PAWN_BUILDERS).filter((k) => k !== 'default');
    const used = new Set();
    const result = new Array(total).fill(null);
    for (let i = 0; i < total; i++) {
        const k = picks[i];
        if (k && PAWN_BUILDERS[k] && k !== 'default' && !used.has(k)) {
            result[i] = k;
            used.add(k);
        }
    }
    const draw = (pool) => {
        const free = pool.filter((k) => !used.has(k));
        if (!free.length) return null;
        const k = free[Math.floor(rand() * free.length)];
        used.add(k);
        return k;
    };
    for (let i = 0; i < total; i++) {
        if (result[i]) continue;
        result[i] = draw(getTokenSetRoster(setId)) || draw(all) || getCharacterKeyFor(setId, i);
    }
    return result;
}

// Quem escolhe o personagem na tela: no solo e no host só o jogador 1 (os
// convidados escolhem na tela deles e mandam pick_character); no "passa o
// aparelho", todos.
function getHumanCharacterPicks(totalPlayers) {
    const picks = new Array(totalPlayers).fill(null);
    const n = currentMode === 'local' ? totalPlayers : 1;
    for (let i = 0; i < n && i < totalPlayers; i++) picks[i] = characterPicks[i] || null;
    return picks;
}

function createGameState() {
    const players = [];
    const totalPlayers = currentMode === 'solo' ? 1 + numBots : numPlayers;
    const characters = assignCharacters(totalPlayers, getHumanCharacterPicks(totalPlayers), tokenSet);
    // O nome vem do personagem do jogador (antes era uma lista fixa que não
    // batia com o modelo: o 3º jogador se chamava "Sandy" mas era o Lula).
    // Se o mesmo personagem aparecer duas vezes, ganha um número pra não confundir.
    const usedNames = {};
    for (let i = 0; i < totalPlayers; i++) {
        const isBot = currentMode === 'solo' && i > 0;
        const character = characters[i];
        let name = CHARACTER_NAMES[character] || CHARACTER_NAMES.default;
        usedNames[name] = (usedNames[name] || 0) + 1;
        if (usedNames[name] > 1) name += ' ' + usedNames[name];
        if (isBot) name = 'Bot ' + name;
        players.push({
            id: i,
            name: name,
            character: character,
            colorIndex: selectedColors[i] !== undefined ? selectedColors[i] : i,
            position: 0,
            isBot: isBot,
            skipNextTurn: false,
            hasPlayedBonus: false,
            coins: 0, // moedas do tesouro (ver collectCoinAt/awardCoins)
            shields: 0, // bolhas protetoras: anulam o castigo do próximo erro
        });
    }
    return {
        players: players,
        tokenSet: tokenSet,
        currentPlayerIndex: 0,
        boardLength: boardLength,
        turnNumber: 0,
        gameOver: false,
        winner: null,
        diceResult: null,
        lastQuestionCorrect: null,
        roomCode: roomCodeGlobal,
        // Tipo de cada casa + moedas, sorteados uma vez aqui (ver tabuleiro/layout.js).
        board: generateBoardLayout(boardLength, getActiveSpecialTileTypes()),
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
    showTurnToast(current);
    if (current && current.isBot && !gameState.gameOver) {
        setTimeout(() => botPlay(), TIMING.botTurnDelayMs);
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
    // O placar ("Casa X/Y") acompanha cada movimento, não só a troca de vez.
    // Andando pra frente, pega as moedas das casas por onde passa/para.
    const forward = player.position > fromTile;
    movePlayerAlongPath(
        pawnIdx,
        fromTile,
        player.position,
        () => {
            updateHUD();
            if (callback) callback();
        },
        (tile) => {
            if (forward) collectCoinAt(playerIndex, tile);
        }
    );
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
    openFinishChest();
    playPawnReaction(playerIndex, 'comemorar', 3);
    if (isHost) {
        broadcastToGuests({ type: 'game_over', winner: playerIndex });
    }
    // Tela de vitória própria (antes era um alert() do navegador, que some
    // sozinho ao clicar e parece mensagem de erro). Quem fecha é o jogador.
    const turns = Math.max(1, gameState.turnNumber);
    const tiles = gameState.boardLength;
    setTimeout(() => {
        showVictory(player, tiles, turns);
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
    createMenuShowcase();
    startMenuMusic();
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
    chainedEffects = 0;

    const effect = tileData.effect;
    // Casa especial: a câmera chega mais perto do personagem e da casa
    // enquanto o cartão explica o que acontece (volta ao normal depois).
    if (effect.type !== 'normal' && effect.type !== 'start' && effect.type !== 'finish') {
        setCameraTileShot(playerIndex);
    }
    switch (effect.type) {
        case 'start':
            nextTurn();
            break;
        case 'finish':
            break;
        case 'voltar_2':
        case 'pular_vez':
        case 'cavalo_marinho':
            // Casas sem pergunta: o cartão da casa explica primeiro, e o
            // efeito só roda depois (antes o peão andava "do nada").
            showTileIntro(buildSpecialTileIntro(playerIndex, effect), () => {
                if (!gameState || gameState.gameOver) return;
                applySpecialTileEffect(playerIndex, effect.type);
            });
            break;
        default:
            // Toda casa com pergunta (comum, bônus, corrente rápida,
            // redemoinho e as temáticas): o tipo da casa ajusta o efeito.
            askQuestion(playerIndex, effect.question ? effect.type : 'normal');
    }
}

// Texto do cartão de uma casa especial SEM pergunta. Lê os mesmos dados que
// applySpecialTileEffect vai usar (próximo jogador, último colocado), então
// o que o cartão promete é o que acontece.
function buildSpecialTileIntro(playerIndex, effect, chained) {
    const player = gameState.players[playerIndex];
    let text = effect.description;
    if (effect.type === 'voltar_2') text = player.name + ' volta 2 casas.';
    else if (effect.type === 'cavalo_marinho')
        text = player.name + ' pega carona até a casa ' + (getJumpTarget(player.position) + 1) + '!';
    else if (effect.type === 'pular_vez') {
        const next = gameState.players[(playerIndex + 1) % gameState.players.length];
        text = next === player ? 'Ninguém perde a vez.' : next.name + ' vai perder a próxima vez!';
    }
    return {
        playerIndex: playerIndex,
        tileNumber: player.position + 1,
        tileType: effect.type,
        color: effect.color,
        title: effect.label + '!',
        subtitle: chained ? 'Efeito em cadeia!' : 'Casa especial',
        lines: [{ kind: effect.type === 'voltar_2' ? 'bad' : 'good', text: text }],
        buttonText: 'OK!',
    };
}

function applySpecialTileEffect(playerIndex, type) {
    const player = gameState.players[playerIndex];
    switch (type) {
        case 'voltar_2': {
            playIncorrectSound();
            hapticFeedback('incorrect');
            playPawnReaction(playerIndex, 'frustrar');
            const backPos = Math.max(player.position - 2, 0);
            movePlayer(playerIndex, backPos, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: backPos });
                }
                setTimeout(() => continueAfterMove(playerIndex), TIMING.postEffectPauseMs);
            });
            break;
        }
        case 'cavalo_marinho': {
            playAdvanceSound();
            hapticFeedback('correct');
            playPawnReaction(playerIndex, 'comemorar');
            const target = getJumpTarget(player.position);
            setCameraFocus(playerIndex, { wide: true });
            movePlayer(playerIndex, target, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: target });
                }
                setTimeout(() => continueAfterMove(playerIndex), TIMING.postEffectPauseMs);
            });
            break;
        }
        case 'pular_vez': {
            playBubbleSound();
            hapticFeedback('correct');
            const nextPlayerIdx = (playerIndex + 1) % gameState.players.length;
            gameState.players[nextPlayerIdx].skipNextTurn = true;
            setTimeout(() => nextTurn(), TIMING.postEffectPauseMs);
            break;
        }
        default:
            nextTurn();
    }
}

// Efeito em cadeia: um efeito empurrou o jogador (voltou, avançou, carona)
// e ele parou numa casa especial sem pergunta — o efeito dela também vale.
// No máximo MAX_CHAINED_EFFECTS seguidos, pra nunca virar um vaivém sem fim.
const MAX_CHAINED_EFFECTS = 2;
let chainedEffects = 0;

function continueAfterMove(playerIndex) {
    if (!gameState || gameState.gameOver) return;
    const player = gameState.players[playerIndex];
    const tileData = tileMeshes[player.position] ? tileMeshes[player.position].userData : null;
    const effect = tileData && tileData.effect;
    if (effect && CHAINABLE_TILE_TYPE_IDS.includes(effect.type) && chainedEffects < MAX_CHAINED_EFFECTS) {
        chainedEffects++;
        gamePhase = GAME_PHASE.HOUSE_EFFECT;
        setCameraTileShot(playerIndex);
        showTileIntro(buildSpecialTileIntro(playerIndex, effect, true), () => {
            if (!gameState || gameState.gameOver) return;
            applySpecialTileEffect(playerIndex, effect.type);
        });
        return;
    }
    nextTurn();
}

// Troca a posição de playerIndex com a de quem está mais atrás (castigo do
// redemoinho). Devolve true se trocou; a animação dura ~0,7 s.
function swapWithLastPlace(playerIndex) {
    const lastPlaceIdx = getLastPlaceIndex();
    if (lastPlaceIdx === -1 || lastPlaceIdx === playerIndex) return false;
    const player = gameState.players[playerIndex];
    const other = gameState.players[lastPlaceIdx];
    if (other.position >= player.position) return false;
    const tempPos = player.position;
    player.position = other.position;
    other.position = tempPos;
    updatePawnPosition(playerIndex, player.position, true);
    updatePawnPosition(lastPlaceIdx, other.position, true);
    setCameraSwapShot(playerIndex, lastPlaceIdx); // mostra os dois trocando
    playSwapSound();
    if (isHost) {
        broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: player.position });
        broadcastToGuests({ type: 'pawn_move', playerIndex: lastPlaceIdx, position: other.position });
    }
    return true;
}

// ============ MOEDAS E BOLHAS PROTETORAS ============
// Regra: moedas ficam em algumas casas do caminho (gameState.board.coins);
// quem passa ou para nelas andando pra frente pega a moeda. Acertar uma
// pergunta também dá moeda. A cada COINS_PER_SHIELD moedas o jogador ganha
// uma bolha protetora, que anula o castigo do próximo erro.
// Só o host (ou o modo solo/local) decide; convidados recebem 'coin_collected'.
function collectCoinAt(playerIndex, tileIndex) {
    const board = gameState && gameState.board;
    if (!board) return;
    const k = board.coins.indexOf(tileIndex);
    if (k === -1) return;
    board.coins.splice(k, 1);
    awardCoins(playerIndex, 1, tileIndex);
}

function awardCoins(playerIndex, amount, tileIndex = -1) {
    if (!gameState || !amount) return;
    const player = gameState.players[playerIndex];
    const before = player.coins || 0;
    player.coins = before + amount;
    const newShields = Math.floor(player.coins / COINS_PER_SHIELD) - Math.floor(before / COINS_PER_SHIELD);
    player.shields = (player.shields || 0) + newShields;
    showCoinsAwarded(playerIndex, amount, tileIndex, newShields > 0);
    updateHUD();
    if (isHost) {
        broadcastToGuests({
            type: 'coin_collected',
            playerIndex,
            tileIndex,
            amount,
            coins: player.coins,
            shields: player.shields,
            gotShield: newShields > 0,
        });
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
