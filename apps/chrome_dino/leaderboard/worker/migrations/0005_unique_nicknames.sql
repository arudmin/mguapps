UPDATE players SET nickname=original_nickname WHERE EXISTS(SELECT 1 FROM players p WHERE p.id<>players.id AND p.original_nickname=players.nickname COLLATE NOCASE);
UPDATE players SET nickname=original_nickname WHERE EXISTS(SELECT 1 FROM players p WHERE p.id<>players.id AND p.nickname=players.nickname COLLATE NOCASE AND (p.created_at<players.created_at OR (p.created_at=players.created_at AND p.id<players.id)));
CREATE UNIQUE INDEX players_nickname_unique ON players(nickname COLLATE NOCASE);
CREATE UNIQUE INDEX players_original_nickname_unique ON players(original_nickname COLLATE NOCASE);
CREATE TRIGGER players_nickname_reserved_insert BEFORE INSERT ON players WHEN EXISTS(SELECT 1 FROM players p WHERE p.identity_hash<>NEW.identity_hash AND (p.original_nickname=NEW.nickname COLLATE NOCASE OR p.nickname=NEW.original_nickname COLLATE NOCASE)) BEGIN SELECT RAISE(ABORT,'nickname_taken'); END;
CREATE TRIGGER players_nickname_reserved_update BEFORE UPDATE OF nickname ON players WHEN EXISTS(SELECT 1 FROM players p WHERE p.id<>NEW.id AND p.original_nickname=NEW.nickname COLLATE NOCASE) BEGIN SELECT RAISE(ABORT,'nickname_taken'); END;
