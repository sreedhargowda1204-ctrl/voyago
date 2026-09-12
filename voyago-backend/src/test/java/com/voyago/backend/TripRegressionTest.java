package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.TripController;
import com.voyago.backend.dto.CreateTripRequest;
import com.voyago.backend.dto.TripResponse;
import com.voyago.backend.dto.UpdateTripRequest;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.security.CustomUserDetailsService;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.security.SecurityConfig;
import com.voyago.backend.service.TripService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TripController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
public class TripRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripService tripService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "alice@example.com")
    void testCreateTrip_Success_201() throws Exception {
        CreateTripRequest req = new CreateTripRequest();
        req.setTitle("Paris Vacation");
        req.setDestination("Paris, France");
        req.setStartDate(LocalDate.of(2026, 7, 1));
        req.setEndDate(LocalDate.of(2026, 7, 10));
        req.setNotes("Summer trip");

        TripResponse res = TripResponse.builder()
                .id(101L)
                .title("Paris Vacation")
                .destination("Paris, France")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 10))
                .notes("Summer trip")
                .build();

        when(tripService.createTrip(any(CreateTripRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.title").value("Paris Vacation"))
                .andExpect(jsonPath("$.destination").value("Paris, France"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetMyTrips_Success_200() throws Exception {
        TripResponse res = TripResponse.builder()
                .id(101L)
                .title("Paris Vacation")
                .destination("Paris, France")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 10))
                .build();

        when(tripService.getMyTrips()).thenReturn(List.of(res));

        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Paris Vacation"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetTripById_Success_200() throws Exception {
        TripResponse res = TripResponse.builder()
                .id(101L)
                .title("Paris Vacation")
                .destination("Paris, France")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 10))
                .build();

        when(tripService.getTrip(101L)).thenReturn(res);

        mockMvc.perform(get("/api/trips/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.destination").value("Paris, France"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testUpdateTrip_Success_200() throws Exception {
        UpdateTripRequest req = new UpdateTripRequest();
        req.setTitle("Updated Paris Vacation");
        req.setDestination("Paris, France");
        req.setStartDate(LocalDate.of(2026, 7, 2));
        req.setEndDate(LocalDate.of(2026, 7, 12));

        TripResponse res = TripResponse.builder()
                .id(101L)
                .title("Updated Paris Vacation")
                .destination("Paris, France")
                .startDate(LocalDate.of(2026, 7, 2))
                .endDate(LocalDate.of(2026, 7, 12))
                .build();

        when(tripService.updateTrip(eq(101L), any(UpdateTripRequest.class))).thenReturn(res);

        mockMvc.perform(put("/api/trips/101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Paris Vacation"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testDeleteTrip_Success_204() throws Exception {
        doNothing().when(tripService).deleteTrip(101L);

        mockMvc.perform(delete("/api/trips/101"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testCreateTrip_MissingRequiredTitle_Throws400() throws Exception {
        CreateTripRequest req = new CreateTripRequest();
        req.setDestination("Paris, France");
        req.setStartDate(LocalDate.of(2026, 7, 1));
        req.setEndDate(LocalDate.of(2026, 7, 10));

        mockMvc.perform(post("/api/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }
}
