-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_challenge_history_user_id ON challenge_history(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_history_room_key ON challenge_history(room_key);
CREATE INDEX IF NOT EXISTS idx_challenge_history_status ON challenge_history(status);
CREATE INDEX IF NOT EXISTS idx_challenge_history_category ON challenge_history(challenge_category);
CREATE INDEX IF NOT EXISTS idx_challenge_history_completed_at ON challenge_history(completed_at);

CREATE INDEX IF NOT EXISTS idx_user_stats_total_score ON user_stats(total_score);
CREATE INDEX IF NOT EXISTS idx_user_stats_challenges_solved ON user_stats(challenges_solved);
CREATE INDEX IF NOT EXISTS idx_user_stats_skill_level ON user_stats(skill_level);

CREATE INDEX IF NOT EXISTS idx_global_leaderboard_rank ON global_leaderboard(rank_position);
CREATE INDEX IF NOT EXISTS idx_global_leaderboard_score ON global_leaderboard(total_score);

CREATE INDEX IF NOT EXISTS idx_room_leaderboards_room_key ON room_leaderboards(room_key);
CREATE INDEX IF NOT EXISTS idx_room_leaderboards_session_date ON room_leaderboards(session_date);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);

CREATE INDEX IF NOT EXISTS idx_user_category_stats_category ON user_category_stats(category);
CREATE INDEX IF NOT EXISTS idx_user_category_stats_total_score ON user_category_stats(total_score);
