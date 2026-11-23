# FX Drive custom mgu-store source

Минимальный source repository для уже установленного BMW mgu-store. В нём оставлены только каталог компонентов, приложение FX Drive и offline-проверка.

## Состав

```text
mgu-repo.json                 # каталог компонентов для Store
apps/fx_drive/                # приложение и его source package
scripts/preview_fx_drive.js   # локальная проверка без SDK и сети
```

BMW/OAP SDK, generated `javascript/` и пакеты HU не входят в Git: mgu-store получает donor SDK на head unit при сборке source package.

## FX Drive

- ID7 и ID8;
- `mguInternet: true`;
- Frankfurter/ECB для валют;
- CoinGecko для BTC/ETH;
- обновление при запуске и каждые 15 минут;
- локальный кэш и offline fallback;
- без vehicle signals и без управления автомобилем.

Подробности: [FX_DRIVE.md](FX_DRIVE.md).

## Офлайн-проверка

Без BMW SDK и без сети:

```powershell
.\scripts\preview-fx-drive.ps1
```

или:

```bash
node scripts/preview_fx_drive.js
```

Проверяются манифесты, JSON/RHMI-файлы, иконка, source modules и синтаксис JavaScript. Это статический preview, а не сборка OAP.

## Добавление будущих приложений

Для каждого нового приложения:

1. создать `apps/<own_id>/` с `mgu-app.json`, `release.json`, `src/` и `package/`;
2. добавить компонент в `mgu-repo.json`:

```json
{
  "id": "fx_new_tool",
  "kind": "app",
  "path": "apps/fx_new_tool",
  "build": "unit"
}
```

После push Store увидит новый компонент при обновлении источника.

## Установка через Store

1. Опубликовать этот каталог в GitHub.
2. Добавить GitHub repository как source в установленном mgu-store.
3. Выбрать branch или tag.
4. Установить `FX Drive` из списка Apps.
5. Выполнить restart HU, если Store его запросит.

Не публикуйте donor SDK, ключи, дампы HU или сгенерированный OAP bundle.
