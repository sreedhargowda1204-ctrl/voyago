package com.voyago.backend.repository;

import com.voyago.backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByTripIdOrderByExpenseDateDescCreatedAtDesc(Long tripId);

    Optional<Expense> findByIdAndTripId(Long id, Long tripId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id = :tripId")
    BigDecimal calculateTotalExpensesByTripId(@Param("tripId") Long tripId);

    long countByTripId(Long tripId);
}
