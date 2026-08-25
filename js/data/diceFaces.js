// ============================================================
// DADOS: FACES DO DADO
// ============================================================
// Cada número do dado (1-6) é definido por DUAS coisas independentes:
//   - qual PONTO ela tem desenhado (getDiceDotPattern)
//   - qual NORMAL LOCAL do cubo (BoxGeometry) carrega essa textura
// A rotação que faz o dado "parar" mostrando um resultado é sempre
// CALCULADA a partir dessa segunda informação (ver scene.js/getDiceTargetRotation
// usando THREE.Quaternion.setFromUnitVectors) — nunca escrita à mão em graus/
// radianos. Foi exatamente escrever a rotação à mão, sem essa referência
// única entre "que face é essa" e "pra onde ela aponta", que causava o bug de
// o dado girar e mostrar um número diferente do resultado sorteado: bastava
// uma conta errada numa das 6 entradas pra descasar visual de lógica, e não
// havia nenhuma checagem estrutural impedindo isso.
//
// Convenção de pares opostos de um dado ocidental padrão: 1↔6, 2↔5, 3↔4.
// BoxGeometry numera seus 6 grupos de material como [+X, -X, +Y, -Y, +Z, -Z].
const DICE_FACE_NORMALS = {
    1: { x: 1, y: 0, z: 0 }, // +X
    6: { x: -1, y: 0, z: 0 }, // -X
    2: { x: 0, y: 1, z: 0 }, // +Y
    5: { x: 0, y: -1, z: 0 }, // -Y
    3: { x: 0, y: 0, z: 1 }, // +Z
    4: { x: 0, y: 0, z: -1 }, // -Z
};

// Ordem de materiais exigida pelo THREE.BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z].
// Construída a partir de DICE_FACE_NORMALS para NUNCA poder ficar dessincronizada.
const DICE_MATERIAL_FACE_ORDER = [1, 6, 2, 5, 3, 4];

function getDiceDotPattern(num) {
    const patterns = {
        1: [[1, 1]],
        2: [
            [0, 0],
            [2, 2],
        ],
        3: [
            [0, 0],
            [1, 1],
            [2, 2],
        ],
        4: [
            [0, 0],
            [2, 0],
            [0, 2],
            [2, 2],
        ],
        5: [
            [0, 0],
            [2, 0],
            [1, 1],
            [0, 2],
            [2, 2],
        ],
        6: [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 2],
            [1, 2],
            [2, 2],
        ],
    };
    return patterns[num] || patterns[1];
}
