# Chrome Dino Game 1.2.0 — standalone MGU Store package

The `build.js` now reads ONLY `apps/chrome_dino/package`. No Flappy Bird access at build or runtime. The included `vendor_once.js` completes missing OAP/RHMI boilerplate by copying it **once** from this repository's `apps/flappy_bird/package` and commits independent copies. This is a source bundle, not a prebuilt BMW-tested application.

## Installation

1. Extract this ZIP into the root of the existing `arudmin/mguapps` checkout, overwriting `mgu-repo.json` and `apps/chrome_dino`.
2. Push to GitHub. The included GitHub Actions workflow automatically vendors all missing OAP/RHMI files and commits them. For a manual build, run `node apps/chrome_dino/vendor_once.js` and run `git add -f apps/chrome_dino/package/javascript` then `git add apps/chrome_dino/package` and commit (the repository .gitignore excludes generated javascript by default).
3. Confirm the GitHub Actions run is green and the new `apps/chrome_dino/package/javascript/kit/mgu.js` file is present **on GitHub**.
4. Only then refresh MGU Store, uninstall old Chrome Dino (1.0/1.1), and install version 1.2.0.

Local verification after vendoring: `node apps/chrome_dino/build.js --preview-only` and `node apps/chrome_dino/build.js`.

If the workflow is not allowed to push (repo Settings > Actions > Workflow permissions), enable read/write workflow permissions or vendor locally and commit.

The OAP SDK still comes from MGU Store as before; it is not redistributed here. This package is independent from the Flappy Bird **app** after the one-time source vendoring step. Head-unit compatibility requires actual installation testing.
