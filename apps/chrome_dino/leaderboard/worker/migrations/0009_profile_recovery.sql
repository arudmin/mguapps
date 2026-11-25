CREATE TABLE profile_recovery (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER
);

CREATE TABLE recovery_sessions (
  token_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  previous_code_hash TEXT NOT NULL,
  next_code_hash TEXT NOT NULL
);
CREATE INDEX recovery_sessions_player ON recovery_sessions(player_id);
