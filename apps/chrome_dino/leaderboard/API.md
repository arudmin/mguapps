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
