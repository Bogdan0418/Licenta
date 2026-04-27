package com.planify.backend.repository;

import com.planify.backend.entity.User;
import com.planify.backend.entity.enums.UserRole;
import com.planify.backend.entity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByPhone(String phone);

    Optional<User> findByCnpHash(String cnpHash);

    Optional<User> findByPublicId(String publicId);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByPhone(String phone);

    boolean existsByCnpHash(String cnpHash);

    long countByStatus(UserStatus status);

    List<User> findByStatus(UserStatus status);

    long countByRoleNot(UserRole role);

    List<User> findByRatingLessThan(BigDecimal rating);
}