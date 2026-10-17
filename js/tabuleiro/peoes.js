// ============================================================
// TABULEIRO: PEÕES NO CAMINHO
// ============================================================
// Criação dos peões, ocupação de várias peças na mesma casa, marcador da vez
// e movimento casa a casa. O visual de cada personagem é de
// js/modelos/pawnBuilders.js.

// ============ VÁRIOS PEÕES NA MESMA CASA ============
// getTilePosition() continua sendo "onde fica o CENTRO da casa" (usado por
// tiles, câmera, etc. — não mexemos nisso). Essas funções aqui só resolvem
// ONDE DENTRO da casa cada peão fica quando há mais de um ali, pra eles
// pararem de se sobrepor. Até 4 peões por casa (o máximo de jogadores do jogo).
// Espalhados ao longo de X (a direção das fileiras do caminho e a "largura"
// da tela, já que a câmera olha de +Z) em zigue-zague: ninguém fica
// escondido atrás de outro. Os deslocamentos antigos (0,17) eram pequenos
// demais pros personagens — com 3-4 na mesma casa viravam um bolo só.
const TILE_OCCUPANCY_LAYOUTS = {
    1: [{ x: 0, z: 0 }],
    2: [
        { x: -0.3, z: 0 },
        { x: 0.3, z: 0 },
    ],
    3: [
        { x: -0.42, z: 0.1 },
        { x: 0, z: -0.16 },
        { x: 0.42, z: 0.1 },
    ],
    4: [
        { x: -0.5, z: -0.12 },
        { x: -0.17, z: 0.16 },
        { x: 0.17, z: -0.12 },
        { x: 0.5, z: 0.16 },
    ],
};

// Com 3 ou 4 na mesma casa os peões encolhem um pouco, pra caberem lado a lado.
function getTileCrowdScale(occupantCount) {
    return occupantCount >= 4 ? 0.8 : occupantCount === 3 ? 0.88 : 1;
}

function tweenPawnScale(pawn, scale) {
    gsap.to(pawn.scale, { x: scale, y: scale, z: scale, duration: 0.3, ease: 'power2.out' });
}

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
    const crowdScale = getTileCrowdScale(getPawnsOnTile(tileIndex).length);
    gameState.players.forEach((p, idx) => {
        if (p.position !== tileIndex) return;
        const pawn = pawns[idx];
        if (!pawn) return;
        // Quem acabou de chegar (excludePlayerIndex) já pousou no lugar certo —
        // só ajusta o tamanho dele, não a posição.
        tweenPawnScale(pawn, crowdScale);
        if (idx === excludePlayerIndex) return;
        const target = getPawnTilePosition(tileIndex, idx);
        target.y += 0.3;
        gsap.to(pawn.position, { x: target.x, y: target.y, z: target.z, duration: 0.35, ease: 'power2.out' });
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// (a montagem do modelo visual dos peões mora em js/modelos/pawnBuilders.js —
// createCharacterPawn() continua chamável daqui como sempre, só que agora
// isolada num sistema próprio; ver comentário lá pra trocar o modelo futuramente)

// Assinatura dos peões montados (conjunto + personagem de cada um): o
// convidado P2P remonta quando a do host muda.
function getPawnsSignature() {
    if (!gameState) return null;
    return (gameState.tokenSet || tokenSet) + '|' + gameState.players.map((p) => p.character).join(',');
}

function createPawns() {
    while (pawnsGroup.children.length) pawnsGroup.remove(pawnsGroup.children[0]);
    pawns = [];
    if (!gameState) return;
    const totalPlayers = gameState.players.length;
    // O conjunto de personagens e a cor vêm do gameState (não da configuração
    // local desta tela): num convidado P2P o gameState é o do host, então os
    // peões saem iguais nas duas telas.
    const setId = gameState.tokenSet || tokenSet;
    for (let i = 0; i < totalPlayers; i++) {
        const player = gameState.players[i];
        const colorIdx =
            player.colorIndex !== undefined
                ? player.colorIndex
                : selectedColors[i] !== undefined
                  ? selectedColors[i]
                  : i;
        const colorHex = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length].hex;
        const pawn = createCharacterPawn(colorHex, i, player.character || getCharacterKeyFor(setId, i));
        const startPos = getPawnTilePosition(0, i); // todos começam na casa 0 — já nasce na posição certa dentro dela
        pawn.position.copy(startPos);
        pawn.position.y += 0.2;
        pawn.visible = true;
        linearizeModelColors(pawn); // peão do kit já vem convertido (o WeakSet pula)
        simplifyMaterials(pawn);
        pawnsGroup.add(pawn);
        pawns.push(pawn);
        gameState.players[i].pawnIndex = i;
    }
    createTurnMarker();
    const startScale = getTileCrowdScale(totalPlayers);
    pawns.forEach((pawn) => pawn.scale.setScalar(startScale)); // todos começam juntos na casa 0
    pawnsBuiltForTokenSet = getPawnsSignature();
    activePawnToFollow = gameState.currentPlayerIndex;
    setCameraFocus(gameState.currentPlayerIndex);
}

// ============ "VOCÊ ESTÁ AQUI" ============
// Anel pulsando no chão, na cor do jogador da vez, que acompanha o peão dele
// — dá pra achar quem joga agora num relance, mesmo de longe ou com vários
// peões na mesma casa. Só um anel (não um por jogador), pra não deixar todas
// as casas igualmente chamativas.
function createTurnMarker() {
    if (turnMarker && turnMarker.parent) turnMarker.parent.remove(turnMarker);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false });
    turnMarker = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 40), mat);
    turnMarker.rotation.x = -Math.PI / 2;
    turnMarker.renderOrder = 2;
    pawnsGroup.add(turnMarker);
}

// Chamada todo frame por animate() (main.js).
function updateTurnMarker(elapsed) {
    if (!turnMarker) return;
    const idx = gameState ? gameState.currentPlayerIndex : -1;
    const pawn = idx >= 0 ? pawns[idx] : null;
    turnMarker.visible = !!pawn && !gameState.gameOver;
    if (!turnMarker.visible) return;
    const player = gameState.players[idx];
    const colorIdx = player.colorIndex !== undefined ? player.colorIndex : idx;
    turnMarker.material.color.setHex(PLAYER_COLORS[colorIdx % PLAYER_COLORS.length].hex).convertSRGBToLinear();
    // Fica no chão mesmo quando o peão está no ar (pulando).
    turnMarker.position.set(pawn.position.x, getTilePosition(player.position).y + 0.05, pawn.position.z);
    const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
    turnMarker.scale.set(pulse * pawn.scale.x, pulse * pawn.scale.x, 1);
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
        setPawnHeading(pawnIndex, targetPos.x - startPos.x, targetPos.z - startPos.z);
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
                notifyPawnLanded(pawnIndex);
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
async function movePlayerAlongPath(pawnIndex, fromTile, toTile, onComplete, onStep) {
    if (fromTile === toTile) {
        refreshTileOccupants(toTile, pawnIndex);
        if (onComplete) onComplete();
        return;
    }
    // Quem ficou na casa de saída se reorganiza (antes ficavam no "canto"
    // antigo, como se o peão que saiu ainda estivesse lá), e quem sai volta ao
    // tamanho normal enquanto anda.
    refreshTileOccupants(fromTile, pawnIndex);
    if (pawns[pawnIndex]) tweenPawnScale(pawns[pawnIndex], 1);
    const step = toTile > fromTile ? 1 : -1;
    let first = true;
    setPawnMoving(pawnIndex, true); // personagem "nadando" (ver modelos/animacaoPeoes.js)
    for (let t = fromTile + step; step > 0 ? t <= toTile : t >= toTile; t += step) {
        if (!first) await delay(TIMING.hopPauseMs);
        first = false;
        await hopPawnToTile(pawnIndex, t);
        if (onStep) onStep(t);
    }
    setPawnMoving(pawnIndex, false);
    if (onComplete) onComplete();
}
