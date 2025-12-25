\connect media_db;

CREATE TABLE IF NOT EXISTS user_avatars (
    uid         INT PRIMARY KEY,                  -- one row per user
    file_path   TEXT NOT NULL,                    -- e.g. "avatars/1.webp"
    mime_type   VARCHAR(50) NOT NULL,             -- e.g. "image/webp"
    size_bytes  INT NOT NULL CHECK (size_bytes > 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_avatars_updated_at
    ON user_avatars(updated_at DESC);

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_avatars_updated_at ON user_avatars;
CREATE TRIGGER trg_user_avatars_updated_at
BEFORE UPDATE ON user_avatars
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
