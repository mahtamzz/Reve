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
