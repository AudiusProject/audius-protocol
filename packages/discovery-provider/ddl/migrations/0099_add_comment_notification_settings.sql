begin;

CREATE TABLE IF NOT EXISTS comment_notification_settings (
    user_id INTEGER NOT NULL,
    entity_id INTEGER,
    entity_type TEXT,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (
        user_id,
        entity_id,
        entity_type
    )
);

commit;