# Chrome Dino 1.5.4 — Dashboard Test (top-chart)

Experimental BMW ID7/ID8 interface drawing with the existing MGU GPU recorder; not a port or copy of third-party game artwork.

- Dashboard: dark two-column design inspired by motorsport dashboards, original pixel T-Rex and obstacles, independent Score/Best/Mode panel.
- Native MAIN menu style button switches between **Dashboard** (default) and **Classic**; the choice persists locally.
- Works on MGU GPU at up to 60 Hz. Software PNG fallback is throttled to 8 Hz to avoid CPU spikes.
- Game physics stays at 120 Hz, with a **fixed 1920×720 collision world** for both visual themes. The previous single best is migrated to the last selected difficulty as a best-effort compatibility step. New bests are separate for Normal, Hard, Extreme.
- Score panel explicitly marks the online leaderboard as **NOT CONNECTED**. The Cloudflare leaderboard module remains a separate prototype and sends no data from this build.
- Vehicle movement gate remains strict at zero speed with fresh data.
- This version is for parked testing only. Do not use the application while driving.

## Install test build
1. Open the **Chrome Dino CI** run for branch top-chart in GitHub Actions.
2. Download artifact **chrome-dino-test-package** (ZIP containing chrome_dino@1.5.4.tgz).
3. Install its tgz via your existing MGU Store/USB/SSH workflow.
4. Verify dashboard draw, theme switching, jump/controller, speed gate, 60 Hz renderer and software fallback.
5. Use the in-app style button in MAIN to compare Dashboard and Classic without reinstalling.

### Notes
The dashboard score panel intentionally does not show fabricated online ranks. A working online client will only be connected after HTTPS checks, opt-in consent and server score verification. The game still has a VIN diagnostic probe inherited from 1.4.13; this UI redesign does not change that diagnostic.

Files: src/dashboard.js, src/i18n.js, app.js, RHMI native menu layouts, app.json + package metadata.

## 1.5.4 single-screen testing
- Open Chrome Dino from Store: it should enter Dashboard directly, including when speed data is unavailable (play remains disabled).
- Stationary: use rotary steps to select PLAY, MODE or LANGUAGE on right. Press to start/change; test touchscreen hotspots and controller jump.
- Verify actual FPS counter approaches 60 only with active MGU renderd; fallback may be slower.
- Four independent best scores and old-data migration; press BACK exits through BMW navigation.
