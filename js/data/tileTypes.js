// ============================================================
// DADOS: TIPOS DE CASA
// ============================================================
// Fonte única de verdade sobre o que cada tipo de casa É e FAZ — label, cor,
// símbolo e descrição em linguagem natural. Antes essa informação estava
// espalhada em 3 lugares (array de efeitos em config.js, switch de símbolos
// dentro do desenho da casa em scene.js, texto fixo escrito à mão no modal de
// regras); agora tudo lê daqui. Adicionar um tipo de casa novo é editar só
// este arquivo — o tabuleiro, o desenho e o painel de informação da casa
// (ver ui.js/showTileInfo) atualizam sozinhos.
const TILE_TYPES = {
    start: {
        type: 'start',
        label: 'Início',
        description: 'Ponto de partida de todos os jogadores.',
        color: 0x00e5ff,
        symbol: '●',
    },
    finish: {
        type: 'finish',
        label: 'Chegada',
        description: 'Quem chegar aqui primeiro vence a partida!',
        color: 0xffd740,
        symbol: '★',
    },
    normal: {
        type: 'normal',
        label: 'Pergunta',
        description: 'Responda uma pergunta: acertou, avança; errou, volta.',
        color: 0x8d6e63,
        symbol: '',
    },
    avancar_2: {
        type: 'avancar_2',
        label: 'Avançar 2',
        description: 'Avança 2 casas automaticamente, sem precisar responder nada.',
        color: 0x00e676,
        symbol: '▲',
    },
    voltar_2: {
        type: 'voltar_2',
        label: 'Voltar 2',
        description: 'Volta 2 casas automaticamente.',
        color: 0xff5252,
        symbol: '▼',
    },
    pular_vez: {
        type: 'pular_vez',
        label: 'Pular a Vez',
        description: 'O próximo jogador perde a vez dele.',
        color: 0x40c4ff,
        symbol: '⏭',
    },
    trocar_lugar: {
        type: 'trocar_lugar',
        label: 'Trocar de Lugar',
        description: 'Troca de posição no tabuleiro com quem está em último lugar.',
        color: 0xb388ff,
        symbol: '⇄',
    },
    pergunta_bonus: {
        type: 'pergunta_bonus',
        label: 'Pergunta Bônus',
        description: 'Pergunta que vale o dobro: acerto ou penalidade em dose dupla.',
        color: 0xffd740,
        symbol: '★',
    },
};

// Tipos que podem ser sorteados como "casa especial" no meio do tabuleiro
// (exclui start/finish/normal, que têm posição ou papel fixo).
const SPECIAL_TILE_TYPE_IDS = ['avancar_2', 'voltar_2', 'pular_vez', 'trocar_lugar', 'pergunta_bonus'];

function getTileType(id) {
    return TILE_TYPES[id] || TILE_TYPES.normal;
}
