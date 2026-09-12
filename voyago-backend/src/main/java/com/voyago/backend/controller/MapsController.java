package com.voyago.backend.controller;

import com.voyago.backend.dto.maps.MapResponse;
import com.voyago.backend.dto.maps.RouteResponse;
import com.voyago.backend.dto.places.PlacesResponse;
import com.voyago.backend.service.MapsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapsController {

    private final MapsService mapsService;

    /**
     * Get destination coordinates.
     * GET /api/maps?destination={destination}
     */
    @GetMapping
    public ResponseEntity<MapResponse> getDestinationCoordinates(
            @RequestParam(name = "destination", required = false) String destination
    ) {
        MapResponse response = mapsService.getDestinationCoordinates(destination);
        return ResponseEntity.ok(response);
    }

    /**
     * Get places & attractions coordinates for map visualization.
     * GET /api/maps/places?destination={destination}
     */
    @GetMapping("/places")
    public ResponseEntity<PlacesResponse> getPlacesForMap(
            @RequestParam(name = "destination", required = false) String destination
    ) {
        PlacesResponse response = mapsService.getPlacesForMap(destination);
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate route between two coordinates.
     * GET /api/maps/route?startLat={startLat}&startLng={startLng}&endLat={endLat}&endLng={endLng}
     */
    @GetMapping("/route")
    public ResponseEntity<RouteResponse> calculateRoute(
            @RequestParam(name = "startLat", required = false) Double startLat,
            @RequestParam(name = "startLng", required = false) Double startLng,
            @RequestParam(name = "endLat", required = false) Double endLat,
            @RequestParam(name = "endLng", required = false) Double endLng
    ) {
        RouteResponse response = mapsService.calculateRoute(startLat, startLng, endLat, endLng);
        return ResponseEntity.ok(response);
    }
}
