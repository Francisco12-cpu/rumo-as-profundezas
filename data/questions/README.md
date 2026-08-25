# Bancos de perguntas

Cada arquivo `.json` nesta pasta é um banco de perguntas independente. O jogo
carrega todos os bancos listados em `manifest.json` quando abre, e você
escolhe (na tela de configuração da partida) se quer usar **um banco
específico** ou **todos misturados**.

## Adicionar uma pergunta a um banco existente

1. Abra o `.json` do banco (ex.: `banco-fundo-do-mar.json`) em qualquer editor de texto.
2. Copie um bloco de pergunta inteiro (de `{` até `}`) e cole logo depois dele, separado por vírgula.
3. Edite os campos (veja a referência abaixo).
4. Salve o arquivo. Não precisa mexer em nenhum código — na próxima vez que o jogo carregar, a pergunta já está disponível.

## Criar um banco novo

1. Duplique um dos `.json` existentes.
2. Troque `nomeBaralho`, `descricao` e as `perguntas`.
3. Adicione uma linha em `manifest.json` apontando pro novo arquivo:
   ```json
   { "id": "meu-banco", "arquivo": "meu-banco.json" }
   ```
4. Pronto — ele passa a aparecer na lista de bancos do jogo.

## Referência de cada pergunta

```json
{
  "id": 1,
  "categoria": "Nome da categoria (aparece na tela da pergunta)",
  "tipo": "multipla_escolha",
  "pergunta": "O texto da pergunta.",
  "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "respostaCorreta": 0,
  "tempoSegundos": 15,
  "efeitoCasa": { "acerto": "avancar_1", "erro": "voltar_1" }
}
```

- `tipo`: `"multipla_escolha"` (use 2 a 4 opções) ou `"verdadeiro_falso"` (use exatamente `["Verdadeiro", "Falso"]`).
- `respostaCorreta`: o índice da opção certa dentro de `opcoes`, começando em **0**.
- `tempoSegundos`: quanto tempo o jogador tem pra responder.
- `efeitoCasa.acerto`/`efeitoCasa.erro`: o que acontece ao acertar/errar — valores aceitos: `avancar_1`, `avancar_2`, `jogar_novamente`, `nenhum` (pra acerto); `voltar_1`, `voltar_2`, `nenhum` (pra erro).

O campo `efeitosCasasAtivos` (na raiz do arquivo, não em cada pergunta) é opcional e controla quais casas especiais podem aparecer no tabuleiro quando esse banco está ativo. Pode remover o campo inteiro pra usar todos os tipos.

## Se um banco tiver um erro

O jogo valida cada arquivo ao carregar. Se um `.json` estiver malformado ou
com uma pergunta inválida, **só aquele banco é ignorado** (com um aviso no
console do navegador dizendo qual arquivo e qual o problema) — os outros
bancos continuam funcionando normalmente.

## Importante: abrir o jogo direto do arquivo (sem servidor)

Se você abrir o `index.html` clicando duas vezes (sem servidor local), o
navegador pode bloquear o carregamento desses arquivos `.json` por segurança
(restrição de CORS para `file://`). Nesse caso o jogo detecta isso
automaticamente e cai de volta para um banco padrão embutido no código, sem
travar — mas você só vai ver **os bancos desta pasta** se servir a pasta por
um servidor local simples, por exemplo:

```
npx serve .
```

ou a extensão "Live Server" do VS Code. Isso é só pra carregar os arquivos —
o jogo em si continua sem precisar de backend/build.

Alternativa sem servidor nenhum: use a tela **Gerenciar Perguntas** do menu
principal pra colar/editar um baralho direto pela interface (ele fica salvo
no navegador e também aparece como uma opção "Personalizado" na lista de bancos).
