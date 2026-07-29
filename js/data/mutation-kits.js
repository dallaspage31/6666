export const VISUAL_MUTATION_KITS = {
  frost: {
    id: 'frost',
    name: 'Frost',
    palette: { primary: '#aaddff', secondary: '#5599cc', ambient: '#88bbdd' },
    overlay: 'frozen-shell',
  },
  void: {
    id: 'void',
    name: 'Void',
    palette: { primary: '#8844aa', secondary: '#552266', ambient: '#663388' },
    overlay: 'shadow-wisp',
  },
  celestial: {
    id: 'celestial',
    name: 'Celestial',
    palette: { primary: '#ffffaa', secondary: '#ffcc44', ambient: '#ffee88' },
    overlay: 'crown',
  },
  poison: {
    id: 'poison',
    name: 'Poison',
    palette: { primary: '#44aa44', secondary: '#228822', ambient: '#66cc66' },
    overlay: null,
  },
  frenzied: {
    id: 'frenzied',
    name: 'Frenzied',
    palette: { primary: '#ff4444', secondary: '#cc2222', ambient: '#ff6666' },
    overlay: null,
  },
  treasure: {
    id: 'treasure',
    name: 'Treasure',
    palette: { primary: '#ffcc00', secondary: '#ff9900', ambient: '#ffdd44' },
    overlay: 'treasure-bag',
  },
  armor: {
    id: 'armor',
    name: 'Armored',
    palette: { primary: '#888888', secondary: '#555555', ambient: '#aaaaaa' },
    overlay: 'armor-overlay',
  },
  shield: {
    id: 'shield',
    name: 'Shielded',
    palette: { primary: '#4488ff', secondary: '#2255cc', ambient: '#66aaff' },
    overlay: 'shield-overlay',
  },
};

export function getMutationKit(id) {
  return VISUAL_MUTATION_KITS[id] || null;
}

export function applyMutationTint(ctx, palette, x, y, radius) {
  if (!palette) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
