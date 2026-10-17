// ============================================================
// ANIMAÇÃO DOS PERSONAGENS (todos: clássicos e do kit)
// ============================================================
// Um animador só, por cima do "rig" de cada peão (pawn.userData.rig):
//   - parado: respira (estica/encolhe de leve) e balança;
//   - pisca em intervalos aleatórios (os do kit já piscam sozinhos);
//   - andando entre casas: inclina pra frente, vira pra onde vai, bate os
//     braços e solta bolhas — "nadando";
//   - ao pousar: amassa e volta (squash);
//   - reações: comemorar (pula girando, braços pra cima, bolhas) e
//     frustrar (balança a cabeça e murcha).
// Só mexe em rig.body (o corpo, dentro do grupo do peão): a posição do peão
// no tabuleiro é de tabuleiro/peoes.js (GSAP) e não entra em conflito.

let pawnAnimTime = 0;

// Rig dos peões do kit: o corpo é o grupo "<id>_corpo" do modelo (a base de
// peão fica fora dele e não se mexe); o kit cuida do piscar.
function makeSeaKitPawnRig(model) {
    const body = model.objeto.getObjectByName(model.id + '_corpo') || model.objeto;
    return { body, baseY: body.position.y, baseScale: body.scale.x, eyes: [], arms: [], kit: model };
}

function getPawnRig(pawn) {
    const rig = pawn && pawn.userData && pawn.userData.rig;
    if (!rig) return null;
    if (!rig.state) {
        rig.state = {
            phase: Math.random() * 10,
            nextBlink: pawnAnimTime + 1 + Math.random() * 3,
            blinkStart: -1,
            reaction: null,
            landedAt: -10,
            heading: 0,
            moving: false,
            lastBubble: 0,
        };
        if (rig.baseScale === undefined) rig.baseScale = rig.body.scale.x;
        if (rig.baseY === undefined) rig.baseY = rig.body.position.y;
    }
    return rig;
}

// type: 'comemorar' | 'frustrar'
function playPawnReaction(pawnIndex, type, duration) {
    const rig = getPawnRig(pawns[pawnIndex]);
    if (!rig) return;
    rig.state.reaction = { type, t0: pawnAnimTime, dur: duration || (type === 'comemorar' ? 1.6 : 1.4) };
    const pawn = pawns[pawnIndex];
    if (type === 'comemorar') {
        spawnBubbles(pawn.position.clone(), 18);
        setTimeout(() => pawns[pawnIndex] && spawnBubbles(pawns[pawnIndex].position.clone(), 12), 500);
    }
}

// Chamadas por tabuleiro/peoes.js durante o movimento.
function setPawnMoving(pawnIndex, moving) {
    const rig = getPawnRig(pawns[pawnIndex]);
    if (rig) rig.state.moving = moving;
}

function setPawnHeading(pawnIndex, dx, dz) {
    const rig = getPawnRig(pawns[pawnIndex]);
    if (rig && (dx || dz)) rig.state.heading = Math.atan2(dx, dz);
}

function notifyPawnLanded(pawnIndex) {
    const rig = getPawnRig(pawns[pawnIndex]);
    if (rig) rig.state.landedAt = pawnAnimTime;
}

// Chamada todo frame por animate() (main.js).
function updatePawnAnimations(elapsed, dt) {
    pawnAnimTime = elapsed;
    for (let i = 0; i < pawns.length; i++) {
        const pawn = pawns[i];
        const rig = getPawnRig(pawn);
        if (!rig) continue;
        const s = rig.state;
        const t = elapsed + s.phase;
        // ---- base: respirar e balançar ----
        const breath = Math.sin(t * 2.1);
        let sy = 1 + breath * 0.028;
        let sxz = 1 - breath * 0.014;
        let rx = 0;
        let ry = 0;
        let rz = Math.sin(t * 1.1) * 0.035;
        let py = 0;
        let armLift = Math.sin(t * 1.6) * 0.08;
        // ---- nadando entre casas ----
        if (s.moving) {
            rx = 0.24;
            rz += Math.sin(t * 9) * 0.07;
            armLift = 0.5 + Math.sin(t * 12) * 0.5;
            if (elapsed - s.lastBubble > 0.18) {
                s.lastBubble = elapsed;
                const p = pawn.position.clone();
                p.y += 0.4;
                spawnBubbles(p, 1);
            }
        }
        // ---- amassar ao pousar ----
        const sinceLand = elapsed - s.landedAt;
        if (sinceLand < 0.3) {
            const k = Math.sin((sinceLand / 0.3) * Math.PI) * (1 - sinceLand / 0.3);
            sy *= 1 - 0.22 * k;
            sxz *= 1 + 0.14 * k;
        }
        // ---- reações ----
        if (s.reaction) {
            const p = (elapsed - s.reaction.t0) / s.reaction.dur;
            if (p >= 1) s.reaction = null;
            else if (s.reaction.type === 'comemorar') {
                py = Math.abs(Math.sin(p * Math.PI * 3)) * 0.42 * (1 - p * 0.4);
                ry = THREE.MathUtils.smootherstep(p, 0, 0.7) * Math.PI * 2;
                sy *= 1 + 0.12 * Math.sin(p * Math.PI * 6);
                armLift = 2.4;
            } else {
                const fade = 1 - p;
                rz += Math.sin(p * Math.PI * 8) * 0.22 * fade;
                rx = 0.28 * Math.sin(Math.min(1, p * 3) * Math.PI * 0.5) * fade;
                sy *= 1 - 0.12 * Math.sin(Math.min(1, p * 2) * Math.PI * 0.5) * fade;
                py = -0.03 * fade;
                armLift = -0.3 * fade;
            }
        }
        // ---- virar pra onde está indo (parado, volta a olhar pra câmera) ----
        const targetYaw = s.moving ? s.heading : Math.sin(t * 0.55) * 0.18;
        let dy = targetYaw - pawn.rotation.y;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        pawn.rotation.y += dy * Math.min(1, dt * 8);

        const bs = rig.baseScale;
        rig.body.position.y = rig.baseY + py;
        rig.body.rotation.set(rx, ry, rz);
        rig.body.scale.set(bs * sxz, bs * sy, bs * sxz);
        for (let k = 0; k < rig.arms.length; k++) {
            const arm = rig.arms[k];
            arm.pivot.rotation.z = arm.side * armLift;
        }
        // ---- piscar (clássicos; o kit pisca sozinho) ----
        if (rig.eyes.length) {
            if (elapsed > s.nextBlink) {
                s.blinkStart = elapsed;
                s.nextBlink = elapsed + 2 + Math.random() * 3.5;
            }
            const kb = elapsed - s.blinkStart;
            const open = kb >= 0 && kb < 0.16 ? Math.max(0.08, Math.abs(kb - 0.08) / 0.08) : 1;
            for (let k = 0; k < rig.eyes.length; k++) rig.eyes[k].scale.y = open;
        }
        if (rig.kit) rig.kit.atualizar(elapsed);
    }
}
