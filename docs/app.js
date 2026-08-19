// ---------- state ----------
const state = {
  selectedId: 1,
  activeFilter: 'all',
  image: null,
  video: null,
  padding: 64,
  radius: 14,
  bgMode: 'solid',
  bgColor: '#1c1c1f',
  gradientIdx: 0,
  scale: 2,
  ratio: 'free',
  zoom: 1,
  panX: 0,
  panY: 0,
  tabName: '',
  format: 'png',
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
};

const BG_SOLID_OPTIONS = ['#0d0d0f', '#1c1c1f', '#f5f5f7', '#eef2ff', '#101b14', '#2a1414', '#0f1a2d', '#f7f2e8',
  '#2d2d30', '#3a3a40', '#4a4a50', '#5a5a60', '#6a6a70', '#7a7a80', '#8a8a90', '#9a9aa0',
  '#aaaaa8', '#babab0', '#cacab8', '#dadad0',
  '#1a1a3a', '#0a2a1a', '#2a0a1a', '#1a2a3a', '#3a2a1a', '#0a2a3a'];
const RATIO_OPTIONS = { free: null, '1:1': 1, '4:3': 4/3, '16:9': 16/9, '3:2': 3/2, '21:9': 21/9 };

const BG_GRADIENT_OPTIONS = [
  ['#6d5ef8', '#241f4d'],
  ['#3aa0e6', '#0d1b2a'],
  ['#34c77b', '#0d1b14'],
  ['#e6503a', '#2a1414'],
  ['#c9873a', '#241708'],
  ['#a56df8', '#1b0f1f'],
];
const FRAME_ACCENT_COLORS = ['#e8e8ea', '#111114', '#f3ede3', '#0f1a14', '#1a1420', '#101820', '#241213', '#12211f',
  '#d4d4d8', '#a8a8b0', '#7c7c88', '#505060',
  '#4062e6', '#34c77b', '#e6503a', '#c9873a', '#a56df8', '#3aa0e6', '#2ec9b0', '#e65ea0',
  '#ff6600', '#ffcc00', '#00cc88', '#ff4488', '#4488ff', '#ff00ff', '#00ffcc', '#ffaa44',
  '#8a5cf5', '#f472b6', '#34d399', '#60a5fa', '#fb923c', '#fbbf24', '#a78bfa', '#22d3ee'];

function frameById(id) { return ALL_FRAMES.find(f => f.id === id); }

// ---------- SVG chrome renderers ----------
// Each returns an SVG string sized to (w,h) with the chrome + an <image> or placeholder body
// placeholder=true -> tiny gallery tile (no image, decorative body)
// placeholder=false -> full stage render (image included if present)

function escapeXML(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderMac(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(26, h * 0.14);
  const dotR = Math.max(3, barH * 0.14);
  const dotsY = barH / 2;
  const isMono = f.variant === 'mono';
  const dotColors = isMono ? [f.accent, f.text + '55', f.text + '33'] : ['#ff5f57', '#febc2e', '#28c840'];
  let dots = '';
  [0,1,2].forEach((i) => {
    dots += `<circle cx="${18 + i*(dotR*2.6)}" cy="${dotsY}" r="${dotR}" fill="${dotColors[i]}"/>`;
  });
  const body = placeholder
    ? `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
       <rect x="12" y="${barH+12}" width="${w*0.5|0}" height="6" rx="3" fill="${f.accent}" opacity="0.7"/>
       <rect x="12" y="${barH+26}" width="${w*0.7|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.18"/>
       <rect x="12" y="${barH+38}" width="${w*0.4|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.12"/>`
    : (imgHref
        ? (() => {
            const iw = w|0, ih = Math.max(0, h - barH)|0;
            const cx = iw/2, cy = barH + ih/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="0" y="${barH}" width="${w|0}" height="${ih}"/></clipPath>
           <rect x="0" y="${barH}" width="${w|0}" height="${ih}" fill="${f.body}"/>
           <image href="${imgHref}" x="0" y="${barH}" width="${w|0}" height="${ih}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>`;
          })()
        : `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>`);
  return `
    <rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    ${dots}
    ${body}
  `;
}

function renderBrowser(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(34, h * 0.16);
  const dotR = Math.max(3, barH * 0.11);
  const single = f.variant === 'single';
  const dots = `<circle cx="18" cy="${barH*0.32}" r="${dotR}" fill="#ff5f57"/>
          <circle cx="${18+dotR*2.6}" cy="${barH*0.32}" r="${dotR}" fill="#febc2e"/>
          <circle cx="${18+dotR*5.2}" cy="${barH*0.32}" r="${dotR}" fill="#28c840"/>`;
  const urlBarY = barH * 0.55;
  const urlBarH = barH * 0.4;
  const urlBar = `<rect x="16" y="${urlBarY}" width="${Math.max(0,w-32)|0}" height="${urlBarH|0}" rx="${urlBarH/2}" fill="${f.text}" opacity="0.08"/>
    <circle cx="${34}" cy="${urlBarY+urlBarH/2}" r="${urlBarH*0.18}" fill="none" stroke="${f.text}" stroke-opacity="0.35" stroke-width="1.4"/>
    <text x="52" y="${urlBarY+urlBarH*0.68}" font-family="monospace" font-size="${urlBarH*0.42}" fill="${f.text}" opacity="0.5">${escapeXML(state?.tabName || f.url||'')}</text>`;
  const tabs = !single ? `<rect x="16" y="6" width="${w*0.22}" height="${barH*0.42}" rx="6" fill="${f.text}" opacity="0.1"/>` : '';

  const body = placeholder
    ? `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
       <rect x="12" y="${barH+12}" width="${w*0.5|0}" height="6" rx="3" fill="${f.accent}" opacity="0.7"/>
       <rect x="12" y="${barH+26}" width="${w*0.7|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.18"/>`
    : (imgHref
        ? (() => {
            const iw = w|0, ih = Math.max(0, h - barH)|0;
            const cx = iw/2, cy = barH + ih/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="0" y="${barH}" width="${w|0}" height="${ih}"/></clipPath>
           <rect x="0" y="${barH}" width="${w|0}" height="${ih}" fill="${f.body}"/>
           <image href="${imgHref}" x="0" y="${barH}" width="${w|0}" height="${ih}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>`;
          })()
        : `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>`);

  return `
    <rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    ${tabs}
    ${dots}
    ${urlBar}
    ${body}
  `;
}

function renderTerminal(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(26, h * 0.13);
  const withDots = f.variant === 'dots';
  const dotR = Math.max(3, barH * 0.14);
  const dots = withDots
    ? `<circle cx="18" cy="${barH/2}" r="${dotR}" fill="#ff5f57"/>
       <circle cx="${18+dotR*2.6}" cy="${barH/2}" r="${dotR}" fill="#febc2e"/>
       <circle cx="${18+dotR*5.2}" cy="${barH/2}" r="${dotR}" fill="#28c840"/>`
    : `<text x="16" y="${barH*0.68}" font-family="monospace" font-size="${barH*0.42}" fill="${f.text}" opacity="0.6">●●●</text>`;
  const promptLine = `<text x="14" y="${barH+22}" font-family="monospace" font-size="13" fill="${f.accent}">${escapeXML(state?.tabName || f.prompt||'$')}</text>`;

  const body = placeholder
    ? `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
       <text x="12" y="${barH+22}" font-family="monospace" font-size="11" fill="${f.accent}">${escapeXML(((state?.tabName || f.prompt)||'$').slice(0,14))}</text>
       <rect x="12" y="${barH+34}" width="${w*0.5|0}" height="5" rx="1" fill="${f.text}" opacity="0.3"/>
       <rect x="12" y="${barH+46}" width="${w*0.35|0}" height="5" rx="1" fill="${f.text}" opacity="0.2"/>`
    : (imgHref
        ? (() => {
            const ix = 16, iw = Math.max(0, w - 32)|0, iy = barH + 34, ih = Math.max(0, h - barH - 50)|0;
            const cx = ix + iw/2, cy = iy + ih/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}"/></clipPath>
           <rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
           <image href="${imgHref}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>
           ${promptLine}`;
          })()
        : `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>${promptLine}`);

  return `
    <rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    ${dots}
    ${body}
  `;
}

function renderEditor(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(28, h * 0.12);
  const withSidebar = f.variant === 'sidebar';
  const sideW = withSidebar ? w * 0.16 : 0;
  const dotR = Math.max(3, barH * 0.13);
  const dots = `<circle cx="16" cy="${barH/2}" r="${dotR}" fill="#ff5f57"/>
    <circle cx="${16+dotR*2.4}" cy="${barH/2}" r="${dotR}" fill="#febc2e"/>
    <circle cx="${16+dotR*4.8}" cy="${barH/2}" r="${dotR}" fill="#28c840"/>`;
  const fileName = state?.tabName || f.file||'';
  const fileTab = `<rect x="${w/2-60}" y="6" width="120" height="${barH*0.55}" rx="5" fill="${f.text}" opacity="0.08"/>
    <text x="${w/2}" y="${6+barH*0.55*0.68}" font-family="monospace" font-size="${barH*0.32}" fill="${f.text}" text-anchor="middle" opacity="0.65">${escapeXML(fileName)}</text>`;
  const sidebar = withSidebar
    ? `<rect x="0" y="${barH}" width="${sideW}" height="${h-barH}" fill="${f.text}" opacity="0.04"/>
       <rect x="12" y="${barH+16}" width="${sideW-24}" height="4" rx="2" fill="${f.text}" opacity="0.25"/>
       <rect x="12" y="${barH+28}" width="${sideW-36}" height="4" rx="2" fill="${f.text}" opacity="0.18"/>
       <rect x="12" y="${barH+40}" width="${sideW-30}" height="4" rx="2" fill="${f.text}" opacity="0.18"/>`
    : '';

  const gutterW = 28;
  const body = placeholder
    ? `<rect x="${sideW}" y="${barH}" width="${Math.max(0,w-sideW)|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
       <rect x="${(sideW+gutterW+8)|0}" y="${barH+10}" width="${w*0.4|0}" height="5" rx="2" fill="${f.accent}" opacity="0.7"/>
       <rect x="${(sideW+gutterW+8)|0}" y="${barH+22}" width="${w*0.3|0}" height="5" rx="2" fill="${f.text}" opacity="0.25"/>
       <rect x="${(sideW+gutterW+8)|0}" y="${barH+34}" width="${w*0.45|0}" height="5" rx="2" fill="${f.text}" opacity="0.2"/>`
    : (imgHref
        ? (() => {
            const iw = Math.max(0, w - sideW)|0, ih = Math.max(0, h - barH)|0;
            const cx = sideW + iw/2, cy = barH + ih/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="${sideW}" y="${barH}" width="${iw}" height="${ih}"/></clipPath>
           <rect x="${sideW}" y="${barH}" width="${iw}" height="${ih}" fill="${f.body}"/>
           <image href="${imgHref}" x="${sideW}" y="${barH}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>`;
          })()
        : `<rect x="${sideW}" y="${barH}" width="${Math.max(0,w-sideW)|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>`);

  return `
    <rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    ${dots}
    ${fileTab}
    ${sidebar}
    ${body}
  `;
}

function renderPhone(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const notchType = f.variant;
  const r = w * 0.11;
  const body = placeholder
    ? `<rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>
       <rect x="${w*0.12|0}" y="${h*0.18|0}" width="${w*0.76|0}" height="6" rx="3" fill="${f.accent}" opacity="0.7"/>
       <rect x="${w*0.12|0}" y="${h*0.28|0}" width="${w*0.6|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.2"/>`
    : (imgHref
        ? (() => {
            const cx = w/2, cy = h/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="0" y="0" width="${w|0}" height="${h|0}" rx="${r}"/></clipPath>
           <image href="${imgHref}" x="0" y="0" width="${w|0}" height="${h|0}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>`;
          })()
        : `<rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>`);

  const notch = notchType === 'island'
    ? `<rect x="${w/2 - w*0.13}" y="${h*0.025}" width="${w*0.26}" height="${h*0.032}" rx="${h*0.016}" fill="${f.bar}"/>`
    : `<path d="M ${w/2 - w*0.19} 0 Q ${w/2 - w*0.19} ${h*0.045} ${w/2 - w*0.14} ${h*0.045} L ${w/2 + w*0.14} ${h*0.045} Q ${w/2 + w*0.19} ${h*0.045} ${w/2 + w*0.19} 0 Z" fill="${f.bar}"/>`;

  const bw = Math.max(0, w-2)|0, bh = Math.max(0, h-2)|0;
  return `
    <clipPath id="outer${f.id}"><rect x="0" y="0" width="${w|0}" height="${h|0}" rx="${r}"/></clipPath>
    <g clip-path="url(#outer${f.id})">
      ${body}
      ${notch}
    </g>
    <rect x="1" y="1" width="${bw}" height="${bh}" rx="${r}" fill="none" stroke="${f.bar}" stroke-width="3"/>
  `;
}

function renderTablet(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const r = w * 0.045;
  const body = placeholder
    ? `<rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>
       <rect x="${w*0.08|0}" y="${h*0.2|0}" width="${w*0.5|0}" height="6" rx="3" fill="${f.accent}" opacity="0.7"/>
       <rect x="${w*0.08|0}" y="${h*0.32|0}" width="${w*0.7|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.18"/>
       <rect x="${w*0.08|0}" y="${h*0.42|0}" width="${w*0.4|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.15"/>`
    : (imgHref
        ? (() => {
            const cx = w/2, cy = h/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="0" y="0" width="${w|0}" height="${h|0}" rx="${r}"/></clipPath>
           <image href="${imgHref}" x="0" y="0" width="${w|0}" height="${h|0}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>`;
          })()
        : `<rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}"/>`);
  const camY = f.variant === 'landscape' ? h/2 : h*0.03;
  const camX = f.variant === 'landscape' ? w*0.015 : w/2;
  const bw = Math.max(0, w-4)|0, bh = Math.max(0, h-4)|0;
  return `
    <clipPath id="outer${f.id}"><rect x="0" y="0" width="${w|0}" height="${h|0}" rx="${r}"/></clipPath>
    <g clip-path="url(#outer${f.id})">${body}</g>
    <rect x="2" y="2" width="${bw}" height="${bh}" rx="${r}" fill="none" stroke="${f.bar}" stroke-width="8"/>
    <circle cx="${camX}" cy="${camY}" r="${Math.min(w,h)*0.012}" fill="${f.bar}"/>
  `;
}

function renderWindows(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const classic = f.variant === 'classic';
  const barH = classic ? Math.max(30, h * 0.13) : Math.max(26, h * 0.11);
  const dotR = Math.max(3, barH * 0.13);
  const titleY = barH * 0.62;
  const titleSize = Math.max(9, barH * 0.35);

  const r = Math.min(8, w * 0.03);
  let titleBar;
  if (classic) {
    const btnW = barH * 0.55;
    const btnGap = 3;
    titleBar = `
      <rect x="3" y="3" width="${w-6|0}" height="${barH-6|0}" fill="none" stroke="${f.text}" stroke-opacity="0.15" stroke-width="${Math.max(1,barH*0.06)}"/>
      <rect x="${barH*0.3}" y="${(barH-dotR*2)/2}" width="${dotR*2}" height="${dotR*2}" fill="${f.accent}" rx="1"/>
      <text x="${barH*1.2}" y="${titleY}" font-family="monospace" font-size="${titleSize}" fill="${f.text}" font-weight="bold">${escapeXML(state?.tabName || f.title||'Untitled')}</text>
      <rect x="${w-btnW*3-btnGap*2-6|0}" y="${(barH-btnW)/2|0}" width="${btnW|0}" height="${btnW|0}" fill="#c0c0c0" stroke="#000" stroke-width="0.5"/>
      <rect x="${w-btnW*2-btnGap-6|0}" y="${(barH-btnW)/2|0}" width="${btnW|0}" height="${btnW|0}" fill="#c0c0c0" stroke="#000" stroke-width="0.5"/>
      <rect x="${w-btnW-6|0}" y="${(barH-btnW)/2|0}" width="${btnW|0}" height="${btnW|0}" fill="#c0c0c0" stroke="#000" stroke-width="0.5"/>
      <rect x="${w-btnW*3-btnGap*2-6+2|0}" y="${(barH-btnW)/2+2|0}" width="${btnW-4|0}" height="${(btnW-4)/2|0}" fill="#000" opacity="0.4"/>
      <rect x="${w-btnW*2-btnGap-6+2|0}" y="${(barH-btnW)/2+2|0}" width="${btnW-4|0}" height="${(btnW-4)/2|0}" fill="#000" opacity="0.4"/>
      <line x1="${w-btnW-6+3}" y1="${(barH-btnW)/2+3}" x2="${w-btnW-6+btnW-5}" y2="${barH-(barH-btnW)/2-3}" stroke="#000" stroke-width="1.5"/>
    `;
  } else {
    titleBar = `
      <text x="${w/2}" y="${titleY}" font-family="-apple-system,Segoe UI,sans-serif" font-size="${titleSize}" fill="${f.text}" text-anchor="middle" font-weight="600">${escapeXML(state?.tabName || f.title||'Untitled')}</text>
    `;
  }

  const body = placeholder
    ? `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
       <rect x="14" y="${barH+14}" width="${w*0.45|0}" height="6" rx="3" fill="${f.accent}" opacity="0.5"/>
       <rect x="14" y="${barH+28}" width="${w*0.6|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.12"/>
       ${classic ? `<rect x="14" y="${barH+42}" width="${w*0.35|0}" height="5" rx="2.5" fill="${f.text}" opacity="0.08"/>` : ''}`
    : (imgHref
        ? (() => {
            const iw = w|0, ih = Math.max(0, h - barH)|0;
            const cx = iw/2, cy = barH + ih/2;
            const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
            return `<clipPath id="clip${f.id}"><rect x="0" y="${barH}" width="${w|0}" height="${ih}"/></clipPath>
           <rect x="0" y="${barH}" width="${w|0}" height="${ih}" fill="${f.body}"/>
           <image href="${imgHref}" x="0" y="${barH}" width="${w|0}" height="${ih}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${f.id})"${t}/>`;
          })()
        : `<rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>`);

  if (classic) {
    return `
      <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
      ${titleBar}
      <rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
      ${body}
      <rect x="0" y="0" width="${w|0}" height="${h|0}" fill="none" stroke="${f.bar}" stroke-opacity="0.3" stroke-width="2"/>
    `;
  }
  return `
    <rect x="0" y="0" width="${w|0}" height="${h|0}" fill="${f.body}" rx="${r}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}" rx="${r}"/>
    <rect x="0" y="${barH*0.5}" width="${w|0}" height="${barH*0.5}" fill="${f.bar}"/>
    ${titleBar}
    <rect x="0" y="${barH}" width="${w|0}" height="${Math.max(0,h-barH)|0}" fill="${f.body}"/>
    ${body}
    <rect x="1" y="1" width="${w-2|0}" height="${h-2|0}" rx="${r}" fill="none" stroke="${f.text}" stroke-opacity="0.1" stroke-width="1"/>
  `;
}

function renderGaming(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(32, Math.round(h * 0.09));
  const fs = Math.round(barH * 0.45);
  const title = f.title || 'GAME';
  const ih = Math.max(0, h - barH - 4);
  const cx = w/2, cy = barH + ih/2;
  const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
  let content;
  if (placeholder) {
    content = `<rect x="14" y="${barH+14}" width="${w*0.4}" height="6" rx="3" fill="${f.accent}" opacity="0.5"/>
      <rect x="14" y="${barH+28}" width="${w*0.5}" height="5" rx="2.5" fill="${f.text}" opacity="0.12"/>`;
  } else if (imgHref) {
    content = `<image href="${imgHref}" x="0" y="${barH}" width="${w|0}" height="${ih|0}" preserveAspectRatio="xMidYMid slice"${t}/>`;
  } else {
    content = '';
  }
  return `
    <rect width="${w|0}" height="${h|0}" fill="${f.body}" rx="10"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}" rx="10"/>
    <rect x="0" y="${barH*0.3}" width="${w|0}" height="${barH}" fill="${f.bar}"/>
    <text x="${barH*0.6}" y="${Math.round(barH*0.62)}" font-family="monospace" font-size="${fs}" fill="${f.accent}" font-weight="bold">▶ ${escapeXML(title)}</text>
    <rect x="0" y="${barH}" width="${w|0}" height="${ih|0}" fill="${f.body}"/>
    ${content}
    <linearGradient id="rgbg" x1="0" y1="0" x2="${w|0}" y2="0">
      <stop offset="0%" stop-color="#ff0066"/><stop offset="25%" stop-color="#00ff88"/>
      <stop offset="50%" stop-color="#4488ff"/><stop offset="75%" stop-color="#ff00ff"/>
      <stop offset="100%" stop-color="#ff0066"/>
    </linearGradient>
    <rect x="0" y="${h-4}" width="${w|0}" height="4" fill="url(#rgbg)"/>
  `;
}

function renderGitHub(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(30, Math.round(h * 0.09));
  const tabH = Math.max(22, Math.round(h * 0.055));
  const fs = Math.round(barH * 0.4);
  const ts = Math.round(tabH * 0.45);
  const title = f.title || 'user/repo';
  const startH = barH + tabH;
  const ih = Math.max(0, h - startH);
  const cx = w/2, cy = startH + ih/2;
  const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
  let content;
  if (placeholder) {
    content = `<rect x="14" y="${startH+14}" width="${w*0.35}" height="6" rx="3" fill="${f.accent}" opacity="0.4"/>
      <rect x="14" y="${startH+26}" width="${w*0.55}" height="5" rx="2.5" fill="${f.text}" opacity="0.1"/>`;
  } else if (imgHref) {
    content = `<image href="${imgHref}" x="0" y="${startH}" width="${w|0}" height="${ih|0}" preserveAspectRatio="xMidYMid slice"${t}/>`;
  } else {
    content = '';
  }
  return `
    <rect width="${w|0}" height="${h|0}" fill="${f.body}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    <text x="14" y="${Math.round(barH*0.62)}" font-family="monospace" font-size="${fs}" fill="${f.text}" font-weight="600">${escapeXML(title)}</text>
    <text x="${w-14}" y="${Math.round(barH*0.62)}" font-family="sans-serif" font-size="${Math.round(fs*0.7)}" fill="${f.accent}" text-anchor="end">★ Star</text>
    <rect x="0" y="${barH}" width="${w|0}" height="${tabH|0}" fill="${f.body}" stroke="${f.text}" stroke-opacity="0.06" stroke-width="1"/>
    <text x="14" y="${Math.round(barH+tabH*0.6)}" font-family="sans-serif" font-size="${ts}" fill="${f.accent}" font-weight="600">Code</text>
    <text x="${14+ts*5}" y="${Math.round(barH+tabH*0.6)}" font-family="sans-serif" font-size="${ts}" fill="${f.text}" opacity="0.5">Issues</text>
    <text x="${14+ts*12}" y="${Math.round(barH+tabH*0.6)}" font-family="sans-serif" font-size="${ts}" fill="${f.text}" opacity="0.5">Pull requests</text>
    <rect x="0" y="${startH}" width="${w|0}" height="${ih|0}" fill="${f.body}"/>
    ${content}
  `;
}

function renderYouTube(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(32, Math.round(h * 0.08));
  const fs = Math.round(barH * 0.4);
  const title = f.title || 'Video Title';
  const ih = Math.max(0, h - barH);
  const cx = w/2, cy = ih/2;
  const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
  let content;
  if (placeholder) {
    content = `<rect x="${w/2-30}" y="${ih/2-20}" width="60" height="40" rx="8" fill="${f.accent}" opacity="0.6"/>
      <polygon points="${w/2-12},${ih/2-8} ${w/2-12},${ih/2+8} ${w/2+8},${ih/2}" fill="${f.body}"/>`;
  } else if (imgHref) {
    content = `<image href="${imgHref}" x="0" y="0" width="${w|0}" height="${ih|0}" preserveAspectRatio="xMidYMid slice"${t}/>`;
  } else {
    content = '';
  }
  return `
    <rect width="${w|0}" height="${h|0}" fill="#000" rx="8"/>
    <rect x="0" y="0" width="${w|0}" height="${ih|0}" fill="${f.body}"/>
    ${content}
    <rect x="0" y="${ih}" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    <rect x="10" y="${ih+barH*0.2}" width="${barH*0.5}" height="${barH*0.6}" rx="2" fill="${f.text}" opacity="0.8"/>
    <polygon points="${10+barH*0.15},${ih+barH*0.3} ${10+barH*0.15},${ih+barH*0.7} ${10+barH*0.4},${ih+barH*0.5}" fill="${f.bar}"/>
    <text x="${barH*0.7}" y="${Math.round(ih+barH*0.62)}" font-family="sans-serif" font-size="${fs}" fill="${f.text}">${escapeXML(title)}</text>
    <text x="${w-14}" y="${Math.round(ih+barH*0.62)}" font-family="monospace" font-size="${Math.round(fs*0.7)}" fill="${f.text}" opacity="0.5" text-anchor="end">0:00 / 3:45</text>
  `;
}

function renderAds(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(20, Math.round(h * 0.05));
  const fs = Math.round(barH * 0.5);
  const title = f.title || 'Sponsored';
  const ih = Math.max(0, h - barH);
  const cx = w/2, cy = barH + ih/2;
  const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
  let content;
  if (placeholder) {
    content = `<rect x="${w*0.25}" y="${barH+ih*0.3}" width="${w*0.5}" height="${ih*0.2}" rx="4" fill="${f.accent}" opacity="0.3"/>
      <rect x="${w*0.3}" y="${barH+ih*0.55}" width="${w*0.4}" height="5" rx="2.5" fill="${f.text}" opacity="0.1"/>`;
  } else if (imgHref) {
    content = `<image href="${imgHref}" x="0" y="${barH}" width="${w|0}" height="${ih|0}" preserveAspectRatio="xMidYMid slice"${t}/>`;
  } else {
    content = '';
  }
  return `
    <rect width="${w|0}" height="${h|0}" fill="${f.body}" rx="${Math.min(4, w*0.02)}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}"/>
    <text x="${w-10}" y="${Math.round(barH*0.62)}" font-family="sans-serif" font-size="${fs}" fill="${f.text}" opacity="0.4" text-anchor="end">${escapeXML(title)}</text>
    <rect x="0" y="${barH}" width="${w|0}" height="${ih|0}" fill="${f.body}"/>
    ${content}
  `;
}

function renderGlass(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(22, Math.round(h * 0.07));
  const dotR = Math.max(3, barH * 0.18);
  const fs = Math.round(barH * 0.4);
  const title = f.title || 'glass';
  const ih = Math.max(0, h - barH);
  const cx = w/2, cy = barH + ih/2;
  const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';
  let content;
  if (placeholder) {
    content = `<rect x="16" y="${barH+16}" width="${w*0.3}" height="6" rx="3" fill="${f.accent}" opacity="0.5"/>
      <rect x="16" y="${barH+30}" width="${w*0.45}" height="5" rx="2.5" fill="${f.text}" opacity="0.15"/>`;
  } else if (imgHref) {
    content = `<image href="${imgHref}" x="0" y="${barH}" width="${w|0}" height="${ih|0}" preserveAspectRatio="xMidYMid slice"${t}/>`;
  } else {
    content = '';
  }
  const r = Math.min(16, w*0.04);
  return `
    <rect width="${w|0}" height="${h|0}" fill="${f.body}" rx="${r|0}"/>
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}" rx="${r|0}"/>
    <rect x="0" y="${barH*0.6}" width="${w|0}" height="${barH*0.4}" fill="${f.bar}"/>
    <circle cx="${barH*0.4}" cy="${barH*0.5}" r="${dotR}" fill="${f.text}" opacity="0.3"/>
    <circle cx="${barH*0.7}" cy="${barH*0.5}" r="${dotR}" fill="${f.text}" opacity="0.2"/>
    <rect x="${barH}" y="${Math.round(barH*0.35)}" width="${Math.round(barH*2)}" height="${Math.round(barH*0.3)}" rx="${Math.round(barH*0.15)}" fill="${f.accent}" opacity="0.5"/>
    <rect x="0" y="${barH}" width="${w|0}" height="${ih|0}" fill="${f.body}"/>
    ${content}
    <rect x="0" y="0" width="${w|0}" height="${h|0}" rx="${r|0}" fill="none" stroke="${f.text}" stroke-opacity="0.08" stroke-width="1"/>
  `;
}

function renderAICode(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const barH = Math.max(28, Math.round(h * 0.07));
  const leftW = Math.round(w * 0.30);
  const bodyH = Math.max(0, h - barH);
  const ts = Math.round(barH * 0.38);
  const title = f.title || 'Designer 27';
  const imgAreaH = bodyH - 44;
  const cx = leftW + (w - leftW)/2, cy = barH + imgAreaH/2;
  const t = zoom != null ? ` transform="translate(${(panX||0) + cx*(1-zoom)}, ${(panY||0) + cy*(1-zoom)}) scale(${zoom})"` : '';

  let mainContent;
  if (placeholder) {
    mainContent = `<rect x="${leftW+14}" y="${barH+14}" width="${(w-leftW)*0.5}" height="6" rx="3" fill="${f.accent}" opacity="0.4"/>
      <rect x="${leftW+14}" y="${barH+28}" width="${(w-leftW)*0.35}" height="5" rx="2.5" fill="${f.text}" opacity="0.1"/>`;
  } else if (imgHref) {
    mainContent = `<image href="${imgHref}" x="${leftW}" y="${barH}" width="${w-leftW|0}" height="${imgAreaH|0}" preserveAspectRatio="xMidYMid slice"${t}/>`;
  } else {
    mainContent = `<text x="${leftW + (w-leftW)/2}" y="${barH + imgAreaH/2}" font-family="sans-serif" font-size="14" fill="${f.text}" opacity="0.15" text-anchor="middle">Preview</text>`;
  }

  const bubbleY = barH + 16;
  return `
    <rect width="${w|0}" height="${h|0}" fill="${f.body}" rx="10"/>
    <!-- top bar -->
    <rect x="0" y="0" width="${w|0}" height="${barH|0}" fill="${f.bar}" rx="10"/>
    <rect x="0" y="${barH*0.6}" width="${w|0}" height="${barH*0.4}" fill="${f.bar}"/>
    <text x="12" y="${Math.round(barH*0.6)}" font-family="sans-serif" font-size="${ts}" fill="${f.accent}" font-weight="bold">▲ ${escapeXML(title)}</text>
    <rect x="${w*0.35}" y="${barH*0.15}" width="${Math.round(w*0.06)}" height="${Math.round(barH*0.7)}" rx="4" fill="${f.accent}" opacity="0.15"/>
    <text x="${w*0.35+8}" y="${Math.round(barH*0.6)}" font-family="monospace" font-size="${Math.round(ts*0.8)}" fill="${f.text}">&lt;/&gt; Source</text>
    <text x="${w*0.35+8+Math.round(w*0.06)+12}" y="${Math.round(barH*0.6)}" font-family="sans-serif" font-size="${Math.round(ts*0.8)}" fill="${f.text}" opacity="0.5">AI</text>
    <text x="${w*0.35+8+Math.round(w*0.06)+12+ts*3}" y="${Math.round(barH*0.6)}" font-family="sans-serif" font-size="${Math.round(ts*0.8)}" fill="${f.text}" opacity="0.5">Quick</text>
    <!-- left panel (AI chat sidebar) -->
    <rect x="0" y="${barH}" width="${leftW|0}" height="${bodyH|0}" fill="${f.bar}" opacity="0.3"/>
    <line x1="${leftW}" y1="${barH}" x2="${leftW}" y2="${h}" stroke="${f.text}" stroke-opacity="0.05" stroke-width="1"/>
    <text x="12" y="${barH+20}" font-family="sans-serif" font-size="${Math.round(ts*0.75)}" fill="${f.text}" opacity="0.5">AI Chat</text>
    <!-- chat bubbles -->
    <rect x="6" y="${barH+32}" width="${leftW*0.65}" height="22" rx="6" fill="${f.accent}" opacity="0.15"/>
    <rect x="${leftW-leftW*0.65-6}" y="${barH+60}" width="${leftW*0.65}" height="22" rx="6" fill="${f.body}" opacity="0.3"/>
    <rect x="6" y="${barH+88}" width="${leftW*0.55}" height="22" rx="6" fill="${f.accent}" opacity="0.15"/>
    <!-- chat input -->
    <rect x="6" y="${barH+bodyH-36}" width="${leftW-12}" height="28" rx="6" fill="${f.body}" opacity="0.4"/>
    <text x="16" y="${barH+bodyH-19}" font-family="sans-serif" font-size="${Math.round(ts*0.65)}" fill="${f.text}" opacity="0.2">Ask AI...</text>
    <!-- main preview area -->
    <rect x="${leftW}" y="${barH}" width="${w-leftW|0}" height="${imgAreaH|0}" fill="${f.body}"/>
    ${mainContent}
    <!-- bottom bar in preview -->
    <rect x="${leftW}" y="${barH+imgAreaH}" width="${w-leftW|0}" height="${44}" fill="${f.bar}" opacity="0.5"/>
    <text x="${leftW+14}" y="${barH+imgAreaH+26}" font-family="monospace" font-size="${Math.round(ts*0.7)}" fill="${f.text}" opacity="0.3">main.tsx</text>
  `;
}

const RENDERERS = {
  mac: renderMac, browser: renderBrowser, terminal: renderTerminal,
  editor: renderEditor, phone: renderPhone, tablet: renderTablet,
  windows: renderWindows, gaming: renderGaming, github: renderGitHub,
  youtube: renderYouTube, ads: renderAds, glass: renderGlass,
  aicode: renderAICode,
};

function frameAspect(f) {
  if (f.chrome === 'phone') return 9/19.5;
  if (f.chrome === 'tablet') return f.variant === 'landscape' ? (4/3) : (3/4);
  if (f.chrome === 'gaming') return 16/9;
  if (f.chrome === 'youtube') return 16/9;
  if (f.chrome === 'ads') return f.variant === 'story' ? (9/16) : (1/1);
  if (f.chrome === 'glass') return 16/10;
  if (f.chrome === 'github') return 16/10;
  if (f.chrome === 'aicode') return 16/10;
  return 16/10;
}

function svgFor(f, w, h, imgHref, placeholder, zoom, panX, panY) {
  const inner = RENDERERS[f.chrome](f, w, h, imgHref, placeholder, zoom, panX, panY);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}

// ---------- gallery rendering ----------
function renderFilters() {
  const el = document.getElementById('filters');
  el.innerHTML = CATEGORIES.map(c =>
    `<button class="filter-btn ${c.key===state.activeFilter?'active':''}" data-filter="${c.key}">${c.label}</button>`
  ).join('');
  el.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeFilter = btn.dataset.filter;
      renderFilters();
      renderGallery();
    });
  });
}

function renderGallery() {
  const grid = document.getElementById('tileGrid');
  const list = state.activeFilter === 'all' ? ALL_FRAMES : ALL_FRAMES.filter(f => f.cat === state.activeFilter);
  grid.innerHTML = '';
  list.forEach(f => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (f.id === state.selectedId ? ' selected' : '');
    tile.dataset.id = f.id;
    const tw = 220, th = Math.round(tw / frameAspect(f));
    tile.innerHTML = `
      <div class="tile-preview" style="background:${f.body}">
        ${svgFor(f, tw, th, null, true)}
      </div>
      <div class="tile-label"><span>${f.name}</span><span class="idx">#${String(f.id).padStart(3,'0')}</span>
        <button class="copy-svg-btn" data-copy-id="${f.id}" title="Copy SVG code">Copy SVG</button>
      </div>
    `;
    tile.addEventListener('click', (e) => {
      if (e.target.closest('.copy-svg-btn')) return;
      selectFrame(f.id);
    });
    grid.appendChild(tile);
  });
  document.querySelectorAll('.copy-svg-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.copyId);
      const frame = frameById(id);
      const tw = 900, th = Math.round(tw / frameAspect(frame));
      const svg = svgFor(frame, tw, th, state.image ? state.image.src : null, false, state.zoom, state.panX, state.panY);
      try {
        await navigator.clipboard.writeText(svg);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 1200);
      } catch {}
    });
  });
}

const copyBtnStyle = document.createElement('style');
copyBtnStyle.textContent = `.copy-svg-btn{font-size:.62rem;background:var(--panel);border:1px solid var(--line);color:var(--muted-2);padding:2px 7px;border-radius:5px;cursor:pointer;font-family:inherit;transition:.1s;margin-left:4px;white-space:nowrap;}
.copy-svg-btn:hover{color:var(--ink);border-color:var(--line-strong);}`;
document.head.appendChild(copyBtnStyle);

function selectFrame(id) {
  state.selectedId = id;
  document.querySelectorAll('.tile').forEach(t => {
    t.classList.toggle('selected', Number(t.dataset.id) === id);
  });
  const f = frameById(id);
  document.getElementById('metaIndex').textContent = f.id;
  document.getElementById('metaName').textContent = f.name;
  document.getElementById('selName').textContent = f.name;
  document.getElementById('selCat').textContent = f.chrome;
  document.getElementById('selSwatch').style.background = f.accent;
  renderStage();
}

// ---------- stage (big live preview) ----------
function renderStage() {
  const f = frameById(state.selectedId);
  const stage = document.getElementById('stage');
  const maxW = Math.min(520, window.innerWidth - 480);
  const w = Math.max(200, maxW);
  const h = Math.round(w / frameAspect(f));
  const imgHref = state.image ? state.image.src : null;
  const vidSrc = state.video ? state.video.src : null;
  const pad = state.bgMode === 'none' ? 0 : state.padding;
  stage.style.cursor = (state.image || state.video) ? 'grab' : 'default';

  let [canvasW, canvasH] = applyRatio(w + pad*2, h + pad*2, state.ratio);
  const outerW = Math.max(canvasW, w + pad*2);
  const outerH = Math.max(canvasH, h + pad*2);

  let bgStyle = '';
  if (state.bgMode === 'solid') {
    bgStyle = `background:${state.bgColor};`;
  } else if (state.bgMode === 'gradient') {
    const g = BG_GRADIENT_OPTIONS[state.gradientIdx || 0];
    bgStyle = `background:linear-gradient(135deg,${g[0]},${g[1]});`;
  }

  const svgStr = svgFor(f, w, h, vidSrc ? null : imgHref, false, state.zoom, state.panX, state.panY);

  if (vidSrc) {
    // render frame chrome as SVG + overlay HTML video
    stage.innerHTML = `<div style="display:inline-flex;align-items:center;justify-content:center;width:${canvasW}px;height:${canvasH}px;${bgStyle}border-radius:${state.radius+4}px;">
      <div style="position:relative;border-radius:${state.radius}px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5);width:${w}px;height:${h}px;">
        ${svgStr}
        <video src="${vidSrc}" autoplay loop muted playsinline
          style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;pointer-events:none;" />
      </div>
    </div>`;
  } else {
    stage.innerHTML = `<div style="display:inline-flex;align-items:center;justify-content:center;width:${canvasW}px;height:${canvasH}px;${bgStyle}border-radius:${state.radius+4}px;">
      <div style="border-radius:${state.radius}px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.5);width:${w}px;height:${h}px;">
        ${svgStr}
      </div>
    </div>`;
  }
}

function setupStageDrag() {
  const stage = document.getElementById('stage');
  stage.addEventListener('mousedown', (e) => {
    if (!state.image) return;
    state.isDragging = true;
    state.dragStartX = e.clientX - state.panX;
    state.dragStartY = e.clientY - state.panY;
    stage.style.cursor = 'grabbing';
  });
  document.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    state.panX = e.clientX - state.dragStartX;
    state.panY = e.clientY - state.dragStartY;
    renderStage();
  });
  document.addEventListener('mouseup', () => {
    if (!state.isDragging) return;
    state.isDragging = false;
    document.getElementById('stage').style.cursor = 'grab';
  });
}

// ---------- color swatches ----------
function renderColorSwatches() {
  const el = document.getElementById('colorSwatches');
  el.innerHTML = FRAME_ACCENT_COLORS.map((c,i) =>
    `<div class="swatch ${i===0?'active':''}" style="background:${c}" data-color="${c}" title="${c}"></div>`
  ).join('');
  el.querySelectorAll('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      const f = frameById(state.selectedId);
      const c = sw.dataset.color;
      f.bar = c;
      document.getElementById('frameColorPicker').value = c;
      el.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      renderStage();
      renderGallery();
    });
  });
}

function renderBgSwatches() {
  const el = document.getElementById('bgSwatches');
  if (state.bgMode === 'solid') {
    el.innerHTML = BG_SOLID_OPTIONS.map((c,i) =>
      `<div class="swatch ${c===state.bgColor?'active':''}" style="background:${c}" data-color="${c}"></div>`
    ).join('');
    el.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        state.bgColor = sw.dataset.color;
        document.getElementById('bgColorPicker').value = sw.dataset.color;
        renderBgSwatches();
        renderStage();
      });
    });
  } else if (state.bgMode === 'gradient') {
    el.innerHTML = BG_GRADIENT_OPTIONS.map((g,i) =>
      `<div class="swatch ${state.gradientIdx===i?'active':''}" style="background:linear-gradient(135deg,${g[0]},${g[1]})" data-idx="${i}"></div>`
    ).join('');
    el.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        state.gradientIdx = Number(sw.dataset.idx);
        renderBgSwatches();
        renderStage();
      });
    });
  } else if (state.bgMode === 'transparent') {
    el.innerHTML = `<div class="swatch transparent active" style="cursor:default;"></div>`;
  } else {
    el.innerHTML = `<div class="hint" style="margin:0;">No background — exports the frame without padding or backdrop.</div>`;
  }
}

// ---------- upload ----------
function handleFile(file) {
  if (!file) return;
  const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i);
  const reader = new FileReader();
  reader.onload = (e) => {
    if (isVideo) {
      const vid = document.createElement('video');
      vid.onloadeddata = () => {
        state.image = null;
        state.video = vid;
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        document.getElementById('zoomRange').value = 100;
        document.getElementById('zoomVal').textContent = '1×';
        document.getElementById('uploadLabel').textContent = file.name;
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('exportHint').textContent = 'Ready — click Export to download.';
        renderStage();
      };
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.src = e.target.result;
      vid.load();
    } else {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        state.video = null;
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        document.getElementById('zoomRange').value = 100;
        document.getElementById('zoomVal').textContent = '1×';
        document.getElementById('uploadLabel').textContent = file.name;
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('exportHint').textContent = 'Ready — click Export to download.';
        renderStage();
      };
      img.src = e.target.result;
    }
  };
  reader.readAsDataURL(file);
}

// ---------- export ----------
async function exportPNG() {
  const f = frameById(state.selectedId);
  const scale = state.scale;
  const frameW = 900, frameH = Math.round(frameW / frameAspect(f));
  const pad = state.bgMode === 'none' ? 0 : state.padding;
  let totalW = frameW + pad * 2;
  let totalH = frameH + pad * 2;
  [totalW, totalH] = applyRatio(totalW, totalH, state.ratio);
  const offX = Math.round((totalW - frameW - pad*2) / 2);
  const offY = Math.round((totalH - frameH - pad*2) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = totalW * scale;
  canvas.height = totalH * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // background
  if (state.bgMode === 'solid') {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, totalW, totalH);
  } else if (state.bgMode === 'gradient') {
    const g = BG_GRADIENT_OPTIONS[state.gradientIdx || 0];
    const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
    grad.addColorStop(0, g[0]);
    grad.addColorStop(1, g[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, totalW, totalH);
  } // transparent / none -> leave as-is

  const imgHref = state.image ? state.image.src : null;
  const vidSrc = state.video ? state.video.src : null;
  const svgStr = svgFor(f, frameW, frameH, vidSrc ? null : imgHref, false, state.zoom, state.panX, state.panY);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const frameImg = new Image();
  await new Promise((resolve, reject) => {
    frameImg.onload = resolve;
    frameImg.onerror = reject;
    frameImg.src = url;
  });

  // rounded corner clip for the frame itself
  ctx.save();
  roundRectPath(ctx, pad + offX, pad + offY, frameW, frameH, state.radius);
  ctx.clip();
  ctx.drawImage(frameImg, pad + offX, pad + offY, frameW, frameH);
  ctx.restore();

  // If video, draw current frame on top
  if (vidSrc && state.video) {
    ctx.save();
    roundRectPath(ctx, pad + offX, pad + offY, frameW, frameH, state.radius);
    ctx.clip();
    ctx.drawImage(state.video, pad + offX, pad + offY, frameW, frameH);
    ctx.restore();
  }

  URL.revokeObjectURL(url);

  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `framecase-${f.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`;
    a.click();
  }, 'image/png');
}

async function exportMP4() {
  const f = frameById(state.selectedId);
  const scale = state.scale;
  const frameW = 900, frameH = Math.round(frameW / frameAspect(f));
  const pad = state.bgMode === 'none' ? 0 : state.padding;
  let totalW = frameW + pad * 2;
  let totalH = frameH + pad * 2;
  [totalW, totalH] = applyRatio(totalW, totalH, state.ratio);
  const offX = Math.round((totalW - frameW - pad*2) / 2);
  const offY = Math.round((totalH - frameH - pad*2) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = totalW * scale;
  canvas.height = totalH * scale;
  const ctx = canvas.getContext('2d');

  function drawFrame() {
    ctx.scale(scale, scale);
    if (state.bgMode === 'solid') {
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, totalW, totalH);
    } else if (state.bgMode === 'gradient') {
      const g = BG_GRADIENT_OPTIONS[state.gradientIdx || 0];
      const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
      grad.addColorStop(0, g[0]);
      grad.addColorStop(1, g[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, totalW, totalH);
    }
    ctx.save();
    roundRectPath(ctx, pad + offX, pad + offY, frameW+0.5, frameH+0.5, state.radius);
    ctx.clip();
    const imgHref = state.image ? state.image.src : null;
    const svgStr = svgFor(f, frameW, frameH, imgHref, false, state.zoom, state.panX, state.panY);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    return new Promise((resolve) => {
      const frameImg = new Image();
      frameImg.onload = () => {
        ctx.drawImage(frameImg, pad + offX, pad + offY, frameW, frameH);
        URL.revokeObjectURL(url);
        ctx.restore();
        resolve();
      };
      frameImg.onerror = () => { URL.revokeObjectURL(url); ctx.restore(); resolve(); };
      frameImg.src = url;
    });
  }

  await drawFrame();

  // Get best available MIME type for MediaRecorder
  const getMime = () => {
    const types = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (const t of types) {
      try { if (MediaRecorder.isTypeSupported(t)) return t; } catch(e) {}
    }
    return 'video/webm';
  };
  const mimeType = getMime();

  if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
    alert('MP4 export requires MediaRecorder API. Try using PNG format or a Chromium-based browser.');
    return;
  }

  const stream = canvas.captureStream(30);
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType });
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const url = URL.createObjectURL(blob);
    // Use Electron save dialog if available, else download
    if (window.electronAPI?.showSaveDialog) {
      window.electronAPI.showSaveDialog({
        defaultPath: `framecase-${f.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.${ext}`,
        filters: [{ name: 'Video', extensions: [ext] }]
      }).then(result => {
        if (!result.canceled && result.filePath) {
          window.electronAPI.writeFile(result.filePath, blob);
        }
        URL.revokeObjectURL(url);
      });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = `framecase-${f.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  recorder.start();
  setTimeout(() => recorder.stop(), 1500);
}

function applyRatio(w, h, ratioKey) {
  const r = RATIO_OPTIONS[ratioKey];
  if (!r) return [w, h];
  const curr = w / h;
  if (curr > r) return [w, Math.round(w / r)];
  if (curr < r) return [Math.round(h * r), h];
  return [w, h];
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setupResizeHandle() {
  const handle = document.getElementById('resizeHandle');
  let startX, startW;

  function onDrag(e) {
    const dx = e.clientX - startX;
    const newW = Math.max(300, startW - dx);
    document.documentElement.style.setProperty('--sidebar-w', newW + 'px');
  }

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 380;
    handle.classList.add('dragging');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', () => {
      handle.classList.remove('dragging');
      document.removeEventListener('mousemove', onDrag);
    }, { once: true });
  });
}

// ---------- wire up UI ----------
function init() {
  renderFilters();
  renderGallery();
  renderColorSwatches();
  renderBgSwatches();
  selectFrame(state.selectedId);
  setupStageDrag();
  setupResizeHandle();

  document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
  });

  document.getElementById('paddingRange').addEventListener('input', (e) => {
    state.padding = Number(e.target.value);
    document.getElementById('paddingVal').textContent = state.padding + 'px';
    renderStage();
  });
  document.getElementById('radiusRange').addEventListener('input', (e) => {
    state.radius = Number(e.target.value);
    document.getElementById('radiusVal').textContent = state.radius + 'px';
    renderStage();
  });

  document.getElementById('zoomRange').addEventListener('input', (e) => {
    state.zoom = Number(e.target.value) / 100;
    document.getElementById('zoomVal').textContent = state.zoom.toFixed(1) + '×';
    renderStage();
  });

  document.getElementById('resetPosBtn').addEventListener('click', () => {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    document.getElementById('zoomRange').value = 100;
    document.getElementById('zoomVal').textContent = '1×';
    renderStage();
  });

  document.getElementById('bgSeg').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('bgSeg').querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgMode = btn.dataset.bg;
      renderBgSwatches();
      if (state.bgMode === 'none') {
        document.getElementById('paddingVal').textContent = '0px';
      } else {
        document.getElementById('paddingVal').textContent = state.padding + 'px';
      }
      renderStage();
    });
  });

  document.getElementById('scaleSeg').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('scaleSeg').querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.scale = Number(btn.dataset.scale);
    });
  });

  document.getElementById('ratioSeg').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('ratioSeg').querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.ratio = btn.dataset.ratio;
      renderStage();
    });
  });

  document.getElementById('formatSeg').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('formatSeg').querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.format = btn.dataset.format;
    });
  });

  document.getElementById('tabNameInput').addEventListener('input', (e) => {
    state.tabName = e.target.value;
    renderStage();
  });

  document.getElementById('bgColorPicker').addEventListener('input', (e) => {
    state.bgColor = e.target.value;
    renderBgSwatches();
    renderStage();
  });

  document.getElementById('frameColorPicker').addEventListener('input', (e) => {
    const f = frameById(state.selectedId);
    f.bar = e.target.value;
    document.getElementById('frameColorPicker').value = e.target.value;
    renderStage();
    renderGallery();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    if (state.format === 'mp4') exportMP4();
    else exportPNG();
  });

  // drag & drop onto stage
  const stageWrap = document.querySelector('.stage-wrap');
  stageWrap.addEventListener('dragover', (e) => { e.preventDefault(); });
  stageWrap.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });
}

init();
