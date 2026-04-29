package com.planify.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "sender_type", nullable = false)
    private String senderType; // "USER" sau "LOCATION"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}