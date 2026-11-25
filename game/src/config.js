// Every tuning number, colour, recipe and station layout in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One work shift, in seconds. The last 60 seconds are the dinner rush. */
export const SHIFT_SECONDS = 180;
export const RUSH_SECONDS = 60;

export const CHEF = { radius: 21, speed: 310 };
export const INTERACT_RANGE = 96;

export const CHOP_SECONDS = 1.6;
export const GRILL_COOKED_SECONDS = 4;
export const GRILL_BURNT_SECONDS = 8;

export const ORDER_PATIENCE = 50;
export const ORDER_PATIENCE_RUSH = 40;
export const ORDER_INTERVAL = 15;
export const ORDER_INTERVAL_RUSH = 9;
export const MAX_ORDERS = 4;

export const HEARTS = 3;

/** Ingredient kinds. state: raw | chopped | cooked | burnt. */
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b96a', dark: '#c98f3d' },
  patty: { name: 'Patty', color: '#a05a3c', dark: '#6e3a24' },
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#a92c31' },
  lettuce: { name: 'Lettuce', color: '#5fbf4a', dark: '#3d8a2e' },
  cheese: { name: 'Cheese', color: '#f6c945', dark: '#d9a41f' },
  egg: { name: 'Egg', color: '#fdf6e3', dark: '#e8d9a8' },
};

/**
 * Recipes: each is the exact multiset of { kind, state } a finished plate
 * must hold. Bun and cheese go on raw; tomato and lettuce must be chopped;
 * patty and egg must be grilled.
 */
export const RECIPES = {
  burger: {
    name: 'Burger Bara',
    price: 12,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'lettuce', state: 'chopped' },
    ],
  },
  keju: {
    name: 'Keju Leleh',
    price: 16,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  dadar: {
    name: 'Dadar Bara',
    price: 10,
    needs: [
      { kind: 'egg', state: 'cooked' },
      { kind: 'tomato', state: 'chopped' },
      { kind: 'lettuce', state: 'chopped' },
    ],
  },
};
export const RECIPE_KEYS = ['burger', 'keju', 'dadar'];

/**
 * Stations. Each has an id, a label, a solid rect the chef cannot walk
 * through, and an anchor point the chef must stand near to use it.
 */
export const STATIONS = [
  { id: 'bin-bun', kind: 'bin', item: 'bun', label: 'BUN', rect: { x: 40, y: 96, w: 128, h: 80 }, anchor: { x: 104, y: 196 } },
  { id: 'bin-patty', kind: 'bin', item: 'patty', label: 'PATTY', rect: { x: 176, y: 96, w: 128, h: 80 }, anchor: { x: 240, y: 196 } },
  { id: 'bin-tomato', kind: 'bin', item: 'tomato', label: 'TOMATO', rect: { x: 312, y: 96, w: 128, h: 80 }, anchor: { x: 376, y: 196 } },
  { id: 'bin-lettuce', kind: 'bin', item: 'lettuce', label: 'LETTUCE', rect: { x: 448, y: 96, w: 128, h: 80 }, anchor: { x: 512, y: 196 } },
  { id: 'bin-cheese', kind: 'bin', item: 'cheese', label: 'CHEESE', rect: { x: 584, y: 96, w: 128, h: 80 }, anchor: { x: 648, y: 196 } },
  { id: 'bin-egg', kind: 'bin', item: 'egg', label: 'EGG', rect: { x: 720, y: 96, w: 128, h: 80 }, anchor: { x: 784, y: 196 } },
  { id: 'board', kind: 'board', label: 'CHOP', rect: { x: 40, y: 280, w: 240, h: 120 }, anchor: { x: 160, y: 420 } },
  { id: 'grill', kind: 'grill', label: 'GRILL', rect: { x: 1000, y: 280, w: 240, h: 120 }, anchor: { x: 1120, y: 420 } },
  { id: 'plate', kind: 'plate', label: 'ASSEMBLE', rect: { x: 440, y: 580, w: 400, h: 100 }, anchor: { x: 640, y: 560 } },
  { id: 'window', kind: 'window', label: 'SERVE', rect: { x: 1040, y: 540, w: 200, h: 140 }, anchor: { x: 1040, y: 610 } },
  { id: 'trash', kind: 'trash', label: 'TRASH', rect: { x: 40, y: 560, w: 160, h: 100 }, anchor: { x: 220, y: 610 } },
];

export const PALETTE = {
  floor: '#3a2f28',
  floorTile: '#43362d',
  wall: '#2b2320',
  hud: '#241d19',
  counter: '#8a6b4f',
  counterTop: '#a8835f',
  steel: '#7d8a94',
  steelDark: '#5b6670',
  board: '#c9a06a',
  grill: '#3c3f45',
  plate: '#f2ede4',
  text: '#fdf6e3',
  muted: '#cbb9a0',
  gold: '#f6c945',
  red: '#e5484d',
  green: '#5fbf4a',
  amber: '#f39c2c',
  chef: '#f4f1ea',
  apron: '#2f6fb2',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift score is kept between visits (this browser only). */
export const BEST_KEY = 'rasa-rush.best';
