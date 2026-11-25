// Every pixel of Rasa Rush, drawn with canvas shapes — no image files, no
// fonts loaded from anywhere. The kitchen, the order board, the ingredients
// and the chef are all drawn here, so the screenshots are renders of the
// game's own code.
import {
  FIELD, FONT, GRILL_BURNT_SECONDS, GRILL_COOKED_SECONDS, INGREDIENTS,
  INTERACT_RANGE, PALETTE, RECIPES, STATIONS,
} from './config.js';
import { matchingOrder } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient, drawn at (x, y) with radius r. Burnt food is charcoal. */
export function drawIngredient(ctx, kind, state, x, y, r) {
  const ing = INGREDIENTS[kind];
  const burnt = state === 'burnt';
  const cooked = state === 'cooked' || burnt;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = burnt ? '#2b2320' : '#d9a45a';
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = burnt ? '#1d1713' : ing.color;
    ctx.fillRect(-r, -r * 0.15, r * 2, r * 0.45);
    ctx.fillStyle = burnt ? '#3a2f28' : '#f7e3b0';
    for (const sx of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, -r * 0.55, r * 0.12, r * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = burnt ? '#17110e' : cooked ? '#7a4028' : ing.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = burnt ? '#241a14' : cooked ? '#93522f' : '#b06a48';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.18, r * 0.55, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = burnt ? '#3a1a1a' : ing.color;
      for (const sx of [-0.45, 0.45]) {
        ctx.beginPath();
        ctx.arc(sx * r, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f7b0a8';
      ctx.beginPath();
      ctx.arc(-r * 0.45, 0, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.45, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = burnt ? '#2b1414' : ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d8a2e';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(-r * 0.3, -r * 0.5);
      ctx.lineTo(0, -r * 0.65);
      ctx.lineTo(r * 0.3, -r * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = burnt ? '#1f2b1a' : ing.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const rr = r * (i % 2 === 0 ? 0.95 : 0.7);
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = '#3d8a2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.2);
      ctx.lineTo(r * 0.6, r * 0.2);
      ctx.moveTo(-r * 0.6, r * 0.3);
      ctx.lineTo(r * 0.6, -r * 0.3);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = burnt ? '#33270f' : ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = burnt ? '#1d1713' : '#d9a41f';
    for (const [hx, hy] of [[-0.3, 0.2], [0.25, 0.05], [0, 0.4]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'egg') {
    ctx.fillStyle = burnt ? '#241d16' : '#fdf6e3';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.75, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = burnt ? '#17110e' : cooked ? '#e8960f' : '#f6c945';
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStationBase(ctx, station) {
  const r = station.rect;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, r.x + 3, r.y + 4, r.w, r.h, 10);
  ctx.fill();
}

function drawCounter(ctx, station, highlight) {
  const r = station.rect;
  drawStationBase(ctx, station);
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, r.x, r.y, r.w, 14, 7);
  ctx.fill();
  if (highlight) {
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
    ctx.stroke();
  }
}

function nearestStationId(state) {
  let best = null;
  let bestDist = INTERACT_RANGE;
  for (const station of STATIONS) {
    const dist = Math.hypot(station.anchor.x - state.chef.x, station.anchor.y - state.chef.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = station.id;
    }
  }
  return best;
}

function drawBins(ctx, state, nearId) {
  for (const station of STATIONS.filter((s) => s.kind === 'bin')) {
    const r = station.rect;
    drawCounter(ctx, station, nearId === station.id);
    drawIngredient(ctx, station.item, 'raw', r.x + r.w / 2, r.y + 34, 20);
    text(ctx, station.label, r.x + r.w / 2, r.y + r.h - 12, 12, PALETTE.text);
  }
}

function drawBoard(ctx, state, nearId) {
  const station = STATIONS.find((s) => s.id === 'board');
  const r = station.rect;
  drawStationBase(ctx, station);
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#8a6b4f';
  ctx.lineWidth = 3;
  roundRect(ctx, r.x + 10, r.y + 10, r.w - 20, r.h - 34, 8);
  ctx.stroke();
  if (state.board.item) {
    const item = state.board.item;
    drawIngredient(ctx, item.kind, item.state, r.x + r.w / 2, r.y + 48, 26);
    if (item.state === 'raw') {
      const p = Math.min(1, state.board.progress / 1.6);
      ctx.fillStyle = '#2b2320';
      roundRect(ctx, r.x + 30, r.y + r.h - 24, r.w - 60, 10, 5);
      ctx.fill();
      ctx.fillStyle = PALETTE.green;
      roundRect(ctx, r.x + 30, r.y + r.h - 24, (r.w - 60) * p, 10, 5);
      ctx.fill();
      text(ctx, 'CHOPPING…', r.x + r.w / 2, r.y + r.h - 34, 11, PALETTE.text);
    } else {
      text(ctx, 'CHOPPED — TAKE IT!', r.x + r.w / 2, r.y + r.h - 16, 12, '#2f6b24');
    }
  } else {
    text(ctx, 'CHOP BOARD', r.x + r.w / 2, r.y + 34, 13, '#6b4f30');
    text(ctx, 'tomato · lettuce', r.x + r.w / 2, r.y + 58, 11, '#8a6b4f');
    // A little knife, drawn.
    ctx.strokeStyle = '#dfe6ea';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w / 2 - 30, r.y + 88);
    ctx.lineTo(r.x + r.w / 2 + 30, r.y + 88);
    ctx.stroke();
    ctx.strokeStyle = '#5b6670';
    ctx.beginPath();
    ctx.moveTo(r.x + r.w / 2 + 30, r.y + 88);
    ctx.lineTo(r.x + r.w / 2 + 48, r.y + 88);
    ctx.stroke();
  }
  if (nearId === 'board') {
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
    ctx.stroke();
  }
}

function drawGrill(ctx, state, nearId) {
  const station = STATIONS.find((s) => s.id === 'grill');
  const r = station.rect;
  drawStationBase(ctx, station);
  ctx.fillStyle = PALETTE.grill;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#22252a';
  ctx.lineWidth = 3;
  for (let i = 1; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(r.x + (r.w / 6) * i, r.y + 12);
    ctx.lineTo(r.x + (r.w / 6) * i, r.y + r.h - 12);
    ctx.stroke();
  }
  const slots = [
    { x: r.x + 62, y: r.y + 52 },
    { x: r.x + 178, y: r.y + 52 },
  ];
  state.grill.forEach((slot, i) => {
    const s = slots[i];
    ctx.strokeStyle = '#5b6670';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 34, 0, Math.PI * 2);
    ctx.stroke();
    if (slot.item) {
      drawIngredient(ctx, slot.item.kind, slot.item.state, s.x, s.y, 24);
      const p = Math.min(1, slot.t / GRILL_BURNT_SECONDS);
      const barColor = slot.item.state === 'burnt' ? PALETTE.red
        : slot.t >= GRILL_COOKED_SECONDS ? PALETTE.green : PALETTE.amber;
      ctx.fillStyle = '#22252a';
      roundRect(ctx, s.x - 30, s.y + 40, 60, 8, 4);
      ctx.fill();
      ctx.fillStyle = barColor;
      roundRect(ctx, s.x - 30, s.y + 40, 60 * p, 8, 4);
      ctx.fill();
      if (slot.item.state === 'cooked') text(ctx, 'READY!', s.x, s.y - 44, 11, PALETTE.green);
      if (slot.item.state === 'burnt') text(ctx, 'BURNT!', s.x, s.y - 44, 11, PALETTE.red);
    }
  });
  text(ctx, 'GRILL', r.x + r.w / 2, r.y + r.h - 10, 12, '#aab4bc');
  if (nearId === 'grill') {
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
    ctx.stroke();
  }
}

function drawPlateStation(ctx, state, nearId) {
  const station = STATIONS.find((s) => s.id === 'plate');
  const r = station.rect;
  drawCounter(ctx, station, nearId === 'plate');
  // The plate itself.
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, r.y + 52, 150, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc4ae';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, r.y + 52, 150, 30, 0, 0, Math.PI * 2);
  ctx.stroke();
  state.plate.forEach((item, i) => {
    const spread = state.plate.length > 1 ? (i - (state.plate.length - 1) / 2) * 56 : 0;
    drawIngredient(ctx, item.kind, item.state, r.x + r.w / 2 + spread, r.y + 50, 22);
  });
  if (state.plate.length === 0) {
    text(ctx, 'ASSEMBLE HERE', r.x + r.w / 2, r.y + 52, 12, '#8a7a5f');
  }
  const order = matchingOrder(state);
  if (order) {
    text(ctx, `✓ READY — ${RECIPES[order.recipe].name.toUpperCase()}!`, r.x + r.w / 2, r.y + r.h - 12, 13, PALETTE.green);
  } else {
    text(ctx, 'ASSEMBLY COUNTER', r.x + r.w / 2, r.y + r.h - 12, 11, PALETTE.muted);
  }
}

function drawWindow(ctx, state, nearId) {
  const station = STATIONS.find((s) => s.id === 'window');
  const r = station.rect;
  drawStationBase(ctx, station);
  ctx.fillStyle = '#5b3a24';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = '#f7e3b0';
  roundRect(ctx, r.x + 10, r.y + 10, r.w - 20, 64, 8);
  ctx.fill();
  text(ctx, 'SERVE', r.x + r.w / 2, r.y + 30, 16, '#5b3a24');
  text(ctx, 'ring the bell!', r.x + r.w / 2, r.y + 54, 11, '#8a6b4f');
  // The bell.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(r.x + r.w / 2, r.y + 104, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(r.x + r.w / 2 - 16, r.y + 104, 32, 5);
  ctx.fillStyle = '#2b2320';
  ctx.beginPath();
  ctx.arc(r.x + r.w / 2, r.y + 116, 4, 0, Math.PI * 2);
  ctx.fill();
  const order = matchingOrder(state);
  if (order) {
    ctx.strokeStyle = PALETTE.green;
    ctx.lineWidth = 4;
    roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
    ctx.stroke();
    text(ctx, 'ORDER READY →', r.x + r.w / 2, r.y + r.h - 8, 11, PALETTE.green);
  }
  if (nearId === 'window') {
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
    ctx.stroke();
  }
}

function drawTrash(ctx, state, nearId) {
  const station = STATIONS.find((s) => s.id === 'trash');
  const r = station.rect;
  drawCounter(ctx, station, nearId === 'trash');
  ctx.fillStyle = '#5b6670';
  roundRect(ctx, r.x + 40, r.y + 18, 80, 56, 6);
  ctx.fill();
  ctx.fillStyle = '#7d8a94';
  roundRect(ctx, r.x + 34, r.y + 10, 92, 12, 6);
  ctx.fill();
  text(ctx, 'TRASH', r.x + r.w / 2, r.y + r.h - 12, 12, PALETTE.text);
}

function drawChef(ctx, state) {
  const { x, y, carry } = state.chef;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body + apron.
  ctx.fillStyle = PALETTE.chef;
  ctx.beginPath();
  ctx.arc(0, 2, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.apron;
  ctx.beginPath();
  ctx.moveTo(-13, -4);
  ctx.lineTo(13, -4);
  ctx.lineTo(10, 18);
  ctx.lineTo(-10, 18);
  ctx.closePath();
  ctx.fill();
  // Head + chef hat.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -16, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-7, -26, 7, 0, Math.PI * 2);
  ctx.arc(0, -30, 8, 0, Math.PI * 2);
  ctx.arc(7, -26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -28, 24, 6);
  // Eyes.
  ctx.fillStyle = '#2b2320';
  ctx.beginPath();
  ctx.arc(-4, -16, 1.6, 0, Math.PI * 2);
  ctx.arc(4, -16, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Carried ingredient floats above the hat.
  if (carry) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, -46, 15, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, carry.kind, carry.state, 0, -46, 11);
  }
  ctx.restore();
}

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    const alpha = Math.max(0, 1 - p.t / 1.4);
    ctx.globalAlpha = alpha;
    text(ctx, p.text, p.x, p.y - p.t * 42, 20, p.color);
    ctx.globalAlpha = 1;
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, 72);
  // Order board: tickets.
  text(ctx, 'ORDERS', 52, 16, 11, PALETTE.muted, 'left');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', 140, 44, 13, PALETTE.muted, 'left');
  }
  state.orders.forEach((order, i) => {
    const x = 100 + i * 168;
    const recipe = RECIPES[order.recipe];
    const frac = Math.max(0, order.patience / order.max);
    const barColor = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.amber : PALETTE.red;
    ctx.fillStyle = '#3a2f28';
    roundRect(ctx, x, 8, 160, 56, 8);
    ctx.fill();
    ctx.strokeStyle = barColor;
    ctx.lineWidth = 2;
    roundRect(ctx, x, 8, 160, 56, 8);
    ctx.stroke();
    text(ctx, `#${order.id} ${recipe.name}`, x + 80, 22, 13, PALETTE.text);
    recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need.kind, need.state, x + 26 + j * 34, 44, 11);
    });
    ctx.fillStyle = '#241d19';
    roundRect(ctx, x + 8, 56, 144, 5, 2);
    ctx.fill();
    ctx.fillStyle = barColor;
    roundRect(ctx, x + 8, 56, 144 * frac, 5, 2);
    ctx.fill();
  });
  // Shift timer, centre.
  const timerX = 820;
  const timerColor = state.rush ? PALETTE.red : PALETTE.text;
  text(ctx, state.rush ? '⚠ RUSH HOUR' : 'SHIFT', timerX, 18, 11, state.rush ? PALETTE.red : PALETTE.muted);
  text(ctx, formatTime(state.timeLeft), timerX, 44, 26, timerColor);
  // Coins, hearts, combo.
  text(ctx, `💰 $${state.coins}`, 1000, 24, 20, PALETTE.gold, 'left');
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < state.hearts ? '♥' : '♡';
  text(ctx, hearts, 1000, 52, 18, PALETTE.red, 'left');
  text(ctx, `SERVED ${state.served}`, 1150, 24, 14, PALETTE.text, 'left');
  text(ctx, state.combo >= 2 ? `COMBO x${state.combo}` : 'BEST x' + Math.max(1, state.bestCombo), 1150, 52, 14, PALETTE.green, 'left');
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 72, FIELD.width, FIELD.height - 72);
  ctx.fillStyle = PALETTE.floorTile;
  for (let y = 72; y < FIELD.height; y += 64) {
    for (let x = ((y / 64) % 2 === 0 ? 0 : 32); x < FIELD.width; x += 64) {
      ctx.fillRect(x, y, 60, 60);
    }
  }
  // Wall strip with the warung's name.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 72, FIELD.width, 8);
  text(ctx, 'WARUNG BARA — dapur panas, pelanggan lapar', 1240, 92, 11, '#7a6a58', 'right');
}

function drawHint(ctx, state) {
  const hints = [
    'WASD / arrows — walk   ·   E / Space / click — use station',
    'Grab → chop or grill → build on the plate → ring the bell at SERVE',
    'Watch the grill: cooked is perfect, burnt goes in the trash!',
  ];
  text(ctx, hints[Math.floor(state.time / 6) % hints.length], FIELD.width / 2, 700, 13, PALETTE.muted);
}

function drawOverlay(ctx, title, lines, accent) {
  const boxH = 110 + lines.length * 34 + 26;
  const boxY = Math.max(60, (FIELD.height - boxH) / 2);
  ctx.fillStyle = 'rgba(20,14,10,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#241d19';
  roundRect(ctx, 340, boxY, 600, boxH, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  roundRect(ctx, 340, boxY, 600, boxH, 18);
  ctx.stroke();
  text(ctx, title, 640, boxY + 50, 44, accent);
  lines.forEach((line, i) => {
    text(ctx, line, 640, boxY + 108 + i * 34, 17, PALETTE.text);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.round(FIELD.width * scale * (window.devicePixelRatio || 1));
    canvas.height = Math.round(FIELD.height * scale * (window.devicePixelRatio || 1));
    canvas.style.width = `${Math.round(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.round(FIELD.height * scale)}px`;
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    draw(state, screen, best) {
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      drawFloor(ctx);
      const nearId = nearestStationId(state);
      drawBins(ctx, state, nearId);
      drawBoard(ctx, state, nearId);
      drawGrill(ctx, state, nearId);
      drawPlateStation(ctx, state, nearId);
      drawWindow(ctx, state, nearId);
      drawTrash(ctx, state, nearId);
      drawChef(ctx, state);
      drawPopups(ctx, state);
      drawHud(ctx, state);
      if (state.message) {
        ctx.fillStyle = 'rgba(20,14,10,0.8)';
        roundRect(ctx, 390, 76, 500, 30, 8);
        ctx.fill();
        text(ctx, state.message, 640, 92, 14, '#ffe9a8');
      }
      if (screen === SCREEN_PLAY) drawHint(ctx, state);
      if (screen === SCREEN_TITLE) {
        drawOverlay(ctx, 'RASA RUSH', [
          'Warung Bara — one chef, one shift, a hungry lunch crowd.',
          'Grab ingredients, chop, grill, build the plate, serve!',
          '',
          'WASD / arrows to walk · E / Space / click to use a station',
          'P pause · M mute · R restart',
          '',
          `Best shift so far: $${best}`,
          '',
          'Press Space or click to start the shift',
        ], PALETTE.gold);
      }
      if (screen === SCREEN_PAUSED) {
        drawOverlay(ctx, 'PAUSED', [
          'The stove is off. The orders are waiting.',
          '',
          'Press P or Space to keep cooking',
        ], PALETTE.muted);
      }
      if (screen === SCREEN_OVER) {
        const earned = state.coins >= 200 ? 3 : state.coins >= 120 ? 2 : 1;
        drawOverlay(ctx, 'SHIFT OVER!', [
          `You served ${state.served} dish${state.served === 1 ? '' : 'es'} and earned $${state.coins}.`,
          `Best combo x${Math.max(1, state.bestCombo)} · ${state.expired} order${state.expired === 1 ? '' : 's'} walked out · ${state.burnt} burnt`,
          '',
          '★'.repeat(earned) + '☆'.repeat(3 - earned),
          state.coins > best ? 'NEW BEST SHIFT!' : `Best shift: $${Math.max(best, state.coins)}`,
          '',
          'Press Space or click to cook again',
        ], PALETTE.gold);
      }
    },
  };
}
