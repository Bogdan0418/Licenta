package com.planify.backend.repository;

import com.planify.backend.entity.LocationFacility;
import com.planify.backend.entity.enums.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationFacilityRepository extends JpaRepository<LocationFacility, Long> {
    List<LocationFacility> findByLocationId(Long locationId);
    void deleteByLocationId(Long locationId);
    boolean existsByLocationIdAndFacility(Long locationId, Facility facility);
}
