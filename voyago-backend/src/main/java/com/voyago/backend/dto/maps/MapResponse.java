package com.voyago.backend.dto.maps;

import com.voyago.backend.dto.weather.LocationDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapResponse {
    private LocationDto location;
}
