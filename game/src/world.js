// Coral Isles Sky Courier — rules and state, no drawing and no browser in it.
// The plane flies a 2400 m course over the Coral Isles: climb/descend and bank left/right,
// fly through 8 golden rings, dodge storm clouds and gull flocks, land the course.
// step() advances one fixed step and returns what happened as bit flags.
import { COURSE, FIELD, HAZARD, LEVEL, LIVES, PLAYER, POOL_SIZE } from './config.js';

export const KIND_RING = 0;
export const KIND_STORM = 1;
export const KIND_BIRD = 2;

export const EVENT_HIT = 1;
export const EVENT_RING = 2;
export const EVENT_OVER = 4;
export const EVENT_WIN = 8;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = {
    x: PLAYER.x, y: 320, width: PLAYER.width, height: PLAYER.height,
    invulnerable: 0, bank: 0, prop: 0,
  };
  // Hazards are pooled once; rings are a fixed course list (not pooled).
  const items = [];
  for (let i = 0; i < POOL_SIZE; i += 1) {
    items.push({ active: false, kind: KIND_STORM, dist: 0, y: 0, width: 0, height: 0, bob: 0 });
  }
  const rings = COURSE.ringDistances.map((dist, i) => ({
    dist, y: 180 + ((i * 97) % 300), taken: false, missed: false,
  }));
  // Seeded decorative islands and clouds, scrolling with distance.
  const islands = [];
  for (let i = 0; i < 14; i += 1) {
    islands.push({
      dist: 120 + i * 190 + random() * 90,
      w: 150 + random() * 180,
      kind: i % 4 === 3 ? 'volcano' : 'palm',
    });
  }
  const clouds = [];
  for (let i = 0; i < 18; i += 1) {
    clouds.push({ dist: random() * COURSE.length, y: 60 + random() * 260, scale: 0.6 + random() * 0.9 });
  }
  const state = {
    player, items, rings, islands, clouds,
    score: 0, lives: LIVES, level: 1, elapsed: 0,
    distance: 0, speed: COURSE.baseSpeed, altitude: 0, heading: 90,
    ringsTaken: 0, hazardTimer: 1.2, won: false, over: false,
  };

  function reset() {
    player.x = PLAYER.x;
    player.y = 320;
    player.invulnerable = 0;
    player.bank = 0;
    for (const item of items) item.active = false;
    for (const ring of rings) { ring.taken = false; ring.missed = false; }
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.elapsed = 0;
    state.distance = 0;
    state.speed = COURSE.baseSpeed;
    state.altitude = 0;
    state.heading = 90;
    state.ringsTaken = 0;
    state.hazardTimer = 1.2;
    state.won = false;
    state.over = false;
  }

  function freeItem() {
    for (let i = 0; i < items.length; i += 1) if (!items[i].active) return items[i];
    return null;
  }

  function spawnHazard() {
    const item = freeItem();
    if (item === null) return;
    const storm = random() < 0.55;
    item.active = true;
    item.kind = storm ? KIND_STORM : KIND_BIRD;
    item.dist = state.distance + 1150 + random() * 250;
    item.y = 140 + random() * 360;
    item.width = storm ? HAZARD.cloudW : HAZARD.birdW;
    item.height = storm ? HAZARD.cloudH : HAZARD.birdH;
    item.bob = random() * Math.PI * 2;
  }

  /** Screen x of something at course distance `dist` (plane sits at PLAYER.x). */
  function screenX(dist) {
    return PLAYER.x + (dist - state.distance) * COURSE.pxPerMetre;
  }

  /**
   * One fixed step. `control` is { x: -1..1 (bank left/right), y: -1..1 (climb/descend) }.
   * With `harmless` set (title backdrop) the plane flies but nothing hits and nothing scores.
   */
  function step(dt, control, harmless) {
    let events = 0;
    if (state.won || state.over) return events;
    state.elapsed += dt;
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.elapsed / LEVEL.seconds));
    const cruise = COURSE.baseSpeed + COURSE.speedPerLevel * (state.level - 1);
    // Right = faster, left = slower; speed eases toward the target.
    const targetSpeed = cruise * (1 + 0.35 * (control ? control.x : 0));
    state.speed += (targetSpeed - state.speed) * Math.min(1, dt * 2);
    state.distance += state.speed * dt;
    state.score = state.ringsTaken * COURSE.ringPoints + Math.floor(state.distance / 10);

    player.bank += (((control ? control.x : 0) * 0.5) - player.bank) * Math.min(1, dt * 6);
    player.x = Math.min(PLAYER.maxLateral, Math.max(PLAYER.minLateral, player.x + (control ? control.x : 0) * PLAYER.lateralSpeed * dt * 0.4));
    player.y = Math.min(PLAYER.maxY, Math.max(PLAYER.minY, player.y - (control ? control.y : 0) * PLAYER.climbSpeed * dt));
    player.prop += dt * 28;
    // Altitude in feet: sea level at y=560, ~4 ft per pixel above it.
    state.altitude = Math.max(0, Math.round((FIELD.seaY - player.y) * 4));
    state.heading = Math.round(90 + player.bank * 28);
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);

    // Rings: passed when their distance falls behind the plane.
    for (const ring of rings) {
      if (ring.taken || ring.missed) continue;
      if (ring.dist <= state.distance) {
        const dy = (player.y + player.height / 2) - ring.y;
        const dx = player.x + player.width / 2 - screenX(ring.dist);
        if (Math.abs(dy) < COURSE.ringRadius && Math.abs(dx) < COURSE.ringRadius + 40) {
          ring.taken = true;
          state.ringsTaken += 1;
          state.score = state.ringsTaken * COURSE.ringPoints + Math.floor(state.distance / 10);
          if (!harmless) events |= EVENT_RING;
        } else {
          ring.missed = true;
        }
      }
    }

    state.hazardTimer -= dt;
    if (state.hazardTimer <= 0) {
      spawnHazard();
      state.hazardTimer += Math.max(HAZARD.minInterval, HAZARD.interval * HAZARD.intervalScale ** (state.level - 1));
    }

    const playerBox = { x: player.x, y: player.y, width: player.width, height: player.height };
    for (const item of items) {
      if (!item.active) continue;
      const x = screenX(item.dist);
      if (x < -200) { item.active = false; continue; }
      if (harmless) continue;
      const box = { x: x - item.width / 2, y: item.y + Math.sin(state.elapsed * 2 + item.bob) * 8, width: item.width, height: item.height };
      if (player.invulnerable === 0 && overlaps(playerBox, box)) {
        item.active = false;
        state.lives -= 1;
        player.invulnerable = PLAYER.invulnerable;
        events |= EVENT_HIT;
        if (state.lives === 0) {
          state.over = true;
          events |= EVENT_OVER;
          break;
        }
      }
    }

    if (state.distance >= COURSE.length && !state.over) {
      state.won = true;
      events |= EVENT_WIN;
    }
    return events;
  }

  reset();
  return { state, reset, step, screenX };
}
