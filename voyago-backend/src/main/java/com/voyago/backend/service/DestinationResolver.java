package com.voyago.backend.service;

import com.voyago.backend.dto.destination.ResolvedDestination;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.repository.DestinationRepository;
import com.voyago.backend.util.DestinationNormalizer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance, multi-tiered destination resolver that maps user destination input
 * (including historical names, phonological variants, Kannada/English transliterations, and aliases)
 * to canonical Karnataka destinations with verified coordinates.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DestinationResolver {

    private final DestinationRepository destinationRepository;

    // Fast in-memory lookup cache: Normalized Key -> Destination
    private final Map<String, Destination> lookupCache = new ConcurrentHashMap<>();
    private final Map<String, Destination> stemmedCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void initCache() {
        refreshCache();
    }

    /**
     * Refreshes the in-memory lookup index from the database.
     */
    public synchronized void refreshCache() {
        try {
            List<Destination> destinations = destinationRepository.findAllByActiveTrue();
            lookupCache.clear();
            stemmedCache.clear();

            for (Destination dest : destinations) {
                indexDestination(dest);
            }

            log.info("DestinationResolver cache initialized with {} active destinations and {} lookup keys",
                    destinations.size(), lookupCache.size());
        } catch (Exception e) {
            log.warn("Could not pre-populate DestinationResolver cache on startup (DB may not be ready yet): {}", e.getMessage());
        }
    }

    private void indexDestination(Destination dest) {
        if (dest == null || dest.getName() == null) return;

        // 1. Index canonical name
        String normCanonical = DestinationNormalizer.normalize(dest.getName());
        if (!normCanonical.isEmpty()) {
            lookupCache.put(normCanonical, dest);
            stemmedCache.put(DestinationNormalizer.stem(normCanonical), dest);
        }

        // 2. Index normalizedName property if set
        if (dest.getNormalizedName() != null && !dest.getNormalizedName().isBlank()) {
            lookupCache.put(dest.getNormalizedName().trim().toLowerCase(), dest);
            stemmedCache.put(DestinationNormalizer.stem(dest.getNormalizedName().trim().toLowerCase()), dest);
        }

        // 3. Index all aliases
        if (dest.getAliases() != null && !dest.getAliases().isBlank()) {
            Arrays.stream(dest.getAliases().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(alias -> {
                        String normAlias = DestinationNormalizer.normalize(alias);
                        if (!normAlias.isEmpty()) {
                            lookupCache.put(normAlias, dest);
                            stemmedCache.put(DestinationNormalizer.stem(normAlias), dest);
                        }
                    });
        }
    }

    /**
     * Resolves user query to a canonical destination.
     * Returns ResolvedDestination with catalogMatch=true if found in catalog,
     * or catalogMatch=false indicating external geocoding fallback is required.
     */
    public ResolvedDestination resolve(String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResolvedDestination.notFound(query);
        }

        String raw = query.trim();
        String normalized = DestinationNormalizer.normalize(raw);

        if (normalized.isEmpty()) {
            return ResolvedDestination.notFound(raw);
        }

        // Tier 1: In-memory exact normalized lookup
        Destination dest = lookupCache.get(normalized);
        if (dest != null) {
            return ResolvedDestination.fromEntity(raw, dest);
        }

        // Tier 2: In-memory stemmed variant lookup (e.g. sakleshpura / sakaleshpura -> sakleshpur)
        String stemmed = DestinationNormalizer.stem(normalized);
        dest = stemmedCache.get(stemmed);
        if (dest != null) {
            return ResolvedDestination.fromEntity(raw, dest);
        }

        // Tier 3: Database direct query fallback (in case cache is refreshing or entity added recently)
        Optional<Destination> dbMatch = destinationRepository.findByNormalizedNameAndActiveTrue(normalized);
        if (dbMatch.isPresent()) {
            indexDestination(dbMatch.get());
            return ResolvedDestination.fromEntity(raw, dbMatch.get());
        }

        // Tier 4: Database search by alias match
        List<Destination> searchResults = destinationRepository.searchDestinations(normalized, org.springframework.data.domain.PageRequest.of(0, 1));
        if (!searchResults.isEmpty()) {
            Destination matched = searchResults.get(0);
            indexDestination(matched);
            return ResolvedDestination.fromEntity(raw, matched);
        }

        // Not in Karnataka catalog -> caller will use external geocoding (e.g., Tokyo, Paris)
        return ResolvedDestination.notFound(raw);
    }
}
