# FX Drive

Currency and crypto reference dashboard for BMW iDrive 7/8.

## Runtime behavior

- Uses the mgu-store internet uplink (`mguInternet: true`).
- Fetches ECB reference rates from `https://api.frankfurter.dev` at startup and every 15 minutes.
- Stores the last valid response in the app data directory.
- Shows cached or demo values if the uplink is unavailable.
- Does not use vehicle signals and does not control the car.

## Source package

This app uses mgu-store's `mgu-app.json` source-package format. The head unit links the declared `oap-sdk` modules from a donor package; no BMW SDK is included in this repository.

The RHMI files are shared with the mgu-store sample layout and expose a compact ID7/ID8 widget screen. Future iterations should replace the sample labels/components with dedicated FX-specific RHMI states.
