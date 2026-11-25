## 1.5.29 — 24.11.2026
Removed extra registration statistics, notice translations and queued analytics metadata. Offline names and regional suggestions retained. Server 0.2.9. Previous 1.5.28 CI passed 45397860958/45397860631. New CI pending.

## 1.5.28 — 24.11.2026
- Save a valid nickname offline, persist pending name across restart, resolve conflicts on reconnection. Up to five available suggestions in editor, selectable by touch or rotary, approximate IP geography for suffix only. Private registration statistics (region, date, game version, language) disclosed before opt-in; no raw VIN or IP and no unverified vehicle attributes. Local name retained when skipping onboarding registration. CI/hardware pending. Previous 1.5.27 CI passed 45392639484/45392639450.

## 1.5.27 — 24.11.2026
- Debounced online nickname availability in profile and onboarding editor, 12 localized statuses, saving requires available name. Server 0.2.7 enforces case-insensitive uniqueness, reserves originals. Rejected queued renames retain score snapshot and confirmed name. CI and hardware checks pending. Previous 1.5.26 CI green (45391589673/45391589663).

## 1.5.26 — 24.11.2026
- One-time four-step onboarding for new and existing installations, preserves account and records; optional profile name, explicit consent or offline play, local completion flag, 12 translations. Requires available VIN hash to enroll; offline play remains available. Difficulty colors, refresh-in-progress label, pencil icon, two Store description spacing lines. Server 0.2.6 positive-score-only migration. CI and BMW checks pending. Prior 1.5.25 game/server CI green (45390019209/45390019253); BMW photos show renamed profile and functional ranking.

## 1.5.25 — 24.11.2026
- BMW-style custom QWERTY keyboard with digits, Shift, caret, left/right caret movement, 16-character counter, delete, reset to immutable original nickname and save. Rotary selection and four-way deflection navigation; numeric mappings beyond left are assumptions pending BMW verification. Touch keys share geometry with renderer. Server 0.2.5 migration required. Store description replaces unsupported bullet glyph with ASCII hyphen and removes blank lines. CI pending. 1.5.24 CI passed 45388615719.

## 1.5.24 — 24.11.2026
- Four direct-access difficulty tabs via touch or rotary selection, no additional network reads on tab change; refresh retains batch API and cache. Ranking cards narrowed from 704 to 534 logical pixels, larger text, drawn gold/silver/bronze cups and TOP-1–TOP-3 labels, own row highlight. All ten ranks remain visible. Updated startup touch test. Server 0.2.4 unchanged. CI and BMW visual verification pending. Previous 1.5.23 CI and deployment green; user confirmed ~1.8 MB Store download and real ranking with 48 Normal points, sync queue empty.

## 1.5.23 — 24.11.2026
- Shortened Store descriptions (Russian 12 logical lines, other languages compact; actual wrapping depends on MGU width). Replaced API with one current v1, kept local data and migrated old record-only queued jobs. Server 0.2.4. Explicit nonempty build.shared names the app's own build script, allowing MGU Store contentSpec/partPaths to select app files rather than full repo. Store may still fall back to whole archive; installed updater behavior not tested. 64 MiB display originates from upstream maxBytes fallback when archive length absent. No upstream modification. CI pending; 1.5.22 game and server CI passed 45385581662/45385581707. Real BMW photo confirms earlier registration and easy score 143.

# Chrome Dino Game 1.5.13 — BMW MGU Store

Пиксельная аркада для BMW iDrive 7/8 (MGU), устанавливаемая через [MGU Store](https://github.com/robertnisipeanu/mgu-store). Рабочая ветка — top-chart; стабильная main — 1.4.13.

**Играть только на стоянке.** Требуется свежий валидный сигнал нулевой скорости автомобиля.

## Возможности и управление

- Dashboard — единственный интерактивный игровой экран. Слева игровое поле, справа счёт, личный рекорд, сложность, язык и FPS.
- До старта вращение контроллера выбирает PLAY, MODE или LANGUAGE, нажатие активирует выбранный элемент. После старта — прыжок. Сенсорное управление: игровые и правые боковые области.
- Четыре сложности, оригинальный пиксельный динозавр, анимация бега и прыжка, кактусы и птицы, отдельные рекорды.
- Auto (BMW) и 12 ручных языков: ru, en, de, es, fr, it, pt, nl, pl, uk, zh, ja.
- GPU до 60 Гц; программный PNG-режим 8 Гц. Счётчик отображает частоту подготовки кадров, а не измеренную частоту физического дисплея. Физика 120 шагов/с.
- При потере фокуса или недостоверной/ненулевой скорости игра блокируется; при переходе из разрешённого состояния забег сбрасывается.
- Проверка новой стабильной версии через app.json ветки main; отсутствие сети не препятствует игре. VIN не передаётся серверу проверки обновлений. Экспериментальный локальный диагностический VIN-запрос ещё присутствует в коде; не публикуйте снимки с VIN.

## Параметры сложности (1.5.5)

| Параметр | Easy | Normal | Hard | Extreme |
| --- | ---: | ---: | ---: | ---: |
| Начальная скорость, ед./с | 430 | 864 | 1080 | 1350 |
| Максимальная скорость, ед./с | 740 | 1824 | 2280 | 2850 |
| Ускорение, ед./с² | 6 | 60,8 | 76 | 95 |
| Гравитация, ед./с² | 2500 | 8500 | 8500 | 8500 |
| Начальная скорость прыжка (модуль), ед./с | 940 | 1665,08 | 1520 | 1520 |
| Расчётная высота прыжка, ед. | 176,7 | 163,1 | 135,9 | 135,9 |
| Базовый интервал препятствий, с | 1,12–2,25 | 0,5625–1,5 | 0,375–1,0 | 0,30–0,80 |
| Вероятность группы кактусов | 38% | 63,68% | 79,6% | 99,5% |
| Вероятность птицы после порога времени | 12% | 27,52% | 34,4% | 43% |
| Птицы разрешены после, с | 16 | 4,21875 | 3,375 | 2,7 |

Источник: `package/javascript/src/game.js`. Высота — теоретическая v²/(2g), фактическая зависит от дискретного шага. Интервал — базовая задержка; дополнительно учитывается ширина препятствия, а Easy допускает дополнительную случайную паузу. Вероятности не являются долей всех препятствий. Normal имеет на 20% большую расчётную высоту прыжка, чем Hard; базовые интервалы Normal в 1,5 раза больше Hard (на 20% больше предыдущего коэффициента 1,5625). Hard и Normal имеют последовательно на 20% меньшие скорости и ускорение, чем следующий уровень.

## Установка и сборка

Добавьте https://github.com/arudmin/mguapps/tree/top-chart в MGU Store, выберите Branch top-chart, обновите каталог и установите Chrome Dino. Совместимость ID7/ID8; зависимости idrive7-renderd 2.1.18 и mgu-inputgate 1.1.0 указаны в каталоге.

```bash
node apps/chrome_dino/build.js --preview-only
node apps/chrome_dino/build.js
```

Результат: `apps/chrome_dino/dist/chrome_dino@1.5.5.tgz`. Исходная оболочка и ресурсы уже включены в package; vendor_once.js и скачивание SDK не требуются. Store предоставляет SDK на головном устройстве при необходимости.

## Проверки и CI

```bash
for test in apps/chrome_dino/tests/test_*.js; do node "$test" || exit 1; done
```

GitHub Actions дополнительно выполняет проверку синтаксиса и ESLint no-undef, сохраняет архив, лог, список файлов, SHA-256 и SVG-превью. Smoke Test имитирует запуск ID7/ID8, обработку касаний/контроллера и блокировку по скорости. Store test дважды собирает архив с аргументами каталога и MGU_OUT и сравнивает байты.

Код 1.5.5: [успешный CI №50](https://github.com/arudmin/mguapps/actions/runs/45344295643). Тесты не заменяют проверку установки, графики, управления и FPS на физическом BMW.

## История версий

### 1.5.5 — 24.11.2026

**Leaderboard server 0.1.0 (24.11.2026, staging):** добавлен серверный HMAC поверх локального SHA-256 VIN, никнейм user_ + 8 символов HMAC, отдельный токен авторизации, четыре режима, сессии и одноразовая отправка результата. Результаты остаются pending до реализации проверки повторов. Добавлены SQL/API-тесты и автоматическое развёртывание Cloudflare Workers/D1 через GitHub Secrets. Интерфейс BMW не интегрирован, версия игры 1.5.5 не изменена. Статус развёртывания подтверждается отдельным CI. [Документация сервера](leaderboard/README.md).

- Исправлено обращение к необъявленной переменной visualTheme, вызывавшее риск ошибки при запуске.
- Убраны устаревшие обработчики MAIN и переключатель Classic; нативные RHMI-ресурсы сохранены для совместимости и диагностики.
- Сенсорный ввод учитывает фокус и разрешение игры; FPS сбрасывается при изменении состояния безопасности. Номер версии в Dashboard читается из app-spec.
- Добавлены тесты запуска, визуальной геометрии (8 SVG для четырёх сложностей и двух размеров), воспроизводимости архива и контракта Store. CI обновлён до Actions v5, добавлен ESLint no-undef и контроль SHA-256.
- Физика четырёх режимов не изменялась. [Исправления](https://github.com/arudmin/mguapps/commit/76e00ad8714565d7819939aae4d5381ac9c2e8d5), [CI](https://github.com/arudmin/mguapps/commit/c31ec4991c4439283a25ab10474d8bbb00457ecc).
- Документация: восстановлена структура общего README из main; добавлены история версий и правила ведения журнала. Изменения документации не повышают версию игры.

### 1.5.4 — 23.11.2026

- Один Dashboard, четыре режима, язык и FPS справа; управление контроллером и касанием.
- Прежний Normal переименован в Easy; Normal и Hard имеют последовательно уменьшенные на 20% скорости и ускорение относительно следующего уровня. Normal получил увеличенную высоту прыжка и интервалы относительно предыдущего согласованного варианта.
- Перенос прежних рекордов Normal → Easy; Hard/Extreme сохранены. Оригинальный силуэт T-Rex и строгий контроль скорости сохранены.
- [Коммит](https://github.com/arudmin/mguapps/commit/91fd9dee98367089d0d61e87f17dbdd61352d8ce).

### 1.5.0–1.5.3

Отдельные опубликованные состояния с такими версиями в просмотренной истории коммитов не подтверждены; не приписываем им изменения.

### 1.4.14 — 23.11.2026

- Новый Dashboard и первоначальный переключатель Classic, GPU до 60 Гц.
- Исправлено квантование интервала GPU и фиксированный шаг физики при PNG 8 FPS.
- Добавлен экспериментальный [сервер и клиент онлайн-рейтинга](leaderboard/README.md). Не подключён к живой игре; проверка повторов и согласие на отправку данных ещё необходимы. Хеш идентификатора — псевдоним, не анонимность и не средство аутентификации.
- Коммиты: 9d4194ac, 418dc59d, ac14a2d9, 940ddd3b.

### 1.4.13
VIN status is shown inline beside the app version on ID7/ID8. The optional online version check fetches public app.json over HTTPS and displays an update notice in the menu and game if a newer version exists; no VIN is transmitted. Descriptions have explicit line breaks, subject to MGU Store UI support. Offline play remains available.

### VIN probe (1.4.12, experimental)
One read-only UDS 22 F190 request over InternalTasu at startup, parsing 62 F1 90 + 17 ASCII VIN characters from an ECU. The bottom menu line displays the full VIN when available or an explicit diagnostic status. VIN is never logged, sent to a server, or saved. On unsupported vehicles, the game continues normally. **VIN is not a cryptographic identity or proof of ownership; do not use it as the sole authentication mechanism for a leaderboard.** Do not publish screenshots with an exposed VIN.

### 1.4.11 — исправление русского языка в ID7 drop-down меню
- BMW HMI правильно сообщает RUSSISCH (ru); проблему 1.4.10 вызывали жестко прописанные английские ячейки native dropDownMenu.
- Для HeaderText и ItemText ID7 используется нативный тип StringId. BMW HMI берет текст из файла языка головного устройства (ru_RU.json и т. д.) вместо ненадёжной записи Unicode в рантайме.
- Сохранены чтение языка от HMIContext, экран диагностики BMW HMI, все режимы и управление игрой.
- При ручной смене языка в меню приложение переводит свои обычные строки; нативные выпадающие списки ID7 следуют языку головного устройства. Это сделано сознательно ради стабильности.
- CI проверяет наличие 9 ресурсов во всех 33 локалях, виджет ID7 dropDownMenu и разметку ID8.

### 1.4.10 — выбор сложности и языка
- **ID7:** настоящие выпадающие списки BMW `LT_DropDownMenu_1Row_2Col3070` с подписью и выделенным текущим вариантом.
- **ID8:** отдельные экраны выбора из 4 сложностей или 3 языковых режимов: в наборе стандартных виджетов ID8 выпадающих списков нет.
- Сохранены рекорды, управление, условия безопасности и определение языка через HMIContext.

### Автоматический язык BMW (1.4.9)
Используется реальный SOME/IP HMIContext/HMI_CID currentDisplayLanguage (например, BMW RUSSISCH); значения выводятся отдельной строкой BMW HMI в меню. Если сигнал недоступен, строка показывает статус, а язык можно переключить вручную. Карточка MGU Store поддерживает тексты `texts` для ru/de/fr/es/it/uk/pl/pt/nl; RHMI заголовки переведены в соответствующих файлах.

### 1.4.9 — BMW language and localization
- BMW HMIContext.currentDisplayLanguage is registered as a SOME/IP proxy (like robertn_waze_cluster).
- Detects exact BMW language enums, including RUSSISCH, ENGLISCH__UK, DEUTSCH.
- Menu displays raw BMW language value and the resolved active UI language.
- RHMI app title uses per-locale StringIds. Store card uses catalog `texts` with translated names/descriptions.
- Game screen text and menu localized; English fallback for unsupported languages.

### 1.4.8 — 23.11.2026

- Стеклянная иконка с прозрачным полем; отдельные строки меню для игры, сложности, языка, версии, рекорда, помощи.
- Auto BMW, русский и английский; двухкадровая анимация ног, поза прыжка, переменные интервалы препятствий и более быстрые Hard/Extreme.
- Русское описание в Store, дополнительные тесты и логи CI; позднее исправлена зависимость CI от конкретной версии.
- Коммиты e4f7714d, 72fb945f, 11b1ebcf, 3ff90cab.

### 1.4.7 — 23.11.2026

- Версия в меню и диагностический CI (04844d7d).

### 1.4.6 — 23.11.2026

- Восстановлены код и HMI-ресурсы 1.4.2; повышен номер для обновления через Store (b2a4826e, a133a804).

### 1.4.5 — 23.11.2026

- По историческому README: оригинальные пропорции динозавра, большие/малые и групповые кактусы с отдельными хитбоксами, повторный забег без Restart; корректировки иконки, локализации, интервалов и HMIContext для совместимости.
- Коммит c35a7653. Эти изменения описывают историческое состояние, а не текущий интерфейс.

### 1.4.4 — 23.11.2026

- Выбор языка и попытка определения языка головного устройства (c325fcef).

### 1.4.2 — 23.11.2026

- Исправления игры; состояние использовано при откате 1.4.6 (c63f8375).

### 1.4.0 — 23.11.2026

- Исправления игры (dcd8d6d9); подробности не подтверждены названием коммита.

### 1.3.0 — 23.11.2026

- Исправление самостоятельной сборки; версия зафиксирована в app.json коммита 5b300c57.

### 1.2.0 — 23.11.2026

- Серия исправлений игры и самостоятельной сборки (d9cd8c72, d3610782, b3101ca5, 6bbe3c10).

### 1.1.0 — 23.11.2026

- Ранняя версия автономного раннера с контроллером iDrive и строгим сигналом нулевой скорости (f64037a8).

### 1.0.0 — 23.11.2026

- Первое добавление Chrome Dino (c21efe6c).

История ранних версий восстановлена по доступным коммитам, app.json и прежним README; неподтверждённые подробности не добавлены. Полная техническая история: [Git commits](https://github.com/arudmin/mguapps/commits/top-chart/apps/chrome_dino/).

## Ведение журнала

При каждой задаче обновлять этот раздел (новая запись вверху истории или дополнение текущей версии для документации/CI), а при изменении возможностей — также общий [README](../../README.md). Записывать дату, версию, изменения, исправления, тесты, ограничения, состояние проверки на BMW. Не удалять прежние записи и не выдавать экспериментальные функции за готовые. См. [AGENTS.md](../../AGENTS.md).


### 1.5.6 — 24.11.2026
- По фото реального BMW ID7: стрелки выбора языка/сложности и маркер фокуса отображались как вопросительные знаки. Стрелки заменены ASCII, маркер рисуется прямоугольником, fallback FPS — ASCII. Физика и управление не изменены.
- Сервер 0.1.0 не изменён; онлайн-рейтинг не интегрирован.
- CI проверяется после push; повторная проверка на BMW необходима.


### 1.5.7 — 24.11.2026
- BACK возвращает на Dashboard с паузой, продолжением и новым стартом. Скрыты элементы старого MAIN; технический RHMI parent сохранён для маршрутизации. Продолжение сохраняет физическое состояние, новый старт сохраняет рекорд. При движении или устаревшем сигнале забег сбрасывается. 12 переводов. Добавлена имитация BACK в тесте startup ID7/ID8. Реальное поведение аппаратной кнопки требует проверки BMW. Сервер 0.1.0 не изменён.

- 1.5.7 CI follow-up: removed stale hardcoded 1.5.5 version assertions; tests now compare package manifests. No runtime or server changes. CI rerun pending.


### 1.5.8 — 24.11.2026
- BACK на начальном экране или паузе открывает подтверждение выхода, по умолчанию Отмена. Повторный BACK закрывает диалог. Выход закрывает GAME и MAIN без повторного открытия. 12 переводов.
- Исправлена асинхронная блокировка повторного перехода Dashboard, тест startup моделирует события видимости. CI ещё не подтверждён; аппаратный BACK требует проверки ID7/ID8. Сервер 0.1.0 без изменений.

- 1.5.8 CI follow-up: run 45368720219 reached exit regression test; assertion observed MAIN before asynchronous second close completed. Test now waits for the event loop and asserts both close calls in order. Startup timer cannot reopen after exit. No physics or server change. CI pending.


### 1.5.9 — 24.11.2026
- Removed legacy MAIN, selector and unused settings RHMI states from ID7/ID8 XML and JSON; GAME is sole entry in both manifests. ID8 detection marker moved into GAME. Removed legacy runtime handlers and automatic reopen timer. Hidden preferences retained. Back via Dashboard footer or left controller deflection opens pause/exit dialog. Native physical BACK remains HMI-owned and may bypass confirmation; actual hardware test required. Server 0.1.0 unchanged. CI pending.


### 1.5.10 — 24.11.2026
- BMW photo confirms 1.5.9 Dashboard pause overlay. Replaced Start over with Back to menu in all 12 locales. Ends the current run, saves best, returns to ready Dashboard without starting a run. No legacy RHMI menu or physics change. Added startup regression assertion. Server unchanged; CI pending.


### 1.5.11 — 24.11.2026
- Explicit Start game / Try again button on Dashboard; blue focus only when play is selected and vehicle is parked. Difficulty/language focus removes the highlight. 12 locales. Gameplay and input unchanged. CI pending; hardware validation required. Server unchanged.


### 1.5.12 — 24.11.2026
- Removed decorative header and bottom racing stripes. Right panel shows four persisted local personal bests, current mode highlighted. Gear opens a Dashboard settings overlay for difficulty/language, Done and back close it. Settings locked during active runs; strict zero speed remains. 12 locales. Updated startup and visual tests. Online leaderboard still separate; server unchanged. CI pending.


### 1.5.13 — 24.11.2026
- Added Top Players button under the four local records, controller focus and touch. Opens read-only live staging leaderboard, four difficulty filters, refresh and close, loading/offline/empty states. Only verified server entries displayed. No VIN transmission, registration or score submission in this version. Offline gameplay unaffected. Startup test mocks the API and checks navigation; CI and real MGU network validation pending. Server 0.1.0 unchanged.


### 1.5.14 — 24.11.2026
- Fixed malformed settings icon reported on real BMW ID7 (1.5.13 photo). Replaced overlapping rounded rectangles with a fixed symmetric 21×21 eight-tooth pixel mask, transparent center, horizontal rectangle runs, centered in existing button. Focus, controls, gameplay and leaderboard unchanged. Added symmetry regression assertions; CI and hardware verification pending. Server unchanged.


### 1.5.15 — 24.11.2026
- BMW reported leaderboard connection failure. Legacy Node HTTPS client now uses explicit request options rather than URL + options overload, explicit SNI, 10s socket timeout, diagnostic error code on screen and log. TLS validation remains enabled. Server connectivity from BMW not yet verified; CI pending. Server unchanged.


### 1.5.16 — 24.11.2026
- Game-over overlay has Retry and Back to menu, with default Retry focus, rotary and touch navigation. Menu saves best and resets current run to ready without restarting or leaving the app. Uses existing translations in 12 languages. Added startup regression covering both actions and best persistence. Physics, server, and physical BACK unchanged. CI pending.


### 1.5.17 — 24.11.2026
- BMW reported ENOTFOUND. Implemented Store-style active lease DNS resolution using dns.Resolver and resolve4; package.json mguInternet=true grants official app uplink access. Leaderboard and update check use active lease DNS, HTTPS validation remains enabled. No fixed IP or global DNS changes. Source reference: https://github.com/robertnisipeanu/mgu-store/blob/main/native/mgu-updater/js/fetch.js and native/mgu-uplink/README.md. Actual MGU network still requires test.
- Dashboard settings use expandable difficulty/language lists, rotary selection, touch scrolling, confirm and left/back cancellation. Updated startup and transport tests. Server unchanged; CI pending.


### 1.5.18 — 24.11.2026
- Enabled native renderer touch claims for the chrome-free GAME canvas, separate from kit-owned navigation so rotary input remains app-controlled. Raw down events converted from renderer logical coordinates to the dashboard's 1600×520 hitboxes; one action per down, immediate jump in playfield and direct menu controls. No physical BACK changes. Zero-speed gate retained. Requires renderer native touch capability; actual car touch and coordinates not yet verified. CI pending. Server unchanged.


### 1.5.19 — 24.11.2026
- Added opt-in personal score sync from Top Players, local SHA-256 VIN and random persisted credential; raw VIN never sent. Durable atomic outbox with one in-flight operation, snapshot coalescing, retry 5/10/20/40/60 s, stable operation ID, ACK-only removal, all four existing bests and subsequent bests. Local records remain playable offline. Permanent errors displayed, no silent deletion. Server 0.2.1 API v2 required. Sync currently private unverified best snapshots, not individual game replays or ranked submissions; nickname editing/recovery/deletion outstanding. Consent translations Russian/English, fallback English. CI and actual BMW upload pending. DNS successful on real BMW per user photo 1.5.17.


### 1.5.20 — 24.11.2026
- Owner requested provisional ranking without replay verification. Use v2 public leaderboard, display unverified label and explicitly consent to public nickname and scores. All four modes. Fix startup test timer mock (100 ms safety vs 1000 ms outbox); 1.5.19 CI 45383074306 failed stale-speed assertion because mock overwrote safety timer, while outbox test passed. 1.5.20 CI and BMW test pending. Server 0.2.2 required. Replay verification deferred; account recovery/deletion outstanding.


### 1.5.21 — 24.11.2026
- Removed user-facing anti-cheat / unverified caption from the leaderboard in all 12 languages at owner's request. Public ranking still accepts unverified personal bests; replay verification and anti-cheat remain development backlog, not implemented. Consent to public nickname and scores remains unchanged. Server version unchanged. CI and BMW verification pending.


### 1.5.22 — 24.11.2026
- API v3 batch ranking and profile updates, persistent 60-second cache, 5-second minimum refresh interval, stale results retained offline, one request across modes. Editor for 3–16 Latin letters/digits/_/- via touch and rotary, queued together with four records. Medal-colored top three, row cards and self highlight, own rank below top ten. Existing outbox jobs retain v2 protocol for safe retries. Server 0.2.3. CI and BMW testing pending. Anti-cheat remains development backlog.

## 25.11.2026 — 1.5.30 / server 0.2.11
Shared dashboard sprite geometry and swept collision checks, brighter top ranking button above personal records, extended localized descriptions. New opt-in installations use a durable random installation UUID; existing accounts and queues remain. Server migration 0008 groups by vehicle HMAC, one best record per vehicle per mode. Legacy registration remains compatible. Nonrepresentative accounts have no public rank in that mode. API v1 optional installation_id. Tests and hardware validation pending.

## 25.11.2026 — 1.5.31 / server 0.2.12
- Diagnostic read only after explicit opt-in, never at startup, no repeated read for enrolled accounts. No raw VIN transmitted or logged. Derived identifier remains necessary for vehicle grouping.
- Removed unused sensitive UserAccount, PrivacySettings, Provisioning, units and environmental interfaces and DeviceLink/Provisioning ACLs; retain platform lifecycle and RHMI/OAP infrastructure. Actual SDK startup on physical ID7/8 must be checked.
- DELETE /v1/account with bearer token; atomic deletion of account and dependent records; retries with the same token are idempotent. Client stops score sync immediately, retains only deletion credential until confirmation, clears profile/cache and preserves local bests. Separate accounts on same vehicle unaffected. Offline deletion requires the app to run again with connectivity; uninstall before confirmation can lose the retry credential. D1 recovery/backups and infrastructure logs are subject to provider retention, not directly erased by this endpoint.
- Regional suffix only after confirmed nickname conflict; no storage of IP/region. Pre-consent onboarding nickname editing stays local. Cloudflare receives IP as part of normal HTTP transport.
- Tests and physical verification pending.


## 25.11.2026 — 1.5.32 / server 0.2.12
- Uniform leaderboard row height and typography; podium colors and cups retained. Score and header use the existing difficulty accent palette.
- Hard bird flight height reduced by 15%; all other mode parameters unchanged. This is a geometric adjustment, not a measured 15% difficulty reduction. Existing shared sprite collision handling retained.
- Parking safety gate, local records, consent and score sync unchanged. CI and physical MGU verification pending.


## 25.11.2026 — 1.5.33 / server 0.2.12
- Fix release tree regression in 1.5.32: restore complete 1.5.31 base, including shared sprites, security hardening, account deletion and vehicle-group migration; retain the 1.5.32 UI and Hard bird changes. No server redeployment or DB changes required. CI and MGU installation verification pending.


## 25.11.2026 — 1.5.34 / server 0.2.12
- Restore the known-working 1.5.29 SDK manifest and access table as a compatibility diagnostic after physical ID7 launch failure in 1.5.33. This restores broader permissions; root cause is not yet confirmed. No new application data reads or network collection; consent-only diagnostic probe and account deletion retained.
- Add BOOT 01–05 local SDK startup milestones; existing fatal/loop logging retained. If the platform never launches JavaScript, these markers cannot appear. CI and real MGU startup verification pending.
