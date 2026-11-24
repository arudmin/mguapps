## 0.2.7 — 24.11.2026
Case-insensitive unique nicknames, reserved originals, migration of existing conflicts, availability endpoint and regression test. CI pending. Rare existing original-name hash-prefix collision blocks migration rather than changing identity. API v1 retained.

# Chrome Dino Leaderboard 0.2.6

### 0.2.6 — 24.11.2026
- Positive scores only in personal_scores; migration cleans zero rows and guards inserts/updates. API v1 unchanged. Added regression test. CI pending. Previous 0.2.5 deployment passed 45390019253.

# Chrome Dino Leaderboard 0.2.5

### 0.2.5 — 24.11.2026
- Migration 0003 backfills immutable original nickname from existing HMAC. API v1 returns it only to the authenticated profile/registration/sync. Enforce 3–16 ASCII characters. Reset uses existing sync and preserves records. Tests added; deployment pending.

# Chrome Dino Leaderboard 0.2.4

Current API: [API.md](API.md). Only /health, /v1/register, /v1/sync and /v1/leaderboard are supported. Older clients must update; database and HMAC key retained. Replay verification remains a development backlog.

### 0.2.4 — 24.11.2026
Removed legacy API implementations, renamed batch API to v1. Preserved stored players, credentials, records and operation IDs for existing batch jobs; older record-only jobs migrate to new IDs with monotonic scores. CI pending.

### 0.2.3
Server CI and deployment passed (45385581707).

## Historical documentation (not current API)

# Chrome Dino Leaderboard 0.2.3 — staging

Серверная версия независима от игры 1.5.5. Пока не интегрирована в BMW. Только тестовый контур; результаты не публикуются до проверки повторов.

## Протокол идентификации
После явного согласия клиент вычисляет SHA-256 от VIN локально и по HTTPS передаёт identity_hash и consent:true. Исходный VIN не отправляется. Worker вычисляет HMAC-SHA256 с серверным секретом и префиксом chrome-dino:vin-sha256:v1:, хранит только HMAC, случайный UUID игрока, никнейм и SHA-256 случайного токена. Имя по умолчанию user_ + первые 8 символов HMAC. Изменение имени не меняет ID и рекорды. Хеш VIN и HMAC — псевдонимные конфиденциальные данные; не логировать, не публиковать. Токен авторизации независим от VIN; повторная регистрация не выдаёт новый токен. Восстановление аккаунта после потери токена пока не реализовано. До интеграции необходимы согласие, защищённое хранение токена и механизм удаления данных.

## API
- GET /health — проверка конфигурации и БД.
- POST /v1/register {identity_hash,consent:true} — регистрация; возвращает player_id, nickname, token.
- GET /v1/leaderboard?difficulty=extreme&limit=10 (или 100) — только проверенные результаты, отдельные easy/normal/hard/extreme.
- GET /v1/me — профиль, рекорды и место.
- PATCH /v1/profile {nickname} — смена имени.
- POST /v1/session {difficulty,game_version:"1.5.5"} — UUID сессии, seed, срок 1 час. Не более 20 сессий в час на игрока.
- POST /v1/submit {session_id,difficulty,score,events,ticks} — events: строго возрастающие номера игровых шагов нажатий; ticks: число шагов 120 Гц. Сессия одноразовая, результат pending.
Авторизованные маршруты требуют Bearer token. Размер JSON ограничен, проверяются режим, сессия, срок, владелец и длительность. Без детерминированного воспроизведения препятствий и прыжков сервер не доверяет присланному счёту и не обновляет best_scores. Нельзя считать это завершённым античитом. Публичный staging также требует дальнейшего усиления защиты от массовой регистрации и исчерпания лимитов.

## Cloudflare
GitHub Actions chrome-dino-leaderboard.yml использует CLOUDFLARE_ACCOUNT_ID и CLOUDFLARE_API_TOKEN из GitHub Secrets. Создаёт отдельные Worker и D1 chrome-dino-leaderboard-staging, применяет миграции, создаёт SERVER_SECRET один раз и сохраняет его при последующих деплоях. Не переключает тариф, не покупает домен, не изменяет биллинг. Аккаунт должен быть на Workers Free; при отсутствии workers.dev нужно активировать бесплатный поддомен в Dashboard. Не выводить токены и идентификаторы игроков в журналы.

## Проверка
Node 22: в worker выполнить npm test. Используется SQLite с той же SQL-схемой и имитацией D1. CI затем выполняет реальные проверки /health и четырёх таблиц рейтинга. Отдельно потребуется проверить HTTPS и хранение токена на BMW. Первый этап интеграции Extreme; другие режимы поддерживаются сервером.

## История
- 0.1.0 (24.11.2026): согласованный двухступенчатый идентификатор SHA-256 + HMAC, никнейм из HMAC, четыре режима, токены, сессии, pending, тесты и staging CI. Игра не изменена.
- Прототип 1.4.14 (23.11.2026): Worker, D1, клиент; серверный HMAC ещё не реализован.


### 24.11.2026 — integration check
Добавлена отдельная проверка реального staging API и D1: синтетическая регистрация, проверка HMAC/хеша токена в SQL, смена имени, сессия Extreme, pending-результат, защита от повторной отправки и отсутствие непроверенного рекорда. Временные записи удаляются после теста. Версии игры и сервера не изменены. Результат проверки публикуется в Actions.


### 24.11.2026 — persistent player and MGU client integration
CI 45357189282 confirmed live HTTPS, D1 registration, HMAC, token hash, profile, session, pending score and duplicate rejection. Added live integration using the actual MGU client module with synthetic VINs (no real vehicle identifier): persistent Test_Dino, independent temporary Test_New_BMW, consent, restart with token, duplicate rejection and pending Extreme submission. Test_New_BMW is cleaned up; Test_Dino remains. Its initial token is not logged or retained after CI; recovery is still not implemented. Explicit URL import for legacy Node compatibility. Actual ID7/ID8 UI integration, real VIN reading, TLS on BMW and protected token persistence still require hardware testing. Server/game versions unchanged; test workflow records actual results.


### 0.2.1 — 24.11.2026
API v2: POST /v2/register with consent, local VIN hash and randomly generated persisted client token (idempotent only with same token); POST /v2/sync authenticated with operation_id and four personal bests, monotonic upserts and conflicting payload rejection; GET /v2/me returns private unverified personal records. Migration 0002 adds personal_scores and sync_operations. Existing v1 unchanged. No unverified score enters public leaderboard; offline replay verification, account recovery, deletion and retention limits remain outstanding. Tests added, deployment pending. BMW DNS connectivity confirmed by user photo on 1.5.17; upload not tested yet.


### 0.2.2 — 24.11.2026
- Owner requested to defer replay verification. New GET /v2/leaderboard?difficulty=easy|normal|hard|extreme&limit=10 (or 100) ranks positive synced personal records, marks verified_only:false and verification:unverified. Existing verified-only v1 route unchanged. No migration needed. Nicknames and scores only; no vehicle hash or token in board. Tests cover sort, mode isolation, zero exclusion and unchanged v1. Server 0.2.1 staging deployment and tests succeeded (Actions 45382951098). 0.2.2 CI pending; anti-cheat and account recovery/deletion remain outstanding.


### 0.2.3 — 24.11.2026
API v3 (see API.md): one authenticated atomic sync for name and all four records; one read for all boards and own ranks. Existing v1/v2 retained; no migration. Replay verification deferred. Tests added, CI pending.
