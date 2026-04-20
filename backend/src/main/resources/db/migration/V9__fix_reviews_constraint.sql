-- Șterge constraint-ul greșit care permite doar un review per booking
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_key;

-- Adaugă constraint-ul corect: un review per booking per tip de reviewer
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS uq_booking_reviewer;

ALTER TABLE reviews ADD CONSTRAINT uq_booking_reviewer
    UNIQUE (booking_id, reviewer_type);