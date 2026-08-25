# Rumo às Profundezas

Jogo de tabuleiro 3D de perguntas e respostas, tema fundo do mar (inspirado em
Bob Esponja), feito com Three.js, GSAP e PeerJS. Roda inteiro no navegador —
sem build, sem servidor obrigatório, sem backend.

> O nome do jogo vem de `GAME_NAME` em `js/data/gameInfo.js` — é o único
> lugar que precisa mudar pra trocar (título da aba + cabeçalho do menu). Se
> trocar, atualize também o `<title>` e as tags Open Graph/Twitter estáticas
> no topo de `index.html` — crawlers de link preview (WhatsApp, Discord etc.)
> não executam JS, então não pegam o nome de `GAME_NAME` em runtime.

## Rodando o jogo

Não precisa instalar nada pra jogar:

1. Baixe/clone este repositório.
2. Abra `index.html` direto no navegador (duplo clique funciona).

Isso já cobre praticamente tudo. A única diferença ao servir a pasta com um
servidor estático (ex. `npx serve .`, ou a extensão "Live Server" do VS Code)
é que o jogo consegue carregar múltiplos bancos de perguntas de
`data/questions/*.json` — abrindo direto do arquivo (`file://`), o navegador
bloqueia esse carregamento por segurança, e o jogo cai automaticamente pro
banco de perguntas padrão embutido, sem travar.

## Como jogar

- **Solo (vs. bots)**, **Local (passa e joga)**, ou **Sala P2P** (multiplayer
  via WebRTC, sem servidor — um jogador cria a sala e compartilha um código,
  os demais entram com esse código).
- Role o dado, ande casa por casa pelo tabuleiro, responda perguntas nas casas
  de pergunta, use os efeitos das casas especiais (avançar, voltar, pular a
  vez, trocar de lugar, pergunta em dobro).
- Configurações (ícone de engrenagem): volume, idioma (PT/EN), qualidade
  gráfica, e a dificuldade dos inimigos (chance de acerto dos bots: 50% / 75%
  / 100%).

## Tecnologias

- **Three.js** (r128, vendorizado em `vendor/`) — cena 3D, tabuleiro, dado,
  personagens, ambiente.
- **GSAP** — todas as animações de câmera, dado e movimento.
- **PeerJS** (WebRTC) — multiplayer P2P, carregado só quando alguém cria/entra
  numa sala.
- **Web Audio API** — todo o áudio é sintetizado em código, sem arquivos de
  som.
- Sem framework de UI, sem build step, sem dependência de runtime além das
  bibliotecas acima (todas vendorizadas localmente — o jogo funciona
  offline).

## Estrutura do projeto

```
index.html          Telas, modais, ordem de carregamento dos scripts
styles.css           Todo o CSS
js/data/             Conteúdo puro (tipos de casa, cores, dado, caminho)
js/config.js          Estado global + TIMING (ritmo das animações)
js/*.js               Um sistema por arquivo (cena 3D, câmera, áudio,
                       partículas, interação, perguntas, bots, multiplayer, UI)
data/questions/       Bancos de perguntas (JSON)
assets/                Modelos/texturas/áudio definitivos
external/               Área de rascunho pra assets ainda não integrados
test/                   Suíte de testes sem navegador
docs/                   Documentação técnica detalhada
vendor/                 Bibliotecas de terceiros (vendorizadas)
```

Documentação completa da arquitetura (o que cada sistema faz, como se
comunicam, onde mexer pra cada tipo de mudança, pontos frágeis): ver
[`docs/ARQUITETURA.md`](docs/ARQUITETURA.md). Receitas rápidas de tarefas
comuns (adicionar pergunta, trocar modelo 3D, etc.): ver
[`docs/GUIA-RAPIDO.md`](docs/GUIA-RAPIDO.md). Guia pra colaboração com IA
(Claude Code ou outra): ver [`CLAUDE.md`](CLAUDE.md).

## Desenvolvimento

```bash
npm install           # instala eslint + prettier (dev only, sem dependência de runtime)
npm test               # roda a suíte de testes (node test/run.js, sem navegador)
npm run lint            # ESLint
npm run format:check     # Prettier — checa formatação sem alterar
npm run format            # Prettier — aplica formatação
```

Não há testes de navegador automatizados (Playwright/Cypress) — a
verificação visual/interativa é manual, abrindo `index.html` num navegador.

## Estado do projeto

Protótipo funcional e jogável, em desenvolvimento contínuo. Ver
[`docs/ARQUITETURA.md`](docs/ARQUITETURA.md#17-melhorias-futuras-fora-do-escopo-desta-rodada-de-finalização)
pra melhorias futuras já mapeadas mas ainda não implementadas.
