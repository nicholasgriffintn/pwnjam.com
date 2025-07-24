-- Users table to store basic user information
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_active INTEGER DEFAULT (strftime('%s', 'now')),
    avatar_url TEXT,
    preferences TEXT -- JSON string for user preferences
);

-- User statistics and scoring information
CREATE TABLE IF NOT EXISTS user_stats (
    user_id TEXT PRIMARY KEY,
    total_score INTEGER DEFAULT 0,
    challenges_solved INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- Total time spent solving challenges in milliseconds
    hints_used INTEGER DEFAULT 0,
    last_solve_time INTEGER,
    skill_level INTEGER DEFAULT 1,
    skill_title TEXT DEFAULT 'Novice',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Challenge history to track all challenge attempts and completions
CREATE TABLE IF NOT EXISTS challenge_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    room_key TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    challenge_title TEXT NOT NULL,
    challenge_category TEXT NOT NULL,
    challenge_difficulty INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('attempted', 'solved', 'abandoned')),
    score_earned INTEGER DEFAULT 0,
    time_taken INTEGER, -- Time in milliseconds
    hints_used INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    flag_submitted TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    collaboration_bonus INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Global leaderboard (for persistent storage, complementing KV cache)
CREATE TABLE IF NOT EXISTS global_leaderboard (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    challenges_solved INTEGER NOT NULL,
    average_time REAL NOT NULL, -- Average time per challenge in milliseconds
    efficiency_score INTEGER NOT NULL,
    rank_position INTEGER,
    last_updated INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Room-specific leaderboards for historical tracking
CREATE TABLE IF NOT EXISTS room_leaderboards (
    id TEXT PRIMARY KEY,
    room_key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    challenges_solved INTEGER NOT NULL,
    average_time REAL NOT NULL,
    efficiency_score INTEGER NOT NULL,
    rank_position INTEGER,
    session_date TEXT NOT NULL, -- Date of the session (YYYY-MM-DD)
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria_type TEXT NOT NULL CHECK (criteria_type IN ('score', 'challenges', 'speed', 'category', 'streak')),
    criteria_value INTEGER NOT NULL,
    criteria_category TEXT, -- For category-specific achievements
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points_reward INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    earned_at INTEGER DEFAULT (strftime('%s', 'now')),
    room_key TEXT, -- Track which room the achievement was earned in
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Category statistics for tracking user performance per challenge type
CREATE TABLE IF NOT EXISTS user_category_stats (
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    challenges_solved INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0,
    best_time INTEGER, -- Best solve time for this category
    average_difficulty REAL DEFAULT 0,
    last_solved INTEGER,
    PRIMARY KEY (user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Room statistics for tracking room performance over time
CREATE TABLE IF NOT EXISTS room_stats (
    room_key TEXT PRIMARY KEY,
    total_challenges_generated INTEGER DEFAULT 0,
    total_solves INTEGER DEFAULT 0,
    average_solve_time REAL DEFAULT 0,
    most_popular_category TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_activity INTEGER DEFAULT (strftime('%s', 'now')),
    peak_concurrent_users INTEGER DEFAULT 0
);
