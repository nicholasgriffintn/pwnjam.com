-- Insert default achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, criteria_type, criteria_value, rarity, points_reward) VALUES
('first_blood', 'First Blood', 'Solve your first challenge', '🩸', 'challenges', 1, 'common', 10),
('speed_demon', 'Speed Demon', 'Solve a challenge in under 5 minutes', '⚡', 'speed', 300, 'rare', 25),
('crypto_novice', 'Crypto Novice', 'Solve your first cryptography challenge', '🔐', 'category', 1, 'common', 10),
('crypto_expert', 'Crypto Expert', 'Solve 10 cryptography challenges', '🔓', 'category', 10, 'epic', 50),
('web_novice', 'Web Novice', 'Solve your first web challenge', '🌐', 'category', 1, 'common', 10),
('web_expert', 'Web Expert', 'Solve 10 web challenges', '🕸️', 'category', 10, 'epic', 50),
('pwn_novice', 'Pwn Novice', 'Solve your first binary exploitation challenge', '💥', 'category', 1, 'common', 10),
('reverse_novice', 'Reverse Novice', 'Solve your first reverse engineering challenge', '🔄', 'category', 1, 'common', 10),
('forensics_novice', 'Forensics Novice', 'Solve your first forensics challenge', '🔍', 'category', 1, 'common', 10),
('hundred_points', 'Century', 'Reach 100 total points', '💯', 'score', 100, 'common', 15),
('thousand_points', 'Millennium', 'Reach 1000 total points', '🏆', 'score', 1000, 'rare', 40),
('challenger', 'Challenger', 'Solve 10 challenges', '🎯', 'challenges', 10, 'common', 20),
('veteran', 'Veteran', 'Solve 50 challenges', '⭐', 'challenges', 50, 'epic', 75),
('legend', 'Legend', 'Solve 100 challenges', '👑', 'challenges', 100, 'legendary', 150);

-- Add specific category achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, criteria_type, criteria_value, criteria_category, rarity, points_reward) VALUES
('crypto_master', 'Crypto Master', 'Solve 5 cryptography challenges', '🔐', 'category', 5, 'crypto', 'rare', 30),
('web_warrior', 'Web Warrior', 'Solve 5 web challenges', '🌐', 'category', 5, 'web', 'rare', 30),
('pwn_master', 'Pwn Master', 'Solve 5 binary exploitation challenges', '💥', 'category', 5, 'pwn', 'rare', 30),
('reverse_master', 'Reverse Master', 'Solve 5 reverse engineering challenges', '🔄', 'category', 5, 'reverse', 'rare', 30),
('forensics_master', 'Forensics Master', 'Solve 5 forensics challenges', '🔍', 'category', 5, 'forensics', 'rare', 30),
('misc_master', 'Misc Master', 'Solve 5 miscellaneous challenges', '🎲', 'category', 5, 'misc', 'rare', 30);
