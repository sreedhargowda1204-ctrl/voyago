package com.voyago.backend;

import com.voyago.backend.controller.DestinationController;
import com.voyago.backend.dto.destination.DestinationDto;
import com.voyago.backend.dto.destination.DestinationSearchResponse;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.exception.DestinationNotFoundException;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.security.CustomUserDetailsService;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.security.SecurityConfig;
import com.voyago.backend.service.DestinationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DestinationController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
public class DestinationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DestinationService destinationService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "alice@example.com")
    public void testSearchDestinations_Success() throws Exception {
        DestinationDto dto = DestinationDto.builder()
                .id(1L)
                .name("Sakleshpur")
                .district("Hassan")
                .category(DestinationCategory.HILL_STATION)
                .latitude(12.9698)
                .longitude(75.7824)
                .state("Karnataka")
                .country("India")
                .build();

        when(destinationService.searchDestinations("sak", 15))
                .thenReturn(DestinationSearchResponse.builder()
                        .query("sak")
                        .count(1)
                        .destinations(List.of(dto))
                        .build());

        mockMvc.perform(get("/api/destinations/search").param("query", "sak"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("sak"))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.destinations[0].name").value("Sakleshpur"))
                .andExpect(jsonPath("$.destinations[0].district").value("Hassan"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    public void testGetKarnatakaDestinations_Success() throws Exception {
        DestinationDto dto = DestinationDto.builder()
                .id(2L)
                .name("Bengaluru")
                .district("Bengaluru Urban")
                .category(DestinationCategory.CITY)
                .latitude(12.9715987)
                .longitude(77.5945627)
                .build();

        when(destinationService.getAllKarnatakaDestinations())
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/destinations/karnataka"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Bengaluru"))
                .andExpect(jsonPath("$[0].district").value("Bengaluru Urban"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    public void testGetDestinationById_Success() throws Exception {
        DestinationDto dto = DestinationDto.builder()
                .id(1L)
                .name("Sakleshpur")
                .district("Hassan")
                .category(DestinationCategory.HILL_STATION)
                .latitude(12.9698)
                .longitude(75.7824)
                .build();

        when(destinationService.getDestinationById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/destinations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Sakleshpur"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    public void testGetDestinationById_NotFound_404() throws Exception {
        when(destinationService.getDestinationById(999L))
                .thenThrow(new DestinationNotFoundException("Destination not found with id: 999"));

        mockMvc.perform(get("/api/destinations/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Destination not found with id: 999"));
    }
}
