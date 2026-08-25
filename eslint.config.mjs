// Config do ESLint (flat config, ESLint 9+).
//
// Contexto importante: js/*.js NÃO são módulos — são <script> clássicos
// carregados em sequência no index.html e compartilham UM ÚNICO escopo
// global de propósito (ex.: config.js declara `gameState`, `pawns`, `controls`
// etc. e todo o resto do jogo usa essas variáveis sem importar nada).
// Por isso "no-undef" fica desligado aqui: ele acusaria "erro" em praticamente
// toda função do jogo, quando na verdade é a arquitetura escolhida.
// Rode `npm install` uma vez antes de `npm run lint`.
export default [
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                requestAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                Blob: 'readonly',
                URL: 'readonly',
                Math: 'readonly',
                JSON: 'readonly',
                Promise: 'readonly',
                THREE: 'readonly',
                gsap: 'readonly',
                Peer: 'readonly',
            },
        },
        rules: {
            'no-undef': 'off', // ver explicação no topo do arquivo
            // vars: 'local' só verifica variáveis DENTRO de funções — variáveis/funções
            // de nível superior são "globais" de propósito nessa arquitetura (chamadas
            // de outros arquivos), então marcar todas como "não usada" seria só ruído.
            'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
            'no-redeclare': 'off', // vars top-level repetidas de propósito entre arquivos (ver config.js)
            eqeqeq: ['warn', 'smart'],
            'no-var': 'warn',
            'prefer-const': 'warn',
        },
    },
    {
        // config.js só DECLARA o estado global com `let`; quem reassina essas
        // variáveis são os outros arquivos (ex.: gameState = ... em ui.js).
        // prefer-const não enxerga isso e ficaria reclamando de tudo.
        files: ['js/config.js'],
        rules: {
            'prefer-const': 'off',
        },
    },
];
