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
    startAmbientSound();
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
        el.textContent = masterVolume > 0 ? '🔊' : '🔇';
    });
}

function startAmbientSound() {
    if (!audioCtx || ambientOscillators.length > 0) return;
    // Som ambiente de oceano (frequência baixa) — 2 drones fixos como base...
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start();
    ambientOscillators.push(osc);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 82;
    gain2.gain.value = 0.02;
    osc2.connect(gain2);
    gain2.connect(musicGain);
    osc2.start();
    ambientOscillators.push(osc2);

    // ...mas com um "respirar" lento de volume (LFO manual)...
    let breathPhase = 0;
    ambientLFOInterval = setInterval(() => {
        if (!audioCtx) return;
        breathPhase += 0.05;
        const swell = 0.7 + 0.3 * Math.sin(breathPhase);
        gain.gain.setTargetAtTime(0.03 * swell, audioCtx.currentTime, 0.3);
        gain2.gain.setTargetAtTime(0.02 * swell, audioCtx.currentTime, 0.3);
    }, 400);

    // ...e sininhos esparsos e aleatórios tipo bolha distante (parte da
    // "música" ambiente, por isso vão no barramento de música, não efeitos).
    const pentatonic = [392, 440, 494, 587, 659, 784]; // sol, lá, si, ré, mi, sol (agudo)
    ambientChimeInterval = setInterval(
        () => {
            if (Math.random() < 0.5) return;
            const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
            playTone(note, 1.4, 'sine', 0.035, musicGain);
        },
        5000 + Math.random() * 4000
    );
}

function stopAmbientSound() {
    if (ambientOscillators.length > 0) {
        ambientOscillators.forEach((osc) => {
            try {
                osc.stop();
            } catch (e) {}
        });
        ambientOscillators = [];
    }
    if (ambientLFOInterval) {
        clearInterval(ambientLFOInterval);
        ambientLFOInterval = null;
    }
    if (ambientChimeInterval) {
        clearInterval(ambientChimeInterval);
        ambientChimeInterval = null;
    }
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

function playVictorySound() {
    const notes = [523, 587, 659, 784, 880, 1047, 1319];
    notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.22, 'sine', 0.3), i * 110);
    });
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
