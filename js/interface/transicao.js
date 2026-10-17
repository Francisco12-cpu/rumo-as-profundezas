// ============================================================
// TRANSIÇÃO DE BOLHAS E TELA DE CARREGAMENTO
// ============================================================
// Troca de tela com uma parede de bolhas subindo (como as transições do
// desenho): as bolhas sobem e cobrem a tela, a troca acontece por trás delas,
// e elas continuam subindo e revelam a tela nova.
// A partida nova é montada por trás da tela de carregamento, em etapas, com
// uma pausa de um quadro entre elas — assim a barra de progresso anda e o
// navegador não parece travado (antes a tela congelava alguns segundos).

let transitionBusy = false;

// O setTimeout de reserva: aba em segundo plano não desenha quadros (o
// requestAnimationFrame nunca vem) e o carregamento ficaria parado.
function nextFrame() {
    return new Promise((r) => {
        let done = false;
        const go = () => {
            if (done) return;
            done = true;
            setTimeout(r, 0);
        };
        requestAnimationFrame(go);
        setTimeout(go, 150);
    });
}

function getTransitionLayer() {
    let layer = document.getElementById('bubble-transition');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'bubble-transition';
    layer.className = 'bubble-transition';
    layer.setAttribute('aria-hidden', 'true');
    // Bolhas de vários tamanhos; posição e atraso sorteados uma vez.
    const n = window.innerWidth < 700 ? 34 : 54;
    let html = '<div class="bt-water"></div>';
    for (let i = 0; i < n; i++) {
        const size = 40 + Math.random() * (window.innerWidth < 700 ? 110 : 170);
        const left = Math.random() * 100;
        const delay = Math.random() * 0.35;
        const wobble = (Math.random() - 0.5) * 60;
        html += `<span class="bt-bubble" style="--s:${size}px;--x:${left}%;--d:${delay}s;--w:${wobble}px"></span>`;
    }
    layer.innerHTML = html;
    document.body.appendChild(layer);
    return layer;
}

// Toca a transição. onCovered roda quando a tela está toda coberta (pode ser
// async: as bolhas esperam ela terminar antes de revelar a tela nova).
async function bubbleTransition(onCovered) {
    if (transitionBusy) {
        if (onCovered) await onCovered();
        return;
    }
    transitionBusy = true;
    const layer = getTransitionLayer();
    layer.classList.remove('saindo');
    void layer.offsetWidth;
    layer.classList.add('cobrindo');
    playBubbleTransitionSound();
    await new Promise((r) => setTimeout(r, TIMING.transitionCoverMs));
    try {
        if (onCovered) await onCovered();
    } finally {
        layer.classList.add('saindo');
        await new Promise((r) => setTimeout(r, TIMING.transitionRevealMs));
        layer.classList.remove('cobrindo', 'saindo');
        transitionBusy = false;
    }
}

// Durante a tela de carregamento as bolhas saem (mostrando o carregamento) e
// voltam a cobrir no fim, pra revelar a partida já montada.
async function bubbleTransitionReveal() {
    const layer = getTransitionLayer();
    layer.classList.add('saindo');
    await new Promise((r) => setTimeout(r, TIMING.transitionRevealMs));
    layer.classList.remove('cobrindo', 'saindo');
}

async function bubbleTransitionCover() {
    const layer = getTransitionLayer();
    layer.classList.remove('saindo');
    void layer.offsetWidth;
    layer.classList.add('cobrindo');
    playBubbleTransitionSound();
    await new Promise((r) => setTimeout(r, TIMING.transitionCoverMs));
}

// ---------- Tela de carregamento ----------
const LOADING_TIPS = [
    'Toque numa casa para ver o que ela faz.',
    'A cada 3 moedas você ganha uma bolha protetora!',
    'Na Corrente Rápida, acertar leva você 3 casas para frente.',
    'Cuidado com o Redemoinho: se errar, troca de lugar!',
    'Toque em Voar para passear pelo fundo do mar.',
    'O baú do tesouro está na última casa.',
];

function showLoadingScreen(show) {
    const el = document.getElementById('loading-screen');
    if (!el) return;
    if (show) {
        document.getElementById('loading-tip').textContent =
            LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
        setLoadingProgress(0, 'Mergulhando...');
    }
    el.classList.toggle('hidden', !show);
}

function setLoadingProgress(fraction, label) {
    const bar = document.getElementById('loading-bar-fill');
    if (bar) bar.style.width = Math.round(fraction * 100) + '%';
    const txt = document.getElementById('loading-step');
    if (txt && label) txt.textContent = label;
}

// Monta o mundo da partida em etapas (mesma ordem de sempre).
async function buildMatchWorld(resume) {
    const steps = [
        [
            'Enchendo o mar de água...',
            () => {
                removeMenuShowcase();
                createOceanEnvironment();
            },
        ],
        ['Desenhando o caminho na areia...', () => createBoardCurve()],
        ['Colocando as casas...', () => createTiles()],
        ['Plantando algas e corais...', () => createSeaScenery()],
        [
            'Chamando os personagens...',
            () => {
                createPawns();
                if (resume) syncPawnPositions();
                createDice();
            },
        ],
        [
            'Acendendo as luzes...',
            () => {
                // Prepara os shaders de tudo agora (senão o 1º quadro do jogo trava).
                if (renderer.compile) renderer.compile(scene, camera);
            },
        ],
    ];
    for (let i = 0; i < steps.length; i++) {
        setLoadingProgress(i / steps.length, steps[i][0]);
        await nextFrame();
        steps[i][1]();
    }
    setLoadingProgress(1, 'Pronto!');
    await nextFrame();
}
