// ============ BARALHO PADRÃO ============
// (a lista de tipos de casa especial válidos vem de js/data/tileTypes.js —
// SPECIAL_TILE_TYPE_IDS — pra não existir duas listas divergentes)
const DEFAULT_DECK = {
    nomeBaralho: 'Perguntas do Fundo do Mar',
    versao: '1.0',
    descricao: 'Baralho temático Bob Esponja',
    // Opcional: quais tipos de casa especial podem aparecer no tabuleiro
    // nesta partida. Omitir usa todos.
    efeitosCasasAtivos: ['avanco', 'voltar_2', 'pular_vez', 'trocar_lugar', 'pergunta_bonus'],
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
// (DEFAULT_DECK) SEM travar o jogo. Ver DOCUMENTACAO.md, Parte 6.
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
                '). Isso é normal se o jogo foi aberto direto do arquivo, sem servidor local — usando o banco padrão embutido.'
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
// selecionado no momento — usado por tabuleiro/casas.js/createTiles ao montar o
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

// Perguntas já sorteadas nesta sessão (pelo texto — ids não são obrigatórios
// nem únicos entre bancos). Evita repetir pergunta enquanto ainda houver
// alguma inédita no banco; quando todas já saíram, recomeça do zero em vez
// de travar (banco pequeno repete, mas o jogo nunca fica sem pergunta).
let askedQuestionKeys = new Set();

function getRandomQuestion() {
    const pool = getQuestionPool();
    if (!pool || pool.length === 0) {
        return DEFAULT_DECK.perguntas[Math.floor(Math.random() * DEFAULT_DECK.perguntas.length)];
    }
    let fresh = pool.filter((q) => !askedQuestionKeys.has(q.pergunta));
    if (fresh.length === 0) {
        askedQuestionKeys = new Set();
        fresh = pool;
    }
    const chosen = fresh[Math.floor(Math.random() * fresh.length)];
    askedQuestionKeys.add(chosen.pergunta);
    return chosen;
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
            !deck.efeitosCasasAtivos.every(
                (t) => SPECIAL_TILE_TYPE_IDS.includes(t) || LEGACY_TILE_TYPE_ALIASES[t] !== undefined
            )
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

// ============ CONSEQUÊNCIA DE UMA RESPOSTA ============
// Única tradução de "efeitoCasa" (do JSON da pergunta) em movimento. Usada
// tanto pra APLICAR a consequência (applyQuestionEffects) quanto pra
// DESCREVÊ-LA antes da pergunta (cartão da casa) e depois da resposta — o
// texto mostrado pro jogador nunca tem como divergir do que acontece de fato.
// { move: casas (+ frente, - trás, 0 nada), again: joga o dado de novo }
function getQuestionOutcome(isCorrect, effectAcerto, effectErro, isBonus) {
    const multiplier = isBonus ? 2 : 1;
    if (isCorrect) {
        switch (effectAcerto) {
            case 'avancar_1':
                return { move: 1 * multiplier, again: false };
            case 'avancar_2':
                return { move: 2 * multiplier, again: false };
            case 'jogar_novamente':
                return { move: 0, again: true };
            default:
                return { move: 0, again: false };
        }
    }
    switch (effectErro) {
        case 'voltar_1':
            return { move: -1 * multiplier, again: false };
        case 'voltar_2':
            return { move: -2 * multiplier, again: false };
        case 'nenhum':
            return { move: 0, again: false };
        default:
            return { move: -1, again: false };
    }
}

function getQuestionEffects(question) {
    return {
        acerto: (question && question.efeitoCasa && question.efeitoCasa.acerto) || 'avancar_1',
        erro: (question && question.efeitoCasa && question.efeitoCasa.erro) || 'voltar_2',
    };
}

// Frase curta, pra quem ainda está aprendendo a ler.
function describeOutcome(outcome) {
    if (outcome.again) return 'joga o dado de novo';
    if (outcome.move > 0) return 'anda ' + outcome.move + (outcome.move === 1 ? ' casa' : ' casas') + ' para frente';
    if (outcome.move < 0) {
        const n = -outcome.move;
        return 'volta ' + n + (n === 1 ? ' casa' : ' casas');
    }
    return 'fica onde está';
}

// ============ CONSEQUÊNCIA POR TIPO DE CASA ============
// A regra da pergunta (efeitoCasa, acima) ajustada pelo tipo da casa onde o
// jogador está. ÚNICA fonte do que acontece: o cartão da casa, o lembrete da
// pergunta, o texto do resultado e a aplicação (applyQuestionEffects) leem
// daqui — o que a criança lê é sempre o que acontece.
// options: { canSwap: há alguém mais atrás pra trocar, hasShield: tem bolha }
// Retorna { move, again, swap, stuck, anchored, coins, shieldUsed }.
function getTileQuestionOutcome(tileTypeId, isCorrect, effects, options = {}) {
    const isBonus = tileTypeId === 'pergunta_bonus';
    const base = getQuestionOutcome(isCorrect, effects.acerto, effects.erro, isBonus);
    const out = {
        move: base.move,
        again: base.again,
        swap: false,
        stuck: false,
        anchored: false,
        coins: isCorrect ? 1 : 0,
        shieldUsed: false,
    };
    switch (tileTypeId) {
        case 'avanco':
            out.move = isCorrect ? 3 : 0;
            out.again = false;
            break;
        case 'trocar_lugar':
            // Só troca quando ERRA (e se houver alguém mais atrás); acertar é
            // como numa casa comum.
            if (!isCorrect && options.canSwap) {
                out.move = 0;
                out.swap = true;
            }
            break;
        case 'alga':
            if (!isCorrect) {
                out.move = 0;
                out.stuck = true;
            }
            break;
        case 'vulcao':
            if (isCorrect) {
                out.move = Math.max(0, out.move) + 2;
                out.again = false;
            }
            break;
        case 'navio':
            if (isCorrect) out.coins += 2;
            break;
        case 'ancora':
            if (!isCorrect && out.move < 0) {
                out.move = 0;
                out.anchored = true;
            }
            break;
    }
    if (!isCorrect && options.hasShield && (out.move < 0 || out.swap || out.stuck)) {
        out.move = 0;
        out.swap = false;
        out.stuck = false;
        out.shieldUsed = true;
    }
    return out;
}

function getTileOutcomeOptions(playerIndex) {
    const player = gameState.players[playerIndex];
    const lastIdx = getLastPlaceIndex();
    return {
        canSwap: lastIdx !== -1 && lastIdx !== playerIndex && gameState.players[lastIdx].position < player.position,
        hasShield: (player.shields || 0) > 0,
        lastPlaceName: lastIdx !== -1 ? gameState.players[lastIdx].name : '',
    };
}

// Frase curta do que acontece (sem o nome de quem joga).
function describeTileOutcome(outcome, options = {}) {
    let text;
    if (outcome.shieldUsed) text = 'a bolha protetora te salva: fica onde está';
    else if (outcome.swap) text = 'troca de lugar com ' + (options.lastPlaceName || 'quem está mais atrás');
    else if (outcome.stuck) text = 'fica preso nas algas e perde a próxima vez';
    else if (outcome.anchored) text = 'a âncora segura: fica onde está';
    else text = describeOutcome(outcome);
    if (outcome.coins > 0) text += ' e ganha ' + outcome.coins + (outcome.coins === 1 ? ' moeda' : ' moedas');
    return text;
}

// ============ LÓGICA DE PERGUNTAS ============
// A pergunta é sorteada já aqui (antes do cartão da casa) porque o cartão
// mostra o que acontece se acertar/errar — e isso vem do efeitoCasa DA
// PERGUNTA. questionInProgress já fica true durante o cartão, então ninguém
// rola o dado nem responde nada enquanto ele está na tela.
function askQuestion(playerIndex, tileTypeId = 'normal') {
    if (!gameState || gameState.gameOver || questionInProgress) return;
    const player = gameState.players[playerIndex];
    const question = getRandomQuestion();
    if (!question) {
        nextTurn();
        return;
    }
    const tileType = getTileType(tileTypeId);
    const isBonus = tileType.type === 'pergunta_bonus';
    questionInProgress = true;
    gamePhase = GAME_PHASE.QUESTION;
    currentQuestionData = question;
    currentQuestionData.isBonus = isBonus;
    currentQuestionData.tileType = tileType.type;
    // Se a câmera está no enquadramento da casa especial, fica nele durante o
    // cartão (continueTileIntro volta pra câmera de jogo).
    if (cameraMode !== 'shot') setCameraFocus(playerIndex, { resetAngle: false });
    updateRollButton();

    const effects = getQuestionEffects(question);
    const options = getTileOutcomeOptions(playerIndex);
    const right = getTileQuestionOutcome(tileType.type, true, effects, options);
    const wrong = getTileQuestionOutcome(tileType.type, false, effects, options);
    const lines = [
        { kind: 'good', text: 'Se acertar: ' + describeTileOutcome(right, options) },
        { kind: 'bad', text: 'Se errar: ' + describeTileOutcome(wrong, options) },
    ];
    if (options.hasShield) lines.push({ kind: 'shield', text: player.name + ' tem uma bolha protetora!' });
    showTileIntro(
        {
            playerIndex: playerIndex,
            tileNumber: player.position + 1,
            tileType: tileType.type,
            color: tileType.type === 'normal' ? 0x40c4ff : tileType.color,
            title: tileType.type === 'normal' ? 'Hora da pergunta!' : tileType.label + '!',
            subtitle: isBonus ? 'Vale o dobro!' : player.name + ' vai responder.',
            lines: lines,
            buttonText: 'Puxar a carta',
            buttonIcon: 'cartas',
        },
        () => showQuestionModal(playerIndex, question, isBonus)
    );
}

function showQuestionModal(playerIndex, question, isBonus) {
    if (!gameState || gameState.gameOver || !questionInProgress) return;
    const player = gameState.players[playerIndex];
    if (isHost) {
        broadcastToGuests({ type: 'question_show', question: question });
    }
    // Bot, OU (em P2P) a vez de outro jogador: a carta aparece (dá pra
    // acompanhar), mas os botões ficam desabilitados.
    presentQuestionCard(question, player, isBonus, isPlayerLocallyControllable(player), () => {
        startQuestionTimer(question, document.getElementById('question-modal'));
        if (player.isBot) botAnswerQuestion();
    });
}

// A carta sai do monte (3D, cartas3d.js), chega na tela e vira mostrando a
// pergunta. O tempo da pergunta só começa (onReady) depois de virada.
function presentQuestionCard(question, player, isBonus, interactive, onReady) {
    const modal = document.getElementById('question-modal');
    playCardFromDeck(() => {
        if (!questionInProgress) return;
        playQuestionSound();
        modal.innerHTML = buildQuestionModalHTML(question, player, isBonus);
        modal.classList.remove('hidden', 'resolvida');
        modal.classList.add('modo-carta');
        const card = modal.querySelector('.question-card');
        const buttons = modal.querySelectorAll('.modal-option-btn');
        buttons.forEach((btn) => (btn.disabled = true));
        if (interactive) wireQuestionModalButtons(modal);
        // Dois quadros depois de entrar no DOM, senão a virada não anima.
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                card.classList.add('virada');
                playCardFlipSound();
            })
        );
        setTimeout(() => {
            if (!questionInProgress) return;
            if (interactive) buttons.forEach((btn) => (btn.disabled = false));
            if (onReady) onReady();
        }, TIMING.cardFlipMs);
    });
}

function buildQuestionModalHTML(question, player = null, isBonus = false) {
    const categoria = question.categoria || 'Geral';
    const tempo = question.tempoSegundos || 20;
    const playerName = player ? player.name : getCurrentPlayer() ? getCurrentPlayer().name : 'Jogador';
    const effects = getQuestionEffects(question);
    const tileTypeId = question.tileType || (isBonus ? 'pergunta_bonus' : 'normal');
    const tileType = getTileType(tileTypeId);
    const found = player ? gameState.players.indexOf(player) : -1;
    const options = getTileOutcomeOptions(found >= 0 ? found : gameState.currentPlayerIndex);
    const reminderHTML =
        '<div class="modal-stakes">' +
        '<span class="stake-good">' +
        iconSvg('ok') +
        describeTileOutcome(getTileQuestionOutcome(tileTypeId, true, effects, options), options) +
        '</span>' +
        '<span class="stake-bad">' +
        iconSvg('fechar') +
        describeTileOutcome(getTileQuestionOutcome(tileTypeId, false, effects, options), options) +
        '</span>' +
        '</div>';

    let optionsHTML = '';
    question.opcoes.forEach((opcao, idx) => {
        optionsHTML +=
            '<button class="modal-option-btn opt-' +
            idx +
            '" data-option-index="' +
            idx +
            '"><span class="opt-letter">' +
            String.fromCharCode(65 + idx) +
            '</span><span class="opt-text">' +
            opcao +
            '</span></button>';
    });

    const colorCss = '#' + (tileTypeId === 'normal' ? 0x40c4ff : tileType.color).toString(16).padStart(6, '0');
    return (
        '<div class="question-card' +
        (isBonus ? ' bonus' : '') +
        '" style="--card-color:' +
        colorCss +
        '">' +
        '<div class="qc-inner">' +
        // Verso (o que chega voando do monte).
        '<div class="qc-face qc-back"><div class="qc-emblem">' +
        iconSvg('pergunta') +
        '</div><div class="qc-back-title">Pergunta</div></div>' +
        // Frente: a pergunta.
        '<div class="qc-face qc-front">' +
        '<div class="qc-head"><span class="qc-tile-icon">' +
        iconSvg(tileType.icon || 'pergunta') +
        '</span><span class="modal-category">' +
        categoria +
        '</span>' +
        (isBonus ? '<span class="qc-bonus">Vale o dobro!</span>' : '') +
        '</div>' +
        '<div class="qc-who">' +
        playerName +
        ', responda:</div>' +
        '<div class="modal-question">' +
        question.pergunta +
        '</div>' +
        reminderHTML +
        '<div class="modal-timer">' +
        '<div class="timer-bar"><div class="timer-fill" id="question-timer-fill" style="width:100%;"></div></div>' +
        '<span class="timer-seconds" id="question-timer-seconds">' +
        tempo +
        '</span>' +
        '</div>' +
        '<div class="modal-options">' +
        optionsHTML +
        '</div>' +
        '<div class="qc-result-slot"></div>' +
        '</div>' +
        '</div>' +
        '</div>'
    );
}

// Resultado na própria carta: ela brilha (verde/vermelho), ganha um
// "carimbo", e depois de TIMING.answerResultMs sobe e some; then() roda
// quando a carta sumiu (é aí que o personagem anda).
function finishQuestionCard(isCorrect, outcomeText, then) {
    const modal = document.getElementById('question-modal');
    const card = modal && modal.querySelector('.question-card');
    if (card) {
        card.classList.add(isCorrect ? 'acertou' : 'errou');
        const slot = card.querySelector('.qc-result-slot');
        if (slot) slot.appendChild(buildAnswerResultElement(isCorrect, outcomeText));
        const stamp = document.createElement('div');
        stamp.className = 'qc-stamp';
        stamp.innerHTML =
            iconSvg(isCorrect ? 'estrela' : 'fechar') + '<span>' + (isCorrect ? 'Acertou!' : 'Errou!') + '</span>';
        card.appendChild(stamp);
        spawnCardBurst(card, isCorrect);
        // Depois do carimbo, a carta encolhe pro alto e o fundo clareia: dá
        // pra ver o personagem comemorando (ou murchando) no tabuleiro.
        setTimeout(() => modal.classList.add('resolvida'), 900);
    }
    setTimeout(() => {
        if (card) card.classList.add('saindo');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('resolvida', 'modo-carta');
            modal.innerHTML = '';
            returnCardToDeck();
            if (then) then();
        }, TIMING.cardExitMs);
    }, TIMING.answerResultMs);
}

// Estrelinhas/bolhas saindo da carta (só HTML/CSS, sem custo no 3D).
function spawnCardBurst(card, isCorrect) {
    const n = isCorrect ? 18 : 10;
    for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'qc-particle ' + (isCorrect ? 'good' : 'bad');
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const d = 120 + Math.random() * 120;
        p.style.setProperty('--dx', Math.cos(a) * d + 'px');
        p.style.setProperty('--dy', Math.sin(a) * d + 'px');
        p.style.animationDelay = Math.random() * 0.15 + 's';
        card.appendChild(p);
        setTimeout(() => p.remove(), 1400);
    }
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

    const isBonus = question.isBonus || false;
    const tileTypeId = question.tileType || (isBonus ? 'pergunta_bonus' : 'normal');
    const playerIdx = gameState.currentPlayerIndex;
    const effects = getQuestionEffects(question);
    const effectAcerto = effects.acerto;
    const effectErro = effects.erro;
    const options = getTileOutcomeOptions(playerIdx);
    const outcomeText = buildAnswerOutcomeText(
        gameState.players[playerIdx],
        isCorrect,
        getTileQuestionOutcome(tileTypeId, isCorrect, effects, options),
        optionIndex < 0,
        options
    );

    playPawnReaction(playerIdx, isCorrect ? 'comemorar' : 'frustrar');
    if (isCorrect) {
        playCorrectSound();
        hapticFeedback('correct');
    } else {
        playIncorrectSound();
        hapticFeedback('incorrect');
    }

    // O resultado vai pros convidados JÁ (junto com o que aparece aqui), não
    // só quando o modal fecha — senão eles viam o resultado bem depois.
    if (isHost) {
        broadcastToGuests({ type: 'question_result', correct: isCorrect, playerIndex: playerIdx, outcomeText });
    }

    finishQuestionCard(isCorrect, outcomeText, () =>
        applyQuestionEffects(playerIdx, isCorrect, effectAcerto, effectErro, isBonus, tileTypeId)
    );
}

// "Acertou!" / "Errou!" + o que vai acontecer agora, numa frase só.
function buildAnswerOutcomeText(player, isCorrect, outcome, timedOut, options) {
    const name = player ? player.name : 'Jogador';
    const prefix = timedOut ? 'O tempo acabou. ' : '';
    return prefix + name + ' ' + describeTileOutcome(outcome, options) + '.';
}

function buildAnswerResultElement(isCorrect, outcomeText) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'modal-result-text ' + (isCorrect ? 'correct' : 'incorrect');
    const title = document.createElement('div');
    title.className = 'modal-result-title';
    title.textContent = isCorrect ? 'Acertou!' : 'Errou!';
    resultDiv.appendChild(title);
    if (outcomeText) {
        const detail = document.createElement('div');
        detail.className = 'modal-result-detail';
        detail.textContent = outcomeText;
        resultDiv.appendChild(detail);
    }
    return resultDiv;
}

// Exibe a pergunta recebida do host na tela de um jogador convidado.
function showQuestionForGuest(question) {
    if (!question) return;
    questionInProgress = true;
    gamePhase = GAME_PHASE.QUESTION;
    currentQuestionData = question;
    updateRollButton();
    // 'question_show' vai pra TODOS os convidados, não só pro dono da vez —
    // cada tela checa se é a própria vez antes de deixar responder.
    const player = getCurrentPlayer();
    presentQuestionCard(question, player, question.isBonus || false, isPlayerLocallyControllable(player), () =>
        startQuestionTimer(question, document.getElementById('question-modal'))
    );
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

    finishQuestionCard(isCorrect, data.outcomeText);
    if (typeof data.playerIndex === 'number') playPawnReaction(data.playerIndex, isCorrect ? 'comemorar' : 'frustrar');

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
}

function applyQuestionEffects(playerIndex, isCorrect, effectAcerto, effectErro, isBonus, tileTypeId) {
    if (!gameState || gameState.gameOver) return;
    const player = gameState.players[playerIndex];
    const currentPos = player.position;
    const typeId = tileTypeId || (isBonus ? 'pergunta_bonus' : 'normal');
    const outcome = getTileQuestionOutcome(
        typeId,
        isCorrect,
        { acerto: effectAcerto, erro: effectErro },
        getTileOutcomeOptions(playerIndex)
    );

    if (outcome.shieldUsed) {
        player.shields = Math.max(0, (player.shields || 0) - 1);
        showShieldUsed(playerIndex);
        updateHUD();
    }
    if (outcome.coins > 0) awardCoins(playerIndex, outcome.coins);
    if (outcome.stuck) player.skipNextTurn = true;

    if (outcome.swap) {
        const swapped = swapWithLastPlace(playerIndex);
        // A troca anima por ~0,7 s (updatePawnPosition); a vez só passa depois.
        setTimeout(() => nextTurn(), (swapped ? 700 : 0) + TIMING.postEffectPauseMs);
        return;
    }
    if (outcome.move !== 0) {
        const newPos = Math.max(0, Math.min(currentPos + outcome.move, gameState.boardLength - 1));
        // Empurrão de várias casas (corrente, vulcão): enquadramento mais aberto.
        if (outcome.move >= 3) {
            setCameraFocus(playerIndex, { wide: true });
            playAdvanceSound();
        }
        movePlayer(playerIndex, newPos, () => {
            if (isHost) {
                broadcastToGuests({ type: 'pawn_move', playerIndex: playerIndex, position: newPos });
            }
            setTimeout(() => continueAfterMove(playerIndex), TIMING.postEffectPauseMs);
        });
        return;
    }
    if (outcome.again) {
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
        showTurnToast(player, 'joga de novo!');
        if (player.isBot && !gameState.gameOver) {
            setTimeout(() => botPlay(), TIMING.botTurnDelayMs);
        }
        return;
    }
    nextTurn();
}
