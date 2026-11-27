// Screenshot scenes behind ?shot=start|play|end. Each plays the real rules forward
// from a fresh world for a fixed number of steps, steered by a simple autopilot:
// aim for the next ring's altitude, dodge hazards ahead, keep a steady speed.
// The same seed always gives the same frame.
import { COURSE, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;
const HORIZON_PLAY = 0.7;
const HORIZON_END = 0.25;
const SAMPLE = 1 / 30;

/** Next ring not yet taken or missed, or null. */
function nextRing(state) {
  for (const ring of state.rings) if (!ring.taken && !ring.missed) return ring;
  return null;
}

/** Would steering (dx, dy) hit a hazard within `horizon` seconds? */
function dangerAhead(state, screenX, dx, dy, horizon) {
  const p = state.player;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const px = p.x + dx * 120 * t;
    const py = p.y - dy * 260 * t;
    for (const item of state.items) {
      if (!item.active) continue;
      const ix = screenX(item.dist) - item.width / 2;
      const iy = item.y;
      if (ix < px + p.width && ix + item.width > px && iy < py + p.height && iy + item.height > py) return true;
    }
  }
  return false;
}

function autopilot(state, screenX, horizon) {
  const p = state.player;
  const ring = nextRing(state);
  let dy = 0;
  if (ring) {
    const centre = p.y + p.height / 2;
    dy = ring.y > centre + 14 ? -1 : ring.y < centre - 14 ? 1 : 0;
  }
  // Try the ring-aiming move; if it is dangerous, try level, then the opposite.
  const tries = [{ x: 0, y: dy }, { x: 0, y: 0 }, { x: 0, y: -dy }, { x: -1, y: 0 }, { x: 1, y: 0 }];
  for (const c of tries) if (!dangerAhead(state, screenX, c.x, c.y, horizon)) return c;
  return { x: 0, y: 0 };
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { x: 0, y: 0 }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : HORIZON_PLAY;
  let done = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    done = world.step(STEP, autopilot(world.state, world.screenX, horizon), false);
    if (done & (EVENT_OVER | EVENT_WIN)) break;
  }
  if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score };
  const over = world.state.lives === 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
