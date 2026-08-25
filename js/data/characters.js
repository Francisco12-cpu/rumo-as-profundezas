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

// Dimensões/proporções do peão "padrão" (o boneco redondinho atual), usadas
// por buildDefaultPawn (ver js/pawnBuilders.js). Ajustar a aparência do
// modelo atual é editar só estes números — não precisa mexer em geometria
// nenhuma. Quando houver modelos 3D próprios pra importar, o jeito de trocar
// NÃO é editar isto: é registrar um novo builder em PAWN_BUILDERS (ver
// pawnBuilders.js) e apontar CHARACTER_MODEL_KEY pra ele.
const PAWN_APPEARANCE = {
    body: { radiusTop: 0.2, radiusBottom: 0.3, height: 0.45, y: 0.25 },
    head: { radius: 0.2, y: 0.6 },
    eyes: { radius: 0.06, pupilRadius: 0.03, y: 0.62, spacing: 0.08, forward: 0.16, pupilForward: 0.21 },
    smile: { radius: 0.06, tube: 0.015, y: 0.52, forward: 0.18 },
    baseRing: { radius: 0.32, tube: 0.04, y: 0.03 },
    pointLight: { intensity: 0.6, distance: 2.5, y: 0.4 },
};

// Qual builder usar pra montar o modelo visual de um peão. 'roster' escala um
// personagem temático (Bob Esponja, Patrick, Lula Molusco, Sr. Siriguejo —
// ver CHARACTER_ROSTER em pawnBuilders.js) por índice de jogador, repetindo o
// ciclo se houver mais jogadores que personagens. Trocar aqui (ou passar
// outra chave direto pra createCharacterPawn) troca o modelo do jogo inteiro
// sem tocar em mais nada — quem chama createCharacterPawn não sabe nem
// precisa saber como o modelo é construído por dentro. 'default' continua
// disponível como o bonequinho redondo original (fallback mais leve).
const CHARACTER_MODEL_KEY = 'roster';
