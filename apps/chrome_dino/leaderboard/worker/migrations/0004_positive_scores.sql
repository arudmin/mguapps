DELETE FROM personal_scores WHERE score<=0;
CREATE TRIGGER IF NOT EXISTS personal_scores_positive_insert BEFORE INSERT ON personal_scores WHEN NEW.score<=0 BEGIN SELECT RAISE(ABORT,'positive score required'); END;
CREATE TRIGGER IF NOT EXISTS personal_scores_positive_update BEFORE UPDATE OF score ON personal_scores WHEN NEW.score<=0 BEGIN SELECT RAISE(ABORT,'positive score required'); END;
