ALTER TABLE players ADD COLUMN vehicle_hash TEXT;
UPDATE players SET vehicle_hash=identity_hash WHERE vehicle_hash IS NULL;
CREATE INDEX players_vehicle_hash ON players(vehicle_hash);
