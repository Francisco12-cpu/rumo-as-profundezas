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
// dado/dado.js/showDiceRoll, tabuleiro/peoes.js/movePlayerAlongPath e ui.js/performRoll). Ajustar o
// ritmo da cena inteira é editar só estes números — nenhuma lógica de jogo
// depende deles, só a apresentação.
const TIMING = {
    diceSpinMs: 2100, // arremesso do dado: cai, quica e rola (1,5–2,5 s pedidos), sem pressa
    diceResultHoldMs: 1800, // dado parado mostrando o resultado, antes de sumir/mover
    standStillMs: 550, // personagem parado na casa antes de começar a pular
    hopDurationMs: 420, // duração de cada pulo casa-a-casa
    hopPauseMs: 130, // pequena pausa entre aterrissar e o próximo pulo
    preLandingBurstMs: 350, // pausa após aterrissar na casa final, antes do efeito de chegada
    postLandingPauseMs: 650, // pausa após o efeito de chegada, antes do efeito da casa/pergunta
    // Cartão "o que esta casa faz" (ui.js/showTileIntro), mostrado ANTES da
    // pergunta ou do efeito especial. Quem joga nesta tela fecha tocando no
    // botão (no ritmo de quem ainda está aprendendo a ler); bots e jogadores
    // remotos seguem sozinhos depois deste tempo.
    tileIntroMs: 3200,
    // Transição de bolhas (interface/transicao.js) e tela de carregamento.
    transitionCoverMs: 650,
    transitionRevealMs: 750,
    loadingMinMs: 700, // carregamento fica no mínimo isto na tela (dá tempo de ler a dica)
    // Carta da pergunta (cartas/cartas3d.js e questions.js): sai do monte e
    // voa até a tela, vira mostrando a pergunta e, no fim, sobe e some.
    deckFocusMs: 1100, // câmera vai até o monte de cartas antes de a carta sair
    deckLiftMs: 650, // a carta de cima sobe devagar do monte (o "puxar")
    cardFlightMs: 1500,
    cardFlipMs: 900,
    cardExitMs: 650,
    answerResultMs: 2600, // "Acertou!/Errou!" + consequência visíveis antes de o peão se mover
    postEffectPauseMs: 700, // pausa depois do efeito/consequência terminar, antes de passar a vez
    turnToastMs: 1800, // aviso grande "Vez de Fulano!" no começo de cada vez
    botTurnDelayMs: 2200, // bot espera o aviso de vez sumir antes de jogar o dado
    botThinkMinMs: 1600, // bot "pensando" na pergunta: mínimo...
    botThinkMaxMs: 3000, // ...e máximo, pra dar tempo de ler a pergunta que ele vai responder
};

// ============ ESTADO GLOBAL ============
let gameState = null;
let currentMode = null;
let selectedColors = [0, 1, 2, 3];
let boardLength = 30;
let numPlayers = 2;
let numBots = 1;
// Qual banco de perguntas usar ('all' = todos misturados, ou o id de um
// banco específico — ver js/cartas/questions.js/loadQuestionBanks).
let selectedBankId = (function loadSavedBankSelection() {
    try {
        const saved = localStorage.getItem('trivia3d_selected_bank');
        if (saved) return saved;
    } catch (e) {}
    return 'all';
})();
// Conjunto de personagens escolhido na configuração da partida (ver
// TOKEN_SETS em js/data/characters.js), lembrado entre partidas.
let tokenSet = (function loadSavedTokenSet() {
    try {
        const saved = localStorage.getItem('trivia3d_token_set');
        if (saved && TOKEN_SETS[saved]) return saved;
    } catch (e) {}
    return DEFAULT_TOKEN_SET;
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

// ============ QUALIDADE GRÁFICA ============
// 'auto' (padrão) escolhe pelo aparelho; 'low'/'medium'/'high' forçam —
// ajustável em Configurações (ui.js/setQuality), vale ao recarregar.
let qualityOverride = (function loadQualityOverride() {
    try {
        const saved = localStorage.getItem('trivia3d_quality');
        if (['auto', 'low', 'medium', 'high'].includes(saved)) return saved;
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

// Nível efetivo: 0 = baixa, 1 = média, 2 = alta. No automático: celular ou
// tela de toque pequena começa em média (baixa se tiver poucos núcleos);
// computador começa em alta (média com poucos núcleos). Medição real de
// FPS fica em ui.js (o jogo sugere baixar se ficar lento).
const qualityLevel = (function detectQuality() {
    if (qualityOverride === 'high') return 2;
    if (qualityOverride === 'medium') return 1;
    if (qualityOverride === 'low') return 0;
    try {
        const cores = navigator.hardwareConcurrency || 4;
        const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const small = Math.min(window.innerWidth, window.innerHeight) < 700;
        if (touch || small) return cores >= 6 ? 1 : 0;
        return cores <= 4 ? 1 : 2;
    } catch (e) {
        return 1;
    }
})();
// "Aparelho fraco" = qualidade baixa (nome antigo, usado em vários lugares).
const isLowPowerDevice = qualityLevel === 0;
// Escolhe um valor por nível: q3(baixa, media, alta).
const q3 = (low, mid, high) => (qualityLevel === 0 ? low : qualityLevel === 1 ? mid : high);

// ============ THREE.JS GLOBAIS ============
let scene, camera, renderer, composer;
let boardCurve, boardGroup;
let tilesGroup, pawnsGroup, diceGroup, particlesGroup, environmentGroup;
let pawns = [];
// Conjunto de personagens com que os peões atuais foram montados — o convidado
// P2P remonta os peões se o host estiver usando outro (ver multiplayer.js).
let pawnsBuiltForTokenSet = null;
let turnMarker = null; // anel "você está aqui" do jogador da vez (ver tabuleiro/peoes.js)
let diceMesh;
let tileMeshes = [];
let bubbleParticles = [];
let confettiParticles = [];
let dustParticles = [];
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
// Em modo 'focus' a câmera anda JUNTO com o peão mantendo este deslocamento
// (câmera - alvo); ver camera.js/updateCameraFollow. Enquanto
// cameraOffsetTweening é true o deslocamento vem da transição de
// setCameraFocus; fora disso vem da própria câmera, então girar/dar zoom com
// o mouse/dedo é preservado enquanto o peão anda.
let cameraFollowOffset = null;
let cameraOffsetTweening = false;
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
