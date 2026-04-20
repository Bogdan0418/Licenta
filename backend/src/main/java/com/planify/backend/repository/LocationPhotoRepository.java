package com.planify.backend.repository;

import com.planify.backend.entity.LocationPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationPhotoRepository extends JpaRepository<LocationPhoto, Long> {
    List<LocationPhoto> findByLocationIdOrderByDisplayOrderAsc(Long locationId);
    void deleteByLocationId(Long locationId);
    int countByLocationId(Long locationId);
}
