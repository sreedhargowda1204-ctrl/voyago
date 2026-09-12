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
public class TripShareResponse {

    private String shareToken;
    private String shareUrl;
    private Boolean active;
    private LocalDateTime createdAt;
}
