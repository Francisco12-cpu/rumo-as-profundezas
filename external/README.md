# /external — laboratório visual (área de rascunho, não faz parte do jogo)

Esta pasta existe **só** pra você produzir coisas fora do jogo e me pedir pra
integrar depois. Nada em `js/`, `index.html` ou `styles.css` lê ou depende
desta pasta — ela nunca é carregada pelo jogo em execução. Ela é puramente um
lugar de troca entre você e quem for integrar (eu, numa próxima sessão).

## Fluxo de trabalho

1. Você cria algo separado (HTML, CSS, SVG, textura, modelo 3D, animação, protótipo).
2. Coloca o arquivo na subpasta correspondente abaixo.
3. Pede pra integrar ("usa o que está em `external/models/personagem-novo.glb`").
4. Eu adapto e movo o que for necessário pra dentro da estrutura definitiva do projeto (`js/`, `data/`, `vendor/`, etc.).
5. Você testa.
6. O conteúdo desta pasta pode ser removido depois — ele nunca é o "original" de nada, só o ponto de entrada.

## Subpastas

- **`visual/`** — protótipos de HTML/CSS, composições, telas de referência, provas de conceito de layout.
- **`models/`** — modelos 3D (`.glb`/`.gltf` — ver `docs/MODELOS-3D.md` na raiz do projeto pra como um modelo vira um personagem no jogo).
- **`textures/`** — imagens pra usar como textura (sand, água, casas, etc.).
- **`ui/`** — mockups de interface (ícones, botões, telas) fora da engine.
- **`animations/`** — referências de animação (clipes `.glb` com animation clips, vídeos de referência, specs de timing).

## O que NÃO fazer aqui

- Não referencie esta pasta a partir de `index.html` ou de qualquer arquivo em `js/` — se algo daqui precisa aparecer no jogo, ele é **copiado** pra dentro da estrutura definitiva (`vendor/`, `data/`, `js/pawnBuilders.js`, etc.), não carregado diretamente daqui.
- Não deixe isso virar um segundo projeto — é só um ponto de entrega.
