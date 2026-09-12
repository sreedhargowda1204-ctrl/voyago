package com.voyago.backend.controller;

import com.voyago.backend.dto.destination.DestinationDto;
import com.voyago.backend.dto.destination.DestinationSearchResponse;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.service.DestinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping("/search")
    public ResponseEntity<DestinationSearchResponse> searchDestinations(
            @RequestParam(name = "query", required = false, defaultValue = "") String query,
            @RequestParam(name = "limit", required = false, defaultValue = "15") int limit
    ) {
        DestinationSearchResponse response = destinationService.searchDestinations(query, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/karnataka")
    public ResponseEntity<List<DestinationDto>> getKarnatakaDestinations(
            @RequestParam(name = "district", required = false) String district,
            @RequestParam(name = "category", required = false) DestinationCategory category
    ) {
        if (district != null && !district.isBlank()) {
            return ResponseEntity.ok(destinationService.getDestinationsByDistrict(district));
        }
        if (category != null) {
            return ResponseEntity.ok(destinationService.getDestinationsByCategory(category));
        }
        return ResponseEntity.ok(destinationService.getAllKarnatakaDestinations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DestinationDto> getDestinationById(@PathVariable("id") Long id) {
        DestinationDto dto = destinationService.getDestinationById(id);
        return ResponseEntity.ok(dto);
    }
}
