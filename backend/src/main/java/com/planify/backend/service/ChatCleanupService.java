package com.planify.backend.service;

import com.planify.backend.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(ChatCleanupService.class);
    private final ChatMessageRepository chatRepository;

    public ChatCleanupService(ChatMessageRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    // Această metodă va rula automat în fiecare noapte la ora 03:00 AM
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldChats() {
        logger.info("Începe procesul de curățare a conversațiilor vechi...");
        try {
            chatRepository.deleteMessagesFromInactiveBookings();
            logger.info("Conversațiile pentru rezervările inactive au fost șterse cu succes.");
        } catch (Exception e) {
            logger.error("Eroare la ștergerea conversațiilor vechi: ", e);
        }
    }
}