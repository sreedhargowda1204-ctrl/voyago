package com.voyago.backend.dto.destination;

import com.voyago.backend.dto.weather.LocationDto;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolvedDestination {
    private boolean catalogMatch;
    private String query;
    private String canonicalName;
    private String district;
    private String state;
    private String country;
    private Double latitude;
    private Double longitude;
    private DestinationCategory category;
    private String description;

    public LocationDto toLocationDto() {
        if (!catalogMatch) return null;
        return LocationDto.builder()
                .name(canonicalName)
                .country(country != null ? country : "India")
                .latitude(latitude)
                .longitude(longitude)
                .build();
    }

    public static ResolvedDestination fromEntity(String query, Destination destination) {
        if (destination == null) {
            return ResolvedDestination.builder()
                    .catalogMatch(false)
                    .query(query)
                    .build();
        }

        return ResolvedDestination.builder()
                .catalogMatch(true)
                .query(query)
                .canonicalName(destination.getName())
                .district(destination.getDistrict())
                .state(destination.getState())
                .country(destination.getCountry())
                .latitude(destination.getLatitude())
                .longitude(destination.getLongitude())
                .category(destination.getCategory())
                .description(destination.getDescription())
                .build();
    }

    public static ResolvedDestination notFound(String query) {
        return ResolvedDestination.builder()
                .catalogMatch(false)
                .query(query)
                .build();
    }
}
