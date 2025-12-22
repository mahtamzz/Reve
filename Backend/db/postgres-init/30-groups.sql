CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'public',
    -- public | private | invite_only
    owner_uid       INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_owner_uid ON groups(owner_uid);
CREATE INDEX idx_groups_visibility ON groups(visibility);

CREATE TABLE group_members (
    group_id    UUID NOT NULL,
    uid         INT NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'member', -- owner | admin | member
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, uid),
    CONSTRAINT fk_group_members_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_group_members_uid ON group_members(uid);
CREATE INDEX idx_group_members_group_role ON group_members(group_id, role);



CREATE TABLE group_join_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL,
    uid         INT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at  TIMESTAMPTZ,
    CONSTRAINT fk_group_join_requests_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,
    CONSTRAINT uniq_group_join_request UNIQUE (group_id, uid)
);

CREATE INDEX idx_group_join_requests_uid ON group_join_requests(uid);


CREATE TABLE group_bans (
    group_id    UUID NOT NULL,
    uid         INT NOT NULL,
    -- banned_by   INT NOT NULL,
    reason      TEXT,
    banned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, uid),
    CONSTRAINT fk_group_bans_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

CREATE TABLE group_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL,
    actor_uid   INT NOT NULL,

    action      VARCHAR(50) NOT NULL,
    target_uid  UUID,
    metadata    JSONB,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_group_audit_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_group_audit_group ON group_audit_log(group_id);


-- CREATE TABLE group_invites (
--     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

--     group_id        UUID NOT NULL,
--     invited_uid     UUID NOT NULL,
--     invited_by_uid  UUID NOT NULL,

--     status          VARCHAR(20) NOT NULL DEFAULT 'pending',
--     -- pending | accepted | declined | expired

--     expires_at      TIMESTAMPTZ,
--     created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

--     CONSTRAINT fk_group_invites_group
--         FOREIGN KEY (group_id)
--         REFERENCES groups(id)
--         ON DELETE CASCADE,

--     CONSTRAINT uniq_group_invite UNIQUE (group_id, invited_uid)
-- );

-- CREATE INDEX idx_group_invites_invited_uid ON group_invites(invited_uid);
