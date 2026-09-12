package com.voyago.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackingSummaryResponse {

    private long totalItems;
    private long packedItems;
    private long unpackedItems;
    private double completionPercentage;
}
