// GERADO por tools/gerar-sw.mjs — não edite à mão.
// Service worker do app instalável (PWA). Na instalação guarda todos os
// arquivos do jogo; depois, com internet, busca sempre a versão nova
// (e atualiza o cache), e sem internet usa o que está guardado.
const CACHE = 'rumo-as-profundezas-d949885352';
const ARQUIVOS = [
    "./",
    "./assets/icons/apple-touch-icon.png",
    "./assets/icons/favicon-64.png",
    "./assets/icons/icon-192-maskable.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512-maskable.png",
    "./assets/icons/icon-512.png",
    "./assets/icons/icone.svg",
    "./assets/models/modelos-fundo-do-mar.js",
    "./data/creditos.json",
    "./data/questions/banco-conhecimentos-gerais.json",
    "./data/questions/banco-fundo-do-mar.json",
    "./data/questions/manifest.json",
    "./index.html",
    "./js/audio/audio.js",
    "./js/audio/musica.js",
    "./js/camera/camera.js",
    "./js/cartas/cartas3d.js",
    "./js/cartas/questions.js",
    "./js/cenario/ambiente.js",
    "./js/cenario/atmosfera.js",
    "./js/cenario/decoracao.js",
    "./js/dado/dado.js",
    "./js/data/boardPath.js",
    "./js/data/characters.js",
    "./js/data/diceFaces.js",
    "./js/data/gameInfo.js",
    "./js/data/tileTypes.js",
    "./js/efeitos/particles.js",
    "./js/interface/creditos.js",
    "./js/interface/escolhaPersonagem.js",
    "./js/interface/i18n.js",
    "./js/interface/icones.js",
    "./js/interface/interaction.js",
    "./js/interface/miniMenus.js",
    "./js/interface/transicao.js",
    "./js/interface/ui.js",
    "./js/interface/vitrine.js",
    "./js/modelos/animacaoPeoes.js",
    "./js/modelos/classicos.js",
    "./js/modelos/pawnBuilders.js",
    "./js/modelos/seaKit.js",
    "./js/nucleo/bots.js",
    "./js/nucleo/config.js",
    "./js/nucleo/main.js",
    "./js/nucleo/renderizador.js",
    "./js/nucleo/state.js",
    "./js/rede/multiplayer.js",
    "./js/tabuleiro/caminho.js",
    "./js/tabuleiro/casas.js",
    "./js/tabuleiro/layout.js",
    "./js/tabuleiro/peoes.js",
    "./manifest.webmanifest",
    "./styles.css",
    "./vendor/CopyShader.js",
    "./vendor/EffectComposer.js",
    "./vendor/LuminosityHighPassShader.js",
    "./vendor/OrbitControls.js",
    "./vendor/RenderPass.js",
    "./vendor/ShaderPass.js",
    "./vendor/UnrealBloomPass.js",
    "./vendor/gsap.min.js",
    "./vendor/three-r128-extras.js",
    "./vendor/three.min.js"
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res && res.ok) {
                    const copia = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, copia));
                }
                return res;
            })
            .catch(() =>
                caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
            )
    );
});
