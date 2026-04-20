package com.planify.backend.repository;

import com.planify.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
        SELECT a FROM AuditLog a
        JOIN FETCH a.admin
        ORDER BY a.createdAt DESC
        LIMIT 50
        """)
    List<AuditLog> findTop50ByOrderByCreatedAtDesc();

    @Query("""
        SELECT a FROM AuditLog a
        JOIN FETCH a.admin
        WHERE a.admin.id = :adminId
        ORDER BY a.createdAt DESC
        """)
    List<AuditLog> findByAdminIdOrderByCreatedAtDesc(Long adminId);
}