package com.voyago.backend.dto.places;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WikipediaGeoSearchResponse {

    private Query query;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Query {
        private List<GeoSearchItem> geosearch;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeoSearchItem {
        private Long pageid;
        private String title;
        private Double lat;
        private Double lon;
        private Double dist;
    }
}
