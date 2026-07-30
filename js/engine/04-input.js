export class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.bindings = new Map();
    this.pressed = new Set();
    this.released = new Set();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (!this.keys.has(e.key)) this.pressed.add(e.key);
        this.keys.add(e.key);
      });
      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.key);
        this.released.add(e.key);
      });
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });
      window.addEventListener('mousedown', () => { this.mouse.down = true; this.mouse.clicked = true; });
      window.addEventListener('mouseup', () => { this.mouse.down = false; });
      window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  bind(action, key) {
    this.bindings.set(action, key);
  }

  isDown(action) {
    const key = this.bindings.get(action) || action;
    return this.keys.has(key);
  }

  justPressed(action) {
    const key = this.bindings.get(action) || action;
    return this.pressed.has(key);
  }

  justReleased(action) {
    const key = this.bindings.get(action) || action;
    return this.released.has(key);
  }

  flush() {
    this.pressed.clear();
    this.released.clear();
    this.mouse.clicked = false;
  }
}
