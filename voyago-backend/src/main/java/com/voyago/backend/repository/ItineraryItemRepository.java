package com.voyago.backend.repository;

import com.voyago.backend.entity.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {
    List<ItineraryItem> findByTripIdOrderByDateAscTimeAsc(Long tripId);
    List<ItineraryItem> findByTripId(Long tripId);
    Optional<ItineraryItem> findByIdAndTripId(Long id, Long tripId);
}
