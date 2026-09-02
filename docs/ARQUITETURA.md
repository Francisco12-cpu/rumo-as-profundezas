# Arquitetura do projeto

Documento técnico de referência: o que cada pasta/arquivo faz, como os
sistemas se comunicam, onde mexer pra cada tipo de mudança, e os pontos
frágeis que merecem cuidado. Pra tarefas rápidas e receitas prontas, ver
`docs/GUIA-RAPIDO.md`. Pra modelos 3D em detalhe, `docs/MODELOS-3D.md`. Pra
regras de colaboração com IA (Claude Code), `CLAUDE.md` na raiz.

## 1. Filosofia — por que o projeto é assim

- **Sem build, sem servidor obrigatório.** `index.html` + `<script>` clássicos
  (não ES modules), bibliotecas vendorizadas em `vendor/` (não CDN). Dá pra
  abrir `index.html` direto no navegador (`file://`) ou servir com qualquer
  servidor estático — os dois cenários funcionam, com degradação graciosa
  onde `file://` bloqueia algo (ver seção 6, bancos de perguntas via fetch).
- **Escopo global compartilhado, de propósito.** Todo `js/*.js` roda no mesmo
  escopo global (sem `import`/`export`). Funções e variáveis de um arquivo são
  visíveis em todos os outros, na ordem em que os `<script>` aparecem no
  `index.html`. Isso é uma escolha deliberada pra manter a arquitetura
  "arquivo único navegável" sem bundler — não é descuido. O ESLint
  (`eslint.config.mjs`) desliga `no-undef`/`no-redeclare` de propósito, com
  comentário explicando o porquê.
- **Dados de conteúdo separados de lógica de execução.** Ver seção 3.

## 2. Ordem de carregamento (`index.html`)

A ordem dos `<script>` importa — cada arquivo pode usar o que os anteriores já
declararam:

```
vendor/three.min.js, gsap.min.js, EffectComposer/ShaderPass/CopyShader/
RenderPass/UnrealBloomPass/LuminosityHighPassShader/OrbitControls (pipeline
de pós-processamento e câmera do Three.js)
        |
js/data/gameInfo.js       -> GAME_NAME
js/data/tileTypes.js      -> TILE_TYPES, SPECIAL_TILE_TYPE_IDS, getTileType()
js/data/characters.js     -> PLAYER_COLORS, PAWN_APPEARANCE, CHARACTER_MODEL_KEY
js/data/diceFaces.js      -> DICE_FACE_NORMALS, DICE_MATERIAL_FACE_ORDER
js/data/boardPath.js      -> generateBoardPath(), getBoardRowCount()
        |
js/config.js    -> TIMING, GAME_PHASE, estado global (gameState, pawns, etc.)
js/i18n.js      -> STRINGS, applyTranslations()
js/audio.js     -> Web Audio sintetizado (3 barramentos)
js/pawnBuilders.js -> createCharacterPawn() e os builders concretos
js/scene.js     -> Three.js: cena, tabuleiro, casas, dado, ambiente, ocupação
js/interaction.js -> raycasting de clique/toque nas casas
js/particles.js -> bolhas/confete/poeira
js/camera.js    -> transições de câmera (GSAP)
js/state.js     -> gameState, turnos, movimento, efeito de casa
js/bots.js      -> IA local (joga sozinho, responde perguntas)
js/questions.js -> banco de perguntas, modal de pergunta, efeitos
js/multiplayer.js -> PeerJS (host/guest, sync de estado)
js/ui.js        -> telas, botões, performRoll() (orquestra a jogada inteira)
js/main.js      -> wireUpEventListeners(), animate(), init() — chamado no fim
```

`peerjs.min.js` **não** está na lista acima: só é carregado dinamicamente
(`js/multiplayer.js` → `loadPeerJsIfNeeded()`) quando alguém realmente cria ou
entra numa sala P2P — solo/local nunca pagam esse custo.

## 3. Dados vs. estado vs. comportamento

Três camadas, cada uma com um papel:

| Camada            | Onde                | Contém                                                                                                                     | Muda quando                                                                   |
| ----------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Dados**         | `js/data/*.js`      | Conteúdo puro: tipos de casa, cores de personagem, faces do dado, forma do caminho                                         | Você decide mudar regra/visual de algo (ex.: cor de uma casa, altura do peão) |
| **Config/estado** | `js/config.js`      | `TIMING` (ritmo da animação), `GAME_PHASE`, variáveis globais (`gameState`, `pawns`, `cameraMode`, volumes de áudio, etc.) | Durante a execução do jogo (estado) ou pra ajustar ritmo/qualidade (config)   |
| **Comportamento** | os outros `js/*.js` | Funções que leem/escrevem essas duas camadas                                                                               | Você muda uma mecânica ou tela                                                |

Regra prática: se você só quer mudar **o que uma casa faz ou como ela se
chama**, edite `js/data/tileTypes.js` — não mexa em `scene.js`. Se quer mudar
**quanto tempo a animação dura**, edite `TIMING` em `js/config.js` — não mexa
nos `setTimeout` espalhados pelo código (eles todos leem de lá).

## 4. Máquina de estados da jogada (`GAME_PHASE`)

Definida em `js/config.js`:

```
IDLE -> ROLLING -> RESULT -> MOVING -> LANDING -> HOUSE_EFFECT -> (QUESTION) -> IDLE
```

Orquestrada por `performRoll()` em `js/ui.js`, que é o coração da experiência
de uma jogada. Ela é uma cadeia de `setTimeout` aninhados (não uma Promise
chain nem uma state machine formal) — cada etapa dispara a próxima depois de
um tempo vindo de `TIMING`:

```
performRoll()
  1. mostra dado girando (showDiceRoll) + câmera no dado      [TIMING.diceSpinMs]
  2. dado para, burst de confirmação (spawnDiceConfirmBurst)  [TIMING.diceResultHoldMs]
  3. câmera foca no personagem da vez
  4. personagem fica parado (nenhuma chamada — só o atraso)   [TIMING.standStillMs]
  5. movePlayer() -> movePlayerAlongPath() pula casa por casa
     (TIMING.hopDurationMs por pulo, TIMING.hopPauseMs entre pulos)
  6. pausa depois do último pulo                              [TIMING.preLandingBurstMs]
  7. burst de chegada (spawnLandingConfirmBurst)
  8. pausa depois do burst                                    [TIMING.postLandingPauseMs]
  9. handleLanding() -> decide o efeito da casa / pergunta
```

**Por que isso importa:** a pergunta só pode aparecer depois do passo 9 —
nunca antes. Se um dia essa cadeia for reescrita (ex.: pra usar
`async`/`await` com uma função `delay()`, que já existe em `scene.js`), a
ORDEM relativa das etapas acima tem que ser preservada, porque é o que garante
"a pergunta nunca corta uma animação" (pedido explícito do jogo).

`gamePhase` é uma trava **informativa/defensiva** por cima disso — a trava
"oficial", que também protege a sincronização P2P, continua sendo
`rollInProgress`/`questionInProgress` (ambas em `config.js`). As duas
coexistem de propósito: não remova nenhuma achando que é redundante.

## 5. Tabuleiro, casas e ocupação (`js/scene.js`)

- **Traçado**: `generateBoardPath(boardLength)` (`js/data/boardPath.js`) gera
  pontos de controle em fileiras retas serpenteadas (esquerda↔direita), que
  viram uma `THREE.CatmullRomCurve3` suave em `createBoardCurve()`.
  `getBoardRowCount(boardLen)` é a única função que decide "quantas fileiras
  pra esse tanto de casas" — usada tanto pro traçado quanto pro enquadramento
  da câmera de visão geral (`camera.js`), então as duas nunca dessincronizam.
- **Casas**: `createTiles()` cria, por casa, 4 objetos: o disco visual
  (`shell`), um alvo de clique **invisível e maior** que o disco
  (`hitTarget`, ver seção 7), o rótulo numérico (sprite) e o anel decorativo.
  `tileMeshes[i]` guarda o `hitTarget` da casa `i` — é o array que
  `state.js`/`interaction.js` consultam por índice.
- **Cor das casas normais**: `NORMAL_TILE_PALETTE` (topo de `createTiles`)
  cicla uma paleta vívida pras casas `normal` (a maioria do tabuleiro), em vez
  de todas ficarem na mesma cor parda de `TILE_TYPES.normal`. É só uma
  variação visual por instância — tipo/descrição continuam vindo de
  `TILE_TYPES` sem mudança.
- **Posição "pura" vs. posição de ocupação**: `getTilePosition(index)`
  continua sendo _só_ o centro geométrico da casa — nada sabe de peões.
  `getPawnTilePosition(tileIndex, playerIndex)` soma um deslocamento
  (`getTileSlotOffset`, via `TILE_OCCUPANCY_LAYOUTS`) pra até 4 peões na mesma
  casa nunca se sobreporem (1 = centro, 2 = lado a lado, 3 = triângulo,
  4 = um em cada canto). `refreshTileOccupants(tileIndex, excludePlayerIndex)`
  reacomoda suavemente (gsap) quem já estava na casa quando a ocupação muda.
  **Toda** função que precisa posicionar um peão numa casa (criação, pulo,
  sincronização P2P, troca de lugar) usa `getPawnTilePosition`, nunca
  `getTilePosition` sozinho.
- **Movimento casa a casa**: `hopPawnToTile(pawnIndex, tileIndex)` faz UM
  pulo (duração `TIMING.hopDurationMs`); `movePlayerAlongPath(pawnIndex,
fromTile, toTile, onComplete)` encadeia pulos com `TIMING.hopPauseMs` de
  pausa entre eles, na direção certa (`step = toTile > fromTile ? 1 : -1`).
  `movePlayer()` (`state.js`) é quem decide a casa final e chama isso.

## 6. Perguntas (`js/questions.js`)

- **Fonte de perguntas**: `data/questions/*.json` + `data/questions/manifest.json`,
  carregados via `fetch()` (`loadQuestionBanks()`). Em `file://` o `fetch` é
  bloqueado pelo navegador — o jogo detecta a falha e cai pro `DEFAULT_DECK`
  embutido no próprio `questions.js`, sem travar. Pra ver todos os bancos de
  `data/questions/`, sirva a pasta (`npx serve .` ou similar).
- **Banco selecionado**: `selectedBankId` (`config.js`, persistido em
  `localStorage`) — `'all'` mistura todos, ou o id de um banco específico.
  `getQuestionPool()`/`getRandomQuestion()` leem isso.
- **Efeitos de casa restritos por banco**: um banco pode declarar
  `efeitosCasasAtivos` (quais tipos de casa especial fazem sentido pra ele) —
  `getActiveEfeitosCasasAtivos()` filtra `SPECIAL_TILE_TYPE_IDS` por isso.
- **Fluxo de uma pergunta**: `askQuestion(playerIndex, isBonus)` monta e
  mostra o modal (`buildQuestionModalHTML`), liga os botões
  (`wireQuestionModalButtons`) **só se o jogador não for bot** — se for bot,
  os botões ficam desabilitados (ninguém pode responder no lugar dele) e
  `botAnswerQuestion()` (`js/bots.js`) decide sozinho, depois de um atraso
  simulando "pensar". `handleQuestionAnswer(optionIndex, isBotAuto)` processa
  a resposta (humano ou bot) e tem uma trava (`if (!questionInProgress) return`)
  contra ser chamada duas vezes (ex.: clique humano + timeout do timer
  disparando quase juntos).
- **Dificuldade dos bots**: `botDifficulty` (`config.js`, valores `0.5`/`0.75`/
  `1`, persistido em `localStorage`, editável em Configurações) é a
  probabilidade de `botAnswerQuestion()` acertar. Não há "flag de certo/errado
  por pergunta" — é uma única probabilidade global.
- **P2P**: o host decide tudo (`askQuestion`) e manda `question_show` pros
  convidados; convidados só veem (`showQuestionForGuest`) e mandam
  `answer_request` — nunca decidem localmente se acertaram.

## 7. Interação com o tabuleiro (`js/interaction.js`)

Raycasting simples: `pointerdown` guarda a posição, `pointerup` mede a
distância percorrida (`TAP_MOVE_THRESHOLD = 8px`) pra distinguir toque de
arraste (girar câmera via OrbitControls usa os mesmos eventos). Se foi um
toque de verdade, faz raycast contra `tileMeshes` (os `hitTarget` invisíveis
maiores que o disco visual, ver seção 5) e chama `showTileInfo()`.

Ao acertar uma casa, `flashTileSelection(mesh)` dá um pulso de escala +
brilho no **disco visual de verdade** (`hitTarget.userData.visualMesh`) — não
no alvo invisível — pra dar feedback claro de qual casa foi selecionada.

## 8. Câmera (`js/camera.js`)

Quatro funções, todas animando `camera.position`/`controls.target` via GSAP
(nunca mexem no `OrbitControls` diretamente — ele recalcula sua órbita a
partir da posição atual a cada frame, então o jogador sempre pode pegar o
mouse/dedo e girar por cima de qualquer transição automática):
`setCameraFocus(pawnIndex)`, `setCameraOverview()`, `setCameraDiceFocus()`,
`toggleCamera()`. Em `main.js`/`animate()`, quando `cameraMode === 'focus'`, o
alvo (`controls.target`) segue o peão automaticamente a cada frame
(`lerp`), então mesmo sem nenhum GSAP rodando a câmera continua "olhando" pro
personagem certo.

## 9. Partículas (`js/particles.js`)

Três sistemas simples (bolha, confete, poeira), cada um com um array próprio
(`bubbleParticles`/`confettiParticles`/`dustParticles`) e um teto
(`MAX_BUBBLES`/`MAX_CONFETTI`/`MAX_DUST`, menores em `isLowPowerDevice`) pra
não crescer sem limite em partidas longas. `updateParticles(deltaTime)`
(chamada todo frame por `main.js`) decai `life` e remove quem morreu.

Duas funções "de composição" ficam no topo do arquivo e são o que o resto do
jogo chama pra marcar momentos importantes — **elas não são sistemas novos**,
só disparos maiores dos dois sistemas acima:

- `spawnDiceConfirmBurst(position)` — número do dado confirmado.
- `spawnLandingConfirmBurst(position)` — chegada na casa final (o efeito mais
  chamativo da sequência inteira).

Se quiser um efeito "maior"/"mais chamativo" em algum momento do jogo, o
padrão é aumentar a contagem passada pra `spawnConfetti`/`spawnBubbles` (ou
combinar os dois) dentro de uma dessas duas funções — não criar um sistema de
partícula novo.

## 10. Ambiente do fundo do mar (`createOceanEnvironment`, `js/scene.js`)

Tudo dentro de `environmentGroup`, gerado uma vez por partida:

- **Areia**: `PlaneGeometry` com vértices deslocados (relevo orgânico, ver
  `sandPositions.setZ`) + `createSandTexture()` (grão/manchas/fragmentos
  desenhados em canvas, não é uma cor lisa).
- **Pedras, corais, flores, conchas**: `InstancedMesh` pras pedras (1 draw
  call pra várias), grupos individuais pros demais. Todos nascem "em
  touceiras" — `generateClusterCenters()`/`jitterAroundCluster()` sorteiam
  centros e espalham em volta deles, em vez de distribuição uniforme, pra
  parecer recife natural. `randomEnvironmentSpot(radius)` evita nascer em
  cima do caminho (usa `getBoardRowCount` pra saber a área ocupada).
- **Algas**: cada alga é um `THREE.Group` (`seaweedGroup`) contendo a mesh do
  caule (`seaweed`). **A posição do peão de balanço vai no GRUPO, não na
  mesh** — isso é importante: o balanço (`animate()` em `main.js`, gira
  `child.rotation.z` do próprio `environmentGroup.children` que tiver
  `userData.swaySpeed`) rotaciona em torno da origem LOCAL do objeto. Se a
  posição estivesse só na mesh (como era antes desta rodada), o grupo ficaria
  na origem do mundo e toda alga balançaria em torno do **centro do mapa**,
  não da própria base — parecia "voar" longe do centro. Além disso, boa parte
  da haste nasce com Y negativo (enterrada, escondida pela areia) pra parecer
  uma planta comprida enraizada, não algo curto boiando.
- **Caranguejos**: `createCrabs()`/`updateCrabs(deltaTime, elapsed)`, array
  global `crabs` (`config.js`). Puro enfeite ambiente — andam sozinhos
  (parado → anda até um ponto aleatório → parado → repete), sem NENHUMA
  ligação com `gameState`, tabuleiro ou qualquer mecânica. Não é uma mecânica
  nova; é decoração animada, do mesmo jeito que a alga balança sozinha.

Contagens de decoração (`rockCount`, `seaweedCount`, `coralCount`,
`flowerCount`, `shellCount`, `crabCount`) são todas gateadas por
`isLowPowerDevice` (`config.js`) — números menores em aparelho fraco, sem
lógica nova: é o mesmo padrão que já existia pra qualidade de sombra/bloom.

## 11. Áudio (`js/audio.js`)

100% sintetizado via Web Audio API — sem arquivos `.mp3`/`.ogg`, então não há
carregamento assíncrono de áudio nem dependência de assets pra ter som.
Roteamento em 3 barramentos:

```
oscillator/noise -> sfxGain  \
oscillator (ambiente/chimes) -> musicGain -> masterGain -> destino
```

`initAudio()` cria o `AudioContext` (precisa de um gesto do usuário — por
isso é chamado no clique de vários botões, nunca automaticamente no
`init()`) e já dispara `startAmbientSound()` (2 drones graves + "respiração"
de volume via LFO manual + sininhos pentatônicos esparsos, tudo no
`musicGain`). Efeitos pontuais (`playDiceRollSound`, `playStepSound`,
`playCorrectSound`, `playIncorrectSound`, `playVictorySound`,
`playBubbleSound`, `playClickSound`, `playQuestionSound`) usam
`playTone`/`playNoise`, que aceitam um `bus` opcional (padrão `sfxGain`).
`setMasterVolume`/`setMusicVolume`/`setSfxVolume`/`toggleMute` são a única
API que o resto do jogo (`ui.js`) chama — o roteamento interno pode mudar
sem afetar ninguém de fora.

**Se um dia entrarem sons/músicas gravados** (arquivos em `assets/audio/`):
o ponto de entrada natural é trocar o corpo de uma função `play*Sound()`
específica pra usar `AudioBufferSourceNode` (carregando o arquivo com
`fetch` + `decodeAudioData`) em vez de `playTone`/`playNoise`, mantendo a
mesma assinatura e o mesmo barramento (`sfxGain`/`musicGain`) — o resto do
jogo não precisa saber a diferença.

## 12. Multiplayer P2P (`js/multiplayer.js`)

Arquitetura **host-autoritativo**: o host (sempre `id 0`) é quem decide tudo
(resultado do dado, resposta certa/errada, movimento) e distribui via
`broadcastToGuests()`. Convidados nunca decidem nada sozinhos — só mandam
pedidos (`roll_request`, `answer_request`) e aplicam o que o host manda
(`dice_result`, `pawn_move`, `turn_changed`, `question_show`,
`question_result`, `game_over`). `myPlayerId` (`config.js`) é o índice deste
cliente dentro de `gameState.players` — atribuído pelo host via
`assign_player` no momento em que o convidado entra na sala.

`peerjs.min.js` só é baixado (`loadPeerJsIfNeeded()`) quando alguém realmente
cria ou entra numa sala — nunca em solo/local.

## 13. Bots (`js/bots.js`)

- `botPlay()`: chamado (com atraso, `setTimeout(botPlay, 1500)` em
  `nextTurn()`) quando é a vez de um jogador `isBot`. Só chama `performRoll()`
  — o bot rola o dado exatamente como um humano rolaria, sem atalho.
- `botAnswerQuestion()`: decide certo/errado por `botDifficulty` (ver seção
  6), escolhe a alternativa correspondente, e responde depois de um atraso
  aleatório (900–2200ms) simulando "pensar" — chamando `handleQuestionAnswer`
  como se fosse um clique de verdade.

## 14. Peões / modelos 3D (`js/pawnBuilders.js`, `js/data/characters.js`)

`createCharacterPawn(colorHex, index, modelKey)` é o único ponto de entrada
que o resto do jogo usa pra montar um peão — ele nem sabe COMO o modelo é
construído por dentro. `CHARACTER_MODEL_KEY` (`characters.js`) escolhe qual
builder usar, registrado em `PAWN_BUILDERS`:

- **`'roster'`** (valor atual de `CHARACTER_MODEL_KEY`): cada jogador (por
  índice, 0-based) recebe um dos 4 personagens temáticos de
  `CHARACTER_ROSTER` (`pawnBuilders.js`) — Bob Esponja, Patrick, Lula Molusco,
  Sr. Siriguejo —, repetindo o ciclo se houver mais de 4 jogadores. Cada
  personagem é geometria pura (sem `.glb`/textura externa), portada do
  protótipo `external/visual/tokens.html`. A base de cada peão tem um disco
  na cor temática do personagem + um anel fino na cor de verdade do jogador
  (`charBaseRing`), pra dois jogadores com o mesmo personagem continuarem
  distinguíveis.
- **`'default'`**: o bonequinho redondo original (`buildDefaultPawn`), mais
  leve, mantido como fallback.

Todos os builders de personagem retornam um grupo "neutro" (posição sempre em
`0,0,0`, é isso que `scene.js` anima livremente) contendo um grupo interno
deslocado pra cima, pra base/pés ficarem colados no chão da casa igual ao
peão padrão — ver comentário no topo da seção "PERSONAGENS TEMÁTICOS" em
`pawnBuilders.js` antes de portar um personagem novo dessa forma. Pra
detalhes de como registrar um builder que carregue um `.glb` via `GLTFLoader`
(já vendorizado mas não usado por padrão), ver `docs/MODELOS-3D.md`.

## 15. Testes (`test/`)

- `test/mocks.js`: `loadGame(projectRoot)` monta um `vm.Context` com mocks de
  `THREE`/`document`/`gsap`/`localStorage`/`fetch`/etc. (`mockDeep` — um Proxy
  genérico que responde a qualquer propriedade/chamada — mais classes reais
  onde o estado mutável importa: `Vec3`, `Object3DMock`, `MeshMock`), executa
  TODOS os `js/*.js` reais nesse contexto (`GAME_FILES`) e devolve o sandbox.
  **Todo arquivo `.js` novo em `js/` precisa ser adicionado a `GAME_FILES`**,
  senão os testes não enxergam as funções dele.
- `test/run.js`: suíte de asserts (`node:assert/strict`) rodando com
  `node test/run.js` — sem navegador. Cobre regras de turno, movimento,
  ocupação de casas, validação de baralho, seleção de banco, o cálculo real
  de rotação do dado (carregando o `vendor/three.min.js` de verdade, não
  mockado, pra pegar bug de matriz/quaternion que um mock não pegaria) e
  carregamento de bancos via `fetch` mockado.
- **Não há testes de navegador de verdade** (Playwright/Cypress) — a
  verificação visual/interativa é manual. Scripts de fumaça ad-hoc (fora do
  repo, em `%TEMP%`) que instanciam a cena inteira via `loadGame()` já foram
  usados pra validar que `initThreeJS`→`createOceanEnvironment`→
  `createBoardCurve`→`createTiles`→`createPawns`→`createDice` roda sem
  exceção e produz contagens de objeto plausíveis; não fazem parte do reposi-
  tório porque não teriam como rodar num CI sem browser real de qualquer
  forma pro lado visual.

## 16. Pontos frágeis / cuidado ao mexer

- **`GAME_FILES` em `test/mocks.js`** precisa listar todo arquivo novo em
  `js/`, ou os testes vão falhar com "X is not defined" mesmo com o código
  certo.
- **`tileMeshes[i]`** precisa continuar alinhado 1:1 com o índice da casa —
  várias partes do código (`state.js`/`handleLanding`, `interaction.js`)
  fazem `tileMeshes[tileIndex]` diretamente. Se `createTiles()` mudar a ordem
  em que os objetos são criados/adicionados a esse array, isso quebra.
- **`TIMING` é a fonte única do ritmo** — não crie constantes de tempo soltas
  em outro arquivo pra dado/movimento/chegada. Se `showDiceRoll` e
  `performRoll` ficarem com números diferentes pro mesmo evento, a animação
  visual e a lógica de quando a próxima etapa começa saem de sincronia (o
  dado pode "acabar" de girar visualmente antes/depois do burst de
  confirmação disparar).
- **Balanço de objetos ambientais** (`userData.swaySpeed` lido em
  `animate()`) rotaciona em torno da origem LOCAL do objeto — qualquer novo
  elemento ambiente animado assim precisa ter sua posição no GRUPO/objeto
  que leva `userData.swaySpeed`, não numa mesh filha (ver seção 10, algas).
- **`rollInProgress`/`questionInProgress`** são a trava oficial (P2P-relevante)
  contra ação dupla — `gamePhase` é só informativo/defensivo por cima. Não
  remova as duas variáveis originais achando redundância com `gamePhase`.
- **Perguntas de bot com botões visíveis, porém desabilitados**: se um dia
  quiser permitir "assistir" a resposta de um bot sem que pareça uma
  pergunta jogável, é aqui (`askQuestion` em `questions.js`) que isso é
  decidido — não em CSS.
- **`environmentGroup` nunca é limpo** entre `createOceanEnvironment()` e uma
  chamada seguinte — os dois pontos que chamam essa função
  (`startGame`/`resumeSavedGame`, em `ui.js`) só acontecem uma vez por sessão
  de jogo (menu → partida), então isso é intencional/aceito, não um bug; só
  não chame `createOceanEnvironment()` mais de uma vez na mesma sessão sem
  limpar o grupo primeiro, ou a decoração dobra.

## 17. PWA / app instalável (`manifest.webmanifest`, `sw.js`)

O jogo pode ser "instalado" (Chrome/Edge/Android: menu → Instalar app; iOS
Safari: Compartilhar → Adicionar à Tela de Início), o que cria um ícone
próprio e abre em janela standalone (sem barra de endereço). Três peças:

- **`manifest.webmanifest`** (raiz): nome, cores de tema e os ícones
  (`assets/icons/icon-192.png` e `icon-512.png`, gerados proceduralmente —
  mesmo espírito de "sem depender de asset externo baixado" do resto do
  jogo). Linkado em `index.html` via `<link rel="manifest">`.
  `assets/icons/apple-touch-icon.png` cobre o caso do Safari/iOS, que ignora
  `manifest.webmanifest` pra esse fim.
- **`sw.js`** (raiz): service worker com cache-first + fallback pra rede pra
  qualquer request GET do próprio site — deixa o jogo abrir offline depois da
  primeira visita, sem manter uma lista própria de arquivos pra cachear (isso
  evitaria duplicar `GAME_FILES`/ordem de `<script>` em mais um lugar; ver
  seção 15/16).
- **Registro inline em `index.html`** (depois de `js/main.js`, fora de
  `js/`): `navigator.serviceWorker.register(...)`, guardado por
  `location.protocol.startsWith('http')`. Fica fora de `js/*.js` de propósito
  — não é lógica de jogo, então não precisa entrar em `GAME_FILES`
  (`test/mocks.js`).

**Só funciona servido por http(s)** (service worker exige isso; `localhost`
conta). Abrindo `index.html` direto (`file://`) o registro falha
silenciosamente (`.catch(() => {})`) e o jogo continua funcionando igual,
só sem a opção de instalar/offline — mesma degradação graciosa que os
bancos de perguntas via `fetch` (seção 6).

## 18. Melhorias futuras (fora do escopo desta rodada de finalização)

Itens que foram considerados mas propositalmente **não implementados** agora,
por serem mudanças grandes demais pra uma etapa de estabilização (ver
`CLAUDE.md` → "Regra de finalização"):

- Testes de navegador automatizados de ponta a ponta (Playwright/Cypress)
  cobrindo clique real na UI, não só lógica pura.
- Um sistema de áudio com amostras gravadas de verdade (hoje é 100%
  sintetizado) — o gancho pra isso já existe (`bus` opcional em
  `playTone`/`playNoise`), mas trocar todos os efeitos por arquivos é fora do
  escopo desta rodada.
- Modelos 3D importados (`.glb`/`.gltf`) pros personagens — `GLTFLoader` já
  está vendorizado, mas não usado; ver `docs/MODELOS-3D.md` pro caminho pra
  ativar isso quando houver modelos prontos.
- Mecânica nova de interação com os caranguejos ambientes (hoje são só
  decoração) — explicitamente fora de escopo pelo pedido original.
- Reduzir a orquestração de `performRoll()` (cadeia de `setTimeout`
  aninhados) pra uma versão baseada em `async`/`await` com a função `delay()`
  que já existe em `scene.js` — melhoraria legibilidade, mas é um refactor de
  um sistema que já funciona, então foi propositalmente deixado de fora desta
  rodada (ver regra de "não substituir sistema que já funciona").
