    CREATE TABLE Users (
        id            SERIAL PRIMARY KEY,
        email          VARCHAR(100) UNIQUE NOT NULL,
        googleid     TEXT,
        username     VARCHAR(50),
        password    VARCHAR(255)
    );

    CREATE TABLE Audit_Log (
        id          SERIAL PRIMARY KEY,
        user_id     INT REFERENCES Users(id) ON DELETE SET NULL,
        action      VARCHAR(100) NOT NULL,
        entity      VARCHAR(50),
        entity_id   INT,
        details     JSONB,
        ip_address  TEXT,
        user_agent  TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE Admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        -- role VARCHAR(50) DEFAULT 'admin', 
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
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


