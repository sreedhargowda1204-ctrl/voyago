package com.voyago.backend.dto.places;

import com.voyago.backend.dto.weather.LocationDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacesResponse {
    private LocationDto location;
    private List<PlaceDto> places;
}
