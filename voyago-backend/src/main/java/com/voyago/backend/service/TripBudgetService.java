package com.voyago.backend.service;

import com.voyago.backend.dto.BudgetResponse;
import com.voyago.backend.dto.BudgetSummaryResponse;
import com.voyago.backend.dto.CreateBudgetRequest;
import com.voyago.backend.dto.UpdateBudgetRequest;
import com.voyago.backend.entity.Trip;
import com.voyago.backend.entity.TripBudget;
import com.voyago.backend.entity.User;
import com.voyago.backend.exception.DuplicateResourceException;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.ExpenseRepository;
import com.voyago.backend.repository.TripBudgetRepository;
import com.voyago.backend.repository.TripRepository;
import com.voyago.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TripBudgetService {

    private final TripBudgetRepository tripBudgetRepository;
    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public BudgetResponse createBudget(Long tripId, CreateBudgetRequest request) {
        Trip trip = getOwnedTrip(tripId);

        if (tripBudgetRepository.existsByTripId(tripId)) {
            throw new DuplicateResourceException("A budget has already been created for trip with id: " + tripId);
        }

        TripBudget budget = TripBudget.builder()
                .trip(trip)
                .totalBudget(request.getTotalBudget())
                .currency(request.getCurrency().trim().toUpperCase())
                .build();

        TripBudget savedBudget = tripBudgetRepository.save(budget);
        return toResponse(savedBudget);
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long tripId) {
        getOwnedTrip(tripId);

        TripBudget budget = tripBudgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found for trip with id: " + tripId));

        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(Long tripId, UpdateBudgetRequest request) {
        getOwnedTrip(tripId);

        TripBudget budget = tripBudgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found for trip with id: " + tripId));

        budget.setTotalBudget(request.getTotalBudget());
        budget.setCurrency(request.getCurrency().trim().toUpperCase());

        TripBudget updatedBudget = tripBudgetRepository.save(budget);
        return toResponse(updatedBudget);
    }

    @Transactional
    public void deleteBudget(Long tripId) {
        getOwnedTrip(tripId);

        TripBudget budget = tripBudgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found for trip with id: " + tripId));

        tripBudgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public BudgetSummaryResponse getBudgetSummary(Long tripId) {
        getOwnedTrip(tripId);

        Optional<TripBudget> budgetOpt = tripBudgetRepository.findByTripId(tripId);
        BigDecimal totalBudget = budgetOpt.map(TripBudget::getTotalBudget).orElse(BigDecimal.ZERO);
        String currency = budgetOpt.map(TripBudget::getCurrency).orElse(null);

        BigDecimal totalSpent = expenseRepository.calculateTotalExpensesByTripId(tripId);
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        BigDecimal remainingBudget = totalBudget.subtract(totalSpent);
        long expenseCount = expenseRepository.countByTripId(tripId);

        return BudgetSummaryResponse.builder()
                .tripId(tripId)
                .totalBudget(totalBudget)
                .totalSpent(totalSpent)
                .remainingBudget(remainingBudget)
                .currency(currency)
                .expenseCount(expenseCount)
                .build();
    }

    private Trip getOwnedTrip(Long tripId) {
        User user = getCurrentUser();
        return tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    private BudgetResponse toResponse(TripBudget budget) {
        return BudgetResponse.builder()
                .id(budget.getId())
                .tripId(budget.getTrip() != null ? budget.getTrip().getId() : null)
                .totalBudget(budget.getTotalBudget())
                .currency(budget.getCurrency())
                .createdAt(budget.getCreatedAt())
                .updatedAt(budget.getUpdatedAt())
                .build();
    }
}
