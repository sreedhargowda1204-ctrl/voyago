package com.voyago.backend.repository;

import com.voyago.backend.entity.PackingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PackingItemRepository extends JpaRepository<PackingItem, Long> {

    List<PackingItem> findByTripIdOrderByCategoryAscItemNameAsc(Long tripId);

    List<PackingItem> findByTripId(Long tripId);

    Optional<PackingItem> findByIdAndTripId(Long id, Long tripId);

    Optional<PackingItem> findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(Long tripId, String category, String itemName);

    long countByTripId(Long tripId);

    long countByTripIdAndPacked(Long tripId, Boolean packed);
}
