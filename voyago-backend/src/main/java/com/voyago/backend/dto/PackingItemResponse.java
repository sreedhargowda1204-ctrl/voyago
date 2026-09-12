package com.voyago.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackingItemResponse {

    private Long id;
    private Long tripId;
    private String itemName;
    private String category;
    private Integer quantity;
    private Boolean packed;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
