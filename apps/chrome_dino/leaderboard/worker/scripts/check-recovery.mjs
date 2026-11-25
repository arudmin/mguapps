import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';

const endpoint = new URL(process.argv[2]);
const random = bytes => randomBytes(bytes).toString('hex');
const identity_hash = random(32), token = random(32), newToken = random(32);
const code = random(16), next_code = random(16);
const records = { easy: 1, normal: 2, hard: 3, extreme: 4 };

async function request(method, path, status, body, bearer) {
  const headers = { 'content-type': 'application/json' };
  if (bearer) headers.authorization = 'Bearer ' + bearer;
  const response = await fetch(new URL(path, endpoint), {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, status, method + ' ' + path);
  return response.json();
}

try {
  const { nickname } = await request('POST', '/v1/register', 200, { identity_hash, consent: true, token });
  const data = { identity_hash, consent: true, code };
  assert.equal((await request('POST', '/v1/recovery/preview', 404, data)).error, 'recovery_unavailable');
  await request('PUT', '/v1/recovery/code', 200, { code }, token);
  await request('POST', '/v1/sync', 200, { operation_id: randomUUID(), nickname: null, records }, token);
  const preview = await request('POST', '/v1/recovery/preview', 200, data);
  assert.equal(preview.profile.nickname, nickname);
  assert.deepEqual(preview.profile.records, records);
  const claim = { ...data, token: newToken, next_code };
  const restored = await request('POST', '/v1/recovery/claim', 200, claim);
  assert.equal(restored.accepted, true);
  assert.deepEqual(restored.profile, preview.profile);
  assert.deepEqual(await request('POST', '/v1/recovery/claim', 200, claim), restored);
  await request('POST', '/v1/recovery/preview', 404, data);
  const leaderboard = await request('GET', '/v1/leaderboard', 200, null, newToken);
  assert.equal(leaderboard.profile.nickname, nickname);
  assert.equal(Object.keys(leaderboard.boards).length, 4);
  console.log('Staging recovery verified: preview, four scores, idempotent claim, code rotation and bearer.');
} finally {
  await request('DELETE', '/v1/account', 200, null, token).catch(() => request('DELETE', '/v1/account', 200, null, newToken));
  await request('GET', '/v1/leaderboard', 401, null, newToken);
}
