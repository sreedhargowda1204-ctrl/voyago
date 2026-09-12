package com.voyago.backend.service;

import com.voyago.backend.dto.destination.DestinationDto;
import com.voyago.backend.dto.destination.DestinationSearchResponse;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.exception.DestinationNotFoundException;
import com.voyago.backend.repository.DestinationRepository;
import com.voyago.backend.util.DestinationNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    @Transactional(readOnly = true)
    public DestinationSearchResponse searchDestinations(String query, int limit) {
        if (query == null || query.isBlank()) {
            return DestinationSearchResponse.builder()
                    .query("")
                    .count(0)
                    .destinations(Collections.emptyList())
                    .build();
        }

        int maxLimit = Math.min(Math.max(limit, 1), 25);
        String cleanQuery = DestinationNormalizer.normalize(query.trim());

        List<Destination> results = destinationRepository.searchDestinations(cleanQuery, PageRequest.of(0, maxLimit));
        List<DestinationDto> dtos = results.stream()
                .map(DestinationDto::fromEntity)
                .toList();

        return DestinationSearchResponse.builder()
                .query(query.trim())
                .count(dtos.size())
                .destinations(dtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DestinationDto> getAllKarnatakaDestinations() {
        return destinationRepository.findAllByActiveTrue().stream()
                .map(DestinationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DestinationDto> getDestinationsByDistrict(String district) {
        if (district == null || district.isBlank()) return Collections.emptyList();
        return destinationRepository.findByDistrictIgnoreCaseAndActiveTrue(district.trim()).stream()
                .map(DestinationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DestinationDto> getDestinationsByCategory(DestinationCategory category) {
        if (category == null) return Collections.emptyList();
        return destinationRepository.findByCategoryAndActiveTrue(category).stream()
                .map(DestinationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DestinationDto getDestinationById(Long id) {
        return destinationRepository.findById(id)
                .filter(Destination::getActive)
                .map(DestinationDto::fromEntity)
                .orElseThrow(() -> new DestinationNotFoundException("Destination not found with id: " + id));
    }
}
