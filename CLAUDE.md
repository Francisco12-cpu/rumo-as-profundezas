# CLAUDE.md — guia pra trabalhar neste projeto

Este arquivo é o ponto de entrada pra qualquer IA (ou pessoa) que vá mexer
neste projeto. Lendo ele + `docs/ARQUITETURA.md` você deve conseguir entender
quase todo o projeto sem precisar ler todo o código antes de começar.

## O que é o projeto

Jogo de tabuleiro 3D de perguntas e respostas ("Trivia 3D" — nome de
protótipo, ver seção "Nome do jogo"), tema fundo do mar/Bob Esponja. Roda
inteiro no navegador: Three.js pra 3D, GSAP pra animação, PeerJS pra
multiplayer P2P (WebRTC). **Sem build, sem servidor obrigatório** — dá pra
abrir `index.html` direto (duplo clique) e o jogo funciona (com uma exceção:
ver "Bancos de perguntas via `file://`" abaixo).

Documentação completa: `docs/ARQUITETURA.md` (arquitetura, sistemas, pontos
frágeis), `docs/GUIA-RAPIDO.md` (receitas de tarefas comuns),
`docs/MODELOS-3D.md` (como trocar/adicionar modelos 3D de personagem).
`claude.txt` na raiz é o **brief criativo original** do projeto (arquivo
único via CDN) — a arquitetura real divergiu dele desde então (multi-arquivo,
bibliotecas vendorizadas); trate-o como histórico, não como documentação
atual.

## Regra mais importante: não é um projeto "greenfield"

Este projeto já passou por várias rodadas de desenvolvimento e tem sistemas
que **funcionam e foram testados**. Ao receber um pedido:

1. **Não mude a lógica principal do jogo sem necessidade.** Se um pedido pode
   ser atendido só com CSS, com um ajuste de dado/config, ou com uma
   função nova que não toca no que já existe, prefira isso a reescrever algo
   que já funciona.
2. **Não substitua um sistema que já funciona só porque você faria diferente.**
   Se a implementação atual atende ao pedido, melhore-a incrementalmente.
   Reescrever do zero é um custo real (risco de regressão) que precisa se
   justificar pelo pedido, não pela sua preferência de estilo.
3. **Se precisar mexer na implementação interna, preserve o comportamento
   observável.** Um refactor interno é aceitável; mudar o que o jogador vê
   sem que isso tenha sido pedido, não.
4. **Mudanças grandes viram sugestão, não implementação.** Se um pedido, bem
   interpretado, exigiria uma mudança grande de arquitetura ou de mecânica,
   documente a ideia (ex.: numa seção "melhorias futuras" de
   `docs/ARQUITETURA.md`) em vez de implementar por conta própria — a menos
   que o pedido seja explicitamente "faça essa mudança grande".

Essas regras valem sempre, mas foram especialmente reforçadas numa rodada de
"finalização" do projeto (ver histórico de commits) cujo objetivo era: mesma
lógica, menos bugs, mais polimento visual/animação, melhor documentação,
maior estabilidade — sem virar outro jogo.

## Arquitetura em uma tela

- **`index.html`**: estrutura de todas as telas (menu, setup, HUD, modais) +
  ordem de carregamento dos `<script>` (importa! ver `docs/ARQUITETURA.md`
  seção 2).
- **`styles.css`**: todo o CSS (sem CSS-in-JS, sem pré-processador).
- **`js/data/*.js`**: conteúdo puro (tipos de casa, cores, forma do
  caminho, faces do dado, nome do jogo). Sem lógica de execução.
- **`js/config.js`**: `TIMING` (ritmo da animação — fonte única de verdade),
  `GAME_PHASE`, e todo o estado global mutável (`gameState`, `pawns`,
  `cameraMode`, volumes de áudio, `botDifficulty`, etc.).
- **Os demais `js/*.js`**: comportamento, um sistema por arquivo (cena 3D,
  câmera, áudio, partículas, interação de toque, perguntas, bots,
  multiplayer, UI, laço principal). Todos compartilham o mesmo escopo global
  — é assim de propósito (ver `docs/ARQUITETURA.md` seção 1).
- **`data/questions/*.json`**: bancos de perguntas (conteúdo, não código).
- **`assets/`**: modelos/texturas/áudio **definitivos** que o jogo carrega.
  **`external/`**: área de rascunho/protótipo pra arquivos ainda não
  integrados — nunca é lida pelo jogo em execução. Ver `external/README.md`.
- **`test/`**: suíte de testes sem navegador (`node test/run.js`).

## Fluxo de uma jogada (o sistema mais sensível do projeto)

`performRoll()` em `js/ui.js` orquestra: dado gira → resultado confirmado →
câmera foca o personagem → personagem parado um instante → pula casa por casa
→ chega → pausa → efeito de chegada → pausa → efeito da casa → pergunta (se
houver). Cada pausa/duração vem de `TIMING` (`js/config.js`) — **é o único
lugar onde ajustar ritmo**. Regras que não podem quebrar:

- A pergunta nunca aparece durante o giro do dado ou o movimento do peão.
- O personagem nunca teletransporta — sempre pula casa por casa
  (`movePlayerAlongPath` em `js/scene.js`).
- Até 4 peões podem estar na mesma casa sem se sobrepor (sistema de ocupação
  em `js/scene.js`, ver `docs/ARQUITETURA.md` seção 5).

Ver `docs/ARQUITETURA.md` seção 4 pro diagrama completo da sequência.

## Como rodar / testar

```bash
npm install        # só a primeira vez (eslint + prettier, sem dependência de runtime)
npm test            # roda a suíte de testes (sem navegador)
npm run lint         # ESLint
npm run format:check # Prettier (checar sem alterar)
npm run format        # Prettier (alterar)
```

Pra testar o jogo de verdade num navegador: abra `index.html` direto
(funciona pra quase tudo) ou sirva a pasta (`npx serve .`, ou a extensão
"Live Server" do VS Code) se quiser testar o carregamento de múltiplos bancos
de perguntas via `fetch` (bloqueado em `file://`, com fallback automático pro
banco padrão embutido — ver `docs/ARQUITETURA.md` seção 6).

**Não há testes de navegador automatizados** (Playwright/Cypress) — a
verificação visual/interativa é manual. Antes de reportar uma mudança visual
ou de animação como concluída, se você tiver acesso a um navegador de
verdade, abra o jogo e teste o caminho principal, não só rode
`node test/run.js`.

## Como modificar sem quebrar

- **Adicionou um arquivo `.js` novo em `js/`?** Adicione o caminho dele em
  `GAME_FILES` (`test/mocks.js`) e em `index.html` (na posição certa da
  ordem de carregamento — ver `docs/ARQUITETURA.md` seção 2), senão os
  testes e o jogo real não vão enxergar as funções dele.
- **Mudou algo visual/de animação?** Rode `node test/run.js` (garante que a
  lógica não quebrou) e, se possível, abra no navegador e veja de verdade —
  os testes não cobrem renderização.
- **Mudou uma duração/pausa da sequência de jogada?** Mexa só em `TIMING`
  (`js/config.js`) — não crie uma constante nova em outro arquivo.
- **Adicionou uma casa especial nova?** Edite só `js/data/tileTypes.js`
  (`TILE_TYPES` + `SPECIAL_TILE_TYPE_IDS`) e o `switch` em
  `handleLanding()` (`js/state.js`) pro efeito dela. O desenho da casa, o
  painel de informação e o texto de regras já leem de `TILE_TYPES`
  automaticamente.
- **Adicionou uma pergunta ou um banco?** Não precisa de código — edite/
  duplique um `.json` em `data/questions/` e (pra banco novo) adicione uma
  linha em `data/questions/manifest.json`. Ver `docs/GUIA-RAPIDO.md`.
- **Vai adicionar um asset (modelo/textura/áudio)?** Se ainda for rascunho,
  em `external/<categoria>/`; se for definitivo e já for pra integrar, em
  `assets/<categoria>/`. Não force o uso de um asset que não se encaixa no
  estilo/tema atual — analise se cabe antes de usar. Ver
  `docs/GUIA-RAPIDO.md` e `external/README.md`.
- **Sempre rode antes de finalizar uma mudança:**
  `npm test && npm run lint && npm run format:check` — os três devem passar
  limpos (0 falhas, 0 warnings, 0 diffs de formatação).

## Nome do jogo

`GAME_NAME` em `js/data/gameInfo.js` é o **único** lugar onde o nome do jogo é
definido (ainda é um nome de protótipo). Afeta título da aba e cabeçalho do
menu automaticamente via `applyGameName()` (`js/main.js`). Nunca hard-code o
nome do jogo em outro lugar.

## Decisões de arquitetura que valem a pena conhecer

- **Escopo global compartilhado em vez de ES modules**: deliberado, pra
  manter "abre e roda" sem bundler. Não sugira migrar pra módulos sem que
  isso seja pedido — é uma reescrita grande de baixo valor imediato.
  `no-undef`/`no-redeclare` estão desligados no ESLint por causa disso, com
  comentário explicando.
- **Host-autoritativo no P2P**: o host decide tudo, convidados só pedem e
  aplicam. Não adicione lógica que deixe um convidado decidir algo
  localmente (resultado de dado, resposta certa/errada) — quebra a
  sincronização.
- **`rollInProgress`/`questionInProgress` vs. `gamePhase`**: as duas
  primeiras são a trava oficial contra ação dupla (inclusive P2P);
  `gamePhase` é informativo/defensivo por cima. Não remova nenhuma achando
  redundância.
- **Dados/áudio 100% procedurais/sintetizados**: texturas de areia, dado,
  peão e todo o áudio são gerados em código (canvas/Web Audio), não
  carregados de arquivo. Isso é o que permite o jogo funcionar sem nenhum
  asset externo. Adicionar assets reais é aditivo (ver seção "Como
  modificar"), não uma substituição obrigatória.

## O que evitar

- Não crie um sistema de partículas/áudio/câmera novo quando dá pra
  amplificar ou reaproveitar o que já existe (ver `docs/ARQUITETURA.md`
  seções 9 e 11 pro padrão certo).
- Não escreva comentários explicando O QUE o código faz (nomes já
  dizem isso) — só o PORQUÊ, quando não for óbvio (uma decisão de design, um
  workaround, uma invariante escondida). É o padrão usado em todo o projeto.
- Não use `git push --force`, `--no-verify`, ou rebase interativo sem pedido
  explícito.
- Não commite segredos, chaves, ou dados pessoais — o jogo não usa nenhum
  backend/API key por padrão; se isso mudar no futuro, use variáveis de
  ambiente/arquivo ignorado pelo git, nunca hard-code.
