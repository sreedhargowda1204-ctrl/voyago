package com.voyago.backend;

import com.voyago.backend.dto.CreatePackingItemRequest;
import com.voyago.backend.dto.PackingItemResponse;
import com.voyago.backend.dto.PackingSummaryResponse;
import com.voyago.backend.dto.UpdatePackingItemRequest;
import com.voyago.backend.entity.PackingItem;
import com.voyago.backend.entity.Role;
import com.voyago.backend.entity.Trip;
import com.voyago.backend.entity.User;
import com.voyago.backend.exception.DuplicateResourceException;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.PackingItemRepository;
import com.voyago.backend.repository.TripRepository;
import com.voyago.backend.repository.UserRepository;
import com.voyago.backend.service.PackingItemService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PackingItemServiceTest {

    @Mock
    private PackingItemRepository packingItemRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private PackingItemService packingItemService;

    private User userA;
    private User userB;
    private Trip tripA;
    private PackingItem itemA;

    @BeforeEach
    void setUp() {
        userA = User.builder()
                .id(1L)
                .email("usera@example.com")
                .name("User A")
                .role(Role.USER)
                .build();

        userB = User.builder()
                .id(2L)
                .email("userb@example.com")
                .name("User B")
                .role(Role.USER)
                .build();

        tripA = Trip.builder()
                .id(100L)
                .user(userA)
                .title("Trip to Tokyo")
                .destination("Tokyo")
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 10))
                .build();

        itemA = PackingItem.builder()
                .id(10L)
                .trip(tripA)
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(1)
                .packed(false)
                .notes("Keep in travel wallet")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuth(User user) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(user.getEmail());
        when(authentication.getName()).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    void testCreatePackingItem_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(100L, "CLOTHING", "T-Shirt"))
                .thenReturn(Optional.empty());

        PackingItem saved = PackingItem.builder()
                .id(11L)
                .trip(tripA)
                .itemName("T-Shirt")
                .category("CLOTHING")
                .quantity(3)
                .packed(false)
                .notes("Cotton shirts")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(packingItemRepository.save(any(PackingItem.class))).thenReturn(saved);

        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("  T-Shirt  ")
                .category("clothing") // test case normalization
                .quantity(3)
                .packed(false)
                .notes("Cotton shirts")
                .build();

        PackingItemResponse res = packingItemService.createPackingItem(100L, req);

        assertNotNull(res);
        assertEquals(11L, res.getId());
        assertEquals(100L, res.getTripId());
        assertEquals("T-Shirt", res.getItemName());
        assertEquals("CLOTHING", res.getCategory());
        assertEquals(3, res.getQuantity());
        assertFalse(res.getPacked());
    }

    @Test
    void testCreatePackingItem_DuplicateConflict() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(100L, "DOCUMENTS", "Passport"))
                .thenReturn(Optional.of(itemA));

        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(1)
                .build();

        assertThrows(DuplicateResourceException.class, () -> packingItemService.createPackingItem(100L, req));
    }

    @Test
    void testCreatePackingItem_InvalidCategory() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));

        CreatePackingItemRequest req = CreatePackingItemRequest.builder()
                .itemName("Tent")
                .category("CAMPING_GEAR") // not in whitelist
                .quantity(1)
                .build();

        assertThrows(IllegalArgumentException.class, () -> packingItemService.createPackingItem(100L, req));
    }

    @Test
    void testGetPackingItems_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByTripIdOrderByCategoryAscItemNameAsc(100L)).thenReturn(List.of(itemA));

        List<PackingItemResponse> list = packingItemService.getPackingItems(100L);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Passport", list.get(0).getItemName());
    }

    @Test
    void testGetPackingItem_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByIdAndTripId(10L, 100L)).thenReturn(Optional.of(itemA));

        PackingItemResponse res = packingItemService.getPackingItem(100L, 10L);

        assertNotNull(res);
        assertEquals(10L, res.getId());
        assertEquals("Passport", res.getItemName());
    }

    @Test
    void testGetPackingItem_NotFound() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByIdAndTripId(999L, 100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> packingItemService.getPackingItem(100L, 999L));
    }

    @Test
    void testUpdatePackingItem_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByIdAndTripId(10L, 100L)).thenReturn(Optional.of(itemA));
        when(packingItemRepository.findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(100L, "DOCUMENTS", "Passport"))
                .thenReturn(Optional.of(itemA)); // same ID is allowed

        when(packingItemRepository.save(any(PackingItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdatePackingItemRequest req = UpdatePackingItemRequest.builder()
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(2)
                .packed(true)
                .notes("Primary and secondary passports")
                .build();

        PackingItemResponse res = packingItemService.updatePackingItem(100L, 10L, req);

        assertNotNull(res);
        assertEquals("Passport", res.getItemName());
        assertEquals(2, res.getQuantity());
        assertTrue(res.getPacked());
        assertEquals("Primary and secondary passports", res.getNotes());
    }

    @Test
    void testUpdatePackingItem_DuplicateConflictWithOtherItem() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByIdAndTripId(10L, 100L)).thenReturn(Optional.of(itemA));

        PackingItem otherItem = PackingItem.builder()
                .id(20L)
                .trip(tripA)
                .itemName("Visa")
                .category("DOCUMENTS")
                .build();

        when(packingItemRepository.findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(100L, "DOCUMENTS", "Visa"))
                .thenReturn(Optional.of(otherItem)); // Different ID -> Conflict

        UpdatePackingItemRequest req = UpdatePackingItemRequest.builder()
                .itemName("Visa")
                .category("DOCUMENTS")
                .quantity(1)
                .build();

        assertThrows(DuplicateResourceException.class, () -> packingItemService.updatePackingItem(100L, 10L, req));
    }

    @Test
    void testTogglePackedStatus_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByIdAndTripId(10L, 100L)).thenReturn(Optional.of(itemA));
        when(packingItemRepository.save(any(PackingItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertFalse(itemA.getPacked());
        PackingItemResponse res = packingItemService.togglePackedStatus(100L, 10L);

        assertTrue(res.getPacked());
    }

    @Test
    void testDeletePackingItem_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.findByIdAndTripId(10L, 100L)).thenReturn(Optional.of(itemA));
        doNothing().when(packingItemRepository).delete(itemA);

        assertDoesNotThrow(() -> packingItemService.deletePackingItem(100L, 10L));
        verify(packingItemRepository, times(1)).delete(itemA);
    }

    @Test
    void testGetPackingSummary_EmptyTrip() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.countByTripId(100L)).thenReturn(0L);
        when(packingItemRepository.countByTripIdAndPacked(100L, true)).thenReturn(0L);

        PackingSummaryResponse summary = packingItemService.getPackingSummary(100L);

        assertNotNull(summary);
        assertEquals(0, summary.getTotalItems());
        assertEquals(0, summary.getPackedItems());
        assertEquals(0, summary.getUnpackedItems());
        assertEquals(0.0, summary.getCompletionPercentage());
    }

    @Test
    void testGetPackingSummary_CalculatedMetrics() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(packingItemRepository.countByTripId(100L)).thenReturn(10L);
        when(packingItemRepository.countByTripIdAndPacked(100L, true)).thenReturn(6L);

        PackingSummaryResponse summary = packingItemService.getPackingSummary(100L);

        assertNotNull(summary);
        assertEquals(10, summary.getTotalItems());
        assertEquals(6, summary.getPackedItems());
        assertEquals(4, summary.getUnpackedItems());
        assertEquals(60.0, summary.getCompletionPercentage());
    }

    @Test
    void testOwnershipIsolation_UserBCannotAccessTripA() {
        mockAuth(userB);
        when(tripRepository.findByIdAndUserId(100L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> packingItemService.getPackingItems(100L));
    }
}
