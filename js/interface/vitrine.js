// ============================================================
// ABERTURA E VITRINE DO MENU
// ============================================================
// 1. Tela de abertura: logo (esponja-do-mar original, sem rosto), o nome do
//    jogo e "Toque para continuar"; ao tocar, um "mergulho" leva ao menu.
//    O toque também libera o áudio do navegador (precisa de um gesto).
// 2. Vitrine: atrás do menu, uma mini cena animada do fundo do mar — algas,
//    corais, peixes, luz ondulando e alguns personagens do jogo — no estilo
//    da cena de vitrine do arquivo de modelos. Some quando a partida começa.

let menuShowcase = null;

// ---------- Tela de abertura ----------
function initSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    const title = document.getElementById('splash-title');
    if (title) title.textContent = GAME_NAME;
    const go = () => {
        if (splash.classList.contains('mergulhando')) return;
        initAudio();
        playSplashDiveSound();
        splash.classList.add('mergulhando');
        startMenuMusic();
        setTimeout(() => {
            splash.classList.add('hidden');
            splash.remove();
        }, 1300);
    };
    splash.addEventListener('click', go);
    splash.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') go();
    });
    splash.focus();
}

// ---------- Vitrine do menu ----------
function createMenuShowcase() {
    removeMenuShowcase();
    boardLength = 20; // só pra área do chão ficar coerente (sem tabuleiro na vitrine)
    createOceanEnvironment();
    boardGroup.visible = false;
    const group = new THREE.Group();
    environmentGroup.add(group);
    const models = [];
    const kit = hasSeaKit();
    // Pedra-palco onde os personagens ficam.
    const stageGeo = new THREE.CylinderGeometry(2.4, 2.9, 0.5, 14);
    const sp = stageGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
        const k = 1 + Math.sin(sp.getX(i) * 3 + sp.getZ(i) * 2) * 0.05;
        sp.setXYZ(i, sp.getX(i) * k, sp.getY(i), sp.getZ(i) * k);
    }
    stageGeo.computeVertexNormals();
    const stage = new THREE.Mesh(
        stageGeo,
        new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x5f7480).convertSRGBToLinear(),
            roughness: 0.95,
            flatShading: true,
        })
    );
    stage.position.set(0, getSeabedHeight(0, 0) + 0.1, 0);
    stage.receiveShadow = stage.castShadow = true;
    group.add(stage);
    const stageTop = stage.position.y + 0.25;

    if (kit) {
        const put = (id, opts, scale, x, z, rot) => {
            const m = makeSeaModel(
                id,
                Object.assign({ qualidade: isLowPowerDevice ? 'baixa' : 'alta' }, opts || {}),
                scale,
                true
            );
            m.objeto.position.set(x, getSeabedHeight(x, z) - 0.04, z);
            m.objeto.rotation.y = rot !== undefined ? rot : Math.random() * 6.28;
            group.add(m.objeto);
            models.push(m);
            return m;
        };
        // Moldura de algas, corais e anêmonas em volta do palco.
        [
            ['algaGigante', { altura: 4.2, seed: 3 }, 1, -4.2, -2.2],
            ['algaGigante', { altura: 3.4, seed: 9 }, 1, 4.5, -2.8],
            ['alga', { altura: 2 }, 1.3, -3.2, 0.6],
            ['alga', { altura: 1.6 }, 1.3, 3.4, 0.9],
            ['alga', { altura: 2.4 }, 1.2, 1.6, -3.4],
            ['coral', { cor: 'rosa' }, 1.6, -2.6, -2.6],
            ['coral', { cor: 'laranja' }, 1.4, 2.8, -1.7],
            ['coral', { cor: 'roxo' }, 1.2, -1.2, -3.6],
            ['coral', { cor: 'azul' }, 1.3, 3.9, 2.4],
            ['anemona', { cor: 'amarelo' }, 1.1, -3.6, 2.2],
            ['anemona', { cor: 'rosa' }, 1, 2.1, 2.9],
            ['pedras', null, 1.4, -4.8, 0.2],
            ['concha', null, 1.1, -1.9, 3.1],
            ['bau', null, 1.3, 5.6, -0.6, -0.8],
            ['fonte', null, 2.2, -6.4, -4.2],
            ['navio', null, 3.2, 3.5, -10.5, 0.6],
        ].forEach(([id, opts, s, x, z, rot]) => put(id, opts, s, x, z, rot));
        // Peixes nadando em volta.
        const variants = ['coral', 'lima', 'lilas', 'azul', 'sol', 'rosa'];
        for (let i = 0; i < (isLowPowerDevice ? 6 : 10); i++) {
            const m = makeSeaModel(
                'peixe',
                { variante: variants[i % variants.length], qualidade: 'baixa' },
                0.9 + Math.random() * 0.3,
                true
            );
            group.add(m.objeto);
            models.push(m);
            m.fish = {
                r: 3.5 + (i % 4) * 0.9,
                h: 1.8 + (i % 3) * 0.7,
                v: (i % 2 ? 1 : -1) * (0.25 + (i % 3) * 0.06),
                ph: i * 0.8,
            };
        }
        const jelly = makeSeaModel('aguaViva', { cor: 'rosa' }, 1.1, true);
        group.add(jelly.objeto);
        models.push(jelly);
        jelly.jelly = true;
    }
    // Personagens do jogo, de frente pra câmera, respirando e piscando.
    const cast = ['bob', 'polvo', 'patrick', 'estrela'];
    const colors = [0xffd740, 0x40c4ff, 0xff80ab, 0x69f0ae];
    pawns = [];
    while (pawnsGroup.children.length) pawnsGroup.remove(pawnsGroup.children[0]);
    cast.forEach((key, i) => {
        const p = createCharacterPawn(colors[i], i, key);
        linearizeModelColors(p);
        const a = (i - 1.5) * 0.55;
        p.position.set(Math.sin(a) * 1.45, stageTop, Math.cos(a) * 1.45 - 0.6);
        p.scale.setScalar(1.15);
        pawnsGroup.add(p);
        pawns.push(p);
    });
    menuShowcase = { group, models, t0: 0 };
    controls.enabled = false;
    cameraMode = 'menu';
}

function removeMenuShowcase() {
    if (!menuShowcase) return;
    stopAnimatingSeaModels(menuShowcase.models);
    menuShowcase.models.forEach((m) => m.descartar());
    menuShowcase = null;
    controls.enabled = true;
    boardGroup.visible = true;
    while (pawnsGroup.children.length) pawnsGroup.remove(pawnsGroup.children[0]);
    pawns = [];
}

// Chamada todo frame por animate() (main.js).
function updateMenuShowcase(elapsed) {
    if (!menuShowcase || cameraMode !== 'menu') return;
    menuShowcase.models.forEach((m) => {
        if (m.fish) {
            const f = m.fish;
            const a = elapsed * f.v + f.ph;
            m.objeto.position.set(Math.cos(a) * f.r, f.h + Math.sin(elapsed + f.ph) * 0.25, Math.sin(a) * f.r - 0.5);
            m.objeto.rotation.y = f.v > 0 ? -a : -a + Math.PI;
        } else if (m.jelly) {
            m.objeto.position.set(-2.8 + Math.sin(elapsed * 0.2) * 0.8, 2.2 + Math.sin(elapsed * 0.5) * 0.4, -1.8);
        }
    });
    // Câmera balançando devagar em volta do palco. No computador o palco fica
    // à direita (o menu ocupa a esquerda); no celular, em cima.
    const portrait = camera.aspect < 1;
    const swing = Math.sin(elapsed * 0.12) * 0.35;
    const dist = portrait ? 11.5 : 8.6;
    const tx = portrait ? 0 : -2.4;
    const ty = portrait ? -0.6 : 1.3;
    camera.position.set(tx + Math.sin(swing) * dist, 3.4 + Math.sin(elapsed * 0.2) * 0.3, Math.cos(swing) * dist);
    controls.target.set(tx, ty, -0.3);
    camera.lookAt(controls.target);
}
