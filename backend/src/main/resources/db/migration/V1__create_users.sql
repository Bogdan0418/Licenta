CREATE TABLE users (
        id                  BIGSERIAL PRIMARY KEY,
        public_id           VARCHAR(10) UNIQUE NOT NULL,
        first_name          VARCHAR(50) NOT NULL,
        last_name           VARCHAR(50) NOT NULL,
        username            VARCHAR(50) UNIQUE NOT NULL,
        email               VARCHAR(100) UNIQUE NOT NULL,
        password_hash       VARCHAR(255) NOT NULL,
        phone               VARCHAR(20) UNIQUE NOT NULL,
        cnp_hash            VARCHAR(255) UNIQUE NOT NULL,
        birth_date          DATE NOT NULL,
        role                VARCHAR(20) NOT NULL DEFAULT 'USER',
        status              VARCHAR(20) NOT NULL DEFAULT 'UNCONFIRMED',
        rating              NUMERIC(3,2) NOT NULL DEFAULT 5.00,
        rating_count        INT NOT NULL DEFAULT 0,
        email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
        phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_role   CHECK (role IN ('USER', 'ADMIN')),
        CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'BLOCKED', 'UNCONFIRMED')),
        CONSTRAINT chk_rating CHECK (rating >= 1.00 AND rating <= 5.00)
);

CREATE TABLE verification_codes (
        id          BIGSERIAL PRIMARY KEY,
        user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code        VARCHAR(10) NOT NULL,
        type        VARCHAR(20) NOT NULL,  -- 'EMAIL' sau 'SMS'
        expires_at  TIMESTAMP NOT NULL,
        used        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_type CHECK (type IN ('EMAIL', 'SMS'))
);

CREATE TABLE admin_security (
        id                  BIGSERIAL PRIMARY KEY,
        user_id             BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recovery_keys_hash  TEXT NOT NULL,  -- JSON array de hash-uri
        mfa_last_used_at    TIMESTAMP
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_status   ON users(status);
CREATE INDEX idx_vcode_user     ON verification_codes(user_id);
CREATE INDEX idx_vcode_expires  ON verification_codes(expires_at);