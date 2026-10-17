// ============================================================
// DADOS: TIPOS DE CASA
// ============================================================
// Fonte única de verdade sobre o que cada tipo de casa É e FAZ — nome, cor,
// ícone, se tem pergunta e a descrição em linguagem de criança. O tabuleiro,
// o desenho das casas, o painel de informação, a legenda e o texto de regras
// leem daqui. O EFEITO de cada tipo (o que acontece ao acertar/errar) mora
// numa função só, getTileQuestionOutcome (js/cartas/questions.js), e as
// casas sem pergunta em applySpecialTileEffect (js/nucleo/state.js).
//
//   question: a casa faz uma pergunta (o efeito depende de acertar/errar)
//   icon:     id do ícone SVG (js/interface/icones.js) — também desenhado
//             no número da casa
//   legend:   frase curta da legenda das casas
const TILE_TYPES = {
    start: {
        type: 'start',
        label: 'Largada',
        description: 'Todo mundo começa aqui, no portal de coral.',
        legend: 'Começo do caminho.',
        color: 0x00e5ff,
        icon: 'portal',
        question: false,
    },
    finish: {
        type: 'finish',
        label: 'Tesouro',
        description: 'Quem chegar aqui primeiro abre o baú do tesouro e ganha o jogo!',
        legend: 'Chegue primeiro para ganhar.',
        color: 0xffd740,
        icon: 'bau',
        question: false,
    },
    normal: {
        type: 'normal',
        label: 'Pergunta',
        description: 'Tem pergunta! Acertou: anda para frente e ganha 1 moeda. Errou: volta.',
        legend: 'Pergunta. Acertou anda, errou volta.',
        color: 0x8d6e63,
        icon: 'pergunta',
        question: true,
    },
    avanco: {
        type: 'avanco',
        label: 'Corrente Rápida',
        description: 'Tem pergunta! Acertou: a corrente te leva 3 casas para frente. Errou: fica onde está.',
        legend: 'Acertou: corrente leva 3 casas para frente.',
        color: 0x00e676,
        icon: 'seta',
        question: true,
    },
    voltar_2: {
        type: 'voltar_2',
        label: 'Corrente Contrária',
        description: 'A corrente puxa para trás: volta 2 casas, sem pergunta.',
        legend: 'Volta 2 casas.',
        color: 0xff5252,
        icon: 'seta-volta',
        question: false,
    },
    pular_vez: {
        type: 'pular_vez',
        label: 'Água-viva',
        description: 'A água-viva dá um choquinho no próximo jogador: ele fica uma vez sem jogar.',
        legend: 'O próximo jogador perde a vez.',
        color: 0x40c4ff,
        icon: 'agua-viva',
        question: false,
    },
    trocar_lugar: {
        type: 'trocar_lugar',
        label: 'Redemoinho',
        description:
            'Tem pergunta! Acertou: anda para frente. Errou: o redemoinho te troca de lugar com quem está mais atrás.',
        legend: 'Errou: troca com quem está mais atrás.',
        color: 0xb388ff,
        icon: 'redemoinho',
        question: true,
    },
    pergunta_bonus: {
        type: 'pergunta_bonus',
        label: 'Pérola Bônus',
        description: 'Pergunta que vale o dobro: anda o dobro se acertar, volta o dobro se errar.',
        legend: 'Pergunta que vale o dobro.',
        color: 0xffd740,
        icon: 'perola',
        question: true,
    },
    // Posta pelo layout (tabuleiro/layout.js), não sorteada entre as
    // especiais: precisa de uma casa de destino fixa (board.jumps).
    cavalo_marinho: {
        type: 'cavalo_marinho',
        label: 'Cavalo-marinho',
        description: 'O cavalo-marinho te dá uma carona até uma casa mais à frente, sem pergunta.',
        legend: 'Carona até uma casa mais à frente.',
        color: 0xff80ab,
        icon: 'cavalo-marinho',
        question: false,
    },
    // ---- Casas temáticas: aparecem perto de um marco do cenário ----
    alga: {
        type: 'alga',
        label: 'Floresta de Algas',
        description: 'Tem pergunta! Acertou: anda para frente. Errou: fica preso nas algas e perde a próxima vez.',
        legend: 'Errou: fica preso uma vez.',
        color: 0x2ecc71,
        icon: 'alga',
        question: true,
        themed: true,
    },
    vulcao: {
        type: 'vulcao',
        label: 'Vulcão de Bolhas',
        description: 'Tem pergunta! Acertou: as bolhas do vulcão te empurram 2 casas a mais.',
        legend: 'Acertou: bolhas empurram 2 casas a mais.',
        color: 0xff7043,
        icon: 'vulcao',
        question: true,
        themed: true,
    },
    navio: {
        type: 'navio',
        label: 'Navio Afundado',
        description: 'Tem pergunta! Acertou: anda e acha 2 moedas a mais no navio.',
        legend: 'Acertou: ganha 2 moedas a mais.',
        color: 0xa1887f,
        icon: 'navio',
        question: true,
        themed: true,
    },
    ancora: {
        type: 'ancora',
        label: 'Âncora',
        description: 'Tem pergunta! Acertou: anda para frente. Errou: a âncora te segura e você não volta.',
        legend: 'Errou: a âncora segura, não volta.',
        color: 0x90a4ae,
        icon: 'ancora',
        question: true,
        themed: true,
    },
};

// Tipos que podem ser sorteados como "casa especial" no meio do tabuleiro
// (exclui start/finish/normal, que têm posição ou papel fixo, e as
// temáticas, que são postas perto dos marcos do cenário).
const SPECIAL_TILE_TYPE_IDS = ['avanco', 'voltar_2', 'pular_vez', 'trocar_lugar', 'pergunta_bonus'];
const THEMED_TILE_TYPE_IDS = ['alga', 'vulcao', 'navio', 'ancora'];

// Casas sem pergunta cujo efeito também vale quando o jogador chega nelas
// empurrado por OUTRO efeito (efeito em cadeia, ver continueAfterMove em
// nucleo/state.js). Casa com pergunta não encadeia: uma pergunta por vez.
const CHAINABLE_TILE_TYPE_IDS = ['voltar_2', 'pular_vez', 'cavalo_marinho'];

// Ids antigos aceitos nos bancos de perguntas ("efeitosCasasAtivos"): a casa
// "Avançar 2" sem pergunta virou a Corrente Rápida (com pergunta).
const LEGACY_TILE_TYPE_ALIASES = { avancar_2: 'avanco' };

function getTileType(id) {
    return TILE_TYPES[LEGACY_TILE_TYPE_ALIASES[id] || id] || TILE_TYPES.normal;
}
