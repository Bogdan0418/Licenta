ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP;

ALTER TABLE locations ADD COLUMN reset_token VARCHAR(255) UNIQUE;
ALTER TABLE locations ADD COLUMN reset_token_expires_at TIMESTAMP;