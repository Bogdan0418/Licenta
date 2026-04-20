CREATE TABLE venue_zones (
        id              BIGSERIAL PRIMARY KEY,
        location_id     BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        name            VARCHAR(100) NOT NULL,
        capacity        INT NOT NULL,  -- rezervari paralele maxime
        max_persons     INT NOT NULL,  -- persoane maxime per rezervare
        is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE zone_configs (
        id                       BIGSERIAL PRIMARY KEY,
        zone_id                  BIGINT UNIQUE NOT NULL
                REFERENCES venue_zones(id) ON DELETE CASCADE,
        slot_duration_minutes    INT NOT NULL DEFAULT 30,
        booking_duration_minutes INT NOT NULL,  -- 60, 90 sau 120
        open_time                TIME NOT NULL,
        close_time               TIME NOT NULL,
        active_days              INT NOT NULL DEFAULT 127,
    -- bitmask: Luni=1,Marti=2,Mier=4,Joi=8,Vin=16,Sam=32,Dum=64
    -- 127 = toate zilele active

        CONSTRAINT chk_booking_duration CHECK
            (booking_duration_minutes IN (60, 90, 120)),
        CONSTRAINT chk_slot_duration CHECK
            (slot_duration_minutes = 30),
        CONSTRAINT chk_times CHECK
            (close_time > open_time)
);

CREATE TABLE bookings (
        id              BIGSERIAL PRIMARY KEY,
        zone_id         BIGINT NOT NULL REFERENCES venue_zones(id),
        user_id         BIGINT NOT NULL REFERENCES users(id),
        booking_date    DATE NOT NULL,
        start_time      TIME NOT NULL,
        end_time        TIME NOT NULL,
        group_size      INT NOT NULL,
        status          VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
        cancelled_at    TIMESTAMP,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_booking_status CHECK (status IN
                                            ('CONFIRMED','CANCELLED_BY_USER','CANCELLED_NO_SHOW','COMPLETED')),
        CONSTRAINT chk_group_size CHECK (group_size >= 1),
        CONSTRAINT chk_times CHECK (end_time > start_time),
        CONSTRAINT uq_user_zone_slot
            UNIQUE (user_id, zone_id, booking_date, start_time)
);

CREATE INDEX idx_bookings_zone_date
    ON bookings(zone_id, booking_date);
CREATE INDEX idx_bookings_user
    ON bookings(user_id);
CREATE INDEX idx_bookings_status
    ON bookings(status);