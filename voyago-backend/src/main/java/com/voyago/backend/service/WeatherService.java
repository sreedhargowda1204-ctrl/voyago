package com.voyago.backend.service;

import com.voyago.backend.dto.weather.*;
import com.voyago.backend.exception.DestinationNotFoundException;
import com.voyago.backend.exception.WeatherServiceException;
import com.voyago.backend.util.WeatherCodeMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class WeatherService {

    private final RestClient restClient;
    private final String geocodingUrl;
    private final String forecastUrl;

    public WeatherService(
            @Value("${weather.open-meteo.geocoding-url:https://geocoding-api.open-meteo.com/v1/search}") String geocodingUrl,
            @Value("${weather.open-meteo.forecast-url:https://api.open-meteo.com/v1/forecast}") String forecastUrl
    ) {
        this.geocodingUrl = geocodingUrl;
        this.forecastUrl = forecastUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public WeatherResponse getWeatherForDestination(String destination) {
        if (destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Destination parameter is required and cannot be blank");
        }

        String query = destination.trim();

        // 1. Geocode the destination
        OpenMeteoGeocodingResponse.GeocodingResult locationResult = geocodeDestination(query);

        // 2. Fetch forecast data for coordinates
        OpenMeteoForecastResponse forecastData = fetchForecast(locationResult.getLatitude(), locationResult.getLongitude());

        // 3. Map to structured frontend-friendly response
        return mapToWeatherResponse(locationResult, forecastData);
    }

    private OpenMeteoGeocodingResponse.GeocodingResult geocodeDestination(String query) {
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

            return response.getResults().get(0);
        } catch (DestinationNotFoundException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("Geocoding API error for query '{}': {}", query, e.getMessage());
            throw new WeatherServiceException("External geocoding service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during geocoding for '{}': {}", query, e.getMessage());
            throw new WeatherServiceException("Unexpected error resolving destination location", e);
        }
    }

    private OpenMeteoForecastResponse fetchForecast(Double latitude, Double longitude) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(forecastUrl)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m")
                    .queryParam("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max")
                    .queryParam("timezone", "auto")
                    .build()
                    .toUri();

            OpenMeteoForecastResponse response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(OpenMeteoForecastResponse.class);

            if (response == null || response.getCurrent() == null) {
                throw new WeatherServiceException("Weather forecast data is currently unavailable for coordinates: " + latitude + ", " + longitude);
            }

            return response;
        } catch (WeatherServiceException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("Forecast API error for coordinates ({}, {}): {}", latitude, longitude, e.getMessage());
            throw new WeatherServiceException("External forecast service error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error fetching forecast for ({}, {}): {}", latitude, longitude, e.getMessage());
            throw new WeatherServiceException("Unexpected error retrieving weather forecast", e);
        }
    }

    private WeatherResponse mapToWeatherResponse(
            OpenMeteoGeocodingResponse.GeocodingResult location,
            OpenMeteoForecastResponse forecast
    ) {
        // Location DTO
        LocationDto locationDto = LocationDto.builder()
                .name(location.getName())
                .country(location.getCountry())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .build();

        // Current Weather DTO
        CurrentWeatherDto currentWeatherDto = null;
        if (forecast.getCurrent() != null) {
            OpenMeteoForecastResponse.CurrentWeather curr = forecast.getCurrent();
            currentWeatherDto = CurrentWeatherDto.builder()
                    .temperature(curr.getTemperature_2m())
                    .feelsLike(curr.getApparent_temperature())
                    .humidity(curr.getRelative_humidity_2m())
                    .windSpeed(curr.getWind_speed_10m())
                    .precipitation(curr.getPrecipitation())
                    .weatherCode(curr.getWeather_code())
                    .condition(WeatherCodeMapper.mapCodeToCondition(curr.getWeather_code()))
                    .build();
        }

        // Daily Forecast List
        List<DailyForecastDto> dailyForecastList = new ArrayList<>();
        if (forecast.getDaily() != null && forecast.getDaily().getTime() != null) {
            OpenMeteoForecastResponse.DailyForecast daily = forecast.getDaily();
            int daysCount = daily.getTime().size();

            for (int i = 0; i < daysCount; i++) {
                String dateStr = daily.getTime().get(i);
                LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : null;

                Double maxTemp = (daily.getTemperature_2m_max() != null && i < daily.getTemperature_2m_max().size())
                        ? daily.getTemperature_2m_max().get(i) : null;
                Double minTemp = (daily.getTemperature_2m_min() != null && i < daily.getTemperature_2m_min().size())
                        ? daily.getTemperature_2m_min().get(i) : null;
                Integer precipProb = (daily.getPrecipitation_probability_max() != null && i < daily.getPrecipitation_probability_max().size())
                        ? daily.getPrecipitation_probability_max().get(i) : null;
                Integer weatherCode = (daily.getWeather_code() != null && i < daily.getWeather_code().size())
                        ? daily.getWeather_code().get(i) : null;

                dailyForecastList.add(DailyForecastDto.builder()
                        .date(date)
                        .minTemperature(minTemp)
                        .maxTemperature(maxTemp)
                        .precipitationProbability(precipProb)
                        .weatherCode(weatherCode)
                        .condition(WeatherCodeMapper.mapCodeToCondition(weatherCode))
                        .build());
            }
        }

        return WeatherResponse.builder()
                .location(locationDto)
                .current(currentWeatherDto)
                .forecast(dailyForecastList)
                .build();
    }
}
