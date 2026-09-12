package com.voyago.backend.dto.places;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDto {
    private String name;
    private String category;
    private String description;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double rating;
    private String imageUrl;
    private String websiteUrl;
}
