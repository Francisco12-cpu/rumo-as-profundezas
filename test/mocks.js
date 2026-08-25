// Harness mínimo pra rodar o código do jogo (js/*.js) fora do navegador,
// em Node puro, sem precisar de WebGL/DOM de verdade. js/*.js são scripts
// clássicos que esperam THREE, gsap, document, window etc. como globais —
// aqui a gente fabrica versões "burras" o suficiente pra exercitar a LÓGICA
// do jogo (estado, turnos, pontuação) sem desenhar nada de verdade.
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

function mockDeep(name) {
    const target = function mocked() {
        return mockDeep(name + '()');
    };
    const handler = {
        get(t, prop) {
            if (prop === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '[[' + name + ']]' : 0);
            if (prop === 'toString') return () => '[[' + name + ']]';
            if (prop === 'valueOf') return () => 0;
            if (typeof prop === 'symbol') return undefined;
            return mockDeep(name + '.' + String(prop));
        },
        set() {
            return true;
        },
        apply() {
            return mockDeep(name + '(call)');
        },
        construct() {
            return mockDeep('new:' + name);
        },
        has() {
            return true;
        },
    };
    return new Proxy(target, handler);
}

class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    normalize() {
        const l = Math.hypot(this.x, this.y, this.z) || 1;
        this.x /= l;
        this.y /= l;
        this.z /= l;
        return this;
    }
    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        this.z += (v.z - this.z) * t;
        return this;
    }
}
class Object3DMock {
    constructor() {
        this.children = [];
        this.position = new Vec3();
        this.rotation = new Vec3();
        this.scale = new Vec3(1, 1, 1);
        this.userData = {};
        this.visible = true;
    }
    add(o) {
        this.children.push(o);
        return this;
    }
    remove(o) {
        const i = this.children.indexOf(o);
        if (i > -1) this.children.splice(i, 1);
        return this;
    }
}
class MeshMock extends Object3DMock {
    constructor(geo, mat) {
        super();
        this.geometry = geo;
        this.material = mat;
    }
}
class ColorMock {
    constructor(hex) {
        this.hex = hex;
    }
    setHSL() {
        return this;
    }
}
class CurveMock {
    constructor(pts) {
        this.pts = pts || [];
    }
    getPointAt(t) {
        return new Vec3(t, 0, t);
    }
    getTangentAt() {
        return new Vec3(1, 0, 0);
    }
    getPoints(n) {
        return this.pts;
    }
}
class BufferGeoMock {
    constructor() {
        this.attributes = { position: { count: 0, getX: () => 0, getY: () => 0, setZ: () => {} } };
    }
    setFromPoints() {
        return this;
    }
    computeVertexNormals() {}
}
class OrbitControlsMock {
    constructor(cam) {
        this.object = cam;
        this.target = new Vec3();
    }
    update() {}
    dispose() {}
}

function buildSandbox() {
    const threeReal = {
        Vector3: Vec3,
        Group: Object3DMock,
        Mesh: MeshMock,
        Line: MeshMock,
        Sprite: MeshMock,
        Color: ColorMock,
        CatmullRomCurve3: CurveMock,
        BufferGeometry: BufferGeoMock,
        PlaneGeometry: class extends BufferGeoMock {},
        OrbitControls: OrbitControlsMock,
    };
    const THREE = new Proxy(threeReal, { get: (t, prop) => (prop in t ? t[prop] : mockDeep('THREE.' + String(prop))) });
    const gsap = mockDeep('gsap');
    const elementStore = new Map();
    function fakeElement(id) {
        if (!elementStore.has(id)) elementStore.set(id, mockDeep('el:' + id));
        return elementStore.get(id);
    }
    const document = {
        documentElement: { lang: '' },
        getElementById: (id) => fakeElement(id),
        createElement: (tag) => mockDeep('createElement:' + tag),
        querySelectorAll: () => [],
        addEventListener: () => {},
    };
    const window = {
        innerWidth: 1000,
        innerHeight: 800,
        devicePixelRatio: 1,
        addEventListener: () => {},
        AudioContext: function () {
            return mockDeep('AudioContext');
        },
    };
    const navigator = { vibrate: () => {}, clipboard: { writeText: () => Promise.resolve() } };
    const storage = {};
    const localStorage = {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
        setItem: (k, v) => {
            storage[k] = String(v);
        },
        removeItem: (k) => {
            delete storage[k];
        },
    };
    function alert(msg) {
        sandbox.__alerts.push(msg);
    }
    function Peer() {
        return mockDeep('Peer');
    }
    // Simula o cenário "aberto via file://" (fetch bloqueado) — exercita o
    // fallback pro banco padrão embutido (ver questions.js/loadQuestionBanks).
    function fetch() {
        return Promise.reject(new Error('fetch indisponível neste teste'));
    }

    const sandbox = {
        THREE,
        gsap,
        document,
        window,
        navigator,
        localStorage,
        alert,
        requestAnimationFrame: () => {},
        Peer,
        fetch,
        console,
        setTimeout,
        setInterval,
        clearInterval,
        clearTimeout,
        Math,
        JSON,
        Promise,
        Blob: mockDeep('Blob'),
        URL: mockDeep('URL'),
        Number,
        Array,
        __alerts: [],
    };
    vm.createContext(sandbox);
    return sandbox;
}

// main.js fica de fora de propósito: ele chama initThreeJS()/animate() sozinho
// ao ser carregado, o que não faz sentido rodar num teste de lógica pura.
const GAME_FILES = [
    'data/gameInfo.js',
    'data/tileTypes.js',
    'data/characters.js',
    'data/diceFaces.js',
    'data/boardPath.js',
    'config.js',
    'i18n.js',
    'audio.js',
    'pawnBuilders.js',
    'scene.js',
    'interaction.js',
    'particles.js',
    'camera.js',
    'state.js',
    'bots.js',
    'questions.js',
    'multiplayer.js',
    'ui.js',
];

function loadGame(baseDir) {
    const sandbox = buildSandbox();
    for (const f of GAME_FILES) {
        const code = fs.readFileSync(path.join(baseDir, 'js', f), 'utf8');
        vm.runInContext(code, sandbox, { filename: f });
    }
    return sandbox;
}

module.exports = { loadGame, Vec3 };
