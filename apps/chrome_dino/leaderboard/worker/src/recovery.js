const HEX = /^[a-f0-9]{64}$/;
const CODE = /^[a-f0-9]{32}$/;
const matches = (value, pattern) => typeof value === 'string' && pattern.test(value);

async function profile(db, player, modes) {
  const records = Object.fromEntries(modes.map(mode => [mode, 0]));
  const scores = await db.prepare('SELECT difficulty, score FROM personal_scores WHERE player_id = ?')
    .bind(player.id).all();
  for (const row of scores.results) records[row.difficulty] = row.score;
  return { nickname: player.nickname, original_nickname: player.original_nickname, records };
}

export function recoveryApi({ modes, body, digest, identityHmac, exact, player, respond, error }) {
  const codeHash = code => digest('chrome-dino:recovery:v1:' + code);

  return async function recover(req, env, path) {
    const db = env.DB;
    if (path === '/v1/recovery/code' && req.method === 'PUT') {
      const me = await player(req, db);
      if (!me) return error('unauthorized', 401);
      const input = await body(req);
      if (!exact(input, ['code']) || !matches(input.code, CODE)) return error('invalid_recovery', 400);
      const hash = await codeHash(input.code);
      await db.prepare(`INSERT INTO profile_recovery (player_id, code_hash)
        VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(me.id, hash).run();
      const row = await db.prepare('SELECT code_hash, expires_at FROM profile_recovery WHERE player_id = ?')
        .bind(me.id).first();
      if (!row || row.code_hash !== hash || row.expires_at !== null) return error('code_already_configured', 409);
      return respond({ accepted: true });
    }

    const claim = path === '/v1/recovery/claim';
    if ((!claim && path !== '/v1/recovery/preview') || req.method !== 'POST') return error('not_found', 404);
    const input = await body(req);
    const keys = ['code', 'identity_hash', 'consent'];
    if (claim) keys.push('token', 'next_code');
    if (!exact(input, keys) || input.consent !== true || !matches(input.identity_hash, HEX) ||
        !matches(input.code, CODE) ||
        (claim && (!matches(input.token, HEX) || !matches(input.next_code, CODE) || input.next_code === input.code))) {
      return error('invalid_recovery', 400);
    }
    const vehicle = await identityHmac(input.identity_hash, env.SERVER_SECRET);
    const hash = await codeHash(input.code);
    const now = Date.now();
    if (!claim) {
      const match = await db.prepare(`SELECT p.id, p.nickname, p.original_nickname
        FROM profile_recovery r JOIN players p ON p.id = r.player_id
        WHERE r.code_hash = ? AND COALESCE(p.vehicle_hash, p.identity_hash) = ?
        AND (r.expires_at IS NULL OR r.expires_at > ?)`).bind(hash, vehicle, now).first();
      return match ? respond({ profile: await profile(db, match, modes) }) : error('recovery_unavailable', 404);
    }

    const tokenHash = await digest(input.token);
    const nextHash = await codeHash(input.next_code);
    try {
      await db.batch([
        db.prepare(`INSERT INTO recovery_sessions (token_hash, player_id, previous_code_hash, next_code_hash)
          SELECT ?, r.player_id, ?, ? FROM profile_recovery r JOIN players p ON p.id = r.player_id
          WHERE r.code_hash = ? AND COALESCE(p.vehicle_hash, p.identity_hash) = ?
          AND (r.expires_at IS NULL OR r.expires_at > ?)
          AND NOT EXISTS (SELECT 1 FROM players WHERE token_hash = ?)
          AND NOT EXISTS (SELECT 1 FROM profile_recovery WHERE code_hash = ?)
          ON CONFLICT DO NOTHING`).bind(tokenHash, hash, nextHash, hash, vehicle, now, tokenHash, nextHash),
        db.prepare(`UPDATE profile_recovery SET code_hash = ?, expires_at = NULL WHERE code_hash = ?
          AND changes() = 1 AND player_id = (SELECT player_id FROM recovery_sessions WHERE token_hash = ?
          AND previous_code_hash = ? AND next_code_hash = ?)`).bind(nextHash, hash, tokenHash, hash, nextHash)
      ]);
    } catch (err) {
      if (!/UNIQUE constraint failed: profile_recovery.code_hash/.test(String(err.message))) throw err;
      return error('recovery_unavailable', 404);
    }

    // Repeating the same claim after a lost response returns the same account.
    const me = await db.prepare(`SELECT p.id, p.nickname, p.original_nickname
      FROM recovery_sessions s JOIN players p ON p.id = s.player_id
      WHERE s.token_hash = ? AND s.previous_code_hash = ? AND s.next_code_hash = ?
      AND COALESCE(p.vehicle_hash, p.identity_hash) = ?`).bind(tokenHash, hash, nextHash, vehicle).first();
    return me ? respond({ accepted: true, profile: await profile(db, me, modes) }) : error('recovery_unavailable', 404);
  };
}
