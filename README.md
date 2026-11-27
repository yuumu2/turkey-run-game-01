# PARDON! — The Great Turkey Escape

![make.fun bounty](https://make.fun/badge/turkey-run-game-01.svg)
![entry rank](https://make.fun/badge/turkey-run-game-01/yuumu2/turkey-run-game-01/rank.svg)
![entry reward](https://make.fun/badge/turkey-run-game-01/yuumu2/turkey-run-game-01/reward.svg)

[Play / follow this entry on make.fun](https://make.fun/bounty/turkey-run-game-01)

## About the game

You're a turkey escaping Thanksgiving dinner. The farmer chases you, searches when you slip out of sight, and lunges in the kitchen. The obstacles get tougher as you cross the Farm, Barn, and Kitchen. Duck behind hay bales and crates, dodge hot ovens and giant carving knives, and reach the Presidential Pardon gate.

## How to play

- Press **Enter** to start or restart.
- Hold **Left / A** to slow down or **Right / D** to dash.
- Press **Up / W / Space** to jump.
- Hold **Down / S** to duck and hide behind cover.
- On a touchscreen, tap to start. Use the left, middle, and right thirds to slow down, jump, and dash. Swipe down or hold the bottom-right corner to duck.

To play offline in Chrome, serve the static files locally with `python3 -m http.server 8000 --bind 127.0.0.1 --directory game` and open `http://127.0.0.1:8000/`.

## Tech

The game uses plain JavaScript ES modules and Canvas 2D. All art is drawn in code, and Web Audio synthesizes the sound effects. The world is deterministic for a given seed. The game uses no libraries and runs offline.

## Layout

- `main.ts` copies the hand-in files and builds the competition dossier with Node 22.
- `game/` contains the HTML entry point and the game modules.
- `screenshots/` is the destination for the build pipeline's game captures.
- `vendor/` contains the make.fun dossier builder.
