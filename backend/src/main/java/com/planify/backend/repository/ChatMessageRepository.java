package com.planify.backend.repository;

import com.planify.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.booking.id = :bookingId AND m.senderType != :myType AND m.isRead = false")
    void markAsRead(@Param("bookingId") Long bookingId, @Param("myType") String myType);

    // --- NOU: Comandă care șterge mesajele rezervărilor finalizate sau anulate ---
    @Modifying
    @Query(value = "DELETE FROM chat_messages WHERE booking_id IN (SELECT id FROM bookings WHERE status NOT IN ('PENDING', 'CONFIRMED'))", nativeQuery = true)
    void deleteMessagesFromInactiveBookings();
}