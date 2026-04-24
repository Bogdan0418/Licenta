package com.planify.backend.service;

import com.planify.backend.dto.request.CreateBookingRequest;
import com.planify.backend.dto.request.CreateZoneRequest;
import com.planify.backend.dto.response.BookingResponse;
import com.planify.backend.dto.response.SlotResponse;
import com.planify.backend.dto.response.ZoneSummaryResponse;
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
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CalendarService {

    private final BookingRepository bookingRepository;
    private final VenueZoneRepository zoneRepository;
    private final ZoneConfigRepository configRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public CalendarService(BookingRepository bookingRepository,
                           VenueZoneRepository zoneRepository,
                           ZoneConfigRepository configRepository,
                           UserRepository userRepository,
                           EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.zoneRepository = zoneRepository;
        this.configRepository = configRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // --- ZONES CRUD ---

    @Transactional(readOnly = true)
    public List<ZoneSummaryResponse> getLocationZones(Long locationId) {
        return zoneRepository.findByLocationIdAndIsActiveTrue(locationId)
                .stream()
                .map(z -> {
                    ZoneConfig config = configRepository.findByZoneId(z.getId()).orElse(null);
                    return new ZoneSummaryResponse(
                            z.getId(),
                            z.getName(),
                            z.getCapacity(),
                            z.getMaxPersons(),
                            config != null ? config.getAllowedDurationsList() : List.of(60),
                            config != null ? config.getSchedule() : Map.of()
                    );
                })
                .collect(Collectors.toList());
    }

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

        ZoneConfig config = new ZoneConfig();
        config.setZone(savedZone);
        config.setSlotDurationMinutes(30);
        config.setAllowedDurationsList(req.allowedDurations());
        config.setSchedule(req.schedule());
        configRepository.save(config);

        return savedZone;
    }

    @Transactional
    public void updateZone(Long zoneId, CreateZoneRequest req, Long locationId) {
        VenueZone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Zona nu a fost găsită"));

        if (!zone.getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException("Nu aveți permisiunea de a edita această zonă");
        }

        zone.setName(req.name());
        zone.setCapacity(req.capacity());
        zone.setMaxPersons(req.maxPersons());
        zoneRepository.save(zone);

        ZoneConfig config = configRepository.findByZoneId(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Configurația zonei nu a fost găsită"));

        config.setAllowedDurationsList(req.allowedDurations());
        config.setSchedule(req.schedule());
        configRepository.save(config);
    }

    @Transactional
    public void deleteZone(Long zoneId, Long locationId) {
        VenueZone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Zona nu a fost găsită"));

        if (!zone.getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException("Nu aveți permisiunea de a șterge această zonă");
        }

        zone.setIsActive(false);
        zoneRepository.save(zone);
    }

    // --- SLOTS & BOOKINGS ---

    public List<SlotResponse> getAvailableSlots(Long zoneId, LocalDate date, Integer requestedDuration) {
        VenueZone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Zona nu a fost găsită"));

        ZoneConfig config = configRepository.findByZoneId(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("Configurația zonei nu a fost găsită"));

        if (!config.getAllowedDurationsList().contains(requestedDuration)) {
            return List.of();
        }

        String dayKey = date.getDayOfWeek().name().substring(0, 3).toUpperCase();
        Map<String, String> schedule = config.getSchedule();
        String scheduleForDay = (schedule != null) ? schedule.get(dayKey) : null;

        if (scheduleForDay == null || scheduleForDay.equalsIgnoreCase("Închis") || scheduleForDay.isBlank()) {
            return List.of();
        }

        String[] timeParts = scheduleForDay.split("-");
        if (timeParts.length != 2) return List.of();

        LocalTime openTime = LocalTime.parse(timeParts[0]);
        LocalTime closeTime = LocalTime.parse(timeParts[1]);

        int openMin = openTime.getHour() * 60 + openTime.getMinute();
        int closeMin = closeTime.getHour() * 60 + closeTime.getMinute();
        if (closeMin <= openMin) {
            closeMin += 24 * 60;
        }

        List<Booking> rezervariZilei = bookingRepository.findConfirmedByZoneAndDate(zoneId, date);
        List<SlotResponse> sloturi = new ArrayList<>();
        int pas = config.getSlotDurationMinutes();

        for (int cursorMin = openMin; cursorMin + requestedDuration <= closeMin; cursorMin += pas) {
            int slotStartMin = cursorMin;
            int slotEndMin = cursorMin + requestedDuration;

            int ocupate = 0;
            for (Booking b : rezervariZilei) {
                int bS = b.getStartTime().getHour() * 60 + b.getStartTime().getMinute();
                if (bS < openMin) bS += 24 * 60;

                int bE = b.getEndTime().getHour() * 60 + b.getEndTime().getMinute();
                if (bE <= openMin || bE < bS) bE += 24 * 60;

                if (bS < slotEndMin && bE > slotStartMin) {
                    // REPARAT AICI: Acum adunăm numărul de persoane, nu o singură unitate
                    ocupate += b.getGroupSize();
                }
            }

            int libere = zone.getCapacity() - ocupate;

            int hStart = (slotStartMin / 60) % 24;
            int mStart = slotStartMin % 60;
            LocalTime slotStart = LocalTime.of(hStart, mStart);

            int hEnd = (slotEndMin / 60) % 24;
            int mEnd = slotEndMin % 60;
            LocalTime slotEnd = LocalTime.of(hEnd, mEnd);

            sloturi.add(new SlotResponse(slotStart, slotEnd, Math.max(libere, 0), libere > 0));
        }
        return sloturi;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse createBooking(CreateBookingRequest req, Long userId) {
        if (req.startTime().getMinute() % 30 != 0) {
            throw new IllegalArgumentException("Ora trebuie să fie la fix (:00) sau la jumătate (:30)");
        }
        if (req.bookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Nu poți rezerva în trecut");
        }

        VenueZone zone = zoneRepository.findById(req.zoneId())
                .orElseThrow(() -> new IllegalArgumentException("Zona nu a fost găsită"));

        ZoneConfig config = configRepository.findByZoneId(req.zoneId())
                .orElseThrow(() -> new IllegalArgumentException("Configurația zonei nu a fost găsită"));

        if (!config.getAllowedDurationsList().contains(req.duration())) {
            throw new IllegalArgumentException("Durata aleasă nu este permisă pentru această zonă");
        }

        String dayKey = req.bookingDate().getDayOfWeek().name().substring(0, 3).toUpperCase();
        Map<String, String> schedule = config.getSchedule();
        String scheduleForDay = (schedule != null) ? schedule.get(dayKey) : null;

        if (scheduleForDay == null || scheduleForDay.equalsIgnoreCase("Închis") || scheduleForDay.isBlank()) {
            throw new IllegalArgumentException("Zona este închisă în această zi");
        }

        String[] timeParts = scheduleForDay.split("-");
        LocalTime openTime = LocalTime.parse(timeParts[0]);
        LocalTime closeTime = LocalTime.parse(timeParts[1]);

        int openMin = openTime.getHour() * 60 + openTime.getMinute();
        int closeMin = closeTime.getHour() * 60 + closeTime.getMinute();
        if (closeMin <= openMin) closeMin += 24 * 60;

        int reqStartMin = req.startTime().getHour() * 60 + req.startTime().getMinute();
        if (reqStartMin < openMin) reqStartMin += 24 * 60;

        int reqEndMin = reqStartMin + req.duration();

        if (reqStartMin < openMin || reqEndMin > closeMin) {
            throw new IllegalArgumentException("Intervalul ales este în afara programului zonei pentru ziua selectată");
        }

        if (req.groupSize() > zone.getMaxPersons()) {
            throw new IllegalArgumentException("Grupul depășește capacitatea maximă a zonei (" + zone.getMaxPersons() + " persoane)");
        }

        int activeBookings = bookingRepository.countActiveByUser(userId);
        if (activeBookings >= 5) {
            throw new IllegalArgumentException("Ai atins limita de 5 rezervări active simultane");
        }

        List<Booking> rezervariZilei = bookingRepository.findConfirmedByZoneAndDate(req.zoneId(), req.bookingDate());
        int ocupate = 0;
        for (Booking b : rezervariZilei) {
            int bS = b.getStartTime().getHour() * 60 + b.getStartTime().getMinute();
            if (bS < openMin) bS += 24 * 60;

            int bE = b.getEndTime().getHour() * 60 + b.getEndTime().getMinute();
            if (bE <= openMin || bE < bS) bE += 24 * 60;

            if (bS < reqEndMin && bE > reqStartMin) {
                // REPARAT AICI: Scădem numărul corect de persoane
                ocupate += b.getGroupSize();
            }
        }

        // REPARAT AICI: Verificăm dacă mai încap în funcție de capacitate
        if (ocupate + req.groupSize() > zone.getCapacity()) {
            throw new IllegalArgumentException("Slotul ales nu mai are locuri disponibile pentru " + req.groupSize() + " persoane");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilizatorul nu a fost găsit"));

        int hEnd = (reqEndMin / 60) % 24;
        int mEnd = reqEndMin % 60;
        LocalTime endTime = LocalTime.of(hEnd, mEnd);

        Booking booking = new Booking();
        booking.setZone(zone);
        booking.setUser(user);
        booking.setBookingDate(req.bookingDate());
        booking.setStartTime(req.startTime());
        booking.setEndTime(endTime);
        booking.setGroupSize(req.groupSize());
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking saved = bookingRepository.save(booking);

        try {
            String locationName = zone.getLocation().getDisplayName();

            String htmlMessage = emailService.buildBookingTemplate(
                    user.getFirstName(),
                    locationName,
                    saved.getBookingDate().toString(),
                    saved.getStartTime().toString(),
                    zone.getName()
            );

            emailService.sendHtmlEmail(
                    user.getEmail(),
                    "Confirmare Rezervare - " + locationName,
                    htmlMessage
            );
        } catch (Exception e) {
            System.err.println("Rezervarea a fost creată, dar email-ul nu a putut fi trimis: " + e.getMessage());
        }

        return toBookingResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu a fost găsită"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Nu ai dreptul să anulezi această rezervare");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Rezervarea nu poate fi anulată");
        }

        LocalDateTime bookingDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        long oreRamase = ChronoUnit.HOURS.between(LocalDateTime.now(), bookingDateTime);

        booking.setStatus(BookingStatus.CANCELLED_BY_USER);
        booking.setCancelledAt(LocalDateTime.now());
        bookingRepository.save(booking);

        if (oreRamase < 12) {
            User user = booking.getUser();
            applyRatingPenalty(user, -0.5, "Anulare tardivă (mai puțin de 12h înainte)");
            userRepository.save(user);
        }
        return toBookingResponse(booking);
    }

    @Transactional
    public void markNoShow(Long bookingId, Long locationId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu a fost găsită"));

        if (!booking.getZone().getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException("Nu ai dreptul să modifici această rezervare");
        }

        LocalDateTime startDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        if (LocalDateTime.now().isBefore(startDateTime)) {
            throw new IllegalArgumentException("Nu poți marca no-show înainte de ora rezervării");
        }

        booking.setStatus(BookingStatus.CANCELLED_NO_SHOW);
        booking.setCancelledAt(LocalDateTime.now());
        bookingRepository.save(booking);

        User user = booking.getUser();
        applyRatingPenalty(user, -1.0, "Neprezentare la rezervare");
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository
                .findByUserIdOrderByBookingDateDescStartTimeDesc(userId)
                .stream().map(this::toBookingResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getLocationAgenda(Long locationId, LocalDate date) {
        return bookingRepository
                .findByLocationAndDate(locationId, date)
                .stream().map(this::toBookingResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getLocationBookings(Long locationId) {
        return bookingRepository
                .findByZoneLocationIdOrderByBookingDateDescStartTimeDesc(locationId)
                .stream().map(this::toBookingResponse).collect(Collectors.toList());
    }

    private void applyRatingPenalty(User user, double penalty, String reason) {
        double newRating = user.getRating().doubleValue() + penalty;
        newRating = Math.max(1.0, Math.min(5.0, newRating));
        user.setRating(new java.math.BigDecimal(String.format("%.2f", newRating)));
    }

    private BookingResponse toBookingResponse(Booking b) {
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