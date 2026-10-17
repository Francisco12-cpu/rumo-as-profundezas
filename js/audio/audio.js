// ============================================================
// ÁUDIO SINTETIZADO — 3 barramentos (master -> music/sfx -> destino)
// ============================================================
// A UI (ui.js) só chama setMasterVolume/setMusicVolume/setSfxVolume/
// toggleMute; o roteamento entre nós de ganho fica todo aqui dentro. Isso é
// o que permite trocar o sistema de áudio no futuro (outra síntese, samples
// gravados, etc.) sem mexer em UI nenhuma — só essas 4 funções são "a API
// pública" que o resto do jogo enxerga.
function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = masterVolume;
            masterGain.connect(audioCtx.destination);

            musicGain = audioCtx.createGain();
            musicGain.gain.value = musicVolume;
            musicGain.connect(masterGain);

            sfxGain = audioCtx.createGain();
            sfxGain.gain.value = sfxVolume;
            sfxGain.connect(masterGain);
        } catch (e) {
            console.warn('Web Audio API não suportada');
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    // A música (audio/musica.js) começa por startMenuMusic/startGameMusic.
}

function setMasterVolume(value) {
    masterVolume = Math.max(0, Math.min(1, value));
    if (masterGain) masterGain.gain.setTargetAtTime(masterVolume, audioCtx.currentTime, 0.05);
    try {
        localStorage.setItem('trivia3d_volume', String(masterVolume));
    } catch (e) {}
    updateVolumeUI();
}

function setMusicVolume(value) {
    musicVolume = Math.max(0, Math.min(1, value));
    if (musicGain) musicGain.gain.setTargetAtTime(musicVolume, audioCtx.currentTime, 0.05);
    try {
        localStorage.setItem('trivia3d_volume_music', String(musicVolume));
    } catch (e) {}
    updateVolumeUI();
}

function setSfxVolume(value) {
    sfxVolume = Math.max(0, Math.min(1, value));
    if (sfxGain) sfxGain.gain.setTargetAtTime(sfxVolume, audioCtx.currentTime, 0.05);
    try {
        localStorage.setItem('trivia3d_volume_sfx', String(sfxVolume));
    } catch (e) {}
    updateVolumeUI();
}

function toggleMute() {
    if (masterVolume > 0) {
        volumeBeforeMute = masterVolume;
        setMasterVolume(0);
    } else {
        setMasterVolume(volumeBeforeMute > 0 ? volumeBeforeMute : 0.8);
    }
}

// Mantém sliders/botão de mudo em sincronia em qualquer lugar da UI que os
// exiba (hoje só o modal de Configurações, mas não precisa ser só ali).
function updateVolumeUI() {
    document.querySelectorAll('.volume-slider-master').forEach((el) => (el.value = String(masterVolume)));
    document.querySelectorAll('.volume-slider-music').forEach((el) => (el.value = String(musicVolume)));
    document.querySelectorAll('.volume-slider-sfx').forEach((el) => (el.value = String(sfxVolume)));
    document.querySelectorAll('.btn-mute').forEach((el) => {
        el.innerHTML = iconSvg(masterVolume > 0 ? 'som' : 'mudo');
    });
}

// Trilhas (ver audio/musica.js): uma pro menu, outra pra partida.
function startMenuMusic() {
    setMusicMood('menu');
}

function startGameMusic() {
    setMusicMood('jogo');
}

// Nome antigo, mantido: quem chama quer "parar a trilha da partida".
function stopAmbientSound() {
    setMusicMood(null);
}

// bus: nó de destino (padrão sfxGain). Passe musicGain explicitamente pra
// sons que fazem parte da ambientação, não de feedback de gameplay.
function playTone(freq, duration, type = 'sine', volume = 0.3, bus = null) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(bus || sfxGain || audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playNoise(duration, volume = 0.15) {
    if (!audioCtx) return;
    try {
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        source.connect(gain);
        gain.connect(sfxGain || audioCtx.destination);
        source.start();
        source.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// Cada batida do dado na areia: "toc" abafado, mais fraco a cada quique.
function playDiceBounceSound(strength = 1) {
    playNoise(0.06, 0.12 * strength);
    playTone(180 + Math.random() * 60, 0.07, 'triangle', 0.16 * strength);
}

// Dado parou: acorde curto e brilhante.
function playDiceLandSound() {
    [784, 988, 1175].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 'sine', 0.12), i * 60));
}

function playDiceRollSound() {
    playNoise(0.3, 0.2);
    for (let i = 0; i < 8; i++) {
        setTimeout(() => playTone(600 + Math.random() * 500, 0.04, 'square', 0.08), i * 50);
    }
}

function playStepSound() {
    playTone(150, 0.06, 'sine', 0.15);
    playTone(100, 0.05, 'triangle', 0.1);
}

function playCorrectSound() {
    playTone(523, 0.12, 'sine', 0.25);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.25), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200);
    setTimeout(() => playTone(1047, 0.25, 'sine', 0.35), 350);
}

function playIncorrectSound() {
    playTone(350, 0.2, 'sawtooth', 0.2);
    setTimeout(() => playTone(250, 0.3, 'sawtooth', 0.2), 180);
    setTimeout(() => playTone(180, 0.35, 'sawtooth', 0.2), 380);
}

// Vitória: fanfarra curta (subida + acorde final longo) e bolhas.
function playVictorySound() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'triangle', 0.24), i * 120));
    setTimeout(() => [523, 659, 784, 1047].forEach((n) => playTone(n, 1.4, 'sine', 0.14)), notes.length * 120);
    setTimeout(() => playBubbleSound(), 300);
    setTimeout(() => playBubbleSound(), 900);
}

// Corrente/vulcão empurrando várias casas: "fuuush" de água subindo.
function playAdvanceSound() {
    playNoise(0.6, 0.1);
    [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.16, 'sine', 0.14), i * 80));
}

// Redemoinho trocando de lugar: tons girando (descendo e subindo).
function playSwapSound() {
    playNoise(0.5, 0.08);
    [880, 740, 622, 523, 622, 740, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.1, 'triangle', 0.12), i * 65));
}

// Vulcão: ronco grave curto, mais baixo quanto mais longe da câmera.
function playVolcanoSound(position) {
    if (!audioCtx || !camera) return;
    const d = position ? camera.position.distanceTo(position) : 20;
    const vol = Math.max(0, 0.22 - d * 0.006);
    if (vol <= 0.01) return;
    playNoise(1.2, vol);
    playTone(55, 0.9, 'sine', vol);
}

// Carta saindo do monte: "fuuu" curto subindo.
function playCardDrawSound() {
    playNoise(0.25, 0.06);
    playTone(320, 0.12, 'sine', 0.06);
    setTimeout(() => playTone(520, 0.12, 'sine', 0.06), 90);
}

// Carta virando: estalinho de papel.
function playCardFlipSound() {
    playNoise(0.05, 0.12);
    setTimeout(() => playNoise(0.04, 0.08), 70);
}

// Mergulho da tela de abertura: bolhas subindo + "uuush" descendo.
function playSplashDiveSound() {
    playNoise(0.8, 0.08);
    for (let i = 0; i < 7; i++)
        setTimeout(() => playTone(500 + i * 120 + Math.random() * 80, 0.06, 'sine', 0.07), i * 70);
}

// Transição: monte de bolhinhas subindo.
function playBubbleTransitionSound() {
    playNoise(0.5, 0.05);
    for (let i = 0; i < 10; i++) setTimeout(() => playTone(380 + Math.random() * 900, 0.05, 'sine', 0.06), i * 45);
}

// Moeda: dois "plins" agudos em sequência.
function playCoinSound() {
    playTone(1318, 0.09, 'triangle', 0.18);
    setTimeout(() => playTone(1760, 0.16, 'triangle', 0.16), 70);
}

function playBubbleSound() {
    playTone(800 + Math.random() * 400, 0.06, 'sine', 0.12);
    setTimeout(() => playTone(900 + Math.random() * 300, 0.05, 'sine', 0.1), 40);
}

function playClickSound() {
    playTone(700, 0.05, 'sine', 0.1);
}

// Toca quando uma pergunta aparece na tela (modal abre) — som curto de
// "atenção", diferente do clique de UI e do bubbleSound de chegada, pra dar
// mais um sinal (além do visual) de que é hora de responder.
function playQuestionSound() {
    playTone(660, 0.09, 'triangle', 0.18);
    setTimeout(() => playTone(880, 0.14, 'triangle', 0.2), 90);
}

function hapticFeedback(type) {
    try {
        if (navigator.vibrate) {
            if (type === 'roll') navigator.vibrate([40, 25, 40]);
            else if (type === 'correct') navigator.vibrate([25, 15, 25]);
            else if (type === 'incorrect') navigator.vibrate([70]);
            else if (type === 'step') navigator.vibrate(15);
            else if (type === 'victory') navigator.vibrate([80, 40, 80, 40, 80]);
        }
    } catch (e) {}
}
