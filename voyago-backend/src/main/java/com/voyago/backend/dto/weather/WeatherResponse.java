package com.voyago.backend.dto.weather;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponse {
    private LocationDto location;
    private CurrentWeatherDto current;
    private List<DailyForecastDto> forecast;
}
