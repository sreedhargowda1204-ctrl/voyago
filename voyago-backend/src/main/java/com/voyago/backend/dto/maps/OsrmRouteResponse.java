package com.voyago.backend.dto.maps;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OsrmRouteResponse {
    private String code;
    private String message;
    private List<Route> routes;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Route {
        private Double distance; // in meters
        private Double duration; // in seconds
        private Geometry geometry;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Geometry {
        private List<List<Double>> coordinates; // [ [lon, lat], ... ]
        private String type;
    }
}
