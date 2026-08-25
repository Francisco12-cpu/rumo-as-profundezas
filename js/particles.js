// ============ SISTEMA DE PARTÍCULAS ============

// "Resultado definido!" — confirma visualmente, sem deixar dúvida, que o
// número do dado já foi decidido. Reaproveita spawnConfetti/spawnBubbles (não
// é um sistema de partículas novo) só que com bem mais partículas que um
// respingo comum, pra ficar claramente maior que o efeito de passo/poeira.
function spawnDiceConfirmBurst(position) {
    spawnConfetti(position, 40);
    spawnBubbles(position, 10);
}

// Efeito de chegada — o "impacto" mais chamativo de toda a sequência de
// jogada, maior até que a confirmação do dado. Combina bolhas (mais
// numerosas, sobem devagar) com um respingo de confete, reaproveitando os
// mesmos dois sistemas de sempre, só que amplificados.
function spawnLandingConfirmBurst(position) {
    spawnBubbles(position, 34);
    spawnConfetti(position, 22);
}

function spawnBubbles(position, count = 10) {
    for (let i = 0; i < count; i++) {
        if (bubbleParticles.length >= MAX_BUBBLES) break;
        const size = 0.05 + Math.random() * 0.08;
        const geo = new THREE.SphereGeometry(size, 6, 4);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xe0f7fa,
            transparent: true,
            opacity: 0.6,
        });
        const bubble = new THREE.Mesh(geo, mat);
        bubble.position.copy(position);
        bubble.position.x += (Math.random() - 0.5) * 0.5;
        bubble.position.y += Math.random() * 0.5;
        bubble.position.z += (Math.random() - 0.5) * 0.5;
        bubble.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.03,
                Math.random() * 0.06 + 0.03,
                (Math.random() - 0.5) * 0.03
            ),
            life: 1.0,
            decay: 0.006 + Math.random() * 0.008,
        };
        particlesGroup.add(bubble);
        bubbleParticles.push(bubble);
    }
}

function spawnConfetti(position, count = 60) {
    const colors = [0xffd740, 0xff80ab, 0x69f0ae, 0x40c4ff, 0xb388ff, 0xff9e40];
    for (let i = 0; i < count; i++) {
        if (confettiParticles.length >= MAX_CONFETTI) break;
        const size = 0.06 + Math.random() * 0.08;
        const geo = new THREE.PlaneGeometry(size, size * (0.6 + Math.random() * 0.6));
        const mat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
        });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 1.5;
        particle.position.z += (Math.random() - 0.5) * 1.5;
        particle.position.y += Math.random() * 0.8;
        particle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.12,
                Math.random() * 0.1 + 0.04,
                (Math.random() - 0.5) * 0.12
            ),
            life: 1.0,
            decay: 0.007 + Math.random() * 0.01,
            spin: new THREE.Vector3(Math.random() * 0.08, Math.random() * 0.08, Math.random() * 0.08),
        };
        particlesGroup.add(particle);
        confettiParticles.push(particle);
    }
}

function spawnDustParticles(position) {
    for (let i = 0; i < 5; i++) {
        if (dustParticles.length >= MAX_DUST) break;
        const geo = new THREE.SphereGeometry(0.04, 4, 3);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xd4a574,
            transparent: true,
            opacity: 0.6,
        });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 0.25;
        particle.position.z += (Math.random() - 0.5) * 0.25;
        particle.position.y += 0.05;
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.06,
                Math.random() * 0.04 + 0.02,
                (Math.random() - 0.5) * 0.06
            ),
            life: 1.0,
            decay: 0.04 + Math.random() * 0.03,
        };
        particlesGroup.add(particle);
        dustParticles.push(particle);
    }
}

function updateParticles(deltaTime) {
    for (let i = bubbleParticles.length - 1; i >= 0; i--) {
        const p = bubbleParticles[i];
        p.userData.life -= p.userData.decay;
        if (p.userData.life <= 0) {
            particlesGroup.remove(p);
            bubbleParticles.splice(i, 1);
            continue;
        }
        p.position.add(p.userData.velocity);
        p.material.opacity = p.userData.life * 0.6;
    }
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.userData.life -= p.userData.decay;
        if (p.userData.life <= 0) {
            particlesGroup.remove(p);
            confettiParticles.splice(i, 1);
            continue;
        }
        p.position.add(p.userData.velocity);
        p.userData.velocity.y -= 0.005;
        p.rotation.x += p.userData.spin.x;
        p.rotation.y += p.userData.spin.y;
        p.rotation.z += p.userData.spin.z;
        p.material.opacity = p.userData.life * 0.9;
    }
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        const p = dustParticles[i];
        p.userData.life -= p.userData.decay;
        if (p.userData.life <= 0) {
            particlesGroup.remove(p);
            dustParticles.splice(i, 1);
            continue;
        }
        p.position.add(p.userData.velocity);
        p.userData.velocity.y += 0.003;
        p.material.opacity = p.userData.life * 0.6;
    }
}
