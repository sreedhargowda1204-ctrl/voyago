package com.voyago.backend.repository;

import com.voyago.backend.entity.TripShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripShareRepository extends JpaRepository<TripShare, Long> {

    Optional<TripShare> findByShareToken(String shareToken);

    Optional<TripShare> findByTripId(Long tripId);

    Optional<TripShare> findByTripIdAndActiveTrue(Long tripId);

    Optional<TripShare> findByShareTokenAndActiveTrue(String shareToken);
}
