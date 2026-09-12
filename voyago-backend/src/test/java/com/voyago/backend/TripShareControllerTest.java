package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.TripShareController;
import com.voyago.backend.dto.PublicTripResponse;
import com.voyago.backend.dto.TripShareResponse;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.service.TripShareService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TripShareController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class TripShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripShareService tripShareService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void testCreateShare_Success_201() throws Exception {
        TripShareResponse res = TripShareResponse.builder()
                .shareToken("sample-share-token-xyz")
                .shareUrl("http://localhost:5173/shared/sample-share-token-xyz")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(tripShareService.createOrGetShare(100L)).thenReturn(res);

        mockMvc.perform(post("/api/trips/100/share")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareToken").value("sample-share-token-xyz"))
                .andExpect(jsonPath("$.shareUrl").value("http://localhost:5173/shared/sample-share-token-xyz"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void testGetShare_Success_200() throws Exception {
        TripShareResponse res = TripShareResponse.builder()
                .shareToken("sample-share-token-xyz")
                .shareUrl("http://localhost:5173/shared/sample-share-token-xyz")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(tripShareService.getShare(100L)).thenReturn(res);

        mockMvc.perform(get("/api/trips/100/share"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shareToken").value("sample-share-token-xyz"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void testGetShare_NotFound_404() throws Exception {
        when(tripShareService.getShare(100L))
                .thenThrow(new ResourceNotFoundException("Active share link not found for trip id: 100"));

        mockMvc.perform(get("/api/trips/100/share"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void testRevokeShare_Success_204() throws Exception {
        doNothing().when(tripShareService).revokeShare(100L);

        mockMvc.perform(delete("/api/trips/100/share"))
                .andExpect(status().isNoContent());
    }

    @Test
    void testGetPublicTrip_Success_200() throws Exception {
        PublicTripResponse res = PublicTripResponse.builder()
                .id(100L)
                .title("Trip to Rome")
                .destination("Rome")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 10, 7))
                .notes("Rome vacation")
                .itineraryItems(List.of())
                .expenses(List.of())
                .packingItems(List.of())
                .build();

        when(tripShareService.getPublicTrip("valid-token")).thenReturn(res);

        mockMvc.perform(get("/api/shared/trips/valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100L))
                .andExpect(jsonPath("$.title").value("Trip to Rome"))
                .andExpect(jsonPath("$.destination").value("Rome"));
    }

    @Test
    void testGetPublicTrip_InvalidToken_404() throws Exception {
        when(tripShareService.getPublicTrip("invalid-token"))
                .thenThrow(new ResourceNotFoundException("Shared trip not found or link has expired"));

        mockMvc.perform(get("/api/shared/trips/invalid-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void testGetPublicTrip_RevokedToken_404() throws Exception {
        when(tripShareService.getPublicTrip("revoked-token"))
                .thenThrow(new ResourceNotFoundException("Shared trip not found or link has expired"));

        mockMvc.perform(get("/api/shared/trips/revoked-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void testOwnerEndpoints_CrossUserRejection_404() throws Exception {
        when(tripShareService.createOrGetShare(999L))
                .thenThrow(new ResourceNotFoundException("Trip not found with id: 999"));

        mockMvc.perform(post("/api/trips/999/share"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
