// ============================================================
// SISTEMA DE PERSONAGENS: MONTAGEM DO MODELO VISUAL
// ============================================================
// Isolado do resto da renderização de propósito: o resto do jogo
// (tabuleiro/peoes.js, state.js, câmera) só enxerga o THREE.Group que sai
// daqui — nunca sabe (nem precisa saber) como o modelo foi montado por
// dentro. Trocar o visual de um personagem é registrar outro builder aqui.
//
// Todo peão sai com userData.rig (corpo, olhos, braços), que o animador
// (modelos/animacaoPeoes.js) usa pra respirar, piscar, nadar e reagir.
const PAWN_BUILDERS = {
    default: buildDefaultPawn,
    bob: buildBobEsponjaPawn,
    patrick: buildPatrickPawn,
    lula: buildLulaMoluscoPawn,
    siriguejo: buildSrSiriguejoPawn,
    polvo: (colorHex) => buildSeaKitPawn('polvo', colorHex),
    estrela: (colorHex) => buildSeaKitPawn('estrela', colorHex),
    caracol: (colorHex) => buildSeaKitPawn('caracol', colorHex),
    caranguejo: (colorHex) => buildSeaKitPawn('caranguejo', colorHex),
    esponja: (colorHex) => buildSeaKitPawn('esponja', colorHex),
};

// Escalação usada quando CHARACTER_MODEL_KEY === 'roster': cada índice de
// jogador (0-based) pega o personagem correspondente nesta lista, repetindo
// o ciclo se houver mais jogadores que personagens. O anel da base sempre
// usa a cor de verdade do jogador, então mesmo repetindo personagem dois
// jogadores continuam visualmente distinguíveis.
const CHARACTER_ROSTER = ['bob', 'patrick', 'lula', 'siriguejo'];

function createCharacterPawn(colorHex, index, modelKey) {
    const key = modelKey || CHARACTER_MODEL_KEY;
    const builderKey = key === 'roster' ? CHARACTER_ROSTER[index % CHARACTER_ROSTER.length] : key;
    const builder = PAWN_BUILDERS[builderKey] || PAWN_BUILDERS.default;
    const group = builder(colorHex);
    // Object.assign (não substituição): o builder deixa o rig no userData.
    group.userData = Object.assign(group.userData || {}, { index: index, colorHex: colorHex, position: 0 });
    return group;
}

// ============================================================
// PERSONAGENS DO KIT DE MODELOS (assets/models/modelos-fundo-do-mar.js)
// ============================================================
// O kit usa a escala "1 unidade = 1 casa" (base de raio ~0,5, origem no chão,
// frente = +Z), a mesma dos clássicos. Só a esponja, um tubo alto (~1,7),
// encolhe pra não ficar bem mais alta que o resto.
const SEA_KIT_PAWN_SCALE = { esponja: 0.85, default: 1 };

function buildSeaKitPawn(modelId, colorHex) {
    const group = new THREE.Group();
    if (typeof MODELOS_FUNDO_DO_MAR === 'undefined') {
        // Kit não carregou (arquivo faltando, por ex.): o jogo continua com o peão padrão.
        console.warn('[modelos] kit não encontrado — usando o peão padrão no lugar de ' + modelId);
        return buildDefaultPawn(colorHex);
    }
    const model = MODELOS_FUNDO_DO_MAR.criarModelo(modelId, {
        corJogador: '#' + new THREE.Color(colorHex).getHexString(),
        qualidade: isLowPowerDevice ? 'baixa' : 'alta',
    });
    linearizeModelColors(model.objeto); // ver modelos/seaKit.js: cores do kit (r160) -> r128
    model.objeto.scale.setScalar(SEA_KIT_PAWN_SCALE[modelId] || SEA_KIT_PAWN_SCALE.default);
    group.add(model.objeto);
    // O animador chama model.atualizar (piscar, tentáculos, bolhas do kit).
    group.userData.rig = makeSeaKitPawnRig(model);
    return group;
}
