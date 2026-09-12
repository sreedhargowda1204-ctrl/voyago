package com.voyago.backend.dto.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenMeteoForecastResponse {

    private Double latitude;
    private Double longitude;
    private CurrentUnits current_units;
    private CurrentWeather current;
    private DailyForecast daily;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CurrentUnits {
        private String temperature_2m;
        private String relative_humidity_2m;
        private String apparent_temperature;
        private String precipitation;
        private String wind_speed_10m;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CurrentWeather {
        private String time;
        private Double temperature_2m;
        private Integer relative_humidity_2m;
        private Double apparent_temperature;
        private Double precipitation;
        private Integer weather_code;
        private Double wind_speed_10m;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DailyForecast {
        private List<String> time;
        private List<Integer> weather_code;
        private List<Double> temperature_2m_max;
        private List<Double> temperature_2m_min;
        private List<Integer> precipitation_probability_max;
    }
}
