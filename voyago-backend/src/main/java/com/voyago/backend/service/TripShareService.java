package com.voyago.backend.service;

import com.voyago.backend.dto.PublicTripResponse;
import com.voyago.backend.dto.TripShareResponse;
import com.voyago.backend.entity.*;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TripShareService {

    private final TripShareRepository tripShareRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final TripBudgetRepository tripBudgetRepository;
    private final ExpenseRepository expenseRepository;
    private final PackingItemRepository packingItemRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public TripShareResponse createOrGetShare(Long tripId) {
        Trip trip = getOwnedTrip(tripId);

        // If an active share already exists, return it
        Optional<TripShare> activeShareOpt = tripShareRepository.findByTripIdAndActiveTrue(tripId);
        if (activeShareOpt.isPresent()) {
            return toResponse(activeShareOpt.get());
        }

        // Check if an inactive share record exists for this trip
        Optional<TripShare> existingShareOpt = tripShareRepository.findByTripId(tripId);
        TripShare tripShare;
        if (existingShareOpt.isPresent()) {
            tripShare = existingShareOpt.get();
            tripShare.setShareToken(generateSecureToken());
            tripShare.setActive(true);
        } else {
            tripShare = TripShare.builder()
                    .trip(trip)
                    .shareToken(generateSecureToken())
                    .active(true)
                    .build();
        }

        TripShare saved = tripShareRepository.save(tripShare);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TripShareResponse getShare(Long tripId) {
        getOwnedTrip(tripId);

        TripShare share = tripShareRepository.findByTripIdAndActiveTrue(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Active share link not found for trip id: " + tripId));

        return toResponse(share);
    }

    @Transactional
    public void revokeShare(Long tripId) {
        getOwnedTrip(tripId);

        Optional<TripShare> activeShareOpt = tripShareRepository.findByTripIdAndActiveTrue(tripId);
        if (activeShareOpt.isPresent()) {
            TripShare share = activeShareOpt.get();
            share.setActive(false);
            tripShareRepository.save(share);
        }
    }

    @Transactional(readOnly = true)
    public PublicTripResponse getPublicTrip(String shareToken) {
        if (shareToken == null || shareToken.trim().isEmpty()) {
            throw new ResourceNotFoundException("Shared trip not found or link has expired");
        }

        TripShare share = tripShareRepository.findByShareTokenAndActiveTrue(shareToken.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Shared trip not found or link has expired"));

        Trip trip = share.getTrip();
        Long tripId = trip.getId();

        // 1. Itinerary
        List<ItineraryItem> itineraryEntities = itineraryItemRepository.findByTripIdOrderByDateAscTimeAsc(tripId);
        List<PublicTripResponse.PublicItineraryItemDto> itineraryList = itineraryEntities.stream()
                .map(item -> PublicTripResponse.PublicItineraryItemDto.builder()
                        .id(item.getId())
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .date(item.getDate())
                        .time(item.getTime())
                        .location(item.getLocation())
                        .build())
                .toList();

        // 2. Budget & Summary
        Optional<TripBudget> budgetOpt = tripBudgetRepository.findByTripId(tripId);
        BigDecimal totalSpent = expenseRepository.calculateTotalExpensesByTripId(tripId);
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }
        long expenseCount = expenseRepository.countByTripId(tripId);

        PublicTripResponse.PublicBudgetSummaryDto budgetSummary = null;
        if (budgetOpt.isPresent()) {
            TripBudget budget = budgetOpt.get();
            BigDecimal remaining = budget.getTotalBudget().subtract(totalSpent);
            budgetSummary = PublicTripResponse.PublicBudgetSummaryDto.builder()
                    .totalBudget(budget.getTotalBudget())
                    .totalSpent(totalSpent)
                    .remainingBudget(remaining)
                    .currency(budget.getCurrency())
                    .expenseCount(expenseCount)
                    .build();
        } else if (totalSpent.compareTo(BigDecimal.ZERO) > 0 || expenseCount > 0) {
            budgetSummary = PublicTripResponse.PublicBudgetSummaryDto.builder()
                    .totalBudget(BigDecimal.ZERO)
                    .totalSpent(totalSpent)
                    .remainingBudget(BigDecimal.ZERO.subtract(totalSpent))
                    .currency("INR")
                    .expenseCount(expenseCount)
                    .build();
        }

        // 3. Expenses
        List<Expense> expenseEntities = expenseRepository.findByTripIdOrderByExpenseDateDescCreatedAtDesc(tripId);
        List<PublicTripResponse.PublicExpenseDto> expenseList = expenseEntities.stream()
                .map(exp -> PublicTripResponse.PublicExpenseDto.builder()
                        .id(exp.getId())
                        .category(exp.getCategory())
                        .amount(exp.getAmount())
                        .description(exp.getDescription())
                        .expenseDate(exp.getExpenseDate())
                        .paymentMethod(exp.getPaymentMethod())
                        .build())
                .toList();

        // 4. Packing items & summary
        List<PackingItem> packingEntities = packingItemRepository.findByTripIdOrderByCategoryAscItemNameAsc(tripId);
        List<PublicTripResponse.PublicPackingItemDto> packingList = packingEntities.stream()
                .map(p -> PublicTripResponse.PublicPackingItemDto.builder()
                        .id(p.getId())
                        .itemName(p.getItemName())
                        .category(p.getCategory())
                        .quantity(p.getQuantity())
                        .packed(p.getPacked())
                        .notes(p.getNotes())
                        .build())
                .toList();

        long totalPacking = packingEntities.size();
        long packedCount = packingEntities.stream().filter(p -> Boolean.TRUE.equals(p.getPacked())).count();
        long unpackedCount = Math.max(0, totalPacking - packedCount);
        double completionPct = totalPacking > 0
                ? BigDecimal.valueOf((double) packedCount / totalPacking * 100.0)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue()
                : 0.0;

        PublicTripResponse.PublicPackingSummaryDto packingSummary = PublicTripResponse.PublicPackingSummaryDto.builder()
                .totalItems(totalPacking)
                .packedItems(packedCount)
                .unpackedItems(unpackedCount)
                .completionPercentage(completionPct)
                .build();

        return PublicTripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .destination(trip.getDestination())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .notes(trip.getNotes())
                .itineraryItems(itineraryList)
                .budgetSummary(budgetSummary)
                .expenses(expenseList)
                .packingItems(packingList)
                .packingSummary(packingSummary)
                .build();
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32]; // 256 bits of cryptographic entropy
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
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

    private TripShareResponse toResponse(TripShare share) {
        String cleanFrontendUrl = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
        String shareUrl = cleanFrontendUrl + "/shared/" + share.getShareToken();

        return TripShareResponse.builder()
                .shareToken(share.getShareToken())
                .shareUrl(shareUrl)
                .active(share.getActive())
                .createdAt(share.getCreatedAt())
                .build();
    }
}
