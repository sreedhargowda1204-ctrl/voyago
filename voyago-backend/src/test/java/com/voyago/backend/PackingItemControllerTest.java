package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.PackingItemController;
import com.voyago.backend.dto.CreatePackingItemRequest;
import com.voyago.backend.dto.PackingItemResponse;
import com.voyago.backend.dto.PackingSummaryResponse;
import com.voyago.backend.dto.UpdatePackingItemRequest;
import com.voyago.backend.exception.DuplicateResourceException;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.service.PackingItemService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PackingItemController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class PackingItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PackingItemService packingItemService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void testCreatePackingItem_Success() throws Exception {
        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(1)
                .packed(false)
                .notes("Primary passport")
                .build();

        PackingItemResponse res = PackingItemResponse.builder()
                .id(1L)
                .tripId(100L)
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(1)
                .packed(false)
                .notes("Primary passport")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(packingItemService.createPackingItem(eq(100L), any(CreatePackingItemRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/trips/100/packing-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.itemName").value("Passport"))
                .andExpect(jsonPath("$.category").value("DOCUMENTS"))
                .andExpect(jsonPath("$.quantity").value(1))
                .andExpect(jsonPath("$.packed").value(false));
    }

    @Test
    void testCreatePackingItem_ValidationError_MissingName() throws Exception {
        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("")
                .category("DOCUMENTS")
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/trips/100/packing-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.itemName").exists());
    }

    @Test
    void testCreatePackingItem_ValidationError_InvalidQuantity() throws Exception {
        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("Water Bottle")
                .category("OTHER")
                .quantity(0)
                .build();

        mockMvc.perform(post("/api/trips/100/packing-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.quantity").exists());
    }

    @Test
    void testCreatePackingItem_DuplicateConflict_409() throws Exception {
        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(1)
                .build();

        when(packingItemService.createPackingItem(eq(100L), any(CreatePackingItemRequest.class)))
                .thenThrow(new DuplicateResourceException("Packing item 'Passport' already exists in category 'DOCUMENTS' for this trip"));

        mockMvc.perform(post("/api/trips/100/packing-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Packing item 'Passport' already exists in category 'DOCUMENTS' for this trip"));
    }

    @Test
    void testGetPackingItems_Success() throws Exception {
        PackingItemResponse res = PackingItemResponse.builder()
                .id(1L)
                .tripId(100L)
                .itemName("Sunscreen")
                .category("TOILETRIES")
                .quantity(1)
                .packed(true)
                .build();

        when(packingItemService.getPackingItems(100L)).thenReturn(List.of(res));

        mockMvc.perform(get("/api/trips/100/packing-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].itemName").value("Sunscreen"));
    }

    @Test
    void testGetPackingSummary_Success() throws Exception {
        PackingSummaryResponse summary = PackingSummaryResponse.builder()
                .totalItems(10)
                .packedItems(6)
                .unpackedItems(4)
                .completionPercentage(60.0)
                .build();

        when(packingItemService.getPackingSummary(100L)).thenReturn(summary);

        mockMvc.perform(get("/api/trips/100/packing-items/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(10))
                .andExpect(jsonPath("$.packedItems").value(6))
                .andExpect(jsonPath("$.unpackedItems").value(4))
                .andExpect(jsonPath("$.completionPercentage").value(60.0));
    }

    @Test
    void testGetPackingItem_Success() throws Exception {
        PackingItemResponse res = PackingItemResponse.builder()
                .id(5L)
                .tripId(100L)
                .itemName("Camera")
                .category("ELECTRONICS")
                .quantity(1)
                .packed(false)
                .build();

        when(packingItemService.getPackingItem(100L, 5L)).thenReturn(res);

        mockMvc.perform(get("/api/trips/100/packing-items/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5L))
                .andExpect(jsonPath("$.itemName").value("Camera"));
    }

    @Test
    void testGetPackingItem_NotFound_404() throws Exception {
        when(packingItemService.getPackingItem(100L, 999L))
                .thenThrow(new ResourceNotFoundException("Packing item not found with id: 999"));

        mockMvc.perform(get("/api/trips/100/packing-items/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void testUpdatePackingItem_Success() throws Exception {
        UpdatePackingItemRequest req = UpdatePackingItemRequest.builder()
                .itemName("Charger")
                .category("ELECTRONICS")
                .quantity(2)
                .packed(true)
                .build();

        PackingItemResponse res = PackingItemResponse.builder()
                .id(5L)
                .tripId(100L)
                .itemName("Charger")
                .category("ELECTRONICS")
                .quantity(2)
                .packed(true)
                .build();

        when(packingItemService.updatePackingItem(eq(100L), eq(5L), any(UpdatePackingItemRequest.class))).thenReturn(res);

        mockMvc.perform(put("/api/trips/100/packing-items/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(2))
                .andExpect(jsonPath("$.packed").value(true));
    }

    @Test
    void testTogglePackedStatus_Success() throws Exception {
        PackingItemResponse res = PackingItemResponse.builder()
                .id(5L)
                .tripId(100L)
                .itemName("Charger")
                .category("ELECTRONICS")
                .quantity(1)
                .packed(true)
                .build();

        when(packingItemService.togglePackedStatus(100L, 5L)).thenReturn(res);

        mockMvc.perform(patch("/api/trips/100/packing-items/5/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packed").value(true));
    }

    @Test
    void testDeletePackingItem_Success() throws Exception {
        doNothing().when(packingItemService).deletePackingItem(100L, 5L);

        mockMvc.perform(delete("/api/trips/100/packing-items/5"))
                .andExpect(status().isNoContent());
    }
}
