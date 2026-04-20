package com.planify.backend.security;

import com.planify.backend.entity.Location;
import com.planify.backend.entity.User;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.UserStatus;
import com.planify.backend.repository.LocationRepository;
import com.planify.backend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

    public CustomUserDetailsService(UserRepository userRepository,
                                    LocationRepository locationRepository) {
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        // Încearc mai intai in tabela users (utilizatori si admini)
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Verifică dacă contul este blocat sau neconfirmat
            if (user.getStatus() == UserStatus.BLOCKED) {
                throw new UsernameNotFoundException("Contul este blocat");
            }
            if (user.getStatus() == UserStatus.UNCONFIRMED) {
                throw new UsernameNotFoundException("Contul nu este confirmat");
            }

            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPasswordHash(),
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
        }

        // Daca nu e in users, caut in locations
        Optional<Location> locationOpt = locationRepository.findByOwnerEmail(email);
        if (locationOpt.isPresent()) {
            Location location = locationOpt.get();

            if (location.getStatus() == LocationStatus.BLOCKED) {
                throw new UsernameNotFoundException("Contul locației este blocat");
            }

            return new org.springframework.security.core.userdetails.User(
                    location.getOwnerEmail(),
                    location.getPasswordHash(),
                    List.of(new SimpleGrantedAuthority("ROLE_LOCATION"))
            );
        }

        throw new UsernameNotFoundException(
                "Nu există cont cu email-ul: " + email
        );
    }
}