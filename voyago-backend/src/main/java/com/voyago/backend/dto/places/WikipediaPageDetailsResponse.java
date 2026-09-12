package com.voyago.backend.dto.places;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WikipediaPageDetailsResponse {

    private Query query;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Query {
        private Map<String, PageItem> pages;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PageItem {
        private Long pageid;
        private String title;
        private String extract;
        private Thumbnail thumbnail;
        private String fullurl;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Thumbnail {
        private String source;
        private Integer width;
        private Integer height;
    }
}
