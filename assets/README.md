# /assets — conteúdo definitivo do jogo

Diferente de `/external` (área de rascunho/staging, nunca referenciada pelo
código), esta pasta é onde ficam os assets **já integrados** — modelos 3D,
texturas e áudio que o jogo realmente carrega em produção.

- `models/` — modelos 3D (`.glb`/`.gltf`) usados por personagens ou cenário.
- `textures/` — imagens usadas como textura em materiais.
- `audio/` — arquivos de áudio, se algum dia o jogo passar a usar samples
  gravados em vez de (ou além de) síntese via Web Audio API (ver `js/audio.js`).

Ver `docs/MODELOS-3D.md` na raiz do projeto pra como registrar um modelo novo.
