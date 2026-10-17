// ============================================================
// DADOS: PERSONAGENS
// ============================================================
const PLAYER_COLORS = [
    { name: 'Amarelo (Bob)', hex: 0xffd740, css: '#FFD740' },
    { name: 'Rosa (Patrick)', hex: 0xff80ab, css: '#FF80AB' },
    { name: 'Verde (Sandy)', hex: 0x69f0ae, css: '#69F0AE' },
    { name: 'Azul (Lula)', hex: 0x40c4ff, css: '#40C4FF' },
    { name: 'Roxo', hex: 0xb388ff, css: '#B388FF' },
    { name: 'Laranja', hex: 0xff9e40, css: '#FF9E40' },
];

// Qual builder usar pra montar o modelo visual de um peão. 'roster' escala um
// personagem temático (Bob Esponja, Patrick, Lula Molusco, Sr. Siriguejo —
// ver CHARACTER_ROSTER em pawnBuilders.js) por índice de jogador, repetindo o
// ciclo se houver mais jogadores que personagens. Trocar aqui (ou passar
// outra chave direto pra createCharacterPawn) troca o modelo do jogo inteiro
// sem tocar em mais nada — quem chama createCharacterPawn não sabe nem
// precisa saber como o modelo é construído por dentro. 'default' continua
// disponível como o bonequinho redondo original (fallback mais leve).
const CHARACTER_MODEL_KEY = 'roster';

// Conjuntos de personagens que dá pra escolher na tela de configuração da
// partida (ver tokenSet em config.js). Cada jogador, pela ordem, pega o
// personagem seguinte da lista (repetindo o ciclo se houver mais jogadores).
//   classicos — os peões originais do jogo (feitos à mão em pawnBuilders.js)
//   novos     — os bichos do kit de modelos (assets/models/modelos-fundo-do-mar.js)
//   misturados — alterna um de cada conjunto
const TOKEN_SETS = {
    classicos: ['bob', 'patrick', 'lula', 'siriguejo'],
    novos: ['polvo', 'estrela', 'caracol', 'caranguejo', 'esponja'],
    misturados: ['bob', 'polvo', 'patrick', 'estrela', 'lula', 'caracol', 'siriguejo', 'caranguejo'],
};
const DEFAULT_TOKEN_SET = 'classicos';

// Nome mostrado na tela pra cada personagem (placar, "Vez de...", perguntas).
const CHARACTER_NAMES = {
    bob: 'Bob Esponja',
    patrick: 'Patrick',
    lula: 'Lula Molusco',
    siriguejo: 'Sr. Siriguejo',
    polvo: 'Polvo',
    estrela: 'Estrela-do-mar',
    caracol: 'Caracol',
    caranguejo: 'Caranguejo',
    esponja: 'Esponja',
    default: 'Jogador',
};

function getTokenSetRoster(setId) {
    return TOKEN_SETS[setId] || TOKEN_SETS[DEFAULT_TOKEN_SET];
}

// Personagem (chave de PAWN_BUILDERS) do jogador de índice playerIndex.
function getCharacterKeyFor(setId, playerIndex) {
    const roster = getTokenSetRoster(setId);
    return roster[playerIndex % roster.length];
}
