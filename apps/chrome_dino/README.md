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
