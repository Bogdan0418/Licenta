package com.planify.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    // Genereaz cheia de semnare din secretul configurat
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // Genereaz un token JWT pentru un utilizator
    public String generateToken(String email, String role, String publicId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("publicId", publicId);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // Extrag email-ul (subject) din token
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Extrag rolul din token
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractPublicId(String token) {
        return extractAllClaims(token).get("publicId", String.class);
    }

    // Verific daca token-ul este valid si neexpirat
    public boolean isTokenValid(String token, String email) {
        final String extractedEmail = extractEmail(token);
        return extractedEmail.equals(email) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}