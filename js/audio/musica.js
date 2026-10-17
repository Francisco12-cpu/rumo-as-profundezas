// ============================================================
// MÚSICA E AMBIENTE DO FUNDO DO MAR (Web Audio, 100% sintetizada)
// ============================================================
// A trilha é tocada nota a nota por um agendador (sempre ~0,4 s à frente do
// relógio do áudio), então ela nunca "emenda" um loop: não há corte. Cada
// música é uma sequência de PARTES (introdução, A, B, A', parte calma) que
// se repete a partir da A, e cada parte liga só alguns instrumentos — assim
// a trilha muda ao longo da partida em vez de repetir o mesmo trecho.
// Instrumentos (todos sintetizados aqui): marimba, acordes de fundo, baixo,
// guitarra havaiana (o deslizar de nota típico do desenho), ukulele, flauta
// e percussão leve (chocalho, bumbo macio, bloco de madeira).
//   'menu' — lenta e sonhadora;
//   'jogo' — mais animada, com um balanço leve.
// Por baixo das duas, o "mar": ruído filtrado com ondas lentas e bolhinhas.
// Trocar de uma pra outra faz um crossfade (setMusicMood).
// Tudo vai pro barramento de música (musicGain), controlado pelo volume de
// "Música" nas configurações.

// Acordes (notas MIDI) duram 2 compassos cada; melodias são listas de
// [semicolcheia do compasso, nota, ...] — uma por acorde.
const MUSIC_SONGS = {
    menu: {
        bpm: 76,
        swing: 0,
        form: ['intro', 'A', 'B', 'A', 'calma'],
        loopFrom: 1,
        mix: { arp: 0.05, melody: 0.07, pad: 0.035, bass: 0.08, steel: 0.05, uke: 0.025, flute: 0.035, perc: 0.02 },
        sections: {
            intro: {
                bars: 4,
                chords: [
                    [53, 57, 60, 64],
                    [50, 53, 57, 60],
                ],
                parts: ['pad', 'arp', 'bolhas'],
            },
            A: {
                bars: 8,
                chords: [
                    [53, 57, 60, 64],
                    [50, 53, 57, 60],
                    [46, 50, 53, 57],
                    [48, 52, 55, 58],
                ],
                melody: [
                    [0, 72, 4, 69, 8, 67, 12, 69],
                    [0, 72, 8, 74],
                    [0, 69, 4, 65, 8, 67],
                    [0, 64, 6, 65, 12, 67],
                ],
                melodyEveryOtherBar: true,
                parts: ['pad', 'arp', 'baixo', 'melodia', 'bolhas'],
            },
            B: {
                bars: 8,
                chords: [
                    [46, 50, 53, 57],
                    [45, 48, 52, 55],
                    [43, 46, 50, 53],
                    [48, 52, 55, 58],
                ],
                steel: [
                    [0, 74, 8, 72],
                    [0, 72, 8, 69],
                    [0, 70, 6, 69, 12, 67],
                    [0, 67, 8, 72],
                ],
                parts: ['pad', 'baixo', 'guitarra', 'ukulele'],
            },
            calma: {
                bars: 4,
                chords: [
                    [53, 57, 60, 64],
                    [46, 50, 53, 57],
                ],
                steel: [
                    [0, 72],
                    [0, 69],
                ],
                parts: ['pad', 'guitarra', 'bolhas'],
            },
        },
    },
    jogo: {
        bpm: 96,
        swing: 0.12,
        form: ['intro', 'A', 'B', 'A2', 'calma'],
        loopFrom: 1,
        mix: { arp: 0.045, melody: 0.06, pad: 0.03, bass: 0.09, steel: 0.045, uke: 0.03, flute: 0.03, perc: 0.03 },
        sections: {
            intro: {
                bars: 4,
                chords: [
                    [48, 52, 55, 59],
                    [45, 48, 52, 55],
                ],
                parts: ['pad', 'arp', 'baixo', 'chocalho'],
            },
            A: {
                bars: 8,
                chords: [
                    [48, 52, 55, 59],
                    [45, 48, 52, 55],
                    [41, 45, 48, 52],
                    [43, 47, 50, 53],
                ],
                melody: [
                    [0, 72, 3, 74, 6, 76, 10, 79],
                    [0, 76, 4, 74, 8, 72, 12, 69],
                    [0, 69, 3, 72, 6, 74, 10, 72],
                    [0, 71, 4, 74, 8, 79, 14, 77],
                ],
                parts: ['pad', 'arp', 'baixo', 'baixo3', 'melodia', 'chocalho', 'bumbo'],
            },
            B: {
                bars: 8,
                chords: [
                    [41, 45, 48, 52],
                    [43, 47, 50, 53],
                    [40, 43, 47, 50],
                    [45, 48, 52, 55],
                ],
                steel: [
                    [0, 77, 4, 76, 8, 74, 12, 72],
                    [0, 74, 6, 71, 12, 67],
                    [0, 71, 4, 72, 8, 74, 12, 76],
                    [0, 76, 8, 72],
                ],
                parts: ['pad', 'baixo', 'baixo3', 'guitarra', 'ukulele', 'chocalho', 'madeira', 'bumbo'],
            },
            A2: {
                bars: 8,
                chords: [
                    [48, 52, 55, 59],
                    [45, 48, 52, 55],
                    [41, 45, 48, 52],
                    [43, 47, 50, 53],
                ],
                melody: [
                    [0, 72, 3, 74, 6, 76, 10, 79],
                    [0, 76, 4, 74, 8, 72, 12, 69],
                    [0, 69, 3, 72, 6, 74, 10, 72],
                    [0, 71, 4, 74, 8, 79, 14, 77],
                ],
                // Contracanto da flauta: notas longas por cima da marimba.
                flute: [
                    [0, 84, 8, 83],
                    [0, 81, 8, 79],
                    [0, 81, 8, 77],
                    [0, 79, 8, 83],
                ],
                parts: ['pad', 'arp', 'baixo', 'baixo3', 'melodia', 'flauta', 'ukulele', 'chocalho', 'bumbo'],
            },
            calma: {
                bars: 4,
                chords: [
                    [41, 45, 48, 52],
                    [43, 47, 50, 53],
                ],
                steel: [
                    [0, 72, 8, 74],
                    [0, 71],
                ],
                parts: ['pad', 'arp', 'guitarra', 'bolhas'],
            },
        },
    },
};

const music = {
    mood: null,
    nextTime: 0,
    step: 0, // semicolcheia atual dentro da parte
    formIdx: 0, // parte atual (índice em song.form)
    noise: null, // ruído curto (chocalho), criado uma vez
    timer: null,
    out: null, // ganho da trilha (crossfade)
    ocean: null,
    filter: null,
};

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function ensureMusicGraph() {
    if (!audioCtx || music.out) return;
    music.out = audioCtx.createGain();
    music.out.gain.value = 0;
    // Um lowpass leve deixa tudo "debaixo d'água".
    music.filter = audioCtx.createBiquadFilter();
    music.filter.type = 'lowpass';
    music.filter.frequency.value = 2600;
    music.out.connect(music.filter);
    music.filter.connect(musicGain);
    const len = Math.floor(audioCtx.sampleRate * 0.12);
    music.noise = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const nd = music.noise.getChannelData(0);
    for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
    startOceanAmbience();
}

// Mar de fundo: ruído rosa em loop (o buffer é contínuo: o fim emenda no
// começo sem estalo porque as duas pontas são suavizadas), passando por um
// lowpass cuja frequência sobe e desce como ondas.
function startOceanAmbience() {
    const len = audioCtx.sampleRate * 4;
    const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.95 * b2 + w * 0.048;
        data[i] = (b0 + b1 + b2) * 0.6;
    }
    const fade = 2000;
    for (let i = 0; i < fade; i++) {
        const k = i / fade;
        data[i] = data[i] * k + data[len - fade + i] * (1 - k);
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = fade / audioCtx.sampleRate;
    src.loopEnd = (len - fade) / audioCtx.sampleRate;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.11;
    // Ondas: LFO lento na frequência do filtro e no volume.
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoAmt = audioCtx.createGain();
    lfoAmt.gain.value = 260;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    const lfo2 = audioCtx.createOscillator();
    lfo2.frequency.value = 0.13;
    const lfo2Amt = audioCtx.createGain();
    lfo2Amt.gain.value = 0.045;
    lfo2.connect(lfo2Amt);
    lfo2Amt.connect(gain.gain);
    src.connect(lp);
    lp.connect(gain);
    gain.connect(musicGain);
    src.start();
    lfo.start();
    lfo2.start();
    music.ocean = { src, lfo, lfo2 };
}

// Nota de "marimba" macia: seno + harmônico, ataque rápido e decaimento.
function playPluck(freq, time, dur, vol) {
    const o1 = audioCtx.createOscillator();
    const o2 = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 4;
    const g2 = audioCtx.createGain();
    g2.gain.value = 0.18;
    o2.connect(g2);
    g2.connect(g);
    o1.connect(g);
    g.connect(music.out);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o1.start(time);
    o2.start(time);
    o1.stop(time + dur + 0.05);
    o2.stop(time + dur + 0.05);
}

// Acorde de fundo: triângulos levemente desafinados, entrada e saída lentas.
function playPad(notes, time, dur, vol) {
    notes.forEach((n, i) => {
        [-6, 6].forEach((cents) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = i === 0 ? 'sine' : 'triangle';
            o.frequency.value = midiToHz(n + 12);
            o.detune.value = cents;
            o.connect(g);
            g.connect(music.out);
            g.gain.setValueAtTime(0.0001, time);
            g.gain.linearRampToValueAtTime(vol / notes.length, time + dur * 0.35);
            g.gain.linearRampToValueAtTime(vol / notes.length, time + dur * 0.7);
            g.gain.linearRampToValueAtTime(0.0001, time + dur + 0.4);
            o.start(time);
            o.stop(time + dur + 0.5);
        });
    });
}

// Guitarra havaiana: a nota chega deslizando de baixo e treme (vibrato).
function playSteel(freq, time, dur, vol) {
    const o = audioCtx.createOscillator();
    const o2 = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    o.type = 'triangle';
    o2.type = 'sine';
    o.frequency.setValueAtTime(freq * 0.94, time);
    o.frequency.exponentialRampToValueAtTime(freq, time + 0.14);
    o2.frequency.setValueAtTime(freq * 1.88, time);
    o2.frequency.exponentialRampToValueAtTime(freq * 2, time + 0.14);
    const vib = audioCtx.createOscillator();
    const vibAmt = audioCtx.createGain();
    vib.frequency.value = 5.2;
    vibAmt.gain.setValueAtTime(0, time);
    vibAmt.gain.linearRampToValueAtTime(freq * 0.012, time + 0.35);
    vib.connect(vibAmt);
    vibAmt.connect(o.frequency);
    const g2 = audioCtx.createGain();
    g2.gain.value = 0.25;
    o2.connect(g2);
    g2.connect(lp);
    o.connect(lp);
    lp.connect(g);
    g.connect(music.out);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.06);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, time + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    [o, o2, vib].forEach((n) => {
        n.start(time);
        n.stop(time + dur + 0.05);
    });
}

// Ukulele: as notas do acorde de cima pra baixo, bem rápido (uma "palhetada").
function playUkeStrum(chord, time, vol) {
    chord.forEach((n, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = midiToHz(n + 12);
        o.connect(g);
        g.connect(music.out);
        const t = time + i * 0.014;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        o.start(t);
        o.stop(t + 0.36);
    });
}

// Flauta: seno com entrada suave e vibrato atrasado.
function playFlute(freq, time, dur, vol) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const vib = audioCtx.createOscillator();
    const vibAmt = audioCtx.createGain();
    vib.frequency.value = 4.6;
    vibAmt.gain.setValueAtTime(0, time);
    vibAmt.gain.linearRampToValueAtTime(freq * 0.008, time + dur * 0.5);
    vib.connect(vibAmt);
    vibAmt.connect(o.frequency);
    o.connect(g);
    g.connect(music.out);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.12);
    g.gain.setValueAtTime(vol, time + dur * 0.75);
    g.gain.linearRampToValueAtTime(0.0001, time + dur);
    o.start(time);
    vib.start(time);
    o.stop(time + dur + 0.05);
    vib.stop(time + dur + 0.05);
}

// Percussão leve: chocalho (ruído agudo), bumbo macio e bloco de madeira.
function playPerc(kind, time, vol) {
    const g = audioCtx.createGain();
    g.connect(music.out);
    if (kind === 'chocalho') {
        const src = audioCtx.createBufferSource();
        src.buffer = music.noise;
        const hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6500;
        src.connect(hp);
        hp.connect(g);
        g.gain.setValueAtTime(vol, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
        src.start(time);
        src.stop(time + 0.08);
        return;
    }
    const o = audioCtx.createOscillator();
    o.type = 'sine';
    o.connect(g);
    if (kind === 'bumbo') {
        o.frequency.setValueAtTime(110, time);
        o.frequency.exponentialRampToValueAtTime(45, time + 0.14);
        g.gain.setValueAtTime(vol * 3, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    } else {
        o.frequency.value = 1250;
        g.gain.setValueAtTime(vol * 1.4, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    }
    o.start(time);
    o.stop(time + 0.25);
}

function playPhrase(phrase, inBar, play) {
    if (!phrase) return;
    for (let k = 0; k < phrase.length; k += 2) if (phrase[k] === inBar) play(midiToHz(phrase[k + 1]));
}

function scheduleMusic() {
    if (!audioCtx || !music.mood) return;
    const song = MUSIC_SONGS[music.mood];
    const mix = song.mix;
    const sixteenth = 60 / song.bpm / 4;
    while (music.nextTime < audioCtx.currentTime + 0.4) {
        let sec = song.sections[song.form[music.formIdx]];
        if (music.step >= sec.bars * 16) {
            music.step = 0;
            music.formIdx = music.formIdx + 1 < song.form.length ? music.formIdx + 1 : song.loopFrom || 0;
            sec = song.sections[song.form[music.formIdx]];
        }
        const has = (p) => sec.parts.includes(p);
        const step = music.step;
        const bar = Math.floor(step / 16);
        const inBar = step % 16;
        const chordIdx = Math.floor(bar / 2) % sec.chords.length;
        const chord = sec.chords[chordIdx];
        let t = music.nextTime;
        if (song.swing && inBar % 2 === 1) t += sixteenth * song.swing;
        // Acorde de fundo no começo de cada par de compassos.
        if (has('pad') && inBar === 0 && bar % 2 === 0) playPad(chord, t, sixteenth * 32, mix.pad);
        // Baixo: tônica no tempo 1 (e no 3, quando a parte pede).
        if ((has('baixo') && inBar === 0) || (has('baixo3') && inBar === 8)) {
            playPluck(midiToHz(chord[0] - 12), t, 0.9, mix.bass);
        }
        // Arpejo suave subindo pelas notas do acorde.
        if (has('arp') && inBar % 4 === 2)
            playPluck(midiToHz(chord[((inBar / 4 + bar) % chord.length) | 0] + 12), t, 0.6, mix.arp);
        // Melodia da marimba (no menu, só nos compassos ímpares: deixa respiro).
        if (has('melodia') && sec.melody && (!sec.melodyEveryOtherBar || bar % 2 === 1)) {
            playPhrase(sec.melody[chordIdx], inBar, (f) => playPluck(f, t, 1.1, mix.melody));
        }
        // Guitarra havaiana: frase no 1º compasso de cada acorde.
        if (has('guitarra') && sec.steel && bar % 2 === 0) {
            playPhrase(sec.steel[chordIdx], inBar, (f) => playSteel(f, t, sixteenth * 7, mix.steel));
        }
        if (has('flauta') && sec.flute && bar % 2 === 0) {
            playPhrase(sec.flute[chordIdx], inBar, (f) => playFlute(f, t, sixteenth * 7.5, mix.flute));
        }
        // Ukulele no contratempo (tempos 2 e 4).
        if (has('ukulele') && (inBar === 4 || inBar === 12)) playUkeStrum(chord, t, mix.uke);
        if (has('chocalho') && inBar % 2 === 0) playPerc('chocalho', t, mix.perc * (inBar % 4 === 2 ? 1 : 0.55));
        if (has('bumbo') && (inBar === 0 || inBar === 8)) playPerc('bumbo', t, mix.perc);
        if (has('madeira') && (inBar === 6 || inBar === 14)) playPerc('madeira', t, mix.perc);
        // De vez em quando, uma bolhinha subindo (parte do clima).
        if (inBar === 15 && Math.random() < (has('bolhas') ? 0.5 : 0.2)) {
            const base = 900 + Math.random() * 500;
            [0, 0.05, 0.1].forEach((d, i) => playPluck(base + i * 180, t + d, 0.08, 0.02));
        }
        music.nextTime += sixteenth;
        music.step++;
    }
}

// mood: 'menu' | 'jogo' | null (silêncio, só o mar).
function setMusicMood(mood) {
    if (!audioCtx) return;
    ensureMusicGraph();
    if (music.mood === mood) return;
    const now = audioCtx.currentTime;
    music.out.gain.cancelScheduledValues(now);
    music.out.gain.setValueAtTime(music.out.gain.value, now);
    music.out.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    setTimeout(() => {
        music.mood = mood;
        music.step = 0;
        music.formIdx = 0;
        music.nextTime = audioCtx.currentTime + 0.05;
        if (!mood) return;
        const t = audioCtx.currentTime;
        music.out.gain.cancelScheduledValues(t);
        music.out.gain.setValueAtTime(0.0001, t);
        music.out.gain.linearRampToValueAtTime(1, t + 1.6);
    }, 850);
    if (!music.timer) music.timer = setInterval(scheduleMusic, 100);
}
