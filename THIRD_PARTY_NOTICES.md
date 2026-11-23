# Third-party notices

mgu-store is licensed under GPL-3.0-or-later (`LICENSE`). These parts come from others and keep
their own licences. The Store and mgu-uplink packages carry these texts in
their `LICENSES.txt`; mgu-render ships `LICENSE.mgu-renderd`; mgu-python ships
the `LICENSES.txt` its build writes.

| Part | Where | Licence | Text |
|---|---|---|---|
| idrive7-apps renderer daemon and app kit (cauliflowermossgrape) | `native/mgu-render` and the FX Drive RHMI/runtime dependencies | MIT | `native/mgu-render/LICENSE.mgu-renderd` |
| IterioDev's mgu-renderd (protocol v3, touch, pictures; mgu-renderd 1.2.0 protocol v4, video) | `native/mgu-render` | MIT | `native/mgu-render/LICENSE.mgu-renderd` |
| Reference copies of both renderers, for protocol tests | `native/mgu-render/test/reference` | MIT | `LICENSE` in each folder |
| Freedoom 0.13 frames and Ubuntu font atlases in recorded test sessions | `native/mgu-render/test/sessions` | Freedoom BSD-3-Clause; Ubuntu Font Licence 1.0 | [Freedoom](https://github.com/freedoom/freedoom/blob/master/COPYING.adoc), [Ubuntu Font Licence](https://ubuntu.com/legal/font-licence) |
| Wayland ivi-application / ivi-controller protocols (DENSO, BMW Car IT) | `native/mgu-render/protocol` | MIT | in each XML file |
| Inter font (The Inter Project Authors) | `apps/fx_drive/package/fonts` | SIL Open Font License 1.1 | `apps/fx_drive/package/LICENSES.txt` |
| Noto Sans SC, TC, JP and KR fonts (Adobe) | `apps/fx_drive/package/fonts/chinese.json`, `chinese-tc.json`, `japanese.json`, `korean.json` | SIL Open Font License 1.1 | `apps/fx_drive/package/LICENSES.txt` |
| netlink, netns (vishvananda) | `native/mgu-uplink` (Go modules) | Apache-2.0 | `native/mgu-uplink/LICENSES.txt` |
| golang.org/x/sys, Go runtime and standard library (The Go Authors) | `native/mgu-uplink` (built into the binary) | BSD-3-Clause | `native/mgu-uplink/LICENSES.txt` |
| wpa_supplicant 2.10 (Jouni Malinen and contributors), with our patch `native/mgu-uplink/wpa/wpa-mgu-sme-connect.patch` under the same licence | `native/mgu-uplink` (downloaded and built at build time) | BSD-3-Clause | `native/mgu-uplink/LICENSES.txt` |
| CPython and the libraries built into it, certifi (python-build-standalone) | `native/mgu-python` (downloaded at build time) | PSF and others; certifi MPL-2.0 | `LICENSES.txt` in the built tool |

The oap-sdk the head unit uses is BMW's and is not part of this repository:
apps are linked against the copy already on the head unit.
