package com.voyago.backend.dto.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenMeteoGeocodingResponse {
    private List<GeocodingResult> results;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeocodingResult {
        private String name;
        private String country;
        private Double latitude;
        private Double longitude;
        private String admin1;
    }
}
