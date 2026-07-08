package com.planify.backend.controller;

import com.planify.backend.entity.Booking;
import com.planify.backend.entity.ChatMessage;
import com.planify.backend.entity.Location;
import com.planify.backend.entity.enums.BookingStatus;
import com.planify.backend.repository.BookingRepository;
import com.planify.backend.repository.ChatMessageRepository;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatRepository;
    private final BookingRepository bookingRepository;
    private final JwtService jwtService;
    private final LocationRepository locationRepository; // <-- Am adăugat repository-ul

    // L-am injectat în constructor
    public ChatController(ChatMessageRepository chatRepository,
                          BookingRepository bookingRepository,
                          JwtService jwtService,
                          LocationRepository locationRepository) {
        this.chatRepository = chatRepository;
        this.bookingRepository = bookingRepository;
        this.jwtService = jwtService;
        this.locationRepository = locationRepository;
    }

    // 1. Preluăm mesajele unei rezervări
    @GetMapping("/{bookingId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMessages(@PathVariable Long bookingId, HttpServletRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu există"));
        validateAccess(request, booking);

        List<Map<String, Object>> messages = chatRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
                .map(m -> Map.<String, Object>of(
                        "id", m.getId(),
                        "senderType", m.getSenderType(),
                        "content", m.getContent(),
                        "createdAt", m.getCreatedAt().toString()
                )).collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

    // 2. Trimitem un mesaj nou
    @PostMapping("/{bookingId}")
    @Transactional
    public ResponseEntity<?> sendMessage(@PathVariable Long bookingId, @RequestBody Map<String, String> body, HttpServletRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu există"));
        String role = validateAccess(request, booking);

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mesajul nu poate fi gol"));
        }

        ChatMessage msg = new ChatMessage();
        msg.setBooking(booking);
        msg.setSenderType(role);
        msg.setContent(content);
        chatRepository.save(msg);

        return ResponseEntity.ok(Map.of("message", "Trimis"));
    }

    // 3. Marcăm mesajele ca citite
    @PutMapping("/{bookingId}/read")
    @Transactional
    public ResponseEntity<?> markAsRead(@PathVariable Long bookingId, HttpServletRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Rezervarea nu există"));
        String role = validateAccess(request, booking);

        chatRepository.markAsRead(bookingId, role);
        return ResponseEntity.ok().build();
    }

    // 4. Preluăm toate conversațiile active pentru o locație (pentru Dashboard Locație)
    @GetMapping("/location/active")
    @PreAuthorize("hasAuthority('LOCATION')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getActiveLocationChats(HttpServletRequest request) {
        Long locationId = extractLocationId(request);

        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getZone().getLocation().getId().equals(locationId))
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING)
                .collect(Collectors.toList());

        List<Map<String, Object>> activeChats = new ArrayList<>();

        for (Booking b : bookings) {
            List<ChatMessage> msgs = chatRepository.findByBookingIdOrderByCreatedAtAsc(b.getId());
            if (!msgs.isEmpty()) {
                ChatMessage lastMsg = msgs.get(msgs.size() - 1);
                long unreadCount = msgs.stream().filter(m -> !m.isRead() && m.getSenderType().equals("USER")).count();

                activeChats.add(Map.of(
                        "bookingId", b.getId(),
                        "clientName", b.getUser().getFirstName() + " " + b.getUser().getLastName(),
                        "eventDate", b.getBookingDate().toString(),
                        "zoneName", b.getZone().getName(),
                        "lastMessage", lastMsg.getContent(),
                        "lastMessageTime", lastMsg.getCreatedAt().toString(),
                        "unreadCount", unreadCount
                ));
            }
        }

        // Sortăm descrescător după data ultimului mesaj
        activeChats.sort((m1, m2) -> LocalDateTime.parse((String) m2.get("lastMessageTime")).compareTo(LocalDateTime.parse((String) m1.get("lastMessageTime"))));
        return ResponseEntity.ok(activeChats);
    }

    // Funcție de securitate corectată
    private String validateAccess(HttpServletRequest request, Booking booking) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);

        if (publicId != null && (publicId.toUpperCase().startsWith("U") || publicId.toUpperCase().startsWith("C"))) {
            // Este client (User/Customer)
            Long userId = Long.parseLong(publicId.substring(1));
            Long bookingUserId = booking.getUser().getId();
            if (!bookingUserId.equals(userId)) {
                throw new SecurityException("Acces interzis. Această rezervare nu îți aparține.");
            }
            return "USER";
        } else if (publicId != null && publicId.toUpperCase().startsWith("L")) {
            // Este locație (Location)
            // Extragem ID-ul real din baza de date
            Location location = locationRepository.findByPublicId(publicId)
                    .orElseThrow(() -> new SecurityException("Locația nu există în baza de date."));
            Long locationId = location.getId();

            Long bookingLocationId = booking.getZone().getLocation().getId();
            if (!bookingLocationId.equals(locationId)) {
                throw new SecurityException("Acces interzis. Această rezervare nu este la locația ta.");
            }
            return "LOCATION";
        }

        throw new SecurityException("Token invalid sau format necunoscut: " + publicId);
    }

    // Extragere sigură prin DB
    private Long extractLocationId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String publicId = jwtService.extractPublicId(token);
        if (publicId == null || !publicId.toUpperCase().startsWith("L")) {
            throw new SecurityException("Token invalid pentru o locație.");
        }

        Location location = locationRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locația nu a fost găsită."));

        return location.getId();
    }

    // 5. Preluăm numărul de mesaje necitite pentru client
    @GetMapping("/user/unread")
    @PreAuthorize("hasAuthority('USER')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserUnreadMessages(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        Long userId = Long.parseLong(jwtService.extractPublicId(token).substring(1));

        // Preluăm toate rezervările utilizatorului
        List<Booking> userBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        Map<Long, Long> unreadCounts = new HashMap<>();
        for (Booking b : userBookings) {
            long count = chatRepository.findByBookingIdOrderByCreatedAtAsc(b.getId()).stream()
                    .filter(m -> !m.isRead() && m.getSenderType().equals("LOCATION")) // Mesaje de la locatie necitite
                    .count();
            if (count > 0) {
                unreadCounts.put(b.getId(), count);
            }
        }

        return ResponseEntity.ok(unreadCounts);
    }
}