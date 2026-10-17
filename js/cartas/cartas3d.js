// ============================================================
// CARTAS: MONTE 3D E A CARTA VOANDO ATÉ A TELA
// ============================================================
// As perguntas vêm em cartas, como num jogo de tabuleiro de verdade:
//   1. a carta de cima sai do monte (ao lado do tabuleiro) e voa até a
//      frente da câmera, girando — 3D, aqui;
//   2. ao chegar, troca pela carta da tela (HTML), que vira e mostra a
//      pergunta (ver showQuestionModal em cartas/questions.js);
//   3. depois da resposta a carta da tela brilha (certo/errado), sobe e some.
// O monte é refeito a cada partida (fica do lado da largada, pra fora do
// tabuleiro). Puro visual: não decide nada da pergunta.

const CARD_W = 0.62;
const CARD_D = 0.9;
const CARD_T = 0.022;
let cardDeck = null;
let cardBackTexture = null;

function getCardBackTexture() {
    if (cardBackTexture) return cardBackTexture;
    const w = 256;
    const h = 372;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0f4f86');
    g.addColorStop(1, '#062a4f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Moldura dourada dupla.
    ctx.strokeStyle = '#f4c24a';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    // Ondinhas de fundo.
    ctx.strokeStyle = 'rgba(127, 214, 255, 0.18)';
    ctx.lineWidth = 3;
    for (let y = 50; y < h - 40; y += 22) {
        ctx.beginPath();
        for (let x = 36; x <= w - 36; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.08) * 4);
        ctx.stroke();
    }
    // Emblema: pérola na concha, no meio.
    ctx.fillStyle = 'rgba(6, 30, 52, 0.85)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f4c24a';
    ctx.stroke();
    drawIcon(ctx, 'pergunta', w / 2, h / 2, 92, '#ffd84a', 3);
    cardBackTexture = new THREE.CanvasTexture(canvas);
    cardBackTexture.encoding = THREE.sRGBEncoding;
    return cardBackTexture;
}

function makeCardMesh() {
    const geo = new THREE.RoundedBoxGeometry(CARD_W, CARD_T, CARD_D, 2, 0.01);
    const back = new THREE.MeshStandardMaterial({ map: getCardBackTexture(), roughness: 0.5 });
    const edge = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xf4e3c0).convertSRGBToLinear(),
        roughness: 0.7,
    });
    // A textura (verso da carta) vai em cima e embaixo; as bordas, cor de papel.
    const mesh = new THREE.Mesh(geo, [edge, edge, back, back, edge, edge]);
    mesh.castShadow = true;
    return mesh;
}

function createCardDeck() {
    if (cardDeck && cardDeck.group.parent) cardDeck.group.parent.remove(cardDeck.group);
    const group = new THREE.Group();
    // Na frente do tabuleiro (lado da câmera), um pouco à esquerda do meio:
    // assim, na maioria das jogadas, dá pra ver a carta saindo do monte.
    const keep = getBoardKeepOut();
    const x = -4.2;
    const z = keep.z - 0.6;
    group.position.set(x, getSeabedHeight(x, z), z);
    group.rotation.y = 0.35;
    // Pedestal: pedra achatada.
    const rockGeo = new THREE.CylinderGeometry(0.75, 0.9, 0.28, 9);
    const rp = rockGeo.attributes.position;
    for (let i = 0; i < rp.count; i++) {
        const k = 1 + Math.sin(rp.getX(i) * 7 + rp.getZ(i) * 5) * 0.06;
        rp.setXYZ(i, rp.getX(i) * k, rp.getY(i), rp.getZ(i) * k);
    }
    rockGeo.computeVertexNormals();
    const rock = new THREE.Mesh(
        rockGeo,
        new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x6d7a84).convertSRGBToLinear(),
            roughness: 0.95,
            flatShading: true,
        })
    );
    rock.position.y = 0.12;
    rock.castShadow = rock.receiveShadow = true;
    group.add(rock);
    // Pilha de cartas (levemente desalinhadas, como um monte de verdade).
    const count = 10;
    for (let i = 0; i < count; i++) {
        const c = makeCardMesh();
        c.position.set((Math.random() - 0.5) * 0.03, 0.27 + i * (CARD_T + 0.002), (Math.random() - 0.5) * 0.03);
        c.rotation.y = (Math.random() - 0.5) * 0.08;
        group.add(c);
    }
    const top = makeCardMesh();
    const topRest = new THREE.Vector3(0, 0.27 + count * (CARD_T + 0.002), 0);
    top.position.copy(topRest);
    group.add(top);
    // Brilho suave em volta do monte (chama atenção na hora da pergunta).
    const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({
            map: getSoftDotTexture(),
            color: new THREE.Color(0xffe680).convertSRGBToLinear(),
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.3;
    group.add(glow);
    boardGroup.add(group);
    cardDeck = { group, top, topRest, glow, flying: false };
    return cardDeck;
}

// Lugar do monte (pra decoração não cair em cima dele).
function getCardDeckSpot() {
    return cardDeck ? { x: cardDeck.group.position.x, z: cardDeck.group.position.z } : null;
}

// Câmera chega perto do monte (de frente pra ele, um pouco de cima), pra
// carta sair do monte bem à vista. Em pé no celular, fica mais longe.
function focusCameraOnDeck() {
    const p = new THREE.Vector3();
    cardDeck.group.getWorldPosition(p);
    const k = camera.aspect < 1 ? 1.45 : 1;
    setCameraShot(
        { x: p.x + 0.9 * k, y: p.y + 2.3 * k, z: p.z + 3.3 * k },
        { x: p.x, y: p.y + 0.45, z: p.z },
        TIMING.deckFocusMs / 1000
    );
}

// Câmera vai até o monte, a carta de cima sobe devagar e voa até a frente da
// câmera. onArrive é chamado quando a carta chega (aí entra a carta da tela).
function playCardFromDeck(onArrive) {
    if (!cardDeck || cardDeck.flying) {
        if (onArrive) onArrive();
        return;
    }
    cardDeck.flying = true;
    cardDeck.highlight = true;
    focusCameraOnDeck();
    const top = cardDeck.top;
    // Enquanto a câmera chega, a carta de cima "solta" do monte: sobe um
    // pouquinho e treme, como quando a gente puxa uma carta.
    gsap.to(top.position, {
        y: cardDeck.topRest.y + 0.18,
        duration: TIMING.deckLiftMs / 1000,
        delay: Math.max(0, TIMING.deckFocusMs - TIMING.deckLiftMs) / 1000,
        ease: 'back.out(2)',
    });
    gsap.to(top.rotation, {
        z: 0.08,
        duration: 0.12,
        repeat: 3,
        yoyo: true,
        delay: Math.max(0, TIMING.deckFocusMs - TIMING.deckLiftMs) / 1000,
    });
    setTimeout(() => flyCardToCamera(onArrive), TIMING.deckFocusMs);
}

function flyCardToCamera(onArrive) {
    const top = cardDeck.top;
    cardDeck.highlight = false;
    gsap.killTweensOf(top.position);
    gsap.killTweensOf(top.rotation);
    playCardDrawSound();
    // A carta passa pro espaço do mundo (sai do grupo do monte).
    const start = new THREE.Vector3();
    top.getWorldPosition(start);
    const startQ = new THREE.Quaternion();
    top.getWorldQuaternion(startQ);
    cardDeck.group.remove(top);
    scene.add(top);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    // Se o monte está fora do quadro (atrás da câmera, por exemplo), a carta
    // sobe da parte de baixo da tela — senão o voo aconteceria sem ninguém ver.
    const ndc = start.clone().project(camera);
    if (ndc.z > 1 || Math.abs(ndc.x) > 0.95 || Math.abs(ndc.y) > 0.95) {
        const down = new THREE.Vector3(0, -1, 0).projectOnPlane(forward).normalize();
        start.copy(camera.position).addScaledVector(forward, 2.6).addScaledVector(down, 2.2);
    }
    top.position.copy(start);
    top.quaternion.copy(startQ);
    // Destino: na frente da câmera, de pé, com o verso virado pra ela.
    const end = camera.position.clone().addScaledVector(forward, 1.6);
    const look = new THREE.Matrix4().lookAt(end, camera.position, camera.up);
    const endQ = new THREE.Quaternion()
        .setFromRotationMatrix(look)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2))
        // Meia-volta no próprio plano: senão o "?" do verso chega de cabeça pra baixo.
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    const lift = start.clone();
    lift.y += 0.8;
    const state = { p: 0 };
    const tmp = new THREE.Vector3();
    gsap.to(state, {
        p: 1,
        duration: TIMING.cardFlightMs / 1000,
        ease: 'power2.inOut',
        onUpdate: () => {
            const p = state.p;
            // Curva: sobe do monte e desce em arco até a câmera.
            const a = lift.clone().lerp(end, p);
            tmp.copy(start).lerp(lift, Math.min(1, p * 3));
            top.position.lerpVectors(tmp, a, THREE.MathUtils.smoothstep(p, 0.15, 1));
            top.quaternion.slerpQuaternions(startQ, endQ, THREE.MathUtils.smoothstep(p, 0.1, 0.95));
            top.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.sin(p * Math.PI) * 0.8);
        },
        onComplete: () => {
            top.visible = false;
            // A carta já está na tela: a câmera volta pro personagem da vez
            // por trás dela (aparece quando a carta encolhe no resultado).
            if (gameState && cameraMode === 'shot') setCameraFocus(gameState.currentPlayerIndex);
            if (onArrive) onArrive();
        },
    });
}

// Devolve a carta ao monte (depois que a pergunta acabou).
function returnCardToDeck() {
    if (!cardDeck) return;
    const top = cardDeck.top;
    if (top.parent) top.parent.remove(top);
    cardDeck.group.add(top);
    gsap.killTweensOf(top.position);
    gsap.killTweensOf(top.rotation);
    top.position.copy(cardDeck.topRest);
    top.quaternion.set(0, 0, 0, 1);
    top.visible = true;
    cardDeck.flying = false;
}

// Chamada todo frame por animate() (main.js): o monte brilha de leve.
function updateCardDeck(elapsed) {
    if (!cardDeck) return;
    const base = cardDeck.highlight ? 0.55 : 0.18;
    cardDeck.glow.material.opacity = base + Math.sin(elapsed * (cardDeck.highlight ? 6 : 2)) * 0.08;
}
