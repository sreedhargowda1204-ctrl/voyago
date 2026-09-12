package com.voyago.backend.controller;

import com.voyago.backend.dto.BudgetResponse;
import com.voyago.backend.dto.BudgetSummaryResponse;
import com.voyago.backend.dto.CreateBudgetRequest;
import com.voyago.backend.dto.UpdateBudgetRequest;
import com.voyago.backend.service.TripBudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips/{tripId}/budget")
@RequiredArgsConstructor
public class TripBudgetController {

    private final TripBudgetService tripBudgetService;

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateBudgetRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripBudgetService.createBudget(tripId, request));
    }

    @GetMapping
    public ResponseEntity<BudgetResponse> getBudget(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripBudgetService.getBudget(tripId));
    }

    @PutMapping
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long tripId,
            @Valid @RequestBody UpdateBudgetRequest request
    ) {
        return ResponseEntity.ok(tripBudgetService.updateBudget(tripId, request));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteBudget(@PathVariable Long tripId) {
        tripBudgetService.deleteBudget(tripId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<BudgetSummaryResponse> getBudgetSummary(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripBudgetService.getBudgetSummary(tripId));
    }
}
