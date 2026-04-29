-- Ștergem vechea regulă restrictivă
ALTER TABLE bookings DROP CONSTRAINT chk_booking_status;

-- Adăugăm regula actualizată care include PENDING și REJECTED
ALTER TABLE bookings ADD CONSTRAINT chk_booking_status
    CHECK (status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_NO_SHOW', 'PENDING', 'REJECTED'));