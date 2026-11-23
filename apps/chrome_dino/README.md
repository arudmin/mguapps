# Chrome Dino Game — BMW MGU Store (v1.1.0)

Chrome Dino gameplay has its own JavaScript app, game, renderer and input handlers,
metadata, RHMI application override, transparent icon and build tool.
The build process copies ONLY BMW/OAP transport and RHMI platform files from
`apps/flappy_bird/package`, then overwrites all game/application-specific files
from this folder. At runtime, a separate `chrome_dino@1.1.0.tgz` is installed;
Chrome Dino does not import or launch the installed Flappy Bird.

## Deploy
1. Extract this archive over the ROOT of your existing mguapps repository.
2. Keep `apps/flappy_bird/package` in the repository: build-time donor only.
3. Commit the new folder and root `mgu-repo.json`, then refresh your Store source.
4. Uninstall old Chrome Dino first; reinstall version 1.1.0 (restart HU if necessary).

## Local checks (where Node.js is available)
`node apps/chrome_dino/tests/test_game.js`
`node apps/chrome_dino/build.js --preview-only`

Build requires the donor at `apps/flappy_bird/package`, unavailable in this
standalone ZIP. The build produces its own TGZ with all bundled runtime files.

## Controls and safety
Press central iDrive knob to start, jump, retry. BACK returns to menu.
Game is only enabled on a fresh valid ZERO vehicle-speed signal.
No internet needed for gameplay. No real-HU installation test has been performed.
