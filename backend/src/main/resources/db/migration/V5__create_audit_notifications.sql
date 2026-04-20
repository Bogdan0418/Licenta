CREATE TABLE audit_logs (
        id          BIGSERIAL PRIMARY KEY,
        admin_id    BIGINT NOT NULL REFERENCES users(id),
        action      VARCHAR(100) NOT NULL,
        target_type VARCHAR(20),   -- 'USER', 'LOCATION', 'REVIEW'
        target_id   BIGINT,
        details     TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
        id          BIGSERIAL PRIMARY KEY,
        user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
        location_id BIGINT REFERENCES locations(id) ON DELETE CASCADE,
        type        VARCHAR(30) NOT NULL,
        channel     VARCHAR(10) NOT NULL,  -- 'EMAIL' sau 'SMS'
        content     TEXT NOT NULL,
        sent        BOOLEAN NOT NULL DEFAULT FALSE,
        sent_at     TIMESTAMP,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_channel CHECK (channel IN ('EMAIL','SMS')),
        CONSTRAINT chk_recipient CHECK (
           (user_id IS NOT NULL AND location_id IS NULL) OR
           (user_id IS NULL AND location_id IS NOT NULL)
             )
);

CREATE INDEX idx_audit_admin     ON audit_logs(admin_id);
CREATE INDEX idx_audit_created   ON audit_logs(created_at DESC);
CREATE INDEX idx_notif_sent      ON notifications(sent, created_at);