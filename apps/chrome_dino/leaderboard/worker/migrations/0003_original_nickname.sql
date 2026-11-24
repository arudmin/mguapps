ALTER TABLE players ADD COLUMN original_nickname TEXT;
UPDATE players SET original_nickname='user_'||substr(identity_hash,1,8) WHERE original_nickname IS NULL;
CREATE TRIGGER IF NOT EXISTS players_original_nickname_immutable BEFORE UPDATE OF original_nickname ON players WHEN OLD.original_nickname IS NOT NULL AND NEW.original_nickname IS NOT OLD.original_nickname BEGIN SELECT RAISE(ABORT,'original nickname immutable'); END;
CREATE TRIGGER IF NOT EXISTS players_original_nickname_required BEFORE INSERT ON players WHEN NEW.original_nickname IS NULL OR NEW.original_nickname != 'user_'||substr(NEW.identity_hash,1,8) BEGIN SELECT RAISE(ABORT,'original nickname required'); END;
