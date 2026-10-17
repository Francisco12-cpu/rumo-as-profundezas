// GERADO por tools/adaptar-kit-modelos.js a partir do kit original — não edite à mão;
// mude o kit e rode o script de novo. Precisa de vendor/three.min.js + vendor/three-r128-extras.js.
(function () {
'use strict';
const THREE = window.THREE;
const mergeGeometries = THREE.BufferGeometryUtils.mergeGeometries;
const RoundedBoxGeometry = THREE.RoundedBoxGeometry;
/**
 * FUNDO DO MAR — kit de modelos 3D para jogo de tabuleiro (Three.js r160)
 *
 * Uso no seu jogo:
 *   import { criarModelo, CATALOGO } from './modelos-fundo-do-mar.js';
 *   const polvo = criarModelo('polvo', { corJogador: '#ff5d5d' });
 *   scene.add(polvo.objeto);
 *   polvo.objeto.position.set(casaX, alturaDoTabuleiro, casaZ);
 *   // no loop de animação:
 *   polvo.atualizar(relogio.getElapsedTime());
 *   // ao remover:
 *   polvo.descartar();
 *
 * Escala: 1 unidade = 1 casa do tabuleiro. Peões cabem num círculo de raio 0,5
 * (a base tem 0,5 de raio; sem base, o bicho fica dentro de 0,47) e têm a origem
 * no centro da base, encostada no chão (y = 0). Frente = +Z.
 *
 * Opções de criarModelo(id, opcoes):
 *   corJogador  '#rrggbb'  cor do anel da base (peões) e da bandeira
 *   base        true/false com ou sem base de peão (padrão: true)
 *   qualidade   'alta' | 'baixa' (menos polígonos para celular fraco)
 *   variante    peixe: 'coral' | 'lima' | 'lilas'
 *   cor         coral: 'rosa' | 'laranja' | 'roxo'   dado: 'perola' | 'coral' | 'abismo'
 *   altura      algas: altura das folhas (padrão 1.5)
 *   deitada     moeda: true = deitada no chão (padrão: em pé girando)
 *
 * Retorno: { id, info, objeto, efeitos, atualizar(t), definirCorJogador(hex), descartar() }
 * "efeitos" guarda bolhas e partículas; tire esse grupo antes de exportar.
 *
 * Dado: além do básico, tem rolar(valor) e valor().
 *   const n = await dado.rolar();        // sorteia 1–6 e anima
 *   await dado.rolar(valorDoServidor);   // jogo online: anima até o valor decidido pelo servidor
 */

const V3 = THREE.Vector3;
const V2 = THREE.Vector2;
const TAU = Math.PI * 2;
const Z = new V3(0, 0, 1);

const CATALOGO = [
  {id: 'polvo',      nome: 'Polvo',             tipo: 'peao'},
  {id: 'estrela',    nome: 'Estrela-do-mar',    tipo: 'peao'},
  {id: 'caracol',    nome: 'Caracol',           tipo: 'peao'},
  {id: 'caranguejo', nome: 'Caranguejo',        tipo: 'peao'},
  {id: 'esponja',    nome: 'Esponja-do-mar',    tipo: 'peao'},
  {id: 'dado',       nome: 'Dado',              tipo: 'jogo'},
  {id: 'moeda',      nome: 'Moeda',             tipo: 'jogo'},
  {id: 'redemoinho', nome: 'Redemoinho',        tipo: 'jogo'},
  {id: 'corrente',   nome: 'Corrente marinha',  tipo: 'jogo'},
  {id: 'bandeira',   nome: 'Bandeira de chegada', tipo: 'jogo'},
  {id: 'bau',        nome: 'Baú do tesouro',    tipo: 'cenario'},
  {id: 'casaConcha', nome: 'Casa-concha',       tipo: 'cenario'},
  {id: 'navio',      nome: 'Navio naufragado',  tipo: 'cenario'},
  {id: 'ancora',     nome: 'Âncora',            tipo: 'cenario'},
  {id: 'fonte',      nome: 'Fonte de bolhas',   tipo: 'cenario'},
  {id: 'alga',       nome: 'Algas',             tipo: 'cenario'},
  {id: 'algaGigante', nome: 'Alga gigante',      tipo: 'cenario'},
  {id: 'pedras',     nome: 'Pedras',            tipo: 'cenario'},
  {id: 'coral',      nome: 'Coral',             tipo: 'cenario'},
  {id: 'concha',     nome: 'Concha com pérola', tipo: 'cenario'},
  {id: 'peixe',      nome: 'Peixe',             tipo: 'cenario', grupo: 'criatura'},
  {id: 'aguaViva',   nome: 'Água-viva',         tipo: 'cenario', grupo: 'criatura'},
  {id: 'cavaloMarinho', nome: 'Cavalo-marinho', tipo: 'cenario', grupo: 'criatura'},
  {id: 'anemona',    nome: 'Anêmona',           tipo: 'cenario', grupo: 'criatura'},
  {id: 'ourico',     nome: 'Ouriço-do-mar',     tipo: 'cenario', grupo: 'criatura'},
];
const ESTILOS_DADO = {perola: 'Pérola', coral: 'Coral', abismo: 'Abismo'};
const DADOS = {perola: [0xfaf4ea, 0x1d3557, 0xe63950], coral: [0xff7a6b, 0xfff4ec, 0xffe066], abismo: [0x173b5c, 0xffd166, 0x5fe0d0]};
const FACES_DADO = {1: [0, 1, 0], 6: [0, -1, 0], 2: [0, 0, 1], 5: [0, 0, -1], 3: [1, 0, 0], 4: [-1, 0, 0]};
const CORES_JOGADOR = [
  ['Vermelho', '#ff5d5d'], ['Azul', '#4d9dff'], ['Verde', '#4fd17a'], ['Amarelo', '#ffd23f'],
  ['Roxo', '#b07cff'], ['Laranja', '#ff9a3c'], ['Branco', '#f2f2f2'],
];
const PEIXES = {
  coral: {n: 'Coral', c: [0xff8a70, 0xd9534f, 0xffe6cc]},
  lima:  {n: 'Lima',  c: [0xcfe86a, 0x5f9e3f, 0xf8f4c8]},
  lilas: {n: 'Lilás', c: [0xbfa0ff, 0x7656d8, 0xf1e9ff]},
  azul:  {n: 'Azul',  c: [0x5cbcff, 0x1f6fd1, 0xe0f4ff]},
  sol:   {n: 'Sol',   c: [0xffd34d, 0xf08a24, 0xfff5cc]},
  rosa:  {n: 'Rosa',  c: [0xff9ccc, 0xd9468f, 0xffe8f4]},
};
const VARIANTES_PEIXE = Object.fromEntries(Object.entries(PEIXES).map(([k, v]) => [k, v.n]));
const CORAIS = {rosa: [0xff6f7d, 0xffd1b8], laranja: [0xff9548, 0xffe2b8], roxo: [0x9d6bff, 0xeedcff],
  azul: [0x4d9dff, 0xd6ecff], amarelo: [0xffc93a, 0xfff1b8]};
// Variações de cor das anêmonas, águas-vivas e cavalos-marinhos (opção "cor").
const ANEMONAS = {rosa: [0xd94fa0, 0xffd6f0, 0x5fae6e], laranja: [0xff7a3d, 0xffe0c2, 0x6f9e5a],
  roxo: [0x8a4fd9, 0xe8d6ff, 0x4f8f7a], azul: [0x3d8fd9, 0xd6efff, 0x4f9a8a], amarelo: [0xe0b422, 0xfff3c2, 0x6fae5e]};
const MEDUSAS = {
  lilas: {sino: 0xbfa8ff, sinoEm: 0x6a4cff, braco: [0xd7c8ff, 0x8f7bff, 0xf2ecff], bracoEm: 0x3a2a80, tent: 0xd8ccff, tentEm: 0x6a5cff},
  rosa:  {sino: 0xffaad6, sinoEm: 0xff4fa3, braco: [0xffd0ea, 0xff7bc0, 0xfff0f8], bracoEm: 0x80204f, tent: 0xffcce6, tentEm: 0xff5cae},
  azul:  {sino: 0x9fe3ff, sinoEm: 0x2fa8ff, braco: [0xc8f0ff, 0x6bc8ff, 0xeefaff], bracoEm: 0x1f4f80, tent: 0xccefff, tentEm: 0x4cb8ff},
};
const CAVALOS = {laranja: [0xff9f4a, 0xffdca3], amarelo: [0xffcf3a, 0xfff2b8], rosa: [0xff8fb8, 0xffd9e8], verde: [0x8fcf5a, 0xe6f7c0]};

/* =========================================================
   Utilidades
   ========================================================= */
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
let C = null;
const seg = n => Math.max(C && C.q < 0.5 ? 3 : 5, Math.round(n * (C ? C.q : 1)));
function malha(geo, mat, pai, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  (pai || C.corpo).add(m);
  return m;
}
function rb(w, h, d, mat, pai, x, y, z, r = 0.03) {
  return malha(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) * 0.45)), mat, pai, x, y, z);
}
function haste(a, b, r, mat, pai) {
  const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), len = d.length();
  const m = malha(new THREE.CylinderGeometry(r, r, len, seg(12)), mat, pai);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
  return m;
}
function naElipse(a, b, c, d) {
  d = d.clone().normalize();
  const p = new V3(d.x * a, d.y * b, d.z * c);
  const n = new V3(p.x / (a * a), p.y / (b * b), p.z / (c * c)).normalize();
  return {p, n};
}
function orientar(obj, n) { obj.quaternion.setFromUnitVectors(Z, n.clone().normalize()); return obj; }
function olho(pai, r, pos, dir = Z) {
  const M = mats(), g = new THREE.Group();
  g.position.copy(pos);
  orientar(g, dir);
  pai.add(g);
  malha(new THREE.SphereGeometry(r, seg(24), seg(16)), M.olho, g);
  malha(new THREE.SphereGeometry(r * 0.62, seg(20), seg(14)), M.pupila, g, 0, 0, r * 0.55).castShadow = false;
  malha(new THREE.SphereGeometry(r * 0.17, 10, 8), M.reflexo, g, r * 0.22, r * 0.26, r * 1.05).castShadow = false;
  C.olhos.push(g);
  return g;
}
function sorriso(pai, r, pos, n = Z) {
  const m = malha(new THREE.TorusGeometry(r, r * 0.26, 8, 20, Math.PI), mats().boca, pai, pos.x, pos.y, pos.z);
  m.quaternion.setFromUnitVectors(Z, n.clone().normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(Z, Math.PI));
  m.castShadow = false;
  return m;
}
function bochecha(pai, pos, n = Z, s = 0.04) {
  const m = orientar(malha(new THREE.SphereGeometry(1, 16, 10), mats().bochecha, pai, pos.x, pos.y, pos.z), n);
  m.scale.set(s, s * 0.62, s * 0.22);
  m.castShadow = false;
  return m;
}
function rochaGeo(seed, detalhe = 2) {
  const g = new THREE.IcosahedronGeometry(1, detalhe), p = g.attributes.position, r = rng(seed);
  const f = [r() * 6, r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + 0.16 * Math.sin(x * 2.3 + f[0]) * Math.sin(y * 2.1 + f[1]) + 0.1 * Math.sin(z * 3.7 + f[2] + x * 1.3) + 0.05 * Math.sin((x + y + z) * 6 + f[3]);
    p.setXYZ(i, x * n, Math.max(y * n, -0.55), z * n);
  }
  g.computeVertexNormals();
  return g;
}
function monteAreia(R, H, seed) {
  const g = new THREE.SphereGeometry(1, seg(40), seg(12), 0, TAU, 0, Math.PI / 2), p = g.attributes.position, r = rng(seed);
  const a = r() * 6, b = r() * 6;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    p.setXYZ(i, x * R, y * H * (1 + 0.12 * Math.sin(x * 4 + a) * Math.cos(z * 5 + b)), z * R);
  }
  g.computeVertexNormals();
  return g;
}
function inverter(geo) {
  const g = geo.clone(), idx = g.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const n = g.attributes.normal;
  for (let i = 0; i < n.array.length; i++) n.array[i] *= -1;
  return g;
}
function assar(grupo, pai) {
  grupo.updateMatrixWorld(true);
  const porMat = new Map();
  grupo.traverse(o => {
    if (!o.isMesh) return;
    if (!porMat.has(o.material)) porMat.set(o.material, []);
    porMat.get(o.material).push(o.geometry.clone().applyMatrix4(o.matrixWorld));
    o.geometry.dispose();
  });
  for (const [mat, gs] of porMat) { malha(mergeGeometries(gs), mat, pai); gs.forEach(g => g.dispose()); }
}
function bolhas(c, ancora, {n = 6, alt = 1.6, vel = 0.35, esp = 0.06, tam = 0.035} = {}) {
  const M = mats(), w = new V3(), lista = [];
  for (let i = 0; i < n; i++) {
    const b = malha(new THREE.SphereGeometry(1, 12, 8), M.bolha, c.efeitos);
    b.castShadow = b.receiveShadow = false;
    lista.push({b, ph: i / n, dx: (Math.sin(i * 12.9898) * 0.5) * esp});
  }
  c.anim.push(t => {
    ancora.getWorldPosition(w);
    c.efeitos.worldToLocal(w);
    lista.forEach((o, i) => {
      const ph = (t * vel / alt + o.ph) % 1;
      o.b.position.set(w.x + o.dx + Math.sin(t * 3 + i * 2) * esp * ph, w.y + ph * alt, w.z + Math.cos(t * 2.5 + i) * esp * ph);
      const s = tam * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7 + 1))) * (0.6 + ph * 0.6);
      o.b.scale.setScalar(ph < 0.06 ? s * ph / 0.06 + 0.0001 : s);
      o.b.visible = ph < 0.97;
    });
  });
}
function formaEstrela(Ro, Ri, N = 160) {
  const sh = new THREE.Shape(), n = seg(N);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + i / n * TAU, k = Math.pow((1 + Math.cos(5 * (a - Math.PI / 2))) / 2, 1.7), rr = Ri + (Ro - Ri) * k;
    i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return sh;
}
function formaArco(w, h, Tipo = THREE.Shape) {
  const s = new Tipo();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, 0);
  return s;
}
function formaVieira(s = 1) {
  const sh = new THREE.Shape(), cy = -0.055 * s, N = 40;
  sh.moveTo(-0.03 * s, -0.08 * s); sh.lineTo(-0.03 * s, -0.06 * s);
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * (0.95 - 0.9 * i / N), r = 0.12 * s * (1 + 0.05 * Math.abs(Math.cos(a * 9)));
    sh.lineTo(Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  sh.lineTo(0.03 * s, -0.06 * s); sh.lineTo(0.03 * s, -0.08 * s); sh.lineTo(-0.03 * s, -0.08 * s);
  return sh;
}
function tuboAfunilado(pts, raio, TS = 60, RS = 10) {
  const curva = new THREE.CatmullRomCurve3(pts), ts = seg(TS), rs = seg(RS);
  const g = new THREE.TubeGeometry(curva, ts, 1, rs, false), p = g.attributes.position, P = new V3(), v = new V3();
  for (let i = 0; i <= ts; i++) {
    curva.getPointAt(i / ts, P);
    const r = raio(i / ts, P);
    for (let j = 0; j <= rs; j++) {
      const idx = i * (rs + 1) + j;
      v.fromBufferAttribute(p, idx).sub(P).multiplyScalar(r).add(P);
      p.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  g.userData.ts = ts; g.userData.rs = rs; g.userData.curva = curva;
  return g;
}
function pintar(g, fn) {
  const p = g.attributes.position, col = new Float32Array(p.count * 3), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(tmp, i, p.getX(i), p.getY(i), p.getZ(i)); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const _tex = new Map();
function texturaCanvas(chave, w, h, desenhar) {
  if (typeof document === 'undefined') return null;
  if (_tex.has(chave)) return _tex.get(chave);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  if (!g) return null;
  desenhar(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  _tex.set(chave, t);
  return t;
}
function ondular(c, geo, {h, amp = 0.16, ampZ = 0.12, ph = 0, vel = 1.1, freq = 2.2}) {
  const p = geo.attributes.position, base = p.array.slice();
  c.anim.push(t => {
    const a = p.array;
    for (let i = 0; i < p.count; i++) {
      const y = base[i * 3 + 1], k = Math.pow(Math.min(1, Math.abs(y) / h), 1.5);
      a[i * 3] = base[i * 3] + Math.sin(t * vel + ph + y * freq) * amp * k;
      a[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * vel * 0.77 + ph * 1.3 + y * freq * 0.73) * ampZ * k;
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });
}
function laminas(c, pai, {n = 5, altura = 1.5, seed = 31, raio = 0.08, largura = 0.1, cores, material, pendurada = false, amp = 0.16} = {}) {
  const r = rng(seed), mat = material || mats().alga;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + r() * 0.6, d = raio * (0.6 + r());
    const g = new THREE.Group(); g.position.set(Math.cos(a) * d, pendurada ? 0 : 0.02, Math.sin(a) * d); g.rotation.y = r() * TAU; pai.add(g);
    const h = altura * (0.65 + r() * 0.4), geo = laminaGeo(h, largura * (1 + r() * 0.5), i + seed, cores);
    if (pendurada) geo.rotateX(Math.PI);
    malha(geo, mat, g).frustumCulled = false;
    ondular(c, geo, {h, amp, ampZ: amp * 0.75, ph: r() * TAU});
  }
}
function alturaMonte(x, z, R, H) { return H * Math.sqrt(Math.max(0, 1 - (Math.hypot(x, z) / R) ** 2)); }
function piscar(c) {
  const off = (c.id.length * 0.71) % 3;
  c.anim.push(t => {
    const k = (t + off) % 4.2, s = k < 0.15 ? Math.max(0.1, Math.abs(k - 0.075) / 0.075) : 1;
    c.olhos.forEach(o => o.scale.y = s);
  });
}

/* =========================================================
   Materiais compartilhados
   ========================================================= */
let _M = null;
function mats() {
  if (_M) return _M;
  const toy = (c, o = {}) => new THREE.MeshPhysicalMaterial({color: c, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, ...o});
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: 0.65, ...o});
  _M = {
    polvo: toy(0x35c6d4), polvoEscuro: toy(0x1d97a8), polvoClaro: toy(0xb6f3f5),
    bochecha: toy(0xff8fb1, {roughness: 0.7, clearcoat: 0}),
    olho: toy(0xffffff, {roughness: 0.12, clearcoat: 1}),
    pupila: toy(0x111417, {roughness: 0.08, clearcoat: 1}),
    reflexo: new THREE.MeshBasicMaterial({color: 0xffffff}),
    boca: std(0x2b1418, {roughness: 0.5}),
    estrela: toy(0xff8a3d), estrelaClaro: toy(0xffcf8f),
    pedra: std(0x6d7a84, {roughness: 0.95, flatShading: true}),
    pedraEscura: std(0x48545d, {roughness: 0.95, flatShading: true}),
    craca: std(0xeee5cf, {roughness: 0.8}),
    musgo: std(0x5c9a48, {roughness: 0.9}),
    caracol: toy(0xbccb7c), concha: toy(0xffffff, {vertexColors: true, roughness: 0.35}),
    caranguejo: toy(0xe8553d), caranguejoClaro: toy(0xffb58e), caranguejoEscuro: toy(0xb93b29),
    esponja: toy(0xffffff, {vertexColors: true, roughness: 0.8, clearcoat: 0.1}),
    esponjaBase: toy(0x6b42ab, {roughness: 0.85, clearcoat: 0}),
    base: toy(0x22333f, {roughness: 0.45}), baseTopo: std(0xe3cf9f, {roughness: 0.95}),
    madeira: std(0x7b4c2b, {roughness: 0.85}), madeiraEscura: std(0x4f2e17, {roughness: 0.9}),
    metal: std(0x5d6267, {metalness: 0.75, roughness: 0.45}),
    ouro: std(0xffc93a, {metalness: 0.65, roughness: 0.28, emissive: 0x8a5600, emissiveIntensity: 0.7}),
    gemaVermelha: toy(0xff3358, {roughness: 0.08, clearcoat: 1, emissive: 0x55001a, emissiveIntensity: 0.8}),
    gemaVerde: toy(0x2ee68a, {roughness: 0.08, clearcoat: 1, emissive: 0x004d26, emissiveIntensity: 0.8}),
    areia: std(0xe0c78f, {roughness: 1}),
    alga: std(0xffffff, {vertexColors: true, roughness: 0.55, side: THREE.DoubleSide}),
    algaBase: std(0x2c5f30, {roughness: 0.85}),
    peixe: toy(0xffffff, {vertexColors: true, roughness: 0.35}),
    conchaFora: toy(0xffffff, {vertexColors: true, roughness: 0.5}),
    conchaDentro: toy(0xffb8c6, {roughness: 0.45, clearcoat: 0.5}),
    perola: new THREE.MeshPhysicalMaterial({color: 0xfbf7ff, roughness: 0.15, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.35, emissive: 0x2a2633, emissiveIntensity: 0.6}),
    bolha: new THREE.MeshPhysicalMaterial({color: 0xe6fbff, roughness: 0.05, transparent: true, opacity: 0.4, clearcoat: 1, depthWrite: false}),
  };
  return _M;
}
const _cache = new Map();
function matCor(chave, fn) { if (!_cache.has(chave)) _cache.set(chave, fn()); return _cache.get(chave); }

/* =========================================================
   Base do peão (com anel na cor do jogador)
   ========================================================= */
function basePeao(c, cor) {
  const M = mats();
  const perfil = [[0, 0], [0.44, 0], [0.468, 0.01], [0.48, 0.035], [0.47, 0.06], [0.445, 0.075], [0, 0.075]].map(([x, y]) => new V2(x, y));
  malha(new THREE.LatheGeometry(perfil, seg(64)), M.base, c.raiz);
  const anel = new THREE.MeshStandardMaterial({color: cor, emissive: cor, emissiveIntensity: 0.6, roughness: 0.35});
  c.proprios.push(anel);
  const t = malha(new THREE.TorusGeometry(0.481, 0.016, seg(10), seg(80)), anel, c.raiz, 0, 0.036, 0);
  t.rotation.x = Math.PI / 2;
  t.castShadow = false;
  malha(new THREE.CylinderGeometry(0.43, 0.43, 0.004, seg(56)), M.baseTopo, c.raiz, 0, 0.0755, 0);
  return anel;
}

/* =========================================================
   Geometrias especiais
   ========================================================= */
function conchaEspiral() {
  const A = 0.19, k = 0.165, tmax = 4.3 * Math.PI, N = 90, cy = 0.33, cen = new V3(0, cy, 0);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const th = i / N * tmax, r = A * Math.exp(-k * th), ph = -Math.PI / 2 - th;
    pts.push(new V3(0, cy + r * Math.sin(ph), r * Math.cos(ph)));
  }
  const curva = new THREE.CatmullRomCurve3(pts), TS = seg(200), RS = seg(28);
  const g = new THREE.TubeGeometry(curva, TS, 1, RS, false);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const P = new V3(), v = new V3(), tmp = new THREE.Color();
  const cA = new THREE.Color(0xe9a24c), cB = new THREE.Color(0x96512a), cC = new THREE.Color(0xf8e8c4);
  for (let i = 0; i <= TS; i++) {
    curva.getPointAt(i / TS, P);
    const rad = 0.78 * P.distanceTo(cen);
    for (let j = 0; j <= RS; j++) {
      const idx = i * (RS + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(P);
      const lat = Math.abs(v.x);
      v.multiplyScalar(rad);
      v.x *= 1.45;
      v.add(P);
      pos.setXYZ(idx, v.x, v.y, v.z);
      tmp.copy(cA);
      if ((i / TS * 26) % 1 < 0.16) tmp.lerp(cB, 0.3);
      if (lat > 0.5 && lat < 0.76) tmp.copy(cB);
      if (lat > 0.88) tmp.lerp(cC, 0.65);
      col[idx * 3] = tmp.r; col[idx * 3 + 1] = tmp.g; col[idx * 3 + 2] = tmp.b;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
function tuboEsponja(r, h, seed) {
  const w = r * 0.3, pts = [], tipo = [];
  const p = (x, y, t) => { pts.push(new V2(x, y)); tipo.push(t); };
  p(0.001, 0, 0); p(r * 0.8, 0, 0);
  const n = 12;
  for (let i = 1; i <= n; i++) p(r * (0.92 + 0.08 * Math.sin(i / n * Math.PI) + 0.04 * Math.sin(i * 1.3 + seed)), h * 0.94 * i / n, 1);
  p(r * 1.02, h * 0.975, 2); p(r * 0.95, h, 2); p(r - w * 0.5, h * 1.003, 2);
  p(r - w, h * 0.97, 3); p(r - w, h * 0.6, 3); p(r - w, h * 0.3, 3); p(0.001, h * 0.28, 3);
  const S = seg(36), g = new THREE.LatheGeometry(pts, S);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const cOut = new THREE.Color(0xa983e6), cLow = new THREE.Color(0x7a4fc4), cLip = new THREE.Color(0xe6d0ff), cIn = new THREE.Color(0x3a1d61), tmp = new THREE.Color();
  for (let s = 0; s <= S; s++) for (let i = 0; i < pts.length; i++) {
    const idx = s * pts.length + i, ang = s / S * TAU, ty = tipo[i];
    const x = pos.getX(idx), y = pos.getY(idx), z = pos.getZ(idx);
    if (ty === 1) {
      const b = 0.012 * Math.sin(ang * 9 + y * 26) * Math.cos(y * 17 - ang * 4) + 0.006 * Math.sin(ang * 17 + y * 40);
      const k = 1 + b / Math.max(0.01, Math.hypot(x, z));
      pos.setXYZ(idx, x * k, y, z * k);
      tmp.copy(cLow).lerp(cOut, Math.min(1, y / h * 1.4));
      if (b > 0.009) tmp.lerp(cLip, 0.4);
    } else if (ty === 2) tmp.copy(cLip);
    else if (ty === 3) tmp.copy(cIn);
    else tmp.copy(cLow);
    col[idx * 3] = tmp.r; col[idx * 3 + 1] = tmp.g; col[idx * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
function laminaGeo(h, w, seed, cores = [0x2b7a3a, 0x9fd65e, 0xc4e87d]) {
  const N = seg(18), pos = [], col = [], idx = [];
  const cB = new THREE.Color(cores[0]), cT = new THREE.Color(cores[1]), cE = new THREE.Color(cores[2]), tmp = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const u = i / N, y = u * h;
    const half = w * Math.pow(Math.sin(Math.PI * Math.min(u * 1.08, 1)), 0.6) * (1 + 0.2 * Math.sin(u * 37 + seed * 3)) * (1 - 0.25 * u) + 0.004;
    const cx = 0.06 * Math.sin(u * 3 + seed) * u;
    for (let k = -1; k <= 1; k++) {
      pos.push(cx + k * half, y, k === 0 ? half * 0.35 : 0);
      tmp.copy(cB).lerp(cT, Math.pow(u, 0.8));
      if (k) tmp.lerp(cE, 0.25);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < N; i++) for (let k = 0; k < 2; k++) {
    const a = i * 3 + k, b = a + 1, cc = a + 3, d = a + 4;
    idx.push(a, b, cc, b, d, cc);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function nadadeira(shape, depth) {
  const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 10});
  g.translate(0, 0, -depth / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

/* =========================================================
   Construtores
   ========================================================= */
const CONSTRUTORES = {

  /* ---------- PEÕES ---------- */
  polvo(c) {
    const M = mats(), A = 0.3, B = 0.34, Cz = 0.29;
    const cab = new THREE.Group(); cab.position.y = 0.53; c.corpo.add(cab);
    malha(new THREE.SphereGeometry(1, seg(48), seg(32)), M.polvo, cab).scale.set(A, B, Cz);
    const r = rng(11);
    for (let i = 0; i < 16; i++) {
      const d = new V3(r() * 2 - 1, r() * 1.4 - 0.25, r() * 2 - 1);
      if (d.lengthSq() < 0.1) continue;
      d.normalize();
      if (d.z > 0.1 && d.y < 0.5) continue;
      const {p, n} = naElipse(A, B, Cz, d), s = 0.02 + r() * 0.028;
      orientar(malha(new THREE.SphereGeometry(1, 14, 10), M.polvoEscuro, cab, p.x, p.y, p.z), n).scale.set(s, s, s * 0.3);
    }
    for (const sx of [-1, 1]) {
      const e = naElipse(A, B, Cz, new V3(sx * 0.36, 0.1, 0.93));
      olho(cab, 0.085, e.p.clone().addScaledVector(e.n, -0.035), e.n.clone().lerp(Z, 0.55));
      const b = naElipse(A, B, Cz, new V3(sx * 0.62, -0.2, 0.76));
      bochecha(cab, b.p, b.n, 0.05);
    }
    const m = naElipse(A, B, Cz, new V3(0, -0.24, 0.97));
    sorriso(cab, 0.035, m.p, m.n);
    const BASE = [-1.28, 0.3, 0.34, 0.38, 0.44, 0.52], L = 0.07, R0 = 0.064, n = BASE.length, tent = [];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU + TAU / 16;
      const raiz = new THREE.Group(); raiz.position.set(Math.cos(a) * 0.15, 0.34, Math.sin(a) * 0.15); raiz.rotation.y = -a; c.corpo.add(raiz);
      let pai = raiz; const js = [];
      for (let i = 0; i < n; i++) {
        const j = new THREE.Group(); if (i) j.position.x = L; j.rotation.z = BASE[i]; pai.add(j); js.push(j);
        const r0 = R0 * (1 - i / n * 0.72), r1 = R0 * (1 - (i + 1) / n * 0.72);
        const g = new THREE.CylinderGeometry(r1, r0, L, seg(16), 1, true); g.rotateZ(-Math.PI / 2); g.translate(L / 2, 0, 0);
        malha(g, M.polvo, j);
        malha(new THREE.SphereGeometry(r0, seg(16), seg(10)), M.polvo, j);
        if (i >= 2) { const s = malha(new THREE.SphereGeometry(r1 * 0.42, 10, 6), M.polvoClaro, j, L * 0.5, r1 * 0.82, 0); s.scale.y = 0.45; s.castShadow = false; }
        pai = j;
      }
      malha(new THREE.SphereGeometry(R0 * 0.28, 10, 8), M.polvo, pai, L, 0, 0);
      tent.push({js, ph: k * 0.85});
    }
    c.anim.push(t => {
      const b = Math.sin(t * 2);
      cab.position.y = 0.53 + b * 0.018;
      cab.scale.set(1 - b * 0.015, 1 + b * 0.03, 1 - b * 0.015);
      for (const tt of tent) tt.js.forEach((j, i) => { j.rotation.z = BASE[i] + Math.sin(t * 2.2 + tt.ph + i * 0.8) * 0.14 * (i / (n - 1) * 0.8 + 0.2); });
    });
  },

  estrela(c) {
    const M = mats();
    const ro = malha(rochaGeo(5, 2), M.pedra, c.corpo, 0, 0.1, -0.2); ro.scale.set(0.22, 0.17, 0.17);
    const st = new THREE.Group(); st.position.set(0, 0.31, 0.03); st.rotation.x = -0.62; c.corpo.add(st);
    const sh = new THREE.Shape(), Ro = 0.35, Ri = 0.14, N = seg(160);
    for (let i = 0; i <= N; i++) {
      const a = Math.PI / 2 + i / N * TAU, k = Math.pow((1 + Math.cos(5 * (a - Math.PI / 2))) / 2, 1.7), rr = Ri + (Ro - Ri) * k;
      i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const D = 0.05, BT = 0.045;
    const g = new THREE.ExtrudeGeometry(sh, {depth: D, bevelEnabled: true, bevelThickness: BT, bevelSize: 0.035, bevelSegments: seg(5), curveSegments: 4});
    g.translate(0, 0, -D / 2);
    malha(g, M.estrela, st);
    const zf = D / 2 + BT;
    for (let k = 0; k < 5; k++) {
      const a = Math.PI / 2 + k * TAU / 5;
      [[0.17, 0.03], [0.235, 0.025], [0.3, 0.018]].forEach(([d, s]) => {
        const m = malha(new THREE.SphereGeometry(s, 12, 8), M.estrelaClaro, st, Math.cos(a) * d, Math.sin(a) * d, zf - s * 0.3);
        m.scale.z = 0.7; m.castShadow = false;
      });
      for (const o of [-0.2, 0.2]) {
        const b = a + o;
        malha(new THREE.SphereGeometry(0.014, 10, 6), M.estrelaClaro, st, Math.cos(b) * 0.2, Math.sin(b) * 0.2, zf - 0.004).castShadow = false;
      }
    }
    for (const sx of [-1, 1]) {
      olho(st, 0.05, new V3(sx * 0.058, 0.03, zf + 0.012), new V3(sx * 0.15, 0.05, 1));
      bochecha(st, new V3(sx * 0.1, -0.035, zf + 0.002), Z, 0.026);
    }
    sorriso(st, 0.028, new V3(0, -0.04, zf + 0.004), Z);
    c.anim.push(t => { st.rotation.z = Math.sin(t * 1.4) * 0.09; const s = 1 + Math.sin(t * 2.1) * 0.025; st.scale.set(s, s, 1); });
  },

  caracol(c) {
    const M = mats();
    const corpo = new THREE.Group(); c.corpo.add(corpo);
    const pe = malha(new THREE.CapsuleGeometry(0.11, 0.46, seg(8), seg(24)), M.caracol, corpo, 0, 0.082, 0.02);
    pe.rotation.x = Math.PI / 2; pe.scale.set(1.2, 1, 0.72);
    malha(new THREE.SphereGeometry(0.1, seg(24), seg(16)), M.caracol, corpo, 0, 0.15, 0.24).scale.set(1.05, 1, 1.25);
    const cab = new THREE.Group(); cab.position.set(0, 0.21, 0.31); corpo.add(cab);
    malha(new THREE.SphereGeometry(0.105, seg(32), seg(20)), M.caracol, cab);
    sorriso(cab, 0.026, new V3(0, -0.025, 0.1), new V3(0, -0.1, 1));
    for (const sx of [-1, 1]) bochecha(cab, new V3(sx * 0.06, -0.01, 0.085), new V3(sx * 0.5, 0, 1), 0.022);
    const talos = [];
    for (const sx of [-1, 1]) {
      const tg = new THREE.Group(); tg.position.set(sx * 0.045, 0.07, 0.02); tg.rotation.set(0.38, 0, -sx * 0.3); cab.add(tg);
      haste([0, 0, 0], [0, 0.25, 0], 0.017, M.caracol, tg);
      olho(tg, 0.056, new V3(0, 0.28, 0), new V3(sx * 0.25, -0.35, 1));
      tg.userData = {rz: -sx * 0.3, k: sx};
      talos.push(tg);
      const tt = new THREE.Group(); tt.position.set(sx * 0.05, -0.03, 0.08); tt.rotation.set(1.15, 0, -sx * 0.45); cab.add(tt);
      haste([0, 0, 0], [0, 0.08, 0], 0.012, M.caracol, tt);
      malha(new THREE.SphereGeometry(0.016, 10, 8), M.caracol, tt, 0, 0.08, 0);
    }
    const concha = new THREE.Group(); concha.position.set(0, 0, -0.05); corpo.add(concha);
    malha(conchaEspiral(), M.concha, concha);
    malha(new THREE.SphereGeometry(0.13, seg(24), seg(16)), M.caracol, concha, 0, 0.15, 0.03).scale.set(1.3, 0.85, 0.8);
    c.anim.push(t => {
      corpo.scale.z = 1 + Math.sin(t * 1.6) * 0.03;
      concha.position.y = Math.sin(t * 1.6 + 0.6) * 0.008;
      talos.forEach(tg => {
        tg.rotation.z = tg.userData.rz + Math.sin(t * 1.8 + tg.userData.k) * 0.12;
        tg.rotation.x = 0.38 + Math.sin(t * 1.3 + tg.userData.k * 2) * 0.08;
      });
    });
  },

  caranguejo(c) {
    const M = mats(), A = 0.33, B = 0.15, Cz = 0.25;
    const corpo = new THREE.Group(); corpo.position.y = 0.21; c.corpo.add(corpo);
    malha(new THREE.SphereGeometry(1, seg(48), seg(28)), M.caranguejo, corpo).scale.set(A, B, Cz);
    malha(new THREE.SphereGeometry(1, seg(40), seg(20)), M.caranguejoClaro, corpo, 0, -0.035, 0).scale.set(A * 0.94, B * 0.7, Cz * 0.92);
    const r = rng(17);
    for (let i = 0; i < 9; i++) {
      const d = new V3(r() * 2 - 1, 0.7 + r() * 0.5, r() * 1.6 - 1);
      const {p, n} = naElipse(A, B, Cz, d), s = 0.018 + r() * 0.02;
      orientar(malha(new THREE.SphereGeometry(1, 12, 8), M.caranguejoEscuro, corpo, p.x, p.y, p.z), n).scale.set(s, s, s * 0.35);
    }
    for (const x of [-0.17, -0.085, 0.085, 0.17]) {
      const {p, n} = naElipse(A, B, Cz, new V3(x / A, 0.15, Math.sqrt(Math.max(0, 1 - (x / A) ** 2))));
      const cn = malha(new THREE.ConeGeometry(0.022, 0.07, 10), M.caranguejo, corpo, p.x, p.y, p.z);
      cn.quaternion.setFromUnitVectors(new V3(0, 1, 0), n);
    }
    const talos = [];
    for (const sx of [-1, 1]) {
      const tg = new THREE.Group(); tg.position.set(sx * 0.075, 0.08, 0.16); tg.rotation.set(0.25, 0, -sx * 0.15); corpo.add(tg);
      haste([0, 0, 0], [0, 0.17, 0], 0.02, M.caranguejo, tg);
      olho(tg, 0.06, new V3(0, 0.2, 0.01), new V3(sx * 0.15, -0.1, 1));
      tg.userData.s = sx;
      talos.push(tg);
    }
    const bo = naElipse(A, B, Cz, new V3(0, -0.15, 1));
    sorriso(corpo, 0.03, bo.p, bo.n);
    const pernas = [];
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const pg = new THREE.Group(); pg.position.set(sx * 0.26, -0.03, 0.06 - k * 0.11); pg.rotation.y = sx * (k - 1) * 0.4; corpo.add(pg);
      const kn = [sx * 0.15, 0.1, 0], ft = [sx * 0.28, -0.17, 0];
      haste([0, 0, 0], kn, 0.03, M.caranguejo, pg);
      malha(new THREE.SphereGeometry(0.032, 12, 8), M.caranguejo, pg, ...kn);
      haste(kn, ft, 0.024, M.caranguejo, pg);
      malha(new THREE.SphereGeometry(0.022, 10, 8), M.caranguejoEscuro, pg, ...ft);
      pg.userData = {s: sx, k};
      pernas.push(pg);
    }
    const garras = [];
    for (const sx of [-1, 1]) {
      const ombro = new THREE.Group(); ombro.position.set(sx * 0.26, 0.02, 0.13); corpo.add(ombro);
      const cot = [sx * 0.13, 0.08, 0.12];
      haste([0, 0, 0], cot, 0.04, M.caranguejo, ombro);
      malha(new THREE.SphereGeometry(0.045, 14, 10), M.caranguejo, ombro, ...cot);
      const pinca = new THREE.Group(); pinca.position.set(...cot); pinca.rotation.set(-0.35, -sx * 0.45, sx * 0.15); ombro.add(pinca);
      malha(new THREE.SphereGeometry(1, seg(28), seg(18)), M.caranguejo, pinca, 0, 0, 0.08).scale.set(0.1, 0.085, 0.13);
      malha(new THREE.ConeGeometry(0.05, 0.17, seg(16)), M.caranguejo, pinca, 0, -0.03, 0.25).rotation.x = Math.PI / 2 - 0.12;
      const dedo = new THREE.Group(); dedo.position.set(0, 0.035, 0.17); pinca.add(dedo);
      malha(new THREE.ConeGeometry(0.045, 0.16, seg(16)), M.caranguejo, dedo, 0, 0, 0.075).rotation.x = Math.PI / 2 + 0.1;
      garras.push({ombro, dedo, s: sx});
    }
    c.anim.push(t => {
      corpo.position.x = Math.sin(t * 1.2) * 0.03;
      corpo.rotation.z = Math.sin(t * 2.4) * 0.03;
      for (const g of garras) {
        const k = Math.max(0, Math.sin(t * 2.6 + (g.s > 0 ? 0 : 1.6)));
        g.dedo.rotation.x = -0.45 * k * k;
        g.ombro.rotation.x = Math.sin(t * 1.4 + g.s) * 0.1;
      }
      for (const p of pernas) p.rotation.z = p.userData.s * Math.sin(t * 4.8 + p.userData.k * 1.7) * 0.06;
      for (const tg of talos) tg.rotation.z = -tg.userData.s * 0.15 + Math.sin(t * 1.7 + tg.userData.s) * 0.1;
    });
  },

  esponja(c) {
    const M = mats();
    malha(new THREE.SphereGeometry(0.3, seg(32), seg(12), 0, TAU, 0, Math.PI / 2), M.esponjaBase, c.corpo).scale.set(1, 0.32, 0.9);
    const tubos = [
      {x: 0, z: 0.03, h: 0.74, r: 0.15, rx: 0.04, rz: 0, rosto: true},
      {x: -0.21, z: -0.04, h: 0.52, r: 0.115, rx: -0.05, rz: 0.28},
      {x: 0.2, z: -0.07, h: 0.6, r: 0.12, rx: -0.1, rz: -0.24},
      {x: 0.03, z: -0.22, h: 0.44, r: 0.1, rx: -0.3, rz: 0.05},
    ];
    const lista = [];
    tubos.forEach((p, i) => {
      const g = new THREE.Group(); g.position.set(p.x, 0.02, p.z); g.rotation.set(p.rx, 0, p.rz); c.corpo.add(g);
      malha(tuboEsponja(p.r, p.h, i), M.esponja, g);
      if (p.rosto) {
        const y = p.h * 0.56;
        for (const sx of [-1, 1]) {
          olho(g, 0.05, new V3(sx * 0.055, y, p.r + 0.008), new V3(sx * 0.25, 0, 1));
          const bx = sx * 0.088, bz = Math.sqrt(p.r * p.r - bx * bx) + 0.006;
          bochecha(g, new V3(bx, y - 0.06, bz), new V3(bx, 0, bz), 0.024);
        }
        sorriso(g, 0.028, new V3(0, y - 0.07, p.r + 0.004), Z);
        const topo = new THREE.Object3D(); topo.position.set(0, p.h, 0); g.add(topo);
        bolhas(c, topo, {n: 4, alt: 1.1, vel: 0.25, tam: 0.028});
      }
      lista.push({g, ...p, i});
    });
    c.anim.push(t => lista.forEach(o => {
      o.g.rotation.z = o.rz + Math.sin(t * 1.3 + o.i * 1.7) * 0.035;
      o.g.rotation.x = o.rx + Math.cos(t * 1.1 + o.i) * 0.03;
    }));
  },

  /* ---------- CENÁRIO ---------- */
  bau(c, o) {
    const M = mats();
    malha(monteAreia(0.74, 0.2, 3), M.areia, c.corpo);
    const ch = new THREE.Group(); ch.position.set(0, 0.12, 0); ch.rotation.set(-0.1, 0.3, 0.2); c.corpo.add(ch);
    const W = 0.82, H = 0.42, D = 0.52;
    rb(W, H, D, M.madeira, ch, 0, H / 2, 0, 0.03);
    for (const y of [H * 0.36, H * 0.68]) malha(new THREE.BoxGeometry(W + 0.004, 0.012, D + 0.004), M.madeiraEscura, ch, 0, y, 0);
    for (const x of [-W * 0.32, W * 0.32]) rb(0.07, H + 0.025, D + 0.025, M.metal, ch, x, H / 2, 0, 0.01);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(0.06, H + 0.02, 0.06, M.metal, ch, sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02), 0.01);
    rb(0.13, 0.15, 0.04, M.ouro, ch, 0, H * 0.78, D / 2 + 0.012, 0.015);
    malha(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12), M.boca, ch, 0, H * 0.8, D / 2 + 0.034).rotation.x = Math.PI / 2;
    const r = rng(21), moedas = [];
    for (let i = 0; i < 46; i++) {
      const x = (r() - 0.5) * (W - 0.14), z = (r() - 0.5) * (D - 0.12);
      const dome = Math.max(0, 1 - (x * x) / ((W / 2) ** 2) - (z * z) / ((D / 2) ** 2));
      const g = new THREE.CylinderGeometry(0.042, 0.042, 0.012, seg(18));
      g.rotateX((r() - 0.5) * 0.9); g.rotateZ((r() - 0.5) * 0.9);
      g.translate(x, H * 0.88 + 0.09 * dome + r() * 0.02, z);
      moedas.push(g);
    }
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = 0.45 + r() * 0.22, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const g = new THREE.CylinderGeometry(0.042, 0.042, 0.012, seg(18));
      g.rotateX((r() - 0.5) * 0.5); g.rotateZ((r() - 0.5) * 0.5);
      g.translate(x, 0.2 * Math.sqrt(Math.max(0, 1 - (d / 0.74) ** 2)) + 0.004, z);
      moedas.push(g);
    }
    const moedasMesh = malha(mergeGeometries(moedas.slice(0, 46)), M.ouro, ch);
    moedasMesh.castShadow = false;
    malha(mergeGeometries(moedas.slice(46)), M.ouro, c.corpo);
    moedas.forEach(g => g.dispose());
    malha(new THREE.OctahedronGeometry(0.055), M.gemaVermelha, ch, 0.13, H + 0.06, 0.04).rotation.set(0.4, 0.3, 0);
    malha(new THREE.OctahedronGeometry(0.045), M.gemaVerde, ch, -0.16, H + 0.04, -0.06).rotation.set(0.2, 0.8, 0.3);
    const tampa = new THREE.Group(); tampa.position.set(0, H, -D / 2); ch.add(tampa);
    const tg = new THREE.CylinderGeometry(D / 2, D / 2, W, seg(24), 1, false, 0, Math.PI);
    tg.rotateZ(Math.PI / 2); tg.translate(0, 0, D / 2);
    malha(tg, M.madeira, tampa);
    malha(new THREE.BoxGeometry(W - 0.01, 0.02, D - 0.01), M.madeira, tampa, 0, 0.01, D / 2);
    for (const x of [-W * 0.32, W * 0.32]) {
      const b = new THREE.TorusGeometry(D / 2 + 0.008, 0.022, 8, seg(24), Math.PI);
      b.rotateY(Math.PI / 2); b.translate(x, 0, D / 2);
      malha(b, M.metal, tampa);
    }
    // abertura: 0 = fechado, 1 = escancarado; o padrão (0,5) é o baú entreaberto
    // balançando. opcoes.fechado começa fechado; api.definirAbertura(v) anima.
    let abertura = o.fechado ? 0 : 0.5;
    c.anim.push(t => { tampa.rotation.x = -(0.04 + abertura * 1.16 + Math.sin(t * 0.9) * 0.07 * Math.min(1, abertura * 2)); });
    c.api.definirAbertura = v => { abertura = Math.max(0, Math.min(1, v)); };
    c.api.abertura = () => abertura;
    const anc = new THREE.Object3D(); anc.position.set(0.1, H + 0.12, 0.05); ch.add(anc);
    bolhas(c, anc, {n: 8, alt: 1.8, vel: 0.4});
  },

  alga(c, o) {
    const altura = o.altura || 1.5;
    malha(new THREE.SphereGeometry(0.16, 16, 10, 0, TAU, 0, Math.PI / 2), mats().algaBase, c.corpo).scale.set(1.2, 0.5, 1);
    laminas(c, c.corpo, {n: o.laminas || 5, altura, seed: 31 + Math.round(altura * 10)});
  },

  algaGigante(c, o) {
    // Alga gigante (kelp): talos altos com folhas compridas alternadas e uma
    // boia de ar na base de cada folha, em tons de oliva/âmbar — bem diferente
    // da alga verde de lâminas largas.
    const H = o.altura || 3.2, r = rng(o.seed || 17), M = mats();
    const cores = [0x5c4a10, 0xae8f2c, 0xdcc464];
    malha(new THREE.SphereGeometry(0.16, 16, 10, 0, TAU, 0, Math.PI / 2), M.algaBase, c.corpo).scale.set(1.3, 0.45, 1.1);
    const mTalo = matCor('kelpTalo', () => new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.7}));
    const mBoia = matCor('kelpBoia', () => new THREE.MeshPhysicalMaterial({color: 0xc9a43a, roughness: 0.35, clearcoat: 0.6}));
    const cB = new THREE.Color(cores[0]), cT = new THREE.Color(cores[1]);
    const talos = [];
    for (let s = 0; s < (o.talos || 3); s++) {
      const g = new THREE.Group(), a = s / (o.talos || 3) * TAU + r();
      g.position.set(Math.cos(a) * 0.07, 0.03, Math.sin(a) * 0.07); c.corpo.add(g);
      const h = H * (0.7 + r() * 0.35), pts = [];
      for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(new V3(Math.sin(u * 3 + s) * 0.14 * u, u * h, Math.cos(u * 2.3 + s) * 0.12 * u)); }
      const talo = tuboAfunilado(pts, u => 0.024 - 0.012 * u, 40, 6);
      pintar(talo, (cc, i, x, y) => cc.copy(cB).lerp(cT, Math.min(1, y / h)));
      malha(talo, mTalo, g);
      const curva = talo.userData.curva, folhas = Math.max(4, Math.round(h * 2.4));
      for (let k = 0; k < folhas; k++) {
        const u = 0.14 + 0.82 * k / folhas, P = curva.getPointAt(u);
        const f = new THREE.Group(); f.position.copy(P); f.rotation.y = k * 2.4 + s; f.rotation.z = 0.95 - u * 0.45; g.add(f);
        malha(laminaGeo(0.45 + 0.4 * (1 - u), 0.085, k + s * 7, cores), M.alga, f);
        malha(new THREE.SphereGeometry(0.034, 10, 8), mBoia, f);
      }
      talos.push({g, ph: r() * TAU});
    }
    c.anim.push(t => talos.forEach(({g, ph}) => { g.rotation.z = Math.sin(t * 0.8 + ph) * 0.07; g.rotation.x = Math.cos(t * 0.63 + ph) * 0.05; }));
  },

  pedras(c) {
    const M = mats();
    const L = [[0, 0, 0.36, 0.72, 1], [0.42, 0.2, 0.22, 0.85, 2], [-0.38, 0.17, 0.19, 0.7, 3], [0.12, -0.36, 0.15, 0.8, 4]];
    for (const [x, z, s, sy, sd] of L) {
      const m = malha(rochaGeo(sd, 2), sd % 2 ? M.pedra : M.pedraEscura, c.corpo, x, s * sy * 0.5, z);
      m.scale.set(s, s * sy, s * 1.1);
      m.rotation.y = sd * 1.3;
    }
    const r = rng(51), cy = 0.36 * 0.72 * 0.5;
    for (let i = 0; i < 9; i++) {
      const d = new V3(r() * 2 - 1, 0.4 + r() * 0.8, r() * 2 - 1);
      const {p, n} = naElipse(0.33, 0.24, 0.36, d);
      const cr = new THREE.Group(); cr.position.set(p.x, p.y + cy, p.z); orientar(cr, n); c.corpo.add(cr);
      const s = 0.7 + r() * 0.6;
      const g = new THREE.CylinderGeometry(0.012 * s, 0.028 * s, 0.035 * s, 10); g.rotateX(Math.PI / 2);
      malha(g, M.craca, cr, 0, 0, 0.012 * s);
      const h = new THREE.CylinderGeometry(0.01 * s, 0.01 * s, 0.004, 8); h.rotateX(Math.PI / 2);
      malha(h, M.boca, cr, 0, 0, 0.03 * s).castShadow = false;
    }
    for (let i = 0; i < 5; i++) {
      const d = new V3(r() * 2 - 1, 0.9, r() * 2 - 1);
      const {p, n} = naElipse(0.33, 0.24, 0.36, d);
      const s = 0.05 + r() * 0.04;
      orientar(malha(new THREE.SphereGeometry(1, 12, 8), M.musgo, c.corpo, p.x, p.y + cy, p.z), n).scale.set(s, s * 0.8, s * 0.3);
    }
    for (let i = 0; i < 7; i++) {
      const a = r() * TAU, d = 0.45 + r() * 0.15, h = 0.12 + r() * 0.12;
      const m = malha(new THREE.ConeGeometry(0.012, h, 6), M.musgo, c.corpo, Math.cos(a) * d, h / 2, Math.sin(a) * d);
      m.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
    }
  },

  peixe(c, o) {
    const M = mats(), v = PEIXES[o.variante] ? o.variante : 'coral', cor = PEIXES[v].c;
    const fin = matCor('fin-' + v, () => new THREE.MeshPhysicalMaterial({color: cor[1], roughness: 0.45, clearcoat: 0.5}));
    const nado = new THREE.Group(); nado.position.y = 0.45; c.corpo.add(nado);
    const g = new THREE.SphereGeometry(1, seg(40), seg(28)), p = g.attributes.position, col = new Float32Array(p.count * 3);
    const cM = new THREE.Color(cor[0]), cT = new THREE.Color(cor[1]), cB = new THREE.Color(cor[2]), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      tmp.copy(cM);
      if (y > 0.25) tmp.lerp(cT, Math.min(1, (y - 0.25) / 0.5));
      if (y < -0.15) tmp.lerp(cB, Math.min(1, (-0.15 - y) / 0.4));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const A = 0.12, B = 0.18, Cz = 0.29;
    malha(g, M.peixe, nado).scale.set(A, B, Cz);
    const cauda = new THREE.Group(); cauda.position.z = -0.25; nado.add(cauda);
    const ts = new THREE.Shape();
    ts.moveTo(0, 0.035); ts.quadraticCurveTo(0.09, 0.07, 0.2, 0.17); ts.quadraticCurveTo(0.14, 0, 0.2, -0.17);
    ts.quadraticCurveTo(0.09, -0.07, 0, -0.035); ts.lineTo(0, 0.035);
    malha(nadadeira(ts, 0.016), fin, cauda);
    const ds = new THREE.Shape();
    ds.moveTo(-0.11, 0); ds.quadraticCurveTo(-0.02, 0.13, 0.13, 0.1); ds.quadraticCurveTo(0.08, 0.04, 0.12, 0); ds.lineTo(-0.11, 0);
    malha(nadadeira(ds, 0.012), fin, nado, 0, 0.15, 0);
    const peitorais = [];
    for (const sx of [-1, 1]) {
      const pg = new THREE.Group(); pg.position.set(sx * 0.1, -0.06, 0.07); nado.add(pg);
      malha(new THREE.SphereGeometry(1, 16, 10), fin, pg, sx * 0.01, -0.01, -0.05).scale.set(0.012, 0.035, 0.07);
      pg.userData.s = sx;
      peitorais.push(pg);
      const e = naElipse(A, B, Cz, new V3(sx * 0.62, 0.32, 0.72));
      olho(nado, 0.048, e.p.clone().addScaledVector(e.n, -0.018), e.n.clone().lerp(Z, 0.35));
    }
    const bo = naElipse(A, B, Cz, new V3(0, -0.12, 1));
    malha(new THREE.TorusGeometry(0.018, 0.008, 8, 16), M.boca, nado, bo.p.x, bo.p.y, bo.p.z - 0.004);
    c.anim.push(t => {
      cauda.rotation.y = Math.sin(t * 7) * 0.45;
      nado.rotation.y = -Math.sin(t * 7) * 0.06;
      nado.position.y = 0.45 + Math.sin(t * 1.5) * 0.04;
      peitorais.forEach(pg => { pg.rotation.z = pg.userData.s * (0.2 + Math.sin(t * 5 + pg.userData.s) * 0.25); });
    });
  },

  coral(c, o) {
    const M = mats(), v = CORAIS[o.cor] ? o.cor : 'rosa', [c1, c2] = CORAIS[v];
    const mc = matCor('coral-' + v, () => new THREE.MeshPhysicalMaterial({color: c1, roughness: 0.6, clearcoat: 0.25}));
    const mp = matCor('coralp-' + v, () => new THREE.MeshPhysicalMaterial({color: c2, roughness: 0.5, clearcoat: 0.3}));
    const base = malha(rochaGeo(7, 1), M.pedraEscura, c.corpo, 0, 0.05, 0); base.scale.set(0.3, 0.13, 0.27);
    const r = rng(41 + v.length), tmp = new THREE.Group();
    const galho = (pai, len, rad, d) => {
      const g = new THREE.CylinderGeometry(rad * 0.74, rad, len, seg(12), 1, true); g.translate(0, len / 2, 0);
      malha(g, mc, pai);
      malha(new THREE.SphereGeometry(rad, seg(12), seg(8)), mc, pai);
      if (!d) { malha(new THREE.SphereGeometry(rad * 0.95, seg(12), seg(8)), mp, pai, 0, len, 0); return; }
      const n = d >= 3 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const yaw = new THREE.Group(); yaw.position.y = len; yaw.rotation.y = k / n * TAU + r() * 0.9; pai.add(yaw);
        const tilt = new THREE.Group(); tilt.rotation.z = 0.3 + r() * 0.4; yaw.add(tilt);
        galho(tilt, len * (0.72 + r() * 0.12), rad * 0.72, d - 1);
      }
    };
    [[0, 0, 0, 0], [0.12, 0.08, 0.35, 1.2], [-0.12, -0.05, -0.4, 4]].forEach(([x, z, tz, ry], i) => {
      const t0 = new THREE.Group(); t0.position.set(x, 0.1, z); t0.rotation.set(0, ry, tz); tmp.add(t0);
      galho(t0, i ? 0.22 : 0.3, i ? 0.05 : 0.065, 3);
    });
    assar(tmp, c.corpo);
  },

  concha(c) {
    const M = mats();
    malha(monteAreia(0.46, 0.06, 5), M.areia, c.corpo);
    const grupo = new THREE.Group(); grupo.position.set(0, 0.13, -0.1); c.corpo.add(grupo);
    const cClaro = new THREE.Color(0xffd9c4), cEscuro = new THREE.Color(0xf07f62), cBorda = new THREE.Color(0xfff1e6), tmp = new THREE.Color();
    const valva = cima => {
      const g = new THREE.SphereGeometry(0.3, seg(56), seg(18), 0, Math.PI, cima ? 0 : Math.PI / 2, Math.PI / 2), p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const h = Math.hypot(x, z) / 0.3, rid = Math.abs(Math.cos(Math.atan2(z, -x) * 9)), s = 1 + 0.05 * rid * h;
        p.setXYZ(i, x * s, y * (1 + 0.06 * rid * h) * 0.42, z * s);
        tmp.copy(cEscuro).lerp(cClaro, rid * 0.8 + 0.2);
        if (h > 0.93) tmp.lerp(cBorda, 0.5);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    };
    const vb = valva(false);
    malha(vb, M.conchaFora, grupo);
    malha(inverter(vb), M.conchaDentro, grupo);
    const tampa = new THREE.Group(); grupo.add(tampa);
    const vc = valva(true);
    malha(vc, M.conchaFora, tampa);
    malha(inverter(vc), M.conchaDentro, tampa);
    const perola = malha(new THREE.SphereGeometry(0.075, seg(32), seg(24)), M.perola, grupo, 0, -0.035, 0.13);
    c.anim.push(t => {
      tampa.rotation.x = -(0.38 + (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.2);
      perola.rotation.y = t * 0.5;
    });
  },

  /* ---------- PEÇAS DE JOGO ---------- */
  dado(c, o) {
    const v = DADOS[o.cor] ? o.cor : 'perola', [cb, cp, c1] = DADOS[v];
    const mb = matCor('dado-' + v, () => new THREE.MeshPhysicalMaterial({color: cb, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12}));
    const mp = matCor('dadoPip-' + v, () => new THREE.MeshPhysicalMaterial({color: cp, roughness: 0.4, clearcoat: 0.6}));
    const m1 = matCor('dadoUm-' + v, () => new THREE.MeshPhysicalMaterial({color: c1, roughness: 0.3, clearcoat: 1, emissive: c1, emissiveIntensity: 0.3}));
    const L = 0.5, h = L / 2, R = 0.085, giro = new THREE.Group();
    giro.position.y = h; c.corpo.add(giro);
    malha(new RoundedBoxGeometry(L, L, L, seg(5), R), mb, giro);
    const PIPS = {1: [], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]]};
    const geos = [], q = new THREE.Quaternion(), mtx = new THREE.Matrix4(), esc = new V3(1, 1, 0.4);
    for (const [face, n] of Object.entries(FACES_DADO)) {
      const N = new V3(...n), u = Math.abs(N.x) > 0.5 ? new V3(0, 0, 1) : new V3(1, 0, 0), w = new V3().crossVectors(N, u);
      q.setFromUnitVectors(Z, N);
      for (const [a, b] of PIPS[face]) {
        const g = new THREE.SphereGeometry(0.046, seg(16), seg(10));
        g.applyMatrix4(mtx.compose(N.clone().multiplyScalar(h - 0.004).addScaledVector(u, a * 0.12).addScaledVector(w, b * 0.12), q, esc));
        geos.push(g);
      }
    }
    malha(mergeGeometries(geos), mp, giro).castShadow = false;
    geos.forEach(g => g.dispose());
    const est = new THREE.ExtrudeGeometry(formaEstrela(0.085, 0.036, 80), {depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4});
    est.rotateX(-Math.PI / 2);
    malha(est, m1, giro, 0, h - 0.008, 0).castShadow = false;
    let rol = null, ultimoT = 0;
    const up = new V3(0, 1, 0), tq = new THREE.Quaternion(), ax = new V3();
    const apoio = () => {
      let s = 0;
      for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) s += Math.abs(ax.set(...e).applyQuaternion(giro.quaternion).y);
      return (h - R) * s + R;
    };
    c.anim.push(t => {
      ultimoT = t;
      if (!rol) return;
      const p = Math.min(1, Math.max(0, (t - rol.t0) / rol.dur)), e = 1 - Math.pow(1 - p, 3);
      giro.quaternion.slerpQuaternions(rol.q0, rol.q1, e).premultiply(tq.setFromAxisAngle(rol.eixo, rol.voltas * TAU * e));
      const arco = Math.sin(p * Math.PI);
      giro.position.set(arco * rol.dx, apoio() + Math.abs(Math.sin(p * Math.PI * 2.5)) * Math.pow(1 - p, 1.5) * 0.8, arco * rol.dz);
      if (p >= 1) { const r = rol; rol = null; giro.quaternion.copy(r.q1); giro.position.set(0, h, 0); r.fim(r.valor); }
    });
    c.api.rolar = valor => new Promise(fim => {
      if (rol) rol.fim(rol.valor);
      const n = Number(valor);
      valor = Number.isInteger(n) && n >= 1 && n <= 6 ? n : 1 + Math.floor(Math.random() * 6);
      const q1 = new THREE.Quaternion().setFromUnitVectors(new V3(...FACES_DADO[valor]), up).premultiply(new THREE.Quaternion().setFromAxisAngle(up, Math.random() * TAU));
      const a = Math.random() * TAU;
      rol = {t0: ultimoT, dur: 1.5, q0: giro.quaternion.clone(), q1, valor, fim,
        eixo: new V3(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize(),
        voltas: 2 + Math.floor(Math.random() * 2), dx: Math.cos(a) * 0.3, dz: Math.sin(a) * 0.3};
    });
    c.api.valor = () => {
      let melhor = 1, maior = -2;
      for (const [f, n] of Object.entries(FACES_DADO)) { const d = ax.set(...n).applyQuaternion(giro.quaternion).y; if (d > maior) { maior = d; melhor = +f; } }
      return melhor;
    };
  },

  moeda(c, o) {
    const M = mats(), g = new THREE.Group(), ficha = new THREE.Group();
    c.corpo.add(g); g.add(ficha);
    const perfil = [[0.001, -0.012], [0.15, -0.012], [0.168, -0.024], [0.2, -0.02], [0.206, 0], [0.2, 0.02], [0.168, 0.024], [0.15, 0.012], [0.001, 0.012]].map(([x, y]) => new V2(x, y));
    malha(new THREE.LatheGeometry(perfil, seg(48)), M.ouro, ficha);
    for (const s of [1, -1]) {
      const e = new THREE.ExtrudeGeometry(formaVieira(0.95), {depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6});
      e.rotateX(-s * Math.PI / 2);
      malha(e, M.ouro, ficha, 0, s * 0.012, 0);
    }
    if (o.deitada) { g.position.y = 0.026; ficha.rotation.y = 0.4; return; }
    ficha.rotation.x = Math.PI / 2;
    c.anim.push(t => { g.position.y = 0.34 + Math.sin(t * 2) * 0.04; g.rotation.y = t * 1.8; });
  },

  redemoinho(c) {
    const M = mats();
    malha(new THREE.CylinderGeometry(0.46, 0.47, 0.03, seg(56)), matCor('vortBase', () => new THREE.MeshStandardMaterial({color: 0x0e3f63, roughness: 0.4, emissive: 0x08304a, emissiveIntensity: 0.8})), c.corpo, 0, 0.015, 0);
    malha(new THREE.TorusGeometry(0.465, 0.014, 8, seg(64)), matCor('vortAro', () => new THREE.MeshStandardMaterial({color: 0x9ff2ff, emissive: 0x3cc9e0, emissiveIntensity: 1.2})), c.corpo, 0, 0.03, 0).rotation.x = Math.PI / 2;
    const tex = texturaCanvas('espiral', 256, 256, (g, w) => {
      const m = w / 2, grd = g.createRadialGradient(m, m, 0, m, m, m);
      grd.addColorStop(0, 'rgba(0,8,16,1)'); grd.addColorStop(0.3, 'rgba(10,60,90,0.7)'); grd.addColorStop(1, 'rgba(40,140,170,0)');
      g.fillStyle = grd; g.fillRect(0, 0, w, w);
      g.strokeStyle = 'rgba(220,250,255,0.95)'; g.lineCap = 'round'; g.lineWidth = 7;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = i / 120, a = k * Math.PI / 2 + u * Math.PI * 3, r = m * (0.08 + 0.88 * u);
          i ? g.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r) : g.moveTo(m + Math.cos(a) * r, m + Math.sin(a) * r);
        }
        g.stroke();
      }
    });
    const disco = malha(new THREE.CircleGeometry(0.44, seg(48)), matCor('vortDisco', () => new THREE.MeshBasicMaterial({map: tex, color: tex ? 0xffffff : 0x2a8fb0, transparent: true, depthWrite: false})), c.corpo, 0, 0.032, 0);
    disco.rotation.x = -Math.PI / 2;
    disco.castShadow = disco.receiveShadow = false;
    const fitas = new THREE.Group(); c.corpo.add(fitas);
    const mf = matCor('vortFita', () => new THREE.MeshStandardMaterial({color: 0xbff8ff, emissive: 0x3cc9e0, emissiveIntensity: 0.9, transparent: true, opacity: 0.7, roughness: 0.2}));
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let i = 0; i <= 30; i++) { const u = i / 30, a = k * TAU / 3 + u * TAU * 1.5, r = 0.07 + 0.33 * u; pts.push(new V3(Math.cos(a) * r, 0.04 + u * 0.45, Math.sin(a) * r)); }
      malha(tuboAfunilado(pts, u => 0.006 + 0.014 * u, 90, 8), mf, fitas).castShadow = false;
    }
    const bs = [];
    for (let i = 0; i < 10; i++) { const b = malha(new THREE.SphereGeometry(1, 10, 8), M.bolha, c.efeitos); b.castShadow = b.receiveShadow = false; bs.push(b); }
    c.anim.push(t => {
      disco.rotation.z = t * 1.6;
      fitas.rotation.y = -t * 2.2;
      bs.forEach((b, i) => {
        const ph = (t * 0.35 + i / bs.length) % 1, a = -t * 2.2 + i * 2.4 - ph * 4, r = 0.4 * (1 - ph) + 0.03;
        b.position.set(Math.cos(a) * r, 0.45 * (1 - ph) + 0.05, Math.sin(a) * r);
        b.scale.setScalar(0.022 * (1 - ph * 0.7));
      });
    });
  },

  corrente(c) {
    malha(new RoundedBoxGeometry(0.9, 0.03, 0.9, 2, 0.012), matCor('corrBase', () => new THREE.MeshStandardMaterial({color: 0x1b6f8a, roughness: 0.3, emissive: 0x0b3346, emissiveIntensity: 0.6})), c.corpo, 0, 0.015, 0);
    const sh = new THREE.Shape();
    sh.moveTo(-0.2, -0.04); sh.lineTo(0, 0.1); sh.lineTo(0.2, -0.04); sh.lineTo(0.2, -0.12); sh.lineTo(0, 0.02); sh.lineTo(-0.2, -0.12); sh.lineTo(-0.2, -0.04);
    const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.025, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2});
    geo.rotateX(Math.PI / 2);
    const setas = [0, 1, 2].map(k => {
      const mat = new THREE.MeshStandardMaterial({color: 0xcffaff, emissive: 0x5fe0f0, emissiveIntensity: 1, roughness: 0.3});
      c.proprios.push(mat);
      return malha(geo, mat, c.corpo, 0, 0.063, (k - 1) * 0.27);
    });
    c.anim.push(t => setas.forEach((m, k) => {
      const s = 0.5 + 0.5 * Math.sin(t * 4 - k * 1.3);
      m.material.emissiveIntensity = 0.25 + 2.2 * s * s * s;
      m.position.z = (k - 1) * 0.27 + s * 0.02;
    }));
  },

  bandeira(c, o) {
    const M = mats(), cor = o.corJogador || '#3cc9c0';
    const ro = malha(rochaGeo(9, 1), M.pedraEscura, c.corpo, 0, 0.06, 0); ro.scale.set(0.22, 0.14, 0.2);
    malha(new THREE.CylinderGeometry(0.024, 0.03, 1.65, seg(12)), M.metal, c.corpo, 0, 0.825, 0);
    malha(new THREE.SphereGeometry(0.055, seg(16), seg(12)), M.ouro, c.corpo, 0, 1.68, 0);
    const tex = texturaCanvas('xadrez-' + cor, 128, 80, g => {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { g.fillStyle = (i + j) % 2 ? cor : '#f4fbff'; g.fillRect(i * 16, j * 16, 16, 16); }
    });
    const mat = new THREE.MeshStandardMaterial({map: tex, color: tex ? 0xffffff : cor, side: THREE.DoubleSide, roughness: 0.7});
    c.proprios.push(mat);
    const FW = 0.82, FH = 0.5;
    const geo = new THREE.PlaneGeometry(FW, FH, seg(28), seg(14)); geo.translate(FW / 2 + 0.024, 1.36, 0);
    malha(geo, mat, c.corpo).frustumCulled = false;
    const p = geo.attributes.position, base = p.array.slice();
    c.anim.push(t => {
      const a = p.array;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3] - 0.024, k = x / FW;
        a[i * 3 + 2] = Math.sin(x * 8 - t * 4.2) * 0.085 * k + Math.sin(x * 4.5 - t * 2.1 + base[i * 3 + 1] * 4) * 0.03 * k;
        a[i * 3 + 1] = base[i * 3 + 1] - k * k * 0.04 * (1 + Math.sin(t * 1.6));
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();
    });
  },

  /* ---------- CENÁRIO NOVO ---------- */
  casaConcha(c) {
    const M = mats();
    malha(monteAreia(1.05, 0.12, 8), M.areia, c.corpo);
    const H = 1.9, raioEm = y => y < 0.45 ? 0.6 + 0.12 * Math.sin(y / 0.45 * Math.PI / 2) : 0.72 * Math.pow(1 - (y - 0.45) / (H - 0.45), 1.15) + 0.015;
    const perfil = [new V2(0.001, 0)], NY = seg(46);
    for (let i = 0; i <= NY; i++) { const y = i / NY * H; perfil.push(new V2(raioEm(y), y)); }
    const S = seg(64), g = new THREE.LatheGeometry(perfil, S), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), fase = Math.atan2(x, z) - TAU * y / 0.34;
      const k = 1 + (y > 0.3 ? 0.07 * Math.max(0, Math.cos(fase)) * Math.min(1, (y - 0.3) / 0.2) : 0);
      p.setXYZ(i, x * k, y, z * k);
    }
    const cA = new THREE.Color(0xf7e4c6), cB = new THREE.Color(0xef9563), cC = new THREE.Color(0xffd0bd);
    pintar(g, (cor, i, x, y, z) => {
      const fase = Math.atan2(x, z) - TAU * y / 0.34;
      cor.copy(cA).lerp(cC, Math.max(0, 1 - y / 0.6) * 0.5);
      if (y > 0.3 && Math.cos(fase + 1.2) > 0.72) cor.lerp(cB, 0.85);
    });
    g.computeVertexNormals();
    malha(g, matCor('casaConcha', () => new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: 0.5, clearcoat: 0.4})), c.corpo);
    const mk = matCor('casaBotao', () => new THREE.MeshPhysicalMaterial({color: 0xf6dcc0, roughness: 0.5, clearcoat: 0.3}));
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * TAU + 0.35;
      if (Math.cos(a) > 0.75) continue;
      const m = malha(new THREE.ConeGeometry(0.06, 0.18, seg(10)), mk, c.corpo, Math.sin(a) * 0.69, 0.55, Math.cos(a) * 0.69);
      m.quaternion.setFromUnitVectors(new V3(0, 1, 0), new V3(Math.sin(a), 0.7, Math.cos(a)).normalize());
    }
    const mold = matCor('casaMoldura', () => new THREE.MeshPhysicalMaterial({color: 0xf2a98e, roughness: 0.45, clearcoat: 0.4}));
    const arco = formaArco(0.5, 0.7); arco.holes.push(formaArco(0.34, 0.58, THREE.Path));
    malha(new THREE.ExtrudeGeometry(arco, {depth: 0.34, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: seg(16)}), mold, c.corpo, 0, 0.02, 0.48);
    malha(new THREE.ExtrudeGeometry(formaArco(0.34, 0.58), {depth: 0.04, bevelEnabled: false, curveSegments: seg(16)}), M.madeira, c.corpo, 0, 0.02, 0.74);
    for (const x of [-0.08, 0.08]) malha(new THREE.BoxGeometry(0.012, 0.48, 0.01), M.madeiraEscura, c.corpo, x, 0.26, 0.785);
    malha(new THREE.SphereGeometry(0.022, 12, 8), M.ouro, c.corpo, 0.11, 0.28, 0.79);
    const luz = matCor('casaLuz', () => new THREE.MeshStandardMaterial({color: 0xffd38a, emissive: 0xffb347, emissiveIntensity: 1.4}));
    const janela = (ang, y, e) => {
      const r = raioEm(y) * 1.03;
      const g1 = new THREE.Group(); g1.position.set(Math.sin(ang) * r, y, Math.cos(ang) * r); g1.rotation.y = ang; c.corpo.add(g1);
      const g2 = new THREE.Group(); g2.rotation.x = -0.42; g1.add(g2);
      const fr = formaArco(0.2 * e, 0.27 * e); fr.holes.push(formaArco(0.14 * e, 0.21 * e, THREE.Path));
      const fg = new THREE.ExtrudeGeometry(fr, {depth: 0.12, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 12});
      fg.translate(0, -0.13 * e, -0.08);
      malha(fg, mold, g2);
      const vg = new THREE.ShapeGeometry(formaArco(0.14 * e, 0.21 * e), 12); vg.translate(0, -0.13 * e, 0);
      malha(vg, luz, g2).castShadow = false;
      malha(new THREE.BoxGeometry(0.012, 0.2 * e, 0.012), mold, g2, 0, -0.03 * e, 0.01);
      malha(new THREE.BoxGeometry(0.14 * e, 0.012, 0.012), mold, g2, 0, -0.02 * e, 0.01);
    };
    janela(0.55, 0.98, 1);
    janela(-0.75, 1.26, 0.8);
    const ac = -2.3, yc = 1.42, rc = raioEm(yc) * 0.9;
    const chamine = new THREE.Group(); chamine.position.set(Math.sin(ac) * rc, yc, Math.cos(ac) * rc);
    chamine.quaternion.setFromUnitVectors(new V3(0, 1, 0), new V3(Math.sin(ac), 1.3, Math.cos(ac)).normalize()); c.corpo.add(chamine);
    malha(new THREE.CylinderGeometry(0.05, 0.055, 0.32, seg(14)), M.metal, chamine, 0, 0.12, 0);
    malha(new THREE.CylinderGeometry(0.07, 0.07, 0.05, seg(14)), M.metal, chamine, 0, 0.28, 0);
    const topo = new THREE.Object3D(); topo.position.y = 0.32; chamine.add(topo);
    bolhas(c, topo, {n: 7, alt: 1.4, vel: 0.35, tam: 0.04});
    const poste = new THREE.Group(); poste.position.set(0.5, 0.06, 0.86); c.corpo.add(poste);
    haste([0, 0, 0], [0, 0.5, 0], 0.014, M.metal, poste);
    haste([0, 0.5, 0], [-0.08, 0.6, 0], 0.012, M.metal, poste);
    const lanterna = matCor('lanterna', () => new THREE.MeshStandardMaterial({color: 0xcffbff, emissive: 0x7ff0ff, emissiveIntensity: 2}));
    malha(new THREE.SphereGeometry(0.05, 16, 12), lanterna, poste, -0.1, 0.57, 0).castShadow = false;
    [[0, 1.0, 0.13], [0.06, 1.25, 0.12], [-0.03, 1.5, 0.11]].forEach(([x, z, s], i) => {
      const m = malha(rochaGeo(20 + i, 1), M.pedra, c.corpo, x, alturaMonte(x, z, 1.05, 0.12) + 0.01, z);
      m.scale.set(s, 0.03, s * 0.8);
    });
    c.anim.push(t => { lanterna.emissiveIntensity = 1.6 + Math.sin(t * 2.3) * 0.5; });
  },

  navio(c) {
    const M = mats();
    malha(monteAreia(1.6, 0.22, 12), M.areia, c.corpo);
    const nav = new THREE.Group(); nav.position.set(0.1, 0.3, 0); nav.rotation.set(0.38, 0, 0.08); c.corpo.add(nav);
    const xs = -1.2, xe = 1.05;
    const larg = x => { const b = Math.max(0, (x - 0.35) / (xe - 0.35)); return 0.5 * Math.sqrt(Math.max(0, 1 - b * b)) + 0.004; };
    const prof = x => 0.42 * (1 - 0.35 * Math.max(0, (x - 0.35) / (xe - 0.35)));
    const tosado = x => 0.16 * Math.pow((x - xs) / (xe - xs), 2);
    const NX = seg(28), NF = seg(14), r = rng(61), pos = [], idx = [], quebra = Array.from({length: NF + 1}, () => r() * 0.3);
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NF; j++) {
      let x = xs + (xe - xs) * i / NX;
      if (i === 0) x += quebra[j];
      const f = -Math.PI / 2 + j / NF * Math.PI;
      pos.push(x, -prof(x) * Math.cos(f) + tosado(x), larg(x) * Math.sin(f));
    }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NF; j++) { const a = i * (NF + 1) + j, b = a + NF + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const casco = new THREE.BufferGeometry();
    casco.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    casco.setIndex(idx);
    const cM = new THREE.Color(0x9a6a40), cE = new THREE.Color(0x6e4728), cG = new THREE.Color(0x6a8a48);
    pintar(casco, (cor, i, x) => {
      const j = i % (NF + 1), f = -Math.PI / 2 + j / NF * Math.PI;
      cor.copy(j % 2 ? cM : cE).lerp(cM, 0.35);
      cor.lerp(cG, Math.max(0, Math.cos(f) - 0.3) * 0.7 * (0.6 + 0.4 * Math.sin(x * 7 + j)));
    });
    casco.computeVertexNormals();
    malha(casco, matCor('casco', () => new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.9, side: THREE.DoubleSide})), nav);
    for (let k = -4; k <= 4; k++) {
      if (k === -1 || k === 2) continue;
      const z = k * 0.1, b = Math.sqrt(Math.max(0, 1 - (Math.abs(z) / 0.5) ** 2)), xf = Math.min(0.85, 0.35 + b * (xe - 0.35) - 0.05), x0 = -0.35 + r() * 0.15;
      if (xf - x0 < 0.15) continue;
      const xm = (x0 + xf) / 2;
      const tb = malha(new THREE.BoxGeometry(xf - x0, 0.025, 0.088), k % 2 ? M.madeira : M.madeiraEscura, nav, xm, tosado(xm) - 0.03, z);
      tb.rotation.z = Math.atan(2 * 0.16 * (xm - xs) / ((xe - xs) ** 2));
    }
    const mCost = matCor('costela', () => new THREE.MeshStandardMaterial({color: 0x5e3b20, roughness: 0.95}));
    [-1.28, -1.45, -1.62].forEach((x, k) => {
      const arc = Math.PI * [1, 0.85, 0.6][k];
      const tg = new THREE.TorusGeometry(0.47, 0.028, 6, seg(20), arc);
      tg.rotateZ(Math.PI + (Math.PI - arc) / 2); tg.scale(1, 0.88, 1); tg.rotateY(Math.PI / 2);
      malha(tg, mCost, nav, x, tosado(xs), 0);
    });
    malha(new THREE.BoxGeometry(0.62, 0.05, 0.07), mCost, nav, -1.45, -0.4, 0);
    const mastro = new THREE.Group(); mastro.position.set(0.05, tosado(0.05) - 0.03, 0); mastro.rotation.set(0.15, 0, -0.45); nav.add(mastro);
    malha(new THREE.CylinderGeometry(0.05, 0.065, 1.0, seg(12)), M.madeiraEscura, mastro, 0, 0.5, 0);
    malha(new THREE.ConeGeometry(0.05, 0.12, 5), M.madeiraEscura, mastro, 0.01, 1.04, 0).rotation.z = 0.3;
    const verga = malha(new THREE.CylinderGeometry(0.028, 0.028, 0.8, seg(10)), M.madeiraEscura, mastro, 0, 0.72, 0); verga.rotation.set(Math.PI / 2, 0.2, 0);
    const vela = new THREE.PlaneGeometry(0.66, 0.42, seg(10), seg(6)); vela.rotateY(Math.PI / 2); vela.translate(0.03, -0.21, 0);
    const vp = vela.attributes.position;
    for (let i = 0; i < vp.count; i++) if (vp.getY(i) < -0.4) vp.setY(i, vp.getY(i) + r() * 0.12);
    malha(vela, matCor('vela', () => new THREE.MeshStandardMaterial({color: 0xd9cba5, roughness: 1, side: THREE.DoubleSide})), mastro, 0, 0.7, 0).frustumCulled = false;
    ondular(c, vela, {h: 0.42, amp: 0.05, ampZ: 0.03, vel: 1.3, freq: 4});
    haste([xe - 0.02, tosado(xe), 0], [xe + 0.45, tosado(xe) + 0.22, 0], 0.032, M.madeiraEscura, nav);
    for (const s of [-1, 1]) {
      const tops = [];
      for (let x = -0.1; x <= 0.76; x += 0.17) { const y0 = tosado(x), z = s * (larg(x) - 0.01); haste([x, y0, z], [x, y0 + 0.12, z], 0.012, M.madeiraEscura, nav); tops.push([x, y0 + 0.12, z]); }
      for (let i = 0; i < tops.length - 1; i++) haste(tops[i], tops[i + 1], 0.012, M.madeiraEscura, nav);
    }
    for (const x of [-0.75, -0.35]) for (const s of [-1, 1]) malha(new THREE.BoxGeometry(0.13, 0.11, 0.03), M.boca, nav, x, tosado(x) - 0.12, s * 0.485);
    const al = new THREE.Group(); al.position.set(0.5, tosado(0.5) - 0.02, 0.15); al.rotation.set(-0.38, 0, -0.08); nav.add(al);
    laminas(c, al, {n: 3, altura: 0.55, seed: 9, raio: 0.03, largura: 0.05});
    const barril = new THREE.Group(); barril.position.set(1.35, 0.16, 0.75); barril.rotation.set(0, 0.6, Math.PI / 2); c.corpo.add(barril);
    const pb = [new V2(0.001, -0.2)];
    for (let i = 0; i <= 10; i++) { const y = -0.2 + i * 0.04; pb.push(new V2(0.12 + 0.04 * Math.cos(y / 0.2 * Math.PI / 2), y)); }
    pb.push(new V2(0.001, 0.2));
    malha(new THREE.LatheGeometry(pb, seg(24)), M.madeira, barril);
    for (const y of [-0.13, 0.13]) malha(new THREE.TorusGeometry(0.12 + 0.04 * Math.cos(y / 0.2 * Math.PI / 2) + 0.004, 0.012, 6, seg(24)), M.metal, barril, 0, y, 0).rotation.x = Math.PI / 2;
  },

  ancora(c) {
    const M = mats();
    const ferro = matCor('ferro', () => new THREE.MeshStandardMaterial({color: 0x4d4741, metalness: 0.55, roughness: 0.7}));
    const ferrugem = matCor('ferrugem', () => new THREE.MeshStandardMaterial({color: 0x8a4a26, roughness: 0.95}));
    malha(monteAreia(0.85, 0.12, 14), M.areia, c.corpo);
    const a = new THREE.Group(); a.position.set(0.15, 0.02, 0); a.rotation.set(0.12, 0.25, -0.5); c.corpo.add(a);
    malha(new THREE.CylinderGeometry(0.04, 0.046, 1.05, seg(14)), ferro, a, 0, 0.6, 0);
    const anel = malha(new THREE.TorusGeometry(0.085, 0.024, seg(10), seg(24)), ferro, a, 0, 1.2, 0);
    malha(new THREE.CylinderGeometry(0.03, 0.03, 0.64, seg(12)), ferro, a, 0, 0.98, 0).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) malha(new THREE.SphereGeometry(0.045, 12, 8), ferro, a, 0, 0.98, s * 0.32);
    malha(new THREE.TorusGeometry(0.38, 0.042, seg(10), seg(32), Math.PI), ferro, a, 0, 0.46, 0).rotation.z = Math.PI;
    malha(new THREE.SphereGeometry(0.065, 14, 10), ferro, a, 0, 0.08, 0);
    for (const s of [-1, 1]) {
      const p = malha(new THREE.ConeGeometry(0.11, 0.24, 4), ferro, a, s * 0.4, 0.55, 0);
      p.scale.set(1, 1, 0.35); p.rotation.z = -s * 0.45;
    }
    const r = rng(71);
    for (let i = 0; i < 9; i++) {
      const th = r() * TAU, y = 0.2 + r() * 0.85, n = new V3(Math.cos(th), 0, Math.sin(th));
      orientar(malha(new THREE.SphereGeometry(1, 10, 8), ferrugem, a, n.x * 0.042, y, n.z * 0.042), n).scale.set(0.025 + r() * 0.02, 0.04 + r() * 0.05, 0.01);
    }
    c.raiz.updateMatrixWorld(true);
    const p0 = c.corpo.worldToLocal(anel.getWorldPosition(new V3()));
    const g1 = new V3(p0.x - 0.45, 0, p0.z + 0.35); g1.y = alturaMonte(g1.x, g1.z, 0.85, 0.12) + 0.03;
    const g2 = new V3(g1.x - 0.55, 0, g1.z + 0.25); g2.y = alturaMonte(g2.x, g2.z, 0.85, 0.12) + 0.025;
    const meio = p0.clone().lerp(g1, 0.5); meio.y = Math.max(0.15, meio.y * 0.4);
    const curva = new THREE.CatmullRomCurve3([p0, meio, g1, g2]), n = Math.floor(curva.getLength() / 0.075);
    const geos = [], m4 = new THREE.Matrix4(), T = new V3(), N = new V3(), B = new V3(), up = new V3(0, 1, 0);
    for (let i = 1; i <= n; i++) {
      const u = i / n, P = curva.getPointAt(u);
      curva.getTangentAt(u, T);
      N.crossVectors(up, T); if (N.lengthSq() < 1e-4) N.set(1, 0, 0); N.normalize();
      B.crossVectors(T, N);
      if (i % 2) m4.makeBasis(T, N, B); else m4.makeBasis(T, B, N.clone().negate());
      m4.setPosition(P);
      const g = new THREE.TorusGeometry(0.042, 0.012, 6, seg(14)); g.scale(1.45, 1, 1); g.applyMatrix4(m4);
      geos.push(g);
    }
    malha(mergeGeometries(geos), ferro, c.corpo);
    geos.forEach(g => g.dispose());
  },

  fonte(c) {
    const M = mats();
    const perfil = [new V2(0.001, 0)], NY = seg(22);
    for (let i = 0; i <= NY; i++) { const y = i / NY * 0.8; perfil.push(new V2(0.13 + 0.25 * Math.pow(1 - y / 0.8, 1.6), y)); }
    perfil.push(new V2(0.09, 0.81), new V2(0.07, 0.74), new V2(0.001, 0.72));
    const g = new THREE.LatheGeometry(perfil, seg(28)), p = g.attributes.position, rr = rng(81), f = [rr() * 6, rr() * 6, rr() * 6];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z);
      const camadas = Math.round(y / 0.11) * 0.11, degrau = 0.07 * Math.sin(camadas * 37 + a * 3 + f[2]);
      const k = 1 + degrau + 0.08 * Math.sin(a * 4 + y * 5 + f[0]) * Math.cos(y * 7 + a * 3 + f[1]);
      p.setXYZ(i, x * k, y, z * k);
    }
    const cBase = new THREE.Color(0x6a625a), cTopo = new THREE.Color(0x3a3634), cMin = new THREE.Color(0xa35a2e);
    pintar(g, (cor, i, x, y, z) => {
      cor.copy(cBase).lerp(cTopo, y / 0.8);
      if (Math.sin(y * 31 + Math.atan2(x, z) * 2) > 0.85) cor.lerp(cMin, 0.6);
      if (y > 0.7 && Math.hypot(x, z) < 0.1) cor.set(0xff8a3a);
    });
    g.computeVertexNormals();
    malha(g, matCor('chamineRocha', () => new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.95, flatShading: true})), c.corpo);
    const brasa = matCor('brasa', () => new THREE.MeshStandardMaterial({color: 0xffa04a, emissive: 0xff6a1a, emissiveIntensity: 2}));
    malha(new THREE.SphereGeometry(0.07, 14, 10), brasa, c.corpo, 0, 0.72, 0).castShadow = false;
    [[0.38, 0.1, 0.12], [-0.33, 0.2, 0.1], [0.1, -0.38, 0.09], [-0.2, -0.3, 0.07]].forEach(([x, z, s], i) => {
      const m = malha(rochaGeo(30 + i, 1), M.pedraEscura, c.corpo, x, s * 0.5, z); m.scale.set(s, s * 0.8, s);
    });
    const topo = new THREE.Object3D(); topo.position.y = 0.8; c.corpo.add(topo);
    bolhas(c, topo, {n: 16, alt: 3, vel: 0.7, tam: 0.05, esp: 0.1});
    // atividade: 1 = normal; maior = erupção (a brasa acende mais). O jogo
    // controla com api.definirAtividade e soma as bolhas/areia por conta própria.
    let atividade = 1;
    c.api.definirAtividade = v => { atividade = Math.max(0, v); };
    c.anim.push(t => { brasa.emissiveIntensity = (1.6 + Math.sin(t * 3.1) * 0.6 + Math.sin(t * 7.3) * 0.2) * atividade; });
  },

  /* ---------- CRIATURAS ---------- */
  aguaViva(c, o) {
    const vm = MEDUSAS[o.cor] ? o.cor : 'lilas', P = MEDUSAS[vm];
    const g = new THREE.Group(); g.position.y = 1.1; c.corpo.add(g);
    const sino = new THREE.Group(); g.add(sino);
    const perfil = [];
    for (let i = 0; i <= 22; i++) { const a = i / 22 * Math.PI * 0.56; perfil.push(new V2(Math.sin(a) * 0.32 + 0.0005, Math.cos(a) * 0.27)); }
    perfil.push(new V2(0.3, -0.035), new V2(0.27, -0.02));
    const bg = new THREE.LatheGeometry(perfil, seg(48)), p = bg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y < 0.06) { const k = 1 + 0.05 * Math.cos(Math.atan2(x, z) * 8) * (0.06 - y) / 0.1; p.setXYZ(i, x * k, y, z * k); }
    }
    bg.computeVertexNormals();
    const mSino = matCor('medusa-' + vm, () => new THREE.MeshPhysicalMaterial({color: P.sino, transparent: true, opacity: 0.55, roughness: 0.15, clearcoat: 1, emissive: P.sinoEm, emissiveIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false}));
    malha(bg, mSino, sino).castShadow = false;
    const mLuz = matCor('medusaLuz', () => new THREE.MeshStandardMaterial({color: 0xd8f6ff, emissive: 0x7ff6ff, emissiveIntensity: 1.6}));
    malha(new THREE.SphereGeometry(0.1, 20, 14), mLuz, sino, 0, 0.1, 0).scale.set(1, 0.7, 1);
    for (let k = 0; k < 4; k++) {
      const a = k * TAU / 4, m = malha(new THREE.TorusGeometry(0.045, 0.013, 8, 20), mLuz, sino, Math.cos(a) * 0.1, 0.13, Math.sin(a) * 0.1);
      m.rotation.x = Math.PI / 2; m.castShadow = false;
    }
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; malha(new THREE.SphereGeometry(0.016, 8, 6), mLuz, sino, Math.sin(a) * 0.3, -0.03, Math.cos(a) * 0.3).castShadow = false; }
    const mBraco = matCor('medusaBraco-' + vm, () => new THREE.MeshStandardMaterial({vertexColors: true, transparent: true, opacity: 0.75, roughness: 0.4, side: THREE.DoubleSide, emissive: P.bracoEm, emissiveIntensity: 0.4, depthWrite: false}));
    const bracos = new THREE.Group(); g.add(bracos);
    laminas(c, bracos, {n: 4, altura: 0.75, seed: 5, raio: 0.04, largura: 0.07, cores: P.braco, material: mBraco, pendurada: true, amp: 0.1});
    const mTent = matCor('medusaTent-' + vm, () => new THREE.MeshStandardMaterial({color: P.tent, emissive: P.tentEm, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, depthWrite: false}));
    for (let k = 0; k < 12; k++) {
      const a = (k + 0.5) / 12 * TAU, len = 0.7 + (k % 3) * 0.12, pts = [];
      for (let i = 0; i <= 6; i++) pts.push(new V3(Math.sin(i * 1.3 + k) * 0.015, -i / 6 * len, 0));
      const tg = tuboAfunilado(pts, u => 0.008 * (1 - u * 0.6), 24, 5);
      const tm = malha(tg, mTent, g, Math.sin(a) * 0.28, -0.03, Math.cos(a) * 0.28);
      tm.castShadow = false; tm.frustumCulled = false;
      ondular(c, tg, {h: len, amp: 0.1, ampZ: 0.08, ph: k * 0.7, vel: 1.6, freq: 3.5});
    }
    c.anim.push(t => {
      const ph = t * 2.2, k = Math.max(0, Math.sin(ph));
      sino.scale.set(1 - 0.12 * k, 1 + 0.08 * k, 1 - 0.12 * k);
      g.position.y = 1.1 + 0.07 * Math.sin(ph - 0.9) + 0.08 * Math.sin(t * 0.5);
      g.rotation.y = t * 0.15;
    });
  },

  cavaloMarinho(c, o) {
    const vc = CAVALOS[o.cor] ? o.cor : 'laranja';
    const cor = new THREE.Color(CAVALOS[vc][0]), claro = new THREE.Color(CAVALOS[vc][1]);
    const mat = matCor('cavalo', () => new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: 0.45, clearcoat: 0.5}));
    const liso = matCor('cavaloLiso-' + vc, () => new THREE.MeshPhysicalMaterial({color: CAVALOS[vc][0], roughness: 0.45, clearcoat: 0.5}));
    const g = new THREE.Group(); g.position.y = 0.28; c.corpo.add(g);
    const pts = [[0, 1.0, 0], [0, 0.9, -0.07], [0, 0.76, -0.07], [0, 0.62, -0.01], [0, 0.48, 0], [0, 0.36, -0.04], [0, 0.25, -0.06], [0, 0.15, -0.035],
      [0, 0.085, 0.03], [0, 0.1, 0.1], [0, 0.16, 0.115], [0, 0.19, 0.075], [0, 0.16, 0.05]].map(q => new V3(...q));
    const raio = u => {
      const r = u < 0.12 ? 0.075 - 0.02 * u / 0.12 : u < 0.3 ? 0.055 + 0.05 * Math.sin((u - 0.12) / 0.18 * Math.PI / 2) : 0.105 - 0.093 * Math.pow((u - 0.3) / 0.7, 0.75);
      return r * (u > 0.12 ? 1 + 0.08 * Math.pow(Math.abs(Math.sin(u * 64)), 6) : 1);
    };
    const tg = tuboAfunilado(pts, raio, 140, 16), P = new V3(), curva = tg.userData.curva, ts = tg.userData.ts, rs = tg.userData.rs;
    pintar(tg, (cc, i, x, y, z) => {
      curva.getPointAt(Math.floor(i / (rs + 1)) / ts, P);
      const k = (z - P.z) / Math.max(0.001, Math.hypot(x - P.x, y - P.y, z - P.z));
      cc.copy(cor);
      if (k > 0.25) cc.lerp(claro, Math.min(1, (k - 0.25) * 2));
    });
    malha(tg, mat, g).scale.x = 0.8;
    // Cauda que enrola e desenrola: gira os anéis abaixo do peito em torno de X,
    // mais forte quanto mais perto da ponta.
    const tp = tg.attributes.position, tBase = tp.array.slice(), PIV_Y = 0.42, PIV_Z = -0.03, fase = Math.random() * TAU;
    const cab = new THREE.Group(); cab.position.set(0, 1.0, 0); g.add(cab);
    malha(new THREE.SphereGeometry(0.085, seg(28), seg(20)), liso, cab, 0, 0, 0.03).scale.set(0.82, 0.95, 1.2);
    malha(tuboAfunilado([new V3(0, -0.005, 0.08), new V3(0, -0.025, 0.17), new V3(0, -0.03, 0.25)], u => 0.03 - 0.006 * u + (u > 0.9 ? 0.006 : 0), 20, 12), liso, cab);
    malha(new THREE.TorusGeometry(0.02, 0.006, 6, 14), mats().boca, cab, 0, -0.03, 0.252);
    for (const sx of [-1, 1]) {
      olho(cab, 0.034, new V3(sx * 0.058, 0.02, 0.04), new V3(sx, 0.1, 0.45));
      malha(new THREE.SphereGeometry(1, 12, 8), liso, g, sx * 0.05, 0.9, -0.03).scale.set(0.012, 0.03, 0.045);
    }
    [[0, 0.09, -0.01, 0.02], [0.02, 0.08, -0.05, 0.016], [-0.02, 0.08, -0.05, 0.016]].forEach(([x, y, z, r]) => malha(new THREE.ConeGeometry(r, 0.05, 8), liso, cab, x, y, z));
    const fs = new THREE.Shape();
    fs.moveTo(0, -0.07); fs.quadraticCurveTo(0.11, -0.07, 0.1, 0); fs.quadraticCurveTo(0.11, 0.07, 0, 0.07); fs.lineTo(0, -0.07);
    const dorsal = new THREE.Group(); dorsal.position.set(0, 0.5, -0.085); g.add(dorsal);
    malha(nadadeira(fs, 0.01), matCor('cavaloFin', () => new THREE.MeshPhysicalMaterial({color: 0xffe2b0, roughness: 0.4, transparent: true, opacity: 0.85, clearcoat: 0.3})), dorsal);
    c.anim.push(t => {
      g.position.y = 0.28 + Math.sin(t * 1.3) * 0.06;
      g.rotation.y = Math.sin(t * 0.45) * 0.5;
      g.rotation.z = Math.sin(t * 0.9) * 0.05;
      dorsal.rotation.y = Math.sin(t * 16) * 0.35;
      cab.rotation.x = Math.sin(t * 0.8) * 0.08;
      const giro = Math.sin(t * 1.1 + fase) * 0.42, a = tp.array;
      for (let i = 0; i < tp.count; i++) {
        const y = tBase[i * 3 + 1], z = tBase[i * 3 + 2];
        if (y >= PIV_Y) continue;
        const k = Math.pow((PIV_Y - y) / PIV_Y, 1.4) * giro, cs = Math.cos(k), sn = Math.sin(k), dy = y - PIV_Y, dz = z - PIV_Z;
        a[i * 3 + 1] = PIV_Y + dy * cs - dz * sn;
        a[i * 3 + 2] = PIV_Z + dy * sn + dz * cs;
      }
      tp.needsUpdate = true;
    });
  },

  anemona(c, o) {
    const va = ANEMONAS[o.cor] ? o.cor : 'rosa', [ca, cb, cc] = ANEMONAS[va];
    malha(new THREE.CylinderGeometry(0.16, 0.21, 0.24, seg(28)), matCor('anemCol-' + va, () => new THREE.MeshPhysicalMaterial({color: cc, roughness: 0.6, clearcoat: 0.2})), c.corpo, 0, 0.12, 0);
    malha(new THREE.CircleGeometry(0.16, seg(28)), matCor('anemDisco', () => new THREE.MeshStandardMaterial({color: 0x3d7a4a, roughness: 0.6})), c.corpo, 0, 0.241, 0).rotation.x = -Math.PI / 2;
    malha(new THREE.TorusGeometry(0.025, 0.01, 8, 16), mats().boca, c.corpo, 0, 0.245, 0).rotation.x = Math.PI / 2;
    const mt = matCor('anemTent', () => new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: 0.45, clearcoat: 0.3}));
    const cA = new THREE.Color(ca), cB = new THREE.Color(cb);
    const tentaculo = e => {
      const pts = [[0, 0, 0], [0.02, 0.08, 0], [0.06, 0.16, 0], [0.1, 0.22, 0], [0.12, 0.26, 0]].map(q => new V3(...q).multiplyScalar(e));
      const tg = tuboAfunilado(pts, u => (0.022 - 0.01 * u) * e, 20, 8), ts = tg.userData.ts, rs = tg.userData.rs;
      pintar(tg, (cc, i) => cc.copy(cA).lerp(cB, Math.pow(Math.floor(i / (rs + 1)) / ts, 2)));
      const fim = tg.userData.curva.getPointAt(1), ponta = pintar(new THREE.SphereGeometry(0.017 * e, 10, 8), cc => cc.copy(cB));
      ponta.translate(fim.x, fim.y, fim.z);
      const m = mergeGeometries([tg, ponta]); tg.dispose(); ponta.dispose();
      return m;
    };
    const longo = tentaculo(1), curto = tentaculo(0.7), lista = [];
    [[18, 0.14, longo, 0.25], [11, 0.075, curto, 0.05]].forEach(([n, r, geo, incl], anel) => {
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU + anel * 0.3, g = new THREE.Group();
        g.position.set(Math.cos(a) * r, 0.235, Math.sin(a) * r); g.rotation.y = -a; c.corpo.add(g);
        malha(geo, mt, g).castShadow = anel === 0;
        lista.push({g, incl, ph: k * 0.9 + anel});
      }
    });
    c.anim.push(t => lista.forEach(o => { o.g.rotation.z = -(o.incl + Math.sin(t * 1.5 + o.ph) * 0.13); o.g.rotation.x = Math.cos(t * 1.2 + o.ph) * 0.08; }));
  },

  ourico(c) {
    const corpo = new THREE.Group(); corpo.position.y = 0.15; c.corpo.add(corpo);
    malha(new THREE.SphereGeometry(0.16, seg(32), seg(20)), matCor('ouricoCorpo', () => new THREE.MeshPhysicalMaterial({color: 0x3b1c4a, roughness: 0.5, clearcoat: 0.3})), corpo).scale.y = 0.82;
    const N = seg(150), r = rng(91), geos = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0), um = new V3(1, 1, 1);
    for (let i = 0; i < N; i++) {
      const y = 1 - 2 * (i + 0.5) / N, rad = Math.sqrt(1 - y * y), a = i * 2.39996, d = new V3(Math.cos(a) * rad, y, Math.sin(a) * rad);
      if (d.y < -0.4) continue;
      const len = 0.15 + r() * 0.1, g = new THREE.ConeGeometry(0.011, len, 5);
      q.setFromUnitVectors(up, d);
      g.applyMatrix4(m4.compose(new V3(d.x * 0.15, d.y * 0.15 * 0.82, d.z * 0.15).addScaledVector(d, len / 2), q, um));
      geos.push(g);
    }
    malha(mergeGeometries(geos), matCor('ouricoEsp', () => new THREE.MeshPhysicalMaterial({color: 0x7a3a9c, roughness: 0.35, clearcoat: 0.6})), corpo);
    geos.forEach(g => g.dispose());
    c.anim.push(t => { corpo.rotation.y = t * 0.08; const s = 1 + Math.sin(t * 1.3) * 0.015; corpo.scale.set(s, s, s); });
  },
};

/* =========================================================
   API
   ========================================================= */
function criarModelo(id, opcoes = {}) {
  const info = CATALOGO.find(m => m.id === id);
  if (!info) throw new Error('Modelo desconhecido: ' + id);
  const raiz = new THREE.Group(), corpo = new THREE.Group(), efeitos = new THREE.Group();
  raiz.name = id; corpo.name = id + '_corpo'; efeitos.name = id + '_efeitos';
  raiz.add(corpo, efeitos);
  raiz.userData.modeloId = id;
  const ctx = {id, info, raiz, corpo, efeitos, anim: [], olhos: [], proprios: [], api: {}, q: opcoes.qualidade === 'minima' ? 0.28 : opcoes.qualidade === 'baixa' ? 0.55 : 1, anel: null};
  const anterior = C;
  C = ctx;
  try {
    if (info.tipo === 'peao' && opcoes.base !== false) {
      ctx.anel = basePeao(ctx, opcoes.corJogador || '#ffd166');
      corpo.position.y = 0.075;
    }
    CONSTRUTORES[id](ctx, opcoes);
    if (ctx.olhos.length) piscar(ctx);
  } finally {
    C = anterior;
  }
  if (info.tipo === 'peao') {
    ctx.anim.forEach(f => f(0));
    raiz.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(corpo, true);
    const rx = Math.max(-bb.min.x, bb.max.x, -bb.min.z, bb.max.z);
    if (rx > 0.47) corpo.scale.setScalar(0.47 / rx);
  }
  return Object.assign({
    id, info, objeto: raiz, efeitos,
    atualizar(t) { for (const f of ctx.anim) f(t); },
    definirCorJogador(hex) { if (ctx.anel) { ctx.anel.color.set(hex); ctx.anel.emissive.set(hex); } },
    descartar() {
      raiz.removeFromParent();
      raiz.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      ctx.proprios.forEach(m => m.dispose());
    },
  }, ctx.api);
}

window.MODELOS_FUNDO_DO_MAR = { CATALOGO, ESTILOS_DADO, CORES_JOGADOR, VARIANTES_PEIXE, criarModelo };
})();
