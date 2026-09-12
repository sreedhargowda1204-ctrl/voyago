package com.voyago.backend.dto.weather;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyForecastDto {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Double minTemperature;
    private Double maxTemperature;
    private Integer precipitationProbability;
    private Integer weatherCode;
    private String condition;
}
