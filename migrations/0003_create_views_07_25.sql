-- Views for common queries
CREATE VIEW IF NOT EXISTS user_leaderboard AS
SELECT 
    u.id,
    u.username,
    us.total_score,
    us.challenges_solved,
    us.skill_level,
    us.skill_title,
    RANK() OVER (ORDER BY us.total_score DESC) as rank_position
FROM users u
JOIN user_stats us ON u.id = us.user_id
WHERE us.total_score > 0
ORDER BY us.total_score DESC;

CREATE VIEW IF NOT EXISTS category_leaderboards AS
SELECT 
    ucs.category,
    u.username,
    ucs.total_score,
    ucs.challenges_solved,
    RANK() OVER (PARTITION BY ucs.category ORDER BY ucs.total_score DESC) as rank_position
FROM user_category_stats ucs
JOIN users u ON ucs.user_id = u.id
WHERE ucs.total_score > 0
ORDER BY ucs.category, ucs.total_score DESC;