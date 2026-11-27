[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/piratedyan-02/makefun-flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/piratedyan-02/makefun-flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

# Coral Isles Sky Courier

Entry for the make.fun bounty **"Make the best flight game"**
($500, https://make.fun/bounty/best-flight-game-20261126-0057),
by @piratedyan-02.

Fly a courier plane over the Coral Isles: climb, bank and throttle
through 8 golden rings, dodge storm clouds and gull flocks, and
complete the 2400 m course to the home runway. 3 hits and you crash.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server. No network request,
no build step, keyboard and mouse only.

- **↑ / W** climb, **↓ / S** descend
- **← / A** slow down and bank left, **→ / D** speed up and bank right
- **Space / click** take off and restart, **P** pause

HUD shows altitude (ft), speed (kt), heading, distance, score,
rings 0–8 and lives. The artificial-horizon gauge bottom-left shows
your bank.

## Screenshots

Real renders of the game's own code (`?shot=start|play|end&seed=1`):

- `screenshots/1-start.jpg` — title screen, aircraft through a ring, RWY 09 ahead
- `screenshots/2-play.jpg` — mid-course, plane through a ring, storm ahead
- `screenshots/3-end.jpg` — crashed after 3 hits

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `/output` and writes `/output/dossier.json` with
`buildDossier` from `vendor/makefun-game.ts` (copied from the kit,
unchanged).

## Files

- `game/index.html`, `game/src/*.js` — the game (fixed 1/60 s step,
  seeded RNG, pooled hazards, Web Audio synth effects, no assets)
- `main.ts`, `serve.ts`, `vendor/makefun-game.ts`, `shots.json` —
  kit starter files (main.ts / vendor unchanged from the kit)
- `screenshots/` — 3 real renders, each under 256 KiB

Original game: own idea, art, sounds and names. No commercial game
was copied.
