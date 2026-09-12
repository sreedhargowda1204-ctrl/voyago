package com.voyago.backend.service;

import com.voyago.backend.dto.destination.ResolvedDestination;
import com.voyago.backend.dto.maps.*;
import com.voyago.backend.dto.places.PlacesResponse;
import com.voyago.backend.dto.weather.LocationDto;
import com.voyago.backend.dto.weather.OpenMeteoGeocodingResponse;
import com.voyago.backend.exception.DestinationNotFoundException;
import com.voyago.backend.exception.MapsServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MapsService {

    private final RestClient restClient;
    private final PlacesService placesService;
    private final DestinationResolver destinationResolver;
    private final String geocodingUrl;
    private final String routingBaseUrl;

    public MapsService(
            PlacesService placesService,
            DestinationResolver destinationResolver,
            @Value("${maps.geocoding.base-url:https://geocoding-api.open-meteo.com/v1/search}") String geocodingUrl,
            @Value("${maps.routing.base-url:https://router.project-osrm.org/route/v1/driving}") String routingBaseUrl
    ) {
        this.placesService = placesService;
        this.destinationResolver = destinationResolver;
        this.geocodingUrl = geocodingUrl;
        this.routingBaseUrl = routingBaseUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", "VoyagoTravelApp/1.0 (travel planning platform; contact@voyago.com)")
                .build();
    }

    /**
     * Resolve a destination name into geographic coordinates.
     */
    public MapResponse getDestinationCoordinates(String destination) {
        if (destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Destination query parameter is required and cannot be blank");
        }

        String query = destination.trim();

        // 1. Resolve via Karnataka Destination Catalog first
        ResolvedDestination resolved = destinationResolver.resolve(query);
        LocationDto location;

        if (resolved.isCatalogMatch()) {
            location = resolved.toLocationDto();
        } else {
            // Fallback to external Open-Meteo geocoding
            location = geocodeDestination(query);
        }

        return MapResponse.builder()
                .location(location)
                .build();
    }

    /**
     * Retrieve tourist places & attractions coordinates for a destination.
     * Reuses the verified PlacesService logic.
     */
    public PlacesResponse getPlacesForMap(String destination) {
        if (destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Destination query parameter is required and cannot be blank");
        }

        return placesService.getPlacesForDestination(destination.trim());
    }

    /**
     * Calculate a driving route between two sets of coordinates.
     */
    public RouteResponse calculateRoute(Double startLat, Double startLng, Double endLat, Double endLng) {
        validateCoordinates(startLat, startLng, endLat, endLng);

        try {
            // OSRM expects coordinates formatted as: {startLng},{startLat};{endLng},{endLat}
            String path = String.format("/%f,%f;%f,%f", startLng, startLat, endLng, endLat);
            URI uri = UriComponentsBuilder.fromUriString(routingBaseUrl + path)
                    .queryParam("overview", "full")
                    .queryParam("geometries", "geojson")
                    .build()
                    .toUri();

            OsrmRouteResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(OsrmRouteResponse.class);

            if (response == null || !"Ok".equalsIgnoreCase(response.getCode()) || response.getRoutes() == null || response.getRoutes().isEmpty()) {
                String errMsg = (response != null && response.getMessage() != null) ? response.getMessage() : "no routes found";
                throw new MapsServiceException("Unable to calculate route between specified coordinates: " + errMsg);
            }

            OsrmRouteResponse.Route route = response.getRoutes().get(0);

            // Convert distance (meters to kilometers, rounded to 2 decimal places)
            Double distanceKm = route.getDistance() != null
                    ? Math.round((route.getDistance() / 1000.0) * 100.0) / 100.0
                    : 0.0;

            // Convert duration (seconds to minutes, rounded to 1 decimal place)
            Double durationMinutes = route.getDuration() != null
                    ? Math.round((route.getDuration() / 60.0) * 10.0) / 10.0
                    : 0.0;

            // Convert GeoJSON coordinates [longitude, latitude] to RoutePointDto [latitude, longitude]
            List<RoutePointDto> geometryPoints = new ArrayList<>();
            if (route.getGeometry() != null && route.getGeometry().getCoordinates() != null) {
                for (List<Double> coord : route.getGeometry().getCoordinates()) {
                    if (coord != null && coord.size() >= 2) {
                        Double lon = coord.get(0);
                        Double lat = coord.get(1);
                        geometryPoints.add(RoutePointDto.builder()
                                .latitude(lat)
                                .longitude(lon)
                                .build());
                    }
                }
            }

            return RouteResponse.builder()
                    .start(RoutePointDto.builder().latitude(startLat).longitude(startLng).build())
                    .end(RoutePointDto.builder().latitude(endLat).longitude(endLng).build())
                    .distanceKm(distanceKm)
                    .durationMinutes(durationMinutes)
                    .geometry(geometryPoints)
                    .build();

        } catch (MapsServiceException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("External OSRM routing service error: {}", e.getMessage());
            throw new MapsServiceException("External routing service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error calculating route from ({}, {}) to ({}, {}): {}", startLat, startLng, endLat, endLng, e.getMessage());
            throw new MapsServiceException("Unexpected error calculating route", e);
        }
    }

    /**
     * Helper to validate geographic coordinate bounds.
     */
    public void validateCoordinates(Double startLat, Double startLng, Double endLat, Double endLng) {
        if (startLat == null || startLng == null || endLat == null || endLng == null) {
            throw new IllegalArgumentException("Start and end coordinates (startLat, startLng, endLat, endLng) are required and cannot be null");
        }

        if (startLat < -90.0 || startLat > 90.0) {
            throw new IllegalArgumentException("Start latitude must be between -90 and 90 degrees (got " + startLat + ")");
        }

        if (endLat < -90.0 || endLat > 90.0) {
            throw new IllegalArgumentException("End latitude must be between -90 and 90 degrees (got " + endLat + ")");
        }

        if (startLng < -180.0 || startLng > 180.0) {
            throw new IllegalArgumentException("Start longitude must be between -180 and 180 degrees (got " + startLng + ")");
        }

        if (endLng < -180.0 || endLng > 180.0) {
            throw new IllegalArgumentException("End longitude must be between -180 and 180 degrees (got " + endLng + ")");
        }
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
            log.error("Geocoding API error for destination '{}': {}", query, e.getMessage());
            throw new MapsServiceException("External geocoding service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error resolving destination coordinates for '{}'", query, e);
            throw new MapsServiceException("Unexpected error resolving destination coordinates", e);
        }
    }
}
