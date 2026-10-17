// ============ NETWORKING P2P ============
// PeerJS só é carregado quando alguém realmente cria/entra numa sala — no
// modo solo/local ele nunca era usado, mas baixava e executava assim mesmo.
let peerJsLoadPromise = null;
function loadPeerJsIfNeeded() {
    if (typeof Peer !== 'undefined') return Promise.resolve();
    if (peerJsLoadPromise) return peerJsLoadPromise;
    peerJsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/peerjs.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Não foi possível carregar o PeerJS.'));
        document.head.appendChild(script);
    });
    return peerJsLoadPromise;
}

function initPeerForHost() {
    return loadPeerJsIfNeeded().then(
        () =>
            new Promise((resolve, reject) => {
                try {
                    const roomCode = generateRoomCode();
                    roomCodeGlobal = roomCode;
                    peer = new Peer(roomCode);
                    peer.on('open', (id) => {
                        isHost = true;
                        myPlayerId = 0;
                        resolve(id);
                    });
                    peer.on('connection', (conn) => {
                        // O host é sempre o jogador 0; cada guest recebe o próximo índice livre,
                        // na ordem em que se conecta (até 3 guests = jogadores 1, 2 e 3).
                        const assignedIndex = connections.length + 1;
                        conn.assignedPlayerIndex = assignedIndex;
                        connections.push(conn);
                        conn.on('open', () => {
                            conn.send({ type: 'assign_player', playerIndex: assignedIndex });
                            // Estado atual (inclui o mapa das casas): o broadcast do início
                            // da partida acontece antes de qualquer convidado entrar.
                            if (gameState) conn.send({ type: 'sync_state', gameState: gameState });
                            conn.on('data', (data) => handlePeerData(data, conn));
                        });
                        conn.on('close', () => {
                            const idx = connections.indexOf(conn);
                            if (idx > -1) connections.splice(idx, 1);
                        });
                    });
                    peer.on('error', (err) => reject(err));
                } catch (e) {
                    reject(e);
                }
            })
    );
}

function initPeerForGuest(roomCode) {
    return loadPeerJsIfNeeded().then(
        () =>
            new Promise((resolve, reject) => {
                try {
                    const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
                    peer = new Peer(guestId);
                    peer.on('open', () => {
                        isGuest = true;
                        roomCodeGlobal = roomCode;
                        const conn = peer.connect(roomCode, { reliable: true });
                        conn.on('open', () => {
                            connections.push(conn);
                            conn.on('data', (data) => handlePeerData(data, conn));
                            resolve(conn);
                        });
                        conn.on('error', (err) => reject(err));
                    });
                    peer.on('error', (err) => reject(err));
                } catch (e) {
                    reject(e);
                }
            })
    );
}

function handlePeerData(data, conn) {
    if (!data || !data.type) return;
    switch (data.type) {
        case 'assign_player':
            if (isGuest) {
                myPlayerId = data.playerIndex;
                updateRollButton();
                // Personagem escolhido na tela do convidado: o host decide se dá.
                if (characterPicks[0]) sendToHost({ type: 'pick_character', character: characterPicks[0] });
            }
            break;
        case 'sync_state':
            if (isGuest && data.gameState) {
                gameState = data.gameState;
                boardLength = gameState.boardLength;
                // Os peões do convidado foram montados com a configuração
                // local dele; se o host escolheu outros personagens, remonta.
                if (getPawnsSignature() !== pawnsBuiltForTokenSet) createPawns();
                // O mapa das casas é o do host (ver tabuleiro/layout.js): redesenha.
                if (gameState.board) {
                    createTiles();
                    createSeaScenery();
                }
                updateHUD();
                updateRollButton();
                syncPawnPositions();
            }
            break;
        case 'dice_result':
            if (isGuest && diceMesh) {
                gameState.diceResult = data.result;
                showDiceRoll(data.result);
                playDiceRollSound();
            }
            break;
        case 'pawn_move':
            if (isGuest && gameState) {
                const fromTile = gameState.players[data.playerIndex].position;
                gameState.players[data.playerIndex].position = data.position;
                // Casa por casa também do lado de quem só está assistindo —
                // mesma animação de quem está jogando (ver movePlayerAlongPath).
                movePlayerAlongPath(data.playerIndex, fromTile, data.position, updateHUD);
            }
            break;
        case 'coin_collected':
            if (isGuest && gameState) {
                const p = gameState.players[data.playerIndex];
                p.coins = data.coins;
                p.shields = data.shields;
                if (gameState.board && data.tileIndex >= 0) {
                    gameState.board.coins = gameState.board.coins.filter((t) => t !== data.tileIndex);
                }
                showCoinsAwarded(data.playerIndex, data.amount, data.tileIndex, data.gotShield);
                updateHUD();
            }
            break;
        case 'tile_intro':
            // Só exibição: o convidado vê o mesmo cartão da casa que o host,
            // mas quem decide quando a pergunta/efeito começa continua sendo o host.
            if (isGuest && gameState && data.intro) {
                showTileIntro(data.intro, null);
            }
            break;
        case 'question_show':
            if (isGuest) {
                hideTileIntro();
                showQuestionForGuest(data.question);
            }
            break;
        case 'question_result':
            if (isGuest) {
                handleQuestionResultForGuest(data);
            }
            break;
        case 'turn_changed':
            if (isGuest && gameState) {
                gameState.currentPlayerIndex = data.currentPlayerIndex;
                updateHUD();
                updateRollButton();
                setCameraFocus(data.currentPlayerIndex);
                showTurnToast(getCurrentPlayer());
            }
            break;
        case 'game_over':
            if (isGuest && gameState) {
                gameState.gameOver = true;
                gameState.winner = data.winner;
                onGameWin(data.winner);
            }
            break;
        // ---- Mensagens de guest -> host (ações solicitadas por um jogador remoto) ----
        case 'roll_request':
            if (isHost) handleRollRequest(conn);
            break;
        case 'answer_request':
            if (isHost) handleAnswerRequest(conn, data.optionIndex);
            break;
        case 'pick_character':
            if (isHost) handleCharacterPick(conn, data.character);
            break;
    }
}

function broadcastToGuests(data) {
    if (!isHost) return;
    connections.forEach((conn) => {
        if (conn.open) {
            try {
                conn.send(data);
            } catch (e) {}
        }
    });
}

// Convidado pediu um personagem: só vale se existir e ninguém mais tiver.
// O host troca, remonta os peões e manda o estado novo pra todo mundo.
function handleCharacterPick(conn, character) {
    const idx = conn.assignedPlayerIndex;
    const player = gameState && gameState.players[idx];
    if (!player || !PAWN_BUILDERS[character] || character === 'default') return;
    if (gameState.players.some((p, i) => i !== idx && p.character === character)) return;
    player.character = character;
    player.name = CHARACTER_NAMES[character] || player.name;
    createPawns();
    syncPawnPositions();
    updateHUD();
    broadcastToGuests({ type: 'sync_state', gameState: gameState });
}

// Envia uma solicitação de ação do guest para o host (único peer conectado).
function sendToHost(data) {
    if (!isGuest || connections.length === 0) return;
    try {
        connections[0].send(data);
    } catch (e) {}
}

// O host valida que quem pediu a rolagem é realmente o jogador da vez antes de executar.
function handleRollRequest(conn) {
    if (!gameState || gameState.gameOver || rollInProgress || questionInProgress) return;
    const current = getCurrentPlayer();
    if (!current || current.isBot) return;
    if (current.id !== conn.assignedPlayerIndex) return;
    performRoll();
}

// O host valida que quem respondeu é o jogador da vez antes de aplicar a resposta.
function handleAnswerRequest(conn, optionIndex) {
    if (!questionInProgress || !currentQuestionData) return;
    const current = getCurrentPlayer();
    if (!current || current.id !== conn.assignedPlayerIndex) return;
    handleQuestionAnswer(optionIndex);
}

function generateRoomCode() {
    return 'SALA-' + Math.floor(1000 + Math.random() * 9000);
}
