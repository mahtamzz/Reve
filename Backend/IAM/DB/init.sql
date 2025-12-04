CREATE TABLE Users (
    id            SERIAL PRIMARY KEY,
	googleid     INT,
    username     VARCHAR(50),
    email          VARCHAR(100) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
	password    VARCHAR(255),
    -- pic            TEXT,
    weekly_goal    INT,
    xp             INT DEFAULT 0,
    streak         INT DEFAULT 0
);

CREATE TABLE Subject (
    id   SERIAL PRIMARY KEY,
    user_id    INT REFERENCES Users (id) ON DELETE CASCADE,
    name   VARCHAR(100) NOT NULL,
    duration   INTERVAL NOT NULL,
	CHECK (duration >= interval '0 seconds' AND duration < interval '24 hours')
);

CREATE TABLE Study_Session (
    session_id SERIAL PRIMARY KEY,
    user_id        INT REFERENCES Users (id) ON DELETE CASCADE,
    subject_id       INT REFERENCES Subject(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    duration   INTERVAL NOT NULL,
	CHECK (duration >= interval '0 seconds' AND duration < interval '24 hours')
);

CREATE VIEW User_Daily_Study_Time_View AS
SELECT user_id, date,
       SUM(duration) AS total_duration
FROM Study_Session
GROUP BY user_id, date;


CREATE TABLE "Group" (
    id          SERIAL PRIMARY KEY,
    admin_id    INT REFERENCES Users (id) ON DELETE SET NULL,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    weekly_xp    INT,
    minimum_dst  INT
);

CREATE TABLE User_Group (
    user_id    INT REFERENCES Users (id) ON DELETE CASCADE,
    group_id    INT REFERENCES "Group"(id) ON DELETE CASCADE,
    role   VARCHAR(50),
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE Message (
    id       SERIAL PRIMARY KEY,
    user_id        INT REFERENCES Users (id) ON DELETE CASCADE,
    group_id        INT REFERENCES "Group"(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    timestamp  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Challenge (
    id        SERIAL PRIMARY KEY,
    group_id         INT REFERENCES "Group"(id) ON DELETE CASCADE,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    deadline    DATE
);

CREATE TABLE User_Challenge (
    user_id     INT REFERENCES Users (id) ON DELETE CASCADE,
    challenge_id    INT REFERENCES Challenge(id) ON DELETE CASCADE,
    status  VARCHAR(50),
    PRIMARY KEY (user_id, challenge_id)
);

CREATE TABLE Follow (
    follower_id INT REFERENCES Users (id) ON DELETE CASCADE,
    followed_id INT REFERENCES Users (id) ON DELETE CASCADE,
    PRIMARY KEY (follower_id, followed_id)
);



-- DO $$ 
-- DECLARE 
--     r RECORD;
-- BEGIN 
--     FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
--         EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
--     END LOOP; 
-- END $$;