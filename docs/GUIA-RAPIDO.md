# Guia rápido — tarefas comuns

Instruções práticas pra mexer no jogo sem precisar entender o código todo.
Pra modelos 3D em detalhe, ver `docs/MODELOS-3D.md`.

## Perguntas

**Adicionar uma pergunta a um banco existente**
Abra o `.json` em `data/questions/` (ex.: `banco-fundo-do-mar.json`), copie um
bloco de pergunta, cole e edite. Salvou, já está disponível — não precisa
mexer em código. Detalhes: `data/questions/README.md`.

**Criar um banco novo**
Duplique um `.json` de `data/questions/`, edite o conteúdo, e adicione uma
linha em `data/questions/manifest.json` apontando pro arquivo novo.

**Selecionar um banco específico / usar todos os bancos**
Na tela de configuração da partida (antes de "Começar"), o campo "Banco de
Perguntas" lista cada banco carregado, mais a opção "Todos os bancos
(aleatório)" — que sorteia perguntas misturando todos.

**Abrir o jogo sem servidor (`file://`) e os bancos não aparecem**
Esperado: navegadores bloqueiam esse tipo de carregamento de arquivo local
por segurança. O jogo cai automaticamente pro banco padrão embutido, sem
travar. Pra ver todos os bancos de `data/questions/`, sirva a pasta com
`npx serve .` (ou a extensão "Live Server" do VS Code) — ou use a tela
**Gerenciar Perguntas** do menu principal, que funciona sem servidor.

## Nome do jogo

Edite a constante `GAME_NAME` em `js/data/gameInfo.js` — é o único lugar.
Afeta o título da aba e o título do menu principal automaticamente.

## Modelos 3D / trocar um personagem

Ver `docs/MODELOS-3D.md` (passo a passo completo).

## Texturas / elementos visuais novos

1. Coloque o arquivo em `assets/textures/` (definitivo) ou `external/textures/`
   (se ainda for protótipo/rascunho).
2. Peça a integração indicando onde o arquivo deve ser usado (chão, casa, dado, etc.).
3. Depois de integrado, o arquivo definitivo fica em `assets/`.

## Protótipos visuais externos (HTML/CSS/SVG/animação)

Use a pasta `external/` como área de troca: crie o que quiser fora do jogo,
coloque na subpasta correspondente (`external/visual`, `external/ui`, etc.),
e peça pra integrar. Ver `external/README.md` pro fluxo completo. Depois de
integrado, o resultado final é movido pra dentro da estrutura definitiva do
projeto (`js/`, `assets/`, `styles.css`) — `external/` nunca é carregada pelo
jogo em execução.

**Integrar um HTML/CSS que você fez**: geralmente vira um novo bloco de
marcação em `index.html` + regras em `styles.css`, seguindo o mesmo padrão
dos outros modais/telas já existentes (classe `.modal-overlay`/`.modal-card`
pra pop-ups, ids em kebab-case, eventos ligados via `wireUpEventListeners()`
em `js/main.js` — nunca `onclick=` inline no HTML).

## Configurações do jogador

Áudio (volume geral/música/efeitos), idioma, qualidade gráfica e dificuldade
dos inimigos (chance de acerto dos bots) ficam todos no modal de
Configurações (ícone de engrenagem, canto superior esquerdo, em qualquer
tela).

## Ritmo da animação de uma jogada (dado → movimento → chegada)

Toda a cronometragem (quanto tempo o dado gira, pausa antes de mover, duração
de cada pulo entre casas, pausa antes/depois do efeito de chegada) vem de um
único lugar: o objeto `TIMING` em `js/config.js`. Pra deixar a sequência mais
rápida ou mais lenta, edite só os números ali — não crie uma constante nova
em outro arquivo. Detalhes de como a sequência inteira se encaixa:
`docs/ARQUITETURA.md`, seção 4.

## Dificuldade dos bots

`botDifficulty` (`js/config.js`, valores `0.5`/`0.75`/`1`) é a probabilidade
de um bot acertar cada pergunta — configurável em Configurações. Não existe
"marcar pergunta X como fácil pro bot Y"; é uma única chance global, pensada
pra testar o jogo com inimigos mais fracos ou mais fortes rapidamente.
