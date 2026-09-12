package com.voyago.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExpenseRequest {

    @NotBlank(message = "Category is required")
    @Pattern(
        regexp = "(?i)^(FLIGHT|HOTEL|FOOD|TRANSPORT|ACTIVITY|SHOPPING|OTHER)$",
        message = "Category must be one of: FLIGHT, HOTEL, FOOD, TRANSPORT, ACTIVITY, SHOPPING, OTHER"
    )
    private String category;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String description;

    @NotNull(message = "Expense date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expenseDate;

    private String paymentMethod;
}
