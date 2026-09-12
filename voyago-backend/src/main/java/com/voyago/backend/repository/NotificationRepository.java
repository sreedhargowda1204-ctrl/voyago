package com.voyago.backend.repository;

import com.voyago.backend.entity.Notification;
import com.voyago.backend.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndTripIdAndType(Long userId, Long tripId, NotificationType type);

    boolean existsByUserIdAndTripIdAndTypeAndCreatedAtBetween(
            Long userId,
            Long tripId,
            NotificationType type,
            LocalDateTime start,
            LocalDateTime end
    );

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);
}
