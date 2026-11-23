# FX Drive custom mgu-store repository

Собственный source repository для уже установленного BMW mgu-store. В репозитории оставлена инфраструктура mgu-store для будущих приложений и tools, а из приложений опубликован только `fx_drive`.

## Состав

```text
mgu-repo.json                 # каталог собственных компонентов
apps/fx_drive/                # FX Drive
native/                       # uplink, renderer, updater и системные модули
 deploy/                      # компоненты mgu-store/deploy
release/                      # release/catalog tooling
tools/                        # упаковка и тесты
```

SDK BMW/OAP и сгенерированный `javascript/` не входят в Git и берутся mgu-store с donor-пакета на HU.

## FX Drive

- ID7 и ID8;
- `mguInternet: true`;
- Frankfurter/ECB для валют;
- CoinGecko для BTC/ETH;
- обновление при запуске и каждые 15 минут;
- локальный кэш и offline fallback;
- без vehicle signals и без управления автомобилем.

Подробности: [FX_DRIVE.md](FX_DRIVE.md).

## Офлайн-проверка на компьютере

Без BMW SDK и без сети:

```powershell
.\tools\preview-fx-drive.ps1
```

или:

```bash
node tools/preview_fx_drive.js
```

Проверяются манифесты, JSON/RHMI-файлы, иконка, наличие модулей и синтаксис JavaScript. Это статический preview, а не сборка OAP: для реальной установки mgu-store дополнительно использует donor SDK на HU.

## Установка через Store

1. Опубликуйте этот каталог в GitHub.
2. В уже установленном mgu-store добавьте GitHub repository как source.
3. Выберите ветку или tag этого репозитория.
4. Установите `FX Drive` из списка Apps.
5. Выполните restart HU, если Store его запросит.

## Важные ограничения

Интернет проверяется на конкретном MGU. Наличие Wi‑Fi/LTE не гарантирует, что OAP-приложению разрешены DNS/TLS/HTTPS. При отсутствии uplink приложение использует cache/demo и не блокирует UI.

Инфраструктура лицензируется upstream mgu-store и сторонними компонентами. Не публикуйте donor SDK, ключи, дампы HU или сгенерированный OAP bundle.
