CREATE TABLE reviews (
        id              BIGSERIAL PRIMARY KEY,
        booking_id      BIGINT UNIQUE NOT NULL REFERENCES bookings(id),
        reviewer_type   VARCHAR(10) NOT NULL,  -- 'USER' sau 'LOCATION'
        rating          INT NOT NULL,
        comment         TEXT,
        is_reported     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_reviewer   CHECK (reviewer_type IN ('USER','LOCATION')),
        CONSTRAINT chk_rev_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Un review de tip USER = utilizatorul recenzeaza locația
-- Un review de tip LOCATION = locația recenzeaza utilizatorul
-- Ambele sunt legate de acelasi booking_id
-- UNIQUE pe booking_id + reviewer_type ca sa nu poti da review de doua ori

ALTER TABLE reviews ADD CONSTRAINT uq_booking_reviewer
        UNIQUE (booking_id, reviewer_type);