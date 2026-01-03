\connect user_profile_db;

CREATE TABLE user_profiles (
    uid INT PRIMARY KEY,
    display_name VARCHAR(50),
    avatar_media_id TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_preferences (
    uid INT PRIMARY KEY,
    is_subject_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_profile_audit_log (
    id SERIAL PRIMARY KEY,
    uid INT,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_follows (
    follower_uid INT NOT NULL,
    followee_uid INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (follower_uid, followee_uid),

    CONSTRAINT chk_no_self_follow
        CHECK (follower_uid <> followee_uid),

    CONSTRAINT fk_follower_profile
        FOREIGN KEY (follower_uid) REFERENCES user_profiles(uid) ON DELETE CASCADE,

    CONSTRAINT fk_followee_profile
        FOREIGN KEY (followee_uid) REFERENCES user_profiles(uid) ON DELETE CASCADE
);

CREATE INDEX idx_user_follows_followee_created
    ON user_follows (followee_uid, created_at DESC);

CREATE INDEX idx_user_follows_follower_created
    ON user_follows (follower_uid, created_at DESC);
