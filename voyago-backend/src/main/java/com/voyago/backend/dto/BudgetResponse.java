package com.voyago.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private Long tripId;
    private BigDecimal totalBudget;
    private String currency;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
