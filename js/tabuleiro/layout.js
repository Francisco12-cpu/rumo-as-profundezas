// ============================================================
// TABULEIRO: MAPA DAS CASAS (tipo de cada casa e moedas)
// ============================================================
// Lógica pura, sem nada de 3D. O mapa é sorteado UMA vez, pelo host (ou no
// modo solo/local), e guardado em gameState.board — vai junto no sync do P2P
// e na partida salva. Antes cada aparelho sorteava as casas especiais por
// conta própria na hora de desenhar: num jogo online, host e convidados
// podiam estar vendo tabuleiros diferentes, e uma partida continuada mudava
// de casas.
//
// Funciona com qualquer número de casas (mínimo 6): a quantidade de casas
// especiais, temáticas e moedas acompanha o tamanho do tabuleiro.

// Uma moeda a cada COIN_SPACING casas (só em casas de pergunta comum).
const COIN_SPACING = 4;
// A cada COINS_PER_SHIELD moedas o jogador ganha uma bolha protetora: o
// próximo erro dele não tem castigo (ver getTileQuestionOutcome).
const COINS_PER_SHIELD = 3;
// Distância mínima entre duas casas temáticas (cada uma tem um marco grande
// do cenário ao lado — vulcão, navio...; perto demais eles se atropelam).
const THEMED_MIN_GAP = 5;

function shuffleWith(list, random) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// activeSpecialIds: tipos especiais permitidos (o banco de perguntas pode
// restringir); vazio/null = todos.
function generateBoardLayout(length, activeSpecialIds, random) {
    const rand = random || Math.random;
    const n = Math.max(6, length | 0);
    const last = n - 1;
    const specials = activeSpecialIds && activeSpecialIds.length ? activeSpecialIds : SPECIAL_TILE_TYPE_IDS;
    const tiles = new Array(n).fill('normal');
    tiles[0] = 'start';
    tiles[last] = 'finish';

    // Especiais: mais ou menos a cada `step` casas (o mesmo ritmo de antes).
    const step = Math.max(3, Math.floor(n / 8));
    for (let i = step; i < last; i += step) {
        if (rand() < 0.65) tiles[i] = specials[Math.floor(rand() * specials.length)];
    }

    // Temáticas: 1 a 4, conforme o tamanho, em casas comuns longe da largada,
    // da chegada e umas das outras.
    const themedCount = Math.max(1, Math.min(THEMED_TILE_TYPE_IDS.length, Math.round(n / 12)));
    const themedTypes = shuffleWith(THEMED_TILE_TYPE_IDS, rand).slice(0, themedCount);
    // Preferência pelas casas da BORDA do tabuleiro (fileira do fundo e
    // pontas das curvas): cada temática tem um marco grande do cenário ao lado
    // (vulcão, navio...), que só cabe do lado de fora — e assim nada grande
    // fica entre a câmera e o tabuleiro.
    const outer = getOuterTileFlags(n);
    const pool = tiles.map((t, i) => i).filter((i) => i >= 3 && i <= last - 3 && tiles[i] === 'normal');
    const candidates = shuffleWith(
        pool.filter((i) => outer[i]),
        rand
    ).concat(
        shuffleWith(
            pool.filter((i) => !outer[i]),
            rand
        )
    );
    const themedAt = [];
    for (const i of candidates) {
        if (themedAt.length >= themedTypes.length) break;
        if (themedAt.every((j) => Math.abs(j - i) >= THEMED_MIN_GAP)) themedAt.push(i);
    }
    themedAt.sort((a, b) => a - b).forEach((i, k) => (tiles[i] = themedTypes[k]));

    // Cavalo-marinho: 1 (2 em tabuleiro grande) casa que dá carona até uma
    // casa comum fixa mais à frente — jumps[casa] = destino.
    const jumps = {};
    const seahorseCount = n >= 45 ? 2 : n >= 16 ? 1 : 0;
    const spots = shuffleWith(
        tiles.map((t, i) => i).filter((i) => i >= 4 && i <= last - 8 && tiles[i] === 'normal'),
        rand
    );
    for (const i of spots) {
        const used = Object.keys(jumps).map(Number);
        if (used.length >= seahorseCount) break;
        if (used.some((j) => Math.abs(j - i) < 7)) continue;
        const target = [5, 4, 6, 3].map((d) => i + d).find((t) => t < last - 1 && tiles[t] === 'normal');
        if (target === undefined) continue;
        tiles[i] = 'cavalo_marinho';
        jumps[i] = target;
    }

    // Moedas: em casas de pergunta comum, espaçadas.
    const coins = [];
    for (let i = 2; i < last; i += COIN_SPACING) {
        let j = i;
        // Se a casa da vez é especial, tenta a vizinha da frente.
        while (j < last && tiles[j] !== 'normal' && j < i + COIN_SPACING - 1) j++;
        if (tiles[j] === 'normal') coins.push(j);
    }
    return { tiles, coins, jumps };
}

// Casa de destino do cavalo-marinho da casa tileIndex. Partida salva antes
// de existir o mapa de destinos: 4 casas à frente.
function getJumpTarget(tileIndex) {
    const jumps = gameState && gameState.board && gameState.board.jumps;
    const target = jumps ? jumps[tileIndex] : undefined;
    if (typeof target === 'number') return target;
    return Math.min(tileIndex + 4, (gameState ? gameState.boardLength : tileIndex + 6) - 2);
}

// Para cada casa, se ela fica na borda "de fora" do tabuleiro: na fileira do
// fundo (a mais longe da câmera) ou numa ponta de fileira/curva. Usa o mesmo
// traçado de generateBoardPath (determinístico), amostrado por comprimento.
function getOuterTileFlags(n) {
    const pts = generateBoardPath(n);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    }
    const total = cum[cum.length - 1] || 1;
    const minZ = Math.min(...pts.map((p) => p.z));
    const flags = [];
    for (let i = 0; i < n; i++) {
        const d = (i / Math.max(1, n - 1)) * total;
        let k = 1;
        while (k < cum.length - 1 && cum[k] < d) k++;
        const f = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
        const x = pts[k - 1].x + (pts[k].x - pts[k - 1].x) * f;
        const z = pts[k - 1].z + (pts[k].z - pts[k - 1].z) * f;
        flags.push(z < minZ + 1 || Math.abs(x) > BOARD_ROW_WIDTH / 2 - 1.5);
    }
    return flags;
}

// Tipos especiais liberados pelo(s) banco(s) de perguntas da partida, já
// com os ids antigos traduzidos (ver LEGACY_TILE_TYPE_ALIASES).
function getActiveSpecialTileTypes() {
    const active = getActiveEfeitosCasasAtivos();
    if (!Array.isArray(active) || !active.length) return null;
    const ids = active
        .map((id) => LEGACY_TILE_TYPE_ALIASES[id] || id)
        .filter((id) => SPECIAL_TILE_TYPE_IDS.includes(id));
    return ids.length ? Array.from(new Set(ids)) : null;
}

// Mapa da partida atual (cria um se a partida não tiver — partida salva por
// uma versão antiga do jogo, por exemplo).
function getBoardLayout() {
    if (!gameState) return null;
    const n = gameState.boardLength || boardLength;
    if (!gameState.board || !Array.isArray(gameState.board.tiles) || gameState.board.tiles.length !== n) {
        gameState.board = generateBoardLayout(n, getActiveSpecialTileTypes());
    }
    return gameState.board;
}

function getTileTypeIdAt(index) {
    const board = getBoardLayout();
    return board ? board.tiles[index] || 'normal' : 'normal';
}

function hasCoinAt(index) {
    const board = getBoardLayout();
    return !!board && board.coins.includes(index);
}
