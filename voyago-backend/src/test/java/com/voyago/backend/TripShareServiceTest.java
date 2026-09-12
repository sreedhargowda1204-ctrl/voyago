package com.voyago.backend;

import com.voyago.backend.dto.PublicTripResponse;
import com.voyago.backend.dto.TripShareResponse;
import com.voyago.backend.entity.*;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.*;
import com.voyago.backend.service.TripShareService;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TripShareServiceTest {

    @Mock
    private TripShareRepository tripShareRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ItineraryItemRepository itineraryItemRepository;

    @Mock
    private TripBudgetRepository tripBudgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private PackingItemRepository packingItemRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private TripShareService tripShareService;

    private User userA;
    private User userB;
    private Trip tripA;
    private TripShare shareA;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tripShareService, "frontendUrl", "http://localhost:5173");

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
                .title("Trip to Rome")
                .destination("Rome")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 10, 7))
                .notes("Colosseum and Vatican visit")
                .build();

        shareA = TripShare.builder()
                .id(10L)
                .trip(tripA)
                .shareToken("sample-secure-token-12345")
                .active(true)
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
    void testCreateShare_NewShare() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripShareRepository.findByTripIdAndActiveTrue(100L)).thenReturn(Optional.empty());
        when(tripShareRepository.findByTripId(100L)).thenReturn(Optional.empty());
        when(tripShareRepository.save(any(TripShare.class))).thenAnswer(invocation -> {
            TripShare ts = invocation.getArgument(0);
            ts.setId(10L);
            ts.setCreatedAt(LocalDateTime.now());
            return ts;
        });

        TripShareResponse res = tripShareService.createOrGetShare(100L);

        assertNotNull(res);
        assertNotNull(res.getShareToken());
        assertTrue(res.getShareToken().length() >= 32);
        assertTrue(res.getActive());
        assertTrue(res.getShareUrl().contains("/shared/" + res.getShareToken()));
        verify(tripShareRepository, times(1)).save(any(TripShare.class));
    }

    @Test
    void testCreateShare_ReturnExistingActiveShare() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripShareRepository.findByTripIdAndActiveTrue(100L)).thenReturn(Optional.of(shareA));

        TripShareResponse res = tripShareService.createOrGetShare(100L);

        assertNotNull(res);
        assertEquals("sample-secure-token-12345", res.getShareToken());
        assertEquals("http://localhost:5173/shared/sample-secure-token-12345", res.getShareUrl());
        assertTrue(res.getActive());
        verify(tripShareRepository, never()).save(any(TripShare.class));
    }

    @Test
    void testGetShare_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripShareRepository.findByTripIdAndActiveTrue(100L)).thenReturn(Optional.of(shareA));

        TripShareResponse res = tripShareService.getShare(100L);

        assertNotNull(res);
        assertEquals("sample-secure-token-12345", res.getShareToken());
        assertTrue(res.getActive());
    }

    @Test
    void testGetShare_NotFound() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripShareRepository.findByTripIdAndActiveTrue(100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripShareService.getShare(100L));
    }

    @Test
    void testRevokeShare_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripShareRepository.findByTripIdAndActiveTrue(100L)).thenReturn(Optional.of(shareA));
        when(tripShareRepository.save(any(TripShare.class))).thenAnswer(invocation -> invocation.getArgument(0));

        tripShareService.revokeShare(100L);

        assertFalse(shareA.getActive());
        verify(tripShareRepository, times(1)).save(shareA);
    }

    @Test
    void testRevokeShare_AlreadyInactiveDoesNotFail() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripShareRepository.findByTripIdAndActiveTrue(100L)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> tripShareService.revokeShare(100L));
    }

    @Test
    void testGetPublicTrip_Success() {
        when(tripShareRepository.findByShareTokenAndActiveTrue("sample-secure-token-12345"))
                .thenReturn(Optional.of(shareA));

        ItineraryItem item = ItineraryItem.builder()
                .id(1L)
                .trip(tripA)
                .title("Colosseum Tour")
                .description("Guided tour")
                .date(LocalDate.of(2026, 10, 2))
                .time(LocalTime.of(10, 0))
                .location("Piazza del Colosseo")
                .build();
        when(itineraryItemRepository.findByTripIdOrderByDateAscTimeAsc(100L)).thenReturn(List.of(item));

        TripBudget budget = TripBudget.builder()
                .id(1L)
                .trip(tripA)
                .totalBudget(new BigDecimal("40000.00"))
                .currency("EUR")
                .build();
        when(tripBudgetRepository.findByTripId(100L)).thenReturn(Optional.of(budget));
        when(expenseRepository.calculateTotalExpensesByTripId(100L)).thenReturn(new BigDecimal("15000.00"));
        when(expenseRepository.countByTripId(100L)).thenReturn(2L);

        Expense exp = Expense.builder()
                .id(1L)
                .trip(tripA)
                .category("HOTEL")
                .amount(new BigDecimal("12000.00"))
                .description("Hotel stay")
                .expenseDate(LocalDate.of(2026, 10, 1))
                .paymentMethod("Credit Card")
                .build();
        when(expenseRepository.findByTripIdOrderByExpenseDateDescCreatedAtDesc(100L)).thenReturn(List.of(exp));

        PackingItem pack = PackingItem.builder()
                .id(1L)
                .trip(tripA)
                .itemName("Passport")
                .category("DOCUMENTS")
                .quantity(1)
                .packed(true)
                .notes("Carry in bag")
                .build();
        when(packingItemRepository.findByTripIdOrderByCategoryAscItemNameAsc(100L)).thenReturn(List.of(pack));

        PublicTripResponse res = tripShareService.getPublicTrip("sample-secure-token-12345");

        assertNotNull(res);
        assertEquals(100L, res.getId());
        assertEquals("Trip to Rome", res.getTitle());
        assertEquals("Rome", res.getDestination());
        assertEquals("Colosseum and Vatican visit", res.getNotes());

        // Verify Itinerary
        assertEquals(1, res.getItineraryItems().size());
        assertEquals("Colosseum Tour", res.getItineraryItems().get(0).getTitle());

        // Verify Budget & Expenses
        assertNotNull(res.getBudgetSummary());
        assertEquals(new BigDecimal("40000.00"), res.getBudgetSummary().getTotalBudget());
        assertEquals(new BigDecimal("15000.00"), res.getBudgetSummary().getTotalSpent());
        assertEquals(new BigDecimal("25000.00"), res.getBudgetSummary().getRemainingBudget());
        assertEquals("EUR", res.getBudgetSummary().getCurrency());
        assertEquals(2, res.getBudgetSummary().getExpenseCount());
        assertEquals(1, res.getExpenses().size());
        assertEquals("HOTEL", res.getExpenses().get(0).getCategory());

        // Verify Packing
        assertEquals(1, res.getPackingItems().size());
        assertEquals("Passport", res.getPackingItems().get(0).getItemName());
        assertNotNull(res.getPackingSummary());
        assertEquals(1, res.getPackingSummary().getTotalItems());
        assertEquals(1, res.getPackingSummary().getPackedItems());
        assertEquals(100.0, res.getPackingSummary().getCompletionPercentage());
    }

    @Test
    void testGetPublicTrip_InvalidOrRevokedToken_Throws404() {
        when(tripShareRepository.findByShareTokenAndActiveTrue("revoked-token")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripShareService.getPublicTrip("revoked-token"));
    }

    @Test
    void testOwnershipIsolation_UserBCannotAccessUserATripShare() {
        mockAuth(userB);
        when(tripRepository.findByIdAndUserId(100L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripShareService.createOrGetShare(100L));
        assertThrows(ResourceNotFoundException.class, () -> tripShareService.getShare(100L));
        assertThrows(ResourceNotFoundException.class, () -> tripShareService.revokeShare(100L));
    }
}
