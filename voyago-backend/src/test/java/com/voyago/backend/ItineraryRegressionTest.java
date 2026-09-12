package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.ItineraryItemController;
import com.voyago.backend.dto.CreateItineraryItemRequest;
import com.voyago.backend.dto.ItineraryItemResponse;
import com.voyago.backend.dto.UpdateItineraryItemRequest;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.security.CustomUserDetailsService;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.security.SecurityConfig;
import com.voyago.backend.service.ItineraryItemService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ItineraryItemController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
public class ItineraryRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ItineraryItemService itineraryItemService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "alice@example.com")
    void testCreateItineraryItem_Success_201() throws Exception {
        CreateItineraryItemRequest req = new CreateItineraryItemRequest();
        req.setTitle("Visit Louvre");
        req.setDescription("See Mona Lisa");
        req.setDate(LocalDate.of(2026, 7, 2));
        req.setTime(LocalTime.of(10, 0));
        req.setLocation("Louvre Museum");

        ItineraryItemResponse res = ItineraryItemResponse.builder()
                .id(201L)
                .tripId(101L)
                .title("Visit Louvre")
                .description("See Mona Lisa")
                .date(LocalDate.of(2026, 7, 2))
                .time(LocalTime.of(10, 0))
                .location("Louvre Museum")
                .build();

        when(itineraryItemService.createItineraryItem(eq(101L), any(CreateItineraryItemRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/trips/101/itinerary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(201))
                .andExpect(jsonPath("$.title").value("Visit Louvre"))
                .andExpect(jsonPath("$.location").value("Louvre Museum"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetItineraryItems_Success_200() throws Exception {
        ItineraryItemResponse res = ItineraryItemResponse.builder()
                .id(201L)
                .tripId(101L)
                .title("Visit Louvre")
                .date(LocalDate.of(2026, 7, 2))
                .build();

        when(itineraryItemService.getItineraryItems(101L)).thenReturn(List.of(res));

        mockMvc.perform(get("/api/trips/101/itinerary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Visit Louvre"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testUpdateItineraryItem_Success_200() throws Exception {
        UpdateItineraryItemRequest req = new UpdateItineraryItemRequest();
        req.setTitle("Visit Eiffel Tower");
        req.setDate(LocalDate.of(2026, 7, 3));

        ItineraryItemResponse res = ItineraryItemResponse.builder()
                .id(201L)
                .tripId(101L)
                .title("Visit Eiffel Tower")
                .date(LocalDate.of(2026, 7, 3))
                .build();

        when(itineraryItemService.updateItineraryItem(eq(101L), eq(201L), any(UpdateItineraryItemRequest.class))).thenReturn(res);

        mockMvc.perform(put("/api/trips/101/itinerary/201")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Visit Eiffel Tower"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testDeleteItineraryItem_Success_204() throws Exception {
        doNothing().when(itineraryItemService).deleteItineraryItem(101L, 201L);

        mockMvc.perform(delete("/api/trips/101/itinerary/201"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testCreateItineraryItem_MissingTitle_Throws400() throws Exception {
        CreateItineraryItemRequest req = new CreateItineraryItemRequest();
        req.setDate(LocalDate.of(2026, 7, 2));

        mockMvc.perform(post("/api/trips/101/itinerary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }
}
