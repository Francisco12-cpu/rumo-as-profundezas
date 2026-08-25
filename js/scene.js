// Gradiente vertical simples (mais claro em cima, mais fundo/escuro embaixo)
// usado como pano de fundo — dá sensação de profundidade de água por um
// custo praticamente zero (uma textura pequena, gerada uma vez).
function createDepthGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#4fc3e8');
    gradient.addColorStop(0.45, '#1ca3e0');
    gradient.addColorStop(1, '#063a5c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding; // mesma codificação de cor do renderer (ver initThreeJS)
    return texture;
}

// ============ INICIALIZAÇÃO THREE.JS ============
function initThreeJS() {
    const canvas = document.getElementById('game-canvas');
    // Em aparelho mais fraco (poucos núcleos ou tela pequena, ver config.js):
    // sem antialiasing, pixel ratio mais baixo e sombra em resolução menor —
    // o que mais pesa é justamente antialias + shadow map grande em tela retina.
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isLowPowerDevice, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPowerDevice ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    // Fundo em gradiente (claro embaixo -> mais fundo/escuro em cima) em vez
    // de uma cor chapada — dá sensação de profundidade de água sem custar
    // nada em tempo de execução (é só uma textura pequena).
    scene.background = createDepthGradientTexture();
    scene.fog = new THREE.FogExp2(0x0f7ab0, 0.022);

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);

    // Composer com Bloom
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom sutil: só os pontos realmente brilhantes (anéis, casas especiais) brilham;
    // valores mais altos aqui lavavam a cena inteira pra branco.
    const bloomRes = isLowPowerDevice
        ? new THREE.Vector2(window.innerWidth * 0.6, window.innerHeight * 0.6)
        : new THREE.Vector2(window.innerWidth, window.innerHeight);
    bloomPass = new THREE.UnrealBloomPass(bloomRes, 0.28, 0.4, 0.85);
    composer.addPass(bloomPass);

    // Luzes
    // Menos luz ambiente = mais contraste entre luz/sombra = cores mais vivas e menos "lavadas".
    const ambientLight = new THREE.AmbientLight(0x4488cc, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(15, 25, 10);
    sunLight.castShadow = true;
    const shadowRes = isLowPowerDevice ? 1024 : 2048;
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

    const fillLight = new THREE.DirectionalLight(0x88bbdd, 0.4);
    fillLight.position.set(-8, 10, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.4);
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
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 70; // cobre a visão geral de tabuleiros longos (ver setCameraOverview)
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.target.set(0, 0, 0);
    controls.update();

    initTileInteraction();
}

// Sorteia uma posição dentro de um raio, evitando a área ocupada pelo
// tabuleiro (senão coral/alga nascem em cima das casas e atrapalham a
// leitura do caminho). boardLength já está definido nesse ponto (vem da
// configuração da partida), mesmo a curva ainda não tendo sido gerada.
function randomEnvironmentSpot(radius) {
    const rows = getBoardRowCount(boardLength);
    const keepOutX = 11;
    const keepOutZ = ((rows - 1) * 4.5) / 2 + 3;
    for (let attempt = 0; attempt < 6; attempt++) {
        const x = (Math.random() - 0.5) * radius * 2;
        const z = (Math.random() - 0.5) * radius * 2;
        if (Math.abs(x) > keepOutX || Math.abs(z) > keepOutZ) return { x, z };
    }
    // não achou fora da área em 6 tentativas: joga pra margem
    const side = Math.random() < 0.5 ? -1 : 1;
    return { x: side * (keepOutX + 1 + Math.random() * (radius - keepOutX)), z: (Math.random() - 0.5) * radius * 2 };
}

// Gera N "centros de grupo" (fora da área do tabuleiro) — plantas/pedras
// nascem perto de um centro sorteado, em vez de espalhadas uniformemente
// pelo mapa. É isso que faz o cenário parecer touceiras/recifes naturais em
// vez de decoração distribuída em grade.
function generateClusterCenters(count, radius) {
    const centers = [];
    for (let i = 0; i < count; i++) centers.push(randomEnvironmentSpot(radius));
    return centers;
}

function jitterAroundCluster(center, spread) {
    return {
        x: center.x + (Math.random() - 0.5) * spread,
        z: center.z + (Math.random() - 0.5) * spread,
    };
}

// Textura de areia gerada por canvas: grão/sedimento/variação de tom, não só
// uma cor lisa. O relevo (vértices deslocados) já dava profundidade de
// FORMA; isso dá profundidade de SUPERFÍCIE — sensação de terreno de verdade.
function createSandTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#c9a15f';
    ctx.fillRect(0, 0, size, size);

    // Manchas grandes e suaves (sedimento, variação de maré)
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 18 + Math.random() * 38;
        const lighter = Math.random() < 0.5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, lighter ? 'rgba(224,186,120,0.35)' : 'rgba(150,108,58,0.25)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Grão fino (milhares de pontinhos pequenos) — é o que dá a sensação de
    // areia de verdade em vez de uma superfície de plástico lisa.
    for (let i = 0; i < 4200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = Math.random();
        ctx.fillStyle =
            shade < 0.5
                ? 'rgba(101,74,40,' + (0.08 + Math.random() * 0.12) + ')'
                : 'rgba(255,235,190,' + (0.06 + Math.random() * 0.1) + ')';
        ctx.fillRect(x, y, 1, 1);
    }

    // Fragmentos maiores (conchinhas/pedrinhas achatadas na textura)
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = 'rgba(255,244,220,' + (0.15 + Math.random() * 0.15) + ')';
        ctx.beginPath();
        ctx.ellipse(x, y, 1.5 + Math.random() * 2, 0.8 + Math.random() * 1.2, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 14);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
}

// ============ AMBIENTE OCEANO ============
function createOceanEnvironment() {
    // Fundo de areia, com relevo sutil (nada de plano totalmente liso)
    const sandGeo = new THREE.PlaneGeometry(90, 90, 48, 48);
    const sandPositions = sandGeo.attributes.position;
    for (let i = 0; i < sandPositions.count; i++) {
        const x = sandPositions.getX(i);
        const y = sandPositions.getY(i);
        // Mesmas duas ondas de sempre (relevo grande + ondulação fina), só um
        // pouco mais fortes — irregularidade orgânica um pouco mais visível
        // sem virar dunas, então o caminho continua legível por cima.
        sandPositions.setZ(i, Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.42 + Math.sin(x * 1.7 + y * 1.3) * 0.09);
    }
    sandGeo.computeVertexNormals();
    // Tom de areia mais dourado/saturado — a versão anterior lia como quase
    // branca sob a luz do ambiente. A cor base agora só entra como tint por
    // baixo da textura (createSandTexture), que é quem dá o grão/variação real.
    const sandMat = new THREE.MeshStandardMaterial({
        map: createSandTexture(),
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.03,
    });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -0.15;
    sand.receiveShadow = true;
    environmentGroup.add(sand);

    // Pedras decorativas: mesmo material/geometria base pra todas — um só
    // InstancedMesh (num draw call) em vez de várias meshes separadas.
    const rockCount = isLowPowerDevice ? 22 : 32;
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x707a82, roughness: 0.75, metalness: 0.15 });
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    const rockDummy = new THREE.Object3D();
    for (let i = 0; i < rockCount; i++) {
        const baseSize = 0.2 + Math.random() * 0.4;
        const spot = randomEnvironmentSpot(25);
        rockDummy.position.set(spot.x, -0.05 + Math.random() * 0.2, spot.z);
        rockDummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rockDummy.scale.set(baseSize, baseSize * (Math.random() * 0.7 + 0.5), baseSize);
        rockDummy.updateMatrix();
        rockMesh.setMatrixAt(i, rockDummy.matrix);
    }
    rockMesh.instanceMatrix.needsUpdate = true;
    environmentGroup.add(rockMesh);

    // Algas marinhas — numerosas, em touceiras (grupos ao redor de centros
    // sorteados) preenchendo os vãos entre trechos do caminho, em vez de
    // espalhadas uniformemente. Tamanhos variados dentro de cada touceira.
    const seaweedClusters = generateClusterCenters(16, 23);
    const seaweedCount = isLowPowerDevice ? 60 : 90;
    for (let i = 0; i < seaweedCount; i++) {
        const seaweedGroup = new THREE.Group();
        const sizeRoll = Math.random();
        const seaweedHeight =
            sizeRoll < 0.35
                ? 0.7 + Math.random() * 0.6
                : sizeRoll < 0.7
                  ? 1.3 + Math.random() * 0.9
                  : 2.2 + Math.random() * 1.5;
        // Boa parte da haste fica ENTERRADA (y negativo, escondida sob a
        // superfície da areia) — antes a alga nascia direto do chão (y=0) e,
        // sendo curta, o balanço fazia ela parecer boiando/voando em vez de
        // uma planta comprida presa no fundo. Só a parte acima de y~0 fica
        // visível; o resto é a "raiz" escondida que ancora visualmente o
        // balanço.
        const buriedDepth = 0.3 + Math.random() * 0.3;
        const seaweedCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -buriedDepth, 0),
            new THREE.Vector3(0.04, 0, 0),
            new THREE.Vector3(0.18, seaweedHeight * 0.4, 0),
            new THREE.Vector3(-0.14, seaweedHeight * 0.7, 0.06),
            new THREE.Vector3(0.24, seaweedHeight, 0),
        ]);
        const seaweedGeo = new THREE.TubeGeometry(seaweedCurve, 14, 0.04 + seaweedHeight * 0.01, 6, false);
        const seaweedMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(
                0.3 + Math.random() * 0.18,
                0.55 + Math.random() * 0.2,
                0.24 + Math.random() * 0.24
            ),
            roughness: 0.6,
            metalness: 0.1,
        });
        const seaweed = new THREE.Mesh(seaweedGeo, seaweedMat);
        seaweed.rotation.y = Math.random() * Math.PI * 2;
        seaweed.castShadow = true;
        seaweedGroup.add(seaweed);
        // A posição vai no GRUPO (não na mesh) porque o balanço em animate()
        // (main.js) gira `child.rotation.z` do próprio grupo — se só a mesh
        // tivesse posição, o grupo ficaria na origem do mundo e toda alga
        // balançaria em torno do CENTRO DO MAPA em vez da própria base
        // (o bug real por trás do "parece que está voando" longe do centro).
        const center = seaweedClusters[Math.floor(Math.random() * seaweedClusters.length)];
        const spot = jitterAroundCluster(center, 3.2);
        seaweedGroup.position.set(spot.x, -0.1, spot.z);
        seaweedGroup.userData = { swaySpeed: 0.5 + Math.random(), swayOffset: Math.random() * Math.PI * 2 };
        environmentGroup.add(seaweedGroup);
    }

    // Corais em pequenos "recifes" (clusters menores e mais próximos entre si)
    const coralClusters = generateClusterCenters(8, 24);
    const coralCount = isLowPowerDevice ? 18 : 24;
    for (let i = 0; i < coralCount; i++) {
        const coralGroup = new THREE.Group();
        const coralColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.9, 0.7, 0.55);
        const coralMat = new THREE.MeshStandardMaterial({
            color: coralColor,
            roughness: 0.5,
            metalness: 0.1,
            emissive: coralColor,
            emissiveIntensity: 0.18,
        });
        for (let j = 0; j < 6; j++) {
            const branchGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.3 + Math.random() * 0.5, 6);
            const branch = new THREE.Mesh(branchGeo, coralMat);
            branch.position.set(
                (Math.random() - 0.5) * 0.4,
                (0.3 + Math.random() * 0.5) * 0.5,
                (Math.random() - 0.5) * 0.4
            );
            branch.rotation.set((Math.random() - 0.5) * 0.8, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.8);
            branch.castShadow = true;
            coralGroup.add(branch);
        }
        const center = coralClusters[Math.floor(Math.random() * coralClusters.length)];
        const spot = jitterAroundCluster(center, 1.8);
        coralGroup.position.set(spot.x, -0.1, spot.z);
        environmentGroup.add(coralGroup);
    }

    // Flores marinhas — em tapetes pequenos e densos
    const flowerClusters = generateClusterCenters(12, 20);
    const flowerCount = isLowPowerDevice ? 34 : 44;
    for (let i = 0; i < flowerCount; i++) {
        const flowerGroup = new THREE.Group();
        const flowerColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.25, 5);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.12;
        stem.castShadow = true;
        flowerGroup.add(stem);

        const headGeo = new THREE.SphereGeometry(0.12, 6, 5);
        const headMat = new THREE.MeshStandardMaterial({
            color: flowerColor,
            roughness: 0.4,
            emissive: flowerColor,
            emissiveIntensity: 0.3,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.28;
        head.castShadow = true;
        flowerGroup.add(head);

        const center = flowerClusters[Math.floor(Math.random() * flowerClusters.length)];
        const spot = jitterAroundCluster(center, 2.2);
        flowerGroup.position.set(spot.x, -0.08, spot.z);
        environmentGroup.add(flowerGroup);
    }

    // Conchinhas soltas na areia — só decoração parada, espalhadas soltas
    // (sem cluster) pra preencher os vazios que sobram entre touceiras.
    const shellCount = isLowPowerDevice ? 10 : 18;
    for (let i = 0; i < shellCount; i++) {
        const shellColor = new THREE.Color().setHSL(0.08 + Math.random() * 0.06, 0.35, 0.72 + Math.random() * 0.15);
        const shellMat = new THREE.MeshStandardMaterial({
            color: shellColor,
            roughness: 0.5,
            metalness: 0.05,
            side: THREE.DoubleSide,
        });
        const shellGeo = new THREE.ConeGeometry(0.1 + Math.random() * 0.06, 0.04, 7, 1, true);
        const shell = new THREE.Mesh(shellGeo, shellMat);
        const spot = randomEnvironmentSpot(26);
        shell.position.set(spot.x, -0.08, spot.z);
        shell.rotation.x = Math.PI / 2;
        shell.rotation.z = Math.random() * Math.PI * 2;
        shell.castShadow = true;
        environmentGroup.add(shell);
    }

    createCrabs();
}

// ============ CARANGUEJOS AMBIENTES ============
// Puro enfeite: andam sozinhos pelo cenário (anda / pára / muda de direção),
// sem NENHUMA ligação com o tabuleiro, o estado da partida ou qualquer
// mecânica — nada em state.js/main.js (fora updateCrabs, chamada só daqui)
// lê ou escreve `crabs`. randomEnvironmentSpot() é o mesmo helper que já
// evita a área do caminho pra plantas/pedras, então eles nunca cruzam por
// cima das casas.
function createCrabMesh() {
    const group = new THREE.Group();
    const shellColor = new THREE.Color().setHSL(0.05 + Math.random() * 0.04, 0.55, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: shellColor, roughness: 0.6, metalness: 0.1 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), bodyMat);
    body.scale.set(1, 0.5, 0.8);
    body.position.y = 0.08;
    body.castShadow = true;
    group.add(body);

    const legs = [];
    for (let side = -1; side <= 1; side += 2) {
        for (let j = 0; j < 3; j++) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.16, 4), bodyMat);
            leg.position.set(side * 0.15, 0.05, -0.08 + j * 0.08);
            leg.rotation.z = side * 1.1;
            leg.userData.baseRotX = (j - 1) * 0.3;
            leg.rotation.x = leg.userData.baseRotX;
            group.add(leg);
            legs.push(leg);
        }
    }
    const clawGeo = new THREE.SphereGeometry(0.045, 5, 4);
    for (let side = -1; side <= 1; side += 2) {
        const claw = new THREE.Mesh(clawGeo, bodyMat);
        claw.position.set(side * 0.2, 0.08, 0.14);
        group.add(claw);
    }
    group.userData.legs = legs;
    return group;
}

function createCrabs() {
    if (crabs && crabs.length) {
        crabs.forEach((c) => environmentGroup.remove(c));
        crabs.length = 0;
    }
    const crabCount = isLowPowerDevice ? 2 : 4;
    for (let i = 0; i < crabCount; i++) {
        const crab = createCrabMesh();
        const spot = randomEnvironmentSpot(24);
        crab.position.set(spot.x, 0, spot.z);
        crab.rotation.y = Math.random() * Math.PI * 2;
        crab.userData.state = 'paused';
        crab.userData.timer = 1 + Math.random() * 3;
        crab.userData.target = null;
        crab.userData.speed = 0.4 + Math.random() * 0.3;
        environmentGroup.add(crab);
        crabs.push(crab);
    }
}

// Chamada todo frame por animate() (main.js). Cada caranguejo alterna entre
// "parado" e "andando até um ponto aleatório", igual um bichinho de aquário —
// pura decoração, nunca lê gameState nem posições de peão/casa.
function updateCrabs(deltaTime, elapsed) {
    if (!crabs || !crabs.length) return;
    crabs.forEach((crab) => {
        const d = crab.userData;
        d.timer -= deltaTime;
        if (d.state === 'paused') {
            if (d.timer <= 0) {
                const spot = randomEnvironmentSpot(24);
                d.target = new THREE.Vector3(spot.x, 0, spot.z);
                d.state = 'walking';
            }
            return;
        }
        const toTarget = d.target.clone().sub(crab.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        if (dist < 0.15) {
            d.state = 'paused';
            d.timer = 1.5 + Math.random() * 3.5;
            return;
        }
        toTarget.normalize();
        const step = Math.min(dist, d.speed * deltaTime);
        crab.position.x += toTarget.x * step;
        crab.position.z += toTarget.z * step;

        const targetAngle = Math.atan2(toTarget.x, toTarget.z);
        let angleDiff = targetAngle - crab.rotation.y;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        crab.rotation.y += angleDiff * 0.12;

        if (d.legs) {
            d.legs.forEach((leg, li) => {
                leg.rotation.x = leg.userData.baseRotX + Math.sin(elapsed * 9 + li * 1.4) * 0.3;
            });
        }
    });
}

// ============ CRIAÇÃO DO TABULEIRO ============
// O traçado em si (posição dos pontos de controle) vem de generateBoardPath()
// (js/data/boardPath.js) — este arquivo só cuida de TRANSFORMAR esse traçado
// em geometria. Separar os dois deixa fácil ajustar a forma do caminho sem
// tocar em nada de renderização, e vice-versa.
function createBoardCurve() {
    const pts = generateBoardPath(boardLength);
    boardCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

    // Caminho: uma faixa BAIXA e achatada (não um tubo redondo) — a ideia é
    // parecer uma trilha desenhada/compactada na areia, não uma cobra 3D
    // saindo do chão. O TubeGeometry ainda faz o trabalho pesado de seguir a
    // curva suavemente; só achatamos ele verticalmente depois.
    const tubeGeo = new THREE.TubeGeometry(boardCurve, 240, 0.85, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xe0bb84,
        roughness: 0.85,
        metalness: 0.02,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.scale.y = 0.05; // achata o tubo numa faixa rasa
    tube.receiveShadow = true;
    boardGroup.add(tube);

    // Linha central decorativa (bem discreta, só reforça a direção do caminho)
    const curvePoints = boardCurve.getPoints(200);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
        color: 0xffd740,
        transparent: true,
        opacity: 0.25,
    });
    const centerLine = new THREE.Line(lineGeo, lineMat);
    centerLine.position.y += 0.015;
    boardGroup.add(centerLine);

    // Bordas decorativas: pedrinhas marcando a margem da trilha, num único
    // InstancedMesh (mesma geometria/material pra todas, só posição/tamanho mudam).
    const borderSamples = 90;
    const pebbleGeo = new THREE.SphereGeometry(0.09, 5, 4);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7 });
    const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, borderSamples * 2);
    pebbleMesh.castShadow = true;
    pebbleMesh.receiveShadow = true;
    const pebbleDummy = new THREE.Object3D();
    let pebbleIdx = 0;
    for (let i = 0; i < borderSamples; i++) {
        const t = i / (borderSamples - 1);
        const point = boardCurve.getPointAt(t);
        const tangent = boardCurve.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        for (let side = -1; side <= 1; side += 2) {
            const scale = 0.7 + Math.random() * 0.55;
            pebbleDummy.position.set(point.x + normal.x * 0.9 * side, 0.03, point.z + normal.z * 0.9 * side);
            pebbleDummy.scale.set(scale, scale, scale);
            pebbleDummy.updateMatrix();
            pebbleMesh.setMatrixAt(pebbleIdx++, pebbleDummy.matrix);
        }
    }
    pebbleMesh.instanceMatrix.needsUpdate = true;
    boardGroup.add(pebbleMesh);
}

function getTilePosition(index) {
    if (!boardCurve || boardLength === 0) return new THREE.Vector3(0, 0.3, 0);
    const t = boardLength === 1 ? 0 : index / (boardLength - 1);
    const point = boardCurve.getPointAt(Math.min(Math.max(t, 0), 1));
    point.y += 0.15;
    return point;
}

function getTileTangent(index) {
    if (!boardCurve || boardLength === 0) return new THREE.Vector3(1, 0, 0);
    const t = boardLength === 1 ? 0 : index / (boardLength - 1);
    const tangent = boardCurve.getTangentAt(Math.min(Math.max(t, 0), 1));
    tangent.y = 0;
    tangent.normalize();
    return tangent;
}

// ============ VÁRIOS PEÕES NA MESMA CASA ============
// getTilePosition() continua sendo "onde fica o CENTRO da casa" (usado por
// tiles, câmera, etc. — não mexemos nisso). Essas funções aqui só resolvem
// ONDE DENTRO da casa cada peão fica quando há mais de um ali, pra eles
// pararem de se sobrepor. Até 4 peões por casa (o máximo de jogadores do jogo).
const TILE_OCCUPANCY_LAYOUTS = {
    1: [{ x: 0, z: 0 }],
    2: [
        { x: -0.17, z: 0 },
        { x: 0.17, z: 0 },
    ],
    3: [
        { x: 0, z: -0.16 },
        { x: -0.17, z: 0.12 },
        { x: 0.17, z: 0.12 },
    ],
    4: [
        { x: -0.17, z: -0.17 },
        { x: 0.17, z: -0.17 },
        { x: -0.17, z: 0.17 },
        { x: 0.17, z: 0.17 },
    ],
};

function getPawnsOnTile(tileIndex, excludePlayerIndex) {
    if (!gameState) return [];
    const result = [];
    gameState.players.forEach((p, idx) => {
        if (idx === excludePlayerIndex) return;
        if (p.position === tileIndex) result.push(idx);
    });
    return result;
}

// Posição (dentro da casa) que o peão de playerIndex deve ocupar, considerando
// quantos outros jogadores já estão na mesma casa. A ordem é estável (por
// índice de jogador), então o mesmo jogador tende a ficar no mesmo "canto"
// enquanto a ocupação da casa não mudar.
function getTileSlotOffset(tileIndex, playerIndex) {
    const occupants = getPawnsOnTile(tileIndex, playerIndex)
        .concat([playerIndex])
        .sort((a, b) => a - b);
    const slotIndex = occupants.indexOf(playerIndex);
    const total = Math.min(occupants.length, 4);
    const layout = TILE_OCCUPANCY_LAYOUTS[total] || TILE_OCCUPANCY_LAYOUTS[4];
    return layout[Math.min(slotIndex, layout.length - 1)];
}

// getTilePosition() + o ajuste de posição dentro da casa. É isso que
// hopPawnToTile/createPawns/syncPawnPositions usam pra posicionar peões —
// getTilePosition() em si continua "puro" (centro da casa, sem saber de peões).
function getPawnTilePosition(tileIndex, playerIndex) {
    const pos = getTilePosition(tileIndex);
    if (playerIndex === undefined || playerIndex === null) return pos;
    const offset = getTileSlotOffset(tileIndex, playerIndex);
    pos.x += offset.x;
    pos.z += offset.z;
    return pos;
}

// Reacomoda suavemente (sem pular) os OUTROS peões que já estavam na casa
// quando a ocupação dela muda — por exemplo, se só havia 1 peão (centro) e um
// segundo chega, os dois precisam deslizar pras posições lado-a-lado.
function refreshTileOccupants(tileIndex, excludePlayerIndex) {
    if (!gameState) return;
    gameState.players.forEach((p, idx) => {
        if (idx === excludePlayerIndex || p.position !== tileIndex) return;
        const pawn = pawns[idx];
        if (!pawn) return;
        const target = getPawnTilePosition(tileIndex, idx);
        target.y += 0.3;
        gsap.to(pawn.position, { x: target.x, y: target.y, z: target.z, duration: 0.35, ease: 'power2.out' });
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Casas "normais" (pergunta simples) são a maioria do tabuleiro — em vez de
// deixar todas na mesma cor parda de TILE_TYPES.normal, alternam por uma
// paleta vívida (a mesma energia visual das casas especiais), cíclica por
// índice. É só uma variação de cor por instância — type/label/descrição
// continuam vindo de TILE_TYPES.normal sem mudança nenhuma, e a intensidade
// emissiva/anel continuam discretos (ver isSpecial abaixo), então não fica
// parecendo casa especial por engano nem atrapalha a leitura do número.
const NORMAL_TILE_PALETTE = [0x40c4ff, 0xff80ab, 0xb388ff, 0xffd740, 0x69f0ae, 0xff9e40];

function createTiles() {
    while (tilesGroup.children.length) tilesGroup.remove(tilesGroup.children[0]);
    tileMeshes = [];

    const specialIndices = [];
    const step = Math.max(3, Math.floor(boardLength / 8));
    for (let i = step; i < boardLength - 1; i += step) {
        if (Math.random() < 0.65) specialIndices.push(i);
    }

    // O(s) banco(s) de perguntas selecionado(s) podem restringir quais tipos
    // de casa especial entram no tabuleiro (ver questions.js/getActiveEfeitosCasasAtivos).
    let availableTypeIds = SPECIAL_TILE_TYPE_IDS;
    const activeEffects = getActiveEfeitosCasasAtivos();
    if (Array.isArray(activeEffects) && activeEffects.length) {
        const filtered = SPECIAL_TILE_TYPE_IDS.filter((id) => activeEffects.includes(id));
        if (filtered.length) availableTypeIds = filtered;
    }

    for (let i = 0; i < boardLength; i++) {
        const pos = getTilePosition(i);
        const isStart = i === 0;
        const isFinish = i === boardLength - 1;
        const isSpecial = !isStart && !isFinish && specialIndices.includes(i);

        let typeId = 'normal';
        if (isStart) typeId = 'start';
        else if (isFinish) typeId = 'finish';
        else if (isSpecial) typeId = availableTypeIds[Math.floor(Math.random() * availableTypeIds.length)];
        let tileType = getTileType(typeId);
        if (typeId === 'normal') {
            tileType = Object.assign({}, tileType, { color: NORMAL_TILE_PALETTE[i % NORMAL_TILE_PALETTE.length] });
        }

        // Casa quase rente ao chão — uma marcação circular na areia, não um
        // bloco/pedestal elevado. O peão deve parecer andar SOBRE o terreno,
        // com as casas como sinalização do caminho, não obstáculos 3D.
        const shellGeo = new THREE.CylinderGeometry(0.62, 0.72, 0.05, 16);
        const shellMat = new THREE.MeshStandardMaterial({
            color: tileType.color,
            roughness: 0.45,
            metalness: 0.15,
            emissive: tileType.color,
            emissiveIntensity: isSpecial || isStart || isFinish ? 0.35 : 0.08,
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.copy(pos);
        shell.position.y += 0.015;
        shell.castShadow = false; // achatada — sombra própria só poluiria a leitura do chão
        shell.receiveShadow = true;
        shell.userData = { index: i, effect: tileType, isSpecial: isSpecial || isStart || isFinish };
        tilesGroup.add(shell);

        // Alvo de clique/toque BEM maior que o disco visual (invisível) —
        // resolve casas difíceis de acertar (sobretudo no celular) sem mudar
        // o tamanho visual do tabuleiro. userData.visualMesh aponta pro disco
        // de verdade, pra dar feedback (brilho/escala) nele quando tocado.
        // tileMeshes[i] passa a ser ESTE alvo (não mais o shell), mas
        // continua alinhado 1:1 com o índice da casa, então o resto do
        // código que lê tileMeshes[tileIndex] (ver state.js/handleLanding)
        // não muda nada.
        const hitGeo = new THREE.CylinderGeometry(1.0, 1.05, 0.05, 16);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitTarget = new THREE.Mesh(hitGeo, hitMat);
        hitTarget.position.copy(shell.position);
        hitTarget.userData = {
            index: i,
            effect: tileType,
            isSpecial: isSpecial || isStart || isFinish,
            visualMesh: shell,
        };
        tilesGroup.add(hitTarget);
        tileMeshes.push(hitTarget);

        // Número/símbolo da casa: sprite (sempre de frente pra câmera, não
        // importa o ângulo) flutuando logo acima — legível de qualquer lugar,
        // sem virar um bloco gigante no meio do tabuleiro.
        const labelTexture = createTileLabel(i + 1, tileType);
        const labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false });
        const labelSprite = new THREE.Sprite(labelMat);
        labelSprite.position.copy(pos);
        labelSprite.position.y += 0.55;
        labelSprite.scale.set(0.6, 0.6, 1);
        tilesGroup.add(labelSprite);

        // Anel decorativo, achatado contra o chão — casas especiais ganham o
        // anel na cor do próprio tipo (mais identidade visual e leitura
        // rápida de "essa casa é diferente"); casas normais ficam num dourado
        // neutro, discreto, só marcando o contorno.
        const ringColor = isSpecial || isStart || isFinish ? tileType.color : 0xffd740;
        const ringGeo = new THREE.TorusGeometry(0.58, isSpecial || isStart || isFinish ? 0.05 : 0.035, 8, 20);
        const ringMat = new THREE.MeshStandardMaterial({
            color: ringColor,
            roughness: 0.3,
            metalness: 0.6,
            emissive: ringColor,
            emissiveIntensity: isSpecial || isStart || isFinish ? 0.45 : 0.2,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.position.y += 0.02;
        ring.rotation.x = -Math.PI / 2;
        ring.scale.set(0.85, 0.85, 0.85);
        tilesGroup.add(ring);
    }
}

function createTileLabel(number, tileType) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Fundo
    ctx.fillStyle = '#' + tileType.color.toString(16).padStart(6, '0');
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Número
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 50px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 64, 60);

    // Símbolo do tipo de casa (vem de TILE_TYPES — sem switch/if repetido)
    if (tileType.symbol) {
        ctx.font = '32px sans-serif';
        ctx.fillText(tileType.symbol, 64, 100);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

// (a montagem do modelo visual dos peões mora em js/pawnBuilders.js —
// createCharacterPawn() continua chamável daqui como sempre, só que agora
// isolada num sistema próprio; ver comentário lá pra trocar o modelo futuramente)

function createPawns() {
    while (pawnsGroup.children.length) pawnsGroup.remove(pawnsGroup.children[0]);
    pawns = [];
    if (!gameState) return;
    const totalPlayers = gameState.players.length;
    for (let i = 0; i < totalPlayers; i++) {
        const colorIdx = selectedColors[i] !== undefined ? selectedColors[i] : i;
        const colorHex = PLAYER_COLORS[colorIdx].hex;
        const pawn = createCharacterPawn(colorHex, i);
        const startPos = getPawnTilePosition(0, i); // todos começam na casa 0 — já nasce na posição certa dentro dela
        pawn.position.copy(startPos);
        pawn.position.y += 0.2;
        pawn.visible = true;
        pawnsGroup.add(pawn);
        pawns.push(pawn);
        gameState.players[i].pawnIndex = i;
    }
    activePawnToFollow = gameState.currentPlayerIndex;
    setCameraFocus(gameState.currentPlayerIndex);
}

function updatePawnPosition(pawnIndex, tileIndex, animate = true, callback = null) {
    if (pawnIndex >= pawns.length || !pawns[pawnIndex]) return;
    const pawn = pawns[pawnIndex];
    const targetPos = getPawnTilePosition(tileIndex, pawnIndex);
    targetPos.y += 0.3;
    if (!animate) {
        pawn.position.copy(targetPos);
        refreshTileOccupants(tileIndex, pawnIndex);
        if (callback) callback();
        return;
    }
    const startPos = pawn.position.clone();
    const duration = 0.7;
    const steps = 10;
    const timeline = gsap.timeline({
        onComplete: () => {
            refreshTileOccupants(tileIndex, pawnIndex);
            if (callback) callback();
        },
    });
    for (let s = 0; s <= steps; s++) {
        const progress = s / steps;
        const x = startPos.x + (targetPos.x - startPos.x) * progress;
        const z = startPos.z + (targetPos.z - startPos.z) * progress;
        const baseY = startPos.y + (targetPos.y - startPos.y) * progress;
        const hopHeight = Math.sin(progress * Math.PI) * 0.6;
        const y = baseY + hopHeight;
        timeline.to(
            pawn.position,
            {
                x,
                y,
                z,
                duration: duration / steps,
                ease: 'none',
                onStart: () => {
                    if (s > 0) {
                        playStepSound();
                        spawnDustParticles(pawn.position.clone());
                    }
                },
            },
            s * (duration / steps)
        );
    }
    timeline.to(pawn.position, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 0.05, ease: 'none' });
}

// Um único pulinho, de uma casa pra casa VIZINHA (usado em sequência por
// movePlayerAlongPath) — é isso que faz o peão parecer estar avançando
// casa por casa, em vez de ser arrastado direto até a casa final.
function hopPawnToTile(pawnIndex, tileIndex) {
    return new Promise((resolve) => {
        const pawn = pawns[pawnIndex];
        if (!pawn) {
            resolve();
            return;
        }
        // getPawnTilePosition (não getTilePosition puro) — se a casa de chegada
        // já tiver outro peão, este já pousa na posição certa dentro dela.
        const targetPos = getPawnTilePosition(tileIndex, pawnIndex);
        targetPos.y += 0.3;
        const startPos = pawn.position.clone();
        const hopDuration = TIMING.hopDurationMs / 1000;
        const state = { p: 0 };
        gsap.to(state, {
            p: 1,
            duration: hopDuration,
            ease: 'power1.inOut',
            onUpdate: () => {
                const p = state.p;
                pawn.position.x = startPos.x + (targetPos.x - startPos.x) * p;
                pawn.position.z = startPos.z + (targetPos.z - startPos.z) * p;
                pawn.position.y = startPos.y + (targetPos.y - startPos.y) * p + Math.sin(p * Math.PI) * 0.32;
            },
            onComplete: () => {
                pawn.position.copy(targetPos);
                playStepSound();
                hapticFeedback('step');
                spawnDustParticles(pawn.position.clone());
                refreshTileOccupants(tileIndex, pawnIndex); // acomoda quem já estava na casa
                resolve();
            },
        });
    });
}

// Anda casa por casa de fromTile até toTile (pra frente ou pra trás,
// dependendo de qual é maior) — cada casa intermediária recebe seu próprio
// pulinho, som de passo e poeira, com uma pequena pausa entre pousar e o
// próximo pulo (TIMING.hopPauseMs), em vez de um arraste contínuo até o final.
async function movePlayerAlongPath(pawnIndex, fromTile, toTile, onComplete) {
    if (fromTile === toTile) {
        refreshTileOccupants(toTile, pawnIndex);
        if (onComplete) onComplete();
        return;
    }
    const step = toTile > fromTile ? 1 : -1;
    let first = true;
    for (let t = fromTile + step; step > 0 ? t <= toTile : t >= toTile; t += step) {
        if (!first) await delay(TIMING.hopPauseMs);
        first = false;
        await hopPawnToTile(pawnIndex, t);
    }
    if (onComplete) onComplete();
}

// ============ DADO 3D ============
function createDice() {
    while (diceGroup.children.length) diceGroup.remove(diceGroup.children[0]);

    const diceSize = 1.2;
    const geo = new THREE.BoxGeometry(diceSize, diceSize, diceSize);

    // Uma textura por NÚMERO (não por índice de face) — e as materials do
    // BoxGeometry são montadas a partir de DICE_MATERIAL_FACE_ORDER
    // (js/data/diceFaces.js), que é a mesma referência usada por
    // getDiceTargetRotation() pra calcular a rotação. As duas coisas não têm
    // como ficar dessincronizadas porque vêm da mesma fonte de dados.
    const textureByNumber = {};
    for (let n = 1; n <= 6; n++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        // Fundo branco com borda
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#FFD740';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 108, 108);
        // Pontos
        ctx.fillStyle = '#001A33';
        getDiceDotPattern(n).forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.arc(24 + dx * 40, 24 + dy * 40, 13, 0, Math.PI * 2);
            ctx.fill();
        });
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        textureByNumber[n] = texture;
    }

    const materials = DICE_MATERIAL_FACE_ORDER.map(
        (n) => new THREE.MeshStandardMaterial({ map: textureByNumber[n], roughness: 0.3, metalness: 0.1 })
    );

    diceMesh = new THREE.Mesh(geo, materials);
    diceMesh.castShadow = true;
    diceMesh.receiveShadow = true;
    diceMesh.position.set(0, 3, -2);
    diceMesh.rotation.set(Math.PI / 4, Math.PI / 4, 0);
    diceGroup.add(diceMesh);

    // Base do dado
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.2, 12);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0xffd740,
        roughness: 0.4,
        metalness: 0.3,
        emissive: 0xffd740,
        emissiveIntensity: 0.2,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.75;
    base.castShadow = true;
    base.receiveShadow = true;
    diceGroup.add(base);

    // Anel de luz
    const ringGeo = new THREE.TorusGeometry(1.2, 0.06, 8, 20);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.73;
    ring.rotation.x = -Math.PI / 2;
    diceGroup.add(ring);

    // O dado só aparece na hora de rolar (ver showDiceRoll); fora disso fica escondido.
    diceGroup.visible = false;
    diceGroup.scale.set(0.01, 0.01, 0.01);
}

// Faz o dado aparecer, girar até mostrar "result" e, depois de um tempo, sumir de novo.
function showDiceRoll(result) {
    if (!diceGroup || !diceMesh) return;
    if (diceRollHideTimeout) clearTimeout(diceRollHideTimeout);

    diceGroup.visible = true;
    gsap.killTweensOf(diceGroup.scale);
    gsap.to(diceGroup.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'back.out(2)' });

    const targetRot = getDiceTargetRotation(result);
    const duration = TIMING.diceSpinMs / 1000;
    gsap.to(diceMesh.rotation, {
        x: targetRot.x,
        y: targetRot.y,
        z: targetRot.z,
        duration: duration,
        ease: 'power3.out',
    });
    // Vários saltinhos (não um único arco lento) — o dado continua "vivo" e
    // visivelmente rolando do início ao fim do giro, mesmo sendo mais longo agora.
    const bouncePeriod = 0.32;
    const bounceRepeats = Math.max(1, Math.round(duration / bouncePeriod) - 1);
    gsap.to(diceMesh.position, {
        y: diceMesh.position.y + 0.55,
        duration: bouncePeriod,
        yoyo: true,
        repeat: bounceRepeats,
        ease: 'power1.inOut',
    });

    // Fica visível mostrando o número sorteado por mais tempo, depois some.
    diceRollHideTimeout = setTimeout(() => {
        gsap.to(diceGroup.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 0.3,
            ease: 'power1.in',
            onComplete: () => {
                diceGroup.visible = false;
            },
        });
    }, TIMING.diceSpinMs + TIMING.diceResultHoldMs);
}

// Calcula a rotação final do dado de forma estrutural: pega a normal local
// da face que carrega o número sorteado (DICE_FACE_NORMALS) e resolve, via
// quaternion, a rotação exata que leva essa normal a apontar pra +Y (cima).
// Isso substitui uma tabela de ângulos escritos à mão que tinha 3 dos 6
// resultados errados (a raiz do bug: nada garantia que "rotação X" e "face
// que fica pra cima" descrevessem a mesma coisa — eram só números soltos).
// Voltas extras (múltiplos de 2π) são somadas só pro dado girar visualmente
// antes de parar; não mudam a orientação final.
function getDiceTargetRotation(result) {
    const n = DICE_FACE_NORMALS[result] ? result : 1;
    const faceNormal = new THREE.Vector3(DICE_FACE_NORMALS[n].x, DICE_FACE_NORMALS[n].y, DICE_FACE_NORMALS[n].z);
    const worldUp = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(faceNormal, worldUp);
    const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    // As voltas extras (múltiplos de 2π) só existem pro dado girar visualmente
    // antes de parar — não mudam a orientação final (2π ≡ nenhuma rotação).
    // Mais voltas = giro mais vivo durante TIMING.diceSpinMs, sem alterar o
    // resultado.
    return {
        x: euler.x + Math.PI * 2 * 4,
        y: euler.y + Math.PI * 2 * 5,
        z: euler.z + Math.PI * 2 * 3,
    };
}
