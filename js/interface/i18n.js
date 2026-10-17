// ============ IDIOMA (PT-BR / EN) ============
// Cobre o "chrome" estático da interface (menu, telas, HUD, modais e as
// regras). Texto GERADO dinamicamente (alertas de erro, o conteúdo das
// perguntas do baralho, nomes de jogadores) continua só em português —
// traduzir automaticamente o conteúdo de um baralho que o usuário escreveu
// não faz sentido, e cobrir 100% dos alerts é um escopo bem maior que "ter
// uma opção de idioma".
const STRINGS = {
    pt: {
        menu_subtitle: 'Um jogo de perguntas no fundo do mar',
        btn_resume: 'Continuar Partida',
        btn_solo: 'Novo Jogo',
        btn_local: 'Jogar com Amigos',
        btn_host: 'Criar Sala',
        btn_join: 'Entrar em Sala',
        btn_credits: 'Créditos',
        btn_online: 'Jogar Online',
        quick_sound: 'Som',
        quick_legend: 'O que cada casa faz',
        hud_leave_full: 'Sair da partida',
        hud_camera: 'Câmera',
        btn_deck: 'Perguntas',
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
        label_token_set: 'Sorteio entre',
        label_pick_character: 'Escolha seu personagem',
        opt_tokens_classic: 'Clássicos (Bob, Patrick...)',
        opt_tokens_new: 'Novos (Polvo, Estrela...)',
        opt_tokens_mixed: 'Misturados',
        label_colors: 'Cores dos Personagens',
        label_room_code: 'Código da Sala',
        btn_back: 'Voltar',
        btn_start: 'Começar',

        hud_leave: 'Sair',
        hud_camera_focus: '<span class="cam-label">Ver personagem</span>',
        hud_camera_overview: '<span class="cam-label">Ver tabuleiro</span>',
        hud_camera_fly: '<span class="cam-label">Voar</span>',
        hud_roll: 'Jogar o dado',
        victory_menu: 'Voltar ao menu',
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
        docs_p_objective: 'Chegue primeiro no baú do tesouro, na última casa, para ganhar!',
        docs_h_flow: 'Como jogar',
        docs_p_flow:
            '1. Quando for a sua vez, toque em <b>Jogar o dado</b>.<br>2. Seu personagem anda o número de casas do dado.<br>3. Aparece um cartão dizendo o que a casa faz. Leia e toque em <b>OK</b>.<br>4. Se tiver pergunta, escolha a resposta certa.<br>5. Acertou? Anda para frente. Errou? Volta um pouco.<br><br>Toque em qualquer casa para ver o que ela faz. Use <b>Ver personagem</b> e <b>Ver tabuleiro</b> para mudar a câmera. Para passear pelo fundo do mar, toque em <b>Voar</b> (no computador: WASD para andar, Espaço e Shift para subir e descer, arraste para olhar).',
        docs_h_special: 'Casas Especiais',
        docs_p_special:
            '<b>Corrente Rápida</b>: tem pergunta. Acertou? A corrente te leva 3 casas para frente.<br><b>Corrente Contrária</b>: volta 2 casas.<br><b>Água-viva</b>: o próximo jogador fica uma vez sem jogar.<br><b>Redemoinho</b>: tem pergunta. Errou? Troca de lugar com quem está mais atrás.<br><b>Pérola Bônus</b>: pergunta que vale o dobro.<br><br><b>Casas do cenário</b> (perto do que dá nome a elas):<br><b>Floresta de Algas</b>: errou? Fica preso e perde a próxima vez.<br><b>Vulcão de Bolhas</b>: acertou? As bolhas te empurram 2 casas a mais.<br><b>Navio Afundado</b>: acertou? Ganha 2 moedas a mais.<br><b>Âncora</b>: errou? A âncora te segura e você não volta.<br><br><b>Moedas</b>: pegue as moedas do caminho passando por elas, e ganhe 1 a cada pergunta certa. A cada 3 moedas você ganha uma <b>bolha protetora</b>: no próximo erro, ela te salva e você não sofre o castigo.',
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
        settings_quality_low: 'Baixa (mais leve)',
        settings_quality_medium: 'Média',
        settings_quality_hint: 'Vale a partir da próxima partida ou ao recarregar a página.',
        settings_difficulty: 'Dificuldade',
        settings_bot_difficulty: 'Acerto dos inimigos',
        settings_difficulty_easy: 'Fácil (50%)',
        settings_difficulty_normal: 'Normal (75%)',
        settings_difficulty_hard: 'Difícil (100%)',
        settings_difficulty_hint: 'Chance de um inimigo (bot) acertar cada pergunta.',
    },
    en: {
        menu_subtitle: 'A quiz game under the sea',
        btn_resume: 'Resume Game',
        btn_solo: 'New Game',
        btn_local: 'Play with Friends',
        btn_host: 'Create Room',
        btn_join: 'Join Room',
        btn_credits: 'Credits',
        btn_online: 'Play Online',
        quick_sound: 'Sound',
        quick_legend: 'What each tile does',
        hud_leave_full: 'Leave the match',
        hud_camera: 'Camera',
        btn_deck: 'Questions',
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
        label_token_set: 'Random from',
        label_pick_character: 'Pick your character',
        opt_tokens_classic: 'Classic (SpongeBob, Patrick...)',
        opt_tokens_new: 'New (Octopus, Starfish...)',
        opt_tokens_mixed: 'Mixed',
        label_colors: 'Character Colors',
        label_room_code: 'Room Code',
        btn_back: 'Back',
        btn_start: 'Start',

        hud_leave: 'Leave',
        hud_camera_focus: '<span class="cam-label">My character</span>',
        hud_camera_overview: '<span class="cam-label">Whole board</span>',
        hud_camera_fly: '<span class="cam-label">Fly</span>',
        hud_roll: 'Roll the dice',
        victory_menu: 'Back to menu',
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
        docs_p_objective: 'Be the first to reach the treasure chest on the last tile to win!',
        docs_h_flow: 'How to play',
        docs_p_flow:
            '1. On your turn, tap <b>Roll the dice</b>.<br>2. Your character moves that many tiles.<br>3. A card tells you what the tile does. Read it and tap <b>OK</b>.<br>4. If there is a question, pick the right answer.<br>5. Right? Move forward. Wrong? Move back a little.<br><br>Tap any tile to see what it does. Use <b>My character</b> and <b>Whole board</b> to move the camera. To explore the sea floor: drag with two fingers (or the right mouse button, or use arrows/WASD).',
        docs_h_special: 'Special Tiles',
        docs_p_special:
            '<b>Fast Current</b>: question. Right? The current carries you 3 tiles forward.<br><b>Back Current</b>: go back 2 tiles.<br><b>Jellyfish</b>: the next player loses a turn.<br><b>Whirlpool</b>: question. Wrong? Swap places with whoever is furthest behind.<br><b>Bonus Pearl</b>: the question is worth double.<br><br><b>Scenery tiles</b> (next to what names them):<br><b>Kelp Forest</b>: wrong? You get stuck and lose your next turn.<br><b>Bubble Volcano</b>: right? Bubbles push you 2 extra tiles.<br><b>Shipwreck</b>: right? You find 2 extra coins.<br><b>Anchor</b>: wrong? The anchor holds you, so you stay put.<br><br><b>Coins</b>: grab coins by walking over them, and get 1 for each right answer. Every 3 coins give you a <b>shield bubble</b>: it saves you from the next penalty.',
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
        settings_quality_low: 'Low (lighter)',
        settings_quality_medium: 'Medium',
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
    // innerHTML acima apaga os ícones SVG dos botões traduzidos: põe de volta.
    applyIcons();
}

function setLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'pt';
    try {
        localStorage.setItem('trivia3d_lang', currentLang);
    } catch (e) {}
    applyTranslations();
}
