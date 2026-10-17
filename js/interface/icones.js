// ============================================================
// ÍCONES (SVG próprios, sem emoji)
// ============================================================
// Um conjunto só, no mesmo estilo (traço arredondado de 24x24, temas do
// fundo do mar), usado em três lugares:
//   - HTML: iconSvg('dado') devolve o <svg> pronto (cor = currentColor);
//     elementos com data-icon="dado" recebem o ícone em applyIcons();
//   - canvas: drawIcon(ctx, 'seta', x, y, tamanho, cor) — números das casas;
//   - CSS: nada a fazer, o <svg> herda cor e tamanho do botão.
// Cada ícone é uma lista de partes: { d, fill } — fill = parte preenchida
// (pérola, pontos do dado), senão é traço.
const ICONS = {
    pergunta: [{ d: 'M8.8 9a3.3 3.3 0 1 1 4.9 2.9c-1 .55-1.7 1.25-1.7 2.4v.7' }, { d: 'M12 18.6h.01', w: 3 }],
    seta: [{ d: 'M6 12.5l6-6 6 6' }, { d: 'M6 18.5l6-6 6 6' }],
    'seta-volta': [{ d: 'M6 11.5l6 6 6-6' }, { d: 'M6 5.5l6 6 6-6' }],
    'agua-viva': [
        { d: 'M4.5 12a7.5 7 0 0 1 15 0z' },
        { d: 'M8 12v4.5c0 1.2-1 1.8-1 3' },
        { d: 'M12 12v7.5' },
        { d: 'M16 12v4.5c0 1.2 1 1.8 1 3' },
    ],
    redemoinho: [{ d: 'M12.6 12a1.3 1.3 0 0 1-2.6 0 2.8 2.8 0 0 1 5.6 0 4.6 4.6 0 0 1-9.2 0 6.4 6.4 0 0 1 12.8 0' }],
    perola: [
        { d: 'M3.5 11.5a8.5 7 0 0 1 17 0z' },
        { d: 'M3.5 14.5h17c-1.2 4.6-15.8 4.6-17 0z' },
        { d: 'M12 13m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0', fill: true },
        { d: 'M8 11.5V7.6M12 11.5V5.3M16 11.5V7.6' },
    ],
    alga: [
        { d: 'M8 21c-2.2-4 2-6 0-10s1.2-6 1-8' },
        { d: 'M15 21c2-4-2-7 1-11s-.2-6 0-7' },
        { d: 'M11.5 21c0-3 1.2-5 0-8' },
    ],
    vulcao: [
        { d: 'M3 20.5h18l-5.5-11h-7z' },
        { d: 'M10.2 9.5c-1.2-2 .2-4 1-5.5' },
        { d: 'M13.8 9.5c.8-2 2.6-2.6 2.2-5' },
    ],
    navio: [{ d: 'M3 14.5h18l-3 5.5H6z' }, { d: 'M11 14.5V3.5' }, { d: 'M11 4.5l7 7.5h-7' }],
    ancora: [
        { d: 'M12 8v13' },
        { d: 'M12 5.5m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0' },
        { d: 'M8 11h8' },
        { d: 'M4.5 14.5c0 3.6 3.4 6.5 7.5 6.5s7.5-2.9 7.5-6.5' },
    ],
    'cavalo-marinho': [
        { d: 'M14 4.2a3 3 0 0 1 1.6 4.9l-1.7 2.2a4.2 4.2 0 0 1 .4 4.8c-1 1.9-3.4 2.6-4.8 1.6-1.2-.9-1-2.6.3-2.9' },
        { d: 'M15.4 6.1l4.1-.6' },
        { d: 'M10.8 10.6l-2.3 1.3 2.2 1.2' },
        { d: 'M13.2 6.4h.01', w: 3 },
    ],
    camera: [
        { d: 'M4 8.5h3.2l1.6-2.5h6.4l1.6 2.5H20v10.5H4z' },
        { d: 'M12 13.8m-3.3 0a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0-6.6 0' },
    ],
    portal: [{ d: 'M4.5 21v-9a7.5 7.5 0 0 1 15 0v9' }, { d: 'M8.5 21v-8.5a3.5 3.5 0 0 1 7 0V21' }],
    bau: [{ d: 'M3.5 11h17v9h-17z' }, { d: 'M3.5 11a8.5 5.5 0 0 1 17 0' }, { d: 'M12 12.5v3.5' }, { d: 'M3.5 15h17' }],
    moeda: [
        { d: 'M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0' },
        { d: 'M12 12m-4.6 0a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0-9.2 0' },
    ],
    bolha: [{ d: 'M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0' }, { d: 'M7.8 10.2a4.6 4.6 0 0 1 3.6-3.4' }],
    dado: [
        { d: 'M5 3.5h14a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z' },
        { d: 'M8.3 8.3m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0', fill: true },
        { d: 'M12 12m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0', fill: true },
        { d: 'M15.7 15.7m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0', fill: true },
    ],
    alvo: [
        { d: 'M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0' },
        { d: 'M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0', fill: true },
        { d: 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3' },
    ],
    mapa: [{ d: 'M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z' }, { d: 'M9 4v13.5' }, { d: 'M15 6.5V20' }],
    voar: [
        { d: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z' },
        { d: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0' },
    ],
    ajustes: [
        { d: 'M4 6.5h9M17.5 6.5H20M4 12h3M11.5 12H20M4 17.5h11M19.5 17.5H20' },
        { d: 'M15.3 6.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0' },
        { d: 'M9.3 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0' },
        { d: 'M17.3 17.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0' },
    ],
    som: [{ d: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z' }, { d: 'M15.5 9a4 4 0 0 1 0 6' }, { d: 'M18 6.5a7.5 7.5 0 0 1 0 11' }],
    mudo: [{ d: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z' }, { d: 'M16 9.5l5 5M21 9.5l-5 5' }],
    sair: [{ d: 'M14 4h5.5v16H14' }, { d: 'M10 8l-4 4 4 4' }, { d: 'M6 12h10' }],
    ok: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }],
    fechar: [{ d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }],
    estrela: [{ d: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z' }],
    trofeu: [
        { d: 'M8 4h8v5.5a4 4 0 0 1-8 0z' },
        { d: 'M8 6H5.5a2.8 2.8 0 0 0 2.8 3.8M16 6h2.5a2.8 2.8 0 0 1-2.8 3.8' },
        { d: 'M12 13.5V17M8.5 20.5h7M10 17h4v3.5h-4z' },
    ],
    jogar: [{ d: 'M8 5.5v13l10-6.5z' }],
    grupo: [
        { d: 'M9 9m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0' },
        { d: 'M3.5 19.5a5.5 5.5 0 0 1 11 0' },
        { d: 'M16.5 8.5m-2.3 0a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0' },
        { d: 'M16 13.5a4.5 4.5 0 0 1 4.5 4.5' },
    ],
    rede: [
        { d: 'M6 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0' },
        { d: 'M18 6m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0' },
        { d: 'M18 18m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0' },
        { d: 'M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6' },
    ],
    entrar: [{ d: 'M10 4H4.5v16H10' }, { d: 'M14 8l4 4-4 4' }, { d: 'M18 12H8' }],
    cartas: [
        { d: 'M7 4.5h9a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 16 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5z' },
        { d: 'M18.5 7.5l1 .3a1.5 1.5 0 0 1 1 1.8l-2.6 9.6' },
        { d: 'M10 10.5a1.6 1.6 0 1 1 2.4 1.4c-.5.3-.9.6-.9 1.2' },
    ],
    livro: [
        { d: 'M4 5.5c3-1 5.5-1 8 .5v14c-2.5-1.5-5-1.5-8-.5z' },
        { d: 'M20 5.5c-3-1-5.5-1-8 .5v14c2.5-1.5 5-1.5 8-.5z' },
    ],
    continuar: [{ d: 'M5 5.5v13l8-6.5z' }, { d: 'M14 5.5v13M18 5.5v13' }],
    subir: [{ d: 'M12 19V5' }, { d: 'M6 11l6-6 6 6' }],
    descer: [{ d: 'M12 5v14' }, { d: 'M6 13l6 6 6-6' }],
    copiar: [{ d: 'M9 9h10v11H9z' }, { d: 'M5 15V4.5h10' }],
    voltar: [{ d: 'M15 5l-7 7 7 7' }],
    peixe: [
        { d: 'M3 12c3.5-5 10-6 14 0-4 6-10.5 5-14 0z' },
        { d: 'M17 12l4-3.5v7z' },
        { d: 'M8 11m-.9 0a.9.9 0 1 0 1.8 0a.9.9 0 1 0-1.8 0', fill: true },
    ],
};

const ICON_STROKE = 2.2;

function iconSvg(id, extraClass) {
    const parts = ICONS[id];
    if (!parts) return '';
    const paths = parts
        .map((p) =>
            p.fill
                ? `<path d="${p.d}" fill="currentColor" stroke="none"/>`
                : `<path d="${p.d}"${p.w ? ` stroke-width="${p.w}"` : ''}/>`
        )
        .join('');
    return (
        `<svg class="icon${extraClass ? ' ' + extraClass : ''}" viewBox="0 0 24 24" aria-hidden="true" ` +
        `fill="none" stroke="currentColor" stroke-width="${ICON_STROKE}" stroke-linecap="round" stroke-linejoin="round">` +
        paths +
        '</svg>'
    );
}

// Preenche todo elemento com data-icon="id" (o ícone entra antes do texto).
function applyIcons(root) {
    const base = root || document;
    const list = Array.from(base.querySelectorAll('[data-icon]'));
    if (base.getAttribute && base.getAttribute('data-icon')) list.push(base);
    list.forEach((el) => {
        const id = el.getAttribute('data-icon');
        const old = el.querySelector(':scope > svg.icon');
        if (old) old.remove();
        el.insertAdjacentHTML('afterbegin', iconSvg(id));
    });
}

// Desenha o ícone num canvas 2D, centrado em (cx, cy), com o tamanho dado.
function drawIcon(ctx, id, cx, cy, size, color, lineWidth) {
    const parts = ICONS[id];
    if (!parts || typeof Path2D === 'undefined') return;
    const k = size / 24;
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(k, k);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    parts.forEach((p) => {
        const path = new Path2D(p.d);
        if (p.fill) ctx.fill(path);
        else {
            ctx.lineWidth = p.w || lineWidth || ICON_STROKE;
            ctx.stroke(path);
        }
    });
    ctx.restore();
}
