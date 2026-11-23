# Chrome Dino Game v1.3.0 for BMW MGU Store

Self-contained source tree derived from the working Flappy Bird OAP shell, with separate identifiers, RHMI files, app entry, physics and artwork.

No vendor_once, GitHub Actions, internet, or installed Flappy Bird required to BUILD. BMW head unit still supplies platform services.

From repository root:
```
node apps/chrome_dino/build.js --preview-only
node apps/chrome_dino/build.js
```
Only while parked with fresh 0 km/h signal. Push iDrive knob to start/jump; BACK for menu.

Do not include dist/ in the GitHub repository.
