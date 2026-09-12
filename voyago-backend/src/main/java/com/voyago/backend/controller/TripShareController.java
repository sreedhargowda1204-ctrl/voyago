package com.voyago.backend.controller;

import com.voyago.backend.dto.PublicTripResponse;
import com.voyago.backend.dto.TripShareResponse;
import com.voyago.backend.service.TripShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class TripShareController {

    private final TripShareService tripShareService;

    // --- Owner Share Endpoints ---

    @PostMapping("/api/trips/{tripId}/share")
    public ResponseEntity<TripShareResponse> createOrGetShare(@PathVariable Long tripId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripShareService.createOrGetShare(tripId));
    }

    @GetMapping("/api/trips/{tripId}/share")
    public ResponseEntity<TripShareResponse> getShare(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripShareService.getShare(tripId));
    }

    @DeleteMapping("/api/trips/{tripId}/share")
    public ResponseEntity<Void> revokeShare(@PathVariable Long tripId) {
        tripShareService.revokeShare(tripId);
        return ResponseEntity.noContent().build();
    }

    // --- Public Read-Only Share Endpoint ---

    @GetMapping("/api/shared/trips/{shareToken}")
    public ResponseEntity<PublicTripResponse> getPublicTrip(@PathVariable String shareToken) {
        return ResponseEntity.ok(tripShareService.getPublicTrip(shareToken));
    }
}
