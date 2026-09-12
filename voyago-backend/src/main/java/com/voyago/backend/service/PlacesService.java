package com.voyago.backend.service;

import com.voyago.backend.dto.destination.ResolvedDestination;
import com.voyago.backend.dto.places.*;
import com.voyago.backend.dto.weather.LocationDto;
import com.voyago.backend.dto.weather.OpenMeteoGeocodingResponse;
import com.voyago.backend.exception.DestinationNotFoundException;
import com.voyago.backend.exception.WeatherServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class PlacesService {

    private final RestClient restClient;
    private final DestinationResolver destinationResolver;
    private final String geocodingUrl;
    private final String wikipediaApiUrl;
    private final String wikimediaApiUrl;

    public PlacesService(
            DestinationResolver destinationResolver,
            @Value("${weather.open-meteo.geocoding-url:https://geocoding-api.open-meteo.com/v1/search}") String geocodingUrl,
            @Value("${places.wikipedia.api-url:https://en.wikipedia.org/w/api.php}") String wikipediaApiUrl,
            @Value("${places.wikimedia.api-url:https://commons.wikimedia.org/w/api.php}") String wikimediaApiUrl
    ) {
        this.destinationResolver = destinationResolver;
        this.geocodingUrl = geocodingUrl;
        this.wikipediaApiUrl = wikipediaApiUrl;
        this.wikimediaApiUrl = wikimediaApiUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", "VoyagoTravelApp/1.0 (travel planning platform; contact@voyago.com)")
                .build();
    }

    public PlacesResponse getPlacesForDestination(String destination) {
        if (destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Destination query parameter is required and cannot be blank");
        }

        String query = destination.trim();

        // 1. Resolve via Karnataka Destination Catalog first
        ResolvedDestination resolved = destinationResolver.resolve(query);
        LocationDto location;
        String district = null;
        String canonicalName = null;

        if (resolved.isCatalogMatch()) {
            location = resolved.toLocationDto();
            district = resolved.getDistrict();
            canonicalName = resolved.getCanonicalName();
        } else {
            // Fallback to external Open-Meteo geocoding
            location = geocodeDestination(query);
            canonicalName = location.getName();
        }

        // 2. Fetch notable places & tourist attractions near coordinates (max 15) with relevance ranking
        List<PlaceDto> places = fetchPlacesNear(
                location.getLatitude(),
                location.getLongitude(),
                canonicalName,
                district,
                query
        );

        return PlacesResponse.builder()
                .location(location)
                .places(places)
                .build();
    }

    private LocationDto geocodeDestination(String query) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(geocodingUrl)
                    .queryParam("name", query)
                    .queryParam("count", 1)
                    .queryParam("language", "en")
                    .queryParam("format", "json")
                    .build()
                    .toUri();

            OpenMeteoGeocodingResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(OpenMeteoGeocodingResponse.class);

            if (response == null || response.getResults() == null || response.getResults().isEmpty()) {
                throw new DestinationNotFoundException("Unable to find location for destination: " + query);
            }

            OpenMeteoGeocodingResponse.GeocodingResult result = response.getResults().get(0);
            return LocationDto.builder()
                    .name(result.getName())
                    .country(result.getCountry())
                    .latitude(result.getLatitude())
                    .longitude(result.getLongitude())
                    .build();
        } catch (DestinationNotFoundException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("Geocoding API error for places query '{}': {}", query, e.getMessage());
            throw new WeatherServiceException("External geocoding service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error resolving destination location for places: '{}'", query, e);
            throw new WeatherServiceException("Unexpected error resolving destination location", e);
        }
    }

    private List<PlaceDto> fetchPlacesNear(
            Double latitude,
            Double longitude,
            String destinationName,
            String district,
            String rawQuery
    ) {
        try {
            // Step 1: Geosearch nearby points of interest (gsradius must be <= 10000 for MediaWiki API)
            URI geoSearchUri = UriComponentsBuilder.fromUriString(wikipediaApiUrl)
                    .queryParam("action", "query")
                    .queryParam("list", "geosearch")
                    .queryParam("gscoord", latitude + "|" + longitude)
                    .queryParam("gsradius", 10000)
                    .queryParam("gslimit", 35)
                    .queryParam("format", "json")
                    .build()
                    .toUri();

            WikipediaGeoSearchResponse geoResponse = restClient.get()
                    .uri(geoSearchUri)
                    .retrieve()
                    .body(WikipediaGeoSearchResponse.class);

            if (geoResponse == null || geoResponse.getQuery() == null || geoResponse.getQuery().getGeosearch() == null) {
                return Collections.emptyList();
            }

            List<WikipediaGeoSearchResponse.GeoSearchItem> items = geoResponse.getQuery().getGeosearch();
            String destLower = destinationName != null ? destinationName.toLowerCase() : "";

            // Filter out exact city name and generic administrative stubs
            List<WikipediaGeoSearchResponse.GeoSearchItem> candidates = items.stream()
                    .filter(item -> {
                        String t = item.getTitle() != null ? item.getTitle().toLowerCase() : "";
                        return !t.equals(destLower)
                                && !t.startsWith("history of ")
                                && !t.startsWith("geography of ")
                                && !t.startsWith("transport in ")
                                && !t.startsWith("economy of ")
                                && !t.startsWith("demographics of ")
                                && !t.startsWith("climate of ")
                                && !t.startsWith("politics of ")
                                && !t.startsWith("list of ")
                                && !t.contains("arrondissement")
                                && !t.contains("constituency")
                                && !t.contains("legislative assembly")
                                && !t.contains("lok sabha")
                                && !t.contains("vidhan sabha")
                                && !t.contains("gram panchayat");
                    })
                    .limit(30)
                    .toList();

            if (candidates.isEmpty()) {
                return Collections.emptyList();
            }

            Map<String, WikipediaGeoSearchResponse.GeoSearchItem> candidateMap = new LinkedHashMap<>();
            for (WikipediaGeoSearchResponse.GeoSearchItem item : candidates) {
                if (item.getPageid() != null) {
                    candidateMap.put(String.valueOf(item.getPageid()), item);
                }
            }

            String pageIdsParam = String.join("|", candidateMap.keySet());

            // Step 2: Fetch detailed page info, thumbnails, and descriptions
            URI detailsUri = UriComponentsBuilder.fromUriString(wikipediaApiUrl)
                    .queryParam("action", "query")
                    .queryParam("prop", "extracts|pageimages|info")
                    .queryParam("exintro", 1)
                    .queryParam("explaintext", 1)
                    .queryParam("exchars", 350)
                    .queryParam("pithumbsize", 600)
                    .queryParam("inprop", "url")
                    .queryParam("pageids", pageIdsParam)
                    .queryParam("format", "json")
                    .build()
                    .toUri();

            WikipediaPageDetailsResponse detailsResponse = restClient.get()
                    .uri(detailsUri)
                    .retrieve()
                    .body(WikipediaPageDetailsResponse.class);

            Map<String, WikipediaPageDetailsResponse.PageItem> pagesMap = (detailsResponse != null
                    && detailsResponse.getQuery() != null
                    && detailsResponse.getQuery().getPages() != null)
                    ? detailsResponse.getQuery().getPages()
                    : Collections.emptyMap();

            List<ScoredPlace> scoredPlaces = new ArrayList<>();

            for (Map.Entry<String, WikipediaGeoSearchResponse.GeoSearchItem> entry : candidateMap.entrySet()) {
                String pageId = entry.getKey();
                WikipediaGeoSearchResponse.GeoSearchItem geoItem = entry.getValue();
                WikipediaPageDetailsResponse.PageItem pageItem = pagesMap.get(pageId);

                String name = (pageItem != null && pageItem.getTitle() != null)
                        ? pageItem.getTitle().trim()
                        : geoItem.getTitle().trim();

                String description = (pageItem != null && pageItem.getExtract() != null && !pageItem.getExtract().trim().isEmpty())
                        ? pageItem.getExtract().trim()
                        : null;

                // Contradiction filter: if destination is in a known district (e.g. Hassan), reject results claiming to be in a different district
                if (hasDistrictContradiction(district, description, name)) {
                    continue;
                }

                Double placeLat = geoItem.getLat() != null ? geoItem.getLat() : latitude;
                Double placeLon = geoItem.getLon() != null ? geoItem.getLon() : longitude;

                String imageUrl = (pageItem != null && pageItem.getThumbnail() != null)
                        ? pageItem.getThumbnail().getSource()
                        : null;

                // Priority 2: Safe Wikimedia Commons fallback if Wikipedia thumbnail is missing
                if (imageUrl == null || imageUrl.isBlank()) {
                    imageUrl = fetchCommonsFallbackImage(name, destinationName, district, placeLat, placeLon);
                }

                String websiteUrl = (pageItem != null) ? pageItem.getFullurl() : null;

                double distanceKm = calculateDistanceKm(latitude, longitude, placeLat, placeLon);
                String category = categorizePlace(name, description);
                double score = computeRelevanceScore(name, description, category, distanceKm, destinationName, district, rawQuery, imageUrl != null);

                PlaceDto dto = PlaceDto.builder()
                        .name(name)
                        .category(category)
                        .description(description)
                        .latitude(placeLat)
                        .longitude(placeLon)
                        .address(name + ", " + destinationName)
                        .rating(null)
                        .imageUrl(imageUrl)
                        .websiteUrl(websiteUrl)
                        .build();

                scoredPlaces.add(new ScoredPlace(dto, score, distanceKm, name));
            }

            // Step 3: Deterministic sorting: highest score first, closest distance second, alphabetical third
            scoredPlaces.sort(Comparator
                    .comparingDouble(ScoredPlace::getScore).reversed()
                    .thenComparingDouble(ScoredPlace::getDistanceKm)
                    .thenComparing(ScoredPlace::getName));

            return scoredPlaces.stream()
                    .limit(15)
                    .map(ScoredPlace::getDto)
                    .toList();

        } catch (RestClientException e) {
            log.error("External Places API error: {}", e.getMessage());
            throw new WeatherServiceException("External places data service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error retrieving places for ({}, {}): {}", latitude, longitude, e.getMessage());
            throw new WeatherServiceException("Unexpected error retrieving attractions data", e);
        }
    }

    private boolean hasDistrictContradiction(String targetDistrict, String description, String title) {
        if (targetDistrict == null || targetDistrict.isBlank() || description == null || description.isBlank()) {
            return false;
        }

        String lowerDesc = description.toLowerCase();
        String lowerTitle = title != null ? title.toLowerCase() : "";
        String lowerTarget = targetDistrict.toLowerCase().replace(" district", "").trim();

        // List of Karnataka districts and major urban centers for boundary conflict detection
        List<String> karnatakaDistricts = List.of(
                "bagalkot", "bagalkote", "ballari", "bellary", "belagavi", "belgaum", "bengaluru urban",
                "bengaluru rural", "bengaluru", "bangalore", "bidar", "chamarajanagar", "chikkaballapur",
                "chikkamagaluru", "chikmagalur", "chitradurga", "dakshina kannada", "davanagere", "dharwad",
                "gadag", "hassan", "haveri", "kalaburagi", "gulbarga", "kodagu", "coorg", "kolar", "koppal",
                "mandya", "mysuru", "mysore", "raichur", "ramanagara", "shivamogga", "shimoga", "tumakuru",
                "tumkur", "udupi", "uttara kannada", "vijayanagara", "vijayapura", "bijapur", "yadgir"
        );

        for (String dist : karnatakaDistricts) {
            if (dist.equals(lowerTarget)) continue;
            // Ignore sub-match overlaps (e.g. bengaluru vs bengaluru urban/rural)
            if (lowerTarget.contains(dist) || dist.contains(lowerTarget)) continue;

            // Pattern checking: "in <dist> district", "in <dist>", "<dist> taluk", "of <dist> district", ", <dist>"
            if (lowerDesc.contains("in " + dist + " district")
                    || lowerDesc.contains("of " + dist + " district")
                    || lowerDesc.contains("in " + dist)
                    || lowerDesc.contains(dist + " taluk")
                    || lowerDesc.contains(", " + dist)
                    || lowerTitle.contains("(" + dist + ")")
                    || lowerTitle.contains("(" + dist + " district)")) {
                return true;
            }
        }
        return false;
    }

    private double computeRelevanceScore(
            String name,
            String description,
            String category,
            double distanceKm,
            String destinationName,
            String district,
            String rawQuery,
            boolean hasImage
    ) {
        double score = 50.0;

        // Proximity bonus: closer attractions within 10km get up to +30 points
        score += Math.max(0.0, 30.0 * (1.0 - (distanceKm / 10.0)));

        String nameLower = name != null ? name.toLowerCase() : "";
        String descLower = description != null ? description.toLowerCase() : "";
        String destLower = destinationName != null ? destinationName.toLowerCase() : "";
        String queryLower = rawQuery != null ? rawQuery.toLowerCase() : "";

        // Destination name / query matches
        if (nameLower.contains(destLower) || nameLower.contains(queryLower)) {
            score += 35.0;
        }
        if (descLower.contains(destLower) || descLower.contains(queryLower)) {
            score += 20.0;
        }

        // District context match
        if (district != null && !district.isBlank()) {
            String distLower = district.toLowerCase().replace(" district", "").trim();
            if (nameLower.contains(distLower)) {
                score += 20.0;
            }
            if (descLower.contains(distLower)) {
                score += 15.0;
            }
        }

        // Category relevance weighting
        switch (category) {
            case "Historical Site":
            case "Park & Nature":
                score += 20.0;
                break;
            case "Museum":
            case "Cultural Attraction":
                score += 15.0;
                break;
            case "Landmark":
                score += 10.0;
                break;
            default:
                score += 5.0;
                break;
        }

        // Content quality bonuses
        if (hasImage) {
            score += 10.0;
        }
        if (description != null && description.length() > 120) {
            score += 10.0;
        } else if (description != null && description.length() > 50) {
            score += 5.0;
        }

        return score;
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private String categorizePlace(String name, String description) {
        String text = ((name != null ? name : "") + " " + (description != null ? description : "")).toLowerCase();

        if (containsAny(text, "museum", "gallery", "exhibition", "art center", "planetarium")) {
            return "Museum";
        }
        if (containsAny(text, "tower", "monument", "statue", "bridge", "square", "gate", "arch", "fountain", "landmark", "obelisk", "street", "avenue", "boulevard")) {
            return "Landmark";
        }
        if (containsAny(text, "palace", "castle", "cathedral", "church", "basilica", "temple", "shrine", "mosque", "fort", "fortress", "ruins", "heritage", "monastery", "tomb")) {
            return "Historical Site";
        }
        if (containsAny(text, "park", "garden", "botanic", "lake", "zoo", "forest", "aquarium", "sanctuary", "waterfall", "mountain", "hill", "beach", "river", "ghat", "viewpoint")) {
            return "Park & Nature";
        }
        if (containsAny(text, "theater", "theatre", "opera", "stadium", "arena", "market", "bazaar", "mall", "auditorium")) {
            return "Cultural Attraction";
        }
        return "Attraction";
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String fetchCommonsFallbackImage(
            String placeName,
            String destinationName,
            String district,
            Double placeLat,
            Double placeLon
    ) {
        if (placeName == null || placeName.isBlank()) {
            return null;
        }

        // Primary: targeted search by place name
        String imageUrl = queryCommonsForImage(placeName, placeName, destinationName, district, placeLat, placeLon);
        if (imageUrl != null) {
            return imageUrl;
        }

        // Secondary: combine place name with destination name if distinct
        if (destinationName != null && !destinationName.isBlank()
                && !placeName.toLowerCase().contains(destinationName.toLowerCase())) {
            imageUrl = queryCommonsForImage(placeName + " " + destinationName, placeName, destinationName, district, placeLat, placeLon);
            if (imageUrl != null) {
                return imageUrl;
            }
        }

        return null;
    }

    private String queryCommonsForImage(
            String searchQuery,
            String placeName,
            String destinationName,
            String district,
            Double placeLat,
            Double placeLon
    ) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(wikimediaApiUrl)
                    .queryParam("action", "query")
                    .queryParam("generator", "search")
                    .queryParam("gsrsearch", searchQuery)
                    .queryParam("gsrnamespace", 6)
                    .queryParam("prop", "imageinfo")
                    .queryParam("iiprop", "url|size|extmetadata")
                    .queryParam("iiurlwidth", 600)
                    .queryParam("gsrlimit", 5)
                    .queryParam("format", "json")
                    .build()
                    .encode()
                    .toUri();

            WikimediaCommonsResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(WikimediaCommonsResponse.class);

            if (response == null || response.getQuery() == null || response.getQuery().getPages() == null) {
                return null;
            }

            for (WikimediaCommonsResponse.PageItem page : response.getQuery().getPages().values()) {
                if (isValidCommonsCandidate(page, placeName, destinationName, district, placeLat, placeLon)) {
                    WikimediaCommonsResponse.ImageInfo info = page.getImageinfo().get(0);
                    String url = (info.getThumburl() != null && !info.getThumburl().isBlank())
                            ? info.getThumburl()
                            : info.getUrl();

                    if (url != null && url.startsWith("https://")) {
                        log.debug("Found Wikimedia Commons fallback image for '{}': {}", placeName, url);
                        return url;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Wikimedia Commons fallback for '{}': {}", placeName, e.getMessage());
        }
        return null;
    }

    private boolean isValidCommonsCandidate(
            WikimediaCommonsResponse.PageItem page,
            String placeName,
            String destinationName,
            String district,
            Double placeLat,
            Double placeLon
    ) {
        if (page == null || page.getTitle() == null || page.getImageinfo() == null || page.getImageinfo().isEmpty()) {
            return false;
        }

        String title = page.getTitle();
        String titleLower = title.toLowerCase();

        // 1. Must be a supported image extension
        boolean isImageExtension = titleLower.endsWith(".jpg")
                || titleLower.endsWith(".jpeg")
                || titleLower.endsWith(".png")
                || titleLower.endsWith(".webp");

        if (!isImageExtension) {
            return false;
        }

        // 2. Reject non-photo graphics, maps, symbols, flags, diagrams, logos
        if (containsAny(titleLower,
                "flag of", "flag_", "logo", "coat of arms", "symbol", "map of", "location map",
                "locator_map", "locator map", "diagram", "icon", "chart", "sign", "seal of",
                "commons-logo", "emblem", "blank_map", "route_map", "constituency", "election")) {
            return false;
        }

        WikimediaCommonsResponse.ImageInfo info = page.getImageinfo().get(0);
        String desc = extractExtMetadata(info, "ImageDescription");
        String categories = extractExtMetadata(info, "Categories");
        String objectName = extractExtMetadata(info, "ObjectName");

        // 3. GPS Distance Validation (strictly reject candidate if metadata GPS is > 30 km from place)
        String gpsLatStr = extractExtMetadata(info, "GPSLatitude");
        String gpsLonStr = extractExtMetadata(info, "GPSLongitude");
        if (gpsLatStr != null && !gpsLatStr.isBlank() && gpsLonStr != null && !gpsLonStr.isBlank()
                && placeLat != null && placeLon != null) {
            try {
                double imgLat = Double.parseDouble(gpsLatStr.trim());
                double imgLon = Double.parseDouble(gpsLonStr.trim());
                double distKm = calculateDistanceKm(placeLat, placeLon, imgLat, imgLon);
                if (distKm > 30.0) {
                    log.debug("Rejecting Commons candidate '{}' for '{}': GPS distance {} km exceeds 30 km threshold",
                            title, placeName, distKm);
                    return false;
                }
            } catch (NumberFormatException ignored) {
                // If coordinates cannot be parsed, proceed with textual validation
            }
        }

        String fullMetadataText = (title + " "
                + (desc != null ? desc : "") + " "
                + (categories != null ? categories : "") + " "
                + (objectName != null ? objectName : "")).toLowerCase();

        // 4. Reject district / locality contradiction in Commons metadata
        if (hasDistrictContradiction(district, fullMetadataText, title)) {
            return false;
        }

        // 5. Reject other state contradictions if looking in Karnataka / Indian destinations
        if (district != null && !district.isBlank()) {
            List<String> otherStates = List.of(
                    "andhra pradesh", "tamil nadu", "kerala", "maharashtra", "telangana",
                    "gujarat", "rajasthan", "uttar pradesh", "west bengal", "bihar",
                    "odisha", "madhya pradesh", "punjab", "haryana", "visakhapatnam", "hyderabad", "chennai", "mumbai"
            );
            for (String state : otherStates) {
                if (fullMetadataText.contains(state)) {
                    return false;
                }
            }
        }

        // 6. Semantic Relevance Check:
        // Extract significant tokens from placeName (length >= 4, ignoring generic stop words)
        List<String> keyTokens = extractKeyPlaceTokens(placeName);
        if (keyTokens.isEmpty()) {
            return fullMetadataText.contains(placeName.toLowerCase().trim());
        }

        for (String token : keyTokens) {
            if (fullMetadataText.contains(token)) {
                // Reject mere street name collisions (e.g., "Arehalli Main Road" in another city)
                if (isMereStreetNameCollision(fullMetadataText, token, destinationName, district)) {
                    return false;
                }
                return true;
            }
        }

        return false;
    }

    private boolean isMereStreetNameCollision(String fullText, String token, String destinationName, String district) {
        String destLower = destinationName != null ? destinationName.toLowerCase().trim() : "";
        String distLower = district != null ? district.toLowerCase().replace(" district", "").trim() : "";

        // If the metadata explicitly mentions destination or district context, it's valid
        if (!destLower.isEmpty() && fullText.contains(destLower)) {
            return false;
        }
        if (!distLower.isEmpty() && fullText.contains(distLower)) {
            return false;
        }

        // Check if token only appears as a street/road name modifier
        return fullText.contains(token + " main road")
                || fullText.contains(token + " road")
                || fullText.contains(token + " street")
                || fullText.contains(token + " cross")
                || fullText.contains(token + " layout")
                || fullText.contains(token + " circle");
    }

    private List<String> extractKeyPlaceTokens(String placeName) {
        if (placeName == null) return Collections.emptyList();
        String cleaned = placeName.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");
        String[] parts = cleaned.split("\\s+");
        Set<String> stopWords = Set.of(
                "railway", "station", "temple", "church", "falls", "fort", "hill", "hills",
                "viewpoint", "park", "garden", "lake", "river", "cross", "road", "street",
                "main", "statue", "house", "hotel", "village", "town", "city", "taluk", "district", "karnataka",
                "india", "indian", "school", "college", "high", "anglo", "hall", "club",
                "academy", "institute", "institution", "memorial", "center", "centre",
                "layout", "circle", "near", "north", "south", "east", "west", "gate", "bridge", "tea"
        );

        List<String> tokens = new ArrayList<>();
        for (String part : parts) {
            if (part.length() >= 4 && !stopWords.contains(part)) {
                tokens.add(part);
            }
        }
        return tokens;
    }

    private String extractExtMetadata(WikimediaCommonsResponse.ImageInfo info, String key) {
        if (info == null || info.getExtmetadata() == null) {
            return null;
        }
        WikimediaCommonsResponse.ExtMetaItem item = info.getExtmetadata().get(key);
        return item != null ? item.getValue() : null;
    }

    @lombok.Value
    private static class ScoredPlace {
        PlaceDto dto;
        double score;
        double distanceKm;
        String name;
    }
}
