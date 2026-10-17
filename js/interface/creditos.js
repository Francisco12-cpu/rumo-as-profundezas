// ============================================================
// TELA DE CRÉDITOS (botão "Créditos" no menu)
// ============================================================
// Os nomes vêm de data/creditos.json — pra pôr mais gente, é só acrescentar
// uma entrada em "pessoas" (nome, papel, instagram). Aberto direto do
// arquivo (file://) o navegador bloqueia a leitura do JSON; aí vale a cópia
// embutida abaixo (mantenha as duas iguais, como o banco de perguntas padrão).
const DEFAULT_CREDITS = {
    titulo: 'Créditos',
    subtitulo: 'Quem fez o Rumo às Profundezas',
    pessoas: [{ nome: 'Francisco Audir', papel: 'Criação, ideia e testes', instagram: '' }],
    agradecimento: 'Obrigado por jogar!',
};
const CREDIT_COLORS = ['#ffd740', '#ff80ab', '#69f0ae', '#40c4ff', '#b388ff', '#ff9e40'];
let creditsData = null;

async function loadCredits() {
    if (creditsData) return creditsData;
    try {
        const res = await fetch('data/creditos.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        creditsData = normalizeCredits(await res.json());
    } catch (e) {
        creditsData = normalizeCredits(DEFAULT_CREDITS);
    }
    return creditsData;
}

// Aceita o JSON escrito à mão com campos faltando: sem nome, a pessoa é
// pulada; instagram aceita "@fulano", "fulano" ou o link inteiro.
function normalizeCredits(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const pessoas = (Array.isArray(data.pessoas) ? data.pessoas : [])
        .filter((p) => p && typeof p.nome === 'string' && p.nome.trim())
        .map((p) => ({
            nome: p.nome.trim(),
            papel: typeof p.papel === 'string' ? p.papel.trim() : '',
            instagram: cleanInstagram(p.instagram),
        }));
    return {
        titulo: typeof data.titulo === 'string' && data.titulo.trim() ? data.titulo.trim() : DEFAULT_CREDITS.titulo,
        subtitulo: typeof data.subtitulo === 'string' ? data.subtitulo.trim() : '',
        pessoas: pessoas.length ? pessoas : DEFAULT_CREDITS.pessoas.map((p) => Object.assign({}, p)),
        agradecimento: typeof data.agradecimento === 'string' ? data.agradecimento.trim() : '',
    };
}

function cleanInstagram(value) {
    if (typeof value !== 'string') return '';
    let v = value.trim();
    const m = v.match(/instagram\.com\/([^/?#]+)/i);
    if (m) v = m[1];
    v = v.replace(/^@/, '');
    return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : '';
}

function initialsOf(name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

async function openCredits() {
    initAudio();
    const modal = document.getElementById('credits-modal');
    modal.classList.remove('hidden');
    playBubbleSound();
    const data = await loadCredits();
    document.getElementById('credits-title').textContent = data.titulo;
    document.getElementById('credits-subtitle').textContent = data.subtitulo;
    document.getElementById('credits-thanks').textContent = data.agradecimento;
    document.getElementById('credits-list').innerHTML = data.pessoas
        .map((p, i) => {
            const color = CREDIT_COLORS[i % CREDIT_COLORS.length];
            const insta = p.instagram
                ? '<a class="credit-insta" href="https://instagram.com/' +
                  encodeURIComponent(p.instagram) +
                  '" target="_blank" rel="noopener">@' +
                  escapeHtml(p.instagram) +
                  '</a>'
                : '';
            return (
                '<li class="credit-card" style="--cor:' +
                color +
                ';--atraso:' +
                (0.12 + i * 0.12).toFixed(2) +
                's">' +
                '<span class="credit-avatar">' +
                escapeHtml(initialsOf(p.nome)) +
                '</span>' +
                '<span class="credit-text"><b>' +
                escapeHtml(p.nome) +
                '</b>' +
                (p.papel ? '<small>' + escapeHtml(p.papel) + '</small>' : '') +
                insta +
                '</span></li>'
            );
        })
        .join('');
}

// Menu: "Jogar Online" abre/fecha as opções Criar Sala e Entrar em Sala.
function toggleOnlineMenu() {
    const row = document.getElementById('menu-online');
    const btn = document.getElementById('btn-online');
    const open = row.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('aberto', open);
    playBubbleSound();
}

function closeCredits() {
    document.getElementById('credits-modal').classList.add('hidden');
}
