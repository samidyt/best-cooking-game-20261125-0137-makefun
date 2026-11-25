// The kitchen's rules, with no DOM in it: the same file runs in the browser
// and in a Node logic test. The chef walks a warung kitchen, grabs raw
// ingredients from the bins, chops tomato and lettuce on the board, grills
// patty and egg, builds the dish on the plate, and serves it at the window
// before the order's patience runs out.
import {
  CHEF, CHOP_SECONDS, GRILL_BURNT_SECONDS, GRILL_COOKED_SECONDS, HEARTS,
  INTERACT_RANGE, MAX_ORDERS, ORDER_INTERVAL, ORDER_INTERVAL_RUSH,
  ORDER_PATIENCE, ORDER_PATIENCE_RUSH, RECIPES, RECIPE_KEYS, RUSH_SECONDS,
  SHIFT_SECONDS, STATIONS,
} from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_CHOP_DONE = 2;
export const EVENT_COOKED = 4;
export const EVENT_BURNT = 8;
export const EVENT_SERVE = 16;
export const EVENT_EXPIRE = 32;
export const EVENT_OVER = 64;
export const EVENT_ERROR = 128;
export const EVENT_ORDER = 256;
export const EVENT_TRASH = 512;

const CHOPPABLE = new Set(['tomato', 'lettuce']);
const GRILLABLE = new Set(['patty', 'egg']);

/** True when the plate's items are exactly the recipe's needs, any order. */
export function plateMatchesRecipe(plate, recipeKey) {
  const needs = RECIPES[recipeKey].needs;
  if (plate.length !== needs.length) return false;
  const left = needs.map((need) => `${need.kind}:${need.state}`);
  for (const item of plate) {
    const at = left.indexOf(`${item.kind}:${item.state}`);
    if (at === -1) return false;
    left.splice(at, 1);
  }
  return true;
}

/** The first active order the finished plate satisfies, or null. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatchesRecipe(state.plate, order.recipe)) return order;
  }
  return null;
}

/** Is this item one of the given recipe's needs and not already on the plate? */
function plateWants(state, item, recipeKey) {
  const needs = RECIPES[recipeKey].needs;
  const onPlate = state.plate.filter((p) => p.kind === item.kind && p.state === item.state).length;
  const wanted = needs.filter((n) => n.kind === item.kind && n.state === item.state).length;
  return wanted > onPlate;
}

function solidRects() {
  return STATIONS.map((s) => s.rect);
}

function hitsSolid(x, y, radius) {
  for (const r of solidRects()) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < radius * radius) return true;
  }
  return false;
}

export function createWorld(random) {
  const state = {
    time: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    over: false,
    rush: false,
    chef: { x: 640, y: 440, carry: null },
    board: { item: null, progress: 0 },
    grill: [
      { item: null, t: 0, announced: '' },
      { item: null, t: 0, announced: '' },
    ],
    plate: [],
    orders: [],
    spawnTimer: 1.2,
    nextOrderId: 1,
    popups: [],
    message: '',
    messageT: 0,
    expired: 0,
    burnt: 0,
    trashed: 0,
  };

  function addPopup(x, y, text, color) {
    state.popups.push({ x, y, text, color, t: 0 });
    if (state.popups.length > 12) state.popups.shift();
  }

  function setMessage(text) {
    state.message = text;
    state.messageT = 2.5;
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const recipe = RECIPE_KEYS[Math.floor(random() * RECIPE_KEYS.length)];
    const patience = state.rush ? ORDER_PATIENCE_RUSH : ORDER_PATIENCE;
    state.orders.push({ id: state.nextOrderId, recipe, patience, max: patience });
    state.nextOrderId += 1;
  }

  function nearestStation() {
    let best = null;
    let bestDist = INTERACT_RANGE;
    for (const station of STATIONS) {
      const dx = station.anchor.x - state.chef.x;
      const dy = station.anchor.y - state.chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = station;
      }
    }
    return best;
  }

  function serveOrder(order) {
    const recipe = RECIPES[order.recipe];
    const tip = Math.round(recipe.price * 0.5 * (order.patience / order.max));
    const multiplier = Math.min(2, 1 + 0.1 * state.combo);
    const earned = Math.round((recipe.price + tip) * multiplier);
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.plate = [];
    state.orders = state.orders.filter((o) => o.id !== order.id);
    const win = STATIONS.find((s) => s.id === 'window');
    addPopup(win.anchor.x - 40, win.anchor.y - 30, `+$${earned}`, '#f6c945');
    if (state.combo >= 2) addPopup(win.anchor.x - 40, win.anchor.y - 58, `COMBO x${state.combo}!`, '#5fbf4a');
    setMessage(`Served ${recipe.name} — $${earned}`);
    return EVENT_SERVE;
  }

  return {
    state,

    reset() {
      state.time = 0;
      state.timeLeft = SHIFT_SECONDS;
      state.coins = 0;
      state.served = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.hearts = HEARTS;
      state.over = false;
      state.rush = false;
      state.chef = { x: 640, y: 440, carry: null };
      state.board = { item: null, progress: 0 };
      state.grill = [
        { item: null, t: 0, announced: '' },
        { item: null, t: 0, announced: '' },
      ];
      state.plate = [];
      state.orders = [];
      state.spawnTimer = 1.2;
      state.nextOrderId = 1;
      state.popups = [];
      state.message = '';
      state.messageT = 0;
      state.expired = 0;
      state.burnt = 0;
      state.trashed = 0;
    },

    /** One fixed step. `dir` is {x, y} normalised; `ambient` keeps the
     *  title-screen kitchen alive without orders expiring or the clock
     *  running. Returns event flags. */
    step(dt, dir, ambient) {
      let events = 0;
      if (state.over) return events;
      state.time += dt;

      // Move the chef, sliding along counters.
      const speed = CHEF.speed;
      const nx = state.chef.x + dir.x * speed * dt;
      const ny = state.chef.y + dir.y * speed * dt;
      if (!hitsSolid(nx, state.chef.y, CHEF.radius) && nx > 16 && nx < 1264) state.chef.x = nx;
      if (!hitsSolid(state.chef.x, ny, CHEF.radius) && ny > 88 && ny < 704) state.chef.y = ny;

      if (!ambient) {
        state.timeLeft -= dt;
        state.rush = state.timeLeft <= RUSH_SECONDS;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          state.over = true;
          return events | EVENT_OVER;
        }
        // New orders, faster in the rush.
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          state.spawnTimer = state.rush ? ORDER_INTERVAL_RUSH : ORDER_INTERVAL;
          if (state.orders.length < MAX_ORDERS) {
            spawnOrder();
            events |= EVENT_ORDER;
          }
        }
        // Patience runs out.
        for (let i = state.orders.length - 1; i >= 0; i -= 1) {
          const order = state.orders[i];
          order.patience -= dt;
          if (order.patience <= 0) {
            state.orders.splice(i, 1);
            state.hearts -= 1;
            state.combo = 0;
            state.expired += 1;
            setMessage(`Order #${order.id} walked out — a heart lost!`);
            events |= EVENT_EXPIRE;
            if (state.hearts <= 0) {
              state.over = true;
              return events | EVENT_OVER;
            }
          }
        }
      }

      // Chopping finishes on its own once the item is on the board.
      if (state.board.item && state.board.item.state === 'raw') {
        state.board.progress += dt;
        if (state.board.progress >= CHOP_SECONDS) {
          state.board.item.state = 'chopped';
          state.board.progress = 0;
          events |= EVENT_CHOP_DONE;
        }
      }

      // The grill cooks, then burns.
      for (const slot of state.grill) {
        if (!slot.item) continue;
        slot.t += dt;
        if (slot.item.state === 'raw' && slot.t >= GRILL_COOKED_SECONDS) {
          slot.item.state = 'cooked';
          slot.announced = 'cooked';
          events |= EVENT_COOKED;
        } else if (slot.item.state === 'cooked' && slot.t >= GRILL_BURNT_SECONDS) {
          slot.item.state = 'burnt';
          state.burnt += 1;
          events |= EVENT_BURNT;
          setMessage('Something burned on the grill!');
        }
      }

      // Popups float up and fade; the toast times out.
      for (let i = state.popups.length - 1; i >= 0; i -= 1) {
        state.popups[i].t += dt;
        if (state.popups[i].t > 1.4) state.popups.splice(i, 1);
      }
      if (state.messageT > 0) {
        state.messageT -= dt;
        if (state.messageT <= 0) state.message = '';
      }
      return events;
    },

    /** Use the nearest station. Returns event flags. */
    interact() {
      if (state.over) return 0;
      const station = nearestStation();
      if (!station) {
        setMessage('Nothing to use here — walk up to a station.');
        return EVENT_ERROR;
      }
      const chef = state.chef;

      if (station.kind === 'bin') {
        if (chef.carry) {
          setMessage('Hands full — put this down first.');
          return EVENT_ERROR;
        }
        chef.carry = { kind: station.item, state: 'raw' };
        return EVENT_PICKUP;
      }

      if (station.kind === 'board') {
        if (!state.board.item && chef.carry && CHOPPABLE.has(chef.carry.kind) && chef.carry.state === 'raw') {
          state.board.item = chef.carry;
          state.board.progress = 0;
          chef.carry = null;
          return EVENT_PICKUP;
        }
        if (state.board.item && state.board.item.state === 'chopped' && !chef.carry) {
          chef.carry = state.board.item;
          state.board.item = null;
          return EVENT_PICKUP;
        }
        if (state.board.item && state.board.item.state === 'raw') {
          setMessage('Still chopping…');
          return EVENT_ERROR;
        }
        setMessage('The board is for tomato and lettuce.');
        return EVENT_ERROR;
      }

      if (station.kind === 'grill') {
        if (chef.carry && GRILLABLE.has(chef.carry.kind) && chef.carry.state === 'raw') {
          const slot = state.grill.find((s) => !s.item);
          if (!slot) {
            setMessage('Both grill spots are taken.');
            return EVENT_ERROR;
          }
          slot.item = chef.carry;
          slot.t = 0;
          slot.announced = '';
          chef.carry = null;
          return EVENT_PICKUP;
        }
        if (!chef.carry) {
          const slot = state.grill.find((s) => s.item);
          if (slot) {
            chef.carry = slot.item;
            slot.item = null;
            slot.t = 0;
            return EVENT_PICKUP;
          }
        }
        setMessage('The grill is for patty and egg.');
        return EVENT_ERROR;
      }

      if (station.kind === 'plate') {
        if (!chef.carry) {
          setMessage('Bring an ingredient to the plate.');
          return EVENT_ERROR;
        }
        if (state.plate.length >= 4) {
          setMessage('The plate is full.');
          return EVENT_ERROR;
        }
        const wanted = RECIPE_KEYS.some((key) => plateWants(state, chef.carry, key));
        if (!wanted) {
          setMessage('No open order needs that on the plate.');
          return EVENT_ERROR;
        }
        state.plate.push(chef.carry);
        chef.carry = null;
        return EVENT_PICKUP;
      }

      if (station.kind === 'window') {
        const order = matchingOrder(state);
        if (!order) {
          setMessage('That plate matches no open order yet.');
          return EVENT_ERROR;
        }
        return serveOrder(order);
      }

      if (station.kind === 'trash') {
        if (!chef.carry) {
          setMessage('Nothing to throw away.');
          return EVENT_ERROR;
        }
        chef.carry = null;
        state.trashed += 1;
        return EVENT_TRASH;
      }
      return 0;
    },

    /** Stars for the end screen: 1–3 by coins earned in the shift. */
    stars() {
      if (state.coins >= 200) return 3;
      if (state.coins >= 120) return 2;
      return 1;
    },
  };
}
