import { itemsInRange } from './world.js';

const INK = '#382422';
const CREAM = '#fff1cd';
const GOLD = '#ffc15b';
const TAU = Math.PI * 2;
const LEAF_COLORS = ['#c74731', '#e77835', '#ffbf55'];
const STAGE_LABELS = ['FARM', 'BARN', 'KITCHEN'];

export class Renderer {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.w = config.view.W;
    this.h = config.view.H;
    this.ground = config.view.GROUND_Y;
    this.time = 0;
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

  poly(points, fill, stroke) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.closePath();
    this.paint(fill, stroke);
  }

  paint(fill, stroke) {
    const c = this.ctx;
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 2;
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
    this.oval(x, y, w, h, '#281b1c38');
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
    this.rect(0, 0, this.w, g, this.gradient(0, g, sunrise ? '#eb826a' : palette.sky, '#fff0b9'));
    const sunX = sunrise ? 965 : 1008;
    const sunY = sunrise ? 320 : 172;
    this.oval(sunX, sunY, 93, 93, '#fff2ba4d');
    this.oval(sunX, sunY, 70, 70, '#fff5bf');
    this.repeat(camera * 0.3, 420, (x, i) => {
      const y = 170 + Math.cos(i * 2.2) * 84;
      this.oval(x + 135, y, 77, 11, '#fff8db75');
      this.oval(x, g + 28, 330, 221 + Math.cos(i * 1.6) * 21, '#b68a72');
      this.oval(x + 156, g + 40, 280, 177 + Math.sin(i * 1.2) * 30, '#d4a568');
    });
    this.repeat(camera * 0.6, 950, (x) => {
      this.rect(x + 275, g - 165, 147, 95, '#a74737');
      this.poly([[x + 256, g - 157], [x + 347, g - 224], [x + 438, g - 157]], '#753d36');
      this.rect(x + 324, g - 138, 49, 67, '#78372b');
      this.line([[x + 325, g - 133], [x + 372, g - 73]], '#d77d59', 4);
      this.line([[x + 371, g - 133], [x + 325, g - 73]], '#d77d59', 4);
    });
    this.repeat(camera * 0.6, 225, (x, i) => {
      const y = g - 130 - Math.cos(i * 2.7) * 32;
      this.line([[x, g - 40], [x + 7, y - 30]], '#794737', 12);
      this.line([[x + 3, y + 40], [x - 29, y - 9]], '#794737', 5);
      const color = i % 2 ? '#bb4e39' : palette.accent;
      this.oval(x - 18, y, 42, 38, color);
      this.oval(x + 25, y - 5, 45, 39, color);
      this.oval(x + 3, y - 29, 46, 39, i % 2 ? '#d86b40' : '#f3a044');
    });
    this.rect(0, g - 52, this.w, 52, '#a87943');
    this.repeat(camera * 0.6, 85, (x) => {
      this.line([[x, g - 34], [x + 85, g - 33]], '#88573a', 6);
      this.line([[x, g - 53], [x, g - 9]], '#774830', 8);
      this.line([[x, g - 54], [x, g - 31]], '#cb8e57', 3);
    });
  }

  barn(camera, palette) {
    const g = this.ground;
    this.rect(0, 0, this.w, g, this.gradient(0, g, '#513238', palette.sky));
    this.repeat(camera * 0.3, 57, (x, i) => {
      this.rect(x + 1, 0, 54, g, i % 3 ? '#e6a16e15' : '#2f1b2a22');
      this.rect(x, 0, 2, g, '#301b2b66');
      this.line([[x + 14, 193], [x + 18, 365]], '#f6b98718');
    });
    this.repeat(camera * 0.6, 565, (x) => {
      this.rect(x + 8, 0, 27, g, '#55302c');
      this.rect(x + 35, 0, 6, g, '#c37c50');
      this.round(x + 132, 146, 125, 137, 4, '#ffd58c', '#42242a');
      this.line([[x + 194, 148], [x + 194, 282]], '#7c4731', 7);
      this.line([[x + 134, 217], [x + 255, 217]], '#7c4731', 7);
      this.poly([[x + 133, 283], [x + 257, 283], [x + 478, g], [x + 207, g]],
        this.gradient(280, g, '#ffdf8647', '#ffd77600'));
      this.round(x + 360, 263, 145, 12, 4, '#623731');
      this.line([[x + 391, 275], [x + 388, 339]], '#482932', 7);
      this.oval(x + 388, 351, 13, 19, '#482932');
      this.line([[x + 463, 274], [x + 463, 339], [x + 482, 339]], '#482932', 7);
      this.oval(x + 449, g - 15, 78, 23, '#a7683c');
      this.oval(x + 501, g - 10, 61, 19, '#c28848');
    });
    this.rect(0, 93, this.w, 23, '#57312e');
    this.rect(0, 93, this.w, 4, '#c38154');
    this.rect(0, g - 15, this.w, 15, '#633a32');
  }

  kitchen(camera, palette) {
    const g = this.ground;
    this.rect(0, 0, this.w, g, this.gradient(0, g, '#fff1d0', palette.sky));
    this.repeat(camera * 0.3, 86, (x) => {
      for (let y = 105; y < g; y += 62) {
        this.round(x + 2, y + 2, 82, 58, 5, '#fff5de70', '#d8aa8c');
      }
    });
    this.repeat(camera * 0.6, 570, (x) => {
      this.round(x + 39, 205, 239, 13, 4, '#875348');
      for (let i = 0; i < 4; i++) {
        const left = x + 62 + i * 48;
        const height = i % 2 ? 50 : 39;
        this.round(left, 204 - height, 28, height, 6, ['#c76144', '#dfa860', '#8a8e60', '#b87661'][i], '#875348');
        this.rect(left + 2, 200 - height, 24, 8, '#714840');
        this.rect(left + 6, 186, 16, 9, CREAM);
      }
      this.line([[x + 330, 230], [x + 515, 230]], '#946252', 8);
      for (let i = 0; i < 3; i++) {
        const left = x + 360 + i * 64;
        this.line([[left, 230], [left, 279 + i * 9]], '#5c4850', 6);
        this.oval(left, 293 + i * 9, 24 + i * 2, 20 + i * 2, '#73545a', 0, '#523c45');
        this.oval(left, 292 + i * 9, 15 + i * 2, 12 + i * 2, '#8d6969');
      }
      this.round(x + 70, g - 145, 401, 144, 5, '#aa6353');
      for (let i = 0; i < 4; i++) {
        this.round(x + 80 + i * 97, g - 124, 91, 105, 6, '#c47c66', '#8d5348');
        this.round(x + 112 + i * 97, g - 110, 26, 5, 2, '#f8cf92');
      }
      this.round(x + 58, g - 153, 427, 21, 5, '#fff0cc', '#986552');
    });
    this.rect(0, 94, this.w, 8, palette.accent);
  }

  floor(id, camera, palette) {
    const g = this.ground;
    this.rect(0, g, this.w, this.h - g, palette.ground);
    if (id === 'kitchen') {
      this.repeat(camera, 78, (x, col) => {
        for (let row = 0; row < 3; row++) {
          this.rect(x, g + row * 40, 78, 40, (col + row) % 2 ? '#8e4f4e' : '#e1ad8c');
        }
      });
      this.rect(0, g, this.w, 4, '#f5cf9c');
    } else if (id === 'barn') {
      for (let row = 0; row < 4; row++) {
        const y = g + row * 35;
        this.rect(0, y, this.w, 3, '#35232a');
        this.repeat(camera + row * 85, 255, (x) => {
          this.rect(x, y, 3, 35, '#35232a');
          this.line([[x + 27, y + 13], [x + 126, y + 14]], '#936046', 2);
          this.oval(x + 9, y + 9, 2, 2, '#35232a');
        });
      }
    } else {
      this.rect(0, g, this.w, 8, '#c49155');
      this.repeat(camera, 66, (x, i) => {
        const y = g + 11 + 62 * Math.abs(Math.sin(i * 18));
        this.oval(x + 23, y, 8, 2, '#ab8056');
        this.line([[x - 5, g + 7], [x - 13, g - 7], [x - 4, g + 2],
          [x + 3, g - 11], [x + 2, g + 7]], '#7a6939', 3);
      });
    }
  }

  drawScene(state) {
    this.time = state.time;
    this.background(state.currentStage.id, state.cameraX);
    for (const item of itemsInRange(state.world, state.cameraX - 25, state.cameraX + this.w + 25)) {
      if (!item.collected) this.drawItem(item, item.x - state.cameraX);
    }
    this.drawTurkey(state.turkey, state.turkey.x - state.cameraX);
    this.drawFarmer(state.farmer, state.farmer.x - state.cameraX);
    this.leaves(state.particles);
  }

  drawItem(item, x) {
    const { w, h, kind } = item;
    const g = this.ground;
    const y = g - h;
    if (kind !== 'corn') this.shadow(x + w / 2, g + 3, w * 0.57);
    switch (kind) {
      case 'fence':
        this.round(x, y + 22, w, 11, 3, '#794432');
        this.round(x, y + 47, w, 10, 3, '#794432');
        for (let i = 0; i < 3; i++) {
          const left = x + i * (w - 15) / 2;
          this.poly([[left, y + 10], [left + 7, y], [left + 15, y + 9],
            [left + 15, g], [left, g]], '#c28655', '#633a31');
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
        this.line([[center - 8, g - 1], [center + 3, y + 31]], '#905c45', 8);
        this.line([[center - 14, y + 4], [center - 14, y + 22], [center - 8, y + 29],
          [center + 11, y + 29], [center + 17, y + 22], [center + 17, y + 4]], '#4c4249', 5);
        this.line([[center + 2, y + 2], [center + 2, y + 29]], '#4c4249', 5);
        break;
      }
      case 'oven':
        this.round(x + w - 40, y, 23, 31, 4, '#34313a', INK);
        this.round(x + w - 44, y, 31, 7, 2, '#68636a');
        this.round(x, y + 22, w, h - 22, 7, '#37333c', INK);
        this.round(x + 5, y + 28, w - 10, 19, 5, '#6a6062');
        for (let i = 0; i < 3; i++) this.oval(x + 18 + i * 17, y + 37, 5, 5, '#211e28');
        this.oval(x + w - 15, y + 37, 4, 4, '#ff7243');
        this.round(x + 10, y + 53, w - 20, h - 62, 5, '#241f28', '#7d6a64');
        this.round(x + 39, y + 57, w - 78, 5, 2, '#a99a8e');
        this.oval(x + w / 2, g - 34, 22, 19, '#793636', 0, '#bb825d');
        this.oval(x + w / 2, g - 31, 16, 12, '#e55b37');
        this.poly([[x + 54, g - 26], [x + 62, g - 44], [x + 66, g - 34],
          [x + 73, g - 47], [x + 79, g - 26]], '#ffb54c');
        break;
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

  drawTurkey(turkey, x) {
    const lift = turkey.y ?? 0;
    this.shadow(x, this.ground + 4, Math.max(9, 33 - lift * 0.11));
    this.turkeyPose(x, this.ground - lift, { ...turkey, airborne: lift > 0 });
  }

  turkeyPose(x, y, turkey = {}, scale = 1, angle = 0) {
    const c = this.ctx;
    const duck = turkey.ducking;
    const stride = turkey.airborne ? 0 : Math.sin((turkey.runPhase ?? 0) * TAU) * (duck ? 7 : 13);
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(scale, scale);
    const bodyY = duck ? -13 : -27;
    for (const leg of [-1, 1]) {
      const footX = leg * (7 + stride);
      const footY = turkey.airborne ? -10 - leg * 4 : -1;
      this.line([[leg * 6, bodyY + 9], [footX - 3, footY - 6], [footX, footY],
        [footX + 7, footY]], leg < 0 ? '#b76839' : '#de893f', 3);
    }
    const feathers = ['#963f34', '#b95337', '#d37844', '#e7a157', '#b75938'];
    for (let i = 0; i < feathers.length; i++) {
      const rotation = -1.20 + i * 0.26;
      const cy = bodyY - (duck ? 3 : 19) - i * (duck ? 0 : 2);
      const cx = -32 + i * 4;
      this.oval(cx, cy, duck ? 7 : 8, duck ? 19 : 23, feathers[i],
        duck ? rotation - 0.57 : rotation, '#70372f');
      this.oval(cx - 3, cy - 6, 4, 7, '#f3b86d66', rotation);
    }
    this.oval(-3, bodyY, duck ? 27 : 23, duck ? 12 : 18, '#fff0ce', 0, '#804934');
    this.oval(-9, bodyY + (turkey.celebrate ? -9 : 2), 14, 9, '#e4b67c',
      turkey.celebrate ? -0.85 : -0.25, '#a36846');
    if (turkey.celebrate) this.oval(5, bodyY - 18, 9, 18, '#f8d39c', 0.72, '#9c5b40');
    const headY = duck ? -18 : -50;
    this.oval(16, duck ? -14 : -35, 8, duck ? 7 : 13, '#e9bf90', 0.29, '#804934');
    this.oval(21, headY, 10, 9, '#f8d6a0', 0, '#804934');
    this.oval(26, headY + 8, 3.8, 7, '#b83e37', -0.35);
    this.poly([[28, headY - 3], [39, headY + 1], [28, headY + 5]], '#f0a247', '#99512f');
    if (turkey.hidden && this.time % 2.8 > 2.60) {
      this.line([[22, headY - 1], [26, headY - 1]], INK);
    } else {
      this.oval(24, headY - 2, 2.5, 3, INK);
      this.oval(24.8, headY - 3, 0.8, 0.8, '#fff7df');
    }
    c.restore();
  }

  drawFarmer(farmer, x) {
    this.shadow(x, this.ground + 3, 39);
    this.farmerPose(x, this.ground, farmer);
    if (farmer.state === 'search') this.text('?', x, this.ground - 145, 37, GOLD);
  }

  farmerPose(x, y, farmer = {}, scale = 1, holding = false) {
    const c = this.ctx;
    const stride = Math.sin((farmer.runPhase ?? 0) * TAU) * 18;
    c.save();
    c.translate(x, y);
    c.scale(scale * (farmer.facing ?? 1), scale);
    if (farmer.state === 'lunge') c.rotate(0.31);
    for (const side of [-1, 1]) {
      const foot = side * (8 + stride);
      this.line([[side * 7, -46], [foot * 0.75, -24], [foot, -6]], side < 0 ? '#3f5567' : '#52768b', 13);
      this.line([[foot - 3, -5], [foot + 9, -5]], '#332630', 10);
    }
    this.line([[-13, -78], [-21, -60], [-26 - stride / 2, -61]], '#913c35', 12);
    this.round(-21, -94, 42, 57, 11, '#c45341', INK);
    c.save();
    c.beginPath();
    c.roundRect(-20, -93, 40, 54, 10);
    c.clip();
    for (let i = -15; i <= 20; i += 12) this.rect(i, -94, 4, 57, '#822f325d');
    for (let i = -85; i < -38; i += 11) this.rect(-22, i, 44, 4, '#792d386e');
    c.restore();
    this.round(-15, -74, 30, 34, 5, '#4c748a', '#354d60');
    this.line([[-16, -92], [-10, -73]], '#557f97', 5);
    this.line([[15, -92], [10, -73]], '#557f97', 5);
    this.round(-6, -67, 12, 9, 2, '#7094a0');
    this.oval(-10, -72, 2, 2, GOLD);
    this.oval(10, -72, 2, 2, GOLD);
    this.oval(6, -103, 18, 20, '#e2a370', 0, '#6c4439');
    this.oval(23, -101, 6, 5, '#e2a370', 0, '#6c4439');
    this.oval(14, -107, 2.5, 2.5, INK);
    this.line([[13, -94], [21, -95]], '#78433a', 3);
    this.round(-16, -132, 37, 19, 6, '#e3aa54', '#795039');
    this.rect(-15, -119, 35, 4, '#9d6541');
    this.oval(3, -115, 31, 5, '#f2bc66', -0.06, '#795039');
    const handX = holding ? 57 : 24 + stride;
    const handY = holding ? -105 : -60;
    this.line([[13, -82], [23, holding ? -94 : -68], [handX, handY]], '#ba4d3e', 12);
    this.oval(handX, handY, 6, 6, '#e4a671', 0, '#87523d');
    c.restore();
  }

  leaves(particles = []) {
    for (const leaf of particles) {
      this.oval(leaf.x, leaf.y, leaf.size, leaf.size * 0.47,
        LEAF_COLORS[leaf.color], leaf.angle, '#a34d3566');
    }
  }

  drawHUD(state) {
    const { turkey, world, currentStage } = state;
    this.round(22, 17, this.w - 44, 91, 18, '#39272beF', '#a96c4d');
    this.text('SCORE', 48, 40, 15, '#f1bb7d', 'left');
    this.text(String(state.score).padStart(6, '0'), 48, 72, 32, CREAM, 'left');
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

  headIcon(x, y, filled) {
    this.oval(x, y, 9, 10, filled ? CREAM : '#5a4041', 0, '#2b2128');
    this.poly([[x + 6, y - 3], [x + 15, y + 1], [x + 6, y + 4]],
      filled ? GOLD : '#84605b', INK);
    this.oval(x + 3, y - 3, 2, 2, INK);
    if (filled) this.oval(x + 7, y + 6, 2.5, 3.5, '#bc483b');
  }

  drawTitle(state) {
    this.time = state.time;
    this.background('farm', 28);
    this.leaves(state.particles);
    this.farmerPose(1133, this.ground + 6, { facing: -1, runPhase: 0 }, 1.75);
    this.hay(1083, this.ground + 10, 174, 149);
    this.shadow(594, this.ground + 6, 139, 13);
    this.turkeyPose(608, this.ground + 3, { celebrate: true }, 3.5);
    this.text('PARDON!', 640, 201, 139, '#ffa64e');
    this.text('The Great Turkey Escape', 640, 293, 43);
    this.text('The farmer wants dinner. You ARE dinner. RUN!', 640, 345, 23);
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
    this.background('kitchen', 184);
    this.rect(0, 0, this.w, this.h, '#291b2b89');
    this.text('CAUGHT!', 640, 184, 112, '#ff8062');
    this.text('The dinner is back on...', 640, 272, 31);
    this.shadow(623, this.ground + 8, 140, 14);
    this.farmerPose(574, this.ground, { facing: 1 }, 2.28, true);
    this.turkeyPose(706, this.ground - 258, { airborne: true }, 1.94, Math.PI);
    this.endPrompt(state);
  }

  drawEscaped(state) {
    this.time = state.time;
    this.background('farm', 176, true);
    this.text('ESCAPED!', 640, 183, 110, GOLD);
    this.text('One turkey, officially pardoned.', 640, 270, 32);
    this.shadow(465, this.ground + 8, 135, 13);
    this.turkeyPose(470, this.ground + 1, { celebrate: true }, 3.15);
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
    this.endPrompt(state);
  }

  endPrompt(state) {
    this.bottomPrompt(`FINAL SCORE ${String(state.score).padStart(6, '0')}    ·    DIST ${state.distance} m`,
      'Press ENTER to run again');
  }
}
