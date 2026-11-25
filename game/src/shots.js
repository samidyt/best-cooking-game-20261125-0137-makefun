// The screenshot scenes behind ?shot=start|play|chop|serve. Each one stages
// the real world state directly (orders on the board, food on the grill and
// board, a plate in a real state) and then steps the simulation a few frames
// so the frame is what the game really looks like — the renderer draws
// exactly what it draws in play, and the same seed always gives the same
// frame. Nothing here is edited or composited afterwards.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function order(id, recipe, patience, max) {
  return { id, recipe, patience, max };
}

function stageCommon(world, { coins, served, combo, timeLeft, hearts }) {
  const s = world.state;
  s.coins = coins;
  s.served = served;
  s.combo = combo;
  s.bestCombo = Math.max(combo, served > 0 ? 2 : 0);
  s.timeLeft = timeLeft;
  s.hearts = hearts;
  s.rush = timeLeft <= 60;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  const s = world.state;

  if (name === 'chop') {
    // The chef is mid-chop: a tomato is half-chopped on the board, an egg is
    // cooked on the grill, two orders wait on the board.
    stageCommon(world, { coins: 24, served: 2, combo: 1, timeLeft: 128, hearts: 3 });
    s.orders = [order(3, 'burger', 34, 50), order(4, 'dadar', 22, 50)];
    s.board.item = { kind: 'tomato', state: 'raw' };
    s.board.progress = 1.1;
    s.grill[0].item = { kind: 'egg', state: 'cooked' };
    s.grill[0].t = 5.2;
    s.chef.x = 210;
    s.chef.y = 445;
    s.message = 'Chopping the tomato…';
    s.messageT = 2;
    for (let i = 0; i < 12; i += 1) world.step(STEP, { x: 0, y: 0 }, false);
    return { screen: SCREEN_PLAY, best: 86 };
  }

  if (name === 'serve') {
    // A finished Keju Leleh sits on the plate, matching order #6; the chef
    // stands at the serving window and the bell is ready to ring.
    stageCommon(world, { coins: 89, served: 6, combo: 3, timeLeft: 72, hearts: 2 });
    s.orders = [order(6, 'keju', 18, 50), order(7, 'burger', 41, 50)];
    s.plate = [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
      { kind: 'tomato', state: 'chopped' },
    ];
    s.grill[1].item = { kind: 'patty', state: 'cooked' };
    s.grill[1].t = 5.8;
    s.chef.x = 1000;
    s.chef.y = 610;
    s.popups.push({ x: 1000, y: 560, text: '+$21', color: '#f6c945', t: 0.2 });
    s.message = 'Keju Leleh is ready — serve it!';
    s.messageT = 2;
    for (let i = 0; i < 12; i += 1) world.step(STEP, { x: 0, y: 0 }, false);
    return { screen: SCREEN_PLAY, best: 142 };
  }

  if (name === 'play') {
    // The cover: a Burger Bara finished on the plate and ready to serve,
    // the next dish mid-assembly (patty on the grill, tomato half-chopped),
    // three orders on the board, the shift timer running.
    stageCommon(world, { coins: 47, served: 3, combo: 2, timeLeft: 151, hearts: 3 });
    s.orders = [
      order(2, 'burger', 38, 50),
      order(3, 'keju', 26, 50),
      order(4, 'dadar', 12, 50),
    ];
    s.plate = [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'lettuce', state: 'chopped' },
    ];
    s.board.item = { kind: 'tomato', state: 'raw' };
    s.board.progress = 0.9;
    s.grill[0].item = { kind: 'patty', state: 'raw' };
    s.grill[0].t = 2.6;
    s.grill[1].item = { kind: 'egg', state: 'cooked' };
    s.grill[1].t = 5.1;
    s.chef.x = 640;
    s.chef.y = 520;
    s.chef.carry = { kind: 'cheese', state: 'raw' };
    s.message = 'Burger Bara is ready — serve it!';
    s.messageT = 2;
    for (let i = 0; i < 12; i += 1) world.step(STEP, { x: 0, y: 0 }, false);
    return { screen: SCREEN_PLAY, best: 86 };
  }

  // start (default): the title screen over a kitchen with orders already in.
  stageCommon(world, { coins: 0, served: 0, combo: 0, timeLeft: 180, hearts: 3 });
  s.orders = [order(1, 'burger', 44, 50), order(2, 'keju', 31, 50)];
  s.grill[0].item = { kind: 'patty', state: 'raw' };
  s.grill[0].t = 1.4;
  s.chef.x = 640;
  s.chef.y = 440;
  for (let i = 0; i < 30; i += 1) world.step(STEP, { x: 0, y: 0 }, true);
  return { screen: SCREEN_TITLE, best: 86 };
}
