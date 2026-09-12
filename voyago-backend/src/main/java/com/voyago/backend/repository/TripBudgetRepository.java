package com.voyago.backend.repository;

import com.voyago.backend.entity.TripBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripBudgetRepository extends JpaRepository<TripBudget, Long> {
    Optional<TripBudget> findByTripId(Long tripId);
    Optional<TripBudget> findByIdAndTripId(Long id, Long tripId);
    boolean existsByTripId(Long tripId);
}
