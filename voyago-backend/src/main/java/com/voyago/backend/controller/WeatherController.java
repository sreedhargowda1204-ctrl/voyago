package com.voyago.backend.controller;

import com.voyago.backend.dto.weather.WeatherResponse;
import com.voyago.backend.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping
    public ResponseEntity<WeatherResponse> getWeather(
            @RequestParam(name = "destination", required = false) String destination
    ) {
        if (destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Destination query parameter is required and cannot be blank");
        }

        return ResponseEntity.ok(weatherService.getWeatherForDestination(destination.trim()));
    }
}
