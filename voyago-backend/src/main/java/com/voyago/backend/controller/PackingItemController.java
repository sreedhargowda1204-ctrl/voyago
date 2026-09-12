package com.voyago.backend.controller;

import com.voyago.backend.dto.CreatePackingItemRequest;
import com.voyago.backend.dto.PackingItemResponse;
import com.voyago.backend.dto.PackingSummaryResponse;
import com.voyago.backend.dto.UpdatePackingItemRequest;
import com.voyago.backend.service.PackingItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/packing-items")
@RequiredArgsConstructor
public class PackingItemController {

    private final PackingItemService packingItemService;

    @PostMapping
    public ResponseEntity<PackingItemResponse> createPackingItem(
            @PathVariable Long tripId,
            @Valid @RequestBody CreatePackingItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(packingItemService.createPackingItem(tripId, request));
    }

    @GetMapping
    public ResponseEntity<List<PackingItemResponse>> getPackingItems(@PathVariable Long tripId) {
        return ResponseEntity.ok(packingItemService.getPackingItems(tripId));
    }

    @GetMapping("/summary")
    public ResponseEntity<PackingSummaryResponse> getPackingSummary(@PathVariable Long tripId) {
        return ResponseEntity.ok(packingItemService.getPackingSummary(tripId));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<PackingItemResponse> getPackingItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(packingItemService.getPackingItem(tripId, itemId));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<PackingItemResponse> updatePackingItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdatePackingItemRequest request
    ) {
        return ResponseEntity.ok(packingItemService.updatePackingItem(tripId, itemId, request));
    }

    @PatchMapping("/{itemId}/toggle")
    public ResponseEntity<PackingItemResponse> togglePackedStatus(
            @PathVariable Long tripId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(packingItemService.togglePackedStatus(tripId, itemId));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deletePackingItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId
    ) {
        packingItemService.deletePackingItem(tripId, itemId);
        return ResponseEntity.noContent().build();
    }
}
