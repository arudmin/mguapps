# Игры для BMW MGU Store: Flappy Bird и Chrome Dino

Два отдельных приложения для BMW MGU (iDrive 7/8).

| Игра | Папка | Описание |
| --- | --- | --- |
| **Flappy Bird** | `apps/flappy_bird/` | Аркада с птицей. |
| **Chrome Dino** | `apps/chrome_dino/` | Пиксельный динозавр, четыре сложности, личные рекорды и онлайн-рейтинг. [Документация](apps/chrome_dino/README.md). |

## Ветки и версии

| Ветка | Chrome Dino | Назначение |
| --- | --- | --- |
| [main](https://github.com/arudmin/mguapps/tree/main) | 1.5.29 | Основной канал |
| [top-chart](https://github.com/arudmin/mguapps/tree/top-chart) | 1.5.29 | Разработка и тестирование |

Сервер рейтинга: 0.2.10, API v1. Клиент пока подключён к staging, в котором есть 14 синтетических тестовых профилей Easy. Перед публичным релизом рейтинг необходимо очистить от этих записей и отдельно проверить production-конфигурацию. Результаты не верифицируются повторами.

## Как установить через MGU Store

1. Убедитесь, что MGU Store установлен, а автомобиль припаркован.
2. Добавьте репозиторий `arudmin/mguapps` (ветка main).
3. Обновите список приложений.
4. Выберите Flappy Bird или Chrome Dino и установите нужную игру отдельно.
5. Запустите игру через меню приложений BMW.

## Управление в игре

- Нажатие контроллера iDrive или сенсорного игрового поля — старт/прыжок.
- Настройки языка и сложности доступны через шестерёнку.
- Easy → Normal → Hard → Extreme.
- Кнопка рейтинга открывает мировую таблицу.
- **Играть только на стоянке.** Запуск ограничен проверкой скорости.

## Локальная проверка и сборка

```bash
node apps/chrome_dino/build.js --preview-only
node apps/chrome_dino/build.js
```

Пакет: `apps/chrome_dino/dist/chrome_dino@1.5.29.tgz`. MGU Store использует сборщик из mgu-repo.json.

GPU-отрисовка до 60 Гц, PNG fallback 8 Гц; физика 120 Гц. Проверка на физическом ID8 и новой версии на автомобиле остаётся необходимой. CI ветки top-chart успешен для игры и сервера, обновление тестовых записей подтверждено [Actions](https://github.com/arudmin/mguapps/actions/runs/45580962815).

[Документация сервера](apps/chrome_dino/leaderboard/README.md) · [API](apps/chrome_dino/leaderboard/API.md).

## История разработки

Краткое описание актуальной версии обновляется в этом README, подробная история всех версий — в [README игры](apps/chrome_dino/README.md). Каждая задача разработки фиксируется в журнале, включая исправления, тесты, ограничения и состояние проверки на BMW. Правила для разработчиков: [AGENTS.md](AGENTS.md).


**24.11.2026 — 1.5.6:** исправлены неподдерживаемые BMW GPU символы стрелок и маркера выбора; физика без изменений. Leaderboard остаётся отдельным серверным прототипом 0.1.0, не подключённым к игре. CI проверяется после push.


**1.5.7:** пауза BACK и продолжение/новый старт в Dashboard; старые элементы меню скрыты. Сервер без изменений.


**1.5.8 (top-chart):** подтверждение выхода и исправление повторного BACK. Сервер без изменений.


**1.5.9 (top-chart):** единственный экран Dashboard, удалены старые RHMI меню, подтверждение выхода через экранную кнопку и сдвиг контроллера. Физическая BACK принадлежит BMW. Сервер без изменений.


**1.5.10 (top-chart):** выход из паузы в начальный Dashboard вместо автоматического перезапуска. Сервер без изменений.


**1.5.11 (top-chart):** подсветка кнопки старта на Dashboard в зависимости от фокуса. Сервер без изменений.


**1.5.12 (top-chart):** четыре локальных рекорда, чистый Dashboard и настройки по шестерёнке. Сервер без изменений.


**1.5.13 (top-chart):** кнопка «Топ игроков», чтение реального рейтинга staging по четырём сложностям. Регистрация и отправка результатов пока не подключены. Сервер без изменений.


**1.5.14 (top-chart):** исправлен спрайт шестерёнки; сервер без изменений.


**1.5.15 (top-chart):** совместимый HTTPS вызов и диагностика соединения рейтинга; сервер без изменений.


**1.5.16 (top-chart):** выход в Dashboard после проигрыша, сохранение рекорда; сервер без изменений.


**1.5.17 (top-chart):** официальный доступ mguInternet, DNS активного uplink по архитектуре Store, выпадающие настройки. Сервер без изменений.


**1.5.18 (top-chart):** native touchscreen routing for Dashboard and immediate touch-down jump; server unchanged.


**1.5.19 / server 0.2.1 (top-chart):** opt-in durable offline synchronization of private personal bests, API v2 idempotent registration and sync. Public verified ranking unchanged; CI pending.


**Server 0.2.2 (top-chart):** provisional unverified public ranking of synced personal records in all four modes. Existing verified API unchanged. Deployment pending.


**1.5.20 (top-chart):** provisional public ranking without replay verification; corrected timer mock in CI; server 0.2.2.


**1.5.21 (top-chart):** simplified ranking header; replay verification remains documented development backlog. Server unchanged.


**1.5.22 / server 0.2.3:** API v3 batch sync and all boards, 60s cache, editable nickname, medal-style leaderboard, detailed localized Store descriptions. API documented in apps/chrome_dino/leaderboard/API.md. CI pending.


**1.5.23 / server 0.2.4:** current single API v1, concise localized descriptions, explicit scoped Store build inputs; CI pending. Previous 1.5.22/server 0.2.3 CI green.


**1.5.24:** four ranking tabs, compact colorful podium cards with cups and larger scores, no server change. CI pending.


**1.5.25 / server 0.2.5:** QWERTY keyboard, cursor, iDrive navigation, name length and original name reset, compatible Store hyphens. CI pending.


**1.5.26 / server 0.2.6:** one-time onboarding including existing players, color-coded difficulty tabs, refresh status, pencil icon, Store spacing, positive-only leaderboard records. CI pending.


**1.5.27 / server 0.2.7:** unique nicknames, reserved defaults, localized availability feedback. API v1. CI pending.


**1.5.28 / server 0.2.8:** offline nickname, conflict resolution, checked suggestions, disclosed minimal registration statistics. CI pending.


**1.5.29 / server 0.2.9:** removed additional registration statistics; offline names and regional suggestions retained. CI pending.


**25.11.2026 — перенос в main:** игра 1.5.29, сервер 0.2.10. При равном счёте выше более свежий принятый сервером рекорд; timestamp не показывается в UI. Обновлены staging fixtures. Новая модель аккаунтов, точные коллизии и новая кнопка рейтинга не реализованы.
