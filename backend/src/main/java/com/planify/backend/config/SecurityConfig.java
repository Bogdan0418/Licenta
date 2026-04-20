package com.planify.backend.config;

import com.planify.backend.security.CustomUserDetailsService;
import com.planify.backend.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          CustomUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
                // Dezactivez CSRF — nu e necesar pentru API-uri REST cu JWT
                .csrf(AbstractHttpConfigurer::disable)

                // Configurez rutele
                .authorizeHttpRequests(auth -> auth

                        // Rute complet publice — nu necesita autentificare
                        .requestMatchers(
                                "/api/auth/**",       // login, register
                                "/api/locations/public/**", // browsing locatii
                                "/api/search/**",      // cautare si filtrare
                                "/api/dev/**",
                                "/error"
                        ).permitAll()

                        // Rute doar pentru USER
                        .requestMatchers("/api/user/**")
                        .hasRole("USER")

                        // Rute doar pentru LOCATION
                        .requestMatchers("/api/location/**")
                        .hasRole("LOCATION")

                        // Rute doar pentru ADMIN
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        // Orice altceva necesita autentificare
                        .anyRequest().authenticated()
                )

                // Fara sesiuni HTTP — totul se bazeaza pe JWT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Folosesc provider-ul nostru custom
                .authenticationProvider(authenticationProvider())

                // Adaug filtrul JWT inainte de filtrul standard Spring Security
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt cu 12 runde
        return new BCryptPasswordEncoder(12);
    }
}
