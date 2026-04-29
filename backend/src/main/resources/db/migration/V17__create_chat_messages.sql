CREATE TABLE chat_messages (
                               id BIGSERIAL PRIMARY KEY,
                               booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
                               sender_type VARCHAR(20) NOT NULL, -- Va fi 'USER' sau 'LOCATION'
                               content TEXT NOT NULL,
                               is_read BOOLEAN DEFAULT FALSE,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_booking ON chat_messages(booking_id);