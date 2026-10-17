// ============================================================
// DADOS: FORMA DO CAMINHO DO TABULEIRO
// ============================================================
// Gera os pontos de controle da curva do tabuleiro. Antes eram 20 pontos
// escolhidos manualmente, sem nenhuma regra entre eles — o resultado eram
// curvas com deformações inconsistentes (uma casa virando bruscamente pra
// outra direção sem razão aparente), e o mesmo traçado fixo era reusado
// pra qualquer tamanho de tabuleiro.
//
// Aqui o caminho é gerado por um algoritmo simples e prevísivel: fileiras
// retas alternando direção (esquerda↔direita), conectadas por curvas de
// retorno — o mesmo princípio de tabuleiros como Trilha/Banco Imobiliário
// serpenteado, só que em 3D. Isso garante, pra qualquer tamanho de
// tabuleiro:
//   - direção sempre clara (cada fileira só anda numa direção);
//   - sem cruzamentos ou sobreposição (fileiras em Z's diferentes);
//   - espaçamento regular (amostragem por comprimento de arco, ver
//     getTilePosition em js/tabuleiro/caminho.js);
//   - ainda com curvas orgânicas suaves (leve ondulação e curvas de retorno).
const BOARD_TILES_PER_ROW = 7;
const BOARD_ROW_WIDTH = 20;
const BOARD_ROW_SPACING = 4.5;

// Único lugar que decide "quantas fileiras pra esse tanto de casas" — usado
// tanto pra gerar o traçado quanto pra enquadrar a câmera de visão geral
// (ver camera.js/setCameraOverview), então os dois nunca ficam dessincronizados.
function getBoardRowCount(boardLen) {
    return Math.max(3, Math.ceil((boardLen || 20) / BOARD_TILES_PER_ROW));
}

function generateBoardPath(boardLen) {
    const rows = getBoardRowCount(boardLen);
    const rowWidth = BOARD_ROW_WIDTH;
    const rowSpacing = BOARD_ROW_SPACING;
    const wobble = 0.5;

    const halfWidth = rowWidth / 2;
    const totalDepth = (rows - 1) * rowSpacing;
    const startZ = -totalDepth / 2;
    const segsPerRow = 3;

    const points = [];
    for (let r = 0; r < rows; r++) {
        const z = startZ + r * rowSpacing;
        const goingRight = r % 2 === 0;
        const xFrom = goingRight ? -halfWidth : halfWidth;
        const xTo = goingRight ? halfWidth : -halfWidth;

        for (let s = 0; s <= segsPerRow; s++) {
            const localT = s / segsPerRow;
            const x = xFrom + (xTo - xFrom) * localT;
            // ondulação leve e suave — dá aspecto orgânico sem desviar a
            // trilha de sua direção principal nem criar curvas bruscas.
            const zWobble = Math.sin(localT * Math.PI * 1.5 + r * 2.1) * wobble;
            const y = 0.12 + (Math.sin(localT * Math.PI + r * 1.3) * 0.5 + 0.5) * 0.18;
            points.push(new THREE.Vector3(x, y, z + zWobble));
        }

        // Curva de retorno suave até a próxima fileira (evita cantos de 90°).
        if (r < rows - 1) {
            const nextZ = startZ + (r + 1) * rowSpacing;
            const midZ = (z + nextZ) / 2;
            const loopOut = goingRight ? 2.5 : -2.5;
            points.push(new THREE.Vector3(xTo + loopOut, 0.15, midZ));
        }
    }
    return points;
}
