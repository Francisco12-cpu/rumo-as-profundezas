// ============ BARALHO PADRÃO ============
// (a lista de tipos de casa especial válidos vem de js/data/tileTypes.js —
// SPECIAL_TILE_TYPE_IDS — pra não existir duas listas divergentes)
const DEFAULT_DECK = {
    nomeBaralho: 'Perguntas do Fundo do Mar',
    versao: '1.0',
    descricao: 'Baralho temático Bob Esponja',
    // Opcional: quais tipos de casa especial podem aparecer no tabuleiro
    // nesta partida. Omitir usa todos.
    efeitosCasasAtivos: ['avancar_2', 'voltar_2', 'pular_vez', 'trocar_lugar', 'pergunta_bonus'],
    perguntas: [
        {
            id: 1,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é o nome do caracol de estimação do Bob Esponja?',
            opcoes: ['Gary', 'Larry', 'Jerry', 'Terry'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 2,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é a cor da casa do Bob Esponja?',
            opcoes: ['Rosa', 'Azul', 'Amarela', 'Verde'],
            respostaCorreta: 2,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 3,
            categoria: 'Conhecimentos Gerais',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é a capital da França?',
            opcoes: ['Londres', 'Paris', 'Madri', 'Berlim'],
            respostaCorreta: 1,
            tempoSegundos: 20,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 4,
            categoria: 'Ciência',
            tipo: 'verdadeiro_falso',
            pergunta: 'O Sol é uma estrela.',
            opcoes: ['Verdadeiro', 'Falso'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'jogar_novamente', erro: 'nenhum' },
        },
        {
            id: 5,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é o nome do restaurante onde Bob Esponja trabalha?',
            opcoes: ['Siri Cascudo', 'Hambúrguer Feliz', 'Lanche do Mar', 'Fritas Crocantes'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 6,
            categoria: 'Geografia',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é o maior oceano do mundo?',
            opcoes: ['Atlântico', 'Pacífico', 'Índico', 'Ártico'],
            respostaCorreta: 1,
            tempoSegundos: 20,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 7,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Quem é o melhor amigo do Bob Esponja?',
            opcoes: ['Patrick', 'Lula Molusco', 'Sandy', 'Plankton'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'jogar_novamente', erro: 'nenhum' },
        },
        {
            id: 8,
            categoria: 'História',
            tipo: 'multipla_escolha',
            pergunta: 'Em que ano o homem pisou na Lua?',
            opcoes: ['1965', '1969', '1972', '1959'],
            respostaCorreta: 1,
            tempoSegundos: 20,
            efeitoCasa: { acerto: 'avancar_2', erro: 'voltar_2' },
        },
        {
            id: 9,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é o nome do vilão que quer roubar a fórmula do hambúrguer?',
            opcoes: ['Plankton', 'Man Ray', 'Bolha Suja', 'Larry'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 10,
            categoria: 'Conhecimentos Gerais',
            tipo: 'multipla_escolha',
            pergunta: 'Quantos continentes existem?',
            opcoes: ['5', '6', '7', '8'],
            respostaCorreta: 2,
            tempoSegundos: 20,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 11,
            categoria: 'Bob Esponja',
            tipo: 'verdadeiro_falso',
            pergunta: 'Bob Esponja mora em um abacaxi.',
            opcoes: ['Verdadeiro', 'Falso'],
            respostaCorreta: 0,
            tempoSegundos: 10,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 12,
            categoria: 'Esportes',
            tipo: 'multipla_escolha',
            pergunta: 'Qual país venceu a Copa do Mundo de 2018?',
            opcoes: ['Alemanha', 'Brasil', 'França', 'Argentina'],
            respostaCorreta: 2,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 13,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é o nome da esquilo que mora no fundo do mar?',
            opcoes: ['Sandy', 'Cindy', 'Mandy', 'Wendy'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'jogar_novamente', erro: 'nenhum' },
        },
        {
            id: 14,
            categoria: 'Matemática',
            tipo: 'multipla_escolha',
            pergunta: 'Quanto é 7 × 8?',
            opcoes: ['54', '56', '58', '62'],
            respostaCorreta: 1,
            tempoSegundos: 10,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
        {
            id: 15,
            categoria: 'Bob Esponja',
            tipo: 'multipla_escolha',
            pergunta: 'Qual é o nome do chefe do Bob Esponja?',
            opcoes: ['Sr. Siriguejo', 'Sr. Caranguejo', 'Sr. Lagosta', 'Sr. Camarão'],
            respostaCorreta: 0,
            tempoSegundos: 15,
            efeitoCasa: { acerto: 'avancar_1', erro: 'voltar_2' },
        },
    ],
};

let activeDeck = null;

function loadDeckFromStorage() {
    try {
        const saved = localStorage.getItem('trivia3d_deck');
        if (saved) {
            activeDeck = JSON.parse(saved);
            return true;
        }
    } catch (e) {}
    activeDeck = JSON.parse(JSON.stringify(DEFAULT_DECK));
    return false;
}

function saveDeckToStorage(deck) {
    try {
        localStorage.setItem('trivia3d_deck', JSON.stringify(deck));
        activeDeck = deck;
        return true;
    } catch (e) {
        return false;
    }
}

function hasCustomDeck() {
    try {
        return !!localStorage.getItem('trivia3d_deck');
    } catch (e) {
        return false;
    }
}

// ============ BANCOS DE PERGUNTAS EXTERNOS ============
// Carrega data/questions/manifest.json + cada banco listado nele. Se algo
// falhar (JSON quebrado, arquivo faltando, ou o jogo tiver sido aberto direto
// do disco sem servidor — fetch() de arquivo local é bloqueado por CORS nos
// principais navegadores), cai de volta pro banco padrão embutido no código
// (DEFAULT_DECK) SEM travar o jogo. Ver data/questions/README.md.
const QUESTION_BANKS_BASE_URL = 'data/questions/';
let availableBanks = [
    {
        id: 'default',
        nome: DEFAULT_DECK.nomeBaralho,
        perguntas: DEFAULT_DECK.perguntas,
        efeitosCasasAtivos: DEFAULT_DECK.efeitosCasasAtivos,
    },
];
let bankLoadIssues = [];
// selectedBankId mora em config.js junto do resto do estado de seleção da
// partida (boardLength, selectedColors, etc.).

async function loadQuestionBanks() {
    bankLoadIssues = [];
    try {
        const manifestRes = await fetch(QUESTION_BANKS_BASE_URL + 'manifest.json');
        if (!manifestRes.ok) throw new Error('HTTP ' + manifestRes.status);
        const manifest = await manifestRes.json();
        const entries = Array.isArray(manifest.bancos) ? manifest.bancos : [];
        const loaded = [];
        for (const entry of entries) {
            try {
                const res = await fetch(QUESTION_BANKS_BASE_URL + entry.arquivo);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const deck = await res.json();
                const result = validateDeck(deck);
                if (!result.valid) {
                    const msg =
                        entry.arquivo +
                        ': ' +
                        result.errors[0] +
                        (result.errors.length > 1 ? ' (+' + (result.errors.length - 1) + ')' : '');
                    console.warn('[bancos de perguntas] ' + msg);
                    bankLoadIssues.push(msg);
                    continue;
                }
                loaded.push({
                    id: entry.id || entry.arquivo,
                    nome: deck.nomeBaralho || entry.id,
                    perguntas: deck.perguntas,
                    efeitosCasasAtivos: deck.efeitosCasasAtivos,
                });
            } catch (fileErr) {
                const msg = entry.arquivo + ': ' + fileErr.message;
                console.warn('[bancos de perguntas] não consegui carregar ' + msg);
                bankLoadIssues.push(msg);
            }
        }
        if (loaded.length > 0) {
            availableBanks = loaded;
        } else {
            console.warn('[bancos de perguntas] nenhum banco externo válido — usando o banco padrão embutido.');
        }
    } catch (e) {
        console.warn(
            '[bancos de perguntas] não consegui carregar data/questions/manifest.json (' +
                e.message +
                '). Isso é normal se o jogo foi aberto direto do arquivo, sem servidor local — usando o banco padrão embutido. Veja data/questions/README.md.'
        );
    }
    if (typeof refreshBankSelectOptions === 'function') refreshBankSelectOptions();
}

// Junta os bancos carregados de data/questions/ com o baralho "Personalizado"
// (o que o usuário colou/editou pela tela Gerenciar Perguntas), quando existir.
function getAllSelectableBanks() {
    const banks = availableBanks.slice();
    if (hasCustomDeck() && activeDeck && Array.isArray(activeDeck.perguntas) && activeDeck.perguntas.length) {
        banks.push({
            id: 'custom',
            nome: activeDeck.nomeBaralho || 'Personalizado',
            perguntas: activeDeck.perguntas,
            efeitosCasasAtivos: activeDeck.efeitosCasasAtivos,
        });
    }
    return banks;
}

function getQuestionPool() {
    const banks = getAllSelectableBanks();
    const bank = banks.find((b) => b.id === selectedBankId);
    if (selectedBankId === 'all' || !bank) {
        return banks.reduce((acc, b) => acc.concat(b.perguntas || []), []);
    }
    return bank.perguntas || [];
}

// Efeitos de casa especial ativos pro banco (ou combinação de bancos)
// selecionado no momento — usado por scene.js/createTiles ao montar o
// tabuleiro. Retorna null quando deve usar todos os tipos.
function getActiveEfeitosCasasAtivos() {
    const banks = getAllSelectableBanks();
    if (selectedBankId !== 'all') {
        const bank = banks.find((b) => b.id === selectedBankId);
        return bank && Array.isArray(bank.efeitosCasasAtivos) ? bank.efeitosCasasAtivos : null;
    }
    if (banks.some((b) => !Array.isArray(b.efeitosCasasAtivos))) return null;
    const union = new Set();
    banks.forEach((b) => (b.efeitosCasasAtivos || []).forEach((t) => union.add(t)));
    return Array.from(union);
}

function getRandomQuestion() {
    const pool = getQuestionPool();
    if (!pool || pool.length === 0) {
        return DEFAULT_DECK.perguntas[Math.floor(Math.random() * DEFAULT_DECK.perguntas.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// Valida a estrutura de um baralho carregado pelo usuário. Retorna
// { valid, errors } em vez de travar o jogo com um JSON mal formado
// (ex.: pergunta sem opções, respostaCorreta fora do intervalo, tipo desconhecido).
const VALID_QUESTION_TYPES = ['multipla_escolha', 'verdadeiro_falso'];

function validateDeck(deck) {
    const errors = [];
    if (!deck || typeof deck !== 'object') {
        return { valid: false, errors: ['O baralho precisa ser um objeto JSON.'] };
    }
    if (!Array.isArray(deck.perguntas)) {
        return { valid: false, errors: ['O baralho precisa ter um array "perguntas".'] };
    }
    if (deck.perguntas.length === 0) {
        errors.push('O baralho não tem nenhuma pergunta.');
    }
    if (deck.efeitosCasasAtivos !== undefined) {
        if (
            !Array.isArray(deck.efeitosCasasAtivos) ||
            !deck.efeitosCasasAtivos.every((t) => SPECIAL_TILE_TYPE_IDS.includes(t))
        ) {
            errors.push(
                '"efeitosCasasAtivos", se usado, precisa ser uma lista com valores entre: ' +
                    SPECIAL_TILE_TYPE_IDS.join(', ') +
                    '.'
            );
        }
    }
    deck.perguntas.forEach((q, i) => {
        const label = 'Pergunta ' + (i + 1) + (q && q.id !== undefined ? ' (id ' + q.id + ')' : '');
        if (!q || typeof q !== 'object') {
            errors.push(label + ': não é um objeto válido.');
            return;
        }
        if (!q.pergunta || typeof q.pergunta !== 'string' || !q.pergunta.trim()) {
            errors.push(label + ': falta o texto da pergunta ("pergunta").');
        }
        if (!q.categoria || typeof q.categoria !== 'string') {
            errors.push(label + ': falta a "categoria".');
        }
        const tipo = q.tipo || 'multipla_escolha';
        if (!VALID_QUESTION_TYPES.includes(tipo)) {
            errors.push(label + ': "tipo" inválido (' + tipo + '). Use ' + VALID_QUESTION_TYPES.join(' ou ') + '.');
        }
        if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) {
            errors.push(label + ': "opcoes" precisa ser uma lista com pelo menos 2 itens.');
        } else if (
            typeof q.respostaCorreta !== 'number' ||
            q.respostaCorreta < 0 ||
            q.respostaCorreta >= q.opcoes.length ||
            !Number.isInteger(q.respostaCorreta)
        ) {
            errors.push(
                label + ': "respostaCorreta" precisa ser o índice (0 a ' + (q.opcoes.length - 1) + ') da opção certa.'
            );
        }
        if (q.tempoSegundos !== undefined && (typeof q.tempoSegundos !== 'number' || q.tempoSegundos <= 0)) {
            errors.push(label + ': "tempoSegundos" precisa ser um número maior que zero.');
        }
    });
    return { valid: errors.length === 0, errors };
}

function openDeckManager() {
    initAudio();
    if (!activeDeck) loadDeckFromStorage();
    document.getElementById('deck-textarea').value = JSON.stringify(activeDeck, null, 2);
    document.getElementById('deck-modal').classList.remove('hidden');
}

function closeDeckManager() {
    document.getElementById('deck-modal').classList.add('hidden');
}

function saveDeckFromTextarea() {
    const textarea = document.getElementById('deck-textarea');
    try {
        const parsed = JSON.parse(textarea.value);
        const result = validateDeck(parsed);
        if (!result.valid) {
            alert(
                'Baralho com problemas:\n\n' +
                    result.errors.slice(0, 8).join('\n') +
                    (result.errors.length > 8 ? '\n...e mais ' + (result.errors.length - 8) + ' erro(s).' : '')
            );
            return;
        }
        if (saveDeckToStorage(parsed)) {
            playCorrectSound();
            alert('Baralho salvo com sucesso! (' + parsed.perguntas.length + ' pergunta(s))');
        }
    } catch (e) {
        alert('JSON inválido: ' + e.message);
    }
}

function loadDefaultDeck() {
    activeDeck = JSON.parse(JSON.stringify(DEFAULT_DECK));
    document.getElementById('deck-textarea').value = JSON.stringify(activeDeck, null, 2);
    saveDeckToStorage(activeDeck);
    alert('Baralho padrão carregado!');
}

function exportDeck() {
    const textarea = document.getElementById('deck-textarea');
    try {
        const parsed = JSON.parse(textarea.value);
        const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (parsed.nomeBaralho || 'baralho') + '.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('JSON inválido: ' + e.message);
    }
}

// ============ LÓGICA DE PERGUNTAS ============
function askQuestion(playerIndex, isBonus = false) {
    if (!gameState || gameState.gameOver || questionInProgress) return;
    const player = gameState.players[playerIndex];
    const question = getRandomQuestion();
    if (!question) {
        nextTurn();
        return;
    }
    questionInProgress = true;
    gamePhase = GAME_PHASE.QUESTION;
    currentQuestionData = question;
    currentQuestionData.isBonus = isBonus;
    setCameraFocus(playerIndex);
    updateRollButton();

    playQuestionSound();
    const modal = document.getElementById('question-modal');
    modal.classList.remove('hidden');
    modal.innerHTML = buildQuestionModalHTML(question, player, isBonus);
    if (isPlayerLocallyControllable(player)) {
        wireQuestionModalButtons(modal);
    } else {
        // Bot, OU (em P2P) a vez de outro jogador que não é o próprio host:
        // os botões ficam visíveis (dá pra acompanhar a pergunta) mas
        // desabilitados, pra quem está olhando esta tela não conseguir
        // responder no lugar de quem realmente está jogando.
        modal.querySelectorAll('.modal-option-btn').forEach((btn) => (btn.disabled = true));
    }
    startQuestionTimer(question, modal);

    if (isHost) {
        broadcastToGuests({ type: 'question_show', question: question });
    }

    if (player.isBot) {
        botAnswerQuestion();
    }
}

function buildQuestionModalHTML(question, player = null, isBonus = false) {
    const categoria = question.categoria || 'Geral';
    const tempo = question.tempoSegundos || 20;
    const playerName = player ? player.name : getCurrentPlayer() ? getCurrentPlayer().name : 'Jogador';
    const bonusText = isBonus ? ' (Bônus 2x)' : '';

    let optionsHTML = '';
    question.opcoes.forEach((opcao, idx) => {
        optionsHTML +=
            '<button class="modal-option-btn" data-option-index="' +
            idx +
            '">' +
            String.fromCharCode(65 + idx) +
            '. ' +
            opcao +
            '</button>';
    });

    return (
        '<div class="modal-card">' +
        '<div><span class="modal-category">' +
        categoria +
        '</span></div>' +
        '<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">' +
        playerName +
        bonusText +
        ', responda:</div>' +
        '<div class="modal-question">' +
        question.pergunta +
        '</div>' +
        '<div class="modal-timer">' +
        '<span>Tempo</span>' +
        '<div class="timer-bar"><div class="timer-fill" id="question-timer-fill" style="width:100%;"></div></div>' +
        '<span id="question-timer-seconds">' +
        tempo +
        '</span>' +
        '</div>' +
        '<div class="modal-options">' +
        optionsHTML +
        '</div>' +
        '</div>'
    );
}

// As opções são geradas via innerHTML (buildQuestionModalHTML), então os
// listeners de clique só podem ser ligados depois que o HTML entra no DOM.
function wireQuestionModalButtons(modal) {
    modal.querySelectorAll('.modal-option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            handleQuestionAnswer(parseInt(btn.getAttribute('data-option-index'), 10));
        });
    });
}

function startQuestionTimer(question, modal) {
    if (questionTimer) clearInterval(questionTimer);
    const totalTime = question.tempoSegundos || 20;
    let timeLeft = totalTime;
    const fill = modal ? modal.querySelector('#question-timer-fill') : document.querySelector('#question-timer-fill');
    const secondsLabel = modal
        ? modal.querySelector('#question-timer-seconds')
        : document.querySelector('#question-timer-seconds');

    questionTimer = setInterval(() => {
        timeLeft--;
        if (fill) {
            const pct = (timeLeft / totalTime) * 100;
            fill.style.width = pct + '%';
            fill.className = 'timer-fill' + (pct < 25 ? ' danger' : pct < 50 ? ' warning' : '');
        }
        if (secondsLabel) secondsLabel.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(questionTimer);
            handleQuestionAnswer(-1, true);
        }
    }, 1000);
}

function handleQuestionAnswer(optionIndex, isBotAuto = false) {
    if (!questionInProgress || !currentQuestionData) return;
    if (questionTimer) clearInterval(questionTimer);
    questionInProgress = false;

    // Cliente convidado: apenas trava a escolha na UI e manda o pedido pro host.
    // O resultado real (certo/errado, efeitos, avanço no tabuleiro) só chega
    // via broadcast 'question_result' / 'pawn_move' do host, que é quem decide.
    if (isGuest) {
        const modal = document.getElementById('question-modal');
        if (modal) {
            modal.querySelectorAll('.modal-option-btn').forEach((btn, idx) => {
                btn.disabled = true;
                if (idx === optionIndex) btn.style.opacity = '0.6';
            });
        }
        sendToHost({ type: 'answer_request', optionIndex: optionIndex });
        return;
    }

    const question = currentQuestionData;
    const correctIndex = question.respostaCorreta;
    const isCorrect = optionIndex === correctIndex;
    const modal = document.getElementById('question-modal');

    const optionButtons = modal.querySelectorAll('.modal-option-btn');
    optionButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctIndex) btn.classList.add('correct');
        if (idx === optionIndex && idx !== correctIndex) btn.classList.add('incorrect');
    });

    const resultDiv = document.createElement('div');
    resultDiv.className = 'modal-result-text ' + (isCorrect ? 'correct' : 'incorrect');
    resultDiv.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!';
    const card = modal.querySelector('.modal-card');
    card.appendChild(resultDiv);

    if (isCorrect) {
        playCorrectSound();
        hapticFeedback('correct');
        if (Math.random() < 0.5) spawnBubbles(pawns[gameState.currentPlayerIndex].position.clone(), 20);
    } else {
        playIncorrectSound();
        hapticFeedback('incorrect');
    }

    const isBonus = question.isBonus || false;
    const playerIdx = gameState.currentPlayerIndex;
    const effectAcerto = question.efeitoCasa?.acerto || 'avancar_1';
    const effectErro = question.efeitoCasa?.erro || 'voltar_2';

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.innerHTML = '';
        if (isHost) {
            broadcastToGuests({ type: 'question_result', correct: isCorrect, playerIndex: playerIdx });
        }
        applyQuestionEffects(playerIdx, isCorrect, effectAcerto, effectErro, isBonus);
    }, 1400);
}

// Exibe a pergunta recebida do host na tela de um jogador convidado.
function showQuestionForGuest(question) {
    if (!question) return;
    questionInProgress = true;
    gamePhase = GAME_PHASE.QUESTION;
    currentQuestionData = question;
    updateRollButton();

    playQuestionSound();
    const modal = document.getElementById('question-modal');
    modal.classList.remove('hidden');
    modal.innerHTML = buildQuestionModalHTML(question, getCurrentPlayer(), question.isBonus || false);
    // A mensagem 'question_show' vai pra TODOS os convidados, não só pro
    // dono da vez — então cada tela de convidado também precisa checar se é
    // realmente a própria vez antes de deixar os botões clicáveis (senão um
    // convidado poderia clicar tentando responder pela vez de outro).
    if (isPlayerLocallyControllable(getCurrentPlayer())) {
        wireQuestionModalButtons(modal);
    } else {
        modal.querySelectorAll('.modal-option-btn').forEach((btn) => (btn.disabled = true));
    }
    startQuestionTimer(question, modal);
}

// Revela o resultado (certo/errado) que o host apurou, no cliente do convidado.
function handleQuestionResultForGuest(data) {
    const modal = document.getElementById('question-modal');
    if (!modal || modal.classList.contains('hidden') || !currentQuestionData) {
        currentQuestionData = null;
        questionInProgress = false;
        return;
    }

    const isCorrect = !!data.correct;
    const correctIndex = currentQuestionData.respostaCorreta;
    const optionButtons = modal.querySelectorAll('.modal-option-btn');
    optionButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === correctIndex) btn.classList.add('correct');
    });

    const card = modal.querySelector('.modal-card');
    if (card) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'modal-result-text ' + (isCorrect ? 'correct' : 'incorrect');
        resultDiv.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!';
        card.appendChild(resultDiv);
    }

    if (isCorrect) {
        playCorrectSound();
        hapticFeedback('correct');
    } else {
        playIncorrectSound();
        hapticFeedback('incorrect');
    }

    currentQuestionData = null;
    questionInProgress = false;
    updateRollButton();
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.innerHTML = '';
    }, 1400);
}

function applyQuestionEffects(playerIndex, isCorrect, effectAcerto, effectErro, isBonus) {
    if (!gameState || gameState.gameOver) return;
    const player = gameState.players[playerIndex];
    const currentPos = player.position;
    const bonusMultiplier = isBonus ? 2 : 1;

    if (isCorrect) {
        let extraMove = 0;
        switch (effectAcerto) {
            case 'avancar_1':
                extraMove = 1 * bonusMultiplier;
                break;
            case 'avancar_2':
                extraMove = 2 * bonusMultiplier;
                break;
            case 'jogar_novamente':
                extraMove = 0;
                break;
            case 'nenhum':
                extraMove = 0;
                break;
            default:
                extraMove = 0;
        }
        if (extraMove > 0) {
            const newPos = Math.min(currentPos + extraMove, gameState.boardLength - 1);
            movePlayer(playerIndex, newPos, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: newPos });
                }
                setTimeout(() => nextTurn(), 400);
            });
            return;
        }
        if (effectAcerto === 'jogar_novamente') {
            // Mesmo jogador continua a vez — não passa por nextTurn(), então
            // precisa resetar a fase manualmente aqui. Sem isso, gamePhase
            // fica travado em QUESTION pra sempre (só nextTurn() volta pra
            // IDLE) e performRoll() ignora todo clique seguinte em "Rolar
            // dado" (trava justamente pra evitar jogada dupla) — o jogo
            // parece travado na vez de quem acertou "jogar novamente".
            gamePhase = GAME_PHASE.IDLE;
            updateHUD();
            updateRollButton();
            // Pelo mesmo motivo (não passa por nextTurn()), se quem acertou
            // for um bot ninguém nunca chamaria botPlay() de novo pra ele —
            // é nextTurn() quem normalmente agenda isso. Sem isto, um bot
            // que tira "jogar novamente" trava o jogo do mesmo jeito (a vez
            // dele nunca avança porque não é humano pra clicar no botão).
            if (player.isBot && !gameState.gameOver) {
                setTimeout(() => botPlay(), 1500);
            }
            return;
        }
        nextTurn();
    } else {
        let penaltyMove = 0;
        switch (effectErro) {
            case 'voltar_1':
                penaltyMove = 1 * (isBonus ? 2 : 1);
                break;
            case 'voltar_2':
                penaltyMove = 2 * (isBonus ? 2 : 1);
                break;
            case 'nenhum':
                penaltyMove = 0;
                break;
            default:
                penaltyMove = 1;
        }
        if (penaltyMove > 0) {
            const newPos = Math.max(currentPos - penaltyMove, 0);
            movePlayer(playerIndex, newPos, () => {
                if (isHost) {
                    broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: newPos });
                }
                setTimeout(() => nextTurn(), 400);
            });
            return;
        }
        nextTurn();
    }
}
