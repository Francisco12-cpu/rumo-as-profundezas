# Como adicionar/trocar modelos 3D dos personagens

O sistema de personagens já separa **dados** (cor, tamanho — `js/data/characters.js`),
**montagem do modelo** (`js/pawnBuilders.js`) e **gameplay** (posição, turno,
movimento — `js/state.js`, `js/scene.js`). Trocar o modelo visual não exige
mexer em gameplay nenhum: só em `pawnBuilders.js` e num arquivo de config.

## Formato suportado

**GLB** (glTF binário, um arquivo só) é o formato recomendado — mais simples
de manusear que `.gltf` (que costuma vir em vários arquivos separados).
FBX **não** é suportado nativamente pela versão do Three.js usada aqui; se só
existir em FBX, converta pra GLB antes (o Blender exporta pra GLB direto).

## Passo a passo

### 1. Coloque o arquivo

Arraste o `.glb` pra `assets/models/`. Exemplo: `assets/models/bob-esponja.glb`.

(Se você ainda está prototipando/testando, pode colocar em `external/models/`
primeiro e pedir integração — ver `external/README.md`.)

### 2. Carregue o GLTFLoader

O loader já está baixado em `vendor/GLTFLoader.js`, mas não é carregado por
padrão (evita baixar ~95kb à toa quando ninguém usa modelo externo). Adicione
esta linha em `index.html`, junto dos outros `<script>` de `vendor/`:

```html
<script src="vendor/GLTFLoader.js"></script>
```

### 3. Registre um builder novo em `js/pawnBuilders.js`

Adicione uma função de montagem e registre ela em `PAWN_BUILDERS`:

```js
function buildBobEsponjaPawn(colorHex) {
    const group = new THREE.Group();
    const loader = new THREE.GLTFLoader();
    loader.load(
        'assets/models/bob-esponja.glb',
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.4, 0.4, 0.4); // ajuste conforme o tamanho do seu modelo
            model.traverse((obj) => {
                if (obj.isMesh) obj.castShadow = true;
            });
            group.add(model);
        },
        undefined,
        (err) => console.error('Falha ao carregar bob-esponja.glb:', err)
    );
    return group; // retorna o grupo (vazio) na hora — o modelo aparece assim que carregar
}

PAWN_BUILDERS.bobEsponja = buildBobEsponjaPawn;
```

O `group` é retornado **antes** do modelo terminar de carregar de propósito —
é ele quem recebe a posição/animação do peão (ver `scene.js`/`hopPawnToTile`),
então o resto do jogo nunca precisa esperar o carregamento terminar. O modelo
3D só "aparece dentro" do grupo quando o `loader.load` chama o callback.

### 4. Aponte o jogo pro modelo novo

Em `js/data/characters.js`, troque:

```js
const CHARACTER_MODEL_KEY = 'bobEsponja'; // era 'default'
```

Pronto — todos os peões passam a usar esse modelo. Pra trocar só um jogador
específico (não o padrão do jogo), passe a chave na hora de criar o peão:
`createCharacterPawn(colorHex, index, 'bobEsponja')` (ver `createPawns()` em
`js/scene.js`).

### 5. Volte pro modelo padrão a qualquer momento

Não precisa apagar nada — só troque `CHARACTER_MODEL_KEY` de volta pra
`'default'`. O builder antigo (`buildDefaultPawn`, o bonequinho geométrico
atual) continua registrado e funcionando.

## Animações (opcional)

Se o `.glb` tiver clipes de animação (idle, walk, jump), use
`THREE.AnimationMixer`:

```js
let mixer;
loader.load('assets/models/personagem.glb', (gltf) => {
    group.add(gltf.scene);
    mixer = new THREE.AnimationMixer(gltf.scene);
    const idle = mixer.clipAction(gltf.animations[0]);
    idle.play();
});
```

Pra animação tocar, o `mixer` precisa de `mixer.update(deltaTime)` chamado a
cada frame — adicione essa chamada dentro de `animate()` em `js/main.js`,
perto de `updateParticles(deltaTime)`. Isso é a única mudança fora de
`pawnBuilders.js` que animações exigem.

## Texturas (chão, casas, cenário)

Pra usar uma imagem sua como textura (em vez das texturas geradas por canvas
que o jogo usa hoje), coloque o arquivo em `assets/textures/` e carregue com
`THREE.TextureLoader`:

```js
const texture = new THREE.TextureLoader().load('assets/textures/areia.jpg');
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(14, 14);
const sandMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
```

Isso troca diretamente o `createSandTexture()` em `js/scene.js` (ou qualquer
outro material do cenário) por uma textura sua.
