export const CONFIG = {
  // Canvas dimensions and ground level, in design pixels.
  view: { W: 1280, H: 720, GROUND_Y: 600 },

  // Vertical acceleration and initial jump speed, in pixels and seconds.
  physics: { GRAVITY: 2600, JUMP_VELOCITY: 980 },

  // Turkey movement speeds and damage recovery.
  turkey: {
    CRUISE_SPEED: 330,
    SLOW_SPEED: 240,
    DASH_SPEED: 430,
    DUCK_SPEED: 300,
    LIVES: 3,
    INVINCIBLE_SECONDS: 1.5,
    STANDING_HEIGHT: 58,
    DUCK_HEIGHT: 25,
    HALF_WIDTH: 19,
    STRIDE_LENGTH: 88,
  },

  // Stage progression and lengths, in pixels.
  stages: [
    { id: 'farm', name: 'Sunny Acres Farm', length: 9000 },
    { id: 'barn', name: 'The Old Barn', length: 8000 },
    { id: 'kitchen', name: 'The Kitchen', length: 8000 },
  ],

  // Farmer movement, pursuit timing, and distance thresholds.
  farmer: {
    CHASE_SPEED: [330, 352, 379.5],
    BURST_SPEED: 470,
    BURST_SECONDS: 1.2,
    BURST_EVERY_SECONDS: 6,
    SEARCH_SPEED: 140,
    SEARCH_SECONDS: 2.4,
    CATCH_DISTANCE: 36,
    RUBBER_BAND_GAP: 700,
    RUBBER_BAND_RELEASE_GAP: 500,
    RUBBER_BAND_SPEED_BONUS: 70,
    MAX_LEAD: 5,
    SIGHT_LOSS_SECONDS: 0.4,
    SEARCH_LOOK_INTERVAL: 0.4,
    RETREAT_GAP: 620,
    BURST_FIRST_STAGE_INDEX: 1,
    LUNGE_STAGE_INDEX: 2,
    LUNGE_DISTANCE: 280,
    LUNGE_COOLDOWN: 5,
    LUNGE_SECONDS: 0.45,
    LUNGE_SPEED: 560,
    CATCH_HEIGHT: 85,
    STRIDE_LENGTH: 105,
  },

  // Obstacle densities follow the stage order. Corn value is in points.
  spawning: {
    OBSTACLES_PER_1000PX: [2.31, 2.73, 3.15],
    CORN_VALUE: 25,
    START_MARGIN: 500,
    END_MARGIN: 460,
    MIN_OBSTACLE_SPACING: 260,
    OBSTACLE_JITTER: 32,
    HIDE_SPACING: 1400,
    CORN_CLUSTER_SIZE: 3,
    CORN_BASE_HEIGHT: 34,
    CORN_ARC_HEIGHT: 44,
    CORN_CLUSTER_CHANCE: 0.75,
  },

  // Seed for repeatable world generation.
  world: { SEED: 20261127 },

  // Run timing, camera framing, and score conversion.
  game: {
    MAX_FRAME_SECONDS: 1 / 30,
    CAMERA_LEAD: 380,
    FARMER_START_GAP: 445,
    PIXELS_PER_METRE: 25,
    METRES_PER_POINT: 2,
  },

  // HUD timing and ambient autumn leaves.
  presentation: {
    STAGE_BANNER_SECONDS: 2,
    SPOTTED_FLASH_SECONDS: 0.85,
    LEAF_COUNT: 32,
    LEAF_MIN_SIZE: 3,
    LEAF_MAX_SIZE: 8,
    LEAF_MIN_FALL_SPEED: 29,
    LEAF_MAX_FALL_SPEED: 81,
    LEAF_MIN_DRIFT: 34,
    LEAF_MAX_DRIFT: 98,
  },

  // Autumn colors indexed by stage ID.
  palette: {
    farm: { sky: '#f8d593', ground: '#795133', accent: '#e98b32' },
    barn: { sky: '#ad6244', ground: '#51342b', accent: '#efad52' },
    kitchen: { sky: '#f4c9a4', ground: '#714840', accent: '#c24c38' },
  },

  // Touch thresholds are fractions of the input surface dimensions.
  input: {
    SWIPE_DOWN_FRACTION: 0.06,
    DUCK_LEFT_FRACTION: 0.82,
    DUCK_TOP_FRACTION: 0.82,
  },

  // Sound envelopes and note sequences, in seconds and hertz.
  audio: {
    MASTER_GAIN: 0.32,
    ENVELOPE_FLOOR: 0.001,
    ATTACK_SECONDS: 0.006,
    // Each note is [waveform, start Hz, end Hz, offset, duration, peak gain].
    jump: [['square', 300, 640, 0, 0.09, 0.18]],
    corn: [['sine', 1200, 1500, 0, 0.15, 0.30]],
    hit: [['triangle', 135, 45, 0, 0.15, 0.40]],
    spotted: [
      ['square', 710, 710, 0, 0.08, 0.18],
      ['square', 860, 860, 0.13, 0.08, 0.18],
    ],
    caught: [
      ['triangle', 392, 392, 0, 0.16, 0.26],
      ['triangle', 311.13, 311.13, 0.14, 0.17, 0.26],
      ['triangle', 261.63, 261.63, 0.29, 0.28, 0.28],
    ],
    escaped: [
      ['sine', 523.25, 523.25, 0, 0.15, 0.28],
      ['sine', 659.25, 659.25, 0.10, 0.15, 0.28],
      ['sine', 783.99, 783.99, 0.20, 0.15, 0.28],
      ['sine', 1046.50, 1046.50, 0.30, 0.30, 0.32],
    ],
    click: [['square', 760, 460, 0, 0.035, 0.12]],
  },
};
