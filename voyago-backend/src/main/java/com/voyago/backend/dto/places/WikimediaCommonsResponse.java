package com.voyago.backend.dto.places;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WikimediaCommonsResponse {

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
        private Integer ns;
        private String title;
        private List<ImageInfo> imageinfo;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImageInfo {
        private String url;
        private String thumburl;
        private String descriptionurl;
        private Integer width;
        private Integer height;
        private Integer thumbwidth;
        private Integer thumbheight;
        private Map<String, ExtMetaItem> extmetadata;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExtMetaItem {
        private String value;
        private String source;
    }
}
