import { CONFIG } from './config.js';
import { isHidingProp, itemsInRange } from './world.js';

const settings = CONFIG.turkey;

export class Turkey {
  constructor(x = 0) {
    this.reset(x);
  }

  reset(x = 0) {
    this.x = x;
    this.y = 0;
    this.vy = 0;
    this.ducking = false;
    this.hidden = false;
    this.invincible = 0;
    this.runPhase = 0;
    this.lives = settings.LIVES;
    this.alive = true;
  }

  update(dt, input, world) {
    if (!this.alive) return;

    this.invincible = Math.max(0, this.invincible - dt);
    this.ducking = input.isDown('duck');
    let speed = settings.CRUISE_SPEED;
    if (this.ducking) speed = settings.DUCK_SPEED;
    else if (input.isDown('slow')) speed = settings.SLOW_SPEED;
    else if (input.isDown('dash')) speed = settings.DASH_SPEED;

    if (this.y === 0 && !this.ducking && input.wasPressed('jump')) {
      this.vy = CONFIG.physics.JUMP_VELOCITY;
    }
    if (this.y > 0 || this.vy > 0) {
      const gravity = CONFIG.physics.GRAVITY;
      this.y += (this.vy - gravity * dt / 2) * dt;
      this.vy -= gravity * dt;
      if (this.y <= 0 && this.vy <= 0) {
        this.y = 0;
        this.vy = 0;
      }
    }

    const distance = Math.min(speed * dt, Math.max(0, world.totalLength - this.x));
    this.x += distance;
    this.runPhase = (this.runPhase + distance / settings.STRIDE_LENGTH) % 1;

    const { x0, x1 } = this.hitbox();
    this.hidden = this.isHidden(itemsInRange(world, x0, x1));
  }

  hitbox() {
    const feetY = CONFIG.view.GROUND_Y - this.y;
    return {
      x0: this.x - settings.HALF_WIDTH,
      x1: this.x + settings.HALF_WIDTH,
      headY: feetY - (this.ducking ? settings.DUCK_HEIGHT : settings.STANDING_HEIGHT),
      feetY,
      ducking: this.ducking,
    };
  }

  hurt() {
    if (!this.alive || this.invincible > 0) return { hit: false, dead: !this.alive };

    this.lives--;
    this.invincible = settings.INVINCIBLE_SECONDS;
    this.alive = this.lives > 0;
    return { hit: true, dead: !this.alive };
  }

  isHidden(items) {
    if (!this.ducking) return false;
    const { x0, x1 } = this.hitbox();
    return items.some((item) => (
      isHidingProp(item) && item.x < x1 && item.x + item.w > x0 && this.y < item.h
    ));
  }
}
