import { CONFIG } from './config.js';
import { makeItem } from './world.js';

const SHOT_FARMER_GAP = 205;
const SHOT_CAMERA_ANCHOR = 440;

export function stageShot(name, game) {
  game.frozen = true;
  game.time = 0.72;
  delete game.shotDustX;

  switch (name) {
    case 'farm':
      stageRun(game, 0, 4350, 612, [
        ['corn', 148, 44], ['corn', 180, 66], ['corn', 213, 44],
        ['fence', 300], ['haybale', 560],
      ]);
      break;
    case 'barn':
      stageRun(game, 1, 3600, 1152, [
        ['crate', -340], ['haybale', -20], ['pitchfork', 300],
      ]);
      game.turkey.y = 70;
      game.turkey.vy = 180;
      game.shotDustX = game.turkey.x - 85;
      break;
    case 'kitchen':
      stageRun(game, 2, 3570, 1961, [
        ['oven', 330], ['knife', 640],
      ]);
      break;
    case 'caught':
      Object.assign(game, { state: 'caught', score: 1733, distance: 817 });
      break;
    case 'escaped':
      Object.assign(game, {
        state: 'escaped',
        score: 2375,
        distance: Math.floor(game.world.totalLength / CONFIG.game.PIXELS_PER_METRE),
      });
      break;
    default:
      game.state = 'title';
  }
}

function stageRun(game, stageIndex, offset, score, props) {
  const stage = game.world.stages[stageIndex];
  const x = stage.startX + offset;
  game.turkey.reset(x);
  game.turkey.runPhase = 0.21;
  game.farmer.reset(x - SHOT_FARMER_GAP);
  game.farmer.runPhase = 0.76;
  game.cameraX = x - SHOT_CAMERA_ANCHOR;

  // Replace foreground clutter only in this frozen shot.
  const viewEnd = game.cameraX + CONFIG.view.W;
  const items = game.world.items.filter((item) => item.x + item.w < game.cameraX || item.x > viewEnd);
  for (const [kind, dx, y] of props) {
    const item = { ...makeItem(kind, x + dx, stageIndex), staged: true };
    if (y !== undefined) item.y = y;
    items.push(item);
  }
  game.world.items = items.sort((a, b) => a.x - b.x);
  Object.assign(game, {
    state: 'playing',
    currentStage: stage,
    stageBanner: 0,
    score,
    distance: Math.floor(x / CONFIG.game.PIXELS_PER_METRE),
  });
  if (stage.id !== 'farm') game.particles = [];
}
