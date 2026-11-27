import { itemsInRange } from './world.js';

const INK = '#382422';
const CREAM = '#fff1cd';
const GOLD = '#ffc15b';
const TAU = Math.PI * 2;
const LEAF_COLORS = ['#c74731', '#e77835', '#ffbf55'];
const STAGE_LABELS = ['FARM', 'BARN', 'KITCHEN'];
const HIT_SECONDS = 0.2;
const DUST_INTERVAL = 0.095;
const CHARACTER_SCALE = 1.25;

function fraction(value) {
  return value - Math.floor(value);
}

export class Renderer {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.w = config.view.W;
    this.h = config.view.H;
    this.ground = config.view.GROUND_Y;
    this.time = 0;
    this.effects = [];
    this.previousRunner = null;
    this.lastDust = -Infinity;
    this.lastHit = -Infinity;
  }

  rect(x, y, w, h, fill) {
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x, y, w, h);
  }

  round(x, y, w, h, radius, fill, stroke) {
    const c = this.ctx;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    this.paint(fill, stroke);
  }

  oval(x, y, rx, ry, fill, angle = 0, stroke) {
    const c = this.ctx;
    c.beginPath();
    c.ellipse(x, y, rx, ry, angle, 0, TAU);
    this.paint(fill, stroke);
  }

  poly(points, fill, stroke, strokeWidth) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.closePath();
    this.paint(fill, stroke, strokeWidth);
  }

  paint(fill, stroke, strokeWidth = 2) {
    const c = this.ctx;
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = strokeWidth;
      c.stroke();
    }
  }

  line(points, color, width = 2) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  }

  gradient(y0, y1, top, bottom) {
    const gradient = this.ctx.createLinearGradient(0, y0, 0, y1);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    return gradient;
  }

  text(value, x, y, size, fill = CREAM, align = 'center', outline = INK) {
    const c = this.ctx;
    c.font = `900 ${size}px system-ui, sans-serif`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    if (outline) {
      c.strokeStyle = outline;
      c.lineWidth = Math.max(2, size * 0.11);
      c.strokeText(value, x, y);
    }
    c.fillStyle = fill;
    c.fillText(value, x, y);
  }

  repeat(offset, gap, draw) {
    const first = Math.floor(offset / gap);
    for (let i = first - 1; i * gap - offset < this.w + gap; i++) {
      draw(i * gap - offset, i);
    }
  }

  shadow(x, y, w, h = 6) {
    const c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(w, h);
    const shade = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    shade.addColorStop(0, '#24171861');
    shade.addColorStop(0.5, '#24171839');
    shade.addColorStop(1, '#24171800');
    this.oval(0, 0, 1, 1, shade);
    c.restore();
  }

  background(id, camera, sunrise = false) {
    const palette = this.config.palette[id];
    this.rect(0, 0, this.w, this.h, palette.sky);
    if (id === 'farm') this.farm(camera, palette, sunrise);
    else if (id === 'barn') this.barn(camera, palette);
    else this.kitchen(camera, palette);
    this.floor(id, camera, palette);
  }

  farm(camera, palette, sunrise) {
    const g = this.ground;
    this.rect(0, 0, this.w, g,
      this.gradient(0, g, sunrise ? '#e89a78' : palette.sky, '#ffe3aa'));
    const sunX = (sunrise ? 960 : 1040) - camera * 0.015;
    const sunY = sunrise ? 333 : 161;
    const glow = this.ctx.createRadialGradient(sunX, sunY, 31, sunX, sunY, 145);
    glow.addColorStop(0, '#fff5cba0');
    glow.addColorStop(1, '#fff5cb00');
    this.oval(sunX, sunY, 145, 145, glow);
    this.oval(sunX, sunY, 55, 55, '#ffefbc');
    this.repeat(camera * 0.15, 455, (x, i) => {
      const y = 158 + this.decorSample(i, 2) * 134;
      this.oval(x + 88, y + 8, 83, 12, '#fff2d16e');
      this.oval(x + 103, y, 45, 15, '#fff2d16e');
      this.oval(x + 65, y + 1, 31, 12, '#fff2d14d');
    });
    this.repeat(camera * 0.19, 690, (x, i) => {
      const height = 210 + this.decorSample(i, 12) * 35;
      this.oval(x + 160, g + 9, 450, height, '#dab098');
    });
    this.repeat(camera * 0.28, 435, (x, i) => {
      const height = 165 + 50 * this.decorSample(i, 3);
      this.oval(x + 50, g + 27, 324, height + 22, '#b6907d');
      this.oval(x + 214, g + 43, 291, height - 23, '#c5a179');
    });
    this.repeat(camera * 0.43, 930, (x) => {
      this.rect(x + 279, g - 147, 139, 74, '#a75d4c');
      this.poly([[x + 265, g - 144], [x + 298, g - 180], [x + 346, g - 199],
        [x + 393, g - 180], [x + 431, g - 144]], '#805044');
      this.rect(x + 324, g - 127, 45, 54, '#835246');
      this.line([[x + 325, g - 124], [x + 368, g - 76]], '#b9795d', 3);
      this.line([[x + 369, g - 124], [x + 325, g - 76]], '#b9795d', 3);
    });
    this.repeat(camera * 0.54, 285, (x, i) => {
      const top = g - 132 - this.decorSample(i, 1) * 46;
      this.line([[x + 9, g - 74], [x + 10, top]], '#815d4d', 9);
      this.oval(x - 9, top + 10, 32, 30, i % 2 ? '#af6a57' : '#c48152');
      this.oval(x + 29, top + 8, 32, 30, i % 2 ? '#b9755d' : '#cd8d56');
      this.oval(x + 9, top - 10, 36, 31, i % 2 ? '#c17f65' : '#d39863');
    });
    this.rect(0, g - 77, this.w, 77, this.gradient(g - 77, g, '#b48a5a', '#c49a66'));
    this.repeat(camera * 0.62, 82, (x) => {
      this.line([[x, g - 55], [x + 82, g - 55]], '#986d50', 4);
      this.line([[x, g - 44], [x + 82, g - 44]], '#a17655', 3);
      this.line([[x, g - 67], [x, g - 33]], '#8b604b', 5);
    });
    this.rect(0, g - 27, this.w, 27, this.gradient(g - 27, g, '#dcab7100', '#ecba7938'));
  }

  barn(camera, palette) {
    const g = this.ground;
    this.rect(0, 0, this.w, g, this.gradient(0, g, '#4b302c', palette.sky));
    this.repeat(camera * 0.33, 63, (x, i) => {
      this.rect(x + 1, 0, 62, g, this.decorSample(i, 4) > 0.5 ? '#edaf7511' : '#2a202018');
      this.rect(x, 0, 2, g, '#37232858');
      this.line([[x + 16, 182], [x + 20, 343], [x + 17, 415]], '#e2a17429');
    });
    this.repeat(camera * 0.55, 618, (x, i) => {
      this.rect(x + 44, 100, 10, g - 100, '#38242230');
      this.rect(x + 8, 0, 32, g, '#52342f');
      this.rect(x + 39, 0, 5, g, '#a1664b');
      this.poly([[x + 44, 146], [x + 127, 90], [x + 145, 90],
        [x + 44, 168]], '#664138');
      this.round(x + 124, 152, 125, 136, 4, '#e6b67c', '#674235');
      this.rect(x + 132, 160, 109, 120, this.gradient(160, 280, '#edc48e', '#d6a26b'));
      this.line([[x + 186, 153], [x + 186, 286]], '#82583f', 7);
      this.line([[x + 126, 217], [x + 247, 217]], '#82583f', 7);
      this.poly([[x + 134, 283], [x + 183, 283], [x + 438, g - 55], [x + 310, g - 55]],
        this.gradient(280, g - 55, '#f4cd8e49', '#f4cd8e00'));
      this.poly([[x + 191, 283], [x + 242, 283], [x + 536, g - 58], [x + 456, g - 58]],
        this.gradient(280, g - 58, '#ffdb9f37', '#ffdb9f00'));
      for (let mote = 0; mote < 4; mote++) {
        const sample = this.decorSample(i * 4 + mote, 15);
        this.oval(x + 199 + mote * 29, 325 + mote * 26 + sample * 15, 1 + sample, 1, '#ffe1ab62');
      }

      const ropeX = x + 370 + this.decorSample(i, 6) * 73;
      this.line([[ropeX, 101], [ropeX, 175]], '#644137', 5);
      this.oval(ropeX, 183, 15, 15, '#593931', 0, '#a36d50');
      this.oval(ropeX, 183, 4, 4, '#96624b');
      this.line([[ropeX - 11, 185], [ropeX - 13, 255], [ropeX - 9, 275],
        [ropeX + 4, 277], [ropeX + 12, 265], [ropeX + 11, 199]], '#644238', 4);
      this.oval(x + 500, g - 69, 102, 13, '#866048');
      this.oval(x + 467, g - 83, 58, 17, '#956747');
      this.oval(x + 530, g - 89, 52, 20, '#9c6e4a');
      this.line([[x + 476, g - 87], [x + 505, g - 89]], '#ac7b54', 2);
    });
    this.rect(0, 94, this.w, 22, '#593831');
    this.rect(0, 94, this.w, 4, '#a67152');
    this.rect(0, g - 15, this.w, 15, '#654239');
  }

  kitchen(camera, palette) {
    const g = this.ground;
    this.rect(0, 0, this.w, g, this.gradient(0, g, '#f6e4bf', palette.sky));
    this.repeat(camera * 0.3, 86, (x, col) => {
      for (let y = 106, row = 0; y < g; y += 62, row++) {
        const tone = this.decorSample(col, row) > 0.52 ? '#fff3db57' : '#f6dfbc50';
        this.round(x + 2, y + 2, 82, 58, 5, tone, '#d5b295');
        this.rect(x + 6, y + 5, 73, 2, '#fff3d84f');
      }
    });
    this.repeat(camera * 0.55, 760, (x) => {
      this.round(x + 46, 151, 175, 153, 5, '#bd946e', '#a87b61');
      this.rect(x + 54, 159, 159, 134, this.gradient(159, 293, '#b8c0ab', '#ede0a8'));
      this.line([[x + 133, 158], [x + 133, 293]], '#b19273', 4);
      this.line([[x + 54, 225], [x + 212, 225]], '#b19273', 4);
      for (const side of [-1, 1]) {
        const edge = x + 133 + side * 81;
        this.poly([[edge, 158], [edge - side * 58, 158], [edge - side * 41, 213],
          [edge - side * 25, 246], [edge - side * 43, 288], [edge, 288]], '#bc806d');
        this.line([[edge - side * 35, 162], [edge - side * 27, 207],
          [edge - side * 16, 241]], '#dba18a', 3);
        this.line([[edge, 247], [edge - side * 27, 247]], '#956452', 4);
      }
      this.round(x + 43, 293, 182, 9, 3, '#af886e');

      for (let row = 0; row < 2; row++) {
        const shelf = 209 + row * 71;
        for (let i = 0; i < 4; i++) {
          const left = x + 284 + i * 42;
          const height = 28 + (i % 2) * 11;
          this.round(left, shelf - height, 24, height, 5,
            row ? '#ab8e72' : ['#b9826a', '#c7a67b', '#9b9c7c', '#b48775'][i], '#aa856b');
          this.rect(left + 2, shelf - height, 20, 5, row ? '#8e705d' : '#ad886e');
        }
        this.round(x + 264, shelf, 202, 10, 3, row ? '#8a6859' : '#a68268');
        this.rect(x + 270, shelf + 10, 189, 16, this.gradient(shelf + 10, shelf + 26, '#80544350', '#80544300'));
      }

      this.line([[x + 494, 227], [x + 723, 227]], '#ab8672', 6);
      for (let i = 0; i < 2; i++) {
        const left = x + 532 + i * 64;
        this.line([[left, 229], [left, 270 + i * 12]], '#79666a', 4);
        this.oval(left, 284 + i * 12, 21 + i * 3, 17 + i * 2, '#8a7473', 0, '#746064');
        this.oval(left, 284 + i * 12, 14, 10, '#a28982');
      }
      this.line([[x + 656, 229], [x + 656, 271]], '#79666a', 4);
      this.oval(x + 656, 280, 9, 12, '#927972');
      this.line([[x + 696, 229], [x + 696, 267]], '#79666a', 4);
      this.round(x + 686, 267, 20, 24, 4, '#8b7571');
      this.line([[x + 696, 271], [x + 696, 286]], '#d0ad94', 2);

      this.round(x + 57, g - 139, 597, 138, 5, '#ae7966');
      for (let i = 0; i < 5; i++) {
        this.round(x + 67 + i * 115, g - 120, 106, 103, 5, '#b98570', '#a97563');
        this.round(x + 103 + i * 115, g - 105, 25, 4, 2, '#d8ac83');
      }
      this.round(x + 48, g - 147, 612, 18, 4, '#ddbea0', '#b39278');
    });
    this.rect(0, 94, this.w, 7, '#bd846f');
  }

  decorSample(column, row) {
    let key = Math.imul(column, 0x1f123bb5) ^ Math.imul(row + 1, 0x5f356495);
    key = Math.imul(key ^ (key >>> 16), 0x45d9f3b);
    return ((key ^ (key >>> 16)) >>> 0) / 0x100000000;
  }

  floor(id, camera, palette) {
    const c = this.ctx;
    const g = this.ground;
    c.save();
    c.beginPath();
    c.rect(0, g, this.w, this.h - g);
    c.clip();
    this.rect(0, g, this.w, this.h - g, palette.ground);
    if (id === 'kitchen') {
      const tones = [['#b98272', '#be8876', '#c08b79'], ['#d8ab8b', '#dcb091', '#dfb596']];
      this.repeat(camera, 78, (x, col) => {
        for (let row = 0; row < 3; row++) {
          const y = g + row * 40;
          const sample = this.decorSample(col, row);
          this.rect(x, y, 78, 40, row === 0 ? '#8d6155' : '#9c7260');
          this.rect(x + 1, y + 1, 76, 38, tones[(col + row) & 1][Math.floor(sample * 3)]);
          this.rect(x + 2, y + 2, 74, 2, '#ffe7bd25');
          this.rect(x + 3, y + 36, 72, 2, '#9e69542a');
        }
      });
      this.rect(0, g, this.w, 38, this.gradient(g, g + 38, '#62423d40', '#62423d00'));
    } else if (id === 'barn') {
      const tones = ['#634138', '#68443a', '#6d493d', '#714b3e'];
      for (let row = 0; row < 4; row++) {
        const y = g + row * 35;
        this.repeat(camera + row * 85, 255, (x, col) => {
          const sample = this.decorSample(col, row);
          this.rect(x + 1, y + 1, 253, 33, tones[Math.floor(sample * tones.length)]);
          this.rect(x, y, 255, 2, '#4c352e');
          this.rect(x, y + 2, 2, 32, '#51372e');
          this.line([[x + 17, y + 9], [x + 79 + sample * 61, y + 9]], '#9f74522e', 2);
          if (sample > 0.38) {
            const strawX = x + 35 + sample * 158;
            this.line([[strawX, y + 24], [strawX + 10, y + 21]], '#bd925668', 1.3);
            this.line([[strawX - 4, y + 22], [strawX + 5, y + 28]], '#bd925653', 1.2);
          }
        });
      }
    } else {
      this.rect(0, g, this.w, this.h - g, this.gradient(g, this.h, '#a37952', palette.ground));
      this.rect(0, g, this.w, 3, '#bc905b');
      this.repeat(camera, 69, (x, col) => {
        const sample = this.decorSample(col, 7);
        const y = g + 22 + this.decorSample(col, 8) * 84;
        this.oval(x + 31, y, 12 + sample * 16, 1.5 + sample * 2, '#5e463629');
        this.oval(x + 44, y + 6, 2.5 + sample * 2, 1.5, '#c69b6d75');
        this.oval(x + 57, y - 2, 2, 1.25, '#6148325e');
        this.line([[x + 30, y + 1], [x + 38 + sample * 9, y + 1]], '#dfad7327', 1.3);
        if (sample > 0.34) {
          const grass = x + 9 + sample * 10;
          this.line([[grass - 5, g + 3], [grass, g + 12], [grass + 2, g + 4]], '#75643d', 2);
          this.line([[grass + 1, g + 12], [grass + 8, g + 5]], '#9a7c47', 1.5);
        }
      });
    }
    c.restore();
  }

  drawScene(state) {
    this.time = state.time;
    const dashing = this.trackRunner(state);
    const impact = this.beginImpact();
    this.background(state.currentStage.id, state.cameraX);
    for (const item of itemsInRange(state.world, state.cameraX - 25, state.cameraX + this.w + 25)) {
      if (!item.collected) this.drawItem(item, item.x - state.cameraX);
    }
    this.drawEffects(state.cameraX);
    if (dashing) this.speedLines(state.turkey, state.cameraX);
    this.drawTurkey(state.turkey, state.turkey.x - state.cameraX, state.farmer.state === 'lunge');
    this.drawFarmer(state.farmer, state.farmer.x - state.cameraX);
    if (!state.frozen || state.currentStage.id === 'farm') this.leaves(state.cameraX);
    this.endImpact(impact);
  }

  trackRunner(state, animate = true) {
    const { turkey, time, world, frozen, shotDustX } = state;
    const previous = this.previousRunner;
    const sameRun = previous?.world === world && time >= previous.time
      && previous.frozen === frozen && previous.shotDustX === shotDustX;
    if (!sameRun) {
      this.effects = [];
      this.lastDust = -Infinity;
      this.lastHit = -Infinity;
      this.shotDustSpawned = false;
    }
    this.previousRunner = { world, time, frozen, shotDustX, x: turkey.x, y: turkey.y, lives: turkey.lives };
    if (frozen) {
      if (!this.shotDustSpawned && Number.isFinite(shotDustX)) {
        this.spawnDust(shotDustX, true, time - 0.1);
        this.shotDustSpawned = true;
      }
      return false;
    }
    if (!sameRun) return false;
    if (turkey.lives < previous.lives) this.lastHit = time;
    if (!animate) return false;

    const distance = turkey.x - previous.x;
    if (turkey.y === 0 && previous.y > 0) {
      this.spawnDust(turkey.x, true);
    } else if (turkey.y === 0 && distance > 0 && time - this.lastDust >= DUST_INTERVAL) {
      this.spawnDust(turkey.x, false);
    }
    const { CRUISE_SPEED, DASH_SPEED } = this.config.turkey;
    const elapsed = time - previous.time;
    return elapsed > 0 && distance / elapsed > (CRUISE_SPEED + DASH_SPEED) / 2;
  }

  spawnDust(x, landing, time = this.time) {
    this.lastDust = time;
    const count = landing ? 6 : 2;
    for (let i = 0; i < count; i++) {
      const spread = i - (count - 1) / 2;
      this.effects.push({
        kind: 'dust', x: x - 8 + spread * 5, y: this.ground - 3,
        vx: landing ? spread * 21 : -28 - i * 13,
        vy: -12 - i * 3, size: landing ? 7 + i % 3 * 2 : 4 + i * 2,
        time, duration: landing ? 0.43 : 0.29,
      });
    }
  }

  spawnCornSparkles(item, time) {
    for (let i = 0; i < 5; i++) {
      const angle = i * TAU / 5 - 0.6;
      this.effects.push({
        kind: 'sparkle', x: item.x + item.w / 2, y: this.ground - item.y,
        vx: Math.cos(angle) * 62, vy: Math.sin(angle) * 56 - 16,
        size: i % 2 ? 3 : 6, time, duration: 0.36 + i * 0.035,
      });
    }
  }

  drawEffects(camera) {
    const c = this.ctx;
    this.effects = this.effects.filter((particle) => this.time - particle.time < particle.duration);
    c.save();
    for (const particle of this.effects) {
      const age = this.time - particle.time;
      const remaining = 1 - age / particle.duration;
      const x = particle.x - camera + particle.vx * age;
      const y = particle.y + particle.vy * age;
      if (particle.kind === 'dust') {
        const size = particle.size * (1 + age * 2);
        const glow = c.createRadialGradient(x, y, 0, x, y, size);
        glow.addColorStop(0, '#ffe3b5');
        glow.addColorStop(1, '#ffe3b500');
        c.globalAlpha = remaining * 0.72;
        this.oval(x, y, size, size * 0.7, glow);
      } else {
        const size = particle.size * (0.45 + remaining * 0.55);
        c.globalAlpha = remaining;
        this.poly([[x, y - size], [x + size * 0.38, y - size * 0.25], [x + size, y],
          [x + size * 0.38, y + size * 0.25], [x, y + size],
          [x - size * 0.38, y + size * 0.25], [x - size, y],
          [x - size * 0.38, y - size * 0.25]], '#fff1a0', '#cc833d');
      }
    }
    c.restore();
  }

  beginImpact() {
    const impact = Math.max(0, 1 - (this.time - this.lastHit) / HIT_SECONDS);
    if (impact === 0) return 0;
    const c = this.ctx;
    c.save();
    const phase = (this.time - this.lastHit) * 92;
    c.translate(Math.sin(phase + 1) * impact * 6, Math.cos(phase) * impact * 3);
    c.translate(this.w / 2, this.h / 2);
    c.scale(1 + 0.011 * impact, 1 + 0.011 * impact);
    c.translate(-this.w / 2, -this.h / 2);
    return impact;
  }

  endImpact(impact) {
    if (impact === 0) return;
    const c = this.ctx;
    c.restore();
    const x = this.w / 2;
    const y = this.h / 2;
    const vignette = c.createRadialGradient(x, y, y * 0.78, x, y, x * 1.15);
    vignette.addColorStop(0, '#b52b3200');
    vignette.addColorStop(1, '#ce3943b0');
    c.save();
    c.globalAlpha = impact;
    this.rect(0, 0, this.w, this.h, vignette);
    c.restore();
  }

  speedLines(turkey, camera) {
    const x = turkey.x - camera;
    const y = this.ground - turkey.y;
    const c = this.ctx;
    c.save();
    for (let i = 0; i < 4; i++) {
      const phase = fraction(this.time * 5 + i * 0.27);
      const end = x - 44 - phase * 56;
      c.globalAlpha = (1 - phase) * 0.72;
      this.line([[end - 19 - i * 6, y - 8 - i * 11], [end, y - 8 - i * 11]], '#fff0c7', 2.3);
    }
    c.restore();
  }

  drawItem(item, x) {
    const { w, h, kind } = item;
    const g = this.ground;
    const y = g - h;
    if (kind !== 'corn') this.shadow(x + w / 2, g + 3, w * 0.57);
    switch (kind) {
      case 'fence':
        this.round(x, y + 22, w, 11, 3, '#4d2c24');
        this.round(x, y + 47, w, 10, 3, '#4d2c24');
        for (let i = 0; i < 3; i++) {
          const left = x + i * (w - 15) / 2;
          this.poly([[left, y + 10], [left + 7, y], [left + 15, y + 9],
            [left + 15, g], [left, g]], '#925737', '#43241f', 3.5);
          this.oval(left + 7, y + 27, 2, 2, INK);
        }
        break;
      case 'crate':
        this.round(x, y, w, h, 4, '#b87646', '#5c352b');
        for (let i = 1; i < 4; i++) this.rect(x + 3, y + i * h / 4, w - 6, 2, '#885038');
        this.line([[x + 5, y + 5], [x + w - 5, g - 5]], '#e0a46b', 8);
        this.line([[x + 5, g - 5], [x + w - 5, y + 5]], '#e0a46b', 8);
        this.round(x + 3, y + 3, w - 6, h - 6, 3, null, '#603629');
        break;
      case 'haybale':
        this.hay(x, g, w, h);
        break;
      case 'pitchfork': {
        const center = x + w / 2;
        const handle = [[center - 8, g - 1], [center + 3, y + 31]];
        const outerTines = [[center - 14, y + 4], [center - 14, y + 22], [center - 8, y + 29],
          [center + 11, y + 29], [center + 17, y + 22], [center + 17, y + 4]];
        const middleTine = [[center + 2, y + 2], [center + 2, y + 29]];
        this.line(handle, '#3c251f', 12);
        this.line(handle, '#70432f', 7);
        this.line(outerTines, '#382622', 9);
        this.line(middleTine, '#382622', 9);
        this.line(outerTines, '#4b4041', 4);
        this.line(middleTine, '#4b4041', 4);
        break;
      }
      case 'oven': {
        this.round(x + w - 40, y, 23, 31, 4, '#34313a', INK);
        this.round(x + w - 44, y, 31, 7, 2, '#68636a');
        this.round(x, y + 22, w, h - 22, 7, '#37333c', INK);
        this.round(x + 5, y + 28, w - 10, 19, 5, '#6a6062');
        for (let i = 0; i < 3; i++) this.oval(x + 18 + i * 17, y + 37, 5, 5, '#211e28');
        this.oval(x + w - 15, y + 37, 4, 4, '#ff7243');
        this.round(x + 10, y + 53, w - 20, h - 62, 5, '#241f28', '#7d6a64');
        this.round(x + 39, y + 57, w - 78, 5, 2, '#a99a8e');
        const cx = x + w / 2;
        const cy = g - 33;
        const flicker = Math.sin(this.time * 14 + item.x * 0.07);
        const heat = this.ctx.createRadialGradient(cx, cy + 5, 3, cx, cy, 36);
        heat.addColorStop(0, '#ffbb6277');
        heat.addColorStop(1, '#f86a2a00');
        this.oval(cx, cy, 37, 28, heat);
        this.oval(cx, cy, 22, 19, this.gradient(cy - 19, cy + 19, '#532832', '#dc592f'), 0, '#d49664');
        this.oval(cx, cy + 9, 15, 5, '#ff883c');
        this.poly([[cx - 13, cy + 10], [cx - 11, cy + 1], [cx - 6 + flicker * 2, cy - 9],
          [cx - 3, cy], [cx + 5, cy - 13 - flicker * 3], [cx + 9, cy - 2], [cx + 13, cy + 10]],
        '#ffb04b');
        this.poly([[cx - 6, cy + 10], [cx - 1, cy + 2], [cx + 3 + flicker, cy - 3],
          [cx + 7, cy + 10]], '#fff0a1');
        break;
      }
      case 'knife': {
        const [blade, block] = item.parts;
        const top = g - blade.bottom - blade.h;
        const bx = x + block.xOffset;
        this.round(bx, y + 14, block.w, h - 14, 5, '#955237', '#532f2c');
        this.rect(bx + 4, y + 22, block.w - 8, 6, '#cf8a53');
        this.line([[bx + 11, y + 32], [bx + 14, g - 7]], '#b6764d', 3);
        this.line([[bx + 30, y + 29], [bx + 26, g - 7]], '#663b31', 3);
        this.poly([[x, top], [bx + 4, top], [bx + 4, g - blade.bottom],
          [x + 21, g - blade.bottom], [x + 6, g - blade.bottom - 7]],
          this.gradient(top, g - blade.bottom, '#888fa1', '#fff3df'), '#554e58');
        this.line([[x + 7, top + 4], [bx - 3, top + 4]], '#faf3e6', 2);
        const edgeY = g - blade.bottom;
        this.line([[x + 22, edgeY - 1], [bx - 4, edgeY - 1]], '#fff9de', 2.4);
        const glintX = x + 42;
        this.poly([[glintX - 8, edgeY - 4], [glintX - 1, edgeY - 5], [glintX + 1, edgeY - 12],
          [glintX + 3, edgeY - 5], [glintX + 10, edgeY - 4], [glintX + 3, edgeY - 2],
          [glintX + 1, edgeY + 4], [glintX - 1, edgeY - 2]], '#fff9e7');
        this.round(bx - 3, top - 3, block.w + 3, 15, 4, '#302a35', INK);
        this.oval(bx + 10, top + 4, 2, 2, '#d3bb9d');
        this.oval(bx + 30, top + 4, 2, 2, '#d3bb9d');
        break;
      }
      case 'corn': {
        const c = this.ctx;
        const cx = x + w / 2;
        const cy = g - item.y + Math.sin(this.time * 6 + x / 40) * 3;
        this.shadow(cx, g + 2, w * 0.5, 3);
        const radius = w * 1.2;
        const halo = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
        halo.addColorStop(0, '#fff0a7bb');
        halo.addColorStop(0.42, '#ffc34d80');
        halo.addColorStop(1, '#ffc34d00');
        this.oval(cx, cy, radius, radius, halo);

        c.save();
        c.translate(cx, cy);
        c.scale(1.35, 1.35);
        this.oval(0, 0, 6, 10, '#ffd158', 0.29, '#935632');
        for (let i = -1; i <= 1; i++) this.oval(0, i * 4, 4, 1, '#e39d31');
        this.poly([[3 - w / 2, -2], [0, 4], [w / 2 - 3, 0], [0, 11]], '#748a44');
        c.restore();
        break;
      }
      case 'arch':
        this.round(x + 3, y + 12, 17, h - 12, 4, '#ab7147', '#613c32');
        this.round(x + w - 20, y + 12, 17, h - 12, 4, '#ab7147', '#613c32');
        this.poly([[x, y], [x + w, y], [x + w - 10, y + 22],
          [x + w, y + 45], [x, y + 45], [x + 10, y + 22]], '#b44638', '#6b332f');
        this.text('PARDON!', x + w / 2, y + 23, 26, GOLD);
        break;
    }
  }

  hay(x, ground, w, h) {
    this.oval(x + w * 0.53, ground - h / 2, w * 0.47, h / 2, '#d49642', 0, '#86512e');
    this.oval(x + w * 0.4, ground - h / 2, w * 0.39, h / 2, '#f5bb50', 0, '#9c6331');
    const spiral = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      spiral.push([x + w * (0.4 + Math.cos(t * TAU * 2.5) * t * 0.31),
        ground - h * (0.5 + Math.sin(t * TAU * 2.5) * t * 0.39)]);
    }
    this.line(spiral, '#b77a38', 2.5);
  }

  drawTurkey(turkey, x, alarmed) {
    const lift = turkey.y ?? 0;
    this.shadow(x, this.ground + 4, Math.max(9, 33 - lift * 0.11) * CHARACTER_SCALE, 8);
    this.turkeyPose(x, this.ground - lift, { ...turkey, airborne: lift > 0, alarmed }, CHARACTER_SCALE);
  }

  sweatDrop(x, y, scale = 1) {
    const c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-5, -2, -10, 0);
    c.quadraticCurveTo(-14, 3, -10, 6);
    c.quadraticCurveTo(-6, 8, 0, 0);
    c.closePath();
    this.paint('#b2dce7', '#608494', 1.1);
    c.restore();
  }

  turkeyPose(x, y, turkey = {}, scale = 1, angle = 0) {
    const c = this.ctx;
    const duck = turkey.ducking;
    const bodyY = duck ? -15 : -28;
    const phase = (turkey.runPhase ?? 0) * TAU;
    const ink = '#59342c';
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(scale, scale);

    for (const side of [-1, 1]) {
      const stride = Math.sin(phase) * side;
      const lift = turkey.airborne ? 11 + side * 4 : Math.max(0, Math.cos(phase) * side) * 7;
      const foot = turkey.airborne ? side * 6 : side * 7 + stride * (duck ? 8 : 14);
      const leg = [[side * 6, bodyY + 9], [foot * 0.46 - 5, -8 - lift * 0.64],
        [foot, -2 - lift], [foot + 8, -2 - lift]];
      this.line(leg, ink, 4.8);
      this.line(leg, side < 0 ? '#ad633d' : '#ec9a4c', 2.5);
      this.line([[foot + 2, -2 - lift], [foot + 6, -5 - lift]], '#dc8646', 1.6);
    }

    const featherColors = ['#9b3f37', '#b65236', '#ce663d', '#dc8749', '#edaa60'];
    for (let i = 0; i < featherColors.length; i++) {
      const length = 40 + i * 2;
      c.save();
      c.translate(duck ? -22 : -16, bodyY + 2);
      c.rotate(-1.39 + i * (duck ? 0.22 : 0.29) + (duck ? 0.13 : 0));
      this.oval(0, -length * 0.55, 8, length * 0.51, featherColors[i], 0, ink);
      this.oval(-2, -length * 0.71, 3, length * 0.23, '#ffcb8248');
      this.line([[0, -10], [-1, -length + 6]], '#713d36', 1.4);
      this.line([[-4, -length + 11], [0, -length + 15], [5, -length + 10]], '#ffcd8f85', 1.4);
      c.restore();
    }

    const bodyWidth = duck ? 29 : 25;
    const bodyHeight = duck ? 12 : 18;
    this.oval(0, bodyY, bodyWidth, bodyHeight, '#e9bf88');
    c.save();
    c.clip();
    this.oval(-6, bodyY - 8, bodyWidth + 1, bodyHeight * 0.81, '#fff0cf');
    this.oval(10, bodyY + bodyHeight, bodyWidth * 0.95, bodyHeight * 0.53, '#ba7e57');
    this.oval(-10, bodyY - 10, 11, 4, '#fff9e0', -0.23);
    c.restore();
    this.oval(0, bodyY, bodyWidth, bodyHeight, null, 0, ink);

    const wingAngle = turkey.despair ? (angle ? 0.95 : -0.95) : turkey.celebrate ? 0.86 : turkey.airborne
      ? Math.sin(this.time * 23 + phase) * 0.73 - (turkey.vy > 0 ? 0.1 : 0.35)
      : -0.22 + Math.cos(phase) * 0.09;
    c.save();
    c.translate(-8, bodyY - 1);
    c.rotate(wingAngle);
    this.oval(-5, 2, 15, 8, '#dbab76', -0.08, '#956044');
    this.oval(-7, 0, 10, 4, '#f4d5a6', -0.08);
    this.line([[-16, 4], [-9, 6], [-3, 4]], '#a9704e', 1.4);
    c.restore();

    const headX = duck ? 31 : 22;
    const headY = turkey.despair ? -57 : duck ? -18 : -50;
    this.oval(duck ? 20 : 16, duck ? -15 : turkey.despair ? -40 : -36, 8, duck ? 8 : 14, '#d9a579',
      duck ? Math.PI / 2 : 0.29, ink);
    this.oval(headX, headY, 11, 10, '#f7d4a3', 0, ink);
    this.oval(headX + 4, headY + 9, 4.5, 7, '#b63a3a', -0.29, '#793232');
    this.oval(headX + 3, headY + 8, 1.6, 3, '#eb6453', -0.29);
    this.poly([[headX + 7, headY - 3], [headX + 20, headY + 1], [headX + 7, headY + 5]],
      '#f3ad54', ink);
    this.poly([[headX + 8, headY + 1], [headX + 18, headY + 1], [headX + 8, headY + 4]],
      '#c97139');
    this.line([[headX + 4, headY - 8], [headX + 10, headY - 5], [headX + 11, headY - 1]],
      '#b6383a', 3.8);
    if (turkey.despair) {
      this.oval(headX + 1, headY - 2, 4.8, 4.3, '#fff8df', 0, ink);
      this.oval(headX + 2, headY - 1, 2.2, 2.6, '#332229');
      this.line([[headX - 3, headY - 5], [headX + 4, headY - 7]], ink, 1.6);
      this.oval(headX - 2, headY - 8, 2, 3.6, '#a9d8e9', 0.2, '#6b8199');
    } else if (turkey.alarmed) {
      this.oval(headX + 1, headY - 2.5, 5.5, 6.2, '#fff8df', 0, ink);
      this.oval(headX + 2.5, headY - 2.5, 2.5, 3.4, '#332229');
      this.oval(headX + 3.1, headY - 3.9, 1, 1, '#fff8df');
      this.sweatDrop(headX - 8, headY - 9, 0.65);
    } else if (turkey.hidden && this.time % 2.8 > 2.60) {
      this.line([[headX - 1, headY - 2], [headX + 4, headY - 2]], ink);
    } else {
      this.oval(headX + 1, headY - 2, 4, 4.5, '#fff8df');
      this.oval(headX + 2, headY - 2, 2.7, 3.4, '#332229');
      this.oval(headX + 2.8, headY - 3.3, 1, 1, '#fff8df');
    }
    c.restore();
  }

  drawFarmer(farmer, x) {
    this.shadow(x, this.ground + 3, 39 * CHARACTER_SCALE, 8);
    this.farmerPose(x, this.ground, farmer, CHARACTER_SCALE);
    if (farmer.state === 'search') this.text('?', x, this.ground - 145 * CHARACTER_SCALE, 37, GOLD);
  }

  farmerPose(x, y, farmer = {}, scale = 1, holding = false) {
    const c = this.ctx;
    const phase = (farmer.runPhase ?? 0) * TAU;
    const running = !holding && farmer.state !== undefined;
    const sprinting = !holding && farmer.state === 'chase';
    const searching = farmer.state === 'search';
    const lunging = farmer.state === 'lunge';
    const stride = running ? Math.sin(phase) * 25 : 0;
    c.save();
    c.translate(x, y);
    c.scale(scale * (farmer.facing ?? 1), scale);

    for (const side of [-1, 1]) {
      const foot = side * (9 + stride);
      const lift = running ? Math.max(0, Math.cos(phase) * side) * 12 : 0;
      const knee = foot * 0.62 + (side === 1 ? 4 : -4);
      const leg = [[side * 8, -47], [knee, -25 - lift * 0.42], [foot, -8 - lift]];
      this.line(leg, '#2e333f', 17);
      this.line(leg, side === 1 ? '#496f87' : '#344c66', 12);
      this.line([[knee + 2, -24 - lift * 0.42], [foot + 2, -11 - lift]], '#7799a5', 2.2);
      this.round(foot - 6, -12 - lift, 19, 10, 4, '#422b2b', '#2f2329');
      this.line([[foot - 4, -3 - lift], [foot + 10, -3 - lift]], '#211b23', 2.5);
    }

    if (lunging) {
      c.translate(0, -44);
      c.rotate(0.49);
      c.translate(0, 44);
    } else if (running) {
      c.translate(0, -Math.abs(Math.cos(phase)) * 2);
      if (sprinting) {
        c.translate(0, -44);
        c.rotate(0.2);
        c.translate(0, 44);
      }
    }

    const arm = (side) => {
      const near = side === 1;
      const shoulder = near ? [-6, -85] : [-11, -86];
      const swing = -side * (9 + stride) / 34 * (sprinting ? 1.11 : 0.78);
      const forearmAngle = -0.22 - swing * 0.36;
      let elbow = [shoulder[0] + Math.sin(swing) * 22, shoulder[1] + Math.cos(swing) * 22];
      let wrist = [elbow[0] + Math.cos(forearmAngle) * 18, elbow[1] + Math.sin(forearmAngle) * 18];
      if (near && holding) {
        elbow = [24, -92];
        wrist = [53, -104];
      } else if (lunging) {
        elbow = near ? [22, -88] : [-29, -74];
        wrist = near ? [47, -85] : [-38, -70];
      } else if (searching && near) {
        elbow = [13, -78];
        wrist = [24, -107];
      } else if (!running || searching) {
        elbow = near ? [-17, -65] : [-19, -66];
        wrist = near ? [-3, -56] : [-12, -56];
      }

      this.line([shoulder, elbow, wrist], '#572d31', 14);
      this.line([shoulder, elbow, wrist], near ? '#bc513e' : '#873b3a', 10);
      this.line([[shoulder[0] + 1, shoulder[1] - 2],
        [(shoulder[0] + elbow[0]) / 2 + 1, (shoulder[1] + elbow[1]) / 2 - 2]],
        near ? '#df6b4f' : '#a34e43', 2.4);
      c.save();
      c.translate(...wrist);
      c.rotate(Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]));
      this.round(-4, -4.5, 12, 9, 3.1, near ? '#edae79' : '#c3815e', '#784b3d');
      this.line([[3, -2], [6, -2]], near ? '#f7c498' : '#da9970', 1.3);
      c.restore();
    };
    arm(-1);

    // The back tapers into the hip while the chest projects ahead of it.
    const chest = running ? 4 : 0;
    c.beginPath();
    c.moveTo(-18, -42);
    c.quadraticCurveTo(-21, -61, -17, -79);
    c.quadraticCurveTo(-15, -93, -5 + chest, -95);
    c.quadraticCurveTo(7 + chest, -98, 16 + chest, -89);
    c.quadraticCurveTo(23 + chest, -79, 17, -65);
    c.quadraticCurveTo(12, -55, 15, -43);
    c.closePath();
    this.paint('#b6493d', '#583036');
    c.save();
    c.clip();
    this.poly([[-22, -95], [-9, -95], [-10, -72], [-7, -53], [-12, -38], [-23, -38]], '#813739');
    this.poly([[6, -97], [27, -97], [27, -72], [17, -65], [16, -81]], '#dd6a4d');
    for (let i = -15; i <= 20; i += 12) this.rect(i, -95, 4, 57, '#792d386e');
    for (let i = -88; i < -37; i += 11) this.rect(-23, i, 51, 4, '#792d3888');
    c.restore();

    // One strap crosses the visible shoulder into the narrow bib at the chest.
    this.poly([[-19, -57], [-4, -59], [5, -64], [11 + chest, -76], [19 + chest, -75],
      [15, -60], [16, -44], [9, -38], [-14, -38], [-19, -44]], '#517890', '#354456');
    this.poly([[-18, -55], [-10, -56], [-9, -48], [-5, -39], [-14, -39], [-18, -44]], '#3d5a74');
    this.line([[2 + chest, -93], [10 + chest, -88], [13 + chest, -75]], '#354456', 7);
    this.line([[2 + chest, -93], [10 + chest, -88], [13 + chest, -75]], '#648da2', 4.5);
    this.oval(13 + chest, -74, 2.2, 2.2, GOLD);
    this.poly([[-12, -53], [0, -54], [-3, -45], [-8, -43], [-11, -46]], '#7199ab', '#44637d');
    this.line([[-10, -51], [-2, -52]], '#8bb0bc', 1.3);
    arm(1);

    this.oval(6, -104, 19, 21, '#d08c63', 0, '#633d36');
    this.oval(9, -109, 15, 13, '#efb381');
    this.oval(-8, -103, 5, 6, '#d79568', 0, '#885943');
    this.oval(24, -101, 6.5, 5.2, '#eaa978', 0, '#885943');
    this.oval(25, -102.4, 3.4, 1.6, '#f7c498');
    this.oval(18, -111, 3.6, 3.5, '#ffebce');
    this.oval(19, -111, 1.5, 2.1, INK);
    const brow = searching ? -3 : 2;
    this.line([[13, -116 - brow], [18, -115], [21, -115 - brow * 0.5]], '#59352f', 2.7);
    this.poly([[11, -99], [17, -101], [23, -98], [22, -95], [17, -97],
      [12, -95], [8, -96]], '#653e33');
    if (holding) {
      this.poly([[11, -94], [24, -96], [21, -89], [16, -88]], '#67382f', '#633d36');
      this.line([[13, -93], [22, -94]], '#fff0ca', 2.2);
    } else {
      this.line([[13, -92], [20, -93]], '#77483c', 2);
    }

    this.round(-18, -137, 39, 25, 7, '#dca054', '#704b34');
    this.round(-15, -135, 27, 12, 5, '#f4c978');
    this.rect(-16, -122, 35, 5, '#854b39');
    this.rect(-15, -122, 14, 2, '#be784c');
    this.oval(3, -115, 33, 6, '#b77948', -0.06, '#704b34');
    this.oval(2, -117, 31, 4, '#f3c477', -0.06);
    if (!holding && (sprinting || lunging)) this.sweatDrop(-33, -129);
    c.restore();
  }

  leaves(camera) {
    const c = this.ctx;
    c.save();
    for (let i = 0; i < 18; i++) {
      const offset = fraction(Math.sin((i + 1) * 119.71) * 43758.5453);
      const phase = this.time * (0.71 + offset * 0.6) + i * 2.4;
      const x = fraction(offset + (this.time * (24 + i % 5 * 7)
        - camera * (0.09 + offset * 0.14) + Math.sin(phase) * 16) / (this.w + 34)) * (this.w + 34) - 17;
      const y = fraction(i * 0.618034 + this.time * (17 + offset * 36) / (this.h + 28)) * (this.h + 28) - 14;
      const size = 4 + offset * 4;
      c.save();
      c.translate(x, y);
      c.rotate(phase * 0.72);
      c.globalAlpha = 0.61 + offset * 0.23;
      this.poly([[-size, 0], [-size * 0.27, -size * 0.44], [size * 0.47, -size * 0.36],
        [size, 0], [size * 0.33, size * 0.39], [-size * 0.37, size * 0.30]],
        LEAF_COLORS[i % LEAF_COLORS.length]);
      this.line([[-size * 0.76, 0], [size * 0.59, -0.4]], '#8c4935', 0.8);
      c.restore();
    }
    c.restore();
  }

  drawHUD(state) {
    const { turkey, world, currentStage } = state;
    this.round(22, 17, this.w - 44, 91, 18, '#39272beF', '#a96c4d');
    this.text('SCORE', 48, 40, 15, '#f1bb7d', 'left');
    this.text(String(state.score).padStart(6, '0'), 48, 72, 32, CREAM, 'left');
    this.drawFarmerProximity(Math.abs(turkey.x - state.farmer.x));
    const left = 391;
    const barWidth = 498;
    const progress = turkey.x / world.totalLength;
    for (const [i, stage] of world.stages.entries()) {
      const offset = stage.startX / world.totalLength * barWidth;
      const width = stage.length / world.totalLength * barWidth;
      this.text(STAGE_LABELS[i], left + offset + width / 2, 39, 14,
        i === currentStage.stageIndex ? GOLD : '#e4c4a9');
      this.round(left + offset, 54, width - 4, 10, 4, ['#dd8d4d', '#ae6350', '#d58873'][i]);
    }
    this.headIcon(left + progress * barWidth, 60, true);
    this.text(currentStage.name, this.w / 2, 87, 19);
    this.text(`DIST ${state.distance} m`, this.w - 48, 41, 23, CREAM, 'right');
    for (let i = 0; i < this.config.turkey.LIVES; i++) {
      this.headIcon(this.w - 119 + i * 30, 76, i < turkey.lives);
    }
    if (state.stageBanner > 0) {
      const c = this.ctx;
      c.save();
      const duration = this.config.presentation.STAGE_BANNER_SECONDS;
      c.globalAlpha = Math.min(1, state.stageBanner * 3, (duration - state.stageBanner) * 5);
      this.text(`STAGE ${currentStage.stageIndex + 1} — ${currentStage.name.toUpperCase()}`,
        this.w / 2, 163, 33, GOLD);
      c.restore();
    }
    if (state.flashSpotted > 0) this.text('SPOTTED!', this.w / 2, 231, 46, '#ff6854');
    else if (turkey.hidden) this.text('HIDDEN', this.w / 2, 231, 38, '#a3db80');
  }

  drawFarmerProximity(distance) {
    const calmDistance = 700;
    const hotDistance = 140;
    const fill = Math.max(0, Math.min(1, (calmDistance - distance) / (calmDistance - hotDistance)));
    const hot = distance <= hotDistance;
    const x = 188;
    const width = 166;
    this.text('FARMER', x, 40, 15, hot ? '#ff997f' : '#f1bb7d', 'left');
    this.round(x, 54, width, 13, 5, '#291c22', '#8e5d4b');
    if (fill > 0) this.round(x + 2, 56, (width - 4) * fill, 9, 4, hot ? '#f96250' : '#f1ab50');
    if (hot) this.text('RIGHT BEHIND YOU!', x, 84, 14, '#ff9b86', 'left');
  }

  headIcon(x, y, filled) {
    this.oval(x, y, 9, 10, filled ? CREAM : '#5a4041', 0, '#2b2128');
    this.poly([[x + 6, y - 3], [x + 15, y + 1], [x + 6, y + 4]],
      filled ? GOLD : '#84605b', INK);
    this.oval(x + 3, y - 3, 2, 2, INK);
    if (filled) this.oval(x + 7, y + 6, 2.5, 3.5, '#bc483b');
  }

  leafFrame() {
    const c = this.ctx;
    const colors = ['#a95238', '#c76f40', '#da914e', '#efb765'];
    for (const side of [-1, 1]) {
      for (const edge of [-1, 1]) {
        for (let i = 0; i < 8; i++) {
          const sample = this.decorSample(i + side * 9, edge + 25);
          const insetX = 22 + i * 13 + sample * 18;
          const insetY = 25 + (7 - i) * 6 + sample * 17;
          const size = 12 + sample * 12;
          c.save();
          c.translate(side < 0 ? insetX : this.w - insetX, edge < 0 ? insetY : this.h - insetY);
          c.rotate(side * edge * (0.37 + sample * 1.17));
          c.globalAlpha = 0.66 + sample * 0.24;
          this.poly([[-size, 0], [-size * 0.56, -size * 0.36], [-size * 0.22, -size * 0.29],
            [size * 0.19, -size * 0.47], [size, -size * 0.06], [size * 0.27, size * 0.38],
            [-size * 0.17, size * 0.28], [-size * 0.48, size * 0.36]],
            colors[i % colors.length], '#87513b');
          this.line([[-size * 0.95, 0], [size * 0.61, -size * 0.04]], '#87513b', 1.3);
          c.restore();
        }
      }
    }
  }

  drawTitle(state) {
    this.time = state.time;
    this.background('farm', 28);
    this.leaves(28);
    const phase = this.time * 1.45;
    this.shadow(200, this.ground + 9, 104, 14);
    this.farmerPose(200, this.ground + 5, { facing: 1, state: 'chase', runPhase: phase }, 1.95 * CHARACTER_SCALE);
    this.shadow(755, this.ground + 8, 151, 15);
    this.turkeyPose(755, this.ground + 3, { runPhase: phase + 0.28 }, 3.15 * CHARACTER_SCALE);
    this.leafFrame();
    this.text('PARDON!', 640, 163, 139, '#ffa64e');
    this.text('The Great Turkey Escape', 640, 250, 43);
    this.text('The farmer wants dinner. You ARE dinner. RUN!', 640, 295, 23);
    this.bottomPrompt('← → speed · ↑ / SPACE jump · ↓ duck & hide · ENTER start',
      'Press ENTER or tap to start', true);
  }

  bottomPrompt(details, prompt, blink = false) {
    this.round(215, 626, 850, 73, 14, '#35262ceF', '#b47a55');
    this.text(details, 640, 647, 17, '#ead2b5');
    if (!blink || this.time % 1.3 < 1.03) this.text(prompt, 640, 677, 23, GOLD);
  }

  drawCaught(state) {
    this.time = state.time;
    this.trackRunner(state, false);
    const impact = this.beginImpact();
    this.background('kitchen', 184);
    this.rect(0, 0, this.w, this.h, '#291b2b89');
    this.text('CAUGHT!', 640, 122, 112, '#ff8062');
    this.text('The dinner is back on...', 640, 194, 31);
    this.shadow(608, this.ground + 8, 156, 17);
    this.farmerPose(530, this.ground, { facing: 1 }, 2.28 * CHARACTER_SCALE, true);
    this.turkeyPose(686, this.ground - 328, { airborne: true, despair: true }, 1.94 * CHARACTER_SCALE, Math.PI);
    this.leafFrame();
    this.endPrompt(state);
    this.endImpact(impact);
  }

  drawEscaped(state) {
    this.time = state.time;
    this.background('farm', 176, true);
    this.text('ESCAPED!', 640, 150, 110, GOLD);
    this.text('One turkey, officially pardoned.', 640, 226, 32);
    this.shadow(465, this.ground + 8, 161, 15);
    this.turkeyPose(470, this.ground + 1, { celebrate: true }, 3.55 * CHARACTER_SCALE);
    const c = this.ctx;
    c.save();
    c.translate(805, 479);
    c.rotate(-0.11);
    this.round(-117, -75, 234, 146, 7, '#ffe5aa', '#8a5739');
    this.round(-130, -82, 259, 18, 8, '#edbf79', '#8a5739');
    this.round(-128, 60, 257, 18, 8, '#edbf79', '#8a5739');
    this.text('PRESIDENTIAL', 0, -29, 22, '#764331', 'center', null);
    this.text('PARDON', 0, 2, 36, '#8d4635', 'center', null);
    this.oval(0, 39, 13, 13, '#b8473a', 0, '#8b3534');
    this.text('★', 0, 39, 15, GOLD, 'center', null);
    c.restore();
    this.leafFrame();
    this.endPrompt(state);
  }

  endPrompt(state) {
    this.bottomPrompt(`FINAL SCORE ${String(state.score).padStart(6, '0')}    ·    DIST ${state.distance} m`,
      'Press ENTER to run again');
  }
}
