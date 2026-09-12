package com.voyago.backend.dto.destination;

import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DestinationDto {
    private Long id;
    private String name;
    private String district;
    private DestinationCategory category;
    private String description;
    private Double latitude;
    private Double longitude;
    private String state;
    private String country;
    private List<String> aliases;

    public static DestinationDto fromEntity(Destination destination) {
        if (destination == null) return null;

        List<String> aliasList = Collections.emptyList();
        if (destination.getAliases() != null && !destination.getAliases().isBlank()) {
            aliasList = Arrays.stream(destination.getAliases().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        return DestinationDto.builder()
                .id(destination.getId())
                .name(destination.getName())
                .district(destination.getDistrict())
                .category(destination.getCategory())
                .description(destination.getDescription())
                .latitude(destination.getLatitude())
                .longitude(destination.getLongitude())
                .state(destination.getState())
                .country(destination.getCountry())
                .aliases(aliasList)
                .build();
    }
}
