// ============================================================
// MODELOS DO KIT NO MAPA (casas especiais, dado, cenário e bichos)
// ============================================================
// Usa o kit de modelos (MODELOS_FUNDO_DO_MAR, assets/models/) pra:
//   - marcar as casas especiais com um objeto que explica a regra
//     (corrente = anda, corrente ao contrário = volta, redemoinho = troca,
//     âncora = alguém fica parado, concha com pérola = bônus, bandeira = chegada);
//   - o visual do dado (a rotação continua sendo a do jogo, ver createDice);
//   - cenário (navio, casa-concha, baú, fontes, pedras, corais...) e bichos
//     nadando (peixes, águas-vivas, cavalos-marinhos).
// Tudo é só visual: nada aqui lê ou muda regra de jogo. Se o kit não carregar,
// cada função vira um "não faz nada" e o jogo segue com o visual antigo.

// Modelos animados do kit em cena — animate() (main.js) chama updateSeaProps.
const seaKitAnimated = [];

function hasSeaKit() {
    return typeof MODELOS_FUNDO_DO_MAR !== 'undefined';
}

// O renderer sai em sRGB (outputEncoding), mas na r128 uma cor hex entra no
// material como se já fosse linear — então sai bem mais clara na tela: o kit
// (feito pra r160, que converte sozinha) ficava com bases de areia quase
// brancas, e os peões clássicos/casas, desbotados (o amarelo do Bob virava
// creme). Converte UMA vez por material/geometria/textura (vários objetos
// compartilham material) — chamada logo depois de montar cada modelo/grupo.
// Não use em material que já recebeu cor convertida à mão.
const linearizedColors = new WeakSet();

function linearizeModelColors(object) {
    object.traverse((o) => {
        if (!o.isMesh && !o.isLine) return;
        const g = o.geometry;
        if (g && g.attributes.color && !linearizedColors.has(g)) {
            linearizedColors.add(g);
            const col = g.attributes.color;
            const tmp = new THREE.Color();
            for (let i = 0; i < col.count; i++) {
                tmp.setRGB(col.getX(i), col.getY(i), col.getZ(i)).convertSRGBToLinear();
                col.setXYZ(i, tmp.r, tmp.g, tmp.b);
            }
            col.needsUpdate = true;
        }
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
            if (!m || linearizedColors.has(m)) return;
            linearizedColors.add(m);
            if (m.color) m.color.convertSRGBToLinear();
            if (m.emissive) m.emissive.convertSRGBToLinear();
            if (m.map && !linearizedColors.has(m.map)) {
                linearizedColors.add(m.map);
                m.map.encoding = THREE.sRGBEncoding;
                m.map.needsUpdate = true;
            }
            m.needsUpdate = true;
        });
    });
}

// Tira modelos da lista de animação por frame (sem trocar o array: outros
// arquivos guardam referência a ele).
function stopAnimatingSeaModels(models) {
    for (let i = seaKitAnimated.length - 1; i >= 0; i--) {
        if (models.includes(seaKitAnimated[i])) seaKitAnimated.splice(i, 1);
    }
}

// Qualidades baixa e média: troca os materiais "com verniz" (MeshPhysical, caros por
// pixel) por MeshStandard equivalente. Um clone por material (cache).
const simplerMaterials = new Map();
function simplifyMaterials(object) {
    if (qualityLevel > 1) return;
    object.traverse((o) => {
        if (!o.isMesh) return;
        const swap = (m) => {
            if (!m || !m.isMeshPhysicalMaterial) return m;
            if (!simplerMaterials.has(m)) {
                const s = new THREE.MeshStandardMaterial();
                THREE.MeshStandardMaterial.prototype.copy.call(s, m);
                simplerMaterials.set(m, s);
                linearizedColors.add(s);
            }
            return simplerMaterials.get(m);
        };
        o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    });
}

function seaKitQuality() {
    return isLowPowerDevice ? 'baixa' : 'alta';
}

// Monta um modelo do kit já escalado. animated=false: não entra na lista de
// atualização por frame (usado pros modelos que vão ser "assados").
// Montes de areia do kit (base do navio, do baú, da casa-concha...) usam uma
// areia clara que, sobre o chão dourado do jogo, aparecia como uma mancha
// cinza-esbranquiçada. Pinta com o tom do chão (base de createSandTexture).
const SEA_KIT_SAND_COLOR = 0xe0c78f;
const FLOOR_SAND_COLOR = 0xc29a5c;

function matchSeaKitSandToFloor(object) {
    object.traverse((o) => {
        if (o.isMesh && !linearizedColors.has(o.material) && o.material.color) {
            if (o.material.color.getHex() === SEA_KIT_SAND_COLOR) o.material.color.setHex(FLOOR_SAND_COLOR);
        }
    });
}

function makeSeaModel(id, opts, scale, animated = true, list) {
    const model = MODELOS_FUNDO_DO_MAR.criarModelo(id, Object.assign({ qualidade: seaKitQuality() }, opts || {}));
    matchSeaKitSandToFloor(model.objeto);
    linearizeModelColors(model.objeto);
    simplifyMaterials(model.objeto);
    // Sem sombra por padrão: cada objeto que projeta sombra é desenhado DUAS
    // vezes por frame. Só quem precisa (marcos grandes, peões) liga de volta.
    setSeaModelShadows(model.objeto, false);
    model.objeto.scale.setScalar(scale || 1);
    model.lodSpec = { id, opts: opts || {} }; // pra montar a versão de longe (LOD)
    if (animated) seaKitAnimated.push(model);
    if (list) list.push(model);
    return model;
}

function setSeaModelShadows(object, cast) {
    object.traverse((o) => {
        if (o.isMesh) o.castShadow = cast;
    });
}

// "Assa" vários modelos ESTÁTICOS (pedras, corais) num punhado de malhas —
// uma por material — em vez de dezenas de malhas separadas. É o que permite
// espalhar bastante decoração sem pesar no celular (cada malha é uma chamada
// de desenho por frame).
function bakeStaticSeaModels(models, parent, castShadow = true, origin = null) {
    const buckets = new Map();
    models.forEach((m) => {
        m.objeto.updateMatrixWorld(true);
        // Bolhas e afins (grupo "efeitos" do kit) só têm tamanho/posição
        // certos enquanto a animação roda — paradas virariam esferas enormes.
        const skip = new Set();
        if (m.efeitos) m.efeitos.traverse((o) => skip.add(o));
        m.objeto.traverse((o) => {
            if (!o.isMesh || skip.has(o)) return;
            const g = o.geometry;
            // Só dá pra juntar geometrias com os mesmos atributos e o mesmo tipo de índice.
            const key =
                o.material.uuid + '|' + (g.index ? 'i' : 'n') + '|' + Object.keys(g.attributes).sort().join(',');
            if (!buckets.has(key)) buckets.set(key, { material: o.material, geos: [] });
            const baked = g.clone().applyMatrix4(o.matrixWorld);
            if (origin) baked.translate(-origin.x, -origin.y, -origin.z);
            buckets.get(key).geos.push(baked);
        });
        m.objeto.traverse((o) => {
            if (o.isMesh) o.geometry.dispose();
        });
    });
    buckets.forEach(({ material, geos }) => {
        const merged = THREE.BufferGeometryUtils.mergeGeometries(geos);
        geos.forEach((g) => g.dispose());
        if (!merged) return;
        const mesh = new THREE.Mesh(merged, material);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = true;
        parent.add(mesh);
    });
}

// ---------- Nível de detalhe (LOD) ----------
// O cenário parado de fora do tabuleiro é "assado" em LOD_SECTORS fatias
// (como as de uma pizza, em volta do centro); cada fatia é um THREE.LOD com
// duas versões: a de sempre (perto) e uma com ~4x menos segmentos
// (qualidade 'minima' do kit, mesmo formato porque o kit é determinístico),
// trocada a partir de lodFarDistance() da câmera. Fatia fora da tela nem é
// desenhada. O miolo (até innerRadius: o tabuleiro e o que está entre as
// casas) é dividido em quadrados de LOD_INNER_CELL — com a câmera seguindo
// um personagem, o outro lado do tabuleiro já usa a versão simples. Poucos
// blocos = poucas chamadas de desenho a mais (cada bloco custa uma por material).
const LOD_INNER_CELL = 18;
const LOD_SECTORS = 8;

function lodFarDistance() {
    return q3(22, 30, 38);
}

function makeFarSeaModel(m) {
    if (!m.lodSpec) return null;
    const far = makeSeaModel(m.lodSpec.id, Object.assign({}, m.lodSpec.opts, { qualidade: 'minima' }), 1, false);
    far.objeto.position.copy(m.objeto.position);
    far.objeto.quaternion.copy(m.objeto.quaternion);
    far.objeto.scale.copy(m.objeto.scale);
    // De longe, peças miúdas (pontinhas, pólipos) nem aparecem: ficam fora.
    far.objeto.updateMatrixWorld(true);
    const tiny = [];
    const scale = new THREE.Vector3();
    far.objeto.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        o.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
        if (o.geometry.boundingSphere.radius * Math.max(scale.x, scale.y, scale.z) < 0.06) tiny.push(o);
    });
    tiny.forEach((o) => {
        o.geometry.dispose();
        o.parent.remove(o);
    });
    return far;
}

// Miolo com sombra; fatias de fora sem (estão fora da área de sombra do sol).
function bakeStaticSeaModelsLOD(models, parent, innerRadius) {
    const cells = new Map();
    models.forEach((m) => {
        const p = m.objeto.position;
        let key;
        if (Math.hypot(p.x, p.z) < innerRadius) {
            key = 'm' + Math.floor(p.x / LOD_INNER_CELL) + ',' + Math.floor(p.z / LOD_INNER_CELL);
        } else {
            const a = (Math.atan2(p.z, p.x) + Math.PI) / (Math.PI * 2);
            key = 'f' + Math.min(LOD_SECTORS - 1, Math.floor(a * LOD_SECTORS));
        }
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(m);
    });
    const lods = [];
    cells.forEach((list, key) => {
        const center = new THREE.Vector3();
        list.forEach((m) => center.add(m.objeto.position));
        center.divideScalar(list.length);
        const farModels = list.map(makeFarSeaModel).filter(Boolean);
        const lod = new THREE.LOD();
        lod.position.copy(center);
        const near = new THREE.Group();
        bakeStaticSeaModels(list, near, key[0] === 'm', center);
        lod.addLevel(near, 0);
        if (farModels.length) {
            const far = new THREE.Group();
            bakeStaticSeaModels(farModels, far, false, center);
            lod.addLevel(far, lodFarDistance());
        }
        parent.add(lod);
        lods.push(lod);
    });
    return lods;
}

// Corrente "ao contrário" (voltar) ganha tons de vermelho — mesma linguagem de
// cor do resto do jogo (verde/azul = bom, vermelho = volta). Clona o
// material pra não pintar as correntes de avançar, que compartilham material.
function tintSeaModel(object, tint) {
    object.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.clone();
        linearizedColors.add(o.material); // o clone já herdou a cor convertida
        if (o.material.color) o.material.color.lerp(new THREE.Color(tint.color).convertSRGBToLinear(), tint.amount);
        if (o.material.emissive)
            o.material.emissive.lerp(new THREE.Color(tint.emissive).convertSRGBToLinear(), tint.amount);
    });
}

// ============ PLANTAS BALANÇANDO NA GPU ============
// Como bakeStaticSeaModels, mas pra algas/anêmonas: junta tudo em poucas
// malhas e o balanço com a corrente é feito no shader (cada vértice anda
// conforme a altura em relação à base da planta). As lâminas do kit são
// animadas vértice a vértice na CPU, com recálculo de normais — dezenas
// delas travariam o celular; assim custam 1-2 chamadas de desenho no total.
const swayingMaterials = [];
const swayMaterialCache = new Map();

function getSwayMaterial(source) {
    if (swayMaterialCache.has(source)) return swayMaterialCache.get(source);
    const mat = source.clone();
    const holder = { uniforms: { uTime: { value: 0 } } };
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = holder.uniforms.uTime;
        shader.vertexShader = shader.vertexShader
            .replace(
                '#include <common>',
                '#include <common>\nattribute float swayAmp;\nattribute float swayPhase;\nuniform float uTime;'
            )
            .replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\n' +
                    'transformed.x += sin(uTime * 1.1 + swayPhase + transformed.y * 1.7) * swayAmp;\n' +
                    'transformed.z += cos(uTime * 0.83 + swayPhase * 1.3 + transformed.y * 1.3) * swayAmp * 0.75;'
            );
    };
    swayMaterialCache.set(source, mat);
    swayingMaterials.push(holder);
    return mat;
}

function bakeSwayingSeaModels(models, parent) {
    const buckets = new Map();
    const box = new THREE.Box3();
    models.forEach((m) => {
        m.objeto.updateMatrixWorld(true);
        box.setFromObject(m.objeto);
        const baseY = m.objeto.position.y;
        const height = Math.max(0.2, box.max.y - baseY);
        const amp = Math.min(height, 5) * 0.07;
        const phase = Math.random() * Math.PI * 2;
        m.objeto.traverse((o) => {
            if (!o.isMesh) return;
            const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
            const pos = g.attributes.position;
            const amps = new Float32Array(pos.count);
            const phases = new Float32Array(pos.count).fill(phase);
            for (let i = 0; i < pos.count; i++) {
                const k = Math.min(1, Math.max(0, (pos.getY(i) - baseY) / height));
                amps[i] = Math.pow(k, 1.6) * amp;
            }
            g.setAttribute('swayAmp', new THREE.BufferAttribute(amps, 1));
            g.setAttribute('swayPhase', new THREE.BufferAttribute(phases, 1));
            const key =
                o.material.uuid + '|' + (g.index ? 'i' : 'n') + '|' + Object.keys(g.attributes).sort().join(',');
            if (!buckets.has(key)) buckets.set(key, { material: o.material, geos: [] });
            buckets.get(key).geos.push(g);
        });
        m.objeto.traverse((o) => {
            if (o.isMesh) o.geometry.dispose();
        });
    });
    buckets.forEach(({ material, geos }) => {
        const merged = THREE.BufferGeometryUtils.mergeGeometries(geos);
        geos.forEach((g) => g.dispose());
        if (!merged) return;
        const mesh = new THREE.Mesh(merged, getSwayMaterial(material));
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // o balanço tira os vértices do volume calculado
        parent.add(mesh);
    });
}

// Junta todas as malhas de UM modelo numa malha por material, dentro do
// próprio objeto (que continua podendo ser movido/girado inteiro). Pra
// objetos que o jogo anima "de fora" (moedas): de ~6 chamadas de desenho pra 1.
function flattenSeaModel(model) {
    const root = model.objeto;
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map();
    const m = new THREE.Matrix4();
    root.traverse((o) => {
        if (!o.isMesh) return;
        m.multiplyMatrices(inv, o.matrixWorld);
        const g = o.geometry.clone().applyMatrix4(m);
        const key = o.material.uuid + '|' + (g.index ? 'i' : 'n') + '|' + Object.keys(g.attributes).sort().join(',');
        if (!buckets.has(key)) buckets.set(key, { material: o.material, geos: [] });
        buckets.get(key).geos.push(g);
    });
    root.children.slice().forEach((c) => {
        root.remove(c);
        c.traverse((o) => o.geometry && o.geometry.dispose());
    });
    buckets.forEach(({ material, geos }) => {
        const merged = THREE.BufferGeometryUtils.mergeGeometries(geos);
        geos.forEach((g) => g.dispose());
        if (merged) root.add(new THREE.Mesh(merged, material));
    });
    stopAnimatingSeaModels([model]);
    return model;
}
