# Chrome Dino for BMW MGU Store

Native RHMI/OAP game using the same MGU integration as `apps/flappy_bird`.

- **Central iDrive knob click**: start / jump / restart. The button-bar action is an alternative.
- **BACK**: go to the in-car app menu using the donor's RHMI navigation.
- **Safety**: requires a valid, fresh, **exactly 0 km/h** Vehicle2 speed sample, otherwise the game screen closes. No bypass is provided.
- Offline pixel art, increasing speed, cacti, birds, score and persistent high score.
- ID7 / ID8, existing `idrive7-renderd` and `mgu-inputgate` dependencies.

## Add to your existing repository

1. Copy `apps/chrome_dino` into the existing `mguapps/apps/` folder **without deleting `apps/flappy_bird`**.
2. Replace root `mgu-repo.json` with the file from this ZIP.
3. Commit and push to the GitHub repo; refresh source in mgu-store.

## Check with Node.js

```bash
node apps/chrome_dino/tests/test_game.js
node apps/chrome_dino/build.js --preview-only
node apps/chrome_dino/build.js
```

The final command writes `apps/chrome_dino/dist/chrome_dino@1.0.0.tgz`, a self-contained *source* OAP archive for the Store. The Store should supply its normal SDK integration at installation time. `build.js` requires the adjacent `apps/flappy_bird/package`, but the produced `.tgz` does not.

The game was tested statically, not on a physical BMW head unit. Test while the vehicle is stationary; do not use while driving.
