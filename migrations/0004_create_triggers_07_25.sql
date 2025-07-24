-- Triggers to automatically update timestamps
CREATE TRIGGER IF NOT EXISTS update_user_stats_timestamp 
    AFTER UPDATE ON user_stats
    FOR EACH ROW
BEGIN
    UPDATE user_stats SET updated_at = strftime('%s', 'now') WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_last_active
    AFTER INSERT ON challenge_history
    FOR EACH ROW
BEGIN
    UPDATE users SET last_active = strftime('%s', 'now') WHERE id = NEW.user_id;
END;