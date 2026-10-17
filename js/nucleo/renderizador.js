// ============================================================
// RENDERIZADOR, CENA, LUZES E NÉVOA
// ============================================================
// Monta o renderer/composer/câmera/controles e os grupos da cena; também
// guarda helpers genéricos de cena usados por vários sistemas.

// Objetos que nunca se mexem: calcula a matriz uma vez e não recalcula a
// cada quadro (com mais de mil objetos em cena, esse recálculo era boa parte
// do tempo de desenho num processador de celular).
function freezeStatic(object) {
    object.updateMatrixWorld(true);
    object.traverse((o) => {
        o.matrixAutoUpdate = false;
    });
}

// ============ INICIALIZAÇÃO THREE.JS ============
// Névoa LINEAR que acompanha a câmera (ver updateDistanceFog, camera.js):
// começa um pouco antes do ponto que a câmera olha e fecha FOG_DEPTH depois.
// Assim o tabuleiro fica sempre nítido, de perto ou de longe, e tudo além
// some no azul — inclusive a borda do mapa. (Uma névoa exponencial fixa ou
// lavava o tabuleiro na visão geral ou deixava a borda aparecer.)
const FOG_DEPTH = 55;

function initThreeJS() {
    const canvas = document.getElementById('game-canvas');
    // Em aparelho mais fraco (poucos núcleos ou tela pequena, ver config.js):
    // sem antialiasing, pixel ratio mais baixo e sombra em resolução menor —
    // o que mais pesa é justamente antialias + shadow map grande em tela retina.
    renderer = new THREE.WebGLRenderer({ canvas, antialias: qualityLevel === 2, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q3(1, 1.5, 2)));
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Qualidade baixa: sem sombras (cada objeto que faz sombra é desenhado duas vezes).
    renderer.shadowMap.enabled = qualityLevel > 0;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    // Névoa de profundidade na cor do horizonte da água (ver atmosfera.js):
    // o que está longe some no azul em vez de terminar numa borda.
    scene.fog = new THREE.Fog(new THREE.Color(WATER_HORIZON_COLOR).convertSRGBToLinear(), 10, 10 + FOG_DEPTH);

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 260);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);

    // Composer com Bloom
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom sutil: só os pontos realmente brilhantes (anéis, casas especiais) brilham;
    // valores mais altos aqui lavavam a cena inteira pra branco.
    const bloomScale = q3(0.4, 0.6, 1);
    const bloomRes = new THREE.Vector2(window.innerWidth * bloomScale, window.innerHeight * bloomScale);
    // Limiar 0,92 (era 0,85): superfícies claras e iluminadas de cima (o
    // caminho, as bases de areia dos modelos, os números das casas) passavam
    // do limiar e "estouravam" em branco; agora só o que é emissivo de verdade brilha.
    bloomPass = new THREE.UnrealBloomPass(bloomRes, 0.24, 0.4, 0.92);
    bloomPass.enabled = qualityLevel > 0;
    composer.addPass(bloomPass);

    // Luzes
    // Hemisférica azul-esverdeada (claro de cima, abismo de baixo) no lugar da
    // ambiente chapada — é o que dá o tom de "debaixo d'água" da referência.
    // Somadas, as luzes não podem passar muito de 1x numa superfície virada
    // pra cima, senão areia dourada e peões claros "estouram" em creme/branco.
    const hemiLight = new THREE.HemisphereLight(0xa8ecff, 0x0a3550, 0.42);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xeafcff, 0.85);
    sunLight.position.set(15, 25, 10);
    sunLight.castShadow = true;
    const shadowRes = q3(1024, 1536, 2048);
    sunLight.shadow.mapSize.width = shadowRes;
    sunLight.shadow.mapSize.height = shadowRes;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x88bbdd, 0.18);
    fillLight.position.set(-8, 10, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.3);
    rimLight.position.set(0, 8, -15);
    scene.add(rimLight);

    // Grupos
    environmentGroup = new THREE.Group();
    scene.add(environmentGroup);
    boardGroup = new THREE.Group();
    scene.add(boardGroup);
    tilesGroup = new THREE.Group();
    boardGroup.add(tilesGroup);
    pawnsGroup = new THREE.Group();
    scene.add(pawnsGroup);
    diceGroup = new THREE.Group();
    scene.add(diceGroup);
    particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    // Controle de câmera com mouse/toque: arrastar gira, scroll/pinça dá zoom.
    // O "alvo" (controls.target) continua sendo movido automaticamente pelo jogo
    // (foco no jogador, na visão geral, no dado) — o jogador só ajusta o ângulo/zoom
    // ao redor desse alvo, sem perder o acompanhamento automático da ação.
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false; // ligado em initCameraExplore (camera.js), com pan no plano do chão
    controls.minDistance = 4;
    controls.maxDistance = 70; // cobre a visão geral de tabuleiros longos (ver setCameraOverview)
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.target.set(0, 0, 0);
    controls.update();

    initAtmosphere();
    initTileInteraction();
    initCameraExplore();
}

// Remove e libera tudo de um grupo (geometrias/materiais) — usado pra montar
// cenário/caminho de novo a cada partida sem acumular os da partida anterior.
function disposeGroupChildren(group, filter) {
    group.children.slice().forEach((child) => {
        if (filter && !filter(child)) return;
        group.remove(child);
        child.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
        });
    });
}
