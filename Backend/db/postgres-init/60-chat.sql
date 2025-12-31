\connect chat_db;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE chat_messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           UUID NOT NULL,
    sender_uid         INT NOT NULL,
    text              TEXT NOT NULL,
    client_message_id  TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_group_time
    ON chat_messages (group_id, created_at DESC);

-- Optional but good: dedupe client retries (helps when socket reconnects)
CREATE UNIQUE INDEX uniq_chat_messages_client_msg
    ON chat_messages (group_id, sender_uid, client_message_id)
    WHERE client_message_id IS NOT NULL;

-- Event consumer idempotency (RabbitMQ is typically at-least-once)
CREATE TABLE chat_processed_events (
    event_id      UUID PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_processed_events_type_time
    ON chat_processed_events (event_type, processed_at DESC);


-- “Because message delivery and event processing are unreliable by nature,
--  the Chat service implements idempotency mechanisms. 
--  Client messages include a client-generated ID to prevent duplicate storage
--  during retries. Additionally, all consumed events are tracked to ensure 
--  each event is applied only once, even if redelivered by the message broker.”