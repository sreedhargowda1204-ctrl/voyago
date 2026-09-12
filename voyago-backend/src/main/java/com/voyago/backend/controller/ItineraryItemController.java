package com.voyago.backend.controller;

import com.voyago.backend.dto.CreateItineraryItemRequest;
import com.voyago.backend.dto.ItineraryItemResponse;
import com.voyago.backend.dto.UpdateItineraryItemRequest;
import com.voyago.backend.service.ItineraryItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/itinerary")
@RequiredArgsConstructor
public class ItineraryItemController {

    private final ItineraryItemService itineraryItemService;

    @PostMapping
    public ResponseEntity<ItineraryItemResponse> createItineraryItem(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateItineraryItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itineraryItemService.createItineraryItem(tripId, request));
    }

    @GetMapping
    public ResponseEntity<List<ItineraryItemResponse>> getItineraryItems(@PathVariable Long tripId) {
        return ResponseEntity.ok(itineraryItemService.getItineraryItems(tripId));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ItineraryItemResponse> getItineraryItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(itineraryItemService.getItineraryItem(tripId, itemId));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ItineraryItemResponse> updateItineraryItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateItineraryItemRequest request
    ) {
        return ResponseEntity.ok(itineraryItemService.updateItineraryItem(tripId, itemId, request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItineraryItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId
    ) {
        itineraryItemService.deleteItineraryItem(tripId, itemId);
        return ResponseEntity.noContent().build();
    }
}
