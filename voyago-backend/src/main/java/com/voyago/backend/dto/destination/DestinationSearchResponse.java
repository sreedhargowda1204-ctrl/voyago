package com.voyago.backend.dto.destination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DestinationSearchResponse {
    private String query;
    private int count;
    private List<DestinationDto> destinations;
}
