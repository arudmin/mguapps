# Chrome Dino API v1 — Worker 0.2.13

Базовый URL: https://chrome-dino-leaderboard-staging.mguapps.workers.dev. JSON UTF-8 по HTTPS, ответы `Cache-Control: no-store`. Токен — 64 строчных шестнадцатеричных символа в заголовке `Authorization: Bearer <token>`. Ошибка возвращается в виде `{"error":"код"}`.

## Регистрация, рекорды и рейтинг

| Маршрут | Контракт |
| --- | --- |
| `GET /health` | Версия Worker, четыре сложности, состояние staging |
| `POST /v1/register` | `{identity_hash,consent:true,token,installation_id?}`. Повтор требует тот же токен. Возвращает `{accepted:true,player_id,nickname,original_nickname}`. Legacy payload без installation_id поддерживается. Поле analytics из старых клиентов игнорируется |
| `POST /v1/sync` | Требует Bearer. Поля `operation_id` (UUID), `records` (все четыре сложности), `nickname` (строка или null), `resolve_name` (необязательно). Возвращает `{accepted:true,operation_id,nickname,original_nickname}` |
| `GET /v1/leaderboard` | Bearer необязателен. Возвращает `{boards,profile,generated_at,verification}`. Для каждой сложности до 10 записей `{rank,nickname,score,self}`. Авторизованный `profile` содержит `nickname,original_nickname,positions`. Без авторизации `profile:null` |
| `GET /v1/name-availability?nickname=NAME` | Bearer необязателен. Возвращает `{available,suggestions}`. Проверка предварительная. Смена имени подтверждается при sync |
| `DELETE /v1/account` | Bearer обязателен. Возвращает `{deleted:true}`. Повтор с тем же токеном идемпотентен |

`records` содержит ключи `easy`, `normal`, `hard`, `extreme` и целые значения 0–1 000 000. Ноль означает отсутствие результата. Синхронизация сохраняет максимум по каждой сложности. Повтор operation_id с тем же содержимым безопасен. Другой payload под тем же ID даёт 409. Допустимое имя содержит 3–16 латинских букв, цифр, «_» и «-», сравнение без учёта регистра.

Рейтинг выбирает по одному результату на группу автомобиля в каждом режиме. Сортировка по очкам вниз, затем по времени серверной записи результата вниз, затем по ID игрока вверх. `positions[mode]` равна `null`, если результат аккаунта не представляет группу в режиме. Текущая верификация результатов — `unverified`. Клиент кэширует ответ на 60 секунд и сохраняет последний ответ при сетевой ошибке.

## Восстановление

| Маршрут | Тело | Ответ |
| --- | --- | --- |
| `PUT /v1/recovery/code` | `{code}` и Bearer текущего аккаунта | `{accepted:true}`. Повтор с тем же действующим постоянным кодом идемпотентен. Другой действующий код даёт 409 |
| `POST /v1/recovery/preview` | `{code,identity_hash,consent:true}` | `{profile:{nickname,original_nickname,records}}`. Для неизвестного или просроченного кода и несовпадения автомобиля ответ одинаковый, HTTP 404 |
| `POST /v1/recovery/claim` | `{code,identity_hash,consent:true,token,next_code}` | `{accepted:true,profile:{nickname,original_nickname,records}}`. Устанавливает новый код и подключает токен к тому же аккаунту. Идемпотентный повтор требует те же `code`, `token`, `next_code` и группу автомобиля |

`code` и `next_code` — 32 строчных шестнадцатеричных символа, сгенерированных из 16 случайных байтов. Клиент сохраняет новый токен и следующий код до отправки. Код никогда не передаётся в URL. В `profile.records` возвращаются именно личные максимумы, независимо от публичного места. Нет маршрута поиска профиля по одному идентификатору автомобиля или имени. Временные выдачи идут через аутентифицированный D1-инструмент администратора.

## Ошибки и совместимость

- 400 — `invalid_registration`, `invalid_sync`, `invalid_nickname`, `invalid_recovery` или `invalid_json`.
- 401 — `unauthorized`.
- 404 — `not_found` или `recovery_unavailable`.
- 409 — `already_registered`, `operation_conflict`, `nickname_taken` или `code_already_configured`.
- 413/415 — `body_too_large` / `json_required`. 500/503 — `request_failed` / `not_configured`.

Для обычной синхронизации действуют прежние повторы с задержкой 5–60 секунд. Подтверждение восстановления повторяется с теми же учётными данными. Переход на 0.2.13 сохраняет v1, прежние токены, операции и результаты. Миграция 0009 добавляет только таблицы восстановления. Детали в [SDD](../SDD.md).

## История API до 0.2.13

# Chrome Dino API v1 — server 0.2.6

Base: https://chrome-dino-leaderboard-staging.mguapps.workers.dev
HTTPS JSON, UTF-8. No raw VIN, token or identity hash in public responses. Registration remains POST /v1/register with {identity_hash,consent:true,token}; token is a random 64-hex secret persisted before request. Only the current API is supported. Historical versions removed.

## POST /v1/sync
Authorization: Bearer <token>. Content-Type: application/json.

```json
{"operation_id":"11111111-1111-4111-8111-111111111111","nickname":"Dino_Player","records":{"easy":143,"normal":35,"hard":36,"extreme":27}}
```
Nickname null means unchanged; otherwise server validates 3–16 ASCII letters/numbers/_/- on both server and BMW. Records: integer 0–1000000 for all four modes. Success 200: {"accepted":true,"operation_id":"...","nickname":"Dino_Player"}. D1 atomic batch, monotonic bests, same operation ID and payload may retry without reapplying old nickname; conflicting payload returns 409. Never discard pending job without ACK. Old record-only queued jobs are migrated with fresh operation IDs and nickname null; monotonic records prevent duplicate effects.

## GET /v1/leaderboard
Optional Bearer token, invalid token 401. One request for all four top-10 boards and own position. Example response:
```json
{"boards":{"easy":[{"rank":1,"nickname":"Dino_Player","score":143,"self":true}],"normal":[],"hard":[],"extreme":[]},"profile":{"nickname":"Dino_Player","positions":{"easy":{"rank":1,"score":143},"normal":null,"hard":null,"extreme":null}},"generated_at":1795500000000,"verification":"unverified"}
```
Anonymous profile null. Ties: score descending, earliest achievement then player ID. Zero excluded. Client caches all boards on disk for 60 seconds, minimum 5 seconds between reads, keeps stale data on failure. Response no-store at HTTP layer because profile is personalized. Replay verification deferred; scores provisional.

## Errors
400 invalid_sync/invalid_registration; 401 unauthorized; 409 operation_conflict/already_registered; 413 body_too_large; 415 json_required; 429 rate_limited (legacy sessions); 500 request_failed; 503 not_configured. Error body {"error":"code"}. Retry transient failures with 5–60 second exponential backoff; permanent failures retained for diagnosis. Versioning independent: app 1.5.26, server 0.2.4, API v1. Migration 0003 adds immutable original_nickname. No recovery/deletion yet.

Registration, sync acknowledgement and authenticated leaderboard profile now include `original_nickname`. Existing names are reconstructed from the stored HMAC, not the current nickname. Reset uses the ordinary queued sync with nickname set to original_nickname. The original field cannot be changed by clients. No new endpoint. Older already registered clients learn the original on next authenticated leaderboard read or sync ACK.

Zero scores are accepted in snapshots but never inserted into personal_scores. Migration 0004 removes existing zero rows and prevents future nonpositive rows. Registration alone creates no ranking record.

### 0.2.7
GET /v1/name-availability?nickname=NAME (optional bearer) returns {available:boolean}; advisory only. POST /v1/sync atomically rejects occupied or reserved names with 409 nickname_taken; client must retain scores and discard rejected rename. Case-insensitive ASCII comparison. Existing conflicting names reset to their reserved originals; accounts and scores retained.

### 0.2.8
Availability returns up to five free suggestions; approximate request geography informs suffixes without storing IP. Optional resolve_name:true on sync resolves conflicts within atomic batch attempts, preserving operation ID and score payload. Optional registration analytics consent stores country/region, registration date, game version and language in private D1 table; no raw VIN/IP, no vehicle attributes without validated source. No analytics for legacy registration without opt-in.

### 0.2.9
Registration analytics discontinued. Legacy analytics payload is ignored for compatibility; migration 0007 drops the table and all rows. Request geography is used only transiently for nickname suggestions. Existing players and scores are unchanged.

### 0.2.10
Tie ordering: score DESC, updated_at DESC, player_id ASC. Timestamp remains internal and changes only for an improved score; it represents server acceptance time, not offline play time. Own positions use identical ordering.

## 25.11.2026 — 1.5.30 / server 0.2.11
Shared dashboard sprite geometry and swept collision checks, brighter top ranking button above personal records, extended localized descriptions. New opt-in installations use a durable random installation UUID; existing accounts and queues remain. Server migration 0008 groups by vehicle HMAC, one best record per vehicle per mode. Legacy registration remains compatible. Nonrepresentative accounts have no public rank in that mode. API v1 optional installation_id. Tests and hardware validation pending.

## 25.11.2026 — 1.5.31 / server 0.2.12
- Diagnostic read only after explicit opt-in, never at startup, no repeated read for enrolled accounts. No raw VIN transmitted or logged. Derived identifier remains necessary for vehicle grouping.
- Removed unused sensitive UserAccount, PrivacySettings, Provisioning, units and environmental interfaces and DeviceLink/Provisioning ACLs; retain platform lifecycle and RHMI/OAP infrastructure. Actual SDK startup on physical ID7/8 must be checked.
- DELETE /v1/account with bearer token; atomic deletion of account and dependent records; retries with the same token are idempotent. Client stops score sync immediately, retains only deletion credential until confirmation, clears profile/cache and preserves local bests. Separate accounts on same vehicle unaffected. Offline deletion requires the app to run again with connectivity; uninstall before confirmation can lose the retry credential. D1 recovery/backups and infrastructure logs are subject to provider retention, not directly erased by this endpoint.
- Regional suffix only after confirmed nickname conflict; no storage of IP/region. Pre-consent onboarding nickname editing stays local. Cloudflare receives IP as part of normal HTTP transport.
- Tests and physical verification pending.
