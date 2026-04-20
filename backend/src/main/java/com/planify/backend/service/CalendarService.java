package com.planify.backend.service;

import com.planify.backend.dto.request.CreateBookingRequest;
import com.planify.backend.dto.request.CreateZoneRequest;
import com.planify.backend.dto.response.BookingResponse;
import com.planify.backend.dto.response.SlotResponse;
import com.planify.backend.entity.*;
import com.planify.backend.entity.enums.BookingStatus;
import com.planify.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarService {

    private final BookingRepository bookingRepository;
    private final VenueZoneRepository zoneRepository;
    private final ZoneConfigRepository configRepository;
    private final UserRepository userRepository;

    public CalendarService(BookingRepository bookingRepository,
                           VenueZoneRepository zoneRepository,
                           ZoneConfigRepository configRepository,
                           UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.zoneRepository = zoneRepository;
        this.configRepository = configRepository;
        this.userRepository = userRepository;
    }

    // Generare sloturi disponibile pentru o zi
    public List<SlotResponse> getAvailableSlots(Long zoneId, LocalDate date) {

        VenueZone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Zona nu a fost găsită"));

        ZoneConfig config = configRepository.findByZoneId(zoneId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Configurația zonei nu a fost găsită"));

        // Verifica daca ziua este activa (bitmask)
        int dayBit = 1 << (date.getDayOfWeek().getValue() - 1);
        if ((config.getActiveDays() & dayBit) == 0) {
            return List.of(); // Ziua nu este activă
        }

        // Incarca toate rezervarile zilei O SINGURA DATA
        List<Booking> rezervariZilei = bookingRepository
                .findConfirmedByZoneAndDate(zoneId, date);

        List<SlotResponse> sloturi = new ArrayList<>();
        LocalTime cursor = config.getOpenTime();
        int durata = config.getBookingDurationMinutes();
        int pas = config.getSlotDurationMinutes();

        while (!cursor.plusMinutes(durata).isAfter(config.getCloseTime())) {
            LocalTime slotEnd = cursor.plusMinutes(durata);
            final LocalTime slotStart = cursor;

            // Calculeaza ocuparea in memorie - fara query suplimentar
            long ocupate = rezervariZilei.stream()
                    .filter(b -> b.getStartTime().isBefore(slotEnd)
                            && b.getEndTime().isAfter(slotStart))
                    .count();

            int libere = zone.getCapacity() - (int) ocupate;

            sloturi.add(new SlotResponse(
                    slotStart,
                    slotEnd,
                    Math.max(libere, 0),
                    libere > 0
            ));

            cursor = cursor.plusMinutes(pas);
        }

        return sloturi;
    }

    // Creare rezervare cu toate validarile
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse createBooking(CreateBookingRequest req, Long userId) {

        // Pasul 1: format ora (trebuie sa fie :00 sau :30)
        if (req.startTime().getMinute() % 30 != 0) {
            throw new IllegalArgumentException(
                    "Ora trebuie să fie la fix (:00) sau la jumătate (:30)");
        }

        // Pasul 2: data nu poate fi in trecut
        if (req.bookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Nu poți rezerva în trecut");
        }

        VenueZone zone = zoneRepository.findById(req.zoneId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Zona nu a fost găsită"));

        ZoneConfig config = configRepository.findByZoneId(req.zoneId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Configurația zonei nu a fost găsită"));

        LocalTime endTime = req.startTime()
                .plusMinutes(config.getBookingDurationMinutes());

        // Pasul 3: interval în programul locatiei
        if (req.startTime().isBefore(config.getOpenTime()) ||
                endTime.isAfter(config.getCloseTime())) {
            throw new IllegalArgumentException(
                    "Intervalul ales este în afara programului locației");
        }

        // Pasul 4: group size fata de capacitatea per rezervare
        if (req.groupSize() > zone.getMaxPersons()) {
            throw new IllegalArgumentException(
                    "Grupul depășește capacitatea maximă a zonei ("
                            + zone.getMaxPersons() + " persoane)");
        }

        // Pasul 5: limita rezervari active per utilizator
        int activeBookings = bookingRepository.countActiveByUser(userId);
        if (activeBookings >= 5) {
            throw new IllegalArgumentException(
                    "Ai atins limita de 5 rezervări active simultane");
        }

        // Pasul 6: verificare disponibilitate cu lock
        int ocupate = bookingRepository.countOverlapping(
                req.zoneId(), req.bookingDate(),
                req.startTime(), endTime
        );

        if (ocupate >= zone.getCapacity()) {
            throw new IllegalArgumentException(
                    "Slotul ales nu mai are locuri disponibile");
        }

        // Pasul 7: salvare rezervare
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Utilizatorul nu a fost găsit"));

        Booking booking = new Booking();
        booking.setZone(zone);
        booking.setUser(user);
        booking.setBookingDate(req.bookingDate());
        booking.setStartTime(req.startTime());
        booking.setEndTime(endTime);
        booking.setGroupSize(req.groupSize());
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking saved = bookingRepository.save(booking);

        return toBookingResponse(saved);
    }

    // Anulare rezervare cu logica de 12h
    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long userId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Rezervarea nu a fost găsită"));

        // Verifica ca rezervarea ii apartine utilizatorului
        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Nu ai dreptul să anulezi această rezervare");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Rezervarea nu poate fi anulată");
        }

        LocalDateTime bookingDateTime = LocalDateTime.of(
                booking.getBookingDate(),
                booking.getStartTime()
        );

        long oreRamase = ChronoUnit.HOURS.between(
                LocalDateTime.now(), bookingDateTime);

        booking.setStatus(BookingStatus.CANCELLED_BY_USER);
        booking.setCancelledAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // Penalizare rating daca e cu mai putin de 12h inainte
        if (oreRamase < 12) {
            User user = booking.getUser();
            applyRatingPenalty(user, -0.5,
                    "Anulare tardivă (mai puțin de 12h înainte)");
            userRepository.save(user);
        }

        return toBookingResponse(booking);
    }

    // Marcare no-show de catre locatie
    @Transactional
    public void markNoShow(Long bookingId, Long locationId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Rezervarea nu a fost găsită"));

        // Verifica ca rezervarea este a acestei locatii
        if (!booking.getZone().getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException(
                    "Nu ai dreptul să modifici această rezervare");
        }

        // No-show se poate marca doar dupa ora de start
        LocalDateTime startDateTime = LocalDateTime.of(
                booking.getBookingDate(),
                booking.getStartTime()
        );

        if (LocalDateTime.now().isBefore(startDateTime)) {
            throw new IllegalArgumentException(
                    "Nu poți marca no-show înainte de ora rezervării");
        }

        booking.setStatus(BookingStatus.CANCELLED_NO_SHOW);
        booking.setCancelledAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // Penalizare -1 stea
        User user = booking.getUser();
        applyRatingPenalty(user, -1.0, "Neprezentare la rezervare");
        userRepository.save(user);
    }

    // Creare zona noua pentru o locatie
    @Transactional
    public VenueZone createZone(CreateZoneRequest req, Long locationId) {

        Location location = new Location();
        location.setId(locationId);

        VenueZone zone = new VenueZone();
        zone.setLocation(location);
        zone.setName(req.name());
        zone.setCapacity(req.capacity());
        zone.setMaxPersons(req.maxPersons());
        zone.setIsActive(true);

        VenueZone savedZone = zoneRepository.save(zone);

        // Creeaza configuratia zonei
        ZoneConfig config = new ZoneConfig();
        config.setZone(savedZone);
        config.setSlotDurationMinutes(30);
        config.setBookingDurationMinutes(req.bookingDurationMinutes());
        config.setOpenTime(LocalTime.parse(req.openTime()));
        config.setCloseTime(LocalTime.parse(req.closeTime()));
        config.setActiveDays(127); // toate zilele active implicit
        configRepository.save(config);

        return savedZone;
    }

    // Rezervarile unui utilizator
    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository
                .findByUserIdOrderByBookingDateDescStartTimeDesc(userId)
                .stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    // Agenda zilnica a locatiei
    public List<BookingResponse> getLocationAgenda(Long locationId,
                                                   LocalDate date) {
        return bookingRepository
                .findByLocationAndDate(locationId, date)
                .stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    // Helper: aplicare penalizare rating
    private void applyRatingPenalty(User user, double penalty, String reason) {
        double newRating = user.getRating().doubleValue() + penalty;
        newRating = Math.max(1.0, Math.min(5.0, newRating));
        user.setRating(new java.math.BigDecimal(
                String.format("%.2f", newRating)));
    }

    // Helper: conversie Booking -> BookingResponse
    private BookingResponse toBookingResponse(Booking b) {
        LocalDateTime bookingDateTime = LocalDateTime.of(
                b.getBookingDate(), b.getStartTime());
        long oreRamase = ChronoUnit.HOURS.between(
                LocalDateTime.now(), bookingDateTime);

        boolean canCancel = b.getStatus() == BookingStatus.CONFIRMED;
        boolean canReview = b.getStatus() == BookingStatus.COMPLETED;

        return new BookingResponse(
                b.getId(),
                b.getZone().getLocation().getDisplayName(),
                b.getZone().getName(),
                b.getBookingDate(),
                b.getStartTime(),
                b.getEndTime(),
                b.getGroupSize(),
                b.getStatus(),
                canCancel,
                canReview
        );
    }
}
