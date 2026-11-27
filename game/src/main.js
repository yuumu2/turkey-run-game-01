import { CONFIG } from './config.js';
import { mulberry32, randRange } from './random.js';
import { Input } from './input.js';
import * as audio from './audio.js';
import { buildWorld, isHidingProp, itemsInRange, stageAtX } from './world.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { Renderer } from './render.js';

const params = new URLSearchParams(window.location.search);
const requestedSeed = params.get('seed');
const parsedSeed = requestedSeed?.trim() ? Number(requestedSeed) : NaN;
const seed = Number.isSafeInteger(parsedSeed) ? parsedSeed : CONFIG.world.SEED;
const canvas = document.getElementById('game');
const renderer = new Renderer(canvas.getContext('2d'), CONFIG);
const input = new Input(canvas);
const tuning = CONFIG.game;
const presentation = CONFIG.presentation;
const { GROUND_Y, W, H } = CONFIG.view;
const CLOSE_CALL_DISTANCE = 90;
const CLOSE_CALL_POINTS = 25;
const CLOSE_CALL_SECONDS = 0.9;
const game = {
  state: 'title',
  frozen: false,
  seed,
  turkey: new Turkey(),
  farmer: new Farmer(),
};

function seedLeaves() {
  const rng = mulberry32(seed);
  return Array.from({ length: presentation.LEAF_COUNT }, () => ({
    x: randRange(rng, 0, W),
    y: randRange(rng, 0, H),
    size: randRange(rng, presentation.LEAF_MIN_SIZE, presentation.LEAF_MAX_SIZE),
    fall: randRange(rng, presentation.LEAF_MIN_FALL_SPEED, presentation.LEAF_MAX_FALL_SPEED),
    drift: randRange(rng, presentation.LEAF_MIN_DRIFT, presentation.LEAF_MAX_DRIFT),
    angle: randRange(rng, 0, Math.PI * 2),
    color: Math.floor(rng() * 3),
  }));
}

function resetRun() {
  game.world = buildWorld(seed);
  game.currentStage = game.world.stages[0];
  game.turkey.reset(0);
  game.farmer.reset(-tuning.FARMER_START_GAP);
  game.cameraX = 0;
  game.time = 0;
  game.distance = 0;
  game.score = 0;
  game.cornPoints = 0;
  game.closeCallPoints = 0;
  game.closeCallUntil = 0;
  game.lungeWasClose = false;
  game.stageBanner = presentation.STAGE_BANNER_SECONDS;
  game.flashSpotted = 0;
  game.particles = seedLeaves();
}

function updateLeaves(dt) {
  for (const leaf of game.particles) {
    leaf.x += (leaf.drift + Math.sin(game.time * 2 + leaf.angle) * 14) * dt;
    leaf.y += leaf.fall * dt;
    leaf.angle += dt * 1.35;
    if (leaf.x > W + leaf.size) leaf.x = -leaf.size;
    if (leaf.y > H + leaf.size) leaf.y = -leaf.size;
  }
}

function overlaps(box, left, width, top, bottom) {
  return box.x1 > left && box.x0 < left + width && box.feetY > top && box.headY < bottom;
}

function hitsObstacle(item, box) {
  if (item.kind === 'knife') {
    if (box.ducking) return false;
    return item.parts.some(({ xOffset, w, bottom, h }) =>
      overlaps(box, item.x + xOffset, w, GROUND_Y - bottom - h, GROUND_Y - bottom));
  }
  if (box.ducking && isHidingProp(item)) return false;
  const height = item.kind === 'oven' ? CONFIG.spawning.OVEN_COLLISION_HEIGHT : item.h;
  return overlaps(box, item.x, item.w, GROUND_Y - height, GROUND_Y);
}

function resolveItems() {
  const box = game.turkey.hitbox();
  let reachedArch = false;
  for (const item of itemsInRange(game.world, box.x0, box.x1)) {
    if (item.kind === 'corn') {
      const top = GROUND_Y - item.y - item.h / 2;
      if (!item.collected && overlaps(box, item.x, item.w, top, top + item.h)) {
        item.collected = true;
        game.cornPoints += CONFIG.spawning.CORN_VALUE;
        audio.corn();
        renderer.spawnCornSparkles(item, game.time);
      }
    } else if (item.kind === 'arch') {
      reachedArch = game.turkey.x >= item.x + item.w / 2;
    } else if (hitsObstacle(item, box) && game.turkey.hurt().hit) {
      audio.hit();
    }
  }
  return reachedArch;
}

function switchStage(stage) {
  game.currentStage = stage;
  game.stageBanner = presentation.STAGE_BANNER_SECONDS;
  if (stage.id !== 'farm') game.particles = [];
}

function updatePlaying(dt) {
  const { turkey, farmer, world } = game;
  const previousLift = turkey.y;
  const wasLunging = farmer.state === 'lunge';
  turkey.update(dt, input, world);
  if (previousLift === 0 && turkey.y > 0) audio.jump();
  farmer.update(dt, turkey, world);
  const reachedArch = resolveItems();
  const caught = !turkey.alive || farmer.caught(turkey);
  const lunging = farmer.state === 'lunge';
  if (!wasLunging) game.lungeWasClose = false;
  if ((wasLunging || lunging) && Math.abs(turkey.x - farmer.x) <= CLOSE_CALL_DISTANCE) {
    game.lungeWasClose = true;
  }
  if (wasLunging && !lunging && game.lungeWasClose && !caught) {
    game.closeCallPoints += CLOSE_CALL_POINTS;
    game.closeCallUntil = game.time + CLOSE_CALL_SECONDS;
  }

  game.distance = Math.floor(turkey.x / tuning.PIXELS_PER_METRE);
  game.score = game.cornPoints + game.closeCallPoints + Math.floor(game.distance / tuning.METRES_PER_POINT);
  game.cameraX = Math.max(0, Math.min(turkey.x - tuning.CAMERA_LEAD, world.totalLength - W));

  game.stageBanner = Math.max(0, game.stageBanner - dt);
  game.flashSpotted = Math.max(0, game.flashSpotted - dt);
  const stage = stageAtX(world, turkey.x);
  if (stage !== game.currentStage) switchStage(stage);
  if (farmer.justSpotted) {
    game.flashSpotted = presentation.SPOTTED_FLASH_SECONDS;
    audio.spotted();
  }

  if (caught) {
    turkey.alive = false;
    game.state = 'caught';
    audio.caught();
  } else if (reachedArch) {
    game.state = 'escaped';
    audio.escaped();
  }
}

function render() {
  switch (game.state) {
    case 'title':
      renderer.drawTitle(game);
      break;
    case 'playing':
      renderer.drawScene(game);
      renderer.drawHUD(game);
      break;
    case 'caught':
      renderer.drawCaught(game);
      break;
    case 'escaped':
      renderer.drawEscaped(game);
      break;
  }
}

let previousTime;
function frame(timestamp) {
  const dt = Math.min((timestamp - (previousTime ?? timestamp)) / 1000, tuning.MAX_FRAME_SECONDS);
  previousTime = timestamp;

  if (!game.frozen) {
    if (game.state !== 'playing' && input.wasPressed('start')) {
      resetRun();
      game.state = 'playing';
      audio.click();
    } else {
      game.time += dt;
      if (game.state === 'playing') updatePlaying(dt);
      if (game.state === 'title' || game.state === 'playing') updateLeaves(dt);
    }
  }

  render();
  input.endFrame();
  requestAnimationFrame(frame);
}

resetRun();
if (params.has('shot')) {
  const { stageShot } = await import('./shots.js');
  stageShot(params.get('shot'), game);
}
window.__turkeyGame = game;
requestAnimationFrame(frame);
