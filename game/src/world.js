import { CONFIG } from './config.js';
import { mulberry32, pick, randRange } from './random.js';

const SIZES = {
  fence: { w: 58, h: 72 },
  crate: { w: 96, h: 68 },
  haybale: { w: 104, h: 81 },
  pitchfork: { w: 40, h: 103 },
  oven: { w: 132, h: 128 },
  knife: { w: 156, h: 88 },
  corn: { w: 22, h: 22 },
  arch: { w: 180, h: 214 },
};

const OBSTACLES = {
  farm: ['fence', 'crate', 'haybale'],
  barn: ['crate', 'haybale', 'pitchfork'],
  kitchen: ['crate', 'oven', 'knife'],
};

const KNIFE_PARTS = [
  { xOffset: 0, w: 110, bottom: 42, h: 22 },
  { xOffset: 110, w: 46, bottom: 0, h: 88 },
];

export function isHidingProp(item) {
  return item.kind === 'crate' || item.kind === 'haybale';
}

export function makeItem(kind, x, stageIndex) {
  const item = { kind, x, ...SIZES[kind], stageIndex };
  if (kind === 'knife') item.parts = KNIFE_PARTS;
  if (kind === 'arch') item.label = 'PARDON';
  return item;
}

export function buildWorld(seed = CONFIG.world.SEED) {
  const rng = mulberry32(seed);
  const settings = CONFIG.spawning;
  const items = [];
  let totalLength = 0;

  const stages = CONFIG.stages.map((stage, stageIndex) => {
    const startX = totalLength;
    totalLength += stage.length;
    const obstacleKinds = OBSTACLES[stage.id];
    const hidingKinds = obstacleKinds.filter((kind) => isHidingProp({ kind }));
    const spacing = Math.max(
      settings.MIN_OBSTACLE_SPACING,
      1000 / settings.OBSTACLES_PER_1000PX[stageIndex],
    );
    const jitter = Math.min(settings.OBSTACLE_JITTER, (spacing - settings.MIN_OBSTACLE_SPACING) / 2);
    const hideEvery = Math.max(1, Math.floor(settings.HIDE_SPACING / spacing));
    const firstSlot = startX + settings.START_MARGIN + jitter;
    let previous;

    for (let slot = 0; ; slot++) {
      const center = firstSlot + slot * spacing;
      if (center + jitter >= totalLength - settings.END_MARGIN) break;

      const x = Math.round(center + randRange(rng, -jitter, jitter));
      const kind = pick(rng, slot % hideEvery === 0 ? hidingKinds : obstacleKinds);
      const obstacle = makeItem(kind, x, stageIndex);
      items.push(obstacle);

      if (previous && rng() < settings.CORN_CLUSTER_CHANCE) {
        const gapStart = previous.x + previous.w;
        const gap = x - gapStart;
        for (let i = 1; i <= settings.CORN_CLUSTER_SIZE; i++) {
          const t = i / (settings.CORN_CLUSTER_SIZE + 1);
          items.push({
            ...makeItem('corn', Math.round(gapStart + gap * t - SIZES.corn.w / 2), stageIndex),
            // Pickup center height above ground.
            y: Math.round(settings.CORN_BASE_HEIGHT + Math.sin(Math.PI * t) * settings.CORN_ARC_HEIGHT),
          });
        }
      }
      previous = obstacle;
    }

    if (stage.id === 'kitchen') {
      items.push(makeItem('arch', totalLength - SIZES.arch.w, stageIndex));
    }

    return { ...stage, startX, stageIndex };
  });

  items.sort((a, b) => a.x - b.x);
  return { stages, items, totalLength };
}

export function stageAtX(world, x) {
  return world.stages.findLast((stage) => x >= stage.startX) ?? world.stages[0];
}

export function itemsInRange(world, x0, x1) {
  return world.items.filter((item) => item.x <= x1 && item.x + item.w >= x0);
}
