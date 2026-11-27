import { CONFIG } from './config.js';

const KEY_ACTIONS = {
  ArrowLeft: ['slow'],
  KeyA: ['slow'],
  ArrowRight: ['dash'],
  KeyD: ['dash'],
  ArrowUp: ['jump'],
  KeyW: ['jump'],
  Space: ['jump', 'start'],
  ArrowDown: ['duck'],
  KeyS: ['duck'],
  Enter: ['start'],
};

export class Input {
  // Pass the canvas to make touch zones relative to its on-screen bounds.
  constructor(surface = document.documentElement) {
    this.heldKeys = new Set();
    this.pressed = new Set();
    this.touches = new Map();

    const listeners = new AbortController();
    const { signal } = listeners;
    this.destroy = () => {
      listeners.abort();
      surface.style.touchAction = previousTouchAction;
      this.reset();
    };

    window.addEventListener('keydown', (event) => {
      const actions = KEY_ACTIONS[event.code];
      if (!actions) return;
      event.preventDefault();
      if (event.repeat || this.heldKeys.has(event.code)) return;
      this.heldKeys.add(event.code);
      for (const action of actions) this.pressed.add(action);
    }, { signal });

    window.addEventListener('keyup', (event) => {
      this.heldKeys.delete(event.code);
    }, { signal });
    window.addEventListener('blur', () => this.reset(), { signal });

    const previousTouchAction = surface.style.touchAction;
    surface.style.touchAction = 'none';

    surface.addEventListener('pointerdown', (event) => {
      if (event.isPrimary && event.button === 0) this.pressed.add('start');
      if (event.pointerType !== 'touch') return;
      const bounds = surface.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      let action = 'jump';
      if (x >= CONFIG.input.DUCK_LEFT_FRACTION && y >= CONFIG.input.DUCK_TOP_FRACTION) {
        action = 'duck';
      } else if (x < 1 / 3) {
        action = 'slow';
      } else if (x >= 2 / 3) {
        action = 'dash';
      }

      surface.setPointerCapture(event.pointerId);
      this.touches.set(event.pointerId, { action, startY: event.clientY, height: bounds.height });
      this.pressed.add(action);
    }, { signal });

    surface.addEventListener('pointermove', (event) => {
      const touch = this.touches.get(event.pointerId);
      if (!touch || touch.action === 'duck') return;
      if (event.clientY - touch.startY >= touch.height * CONFIG.input.SWIPE_DOWN_FRACTION) {
        touch.action = 'duck';
        this.pressed.add('duck');
      }
    }, { signal });

    const release = (event) => this.touches.delete(event.pointerId);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      surface.addEventListener(type, release, { signal });
    }
  }

  isDown(action) {
    for (const key of this.heldKeys) {
      if (KEY_ACTIONS[key].includes(action)) return true;
    }
    for (const touch of this.touches.values()) {
      if (touch.action === action) return true;
    }
    return false;
  }

  wasPressed(action) {
    return this.pressed.has(action);
  }

  endFrame() {
    this.pressed.clear();
  }

  reset() {
    this.heldKeys.clear();
    this.touches.clear();
    this.endFrame();
  }
}
