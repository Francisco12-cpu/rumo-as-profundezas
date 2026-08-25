// ============================================================
// TRIVIA 3D - BOB ESPONJA: FUNDO DO MAR
// Jogo de Tabuleiro 3D Interativo
//
// Dados "de conteúdo" (tipos de casa, personagens, faces do dado, forma do
// caminho) moram em js/data/ — este arquivo só guarda ESTADO de execução
// (o que muda durante a partida) e configuração de qualidade/áudio.
// ============================================================

// ============ RITMO DA SEQUÊNCIA DE JOGADA ============
// Fonte única dos tempos de dado -> movimento -> chegada -> casa (ver
// scene.js/showDiceRoll+movePlayerAlongPath e ui.js/performRoll). Ajustar o
// ritmo da cena inteira é editar só estes números — nenhuma lógica de jogo
// depende deles, só a apresentação.
const TIMING = {
    diceSpinMs: 2200, // giro do dado — visível, sem pressa
    diceResultHoldMs: 1800, // dado parado mostrando o resultado, antes de sumir/mover
    standStillMs: 550, // personagem parado na casa antes de começar a pular
    hopDurationMs: 420, // duração de cada pulo casa-a-casa
    hopPauseMs: 130, // pequena pausa entre aterrissar e o próximo pulo
    preLandingBurstMs: 350, // pausa após aterrissar na casa final, antes do efeito de chegada
    postLandingPauseMs: 650, // pausa após o efeito de chegada, antes do efeito da casa/pergunta
};

// ============ ESTADO GLOBAL ============
let gameState = null;
let currentMode = null;
let selectedColors = [0, 1, 2, 3];
let boardLength = 30;
let numPlayers = 2;
let numBots = 1;
// Qual banco de perguntas usar ('all' = todos misturados, ou o id de um
// banco específico — ver js/questions.js/loadQuestionBanks).
let selectedBankId = (function loadSavedBankSelection() {
    try {
        const saved = localStorage.getItem('trivia3d_selected_bank');
        if (saved) return saved;
    } catch (e) {}
    return 'all';
})();
let roomCodeGlobal = null;
let peer = null;
let connections = [];
let isHost = false;
let isGuest = false;
// Índice (gameState.players[i].id) deste cliente na partida P2P.
// 0 = host; guests recebem seu índice do host via mensagem 'assign_player'.
let myPlayerId = 0;
let rollInProgress = false;
let questionInProgress = false;
let currentQuestionData = null;
let questionTimer = null;
let gameOver = false;
let cameraOrbitMode = false;

// Fase da sequência de jogada — guia a câmera e serve de trava extra contra
// ações simultâneas (ver ui.js/performRoll, state.js/handleLanding).
// rollInProgress/questionInProgress continuam sendo a trava "oficial" usada
// pela sincronização P2P; gamePhase é informativo/defensivo por cima disso.
const GAME_PHASE = {
    IDLE: 'idle',
    ROLLING: 'rolling',
    RESULT: 'result',
    MOVING: 'moving',
    LANDING: 'landing',
    HOUSE_EFFECT: 'house_effect',
    QUESTION: 'question',
};
let gamePhase = GAME_PHASE.IDLE;

// ============ QUALIDADE ADAPTATIVA ============
// Qualidade gráfica: 'auto' segue a heurística de hardware abaixo; 'high'/
// 'low' força manualmente — ajustável em Configurações (ui.js/setQuality),
// vale a partir da próxima partida/recarregamento (evita reconstruir o
// renderer no meio do jogo).
let qualityOverride = (function loadQualityOverride() {
    try {
        const saved = localStorage.getItem('trivia3d_quality');
        if (saved === 'high' || saved === 'low' || saved === 'auto') return saved;
    } catch (e) {}
    return 'auto';
})();

// Chance (0 a 1) de um bot acertar cada pergunta — configurável em
// Configurações (ver ui.js/setBotDifficulty, bots.js/botAnswerQuestion).
// Não é uma flag por pergunta ("essa pergunta é fácil pro bot X"); é uma
// única probabilidade global, simples de ajustar pra testar o jogo com
// inimigos mais fracos ou mais fortes.
let botDifficulty = (function loadBotDifficulty() {
    try {
        const saved = parseFloat(localStorage.getItem('trivia3d_bot_difficulty'));
        if (saved === 0.5 || saved === 0.75 || saved === 1) return saved;
    } catch (e) {}
    return 0.75;
})();

// Heurística simples (núcleos de CPU + tamanho de tela) pra reduzir custo em
// aparelhos mais fracos quando qualityOverride === 'auto' — nunca testamos em
// celular de verdade, então isso é uma rede de segurança, não uma medição
// real de FPS.
const isLowPowerDevice = (function detectLowPower() {
    if (qualityOverride === 'high') return false;
    if (qualityOverride === 'low') return true;
    try {
        const cores = navigator.hardwareConcurrency || 4;
        const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 700;
        return cores <= 4 || smallScreen;
    } catch (e) {
        return false;
    }
})();

// ============ THREE.JS GLOBAIS ============
let scene, camera, renderer, composer;
let boardCurve, boardGroup;
let tilesGroup, pawnsGroup, diceGroup, particlesGroup, environmentGroup;
let pawns = [];
let diceMesh;
let tileMeshes = [];
let bubbleParticles = [];
let confettiParticles = [];
let dustParticles = [];
// Caranguejos ambientes (ver createCrabs/updateCrabs em scene.js) — só
// decoração, nenhum sistema de jogo lê este array.
let crabs = [];
// Tetos de partículas simultâneas: em partidas longas as bolhas ambientes
// nunca páravam de se acumular; isso evita crescimento sem limite em celulares.
const MAX_BUBBLES = isLowPowerDevice ? 60 : 120;
const MAX_CONFETTI = isLowPowerDevice ? 130 : 260;
const MAX_DUST = isLowPowerDevice ? 30 : 60;
let clock;
let bloomPass;

// Câmera
let cameraMode = 'focus'; // 'focus' ou 'overview'
let activePawnToFollow = null;
let controls; // THREE.OrbitControls — permite girar/zoom com o mouse/toque
let diceRollHideTimeout = null;

// Áudio — 3 barramentos independentes (geral, música ambiente, efeitos),
// cada um com seu próprio volume salvo. A UI (ui.js) só chama
// setMasterVolume/setMusicVolume/setSfxVolume; o roteamento entre os nós de
// ganho é todo interno a audio.js.
let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let ambientOscillators = [];
let ambientLFOInterval = null;
let ambientChimeInterval = null;
let volumeBeforeMute = 0.8;

function loadSavedVolume(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            const v = parseFloat(saved);
            if (!isNaN(v) && v >= 0 && v <= 1) return v;
        }
    } catch (e) {}
    return fallback;
}

let masterVolume = loadSavedVolume('trivia3d_volume', 0.8);
let musicVolume = loadSavedVolume('trivia3d_volume_music', 0.7);
let sfxVolume = loadSavedVolume('trivia3d_volume_sfx', 1);
