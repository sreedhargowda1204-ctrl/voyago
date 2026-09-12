package com.voyago.backend.service;

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
    private final String geocodingUrl;
    private final String wikipediaApiUrl;

    public PlacesService(
            @Value("${weather.open-meteo.geocoding-url:https://geocoding-api.open-meteo.com/v1/search}") String geocodingUrl,
            @Value("${places.wikipedia.api-url:https://en.wikipedia.org/w/api.php}") String wikipediaApiUrl
    ) {
        this.geocodingUrl = geocodingUrl;
        this.wikipediaApiUrl = wikipediaApiUrl;

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

        // 1. Geocode destination
        LocationDto location = geocodeDestination(query);

        // 2. Fetch notable places & tourist attractions near coordinates (max 15)
        List<PlaceDto> places = fetchPlacesNear(location.getLatitude(), location.getLongitude(), location.getName());

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

    private List<PlaceDto> fetchPlacesNear(Double latitude, Double longitude, String destinationName) {
        try {
            // Step 1: Geosearch nearby points of interest (gsradius must be <= 10000 for MediaWiki API)
            URI geoSearchUri = UriComponentsBuilder.fromUriString(wikipediaApiUrl)
                    .queryParam("action", "query")
                    .queryParam("list", "geosearch")
                    .queryParam("gscoord", latitude + "|" + longitude)
                    .queryParam("gsradius", 10000)
                    .queryParam("gslimit", 30)
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

            // Filter out exact city name and generic administrative articles
            List<WikipediaGeoSearchResponse.GeoSearchItem> candidates = items.stream()
                    .filter(item -> {
                        String t = item.getTitle() != null ? item.getTitle().toLowerCase() : "";
                        return !t.equals(destLower)
                                && !t.startsWith("history of ")
                                && !t.startsWith("geography of ")
                                && !t.startsWith("transport in ")
                                && !t.startsWith("economy of ")
                                && !t.contains("arrondissement")
                                && !t.contains("constituency")
                                && !t.contains("legislative assembly");
                    })
                    .limit(20)
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
                    .queryParam("exchars", 300)
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

            List<PlaceDto> places = new ArrayList<>();

            for (Map.Entry<String, WikipediaGeoSearchResponse.GeoSearchItem> entry : candidateMap.entrySet()) {
                String pageId = entry.getKey();
                WikipediaGeoSearchResponse.GeoSearchItem geoItem = entry.getValue();
                WikipediaPageDetailsResponse.PageItem pageItem = pagesMap.get(pageId);

                String name = (pageItem != null && pageItem.getTitle() != null)
                        ? pageItem.getTitle()
                        : geoItem.getTitle();

                String description = (pageItem != null && pageItem.getExtract() != null && !pageItem.getExtract().trim().isEmpty())
                        ? pageItem.getExtract().trim()
                        : null;

                String imageUrl = (pageItem != null && pageItem.getThumbnail() != null)
                        ? pageItem.getThumbnail().getSource()
                        : null;

                String websiteUrl = (pageItem != null) ? pageItem.getFullurl() : null;

                Double placeLat = geoItem.getLat() != null ? geoItem.getLat() : latitude;
                Double placeLon = geoItem.getLon() != null ? geoItem.getLon() : longitude;

                String category = categorizePlace(name, description);
                Double rating = calculateRating(imageUrl, description);

                places.add(PlaceDto.builder()
                        .name(name)
                        .category(category)
                        .description(description)
                        .latitude(placeLat)
                        .longitude(placeLon)
                        .address(name + ", " + destinationName)
                        .rating(rating)
                        .imageUrl(imageUrl)
                        .websiteUrl(websiteUrl)
                        .build());

                if (places.size() >= 15) {
                    break;
                }
            }

            return places;
        } catch (RestClientException e) {
            log.error("External Places API error: {}", e.getMessage());
            throw new WeatherServiceException("External places data service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error retrieving places for ({}, {}): {}", latitude, longitude, e.getMessage());
            throw new WeatherServiceException("Unexpected error retrieving attractions data", e);
        }
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
        if (containsAny(text, "park", "garden", "botanic", "lake", "zoo", "forest", "aquarium", "sanctuary", "waterfall", "mountain", "hill", "beach", "river")) {
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

    private Double calculateRating(String imageUrl, String description) {
        double score = 4.6;
        if (imageUrl != null && !imageUrl.isEmpty()) {
            score += 0.2;
        }
        if (description != null && description.length() > 100) {
            score += 0.1;
        }
        return Math.min(4.9, Math.round(score * 10.0) / 10.0);
    }
}
