package com.voyago.backend;

import com.voyago.backend.dto.*;
import com.voyago.backend.entity.Role;
import com.voyago.backend.entity.Trip;
import com.voyago.backend.entity.User;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.*;
import com.voyago.backend.service.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CrossUserSecurityRegressionTest {

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
    private TripShareRepository tripShareRepository;

    private TripService tripService;
    private ItineraryItemService itineraryItemService;
    private TripBudgetService tripBudgetService;
    private ExpenseService expenseService;
    private PackingItemService packingItemService;
    private TripShareService tripShareService;

    private User userA;
    private User userB;
    private Trip tripOfUserA;

    @BeforeEach
    void setUp() {
        userA = User.builder().id(1L).email("userA@example.com").role(Role.USER).build();
        userB = User.builder().id(2L).email("userB@example.com").role(Role.USER).build();

        tripOfUserA = Trip.builder()
                .id(100L)
                .user(userA)
                .title("User A's Secret Trip")
                .destination("Tokyo")
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 10))
                .build();

        tripService = new TripService(tripRepository, userRepository);
        itineraryItemService = new ItineraryItemService(itineraryItemRepository, tripRepository, userRepository);
        tripBudgetService = new TripBudgetService(tripBudgetRepository, expenseRepository, tripRepository, userRepository);
        expenseService = new ExpenseService(expenseRepository, tripRepository, userRepository);
        packingItemService = new PackingItemService(packingItemRepository, tripRepository, userRepository);
        tripShareService = new TripShareService(
                tripShareRepository,
                tripRepository,
                userRepository,
                itineraryItemRepository,
                tripBudgetRepository,
                expenseRepository,
                packingItemRepository
        );

        // Simulate User B logged into SecurityContextHolder
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        userB.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        when(userRepository.findByEmail("userB@example.com")).thenReturn(Optional.of(userB));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUserBCannotGetTripOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> tripService.getTrip(100L));
    }

    @Test
    void testUserBCannotUpdateTripOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        UpdateTripRequest req = new UpdateTripRequest();
        req.setTitle("Hacked Title");
        assertThrows(IllegalArgumentException.class, () -> tripService.updateTrip(100L, req));
    }

    @Test
    void testUserBCannotDeleteTripOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> tripService.deleteTrip(100L));
    }

    @Test
    void testUserBCannotAccessItineraryOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> itineraryItemService.getItineraryItems(100L));
        assertThrows(IllegalArgumentException.class, () -> itineraryItemService.getItineraryItem(100L, 50L));
    }

    @Test
    void testUserBCannotAccessBudgetOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripBudgetService.getBudget(100L));
        assertThrows(ResourceNotFoundException.class, () -> tripBudgetService.getBudgetSummary(100L));
    }

    @Test
    void testUserBCannotAccessExpensesOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> expenseService.getExpenses(100L));
        assertThrows(ResourceNotFoundException.class, () -> expenseService.getExpense(100L, 10L));
    }

    @Test
    void testUserBCannotAccessPackingItemsOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> packingItemService.getPackingItems(100L));
        assertThrows(ResourceNotFoundException.class, () -> packingItemService.getPackingSummary(100L));
        assertThrows(ResourceNotFoundException.class, () -> packingItemService.togglePackedStatus(100L, 20L));
    }

    @Test
    void testUserBCannotManageShareOfUserA() {
        when(tripRepository.findByIdAndUserId(100L, userB.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripShareService.createOrGetShare(100L));
        assertThrows(ResourceNotFoundException.class, () -> tripShareService.getShare(100L));
        assertThrows(ResourceNotFoundException.class, () -> tripShareService.revokeShare(100L));
    }
}
