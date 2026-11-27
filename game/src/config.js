// Coral Isles Sky Courier — tuning numbers and colours in one place.
// Playfield is a fixed 1280x720 logical area; the renderer scales it to the window.
export const FIELD = { width: 1280, height: 720, seaY: 560 };

/** Fixed simulation step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  x: 340,
  width: 96,
  height: 44,
  minY: 110,
  maxY: 520,
  climbSpeed: 260,
  lateralSpeed: 300,
  minLateral: 180,
  maxLateral: 560,
  invulnerable: 1.5,
};

export const LIVES = 3;

/** Course: 8 golden rings, then the home runway at 2400 m. */
export const COURSE = {
  length: 2400,
  pxPerMetre: 0.9,
  ringDistances: [250, 500, 800, 1100, 1400, 1700, 2000, 2300],
  ringRadius: 62,
  ringPoints: 50,
  baseSpeed: 38, // metres per second at cruise throttle
  speedPerLevel: 3,
};

/** Storm clouds and gull flocks: spawned ahead, drift left as distance grows. */
export const HAZARD = {
  interval: 4.0,
  intervalScale: 0.92,
  minInterval: 1.8,
  cloudW: 100,
  cloudH: 64,
  birdW: 54,
  birdH: 26,
};

export const LEVEL = { seconds: 15, max: 8 };
export const POOL_SIZE = 48;

export const PALETTE = {
  backdrop: '#0b1526',
  skyTop: '#7ec8f2',
  skyMid: '#bfe6f7',
  skyLow: '#ffe9b8',
  sea: '#1d7fb8',
  seaDeep: '#14608f',
  sand: '#f2d8a0',
  palm: '#2e8b57',
  volcano: '#5b4a68',
  runway: '#3a3f4a',
  runwayLine: '#f5f5f5',
  plane: '#e8452c',
  planeWing: '#f2f2f2',
  canopy: '#ffe27a',
  ring: '#f2c94c',
  ringGlow: '#fff3b0',
  cloud: '#ffffff',
  storm: '#4a5568',
  stormDark: '#2d3748',
  bird: '#2d3748',
  panel: '#101c30',
  panelEdge: '#2c4a6e',
  text: '#eef4fa',
  muted: '#a8c0d4',
  good: '#7ee787',
  bad: '#ff7b72',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'coral-isles-sky-courier.best';
