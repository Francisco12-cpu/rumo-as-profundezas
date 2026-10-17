// ============================================================
// DECORAÇÃO DO CENÁRIO E BICHOS (modelos do kit)
// ============================================================
// Monta o fundo do mar em volta (e por DENTRO) do tabuleiro, só com modelos
// do kit, a cada partida (depois do caminho e das casas, porque precisa
// saber onde eles ficam):
//   1. marcos: vulcão, navios, âncora enfeitada, floresta de algas gigantes
//      e baús — os das casas temáticas ficam ao lado da casa;
//   2. vãos entre as fileiras do caminho: corais, anêmonas, pedras, conchas,
//      ouriços e algas BAIXAS (não tampam as casas pra câmera);
//   3. em volta do tabuleiro e ao longe: algas, algas gigantes, corais,
//      pedras grandes;
//   4. bichos: cardumes que cruzam o tabuleiro (e fogem de quem passa),
//      cavalos-marinhos em grupos, águas-vivas e caranguejos andando.
// Desempenho: o que é parado vira poucas malhas ("assado", ver
// bakeStaticSeaModels); algas e anêmonas também, balançando na GPU
// (bakeSwayingSeaModels) — dezenas delas custam 1-2 chamadas de desenho.
// Só os bichos e alguns objetos com animação própria ficam individuais.
// Puro visual: nada aqui lê ou muda regra de jogo.

// Bichos que se deslocam pelo mapa (além da animação própria do kit).
const seaCreatures = [];
// Modelos do kit com animação própria (descartados ao montar outra partida).
let sceneryModels = [];
let sceneryGroup = null;
let fishSchools = [];
// Peixes desenhados por instâncias: por variante de cor, uma InstancedMesh
// por material do peixe do kit (ver createFishInstancer).
let fishInstancers = {};
let fishObjects = [];
let volcanoLandmark = null;

// Quanto pôr de cada coisa, por qualidade (0 baixa, 1 média, 2 alta).
function sceneryQuality() {
    return qualityLevel;
}

function clearSeaScenery() {
    stopAnimatingSeaModels(sceneryModels);
    sceneryModels.forEach((m) => m.descartar());
    sceneryModels = [];
    seaCreatures.length = 0;
    fishSchools = [];
    fishObjects = [];
    fishInstancers = {};
    volcanoLandmark = null;
    cameraObstacles.length = 0;
    if (sceneryGroup) {
        sceneryGroup.parent && sceneryGroup.parent.remove(sceneryGroup);
        sceneryGroup.traverse((o) => o.geometry && o.geometry.dispose());
        sceneryGroup = null;
    }
}

// ---------- Onde cada coisa cabe ----------
// Círculos já ocupados + distância mínima do caminho (getPathDistance).
function createScatterPlanner() {
    const placed = [];
    return {
        placed,
        reserve(x, z, r) {
            placed.push({ x, z, r });
        },
        fits(x, z, r, pathClear) {
            if (getPathDistance(x, z) < pathClear + r) return false;
            if (Math.hypot(x, z) > SEABED_HALF_SIZE - 20) return false;
            for (let i = 0; i < placed.length; i++) {
                const p = placed[i];
                if (Math.hypot(p.x - x, p.z - z) < p.r + r) return false;
            }
            return true;
        },
        // Procura em espiral, a partir de (x, z), o lugar livre mais perto.
        near(x, z, r, pathClear, maxRadius) {
            for (let d = 0; d <= maxRadius; d += 0.5) {
                const steps = Math.max(1, Math.round(d * 3));
                const a0 = Math.random() * Math.PI * 2;
                for (let k = 0; k < steps; k++) {
                    const a = a0 + (k / steps) * Math.PI * 2;
                    const px = x + Math.cos(a) * d;
                    const pz = z + Math.sin(a) * d;
                    if (this.fits(px, pz, r, pathClear)) {
                        this.reserve(px, pz, r);
                        return { x: px, z: pz };
                    }
                }
            }
            return null;
        },
        // Um lugar aleatório numa faixa de distância do centro.
        random(r, pathClear, minDist, maxDist, attempts = 40) {
            for (let i = 0; i < attempts; i++) {
                const a = Math.random() * Math.PI * 2;
                const d = minDist + Math.random() * (maxDist - minDist);
                const px = Math.cos(a) * d * 1.15;
                const pz = Math.sin(a) * d;
                if (this.fits(px, pz, r, pathClear)) {
                    this.reserve(px, pz, r);
                    return { x: px, z: pz };
                }
            }
            return null;
        },
    };
}

// Modelo do kit no lugar (x, z), assentado na areia.
// Cenário usa a geometria "baixa" do kit (menos segmentos): de longe não se
// nota, e o mapa tem centenas de objetos.
function placeSeaModel(id, opts, scale, spot, parent, list) {
    const m = makeSeaModel(id, Object.assign({ qualidade: 'baixa' }, opts || {}), scale, !!list, list);
    m.objeto.position.set(spot.x, getSeabedHeight(spot.x, spot.z) - 0.04, spot.z);
    m.objeto.rotation.y = spot.rot !== undefined ? spot.rot : Math.random() * Math.PI * 2;
    if (parent) parent.add(m.objeto);
    return m;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (a, b) => a + Math.random() * (b - a);

// Direção "pra fora" do tabuleiro a partir de uma casa (onde cabe um marco).
function getOutwardDirection(index) {
    const p = getTilePosition(index);
    const keep = getBoardKeepOut();
    if (Math.abs(p.x) > BOARD_ROW_WIDTH / 2 - 1.5) return { x: Math.sign(p.x), z: 0 };
    if (p.z < -keep.z + 4) return { x: 0, z: -1 };
    return { x: 0, z: p.z > 0 ? 1 : -1 };
}

function createSeaScenery() {
    if (!hasSeaKit() || !environmentGroup || !boardCurve) return;
    clearSeaScenery();
    sceneryGroup = new THREE.Group();
    environmentGroup.add(sceneryGroup);
    const q = sceneryQuality();
    const planner = createScatterPlanner();
    const statics = [];
    const swaying = [];

    // Reserva as casas, o portal da largada, a casa-concha e o baú da chegada.
    for (let i = 0; i < boardLength; i++) {
        const p = getTilePosition(i);
        planner.reserve(p.x, p.z, 1.05);
    }
    const t0 = getTileTangent(0);
    const p0 = getTilePosition(0);
    planner.reserve(p0.x - t0.x * 2.8, p0.z - t0.z * 2.8, 1.6);
    planner.reserve(p0.x, p0.z, 1.9);
    const tl = getTileTangent(boardLength - 1);
    const pl = getTilePosition(boardLength - 1);
    planner.reserve(pl.x + tl.x * 2.1, pl.z + tl.z * 2.1, 1.4);
    const deck = getCardDeckSpot();
    if (deck) planner.reserve(deck.x, deck.z, 1.3);

    createLandmarks(planner, statics, swaying, q);
    fillBoardGaps(planner, statics, swaying, q);
    decorateSurroundings(planner, statics, swaying, q);

    // Em blocos com nível de detalhe (versão simples de longe). Sombra só pro
    // que está perto (dentro da área de sombra do sol, ver renderizador.js):
    // o resto custaria o dobro de desenho à toa.
    bakeStaticSeaModelsLOD(statics, sceneryGroup, 24).forEach(freezeStatic);
    bakeSwayingSeaModels(swaying, sceneryGroup);
    sceneryGroup.children.forEach((c) => {
        if (c.isMesh && !c.isInstancedMesh) freezeStatic(c);
    });
    createSeaCreatures(planner, q);
}

// ---------- 1. Marcos ----------
function createLandmarks(planner, statics, swaying, q) {
    const layout = getBoardLayout();
    const themed = {};
    if (layout) layout.tiles.forEach((t, i) => THEMED_TILE_TYPE_IDS.includes(t) && (themed[t] = i));
    // Lugar do marco: ao lado da casa temática, pra fora do tabuleiro; sem
    // casa temática, em algum lugar em volta.
    const spotFor = (type, r, pathClear) => {
        if (themed[type] !== undefined) {
            const i = themed[type];
            const p = getTilePosition(i);
            const dir = getOutwardDirection(i);
            const s = planner.near(p.x + dir.x * (r + 1.8), p.z + dir.z * (r + 1.8), r, pathClear, 9);
            if (s) return s;
        }
        return planner.random(r, pathClear, 15, 26);
    };

    // Vulcão de aquário: grande, ponto de referência do mapa.
    const vs = spotFor('vulcao', 2.3, 1.4);
    if (vs) {
        const v = placeSeaModel('fonte', { qualidade: 'alta' }, 4.2, vs, sceneryGroup, sceneryModels);
        setSeaModelShadows(v.objeto, true);
        const light = new THREE.PointLight(0xff7a2a, 0.6, 9, 2);
        light.position.set(vs.x, v.objeto.position.y + 3.6, vs.z);
        sceneryGroup.add(light);
        volcanoLandmark = { model: v, light, base: v.objeto.position.clone(), next: 4, active: 0 };
        cameraObstacles.push({ x: vs.x, z: vs.z, r: 2.6, top: v.objeto.position.y + 3.6 });
    }

    // Navios afundados: pelo menos dois, grandes (o casco tem ~4 de comprimento).
    const shipCount = q === 0 ? 2 : 3;
    for (let i = 0; i < shipCount; i++) {
        const s = i === 0 ? spotFor('navio', 4.6, 2) : planner.random(4.6, 2, 17, 32);
        if (!s) continue;
        statics.push(placeSeaModel('navio', null, 2.7 + Math.random() * 0.5, s));
        cameraObstacles.push({ x: s.x, z: s.z, r: 4.2, top: getSeabedHeight(s.x, s.z) + 3 });
    }

    // Âncora enfeitada: corais crescendo na base, algas e conchas em volta.
    const as = spotFor('ancora', 1.9, 1.4);
    if (as) {
        statics.push(placeSeaModel('ancora', null, 1.8, as));
        const around = (d, a) => ({ x: as.x + Math.cos(a) * d, z: as.z + Math.sin(a) * d });
        statics.push(placeSeaModel('coral', { cor: 'rosa' }, 0.8, around(0.9, 0.4)));
        statics.push(placeSeaModel('coral', { cor: 'amarelo' }, 0.6, around(1.2, 2.2)));
        statics.push(placeSeaModel('concha', null, 0.7, around(1.5, 3.6)));
        statics.push(placeSeaModel('pedras', null, 0.6, around(1.4, 5.0)));
        swaying.push(placeSeaModel('alga', { altura: 1.6 }, 1.1, around(1.6, 1.2)));
        swaying.push(placeSeaModel('alga', { altura: 1.2 }, 1.1, around(1.7, 4.3)));
        swaying.push(placeSeaModel('anemona', { cor: 'laranja' }, 0.8, around(1.1, 2.9)));
    }

    // Floresta de algas gigantes (ao lado da casa "Floresta de Algas").
    const ks = spotFor('alga', 2.4, 1.3);
    if (ks) {
        cameraObstacles.push({ x: ks.x, z: ks.z, r: 2.8, top: getSeabedHeight(ks.x, ks.z) + 4.8 });
        const n = q === 0 ? 5 : 8;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const d = i === 0 ? 0 : between(0.9, 2.2);
            swaying.push(
                placeSeaModel('algaGigante', { altura: between(3, 4.6), seed: i * 7 + 3 }, 1, {
                    x: ks.x + Math.cos(a) * d,
                    z: ks.z + Math.sin(a) * d,
                })
            );
        }
    }

    // Baús do tesouro espalhados (entreabertos, soltando bolhas).
    // Só um animado (bolhas, tampa balançando); os outros entram assados.
    for (let i = 0; i < (q === 0 ? 2 : 3); i++) {
        const s = planner.random(1.1, 1.6, 13, 30);
        if (!s) continue;
        if (i === 0) placeSeaModel('bau', null, 1.1, s, sceneryGroup, sceneryModels);
        else statics.push(placeSeaModel('bau', null, 1.1, s));
    }
}

// ---------- 2. Vãos entre as fileiras (e o miolo das curvas) ----------
// Só coisa baixa: a câmera olha por cima, e nada pode tampar as casas.
function fillBoardGaps(planner, statics, swaying, q) {
    const keep = getBoardKeepOut();
    const step = [1.8, 1.6, 1.4][q];
    const colors = ['rosa', 'laranja', 'roxo', 'azul', 'amarelo'];
    // Canteiros: cada um é um grupinho de 1 a 4 coisas do mesmo "tema" —
    // fica natural (como recifes de verdade) em vez de itens soltos.
    const themes = [
        (spot) => statics.push(placeSeaModel('coral', { cor: pick(colors) }, between(0.7, 0.95), spot)),
        (spot) => swaying.push(placeSeaModel('anemona', { cor: pick(colors) }, between(0.65, 0.85), spot)),
        (spot) => statics.push(placeSeaModel('pedras', null, between(0.4, 0.62), spot)),
        (spot) => swaying.push(placeSeaModel('alga', { altura: between(0.6, 0.85), laminas: 4 }, 0.95, spot)),
        (spot) => statics.push(placeSeaModel('concha', null, between(0.55, 0.72), spot)),
        (spot) => statics.push(placeSeaModel('ourico', null, between(0.55, 0.72), spot)),
    ];
    const recipes = [
        [0, 1, 0, 5],
        [2, 2, 5, 4],
        [3, 3, 0],
        [0, 0, 3],
        [0, 4, 2],
        [2, 0, 3, 1],
    ];
    for (let x = -keep.x + 0.4; x <= keep.x - 0.4; x += step) {
        for (let z = -keep.z + 1; z <= keep.z - 1; z += step) {
            const cx = x + (Math.random() - 0.5) * step * 0.7;
            const cz = z + (Math.random() - 0.5) * step * 0.7;
            const d = getPathDistance(cx, cz);
            if (d < 1.55 || d > 7 || Math.random() < 0.08) continue;
            const recipe = pick(recipes);
            const n = 1 + Math.floor(Math.random() * recipe.length);
            for (let k = 0; k < n; k++) {
                const a = Math.random() * Math.PI * 2;
                const px = cx + (k ? Math.cos(a) * between(0.35, 0.6) : 0);
                const pz = cz + (k ? Math.sin(a) * between(0.35, 0.6) : 0);
                if (!planner.fits(px, pz, 0.26, 1.15)) continue;
                themes[recipe[k]]({ x: px, z: pz });
                planner.reserve(px, pz, 0.26);
            }
        }
    }
}

// ---------- 3. Em volta do tabuleiro e ao longe ----------
function decorateSurroundings(planner, statics, swaying, q) {
    const mul = [0.5, 0.6, 0.8][q];
    const put = (count, r, clear, minD, maxD, fn) => {
        for (let i = 0; i < Math.round(count * mul); i++) {
            const s = planner.random(r, clear, minD, maxD);
            if (s) fn(s);
        }
    };
    const colors = ['rosa', 'laranja', 'roxo', 'azul', 'amarelo'];
    // Algas em touceiras (centro + vizinhas).
    put(18, 0.5, 1.5, 11, 26, (s) => {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) {
            const a = Math.random() * Math.PI * 2;
            const spot = { x: s.x + Math.cos(a) * k * 0.45, z: s.z + Math.sin(a) * k * 0.45 };
            swaying.push(placeSeaModel('alga', { altura: between(1.3, 2.6) }, between(1.1, 1.4), spot));
        }
    });
    put(10, 0.9, 2, 14, 34, (s) =>
        swaying.push(placeSeaModel('algaGigante', { altura: between(3.4, 5.5), seed: Math.floor(s.x * 13) }, 1, s))
    );
    put(16, 0.7, 1.6, 12, 30, (s) => statics.push(placeSeaModel('coral', { cor: pick(colors) }, between(1.2, 1.9), s)));
    put(8, 0.5, 1.5, 12, 30, (s) =>
        swaying.push(placeSeaModel('anemona', { cor: pick(colors) }, between(0.9, 1.25), s))
    );
    put(14, 0.9, 1.6, 12, 34, (s) => statics.push(placeSeaModel('pedras', null, between(1, 2.3), s)));
    put(10, 0.45, 1.5, 12, 30, (s) => statics.push(placeSeaModel('concha', null, between(0.8, 1.1), s)));
    put(10, 0.35, 1.5, 12, 30, (s) => statics.push(placeSeaModel('ourico', null, between(0.8, 1.1), s)));
    // Conchas que abrem e fecham (animadas): poucas, perto do tabuleiro.
    put(3, 0.45, 1.5, 11, 18, (s) => placeSeaModel('concha', null, 1, s, sceneryGroup, sceneryModels));
    // Longe: recifes grandes e pedras enormes (só silhueta na névoa).
    put(12, 2.5, 3, 36, 60, (s) => statics.push(placeSeaModel('pedras', null, between(3, 5.5), s)));
    put(10, 2, 3, 34, 60, (s) => statics.push(placeSeaModel('coral', { cor: pick(colors) }, between(2.5, 4), s)));
    put(8, 1.5, 3, 34, 60, (s) =>
        swaying.push(placeSeaModel('algaGigante', { altura: between(4.5, 7), seed: Math.floor(s.z * 7) }, 1.3, s))
    );
}

// ---------- 4. Bichos ----------
function createSeaCreatures(planner, q) {
    const variants = ['coral', 'lima', 'lilas', 'azul', 'sol', 'rosa'];
    // Peixes: todos desenhados por instâncias (ver createFishInstancer) — o
    // peixe do kit tem 12 malhas, e dezenas deles eram metade das chamadas de
    // desenho do jogo. Aqui cada "peixe" é só um Object3D com posição/giro.
    const schools = [3, 4, 5][q];
    const perSchool = [4, 5, 6][q];
    const newFish = (variant, scale) => {
        const o = new THREE.Object3D();
        o.scale.setScalar(scale);
        o.userData.fish = addFishInstance(variant, Math.random() * 10);
        return o;
    };
    for (let s = 0; s < schools; s++) {
        const variant = variants[s % variants.length];
        const school = {
            pos: new THREE.Vector3(between(-20, 20), between(1.8, 4), between(-16, 16)),
            heading: Math.random() * Math.PI * 2,
            speed: between(1.1, 1.7),
            turn: 0,
            altitude: between(1.6, 4.2),
            members: [],
        };
        for (let f = 0; f < perSchool; f++) {
            const o = newFish(f === 0 || Math.random() < 0.8 ? variant : pick(variants), between(0.85, 1.15));
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 0.9,
                (Math.random() - 0.5) * 2.2
            );
            o.position.copy(school.pos).add(offset);
            school.members.push({ object: o, offset, vel: new THREE.Vector3(), flee: new THREE.Vector3() });
            fishObjects.push(o);
        }
        fishSchools.push(school);
    }
    // Cardumes distantes (só silhueta na névoa): giram longe, sem física.
    for (let s = 0; s < (q === 0 ? 1 : 3); s++) {
        const center = { x: between(-1, 1) * 45, z: (s % 2 ? 1 : -1) * (40 + Math.random() * 15) };
        for (let f = 0; f < 8; f++) {
            const o = newFish(pick(variants), 1.4);
            fishObjects.push(o);
            seaCreatures.push({
                kind: 'farFish',
                object: o,
                center,
                radius: 6 + f * 0.6,
                height: 5 + f * 0.4,
                speed: 0.12,
                phase: f * 0.5 + s,
            });
        }
    }

    // Cavalos-marinhos em grupos de 3, perto de algas/corais.
    const horseColors = ['laranja', 'amarelo', 'rosa', 'verde'];
    for (let g = 0; g < [1, 2, 3][q]; g++) {
        const s = planner.random(1.2, 1.4, 11, 22);
        if (!s) continue;
        const color = horseColors[g % horseColors.length];
        for (let k = 0; k < 3; k++) {
            const model = makeSeaModel(
                'cavaloMarinho',
                { cor: k === 2 ? pick(horseColors) : color },
                between(0.75, 0.95),
                true,
                sceneryModels
            );
            setSeaModelShadows(model.objeto, false);
            sceneryGroup.add(model.objeto);
            seaCreatures.push({
                kind: 'seahorse',
                object: model.objeto,
                center: { x: s.x + (k - 1) * 0.6, z: s.z + Math.sin(k * 2) * 0.4 },
                phase: k * 1.9 + g,
            });
        }
    }

    // Águas-vivas: flutuam alto, cruzando devagar por cima do tabuleiro.
    const jellyColors = ['lilas', 'rosa', 'azul'];
    for (let i = 0; i < [1, 3, 4][q]; i++) {
        const model = makeSeaModel('aguaViva', { cor: jellyColors[i % 3] }, between(0.9, 1.3), true, sceneryModels);
        setSeaModelShadows(model.objeto, false);
        sceneryGroup.add(model.objeto);
        seaCreatures.push({
            kind: 'jelly',
            object: model.objeto,
            // Em volta do tabuleiro (não por cima): passando baixo na frente da
            // câmera do personagem, tampavam a jogada.
            center: (() => {
                const a = (i / 4) * Math.PI * 2 + Math.random();
                const r = between(15, 21);
                return { x: Math.cos(a) * r * 1.2, z: Math.sin(a) * r };
            })(),
            height: between(3, 5.5),
            phase: i * 2.1,
        });
    }

    // Caranguejos andando de lado em volta do tabuleiro.
    for (let i = 0; i < (q === 0 ? 2 : 4); i++) {
        const s = planner.random(0.5, 1.4, 11, 20);
        if (!s) continue;
        // Achatado numa malha por material: o caranguejo do kit tem ~58 peças
        // (era o bicho mais caro do mapa). Ele anda de lado inteiro, sem
        // mexer as perninhas — de longe não faz diferença.
        const model = flattenSeaModel(makeSeaModel('caranguejo', { base: false, qualidade: 'baixa' }, 0.55, false));
        sceneryModels.push(model);
        sceneryGroup.add(model.objeto);
        seaCreatures.push({
            kind: 'crab',
            object: model.objeto,
            center: s,
            phase: Math.random() * 10,
            range: between(1.2, 2.5),
        });
    }
}

// ---------- Peixes instanciados ----------
const FISH_CAPACITY = 40;

function createFishInstancer(variant) {
    const model = MODELOS_FUNDO_DO_MAR.criarModelo('peixe', { variante: variant, qualidade: 'baixa' });
    linearizeModelColors(model.objeto);
    model.atualizar(0);
    model.objeto.updateMatrixWorld(true);
    const buckets = new Map();
    model.objeto.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
        const key = o.material.uuid + '|' + (g.index ? 'i' : 'n') + '|' + Object.keys(g.attributes).sort().join(',');
        if (!buckets.has(key)) buckets.set(key, { material: o.material, geos: [] });
        buckets.get(key).geos.push(g);
    });
    const phases = new Float32Array(FISH_CAPACITY);
    const meshes = [];
    buckets.forEach(({ material, geos }) => {
        const merged = THREE.BufferGeometryUtils.mergeGeometries(geos);
        geos.forEach((g) => g.dispose());
        if (!merged) return;
        merged.setAttribute('fishPhase', new THREE.InstancedBufferAttribute(phases, 1));
        const mesh = new THREE.InstancedMesh(merged, getSwimMaterial(material), FISH_CAPACITY);
        mesh.count = 0;
        mesh.frustumCulled = false;
        sceneryGroup.add(mesh);
        meshes.push(mesh);
    });
    model.descartar();
    return { meshes, phases, count: 0 };
}

function addFishInstance(variant, phase) {
    if (!fishInstancers[variant]) fishInstancers[variant] = createFishInstancer(variant);
    const inst = fishInstancers[variant];
    if (inst.count >= FISH_CAPACITY) return null;
    const slot = inst.count++;
    inst.phases[slot] = phase;
    inst.meshes.forEach((m) => {
        m.count = inst.count;
        m.geometry.attributes.fishPhase.needsUpdate = true;
    });
    return { inst, slot };
}

// Rabo e corpo do peixe balançando no shader (o rabo fica em z negativo no
// modelo do kit): substitui a animação de CPU do kit, que exigia uma malha
// por peixe.
const swimMaterialCache = new Map();

function getSwimMaterial(source) {
    if (swimMaterialCache.has(source)) return swimMaterialCache.get(source);
    const mat = source.clone();
    const holder = { uniforms: { uTime: { value: 0 } } };
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = holder.uniforms.uTime;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nattribute float fishPhase;\nuniform float uTime;')
            .replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\n' +
                    'float tailK = clamp((-transformed.z - 0.1) / 0.32, 0.0, 1.0);\n' +
                    'float swing = sin(uTime * 7.0 + fishPhase);\n' +
                    'transformed.x += swing * (0.13 * tailK * tailK + 0.012);'
            );
    };
    swimMaterialCache.set(source, mat);
    swayingMaterials.push(holder);
    return mat;
}

const _fishMatrix = new THREE.Matrix4();

function updateFishInstances() {
    for (let i = 0; i < fishObjects.length; i++) {
        const o = fishObjects[i];
        const f = o.userData.fish;
        if (!f) continue;
        _fishMatrix.compose(o.position, o.quaternion.setFromEuler(o.rotation), o.scale);
        for (let k = 0; k < f.inst.meshes.length; k++) f.inst.meshes[k].setMatrixAt(f.slot, _fishMatrix);
    }
    for (const v in fishInstancers) fishInstancers[v].meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
}

// ---------- Movimento por frame ----------
const _fishTmp = new THREE.Vector3();
const _fishTarget = new THREE.Vector3();

function updateFishSchools(dt, elapsed) {
    const keep = getBoardKeepOut();
    for (let s = 0; s < fishSchools.length; s++) {
        const sc = fishSchools[s];
        // O líder passeia: muda de direção aos poucos e volta pro centro
        // quando se afasta demais (assim o cardume sempre cruza o tabuleiro).
        sc.turn += (Math.random() - 0.5) * dt * 1.2;
        sc.turn *= 0.98;
        const r = Math.hypot(sc.pos.x, sc.pos.z);
        const toCenter = Math.atan2(-sc.pos.x, -sc.pos.z);
        let diff = toCenter - sc.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        const pull = r > keep.x + 12 ? 0.9 : 0;
        sc.heading += (sc.turn + diff * pull) * dt;
        sc.pos.x += Math.sin(sc.heading) * sc.speed * dt;
        sc.pos.z += Math.cos(sc.heading) * sc.speed * dt;
        sc.pos.y = sc.altitude + Math.sin(elapsed * 0.4 + s) * 0.6;
        const cos = Math.cos(sc.heading);
        const sin = Math.sin(sc.heading);
        for (let m = 0; m < sc.members.length; m++) {
            const fish = sc.members[m];
            const o = fish.object;
            // Lugar no cardume (offset girado pra direção do líder).
            _fishTarget.set(
                sc.pos.x + fish.offset.x * cos + fish.offset.z * sin,
                sc.pos.y + fish.offset.y,
                sc.pos.z - fish.offset.x * sin + fish.offset.z * cos
            );
            // Foge de personagens que passam perto (o cardume "se espalha").
            fish.flee.multiplyScalar(0.94);
            for (let p = 0; p < pawns.length; p++) {
                const pawn = pawns[p];
                if (!pawn) continue;
                _fishTmp.copy(o.position).sub(pawn.position);
                const d = _fishTmp.length();
                if (d < 2.4) fish.flee.add(_fishTmp.normalize().multiplyScalar((2.4 - d) * 0.6));
            }
            // ...e da câmera: um cardume passando colado na lente tampa a jogada.
            _fishTmp.copy(o.position).sub(camera.position);
            const dc = _fishTmp.length();
            if (dc < 4.5) fish.flee.add(_fishTmp.normalize().multiplyScalar((4.5 - dc) * 0.5));
            _fishTarget.add(fish.flee);
            _fishTmp.copy(_fishTarget).sub(o.position);
            fish.vel.lerp(_fishTmp.multiplyScalar(1.6), Math.min(1, dt * 2.5));
            o.position.addScaledVector(fish.vel, dt);
            if (fish.vel.lengthSq() > 0.01) {
                const yaw = Math.atan2(fish.vel.x, fish.vel.z);
                let dy = yaw - o.rotation.y;
                dy = Math.atan2(Math.sin(dy), Math.cos(dy));
                o.rotation.y += dy * Math.min(1, dt * 5);
            }
        }
    }
}

function updateSeaCreature(c, elapsed) {
    const o = c.object;
    if (c.kind === 'farFish') {
        const a = elapsed * c.speed + c.phase;
        o.position.set(
            c.center.x + Math.cos(a) * c.radius,
            c.height + Math.sin(elapsed + c.phase) * 0.3,
            c.center.z + Math.sin(a) * c.radius
        );
        o.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
    } else if (c.kind === 'jelly') {
        o.position.set(
            c.center.x + Math.sin(elapsed * 0.05 + c.phase) * 3,
            c.height + Math.sin(elapsed * 0.4 + c.phase) * 0.8,
            c.center.z + Math.cos(elapsed * 0.04 + c.phase) * 3
        );
    } else if (c.kind === 'seahorse') {
        o.position.set(
            c.center.x + Math.sin(elapsed * 0.35 + c.phase) * 0.35,
            getSeabedHeight(c.center.x, c.center.z) + 0.5 + Math.sin(elapsed * 0.9 + c.phase) * 0.25,
            c.center.z + Math.cos(elapsed * 0.3 + c.phase) * 0.3
        );
    } else if (c.kind === 'crab') {
        // Anda de lado, pra lá e pra cá, com paradinhas.
        const k = Math.sin(elapsed * 0.45 + c.phase);
        const walk = Math.sign(k) * Math.pow(Math.abs(k), 0.6);
        const x = c.center.x + walk * c.range;
        o.position.set(x, getSeabedHeight(x, c.center.z) - 0.02, c.center.z);
        o.rotation.y = Math.PI / 2 + Math.sin(elapsed * 0.2 + c.phase) * 0.3;
    }
}

// Vulcão: a cada ~10 s uma erupção — a brasa acende, jorra bolha e areia, e
// o vulcão treme.
function updateVolcano(dt, elapsed) {
    const v = volcanoLandmark;
    if (!v) return;
    v.next -= dt;
    if (v.next <= 0 && v.active <= 0) {
        v.active = 2.6;
        v.next = 9 + Math.random() * 5;
        playVolcanoSound(v.base);
    }
    const o = v.model.objeto;
    if (v.active > 0) {
        v.active -= dt;
        const k = Math.sin(Math.min(1, (2.6 - v.active) / 2.6) * Math.PI);
        if (v.model.definirAtividade) v.model.definirAtividade(1 + k * 3.5);
        v.light.intensity = 0.6 + k * 2.4;
        o.position.x = v.base.x + (Math.random() - 0.5) * 0.06 * k;
        o.position.z = v.base.z + (Math.random() - 0.5) * 0.06 * k;
        const crater = new THREE.Vector3(v.base.x, v.base.y + 3.4, v.base.z);
        if (Math.random() < 0.6) spawnBubbles(crater, 2 + Math.round(k * 3));
        if (Math.random() < 0.15 * k)
            spawnDustParticles(
                new THREE.Vector3(
                    v.base.x + (Math.random() - 0.5) * 3,
                    v.base.y + 0.1,
                    v.base.z + (Math.random() - 0.5) * 3
                )
            );
    } else {
        o.position.x = v.base.x;
        o.position.z = v.base.z;
        v.light.intensity = 0.6 + Math.sin(elapsed * 2) * 0.1;
    }
}

// Chamada todo frame por animate() (main.js). Bichos e modelos animados
// longe da câmera atualizam com menos frequência (não dá pra perceber de
// longe, e é o que mais pesa no celular).
let sceneryFrame = 0;

function updateSeaProps(elapsed, deltaTime) {
    const dt = Math.min(deltaTime || 0.016, 0.1);
    sceneryFrame++;
    const cam = camera.position;
    for (let i = 0; i < seaKitAnimated.length; i++) {
        const m = seaKitAnimated[i];
        const p = m.objeto.position;
        const far = (p.x - cam.x) ** 2 + (p.z - cam.z) ** 2 > 1600;
        if (!far || (sceneryFrame + i) % 3 === 0) m.atualizar(elapsed);
    }
    for (let i = 0; i < seaCreatures.length; i++) updateSeaCreature(seaCreatures[i], elapsed);
    updateFishSchools(dt, elapsed);
    updateFishInstances();
    updateVolcano(dt, elapsed);
    for (let i = 0; i < swayingMaterials.length; i++) swayingMaterials[i].uniforms.uTime.value = elapsed;
}
