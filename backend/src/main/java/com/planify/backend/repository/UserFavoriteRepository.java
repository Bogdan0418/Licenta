package com.planify.backend.repository;

import com.planify.backend.entity.UserFavorite;
import com.planify.backend.entity.UserFavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, UserFavoriteId> {
    List<UserFavorite> findByUserId(Long userId);
    boolean existsByUserIdAndLocationId(Long userId, Long locationId);
    void deleteByUserIdAndLocationId(Long userId, Long locationId);
    int countByLocationId(Long locationId);
}
