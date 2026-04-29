package com.planify.backend.repository;

import com.planify.backend.entity.Location;
import com.planify.backend.entity.enums.LocationStatus;
import com.planify.backend.entity.enums.LocationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    Optional<Location> findByOwnerEmail(String ownerEmail);
    Optional<Location> findByPublicId(String publicId);
    Optional<Location> findByCui(String cui);
    boolean existsByOwnerEmail(String ownerEmail);
    boolean existsByCui(String cui);
    List<Location> findByStatus(LocationStatus status);
    long countByStatus(LocationStatus status);
    List<Location> findByRatingLessThanAndStatus(BigDecimal rating, LocationStatus status);
    List<Location> findByAllowsEventsTrue();

    // Query Haversine — calculeaza distanta in km intre doua coordonate GPS
    // Returneaza locatii in raza specificata, ordonate dupa distanța
    @Query(value = """
        SELECT l.* FROM locations l
        WHERE l.status = 'VERIFIED'
          AND l.latitude IS NOT NULL
          AND l.longitude IS NOT NULL
          AND (
            6371 * acos(
              cos(radians(:lat)) * cos(radians(l.latitude)) *
              cos(radians(l.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(l.latitude))
            )
          ) <= :radiusKm
        ORDER BY (
            6371 * acos(
              cos(radians(:lat)) * cos(radians(l.latitude)) *
              cos(radians(l.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(l.latitude))
            )
        ) ASC
        """, nativeQuery = true)
    List<Location> findNearbyLocations(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusKm") double radiusKm
    );

    // Cautare cu filtre combinate
    @Query(value = """
    SELECT DISTINCT l.* FROM locations l
    LEFT JOIN location_facilities f ON l.id = f.location_id
    WHERE l.status = 'VERIFIED'
      AND (:type IS NULL OR l.type = :type)
      AND (
        :searchTerm IS NULL OR
        LOWER(l.display_name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
        LOWER(COALESCE(l.description, '')) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
      )
    ORDER BY l.rating DESC
    """, nativeQuery = true)
    List<Location> searchLocations(
            @Param("type") String type,
            @Param("searchTerm") String searchTerm
    );
}
