package com.planify.backend.scheduler;

import com.planify.backend.entity.Booking;
import com.planify.backend.entity.enums.BookingStatus;
import com.planify.backend.repository.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class BookingScheduler {

    private final BookingRepository bookingRepository;

    public BookingScheduler(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // Ruleaza la fiecare 30 de minute
    // Marcheaza ca COMPLETED rezervarile terminate
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void markCompletedBookings() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Booking> confirmedBookings = bookingRepository
                .findAll()
                .stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> {
                    // Determinam data reala de sfarsit (fallback pe bookingDate pentru rezervari normale)
                    LocalDate effectiveEndDate = b.getEventEndDate() != null
                            ? b.getEventEndDate()
                            : b.getBookingDate();

                    // Verificam in functie de data de sfarsit
                    return effectiveEndDate.isBefore(today) ||
                            (effectiveEndDate.isEqual(today) && b.getEndTime().isBefore(now));
                })
                .toList();

        confirmedBookings.forEach(b -> b.setStatus(BookingStatus.COMPLETED));
        bookingRepository.saveAll(confirmedBookings);
    }
}