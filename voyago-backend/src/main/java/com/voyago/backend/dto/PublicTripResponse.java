package com.voyago.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicTripResponse {

    private Long id;
    private String title;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;

    private List<PublicItineraryItemDto> itineraryItems;
    private PublicBudgetSummaryDto budgetSummary;
    private List<PublicExpenseDto> expenses;
    private List<PublicPackingItemDto> packingItems;
    private PublicPackingSummaryDto packingSummary;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicItineraryItemDto {
        private Long id;
        private String title;
        private String description;
        private LocalDate date;
        private LocalTime time;
        private String location;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicBudgetSummaryDto {
        private BigDecimal totalBudget;
        private BigDecimal totalSpent;
        private BigDecimal remainingBudget;
        private String currency;
        private long expenseCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicExpenseDto {
        private Long id;
        private String category;
        private BigDecimal amount;
        private String description;
        private LocalDate expenseDate;
        private String paymentMethod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicPackingItemDto {
        private Long id;
        private String itemName;
        private String category;
        private Integer quantity;
        private Boolean packed;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicPackingSummaryDto {
        private long totalItems;
        private long packedItems;
        private long unpackedItems;
        private double completionPercentage;
    }
}
