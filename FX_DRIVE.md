# FX Drive deployment

This fork keeps the mgu-store infrastructure and publishes only the custom `fx_drive` app. The Store is assumed to be installed on the target head unit.

## Офлайн-проверка на компьютере

BMW SDK и интернет для статической проверки не нужны:

```bash
node scripts/preview_fx_drive.js
```

Проверяются manifest, package metadata, RHMI ID7/ID8, иконка, наличие source modules и синтаксис JavaScript. Это не заменяет установку на физический HU.

## Publish

1. Push this repository to a GitHub repository you own.
2. Keep `mgu-repo.json` at the repository root and publish a branch or tag.
3. In the installed Store, add the GitHub repository as a source and select the branch/tag.
4. Install `FX Drive` from the Apps list.
5. Restart the head unit when the Store requests it.

The repository does not contain BMW's `oap-sdk`; the mgu-store source builder obtains the SDK from a donor package on the head unit. Do not commit donor packages, generated `javascript/`, tokens or HU dumps.

## Network behavior

The package declares `mguInternet: true`. At startup and every 15 minutes it requests:

- `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,RUB,GBP`
- `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`

The app shows `LIVE REFERENCE` on success, stores the response in its data directory, and falls back to `CACHED / OFFLINE` or `DEMO / OFFLINE` without blocking the UI.

Validate the real MGU uplink from the Store's network settings before relying on automatic updates. The project has not been tested on a physical HU in this workspace.
