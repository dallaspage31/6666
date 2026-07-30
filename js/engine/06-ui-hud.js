export class UIHUD {
  static toast(message, duration = 2000) {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('hud-toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'hud-toasts';
      container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = 'hud-toast';
    el.style.cssText = 'background:#1a1a1a;color:#e0e0e0;padding:8px 12px;border-radius:6px;border:1px solid #333;font:12px monospace;opacity:0;transition:opacity .2s;';
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  static spawnDamageNumber(x, y, text, color = '#fff') {
    if (typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.className = 'dmg-number';
    el.textContent = text;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;color:${color};font:bold 14px monospace;pointer-events:none;z-index:9000;text-shadow:0 0 4px #000;transition:all .8s ease-out;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-40px) scale(1.2)';
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 900);
  }

  static setProgress(id, value, max) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    el.style.width = pct + '%';
  }
}
