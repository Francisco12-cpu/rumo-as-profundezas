// Testes de lógica do jogo (sem navegador). Roda com: node test/run.js
// (ou `npm test`). Cobre regras de turno, movimento, efeitos de pergunta e
// validação de baralho — a parte que realmente decide se o jogo "funciona
// certo", sem precisar abrir um navegador pra descobrir que uma regra quebrou.
'use strict';
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { loadGame, Vec3 } = require('./mocks');

const tests = [];
function test(name, fn) {
    tests.push({ name, fn });
}

function run(sandbox, fnBody) {
    const vm = require('vm');
    return vm.runInContext('(' + fnBody.toString() + ')()', sandbox, { filename: 'test-eval' });
}

// ---------------------------------------------------------------------------

test('createGameState: modo solo com 1 bot cria 2 jogadores, o segundo é bot', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const state = run(sandbox, () => {
        currentMode = 'solo';
        numBots = 1;
        selectedColors = [0, 1];
        return createGameState();
    });
    assert.equal(state.players.length, 2);
    assert.equal(state.players[0].isBot, false);
    assert.equal(state.players[1].isBot, true);
});

test('createGameState: modo local com 3 jogadores, nenhum bot', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const state = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 3;
        selectedColors = [0, 1, 2];
        return createGameState();
    });
    assert.equal(state.players.length, 3);
    assert.ok(state.players.every((p) => p.isBot === false));
});

test('movePlayer: nunca deixa a posição passar do fim do tabuleiro', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const finalPos = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 2;
        selectedColors = [0, 1];
        boardLength = 5;
        gameState = createGameState();
        pawns = [{ position: { x: 0, y: 0, z: 0, clone: () => ({ x: 0, y: 0, z: 0 }) } }, { position: { clone: () => ({}) } }];
        particlesGroup = { add() {}, children: [] };
        camera = { position: new THREE.Vector3() };
        controls = { target: new THREE.Vector3() };
        movePlayer(0, 999, null);
        return gameState.players[0].position;
    });
    assert.equal(finalPos, 4); // boardLength - 1
});

test('performRoll: trava contra jogada dupla (não reinicia se já não estiver em IDLE)', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 1;
        selectedColors = [0];
        boardLength = 20;
        gameState = createGameState();
        pawns = [{ position: new THREE.Vector3() }];
        camera = { position: new THREE.Vector3() };
        controls = { target: new THREE.Vector3() };
        diceMesh = { position: new THREE.Vector3(0, 3, -2), rotation: new THREE.Vector3() };
        diceGroup = { visible: false, scale: new THREE.Vector3(1, 1, 1) };
        gamePhase = GAME_PHASE.IDLE;
        performRoll();
        const phaseAfterFirst = gamePhase;
        const rollFlagAfterFirst = rollInProgress;
        const resultAfterFirst = gameState.diceResult;
        performRoll(); // segunda chamada imediata: gamePhase já não é IDLE, deve ser ignorada
        return {
            phaseAfterFirst,
            rollFlagAfterFirst,
            phaseAfterSecond: gamePhase,
            resultUnchanged: gameState.diceResult === resultAfterFirst,
        };
    });
    assert.equal(result.phaseAfterFirst, 'rolling');
    assert.equal(result.rollFlagAfterFirst, true);
    assert.equal(result.phaseAfterSecond, 'rolling');
    assert.equal(result.resultUnchanged, true);
});

test('movePlayer: chegar na última casa marca o jogo como vencido', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const state = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 2;
        selectedColors = [0, 1];
        boardLength = 5;
        gameState = createGameState();
        pawns = [{ position: { clone: () => ({ x: 0, y: 0, z: 0 }) } }, { position: { clone: () => ({ x: 0, y: 0, z: 0 }) } }];
        particlesGroup = { add() {}, children: [] };
        camera = { position: new THREE.Vector3() };
        controls = { target: new THREE.Vector3() };
        movePlayer(1, 4, null);
        return gameState;
    });
    assert.equal(state.gameOver, true);
    assert.equal(state.winner, 1);
});

test('nextTurn: pula corretamente um jogador marcado com skipNextTurn', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 3;
        selectedColors = [0, 1, 2];
        gameState = createGameState();
        pawns = [{ position: new THREE.Vector3() }, { position: new THREE.Vector3() }, { position: new THREE.Vector3() }];
        camera = { position: new THREE.Vector3() };
        controls = { target: new THREE.Vector3() };
        gameState.players[1].skipNextTurn = true;
        gameState.currentPlayerIndex = 0;
        nextTurn();
        return { current: gameState.currentPlayerIndex, skipReset: gameState.players[1].skipNextTurn };
    });
    assert.equal(result.current, 2); // pulou o jogador 1
    assert.equal(result.skipReset, true); // flag do jogador pulado continua marcada (só é limpa quando é a vez dele de novo)
});

test('applyQuestionEffects: acerto com efeito avancar_1 move +1 casa', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const pos = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 1;
        selectedColors = [0];
        boardLength = 30;
        gameState = createGameState();
        pawns = [{ position: { clone: () => ({}) } }];
        particlesGroup = { add() {}, children: [] };
        applyQuestionEffects(0, true, 'avancar_1', 'voltar_1', false);
        return gameState.players[0].position;
    });
    assert.equal(pos, 1);
});

test('applyQuestionEffects: erro com efeito voltar_1 move -1 casa (sem passar de 0)', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const pos = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 1;
        selectedColors = [0];
        boardLength = 30;
        gameState = createGameState();
        pawns = [{ position: { clone: () => ({}) } }];
        particlesGroup = { add() {}, children: [] };
        applyQuestionEffects(0, false, 'avancar_1', 'voltar_1', false);
        return gameState.players[0].position;
    });
    assert.equal(pos, 0);
});

test('applyQuestionEffects: bônus 2x dobra o avanço (avancar_1 vira +2)', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const pos = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 1;
        selectedColors = [0];
        boardLength = 30;
        gameState = createGameState();
        pawns = [{ position: { clone: () => ({}) } }];
        particlesGroup = { add() {}, children: [] };
        applyQuestionEffects(0, true, 'avancar_1', 'voltar_1', true);
        return gameState.players[0].position;
    });
    assert.equal(pos, 2);
});

test('getLastPlaceIndex: identifica o jogador mais atrasado no tabuleiro', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const idx = run(sandbox, () => {
        gameState = { players: [{ position: 5 }, { position: 1 }, { position: 8 }] };
        return getLastPlaceIndex();
    });
    assert.equal(idx, 1);
});

test('saveGameProgress/loadSavedGame: round-trip em modo local', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 2;
        selectedColors = [0, 1];
        boardLength = 20;
        gameState = createGameState();
        gameState.players[0].position = 7;
        saveGameProgress();
        return { had: hasSavedGame(), loaded: loadSavedGame() };
    });
    assert.equal(result.had, true);
    assert.equal(result.loaded.mode, 'local');
    assert.equal(result.loaded.gameState.players[0].position, 7);
});

test('saveGameProgress: não salva partida P2P (host/guest)', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const had = run(sandbox, () => {
        currentMode = 'p2p_host';
        numPlayers = 2;
        selectedColors = [0, 1];
        boardLength = 20;
        gameState = createGameState();
        saveGameProgress();
        return hasSavedGame();
    });
    assert.equal(had, false);
});

test('clearSavedGame: remove o save (chamado ao vencer a partida)', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const had = run(sandbox, () => {
        currentMode = 'local';
        numPlayers = 1;
        selectedColors = [0];
        boardLength = 20;
        gameState = createGameState();
        saveGameProgress();
        clearSavedGame();
        return hasSavedGame();
    });
    assert.equal(had, false);
});

test('getQuestionPool: banco específico usa só as perguntas daquele banco', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => {
        availableBanks = [
            { id: 'a', nome: 'Banco A', perguntas: [{ id: 1 }, { id: 2 }] },
            { id: 'b', nome: 'Banco B', perguntas: [{ id: 3 }] },
        ];
        selectedBankId = 'b';
        return getQuestionPool();
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 3);
});

test('getQuestionPool: "all" combina as perguntas de todos os bancos', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const total = run(sandbox, () => {
        availableBanks = [
            { id: 'a', nome: 'Banco A', perguntas: [{ id: 1 }, { id: 2 }] },
            { id: 'b', nome: 'Banco B', perguntas: [{ id: 3 }] },
        ];
        selectedBankId = 'all';
        return getQuestionPool().length;
    });
    assert.equal(total, 3);
});

test('getQuestionPool: banco selecionado que não existe mais cai pra "all"', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const total = run(sandbox, () => {
        availableBanks = [{ id: 'a', nome: 'Banco A', perguntas: [{ id: 1 }, { id: 2 }] }];
        selectedBankId = 'banco-que-nao-existe-mais';
        return getQuestionPool().length;
    });
    assert.equal(total, 2);
});

test('getActiveEfeitosCasasAtivos: banco específico usa a lista dele', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const effects = run(sandbox, () => {
        availableBanks = [{ id: 'a', nome: 'A', perguntas: [{ id: 1 }], efeitosCasasAtivos: ['avancar_2', 'pular_vez'] }];
        selectedBankId = 'a';
        return getActiveEfeitosCasasAtivos();
    });
    assert.equal(effects.slice().sort().join(','), 'avancar_2,pular_vez');
});

test('getActiveEfeitosCasasAtivos: null (todos os tipos) quando algum banco não restringe', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const effects = run(sandbox, () => {
        availableBanks = [
            { id: 'a', nome: 'A', perguntas: [{ id: 1 }], efeitosCasasAtivos: ['avancar_2'] },
            { id: 'b', nome: 'B', perguntas: [{ id: 2 }] }, // sem efeitosCasasAtivos = sem restrição
        ];
        selectedBankId = 'all';
        return getActiveEfeitosCasasAtivos();
    });
    assert.equal(effects, null);
});

test('loadQuestionBanks: sem fetch/manifest disponível, cai pro banco padrão embutido', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    // O mock global de fetch (test/mocks.js) sempre rejeita, simulando o
    // cenário file:// sem servidor — loadQuestionBanks() precisa sobreviver a isso.
    const vm = require('vm');
    return vm
        .runInContext('loadQuestionBanks()', sandbox, { filename: 'test-eval' })
        .then(() => {
            const pool = vm.runInContext('getQuestionPool()', sandbox, { filename: 'test-eval' });
            assert.ok(pool.length > 0, 'deveria continuar tendo perguntas disponíveis (banco embutido)');
        });
});

test('getTileSlotOffset: 1 peão fica no centro da casa', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const offset = run(sandbox, () => {
        gameState = { players: [{ position: 5 }] };
        return getTileSlotOffset(5, 0);
    });
    assert.equal(offset.x, 0);
    assert.equal(offset.z, 0);
});

test('getTileSlotOffset: 2/3/4 peões na mesma casa ficam em posições distintas', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const positions = run(sandbox, () => {
        gameState = { players: [{ position: 5 }, { position: 5 }, { position: 5 }, { position: 5 }] };
        return [0, 1, 2, 3].map((i) => getTileSlotOffset(5, i));
    });
    // as 4 posições precisam ser diferentes entre si (ninguém sobreposto)
    const keys = positions.map((p) => p.x + ',' + p.z);
    assert.equal(new Set(keys).size, 4, 'as 4 posições deveriam ser todas diferentes');
});

test('getTileSlotOffset: peão fora da casa (posições diferentes) não conta como ocupante', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const offset = run(sandbox, () => {
        gameState = { players: [{ position: 5 }, { position: 9 }] };
        return getTileSlotOffset(5, 0); // só o jogador 0 está na casa 5
    });
    assert.equal(offset.x, 0);
    assert.equal(offset.z, 0);
});

test('getPawnTilePosition: soma o offset de ocupação à posição base da casa', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => {
        boardLength = 20;
        currentMode = 'local';
        gameState = { players: [{ position: 3 }, { position: 3 }] };
        boardCurve = null; // getTilePosition cai no fallback (0,0.3,0) sem precisar montar o tabuleiro inteiro
        const base = getTilePosition(3);
        const withOffset0 = getPawnTilePosition(3, 0);
        const withOffset1 = getPawnTilePosition(3, 1);
        return {
            baseX: base.x,
            p0x: withOffset0.x,
            p1x: withOffset1.x,
            differ: withOffset0.x !== withOffset1.x,
        };
    });
    assert.equal(result.differ, true, 'os dois peões na mesma casa precisam ter x diferentes (lado a lado)');
});

test('generateRoomCode: formato SALA-DDDD', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const code = run(sandbox, () => generateRoomCode());
    assert.match(code, /^SALA-\d{4}$/);
});

test('validateDeck: rejeita baralho sem array "perguntas"', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => validateDeck({ nome: 'x' }));
    assert.equal(result.valid, false);
});

test('validateDeck: rejeita pergunta com respostaCorreta fora do intervalo', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () =>
        validateDeck({
            perguntas: [{ categoria: 'Geral', pergunta: 'Q?', opcoes: ['a', 'b'], respostaCorreta: 5 }],
        })
    );
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('respostaCorreta')));
});

test('validateDeck: aceita o baralho padrão (DEFAULT_DECK) sem erros', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () => validateDeck(DEFAULT_DECK));
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
});

test('validateDeck: rejeita "efeitosCasasAtivos" com valor desconhecido', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const result = run(sandbox, () =>
        validateDeck({
            perguntas: [{ categoria: 'Geral', pergunta: 'Q?', opcoes: ['a', 'b'], respostaCorreta: 0 }],
            efeitosCasasAtivos: ['voar_pro_espaco'],
        })
    );
    assert.equal(result.valid, false);
});

test('getRandomQuestion: cai pro baralho padrão se activeDeck estiver vazio', () => {
    const sandbox = loadGame(path.join(__dirname, '..'));
    const q = run(sandbox, () => {
        activeDeck = { perguntas: [] };
        return getRandomQuestion();
    });
    assert.ok(q && typeof q.pergunta === 'string');
});

// ---------------------------------------------------------------------------
// Dado: valida com o Three.js DE VERDADE (não o mock) que a rotação calculada
// pra cada resultado (1-6) realmente deixa a face com o número certo virada
// pra cima. Isso é o que garante que o bug "mostra um número, mas o jogo usa
// outro" não volta despercebido — testa os 6 resultados, não só um exemplo.
test('dado: os 6 resultados mostram a face visual correspondente (Three.js real)', () => {
    const THREE = require(path.join(__dirname, '..', 'vendor', 'three.min.js'));
    const dataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'diceFaces.js'), 'utf8');
    const vm = require('vm');
    const sandbox = { module: { exports: {} } };
    vm.createContext(sandbox);
    vm.runInContext(dataCode, sandbox, { filename: 'diceFaces.js' });
    const DICE_FACE_NORMALS = vm.runInContext('DICE_FACE_NORMALS', sandbox);
    const DICE_MATERIAL_FACE_ORDER = vm.runInContext('DICE_MATERIAL_FACE_ORDER', sandbox);

    const FACE_ORDER_NORMALS = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
    ];

    function getDiceTargetRotation(result) {
        const n = DICE_FACE_NORMALS[result] ? result : 1;
        const faceNormal = new THREE.Vector3(DICE_FACE_NORMALS[n].x, DICE_FACE_NORMALS[n].y, DICE_FACE_NORMALS[n].z);
        const quat = new THREE.Quaternion().setFromUnitVectors(faceNormal, new THREE.Vector3(0, 1, 0));
        return new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    }

    for (let result = 1; result <= 6; result++) {
        const euler = getDiceTargetRotation(result);
        const q = new THREE.Quaternion().setFromEuler(euler);
        let shownNumber = null;
        for (let i = 0; i < 6; i++) {
            const worldDir = FACE_ORDER_NORMALS[i].clone().applyQuaternion(q);
            if (worldDir.y > 0.999) shownNumber = DICE_MATERIAL_FACE_ORDER[i];
        }
        assert.equal(shownNumber, result, 'resultado ' + result + ' deveria mostrar a face ' + result + ', mostrou ' + shownNumber);
    }
});

// ---------------------------------------------------------------------------

async function runAll() {
    let passed = 0;
    let failed = 0;
    for (const t of tests) {
        try {
            // Testes podem ser síncronos ou devolver uma Promise (ex.: os que
            // exercitam loadQuestionBanks(), que é assíncrona de verdade).
            await t.fn();
            console.log('  ok  -', t.name);
            passed++;
        } catch (e) {
            console.log(' FAIL -', t.name);
            console.log('       ' + (e && e.message ? e.message : e));
            failed++;
        }
    }
    console.log('');
    console.log(passed + ' passou(aram), ' + failed + ' falhou(aram) — ' + tests.length + ' teste(s) no total.');
    process.exit(failed > 0 ? 1 : 0);
}

runAll();
