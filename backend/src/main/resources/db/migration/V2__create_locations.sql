CREATE TABLE locations (
        id              BIGSERIAL PRIMARY KEY,
        public_id       VARCHAR(10) UNIQUE NOT NULL,
        owner_email     VARCHAR(100) UNIQUE NOT NULL,
        password_hash   VARCHAR(255) NOT NULL,

        -- Date legale (nevizibile public)
        company_name    VARCHAR(100) NOT NULL,
        cui             VARCHAR(20) UNIQUE NOT NULL,
        legal_address   VARCHAR(255) NOT NULL,
        contact_phone   VARCHAR(20) NOT NULL,

        -- Profil public
        display_name    VARCHAR(100) NOT NULL,
        type            VARCHAR(30) NOT NULL,
        address         VARCHAR(255) NOT NULL,
        latitude        NUMERIC(10,7),
        longitude       NUMERIC(10,7),
        description     TEXT,
        website         VARCHAR(255),
        public_phone    VARCHAR(20),

        -- Program (stocat ca JSON: {"MON":"10:00-22:00", "TUE":"10:00-22:00"...})
        schedule        JSONB,

        -- Social media
        instagram_url   VARCHAR(255),
        facebook_url    VARCHAR(255),

        -- Status si moderare
        status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        reject_reason   TEXT,
        blocked_reason  TEXT,

        -- Rating
        rating          NUMERIC(3,2) NOT NULL DEFAULT 0.00,
        rating_count    INT NOT NULL DEFAULT 0,

        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        verified_at     TIMESTAMP,

        CONSTRAINT chk_loc_type   CHECK (type IN
                                        ('RESTAURANT','BAR','CLUB','WORK_HUB','GARDEN','ROOFTOP')),
        CONSTRAINT chk_loc_status CHECK (status IN
                                        ('PENDING','VERIFIED','INACTIVE','BLOCKED'))
);

CREATE TABLE location_photos (
        id           BIGSERIAL PRIMARY KEY,
        location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        file_path    VARCHAR(255) NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        uploaded_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE location_facilities (
        id           BIGSERIAL PRIMARY KEY,
        location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        facility     VARCHAR(50) NOT NULL
);

CREATE TABLE user_favorites (
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id  BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        saved_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, location_id)
);

CREATE INDEX idx_locations_status   ON locations(status);
CREATE INDEX idx_locations_type     ON locations(type);
CREATE INDEX idx_locations_coords   ON locations(latitude, longitude);
CREATE INDEX idx_loc_photos_order   ON location_photos(location_id, display_order);