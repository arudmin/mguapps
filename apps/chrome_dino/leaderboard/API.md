# Chrome Dino API v3 — server 0.2.3

Base: https://chrome-dino-leaderboard-staging.mguapps.workers.dev
HTTPS JSON, UTF-8. No raw VIN, token or identity hash in public responses. Registration remains POST /v2/register with {identity_hash,consent:true,token}; token is a random 64-hex secret persisted before request. API v1 and v2 remain supported as documented in README.

## POST /v3/sync
Authorization: Bearer <token>. Content-Type: application/json.

```json
{"operation_id":"11111111-1111-4111-8111-111111111111","nickname":"Dino_Player","records":{"easy":143,"normal":35,"hard":36,"extreme":27}}
```
Nickname null means unchanged; otherwise server validates 3–24 letters/numbers/_/-, excluding VIN-shaped strings; BMW editor uses 3–16 ASCII characters. Records: integer 0–1000000 for all four modes. Success 200: {"accepted":true,"operation_id":"...","nickname":"Dino_Player"}. D1 atomic batch, monotonic bests, same operation ID and payload may retry without reapplying old nickname; conflicting payload returns 409. Never discard pending job without ACK. Old queued v2 jobs are retried against v2.

## GET /v3/leaderboard
Optional Bearer token, invalid token 401. One request for all four top-10 boards and own position. Example response:
```json
{"boards":{"easy":[{"rank":1,"nickname":"Dino_Player","score":143,"self":true}],"normal":[],"hard":[],"extreme":[]},"profile":{"nickname":"Dino_Player","positions":{"easy":{"rank":1,"score":143},"normal":null,"hard":null,"extreme":null}},"generated_at":1795500000000,"verification":"unverified"}
```
Anonymous profile null. Ties: score descending, earliest achievement then player ID. Zero excluded. Client caches all boards on disk for 60 seconds, minimum 5 seconds between reads, keeps stale data on failure. Response no-store at HTTP layer because profile is personalized. Replay verification deferred; scores provisional.

## Errors
400 invalid_sync/invalid_registration; 401 unauthorized; 409 operation_conflict/already_registered; 413 body_too_large; 415 json_required; 429 rate_limited (legacy sessions); 500 request_failed; 503 not_configured. Error body {"error":"code"}. Retry transient failures with 5–60 second exponential backoff; permanent failures retained for diagnosis. Versioning independent: app 1.5.22, server 0.2.3, API v3. No schema migration. No recovery/deletion yet.
