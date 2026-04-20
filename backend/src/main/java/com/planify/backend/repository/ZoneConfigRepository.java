package com.planify.backend.repository;

import com.planify.backend.entity.ZoneConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ZoneConfigRepository extends JpaRepository<ZoneConfig, Long> {
    Optional<ZoneConfig> findByZoneId(Long zoneId);
}
