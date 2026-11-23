# Chrome Dino Game 1.4.8 — BMW MGU Store

### Изменения
- Стеклянная иконка динозавра с прозрачным внешним полем, как в ранней версии 1.4.5.
- Раздельные строки: Играть, Сложность, Язык, Версия, Рекорд и Помощь.
- Языки: Auto (BMW, если доступен сигнал), Русский, English. Если автоопределение недоступно, переключите язык вручную.
- Настоящая двухкадровая анимация бега и отдельная поза прыжка.
- Hard и Extreme стартуют быстрее, расстояния между кактусами не одинаковые, сохраняется безопасный интервал между прыжками.
- В MGU Store обновлено описание на русском языке.

### Управление
Нажатие контроллера — запуск/прыжок. BACK — назад в меню.
Игра работает только при подтверждённой нулевой скорости (на стоянке).

### Проверка
```bash
node apps/chrome_dino/tests/test_game.js
node apps/chrome_dino/tests/test_package.js
node apps/chrome_dino/tests/test_version.js
node apps/chrome_dino/tests/test_148.js
node apps/chrome_dino/build.js --preview-only
node apps/chrome_dino/build.js
```

Все зависимости для MGU App Kit и ресурсы ID7/ID8 уже находятся в папке package. Не требуется vendor_once.js.


## 1.4.9 — BMW language and localization
- BMW HMIContext.currentDisplayLanguage is registered as a SOME/IP proxy (like robertn_waze_cluster).
- Detects exact BMW language enums, including RUSSISCH, ENGLISCH__UK, DEUTSCH.
- Menu displays raw BMW language value and the resolved active UI language.
- RHMI app title uses per-locale StringIds. Store card uses catalog `texts` with translated names/descriptions.
- Game screen text and menu localized; English fallback for unsupported languages.

## Автоматический язык BMW (1.4.9)
Используется реальный SOME/IP HMIContext/HMI_CID currentDisplayLanguage (например, BMW RUSSISCH); значения выводятся отдельной строкой BMW HMI в меню. Если сигнал недоступен, строка показывает статус, а язык можно переключить вручную. Карточка MGU Store поддерживает тексты `texts` для ru/de/fr/es/it/uk/pl/pt/nl; RHMI заголовки переведены в соответствующих файлах.

## 1.4.10 — выбор сложности и языка
- **ID7:** настоящие выпадающие списки BMW `LT_DropDownMenu_1Row_2Col3070` с подписью и выделенным текущим вариантом.
- **ID8:** отдельные экраны выбора из 4 сложностей или 3 языковых режимов: в наборе стандартных виджетов ID8 выпадающих списков нет.
- Сохранены рекорды, управление, условия безопасности и определение языка через HMIContext.

## 1.4.11 — исправление русского языка в ID7 drop-down меню
- BMW HMI правильно сообщает RUSSISCH (ru); проблему 1.4.10 вызывали жестко прописанные английские ячейки native dropDownMenu.
- Для HeaderText и ItemText ID7 используется нативный тип StringId. BMW HMI берет текст из файла языка головного устройства (ru_RU.json и т. д.) вместо ненадёжной записи Unicode в рантайме.
- Сохранены чтение языка от HMIContext, экран диагностики BMW HMI, все режимы и управление игрой.
- При ручной смене языка в меню приложение переводит свои обычные строки; нативные выпадающие списки ID7 следуют языку головного устройства. Это сделано сознательно ради стабильности.
- CI проверяет наличие 9 ресурсов во всех 33 локалях, виджет ID7 dropDownMenu и разметку ID8.

## VIN probe (1.4.12, experimental)
One read-only UDS 22 F190 request over InternalTasu at startup, parsing 62 F1 90 + 17 ASCII VIN characters from an ECU. The bottom menu line displays the full VIN when available or an explicit diagnostic status. VIN is never logged, sent to a server, or saved. On unsupported vehicles, the game continues normally. **VIN is not a cryptographic identity or proof of ownership; do not use it as the sole authentication mechanism for a leaderboard.** Do not publish screenshots with an exposed VIN.

## 1.4.13
VIN status is shown inline beside the app version on ID7/ID8. The optional online version check fetches public app.json over HTTPS and displays an update notice in the menu and game if a newer version exists; no VIN is transmitted. Descriptions have explicit line breaks, subject to MGU Store UI support. Offline play remains available.

## 1.5.4 (top-chart) — single Dashboard UI
- No legacy menu for user interaction: the GAME dashboard opens automatically. Right sidebar holds four difficulty modes, a 13-choice language selector (Auto BMW plus 12 locales), current score, personal best and measured FPS.
- BMW controller rotation changes highlighted control before play; press activates it. Touch the right rows to change mode or language. Touch the playfield or press with PLAY highlighted to start, then press to jump.
- **Easy** retains 1.4.14 Normal physics. **Normal** has a 20% higher jump and 20% longer gaps compared with the prior approved simulator. Hard is 20% below Extreme. Extreme keeps 0.30–0.80 s variable spacing.
- Existing saved Normal record migrates to Easy; Hard and Extreme records stay with their modes. BMW zero-speed gate remains strict; game freezes and resets when speed becomes unknown or nonzero.
- GPU renderer is paced up to 60 Hz and shows the measured FPS in the sidebar. Software PNG fallback runs at 8 Hz; 60 FPS on actual BMW hardware is a target, not a guarantee.
- The Classic file and native RHMI menu definitions remain packaged for compatibility, but the game uses the Dashboard renderer only.
