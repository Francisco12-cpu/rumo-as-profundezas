// ============================================================
// AMBIENTE: CHÃO DE AREIA, DECORAÇÃO BÁSICA E LIMITES
// ============================================================
// Onde o cenário pode ser posto (fora do tabuleiro), a areia e os elementos
// procedurais do fundo do mar.

// Sorteia uma posição dentro de um raio, evitando a área ocupada pelo
// tabuleiro (senão coral/alga nascem em cima das casas e atrapalham a
// leitura do caminho). boardLength já está definido nesse ponto (vem da
// configuração da partida), mesmo a curva ainda não tendo sido gerada.
function getBoardKeepOut() {
    const rows = getBoardRowCount(boardLength);
    return { x: 11, z: ((rows - 1) * 4.5) / 2 + 3 };
}

// Distância de um ponto até a área do tabuleiro (0 = dentro dela).
function getBoardKeepOutDistance(x, z) {
    const keepOut = getBoardKeepOut();
    return Math.hypot(Math.max(0, Math.abs(x) - keepOut.x), Math.max(0, Math.abs(z) - keepOut.z));
}

// Textura de areia gerada por canvas: grão/sedimento/variação de tom, não só
// uma cor lisa. O relevo (vértices deslocados) já dava profundidade de
// FORMA; isso dá profundidade de SUPERFÍCIE — sensação de terreno de verdade.
// Ruído suave que se repete sem emenda (usado na textura e no relevo da areia).
function tileableNoise(size, cells, seed) {
    let st = seed || 1;
    const rand = () => (st = (st * 16807) % 2147483647) / 2147483647;
    const grid = [];
    for (let i = 0; i < cells * cells; i++) grid.push(rand());
    const at = (x, y) => grid[((y + cells) % cells) * cells + ((x + cells) % cells)];
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const fx = (x / size) * cells;
            const fy = (y / size) * cells;
            const ix = Math.floor(fx);
            const iy = Math.floor(fy);
            const tx = fx - ix;
            const ty = fy - iy;
            const sx = tx * tx * (3 - 2 * tx);
            const sy = ty * ty * (3 - 2 * ty);
            const a0 = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
            const a1 = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
            out[y * size + x] = a0 + (a1 - a0) * sy;
        }
    }
    return out;
}

// Textura da areia (cor) e o mapa de relevo (normal map) das marquinhas de
// ondulação — as "costelinhas" que a corrente deixa no fundo do mar. Tudo
// gerado aqui (sem arquivo de imagem) e emendando sem costura.
function createSandTextures() {
    const size = q3(256, 512, 512);
    const n1 = tileableNoise(size, 8, 3);
    const n2 = tileableNoise(size, 32, 7);
    // Altura: ondulações (ripples) tortinhas + ruído miúdo.
    const height = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = y * size + x;
            const u = x / size;
            const v = y / size;
            const warp = n1[i] * 1.6;
            const ripple = Math.sin((u * 6 + v * 2) * Math.PI * 2 + warp * 3);
            height[i] = (Math.pow(Math.abs(ripple), 0.7) * Math.sign(ripple) * 0.5 + 0.5) * 0.7 + n2[i] * 0.3;
        }
    }
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = normalCanvas.height = size;
    const nctx = normalCanvas.getContext('2d');
    const nimg = nctx.createImageData(size, size);
    let st = 11;
    const rand = () => (st = (st * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = y * size + x;
            const h = height[i];
            // Cor: areia dourada, crista das ondinhas mais clara, vales mais
            // escuros, manchas grandes e grãos miúdos.
            const grain = (rand() - 0.5) * 26;
            const k = 0.82 + h * 0.3 + (n1[i] - 0.5) * 0.18;
            img.data[i * 4] = Math.min(255, 196 * k + grain);
            img.data[i * 4 + 1] = Math.min(255, 158 * k + grain * 0.9);
            img.data[i * 4 + 2] = Math.min(255, 100 * k + grain * 0.7);
            img.data[i * 4 + 3] = 255;
            // Normal pela diferença de altura dos vizinhos (com emenda).
            const hx = height[y * size + ((x + 1) % size)] - height[y * size + ((x - 1 + size) % size)];
            const hy = height[((y + 1) % size) * size + x] - height[((y - 1 + size) % size) * size + x];
            const nx = -hx * 3;
            const ny = -hy * 3;
            const len = Math.hypot(nx, ny, 1);
            nimg.data[i * 4] = (nx / len) * 127 + 128;
            nimg.data[i * 4 + 1] = (ny / len) * 127 + 128;
            nimg.data[i * 4 + 2] = (1 / len) * 127 + 128;
            nimg.data[i * 4 + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    // Pedrinhas e pedaços de concha espalhados.
    for (let i = 0; i < size / 3; i++) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = rand() < 0.5 ? 'rgba(255,246,226,0.5)' : 'rgba(120,96,70,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, 1 + rand() * 2.2, 0.7 + rand() * 1.3, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
    nctx.putImageData(nimg, 0, 0);
    const map = new THREE.CanvasTexture(canvas);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    [map, normalMap].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = q3(1, 4, 8);
    });
    map.encoding = THREE.sRGBEncoding;
    return { map, normalMap };
}

// 0 (plano) dentro da área do tabuleiro, subindo suave até 1 (relevo normal)
// um pouco além dela — mesma área que randomEnvironmentSpot evita.
function getBoardSandDamping(x, z) {
    const rows = getBoardRowCount(boardLength);
    const halfX = BOARD_ROW_WIDTH / 2 + 3;
    const halfZ = ((rows - 1) * BOARD_ROW_SPACING) / 2 + 2;
    const dx = Math.max(0, Math.abs(x) - halfX);
    const dz = Math.max(0, Math.abs(z) - halfZ);
    const d = Math.hypot(dx, dz);
    return 0.12 + 0.88 * Math.min(1, d / 3);
}

// ============ CHÃO DO MAR ============
// Altura do fundo em qualquer ponto — o chão é montado com ela e tudo que é
// posto no cenário (rochas, navios, plantas) usa a mesma conta pra ficar
// assentado na areia, inclusive nas dunas longe do tabuleiro.
const SEABED_BASE_Y = -0.15;
const SEABED_HALF_SIZE = 130;
let seabedMesh = null;

function getSeabedHeight(x, z) {
    // Ondulação fina de sempre, quase plana embaixo do tabuleiro.
    const ripple = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.42 + Math.sin(x * 1.7 - z * 1.3) * 0.09;
    const flat = ripple * getBoardSandDamping(x, z);
    // Dunas: começam devagar uns 10 de distância do tabuleiro e crescem até o
    // horizonte, onde o chão sobe como as encostas de um vale submarino.
    const d = getBoardKeepOutDistance(x, z);
    const near = THREE.MathUtils.smoothstep(d, 10, 45);
    const dunes = near * (1.6 + 1.2 * Math.sin(x * 0.08 + z * 0.05) + 0.8 * Math.sin(z * 0.11 - x * 0.04)) * 2.2;
    const r = Math.hypot(x, z);
    const bowl = THREE.MathUtils.smoothstep(r, 55, 125) * 10;
    return SEABED_BASE_Y + flat + dunes + bowl;
}

// Grade com espaçamento crescente: fina perto do tabuleiro (relevo do
// caminho, ondulações) e larga perto do horizonte (lá só tem duna e névoa).
// O mesmo número de vértices de uma grade uniforme bem menor.
function createSeabedGeometry() {
    const segments = q3(110, 130, 150);
    const geo = new THREE.PlaneGeometry(2, 2, segments, segments);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const warp = (t) => Math.sign(t) * (28 * Math.abs(t) + (SEABED_HALF_SIZE - 28) * Math.pow(Math.abs(t), 4));
    for (let i = 0; i < pos.count; i++) {
        const x = warp(pos.getX(i));
        const z = -warp(pos.getY(i)); // o plano é girado -90° em X: y local = -z do mundo
        pos.setXYZ(i, x, -z, getSeabedHeight(x, z) - SEABED_BASE_Y);
        // UV em unidades de mundo (6,4 por repetição), senão a textura
        // esticaria junto com a grade.
        uv.setXY(i, x / 4.2, -z / 4.2);
    }
    // Cor por vértice branca (neutra): a trilha do caminho escurece só onde
    // passa (carvePathIntoSeabed). Sem este atributo o chão sairia preto.
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = -pos.getY(i);
        // Manchas grandes e suaves: quebram a repetição da textura de longe.
        const k = 1 + 0.07 * Math.sin(x * 0.21 + Math.sin(z * 0.13) * 2) + 0.05 * Math.sin(z * 0.27 - x * 0.08);
        colors[i * 3] = k;
        colors[i * 3 + 1] = k * 0.995;
        colors[i * 3 + 2] = k * 0.985;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
}

function createSeabed() {
    const { map: texture, normalMap } = createSandTextures();
    // vertexColors: a trilha do caminho escurece a areia por vértice (ver
    // carvePathIntoSeabed, tabuleiro/caminho.js); fora dela a cor é branca (neutra).
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap,
        normalScale: new THREE.Vector2(0.9, 0.9),
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.96,
        metalness: 0,
    });
    const sand = new THREE.Mesh(createSeabedGeometry(), mat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = SEABED_BASE_Y;
    sand.receiveShadow = true;
    return sand;
}

function createOceanEnvironment() {
    // Antes isto só somava objetos: uma segunda partida aberta pelo menu
    // duplicava areia, plantas, pedras e caranguejos (e agora os bichos
    // animados do kit, que custam por frame).
    clearSeaScenery();
    disposeGroupChildren(environmentGroup);
    const sand = createSeabed();
    seabedMesh = sand;
    environmentGroup.add(sand);
    createCaustics(sand.geometry, environmentGroup);
    createWorldEdge(environmentGroup);

    linearizeModelColors(environmentGroup);
    environmentGroup.children.forEach((c) => {
        if (c.isMesh || c === worldEdgeGroup) freezeStatic(c);
    });
    // A decoração (createSeaScenery, cenario/decoracao.js) vem depois do
    // caminho e das casas — ela precisa saber onde eles ficam.
}
