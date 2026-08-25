// ============ IDIOMA (PT-BR / EN) ============
// Cobre o "chrome" estático da interface (menu, telas, HUD, modais e as
// regras). Texto GERADO dinamicamente (alertas de erro, o conteúdo das
// perguntas do baralho, nomes de jogadores) continua só em português —
// traduzir automaticamente o conteúdo de um baralho que o usuário escreveu
// não faz sentido, e cobrir 100% dos alerts é um escopo bem maior que "ter
// uma opção de idioma".
const STRINGS = {
    pt: {
        menu_subtitle: 'Fundo do Mar - Bob Esponja',
        btn_resume: 'Continuar Partida',
        btn_solo: 'Novo Jogo Solo',
        btn_local: 'Modo Local',
        btn_host: 'Criar Sala P2P',
        btn_join: 'Entrar em Sala',
        btn_deck: 'Gerenciar Perguntas',
        btn_rules: 'Regras',

        setup_title: 'Configuração da Partida',
        label_board_size: 'Tamanho do Tabuleiro',
        opt_board_short: 'Curto (20 casas)',
        opt_board_medium: 'Médio (30 casas)',
        opt_board_long: 'Longo (40 casas)',
        opt_board_marathon: 'Maratona (50 casas)',
        label_num_players: 'Número de Jogadores',
        opt_players_1: '1 Jogador',
        opt_players_2: '2 Jogadores',
        opt_players_3: '3 Jogadores',
        opt_players_4: '4 Jogadores',
        label_num_bots: 'Bots Adicionais (Solo)',
        opt_bots_0: 'Nenhum',
        opt_bots_1: '1 Bot',
        opt_bots_2: '2 Bots',
        opt_bots_3: '3 Bots',
        label_question_bank: 'Banco de Perguntas',
        bank_all: 'Todos os bancos (aleatório)',
        bank_custom: 'Personalizado',
        label_colors: 'Cores dos Personagens',
        label_room_code: 'Código da Sala',
        btn_back: 'Voltar',
        btn_start: 'Começar',

        hud_leave: 'Sair',
        hud_camera: 'Mudar Câmera',
        hud_roll: 'Rolar Dado',
        hud_your_turn: 'SUA VEZ!',
        hud_room: 'Sala:',
        hud_copy: 'Copiar',

        deck_title: 'Gerenciador de Perguntas',
        deck_desc: 'Cole seu JSON de perguntas ou edite o existente. Salve para usar nas próximas partidas.',
        deck_save: 'Salvar Baralho',
        deck_default: 'Carregar Padrão',
        deck_export: 'Exportar JSON',
        btn_close: 'Fechar',

        docs_title: 'Regras do Jogo',
        docs_h_objective: 'Objetivo',
        docs_p_objective: 'Seja o primeiro a chegar à última casa respondendo perguntas e superando eventos especiais.',
        docs_h_flow: 'Fluxo da Rodada',
        docs_p_flow:
            '1. Clique em "Rolar Dado"<br>2. O dado gira e mostra um número (1-6)<br>3. Seu peão avança pelo tabuleiro<br>4. Responda a pergunta se cair em casa normal<br>5. Acertou? Bônus! Errou? Penalidade!',
        docs_h_special: 'Casas Especiais',
        docs_p_special:
            '<b>Avançar</b> - Avance 2 casas extras<br><b>Voltar</b> - Volte 2 casas<br><b>Pular Vez</b> - Próximo jogador perde a vez<br><b>Trocar</b> - Troque com o último colocado<br><b>Bônus 2x</b> - Pergunta vale o dobro',
        docs_h_p2p: 'Multiplayer P2P',
        docs_p_p2p:
            'O Host cria uma sala e compartilha o código. Convidados digitam o código para entrar. Conexão direta via WebRTC.',
        docs_h_json: 'Formato JSON',
        docs_h_notice: 'Aviso',
        docs_p_notice:
            'Este é um projeto de fã, feito sem fins comerciais, para uso pessoal. Bob Esponja e os personagens pertencem à Nickelodeon/Paramount — este jogo não tem qualquer afiliação oficial com eles.',

        join_title: 'Entrar em Sala P2P',
        join_desc: 'Digite o código da sala do Host.',
        btn_cancel: 'Cancelar',
        btn_join: 'Entrar',

        settings_title: 'Configurações',
        settings_audio: 'Áudio',
        settings_master: 'Volume Geral',
        settings_music: 'Música',
        settings_sfx: 'Efeitos',
        settings_language: 'Idioma',
        settings_video: 'Vídeo',
        settings_quality: 'Qualidade',
        settings_quality_auto: 'Automática',
        settings_quality_high: 'Alta',
        settings_quality_low: 'Leve',
        settings_quality_hint: 'Vale a partir da próxima partida ou ao recarregar a página.',
        settings_difficulty: 'Dificuldade',
        settings_bot_difficulty: 'Acerto dos inimigos',
        settings_difficulty_easy: 'Fácil (50%)',
        settings_difficulty_normal: 'Normal (75%)',
        settings_difficulty_hard: 'Difícil (100%)',
        settings_difficulty_hint: 'Chance de um inimigo (bot) acertar cada pergunta.',
    },
    en: {
        menu_subtitle: 'Under the Sea - SpongeBob',
        btn_resume: 'Resume Game',
        btn_solo: 'New Solo Game',
        btn_local: 'Local Mode',
        btn_host: 'Create P2P Room',
        btn_join: 'Join Room',
        btn_deck: 'Manage Questions',
        btn_rules: 'Rules',

        setup_title: 'Match Setup',
        label_board_size: 'Board Size',
        opt_board_short: 'Short (20 tiles)',
        opt_board_medium: 'Medium (30 tiles)',
        opt_board_long: 'Long (40 tiles)',
        opt_board_marathon: 'Marathon (50 tiles)',
        label_num_players: 'Number of Players',
        opt_players_1: '1 Player',
        opt_players_2: '2 Players',
        opt_players_3: '3 Players',
        opt_players_4: '4 Players',
        label_num_bots: 'Extra Bots (Solo)',
        opt_bots_0: 'None',
        opt_bots_1: '1 Bot',
        opt_bots_2: '2 Bots',
        opt_bots_3: '3 Bots',
        label_question_bank: 'Question Bank',
        bank_all: 'All banks (random)',
        bank_custom: 'Custom',
        label_colors: 'Character Colors',
        label_room_code: 'Room Code',
        btn_back: 'Back',
        btn_start: 'Start',

        hud_leave: 'Leave',
        hud_camera: 'Toggle Camera',
        hud_roll: 'Roll Dice',
        hud_your_turn: 'YOUR TURN!',
        hud_room: 'Room:',
        hud_copy: 'Copy',

        deck_title: 'Question Manager',
        deck_desc: 'Paste your questions JSON or edit the current one. Save it to use it in future games.',
        deck_save: 'Save Deck',
        deck_default: 'Load Default',
        deck_export: 'Export JSON',
        btn_close: 'Close',

        docs_title: 'Game Rules',
        docs_h_objective: 'Objective',
        docs_p_objective: 'Be the first to reach the last tile by answering questions and overcoming special events.',
        docs_h_flow: 'Turn Flow',
        docs_p_flow:
            '1. Click "Roll Dice"<br>2. The dice spins and shows a number (1-6)<br>3. Your pawn moves along the board<br>4. Answer the question if you land on a normal tile<br>5. Correct? Bonus! Wrong? Penalty!',
        docs_h_special: 'Special Tiles',
        docs_p_special:
            '<b>Advance</b> - Move 2 extra tiles<br><b>Back</b> - Move back 2 tiles<br><b>Skip Turn</b> - Next player loses their turn<br><b>Swap</b> - Swap places with whoever is last<br><b>2x Bonus</b> - Question is worth double',
        docs_h_p2p: 'P2P Multiplayer',
        docs_p_p2p:
            'The Host creates a room and shares the code. Guests type the code to join. Direct connection via WebRTC.',
        docs_h_json: 'JSON Format',
        docs_h_notice: 'Notice',
        docs_p_notice:
            'This is a non-commercial fan project made for personal use. SpongeBob and its characters belong to Nickelodeon/Paramount — this game has no official affiliation with them.',

        join_title: 'Join P2P Room',
        join_desc: "Enter the Host's room code.",
        btn_cancel: 'Cancel',
        btn_join: 'Join',

        settings_title: 'Settings',
        settings_audio: 'Audio',
        settings_master: 'Master Volume',
        settings_music: 'Music',
        settings_sfx: 'Sound Effects',
        settings_language: 'Language',
        settings_video: 'Video',
        settings_quality: 'Quality',
        settings_quality_auto: 'Automatic',
        settings_quality_high: 'High',
        settings_quality_low: 'Light',
        settings_quality_hint: 'Applies from the next game or page reload.',
        settings_difficulty: 'Difficulty',
        settings_bot_difficulty: 'Enemy accuracy',
        settings_difficulty_easy: 'Easy (50%)',
        settings_difficulty_normal: 'Normal (75%)',
        settings_difficulty_hard: 'Hard (100%)',
        settings_difficulty_hint: 'Chance of an enemy (bot) answering each question correctly.',
    },
};

let currentLang = (function loadSavedLang() {
    try {
        const saved = localStorage.getItem('trivia3d_lang');
        if (saved === 'pt' || saved === 'en') return saved;
    } catch (e) {}
    return 'pt';
})();

function t(key) {
    return (STRINGS[currentLang] && STRINGS[currentLang][key]) || STRINGS.pt[key] || key;
}

function applyTranslations() {
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'pt-BR';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.innerHTML = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('.settings-lang-btn').forEach((el) => {
        el.classList.toggle('active', el.getAttribute('data-lang') === currentLang);
    });
}

function setLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'pt';
    try {
        localStorage.setItem('trivia3d_lang', currentLang);
    } catch (e) {}
    applyTranslations();
}
