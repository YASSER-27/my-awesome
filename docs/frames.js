// Framecase — frame definitions
// Each frame: { id, name, cat (category key), chrome ('mac'|'browser'|'terminal'|'phone'|'tablet'|'editor'),
//               body, bar, dot1, dot2, dot3, text, accent, dark(bool) }

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'macos', label: 'macOS' },
  { key: 'browser', label: 'Browser' },
  { key: 'terminal', label: 'Terminal' },
  { key: 'phone', label: 'Phone' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'editor', label: 'Editor' },
  { key: 'windows', label: 'Windows' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'github', label: 'GitHub' },
  { key: 'ads', label: 'Ads' },
  { key: 'glass', label: 'Glass' },
  { key: 'aicode', label: 'AI Code' },
];

// palette helper sets — [barColor, bodyColor, textColor, accentColor]
const MAC_PALETTES = [
  ['#e8e8ea', '#ffffff', '#2b2b2f', '#6d5ef8'],
  ['#1c1c1f', '#111114', '#e8e8ea', '#6d5ef8'],
  ['#f3ede3', '#fffdf8', '#33291f', '#c9873a'],
  ['#0f1a14', '#0a120d', '#c8e6d3', '#34c77b'],
  ['#1a1420', '#120e17', '#e6d9f2', '#a56df8'],
  ['#101820', '#0b1218', '#cfe3f2', '#3aa0e6'],
  ['#241213', '#180c0d', '#f0d6d8', '#e6503a'],
  ['#f7f2e8', '#ffffff', '#2b2b2f', '#d9a441'],
  ['#12211f', '#0c1817', '#d3ece7', '#2ec9b0'],
  ['#1e1420', '#140d17', '#f2d9ea', '#e65ea0'],
  ['#eef0f2', '#ffffff', '#22262b', '#4062e6'],
  ['#171313', '#100d0d', '#ece3d9', '#c98a3a'],
  ['#0d1b2a', '#081420', '#cfe0ee', '#2f7fd9'],
  ['#1b0f1f', '#120a16', '#e9d6ef', '#8a3ae6'],
  ['#22160f', '#180f0a', '#f0dccb', '#e68a3a'],
  ['#101418', '#0a0d10', '#d6dde3', '#5ec2e6'],
  ['#1c1810', '#120f0a', '#e8ddc9', '#c9a441'],
  ['#0a0a1a', '#050510', '#00ff88', '#ff00ff'], // Gaming neon
  ['#e8e8ee', '#ffffff', '#1a1a2e', '#8888ff'], // Modern clean
  ['#d4d4e8', '#f0f0ff', '#2a2a4a', '#aabbff'], // Glass
  ['#0d0820', '#060310', '#ff66ff', '#00ffff'], // Cyber
];

const BROWSER_PALETTES = [
  ['#ececec', '#ffffff', '#2b2b2f', '#4062e6', 'framecase.app/preview'],
  ['#1e1e21', '#141416', '#e8e8ea', '#6d5ef8', 'app.framecase.dev'],
  ['#eef2ff', '#ffffff', '#242850', '#4f46e5', 'dashboard.acme.io'],
  ['#101b14', '#0b120d', '#cfe6d3', '#34c77b', 'staging.grow.sh'],
  ['#2a1414', '#1a0d0d', '#f2d6d6', '#e6503a', 'status.cloudops.com'],
  ['#f7f2e8', '#fffdf8', '#33291f', '#c9873a', 'studio.makerly.com'],
  ['#0f172a', '#0b1120', '#cbd5e1', '#38bdf8', 'console.devkit.io'],
  ['#1f1424', '#140d18', '#e9d9f2', '#a56df8', 'beta.nightly.app'],
];

const TERMINAL_PALETTES = [
  ['#1e1e1e', '#121212', '#e8e8e8', '#3ddc84', 'user@bowow ~ %'],
  ['#0d1117', '#010409', '#c9d1d9', '#58a6ff', 'root@server:~#'],
  ['#282a36', '#1a1b26', '#f8f8f2', '#ff79c6', 'dev@localhost ~ $'],
  ['#1a1b26', '#111119', '#a9b1d6', '#7aa2f7', 'user@tokyo ~ %'],
  ['#241f31', '#1a1621', '#e0def4', '#c4a7e7', 'user@rose ~ $'],
  ['#0b3d2e', '#062219', '#c9f2df', '#34c77b', 'user@matrix ~ #'],
  ['#2d0f0f', '#1a0808', '#f2c9c9', '#e6503a', 'root@alert:/ #'],
  ['#0f1a2d', '#08111e', '#cfe3f2', '#3aa0e6', 'user@ocean ~ $'],
  ['#001100', '#000800', '#00ff41', '#22ff22', 'root@matrix ~ #'], // Hacking
  ['#1a0020', '#0d0010', '#ff66ff', '#00ffff', 'user@cyber ~ %'], // Cyberpunk
];

function makeFrames() {
  const frames = [];
  let id = 1;

  // 30 macOS window frames (15 palettes x 2 variants)
  MAC_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent] = p;
    const names = ['Light', 'Midnight', 'Sandstone', 'Forest', 'Orchid', 'Ocean', 'Ember', 'Gold', 'Jade', 'Berry', 'Cloud', 'Cocoa', 'Steel', 'Violet', 'Clay', 'Slate', 'Amber', 'Gaming', 'Modern', 'Glass', 'Cyber'];
    ['classic', 'mono'].forEach((variant) => {
      frames.push({
        id: id++,
        cat: 'macos',
        chrome: 'mac',
        variant,
        name: `Mac · ${names[i]}${variant === 'mono' ? ' Mono' : ''}`,
        bar, body, text, accent,
      });
    });
  });

  // 16 browser frames (8 palettes x 2 variants)
  BROWSER_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, url] = p;
    const names = ['Cloud', 'Slate', 'Indigo', 'Meadow', 'Ember', 'Sand', 'Console', 'Orchid'];
    ['tabs', 'single'].forEach((variant) => {
      frames.push({
        id: id++,
        cat: 'browser',
        chrome: 'browser',
        variant,
        name: `Browser · ${names[i]}${variant === 'single' ? ' Single' : ''}`,
        bar, body, text, accent, url,
      });
    });
  });

  // 16 terminal frames (8 palettes x 2 variants)
  TERMINAL_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, prompt] = p;
    const names = ['Classic', 'Void', 'Dracula', 'Tokyo', 'Rosé', 'Matrix', 'Alert', 'Ocean', 'Hacking', 'Cyberpunk'];
    ['dots', 'plain'].forEach((variant) => {
      frames.push({
        id: id++,
        cat: 'terminal',
        chrome: 'terminal',
        variant,
        name: `Terminal · ${names[i]}${variant === 'plain' ? ' Plain' : ''}`,
        bar, body, text, accent, prompt,
      });
    });
  });

  // Phone frames (notch + dynamic island + android)
  const PHONE_PALETTES = [
    ['#111114', '#000000', '#e8e8ea', '#6d5ef8'],
    ['#ffffff', '#f5f5f7', '#222226', '#4062e6'],
    ['#0d1b14', '#08120d', '#cfe6d3', '#34c77b'],
    ['#1a1420', '#120e17', '#e6d9f2', '#a56df8'],
    ['#2a1414', '#1a0d0d', '#f2d6d6', '#e6503a'],
    ['#0f1a2d', '#0a1220', '#cfe3f2', '#3aa0e6'],
    // Apple iPhone
    ['#1c1c1e', '#000000', '#ffffff', '#636366'],  // Space Black
    ['#e8e8ea', '#f5f5f7', '#1c1c1e', '#aeaeb2'],  // Silver
    ['#f5e8d0', '#fff8f0', '#33291f', '#d4a857'],  // Gold
    ['#362a4a', '#1a0f2e', '#e8d9f2', '#9b7bbf'],  // Deep Purple
    ['#a8c5d9', '#d4e6f2', '#1c1c2e', '#5a8ba8'],  // Sierra Blue
    ['#2a4a3a', '#0d1a14', '#d3e8c9', '#34a56b'],  // Midnight Green
    ['#4a1018', '#1a0508', '#f2d6d8', '#e64040'],  // (PRODUCT)RED
  ];
  PHONE_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent] = p;
    const names = ['Graphite', 'Paper', 'Forest', 'Orchid', 'Ember', 'Ocean', 'Space Black', 'Silver', 'Gold', 'Deep Purple', 'Sierra Blue', 'Midnight Green', 'Product Red'];
    ['island', 'notch'].forEach((variant) => {
      frames.push({
        id: id++,
        cat: 'phone',
        chrome: 'phone',
        variant,
        name: `Phone · ${names[i]} ${variant === 'island' ? 'Island' : 'Notch'}`,
        bar, body, text, accent,
      });
    });
  });

  // Tablet frames
  const TABLET_PALETTES = [
    ['#111114', '#000000', '#e8e8ea', '#6d5ef8'],
    ['#ffffff', '#f5f5f7', '#222226', '#4062e6'],
    ['#0d1b14', '#08120d', '#cfe6d3', '#34c77b'],
    ['#2a1414', '#1a0d0d', '#f2d6d6', '#e6503a'],
    ['#1a1420', '#120e17', '#e6d9f2', '#a56df8'],
    ['#f7f2e8', '#fffdf8', '#33291f', '#c9873a'],
  ];
  TABLET_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent] = p;
    const names = ['Graphite', 'Paper', 'Forest', 'Ember', 'Orchid', 'Sandstone'];
    frames.push({
      id: id++, cat: 'tablet', chrome: 'tablet', variant: 'landscape',
      name: `Tablet · ${names[i]} Landscape`, bar, body, text, accent,
    });
    frames.push({
      id: id++, cat: 'tablet', chrome: 'tablet', variant: 'portrait',
      name: `Tablet · ${names[i]} Portrait`, bar, body, text, accent,
    });
  });

  // Editor / IDE frames
  const EDITOR_PALETTES = [
    ['#252526', '#1e1e1e', '#d4d4d4', '#569cd6', 'main.js'],
    ['#21252b', '#282c34', '#abb2bf', '#61afef', 'App.tsx'],
    ['#2b2b2b', '#212121', '#c9c9c9', '#cc7832', 'index.py'],
    ['#f3f3f3', '#ffffff', '#2b2b2f', '#4062e6', 'style.css'],
    ['#1a1b26', '#16161e', '#a9b1d6', '#7aa2f7', 'server.go'],
    ['#282a36', '#21222c', '#f8f8f2', '#ff79c6', 'schema.rb'],
  ];
  EDITOR_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, file] = p;
    const names = ['Studio Dark', 'Atom One', 'Darcula', 'Studio Light', 'Tokyo Night', 'Dracula'];
    ['sidebar', 'plain'].forEach((variant) => {
      frames.push({
        id: id++,
        cat: 'editor',
        chrome: 'editor',
        variant,
        name: `Editor · ${names[i]}${variant === 'sidebar' ? ' + Sidebar' : ''}`,
        bar, body, text, accent, file,
      });
    });
  });

  // Windows frames (classic Win98 + modern Win11)
  const WINDOWS_PALETTES = [
    ['#e8e8e8', '#ffffff', '#000000', '#c0c0c0', 'My Computer', true],    // Win98 Classic
    ['#000080', '#c0c0c0', '#ffffff', '#808080', 'Command Prompt', true],  // Win98 Dark
    ['#e8e8e8', '#d4d0c8', '#000000', '#808080', 'File Manager', true],    // Win98 Beige
    ['#005a9e', '#ffffff', '#ffffff', '#0078d7', 'Settings', false],       // Win11 Blue
    ['#111114', '#1c1c1f', '#ffffff', '#6d5ef8', 'Terminal', false],       // Win11 Dark
    ['#f2f2f2', '#ffffff', '#1a1a1a', '#60cdff', 'Explorer', false],       // Win11 Light
  ];
  WINDOWS_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title, classic] = p;
    const names = ['Classic', 'Dark', 'Beige', 'Blue', 'Dark', 'Light'];
    const variants = classic ? ['classic'] : ['modern'];
    variants.forEach((variant) => {
      frames.push({
        id: id++,
        cat: 'windows',
        chrome: 'windows',
        variant,
        name: `Windows · ${names[i]}${classic ? ' 98' : ' 11'}`,
        bar, body, text, accent, title,
      });
    });
  });

  // Gaming frames
  const GAMING_PALETTES = [
    ['#0a0a1a', '#050510', '#00ff88', '#ff00ff', 'CYBERPUNK'],
    ['#1a0808', '#0a0202', '#ff4444', '#ff8800', 'INFERNO'],
    ['#0a0a2a', '#050518', '#4488ff', '#00ffcc', 'NEBULA'],
    ['#1a1408', '#0c0a04', '#ffcc00', '#ff6600', 'ARENA'],
  ];
  GAMING_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title] = p;
    const names = ['Cyberpunk', 'Inferno', 'Nebula', 'Arena'];
    ['rgb', 'neon'].forEach((variant) => {
      frames.push({
        id: id++, cat: 'gaming', chrome: 'gaming', variant,
        name: `Gaming · ${names[i]} ${variant === 'rgb' ? 'RGB' : 'Neon'}`,
        bar, body, text, accent, title,
      });
    });
  });

  // GitHub frames
  const GITHUB_PALETTES = [
    ['#24292e', '#ffffff', '#ffffff', '#0366d6', 'user/octo-repo'],
    ['#0d1117', '#010409', '#c9d1d9', '#58a6ff', 'user/octo-repo'],
    ['#1a1a2e', '#16213e', '#e8e8e8', '#0f3460', 'user/octo-repo'],
  ];
  GITHUB_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title] = p;
    const names = ['Light', 'Dark', 'Navy'];
    ['tabs', 'single'].forEach((variant) => {
      frames.push({
        id: id++, cat: 'github', chrome: 'github', variant,
        name: `GitHub · ${names[i]}${variant === 'tabs' ? '' : ' (single)'}`,
        bar, body, text, accent, title,
      });
    });
  });

  // YouTube frames
  const YOUTUBE_PALETTES = [
    ['#212121', '#0f0f0f', '#ffffff', '#ff0000', 'How to center a div'],
    ['#1a1a1a', '#080808', '#e8e8e8', '#cc0000', 'Top 10 CSS tricks'],
    ['#0f0f0f', '#000000', '#ffffff', '#ff0000', 'Build a React App'],
  ];
  YOUTUBE_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title] = p;
    const names = ['Dark', 'Midnight', 'Pure Black'];
    ['controls', 'minimal'].forEach((variant) => {
      frames.push({
        id: id++, cat: 'youtube', chrome: 'youtube', variant,
        name: `YouTube · ${names[i]} ${variant === 'controls' ? '' : 'Minimal'}`,
        bar, body, text, accent, title,
      });
    });
  });

  // Ads frames
  const ADS_PALETTES = [
    ['#ffffff', '#ffffff', '#000000', '#4062e6', 'Sponsored'],
    ['#111114', '#000000', '#e8e8ea', '#6d5ef8', 'Sponsored'],
    ['#f7f2e8', '#fffdf8', '#33291f', '#c9873a', 'Sponsored'],
  ];
  ADS_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title] = p;
    const names = ['Clean', 'Dark', 'Warm'];
    ['story', 'square'].forEach((variant) => {
      frames.push({
        id: id++, cat: 'ads', chrome: 'ads', variant,
        name: `Ads · ${names[i]} ${variant === 'story' ? 'Story' : 'Square'}`,
        bar, body, text, accent, title,
      });
    });
  });

  // Glass frames
  const GLASS_PALETTES = [
    ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)', '#ffffff', '#aabbff', 'glass UI'],
    ['rgba(0,0,0,0.20)', 'rgba(0,0,0,0.06)', '#e8e8e8', '#8888ff', 'glass UI'],
    ['rgba(200,220,255,0.10)', 'rgba(200,220,255,0.03)', '#c8dcff', '#88aaff', 'glass UI'],
  ];
  GLASS_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title] = p;
    const names = ['Frost', 'Obsidian', 'Ice'];
    ['light', 'dark'].forEach((variant) => {
      frames.push({
        id: id++, cat: 'glass', chrome: 'glass', variant,
        name: `Glass · ${names[i]} ${variant === 'light' ? 'Light' : 'Dark'}`,
        bar, body, text, accent, title,
      });
    });
  });

  // AI Code frames (v0 / Bolt / Lovable style)
  const AICODE_PALETTES = [
    ['#0d0d0d', '#121212', '#e8e8e8', '#8b5cf6', 'Designer 27'],
    ['#1a1a2e', '#16213e', '#e8e8e8', '#0f3460', 'Designer 27'],
    ['#0f0f1a', '#0a0a14', '#c8d8ff', '#ff6b9d', 'Designer 27'],
    ['#1c1c1c', '#2d2d2d', '#f0f0f0', '#00d4aa', 'Designer 27'],
  ];
  AICODE_PALETTES.forEach((p, i) => {
    const [bar, body, text, accent, title] = p;
    const names = ['Midnight', 'Navy', 'Cosmic', 'Carbon'];
    ['split', 'full'].forEach((variant) => {
      frames.push({
        id: id++, cat: 'aicode', chrome: 'aicode', variant,
        name: `AI Code · ${names[i]} ${variant === 'split' ? 'Split' : 'Full'}`,
        bar, body, text, accent, title,
      });
    });
  });

  return frames;
}

const ALL_FRAMES = makeFrames();

// re-id sequentially
ALL_FRAMES.forEach((f, i) => f.id = i + 1);
