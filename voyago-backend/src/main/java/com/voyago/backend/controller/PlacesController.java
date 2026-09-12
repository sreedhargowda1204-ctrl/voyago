package com.voyago.backend.controller;

import com.voyago.backend.dto.places.PlacesResponse;
import com.voyago.backend.service.PlacesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlacesController {

    private final PlacesService placesService;

    @GetMapping
    public ResponseEntity<PlacesResponse> getPlaces(
            @RequestParam(name = "destination", required = false) String destination
    ) {
        if (destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Destination query parameter is required and cannot be blank");
        }

        return ResponseEntity.ok(placesService.getPlacesForDestination(destination.trim()));
    }
}
