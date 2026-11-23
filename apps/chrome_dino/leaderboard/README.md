# Chrome Dino Online Leaderboard — 1.4.14 (staging)
This is a **backend and MGU client module prototype**, not yet wired into the live game UI. Never deploy as a production ranking until deterministic replay verification is implemented. Submissions stay pending; public rankings only read best_scores (which is not populated by unverified submissions).

## Privacy
Vehicle identifier is processed locally: the MGU client computes SHA-256, sends only identity_hash, and generates default nickname user_<first eight hash chars>. SHA-256 of a structured identifier is **pseudonymous, not anonymous**; protect the hash, don't log it, and obtain opt-in consent before registration. No requests before consent. Store the token in protected local settings; do not use the hash as authentication. Avoid publishing hashes.

## Cloudflare free plan setup
1. Create a free Cloudflare account and open Workers & Pages.
2. Create D1 database named chrome-dino-leaderboard.
3. Install Node.js and run `npx wrangler login` in the worker directory.
4. Copy wrangler.toml.example to wrangler.toml, set your D1 database_id from the Cloudflare dashboard.
5. Run `npx wrangler d1 migrations apply chrome-dino-leaderboard --remote`.
6. Run `npx wrangler deploy`; copy the resulting https://...workers.dev URL.
7. Test `/health`. Don't enable client uploads until the MGU HTTPS test and verification logic are complete.

## API
POST /v1/register {identity_hash}; GET /v1/leaderboard?difficulty=extreme; GET /v1/me; PATCH /v1/profile {nickname}; POST /v1/session {difficulty}; POST /v1/submit {session_id,difficulty,score,events}. Authenticated routes use Bearer token.

## Next work
Integrate UI and consent with 12 translations, settings persistence, network test on BMW ID7, and replay verifier. Keep Normal/Hard/Extreme scores separate. Only stationary vehicle use.
