// Drawing only: the world's state and the current screen in, pixels out.
// 1280x720 playfield scaled to fit the window, centred, margin filled with backdrop.
// Chase view over the Coral Isles: sea and islands scroll below, the courier plane
// stays in frame, rings and storm clouds ahead, altitude/speed/heading on the HUD.
import { COURSE, FIELD, FONT, LIVES, PALETTE, PLAYER } from './config.js';
import { KIND_BIRD, KIND_RING, KIND_STORM } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 640, top: 150, line: 34, bottom: 70 };
const LIFE_SIZE = 20;
const LIFE_GAP = 8;

function cachedLabel(prefix) {
  let value = '';
  let text = '';
  return function label(next) {
    if (next !== value) { value = next; text = prefix + next; }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('SCORE ');
  const ringsLabel = cachedLabel('RINGS ');
  const altLabel = cachedLabel('ALT ');
  const spdLabel = cachedLabel('SPD ');
  const hdgLabel = cachedLabel('HDG ');
  const distLabel = cachedLabel('DIST ');
  const finalLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  // Pre-rendered sky + sea gradient (static background, painted once per frame).
  const sky = document.createElement('canvas');
  sky.width = FIELD.width; sky.height = FIELD.height;
  {
    const c = sky.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, FIELD.seaY);
    g.addColorStop(0, PALETTE.skyTop); g.addColorStop(0.55, PALETTE.skyMid); g.addColorStop(1, PALETTE.skyLow);
    c.fillStyle = g; c.fillRect(0, 0, FIELD.width, FIELD.seaY);
    const sea = c.createLinearGradient(0, FIELD.seaY, 0, FIELD.height);
    sea.addColorStop(0, PALETTE.sea); sea.addColorStop(1, PALETTE.seaDeep);
    c.fillStyle = sea; c.fillRect(0, FIELD.seaY, FIELD.width, FIELD.height - FIELD.seaY);
    // Sun.
    c.fillStyle = '#fff7d6';
    c.beginPath(); c.arc(1120, 110, 44, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,247,214,0.35)';
    c.beginPath(); c.arc(1120, 110, 66, 0, Math.PI * 2); c.fill();
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width; canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawIslands(state, screenX) {
    for (const island of state.islands) {
      const x = screenX(island.dist);
      if (x < -260 || x > FIELD.width + 260) continue;
      const y = FIELD.seaY + 30;
      // Sand ellipse, green top.
      context.fillStyle = PALETTE.sand;
      context.beginPath(); context.ellipse(x, y + 18, island.w / 2, 26, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = PALETTE.palm;
      context.beginPath(); context.ellipse(x, y + 8, island.w / 2.4, 20, 0, 0, Math.PI * 2); context.fill();
      if (island.kind === 'volcano') {
        context.fillStyle = PALETTE.volcano;
        context.beginPath();
        context.moveTo(x - 46, y + 8); context.lineTo(x, y - 52); context.lineTo(x + 46, y + 8);
        context.closePath(); context.fill();
        context.fillStyle = '#ff9d5c';
        context.beginPath(); context.moveTo(x - 10, y - 34); context.lineTo(x, y - 52); context.lineTo(x + 10, y - 34); context.closePath(); context.fill();
      } else {
        // Palm tree.
        context.strokeStyle = '#7a4a26'; context.lineWidth = 5;
        context.beginPath(); context.moveTo(x, y + 6); context.lineTo(x + 6, y - 34); context.stroke();
        context.fillStyle = PALETTE.palm;
        for (let i = 0; i < 4; i += 1) {
          const a = -Math.PI / 2 + (i - 1.5) * 0.55;
          context.beginPath();
          context.ellipse(x + 6 + Math.cos(a) * 20, y - 34 + Math.sin(a) * 12, 22, 7, a, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    // Runway island ahead at the start (dist 300) and home runway at the course end.
    for (const dist of [300, COURSE.length]) {
      const x = screenX(dist);
      if (x < -300 || x > FIELD.width + 300) continue;
      const y = FIELD.seaY + 26;
      context.fillStyle = PALETTE.sand;
      context.beginPath(); context.ellipse(x, y + 16, 190, 26, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = PALETTE.runway;
      context.fillRect(x - 150, y - 2, 300, 22);
      context.fillStyle = PALETTE.runwayLine;
      for (let i = 0; i < 6; i += 1) context.fillRect(x - 130 + i * 48, y + 7, 24, 4);
      text('RWY 09', x, y - 14, 20, PALETTE.text, 'center');
    }
  }

  function drawPlane(player) {
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    context.save();
    context.translate(cx, cy);
    context.rotate(player.bank * 0.35);
    // Propeller disc (spinning).
    context.fillStyle = 'rgba(60,60,70,0.35)';
    context.beginPath(); context.ellipse(52, 0, 6, 26 + Math.sin(player.prop) * 4, 0, 0, Math.PI * 2); context.fill();
    // Wings.
    context.fillStyle = PALETTE.planeWing;
    context.fillRect(-58, -6, 116, 12);
    // Fuselage.
    context.fillStyle = PALETTE.plane;
    context.beginPath(); context.ellipse(0, 0, 52, 15, 0, 0, Math.PI * 2); context.fill();
    // Tail.
    context.fillStyle = PALETTE.plane;
    context.beginPath(); context.moveTo(-46, -4); context.lineTo(-62, -20); context.lineTo(-52, 0); context.closePath(); context.fill();
    // Cockpit canopy, lit.
    context.fillStyle = PALETTE.canopy;
    context.beginPath(); context.ellipse(14, -8, 16, 9, 0, 0, Math.PI * 2); context.fill();
    // Navigation lights.
    context.fillStyle = '#ff5252'; context.fillRect(-60, -3, 5, 5);
    context.fillStyle = '#69f0ae'; context.fillRect(55, -3, 5, 5);
    context.restore();
  }

  function drawField(state, screenX) {
    context.drawImage(sky, 0, 0);
    // Decorative clouds (parallax: they sit at their course distance).
    for (const cloud of state.clouds) {
      const x = screenX(cloud.dist);
      if (x < -160 || x > FIELD.width + 160) continue;
      context.fillStyle = 'rgba(255,255,255,0.9)';
      context.beginPath();
      context.arc(x, cloud.y, 26 * cloud.scale, 0, Math.PI * 2);
      context.arc(x + 26 * cloud.scale, cloud.y + 6, 20 * cloud.scale, 0, Math.PI * 2);
      context.arc(x - 26 * cloud.scale, cloud.y + 8, 18 * cloud.scale, 0, Math.PI * 2);
      context.fill();
    }
    drawIslands(state, screenX);
    // Rings ahead.
    for (const ring of state.rings) {
      const x = screenX(ring.dist);
      if (x < -120 || x > FIELD.width + 120) continue;
      if (ring.taken) continue;
      context.strokeStyle = ring.missed ? 'rgba(242,201,76,0.35)' : PALETTE.ring;
      context.lineWidth = 10;
      context.beginPath(); context.arc(x, ring.y, COURSE.ringRadius, 0, Math.PI * 2); context.stroke();
      context.strokeStyle = PALETTE.ringGlow; context.lineWidth = 3;
      context.beginPath(); context.arc(x, ring.y, COURSE.ringRadius, 0, Math.PI * 2); context.stroke();
      if (!ring.missed) text('RING', x, ring.y - COURSE.ringRadius - 12, 18, PALETTE.ring, 'center');
    }
    // Hazards.
    for (const item of state.items) {
      if (!item.active) continue;
      const x = screenX(item.dist) - item.width / 2;
      const y = item.y + Math.sin(state.elapsed * 2 + item.bob) * 8;
      if (item.kind === KIND_STORM) {
        context.fillStyle = PALETTE.stormDark;
        context.beginPath();
        context.arc(x + 30, y + 20, 34, 0, Math.PI * 2);
        context.arc(x + 60, y + 8, 40, 0, Math.PI * 2);
        context.arc(x + 92, y + 22, 32, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffd54f';
        context.beginPath();
        context.moveTo(x + 58, y + 44); context.lineTo(x + 46, y + 72); context.lineTo(x + 58, y + 72);
        context.lineTo(x + 50, y + 96); context.lineTo(x + 70, y + 62); context.lineTo(x + 58, y + 62);
        context.closePath(); context.fill();
      } else if (item.kind === KIND_BIRD) {
        context.strokeStyle = PALETTE.bird; context.lineWidth = 4; context.lineCap = 'round';
        context.beginPath();
        context.moveTo(x, y + 10); context.quadraticCurveTo(x + 14, y, x + 27, y + 10);
        context.quadraticCurveTo(x + 40, y, x + 54, y + 10);
        context.stroke();
      }
    }
    const player = state.player;
    if (player.invulnerable === 0 || Math.floor(player.invulnerable * 10) % 2 === 1) drawPlane(player);
  }

  function drawHud(state) {
    // Top instrument bar.
    context.fillStyle = 'rgba(16,28,48,0.85)';
    context.fillRect(0, 0, FIELD.width, 64);
    context.textBaseline = 'top';
    text(altLabel(`${state.altitude} ft`), 24, 18, 26, PALETTE.text, 'left');
    text(spdLabel(`${Math.round(state.speed * 3.6)} kt`), 260, 18, 26, PALETTE.text, 'left');
    text(hdgLabel(`${String(state.heading).padStart(3, '0')}°`), 480, 18, 26, PALETTE.text, 'left');
    text(distLabel(`${Math.floor(state.distance)} m`), 660, 18, 26, PALETTE.text, 'left');
    text(scoreLabel(state.score), 880, 18, 26, PALETTE.text, 'left');
    text(ringsLabel(`${state.ringsTaken}/8`), 1060, 18, 26, PALETTE.ring, 'left');
    // Lives as small planes (squares) on a dark pill, so they read over sky/sun.
    const firstLife = FIELD.width - 24 - LIVES * (LIFE_SIZE + LIFE_GAP) + LIFE_GAP;
    context.fillStyle = 'rgba(16,28,48,0.85)';
    context.fillRect(firstLife - 92, 70, 92 + LIVES * (LIFE_SIZE + LIFE_GAP) + 12, 36);
    for (let life = 0; life < LIVES; life += 1) {
      context.fillStyle = life < state.lives ? PALETTE.plane : '#334155';
      context.fillRect(firstLife + life * (LIFE_SIZE + LIFE_GAP), 78, LIFE_SIZE, LIFE_SIZE);
    }
    text('LIVES', firstLife - 12, 76, 22, PALETTE.text, 'right');
    // Artificial horizon: bank indicator bottom-left.
    const hx = 70, hy = FIELD.height - 70;
    context.save();
    context.translate(hx, hy);
    context.rotate(-state.player.bank * 0.35);
    context.fillStyle = '#7ec8f2'; context.fillRect(-44, -22, 88, 22);
    context.fillStyle = '#8b5a2b'; context.fillRect(-44, 0, 88, 22);
    context.restore();
    context.strokeStyle = PALETTE.text; context.lineWidth = 2;
    context.strokeRect(hx - 44, hy - 22, 88, 44);
    context.fillStyle = PALETTE.text;
    context.fillRect(hx - 2, hy - 2, 4, 4);
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(16,28,48,0.92)';
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.panelEdge; context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.ring, 'center');
  }

  const TITLE_LINES = [
    'Fly the Coral Isles courier run: 8 golden rings, then home.',
    'Climb with ↑ / W, descend with ↓ / S, bank with ← → / A D.',
    'Dodge storm clouds and gull flocks. 3 hits and you crash.',
    '',
  ];
  const PAUSED_LINES = ['The islands will wait for you.'];
  const OVER_LINES = ['', ''];
  const WIN_LINES = ['', '', ''];

  function draw(state, screen, best, screenX) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state, screenX);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[3] = bestLabel(best);
      drawPanel('Coral Isles Sky Courier', TITLE_LINES, 'Press Space or click to take off');
      // Aircraft in frame above the panel, not over its text.
      const savedY = state.player.y;
      state.player.y = 118;
      drawPlane(state.player);
      state.player.y = savedY;
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = bestLabel(best);
      drawPanel('Crashed!', OVER_LINES, 'Press Space or click to fly again');
    } else if (screen === SCREEN_WIN) {
      WIN_LINES[0] = `Rings ${state.ringsTaken}/8  ·  ${Math.floor(state.distance)} m flown`;
      WIN_LINES[1] = finalLabel(state.score);
      WIN_LINES[2] = bestLabel(best);
      drawPanel('Delivered!', WIN_LINES, 'Press Space or click to fly again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
