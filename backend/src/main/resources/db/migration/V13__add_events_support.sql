-- Adăugări pentru locații
ALTER TABLE locations ADD COLUMN allows_events BOOLEAN DEFAULT FALSE;
ALTER TABLE locations ADD COLUMN max_event_capacity INT;

-- Tabel separat pentru tipurile de evenimente (dacă o locație are mai multe)
CREATE TABLE location_event_types (
                                      location_id BIGINT REFERENCES locations(id) ON DELETE CASCADE,
                                      event_type VARCHAR(255) NOT NULL,
                                      PRIMARY KEY (location_id, event_type)
);

-- Adăugări pentru rezervări
ALTER TABLE bookings ADD COLUMN is_event BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN guest_count INT;
-- Dacă nu ai deja coloane pentru custom start_time și end_time, ar trebui adăugate:
ALTER TABLE bookings ADD COLUMN event_start_time TIMESTAMP;
ALTER TABLE bookings ADD COLUMN event_end_time TIMESTAMP;