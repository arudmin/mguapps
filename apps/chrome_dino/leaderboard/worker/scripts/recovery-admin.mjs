import { createHash, randomBytes } from 'node:crypto';

const [action, nickname, playerId] = process.argv.slice(2);
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, RECOVERY_CODE_HASH: suppliedHash } = process.env;
const database = 'chrome-dino-leaderboard-staging';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

if (!/^[0-9a-f]{32}$/.test(account || '') || !token) throw Error('Cloudflare D1 credentials required');
if (!['inspect', 'grant', 'grant-verified'].includes(action) || !/^[A-Za-z0-9_-]{3,16}$/.test(nickname || '') ||
    (action === 'grant' && !uuid.test(playerId || ''))) {
  throw Error('Usage: recovery-admin.mjs inspect NICKNAME | grant NICKNAME PLAYER_UUID');
}
if ((suppliedHash || action === 'grant-verified') && !/^[a-f0-9]{64}$/.test(suppliedHash || '')) throw Error('Invalid recovery code hash');

async function d1(path, query) {
  const reply = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account + '/d1/database' + path, {
    method: query ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: query ? JSON.stringify(query) : undefined,
  });
  const json = await reply.json();
  if (!reply.ok || !json.success) throw Error('Cloudflare D1 rejected the request (HTTP ' + reply.status + ')');
  return json.result;
}
const databases = await d1('?name=' + database);
const db = databases.find(item => item.name === database);
if (!db || !uuid.test(db.uuid)) throw Error('Existing staging D1 database required');

async function query(sql, params) {
  const [result] = await d1('/' + db.uuid + '/query', { sql, params });
  if (!result || !result.success) throw Error('D1 query failed');
  return result.results;
}
if (action === 'inspect') {
  const rows = await query(`SELECT p.id, p.nickname,
    CASE WHEN r.player_id IS NULL THEN 'legacy' WHEN r.expires_at IS NULL THEN 'configured'
    WHEN r.expires_at > unixepoch()*1000 THEN 'grant_active' ELSE 'grant_expired' END AS recovery
    FROM players p LEFT JOIN profile_recovery r ON r.player_id = p.id WHERE p.nickname = ?`, [nickname]);
  if (rows.length !== 1) throw Error('Exactly one matching player required');
  console.log(JSON.stringify(rows[0]));
} else {
  const code = suppliedHash ? null : randomBytes(16).toString('hex');
  const hash = suppliedHash || createHash('sha256').update('chrome-dino:recovery:v1:' + code).digest('hex');
  const rows = await query(`INSERT INTO profile_recovery (player_id, code_hash, expires_at)
    SELECT id, ?, (unixepoch()+86400)*1000 FROM players WHERE nickname = ? AND (? = '' OR id = ?)
    ON CONFLICT(player_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at
    WHERE profile_recovery.expires_at <= unixepoch()*1000 OR
      (profile_recovery.expires_at IS NOT NULL AND profile_recovery.code_hash = excluded.code_hash)
    RETURNING expires_at`, [hash, nickname, playerId || '', playerId || '']);
  if (rows.length !== 1) throw Error('Player mismatch or existing recovery credential');
  console.log('Grant expires ' + new Date(rows[0].expires_at).toISOString());
  if (code) console.log('Deliver privately to the verified owner: ' + code);
}
