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

import com.planify.backend.dto.response.DashboardChartsResponse;
import com.planify.backend.dto.response.DashboardChartsResponse.DailyStatsResponse;
import com.planify.backend.dto.response.DashboardChartsResponse.HourlyStatsResponse;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.LinkedHashMap;

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

        LocalTime endTime;
        BookingStatus initialStatus;

        // --- LOGICĂ EVENIMENTE ---
        if (req.isEvent()) {
            if (req.endTime() == null) {
                throw new IllegalArgumentException("Ora de sfârșit este obligatorie pentru evenimente");
            }
            if (req.eventEndDate() == null) {
                throw new IllegalArgumentException("Data de sfârșit este obligatorie pentru evenimente");
            }
            if (req.eventEndDate().isBefore(req.bookingDate())) {
                throw new IllegalArgumentException("Data de sfârșit a evenimentului nu poate fi înaintea datei de început.");
            }

            // APELĂM NOUA METODĂ DE VALIDARE AICI:
            validateEventSchedule(req.bookingDate(), req.eventEndDate(), req.startTime(), req.endTime(), config);

            endTime = req.endTime();
            initialStatus = BookingStatus.PENDING;
        }
        // --- LOGICĂ REZERVĂRI NORMALE ---
        else {
            if (req.duration() == null || !config.getAllowedDurationsList().contains(req.duration())) {
                throw new IllegalArgumentException("Durata aleasă nu este permisă pentru această zonă");
            }

            int reqEndMin = reqStartMin + req.duration();
            if (reqStartMin < openMin || reqEndMin > closeMin) {
                throw new IllegalArgumentException("Intervalul ales este în afara programului zonei pentru ziua selectată");
            }

            if (req.groupSize() > zone.getMaxPersons()) {
                throw new IllegalArgumentException("Grupul depășește capacitatea maximă a zonei (" + zone.getMaxPersons() + " persoane)");
            }

            List<Booking> rezervariZilei = bookingRepository.findConfirmedByZoneAndDate(req.zoneId(), req.bookingDate());
            int ocupate = 0;
            for (Booking b : rezervariZilei) {
                int bS = b.getStartTime().getHour() * 60 + b.getStartTime().getMinute();
                if (bS < openMin) bS += 24 * 60;

                int bE = b.getEndTime().getHour() * 60 + b.getEndTime().getMinute();
                if (bE <= openMin || bE < bS) bE += 24 * 60;

                if (bS < reqEndMin && bE > reqStartMin) {
                    ocupate += b.getGroupSize();
                }
            }

            if (ocupate + req.groupSize() > zone.getCapacity()) {
                throw new IllegalArgumentException("Slotul ales nu mai are locuri disponibile pentru " + req.groupSize() + " persoane");
            }

            int hEnd = (reqEndMin / 60) % 24;
            int mEnd = reqEndMin % 60;
            endTime = LocalTime.of(hEnd, mEnd);
            initialStatus = BookingStatus.CONFIRMED;
        }

        int activeBookings = bookingRepository.countActiveByUser(userId);
        if (activeBookings >= 5) {
            throw new IllegalArgumentException("Ai atins limita de 5 rezervări active simultane");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilizatorul nu a fost găsit"));

        Booking booking = new Booking();
        booking.setZone(zone);
        booking.setUser(user);
        booking.setBookingDate(req.bookingDate());
        booking.setStartTime(req.startTime());
        booking.setEndTime(endTime);
        booking.setGroupSize(req.groupSize());
        booking.setStatus(initialStatus);

        // Salvăm detaliile suplimentare
        if (req.isEvent()) {
            booking.setEventEndDate(req.eventEndDate() != null ? req.eventEndDate() : req.bookingDate());
            booking.setEventDescription(req.eventDescription());
            booking.setSpecialRequests(req.specialRequests());
        }

        Booking saved = bookingRepository.save(booking);

        if (initialStatus == BookingStatus.CONFIRMED) {
            try {
                String locationName = zone.getLocation().getDisplayName();
                String htmlMessage = emailService.buildBookingTemplate(
                        user.getFirstName(), locationName, saved.getBookingDate().toString(),
                        saved.getStartTime().toString(), zone.getName());
                emailService.sendHtmlEmail(user.getEmail(), "Confirmare Rezervare - " + locationName, htmlMessage);
            } catch (Exception e) {
                System.err.println("Rezervarea a fost creată, dar email-ul nu a putut fi trimis: " + e.getMessage());
            }
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
                canReview,
                b.getEventEndDate(),
                b.getEventDescription(),
                b.getSpecialRequests()
        );
    }

    @Transactional
    public void approveBooking(Long bookingId, Long locationId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu a fost găsită"));

        if (!booking.getZone().getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException("Nu aveți permisiunea de a aproba această rezervare");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Doar rezervările în așteptare pot fi aprobate");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Opțional: Trimite un email utilizatorului că evenimentul i-a fost aprobat
        try {
            User user = booking.getUser();
            String locationName = booking.getZone().getLocation().getDisplayName();
            String htmlMessage = emailService.buildBookingTemplate(
                    user.getFirstName(), locationName, booking.getBookingDate().toString(),
                    booking.getStartTime().toString(), booking.getZone().getName());
            emailService.sendHtmlEmail(user.getEmail(), "Aprobată: Cerere Eveniment - " + locationName, htmlMessage);
        } catch (Exception e) {
            System.err.println("Email-ul de aprobare nu a putut fi trimis: " + e.getMessage());
        }
    }

    @Transactional
    public void rejectBooking(Long bookingId, Long locationId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu a fost găsită"));

        if (!booking.getZone().getLocation().getId().equals(locationId)) {
            throw new IllegalArgumentException("Nu aveți permisiunea de a respinge această rezervare");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Doar rezervările în așteptare pot fi respinse");
        }

        booking.setStatus(BookingStatus.REJECTED);
        bookingRepository.save(booking);

        // Opțional: Aici poți trimite un email că locația nu poate găzdui evenimentul
    }

    private void validateEventSchedule(LocalDate startDate, LocalDate endDate,
                                       LocalTime startTime, LocalTime endTime,
                                       ZoneConfig config) {

        Map<String, String> schedule = config.getSchedule();
        if (schedule == null || schedule.isEmpty()) {
            throw new IllegalArgumentException("Această zonă nu are un program definit.");
        }

        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            String dayKey = currentDate.getDayOfWeek().name().substring(0, 3).toUpperCase();
            String scheduleForDay = schedule.get(dayKey);

            // 1. Verificăm dacă locația e închisă în acea zi
            if (scheduleForDay == null || scheduleForDay.equalsIgnoreCase("Închis") || scheduleForDay.isBlank()) {
                throw new IllegalArgumentException("Nu se pot ține evenimente. Locația este închisă în ziua de " + dayOfWeekToRomanian(currentDate.getDayOfWeek()) + " (" + currentDate + ").");
            }

            String[] timeParts = scheduleForDay.split("-");
            LocalTime openTime = LocalTime.parse(timeParts[0]);
            LocalTime closeTime = LocalTime.parse(timeParts[1]);

            // 2. Prima zi a evenimentului
            if (currentDate.isEqual(startDate)) {
                if (startTime.isBefore(openTime)) {
                    throw new IllegalArgumentException("Evenimentul începe prea devreme pe " + currentDate + ". Locația se deschide la " + openTime);
                }

                // Dacă e eveniment de o singură zi
                if (startDate.isEqual(endDate)) {
                    if (endTime.isAfter(closeTime)) {
                        throw new IllegalArgumentException("Evenimentul se termină prea târziu pe " + currentDate + ". Locația se închide la " + closeTime);
                    }
                    if (startTime.isAfter(endTime)) {
                        throw new IllegalArgumentException("Ora de început trebuie să fie înaintea orei de sfârșit.");
                    }
                }
            }

            // 3. Ultima zi a evenimentului (dacă e pe mai multe zile)
            if (currentDate.isEqual(endDate) && !startDate.isEqual(endDate)) {
                if (endTime.isAfter(closeTime)) {
                    throw new IllegalArgumentException("Evenimentul se termină prea târziu pe " + currentDate + ". Locația se închide la " + closeTime);
                }
                if (endTime.isBefore(openTime)) {
                    throw new IllegalArgumentException("Ora de final setată pe " + currentDate + " este înainte de deschiderea locației (" + openTime + ").");
                }
            }

            currentDate = currentDate.plusDays(1);
        }
    }

    // Metodă helper pentru mesaje de eroare mai prietenoase
    private String dayOfWeekToRomanian(java.time.DayOfWeek day) {
        switch (day) {
            case MONDAY: return "Luni";
            case TUESDAY: return "Marți";
            case WEDNESDAY: return "Miercuri";
            case THURSDAY: return "Joi";
            case FRIDAY: return "Vineri";
            case SATURDAY: return "Sâmbătă";
            case SUNDAY: return "Duminică";
            default: return day.name();
        }
    }

    @Transactional(readOnly = true)
    public DashboardChartsResponse getDashboardChartsData(Long locationId) {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6); // Ultimele 7 zile inclusiv azi
        LocalDate thirtyDaysAgo = today.minusDays(30);

        List<BookingStatus> validStatuses = List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

        // 1. Calcul pentru Graficul de Evoluție (Ultimele 7 zile)
        List<Booking> recentBookings = bookingRepository.findByZoneLocationIdAndBookingDateBetweenAndStatusIn(
                locationId, sevenDaysAgo, today, validStatuses
        );

        // Inițializăm un Map cu 0 pentru toate cele 7 zile (ca graficul să nu aibă "găuri" dacă nu sunt rezervări)
        Map<LocalDate, int[]> dailyStatsMap = new LinkedHashMap<>();
        for (int i = 0; i <= 6; i++) {
            dailyStatsMap.put(sevenDaysAgo.plusDays(i), new int[]{0, 0}); // index 0 = rezervări, 1 = clienți
        }

        // Populăm cu datele reale
        for (Booking b : recentBookings) {
            int[] stats = dailyStatsMap.get(b.getBookingDate());
            if (stats != null) {
                stats[0] += 1; // Creștem nr de rezervări
                stats[1] += b.getGroupSize(); // Adăugăm numărul de clienți
            }
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMM", new Locale("ro", "RO"));
        List<DashboardChartsResponse.DailyStatsResponse> evolutionData = dailyStatsMap.entrySet().stream()
                .map(entry -> new DashboardChartsResponse.DailyStatsResponse(
                        entry.getKey().format(formatter), // ex: "6 Mai"
                        entry.getValue()[0],
                        entry.getValue()[1]
                )).toList();

        // 2. Calcul pentru Graficul cu Orele de Vârf (Ultimele 30 zile)
        List<Booking> monthBookings = bookingRepository.findByZoneLocationIdAndBookingDateBetweenAndStatusIn(
                locationId, thirtyDaysAgo, today, validStatuses
        );

        // Mapăm ora de început (0-23) la numărul total de clienți (trafic)
        Map<Integer, Integer> hourlyStatsMap = new LinkedHashMap<>();

        // Inițializăm orele uzuale (de ex: de la 08:00 la 23:00) ca să arate bine pe grafic
        for (int i = 0; i <= 23; i++) {
            hourlyStatsMap.put(i, 0);
        }

        // ITERĂM PRIN TOATĂ DURATA REZERVĂRII
        for (Booking b : monthBookings) {
            int startHour = b.getStartTime().getHour();
            int endHour = b.getEndTime().getHour();

            // Dacă locația are program de noapte și se termină a doua zi (ex: 22:00 -> 03:00)
            if (endHour <= startHour && !b.getStartTime().equals(b.getEndTime())) {
                endHour += 24;
            }

            // Dacă rezervarea este scurtă, în cadrul aceleiași ore
            if (startHour == endHour) {
                hourlyStatsMap.put(startHour, hourlyStatsMap.getOrDefault(startHour, 0) + b.getGroupSize());
            } else {
                // Adăugăm grupul pentru FIECARE oră petrecută în locație
                for (int i = startHour; i < endHour; i++) {
                    int actualHour = i % 24; // Menținem ora între 0 și 23
                    hourlyStatsMap.put(actualHour, hourlyStatsMap.getOrDefault(actualHour, 0) + b.getGroupSize());
                }
            }
        }

        List<DashboardChartsResponse.HourlyStatsResponse> peakHoursData = hourlyStatsMap.entrySet().stream()
                .map(entry -> new DashboardChartsResponse.HourlyStatsResponse(
                        String.format("%02d:00", entry.getKey()), // ex: "14:00"
                        entry.getValue()
                ))
                // Sortăm cronologic normal (00:00 prima, 23:00 ultima)
                .sorted((a, b) -> {
                    int hourA = Integer.parseInt(a.ora().substring(0, 2));
                    int hourB = Integer.parseInt(b.ora().substring(0, 2));
                    return Integer.compare(hourA, hourB);
                })
                .toList();

        return new DashboardChartsResponse(evolutionData, peakHoursData);
    }
}