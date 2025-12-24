\connect study_db;

CREATE TABLE IF NOT EXISTS subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid     INT,
  name          VARCHAR(80) NOT NULL,
  color         VARCHAR(16),                  -- optional (e.g. "#AABBCC")
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_subject_owner_name UNIQUE (owner_uid, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_owner_uid ON subjects(owner_uid);

-- Keep updated_at fresh (optional, can also be done in app code)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON subjects;
CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TABLE IF NOT EXISTS study_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid           INT NOT NULL,
  subject_id    UUID NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_mins INT NOT NULL CHECK (duration_mins > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_sessions_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_uid_time ON study_sessions(uid, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);


CREATE TABLE IF NOT EXISTS subject_DST (
  uid           INT NOT NULL,
  day           DATE NOT NULL,
  subject_id    UUID NOT NULL,
  duration_mins INT NOT NULL DEFAULT 0 CHECK (duration_mins >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (uid, day, subject_id),

  CONSTRAINT fk_dst_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subject_dst ON subject_DST(uid, day DESC);

CREATE OR REPLACE VIEW user_DST AS
SELECT
  uid,
  day,
  SUM(duration_mins)::INT AS total_duration_mins
FROM subject_DST
GROUP BY uid, day;


-- =========================
-- User stats (XP, streak, goals)
-- =========================
-- Keep streak + xp in one place that the service owns.
-- Streak fields can be recomputed from daily_study_time if needed.
CREATE TABLE IF NOT EXISTS user_study_stats (
  uid                INT PRIMARY KEY,
  weekly_goal_mins   INT NOT NULL DEFAULT 0 CHECK (weekly_goal_mins >= 0),
  xp_total           INT NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  streak_current     INT NOT NULL DEFAULT 0 CHECK (streak_current >= 0),
  streak_best        INT NOT NULL DEFAULT 0 CHECK (streak_best >= 0),
  streak_last_day    DATE NULL,  -- last day counted toward streak
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stats_updated ON user_study_stats(updated_at DESC);


CREATE TABLE IF NOT EXISTS study_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid         INT NOT NULL,
  action      VARCHAR(50) NOT NULL,         -- e.g. "session.logged", "goal.updated"
  subject_id  UUID NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_audit_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_study_audit_uid ON study_audit_log(uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_audit_action ON study_audit_log(action);