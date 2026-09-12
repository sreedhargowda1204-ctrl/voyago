package com.voyago.backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.repository.DestinationRepository;
import com.voyago.backend.service.DestinationResolver;
import com.voyago.backend.util.DestinationNormalizer;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class DestinationDataLoader implements ApplicationRunner {

    private final DestinationRepository destinationRepository;
    private final DestinationResolver destinationResolver;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        loadKarnatakaDestinations();
    }

    public void loadKarnatakaDestinations() {
        try {
            Resource resource = resourceLoader.getResource("classpath:destinations/karnataka-destinations.json");
            if (!resource.exists()) {
                log.warn("Karnataka destinations JSON resource not found on classpath");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<DestinationSeedItem> seedItems = objectMapper.readValue(is, new TypeReference<>() {});
                int insertedCount = 0;
                int updatedCount = 0;

                for (DestinationSeedItem item : seedItems) {
                    if (item.getName() == null || item.getName().isBlank()) {
                        continue;
                    }

                    String normalizedName = DestinationNormalizer.normalize(item.getName());
                    String normalizedAliases = "";
                    if (item.getAliases() != null && !item.getAliases().isBlank()) {
                        normalizedAliases = Arrays.stream(item.getAliases().split(","))
                                .map(DestinationNormalizer::normalize)
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.joining(","));
                    }

                    Optional<Destination> existingOpt = destinationRepository.findByNormalizedNameAndActiveTrue(normalizedName);
                    if (existingOpt.isEmpty()) {
                        existingOpt = destinationRepository.findByNameIgnoreCaseAndActiveTrue(item.getName().trim());
                    }

                    if (existingOpt.isPresent()) {
                        Destination existing = existingOpt.get();
                        boolean modified = false;
                        if (existing.getLatitude() == null || existing.getLongitude() == null) {
                            existing.setLatitude(item.getLatitude());
                            existing.setLongitude(item.getLongitude());
                            modified = true;
                        }
                        if (existing.getCategory() == null && item.getCategory() != null) {
                            existing.setCategory(item.getCategory());
                            modified = true;
                        }
                        if ((existing.getAliases() == null || existing.getAliases().isBlank()) && item.getAliases() != null) {
                            existing.setAliases(item.getAliases());
                            existing.setNormalizedAliases(normalizedAliases);
                            modified = true;
                        }
                        if (modified) {
                            destinationRepository.save(existing);
                            updatedCount++;
                        }
                    } else {
                        Destination newDest = Destination.builder()
                                .name(item.getName().trim())
                                .normalizedName(normalizedName)
                                .aliases(item.getAliases())
                                .normalizedAliases(normalizedAliases)
                                .district(item.getDistrict() != null ? item.getDistrict().trim() : "Karnataka")
                                .category(item.getCategory() != null ? item.getCategory() : DestinationCategory.OTHER)
                                .description(item.getDescription())
                                .latitude(item.getLatitude())
                                .longitude(item.getLongitude())
                                .state("Karnataka")
                                .country("India")
                                .active(true)
                                .build();
                        destinationRepository.save(newDest);
                        insertedCount++;
                    }
                }

                log.info("Karnataka destination seeding completed. Inserted: {}, Updated: {}, Total active in DB: {}",
                        insertedCount, updatedCount, destinationRepository.countByActiveTrue());

                // Refresh in-memory resolver cache
                destinationResolver.refreshCache();
            }
        } catch (Exception e) {
            log.error("Error loading Karnataka destination catalog: {}", e.getMessage(), e);
        }
    }

    @Data
    public static class DestinationSeedItem {
        private String name;
        private String aliases;
        private String district;
        private DestinationCategory category;
        private String description;
        private Double latitude;
        private Double longitude;
    }
}
