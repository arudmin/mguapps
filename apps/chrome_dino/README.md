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
