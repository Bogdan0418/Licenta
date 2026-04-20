package com.planify.backend.repository;

import com.planify.backend.entity.VenueZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueZoneRepository extends JpaRepository<VenueZone, Long> {
    List<VenueZone> findByLocationId(Long locationId);
    List<VenueZone> findByLocationIdAndIsActiveTrue(Long locationId);
}