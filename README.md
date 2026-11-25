# Rasa Rush — Warung Bara

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/samidyt/best-cooking-game-20261125-0137-makefun/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/samidyt/best-cooking-game-20261125-0137-makefun/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast-paced cooking game for the [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137)
**"Make the best cooking game"** bounty. You are the only chef at Warung
Bara, a small Indonesian street-food kitchen. Orders land on the board with
a patience bar; grab ingredients from the bins, chop tomato and lettuce on
the board, grill patty and egg (pull them off before they burn!), build the
dish on the plate, and ring the bell at the serving window. Serve fast for
tips, chain serves for combos, and survive the dinner rush — three lost
orders end your shift.

## Play it

Serve `game/` with any static server and open it in desktop Chrome:

```sh
node serve.ts
# game/ is on http://localhost:8080
```

No build step, no network requests, no assets to download — everything is
drawn on canvas and every sound is synthesised with WebAudio.

## Controls

- **WASD / arrow keys** — walk the chef around the kitchen
- **E / Space / click** — use the nearest station (grab, chop, grill, add to
  plate, serve, trash)
- **P / Esc** — pause · **M** — mute · **R** — restart the shift

## The menu

| Dish | Recipe | Price |
| --- | --- | --- |
| Burger Bara | bun + grilled patty + chopped lettuce | $12 |
| Keju Leleh | bun + grilled patty + cheese + chopped tomato | $16 |
| Dadar Bara | grilled egg + chopped tomato + chopped lettuce | $10 |

Tips pay up to +50% for fast service; consecutive serves build a combo
multiplier up to ×2. An order that walks out costs a heart — lose all three
and the shift ends. The last 60 seconds are the dinner rush: orders arrive
faster and patience runs shorter.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library
- `serve.ts` — tiny static server for local play
- `vendor/makefun-game.ts` — the kit's library, unchanged
- `game/` — the playable game as static files: `index.html` plus
  `src/config.js` (tuning, recipes, stations), `src/random.js` (seeded RNG),
  `src/input.js` (keyboard + pointer), `src/audio.js` (synthesised sounds),
  `src/world.js` (kitchen rules: orders, chopping, grilling, serving),
  `src/render.js` (all canvas drawing), `src/shots.js` (screenshot scenes),
  `src/main.js` (boot + game loop)
- `screenshots/` — 4 real renders of the game's own code in a headless
  browser (cover first): the finished plate ready to serve, the title
  screen, mid-chop, and the serve at the window
- `shots.json` — the four `?shot=` scenes behind the screenshots

## License

MIT — see `LICENSE`.
