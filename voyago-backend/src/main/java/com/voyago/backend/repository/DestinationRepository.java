package com.voyago.backend.repository;

import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {

    Optional<Destination> findByNormalizedNameAndActiveTrue(String normalizedName);

    Optional<Destination> findByNameIgnoreCaseAndActiveTrue(String name);

    List<Destination> findAllByActiveTrue();

    List<Destination> findByDistrictIgnoreCaseAndActiveTrue(String district);

    List<Destination> findByCategoryAndActiveTrue(DestinationCategory category);

    boolean existsByNameIgnoreCase(String name);

    long countByActiveTrue();

    @Query("SELECT d FROM Destination d WHERE d.active = true AND " +
           "(LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(d.normalizedName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(d.aliases) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(d.district) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY " +
           "CASE " +
           "  WHEN LOWER(d.name) = LOWER(:query) THEN 1 " +
           "  WHEN LOWER(d.normalizedName) = LOWER(:query) THEN 2 " +
           "  WHEN LOWER(d.name) LIKE LOWER(CONCAT(:query, '%')) THEN 3 " +
           "  ELSE 4 " +
           "END, d.name ASC")
    List<Destination> searchDestinations(@Param("query") String query, Pageable pageable);
}
