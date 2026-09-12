package com.voyago.backend.dto.maps;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponse {
    private RoutePointDto start;
    private RoutePointDto end;
    private Double distanceKm;
    private Double durationMinutes;
    private List<RoutePointDto> geometry;
}
