# Flappy Bird · BMW MGU ID7 / ID8

Нажатие центральной шайбы — старт/взмах, BACK — меню. Удержание и вращение не дают автоповтора. После проигрыша клик запускает новый полёт. Рекорд сохраняется локально.

## Установка

Этот каталог добавляется в `arudmin/mguapps` рядом с FX Drive. Корневой [каталог Store](../../mgu-repo.json) содержит два приложения. Файлы FX Drive не изменяются.

В MGU Store выберите источник `arudmin/mguapps` и канал ветки `main`, обновите источник и установите Flappy Bird. Нужны доступные в Store `idrive7-renderd >= 2.1.18` и `mgu-inputgate >= 1.1.0` из источника `cauliflowermossgrape/idrive7-apps`. Для некоторых renderer/backends ID8 захват шайбы может быть недоступен.

Игра использует поддерживаемый Store build-script, а FX Drive остаётся source-package `build: "unit"`. [build.js](build.js) упаковывает [package](package/package.json) стандартными средствами Node 8.16+, без npm, Python, сети и BMW SDK. Store создаёт SDK из штатного donor на самом головном устройстве. `mgu-app.json` игре не нужен; не добавляйте его и не меняйте её build на `"unit"`.

## Проверка офлайн на ПК

Из корня `mguapps`:

```sh
node apps/flappy_bird/build.js --preview-only
```

Ожидается `OFFLINE CHECK OK`: проверка структуры пакета, обоих RHMI layout и локальных JS-зависимостей; архив не записывается. Это не запуск приложения без SDK и не эмулятор автомобиля.

Для сборки SDK-free OAP-пакета:

```sh
node apps/flappy_bird/build.js
```

Результат: `apps/flappy_bird/dist/flappy_bird@1.0.0.tgz`. Для добавления игры в ветку GitHub этот архив не требуется: Store собирает его сам, используя `MGU_OUT`.

[Локальный .gitignore](.gitignore) намеренно разрешает plain CommonJS-исходники в [package/javascript/app.js](package/javascript/app.js) и его зависимостях. Здесь нет сгенерированного SDK-bundle. Без этого исключения корневое правило репозитория скрыло бы код игры от Git.

## Ограничения и безопасность

- Только на стоянке: разрешён свежий валидный нулевой сигнал скорости. Неизвестная, ненулевая скорость или отсутствие обновлений более 5 секунд блокируют игру. Датчик скорости не заменяет парковочный тормоз и положение P.
- При BACK/MENU, потере фокуса или движении физика останавливается и grab снимается. Штатные системные кнопки не переназначаются игрой.
- Игра заполняет всю поверхность, которую предоставляет renderer (`place.full`, реальные ширина и высота). В fallback используется область приложения. Удалить защищённые системные панели или расширить доступную HMI область код игры не может.
- На реальном автомобиле не тестировалось. Пройдены 23 теста игровой логики/ввода/lifecycle на Node 8.16.2; SDK, SOME/IP, полный физический экран и реальная шайба требуют проверки на вашей прошивке. ID8.5/ID9 не заявлены.

## Исходники и лицензии

Исполняемый entry — [app.js](package/javascript/app.js), механика — [game.js](package/javascript/src/game.js), управление — [input.js](package/javascript/src/input.js), графика — [render.js](package/javascript/src/render.js). RHMI ID7/ID8 и [runtime app-spec](package/javascript/kit/app-spec.json) уже сгенерированы для `flappy_bird`; глобальный kit builder не нужен.

Лицензии приложения — [MIT](package/LICENSE), происхождение — [NOTICE](package/NOTICE), лицензия kit — [idrive7-apps MIT](package/third-party/idrive7-apps-LICENSE). Нет BMW SDK, прошивки, ключей или оригинальных Flappy Bird ресурсов. Это независимый неофициальный проект.
