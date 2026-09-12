package com.voyago.backend;

import com.voyago.backend.dto.*;
import com.voyago.backend.entity.*;
import com.voyago.backend.exception.DuplicateResourceException;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.ExpenseRepository;
import com.voyago.backend.repository.TripBudgetRepository;
import com.voyago.backend.repository.TripRepository;
import com.voyago.backend.repository.UserRepository;
import com.voyago.backend.service.ExpenseService;
import com.voyago.backend.service.TripBudgetService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TripBudgetServiceTest {

    @Mock
    private TripBudgetRepository tripBudgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private TripBudgetService tripBudgetService;

    @InjectMocks
    private ExpenseService expenseService;

    private User userA;
    private User userB;
    private Trip tripA;

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
                .title("Trip to Paris")
                .destination("Paris")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 10))
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
    void testCreateBudget_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripBudgetRepository.existsByTripId(100L)).thenReturn(false);

        TripBudget saved = TripBudget.builder()
                .id(10L)
                .trip(tripA)
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(tripBudgetRepository.save(any(TripBudget.class))).thenReturn(saved);

        CreateBudgetRequest req = CreateBudgetRequest.builder()
                .totalBudget(new BigDecimal("50000.00"))
                .currency("inr")
                .build();

        BudgetResponse res = tripBudgetService.createBudget(100L, req);

        assertNotNull(res);
        assertEquals(10L, res.getId());
        assertEquals(100L, res.getTripId());
        assertEquals(new BigDecimal("50000.00"), res.getTotalBudget());
        assertEquals("INR", res.getCurrency());
    }

    @Test
    void testCreateBudget_DuplicateConflict() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripBudgetRepository.existsByTripId(100L)).thenReturn(true);

        CreateBudgetRequest req = CreateBudgetRequest.builder()
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .build();

        assertThrows(DuplicateResourceException.class, () -> tripBudgetService.createBudget(100L, req));
    }

    @Test
    void testGetBudget_NotFound() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));
        when(tripBudgetRepository.findByTripId(100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripBudgetService.getBudget(100L));
    }

    @Test
    void testCrossUser_UserBCannotAccessUserATrip() {
        mockAuth(userB);
        when(tripRepository.findByIdAndUserId(100L, 2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripBudgetService.getBudget(100L));
        assertThrows(ResourceNotFoundException.class, () -> expenseService.getExpenses(100L));
    }

    @Test
    void testBudgetSummary_CalculationsAndOverspending() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));

        TripBudget budget = TripBudget.builder()
                .id(10L)
                .trip(tripA)
                .totalBudget(new BigDecimal("50000"))
                .currency("INR")
                .build();
        when(tripBudgetRepository.findByTripId(100L)).thenReturn(Optional.of(budget));

        // Normal spending: Spent 23000 -> Remaining 27000
        when(expenseRepository.calculateTotalExpensesByTripId(100L)).thenReturn(new BigDecimal("23000"));
        when(expenseRepository.countByTripId(100L)).thenReturn(3L);

        BudgetSummaryResponse summary = tripBudgetService.getBudgetSummary(100L);
        assertEquals(new BigDecimal("50000"), summary.getTotalBudget());
        assertEquals(new BigDecimal("23000"), summary.getTotalSpent());
        assertEquals(new BigDecimal("27000"), summary.getRemainingBudget());
        assertEquals("INR", summary.getCurrency());
        assertEquals(3L, summary.getExpenseCount());

        // Overspending: Spent 55000 -> Remaining -5000
        when(expenseRepository.calculateTotalExpensesByTripId(100L)).thenReturn(new BigDecimal("55000"));
        when(expenseRepository.countByTripId(100L)).thenReturn(5L);

        BudgetSummaryResponse overspentSummary = tripBudgetService.getBudgetSummary(100L);
        assertEquals(new BigDecimal("50000"), overspentSummary.getTotalBudget());
        assertEquals(new BigDecimal("55000"), overspentSummary.getTotalSpent());
        assertEquals(new BigDecimal("-5000"), overspentSummary.getRemainingBudget());
        assertEquals(5L, overspentSummary.getExpenseCount());
    }

    @Test
    void testExpenseCRUD_Success() {
        mockAuth(userA);
        when(tripRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(tripA));

        Expense exp = Expense.builder()
                .id(501L)
                .trip(tripA)
                .category("HOTEL")
                .amount(new BigDecimal("15000.00"))
                .description("5 nights in Paris")
                .expenseDate(LocalDate.of(2026, 6, 2))
                .paymentMethod("Credit Card")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(expenseRepository.save(any(Expense.class))).thenReturn(exp);
        when(expenseRepository.findByIdAndTripId(501L, 100L)).thenReturn(Optional.of(exp));
        when(expenseRepository.findByTripIdOrderByExpenseDateDescCreatedAtDesc(100L)).thenReturn(List.of(exp));

        // Create
        CreateExpenseRequest createReq = CreateExpenseRequest.builder()
                .category("hotel")
                .amount(new BigDecimal("15000.00"))
                .description("5 nights in Paris")
                .expenseDate(LocalDate.of(2026, 6, 2))
                .paymentMethod("Credit Card")
                .build();
        ExpenseResponse created = expenseService.createExpense(100L, createReq);
        assertEquals(501L, created.getId());
        assertEquals("HOTEL", created.getCategory());

        // List
        List<ExpenseResponse> list = expenseService.getExpenses(100L);
        assertEquals(1, list.size());

        // Get single
        ExpenseResponse single = expenseService.getExpense(100L, 501L);
        assertEquals("HOTEL", single.getCategory());

        // Delete
        expenseService.deleteExpense(100L, 501L);
        verify(expenseRepository, times(1)).delete(exp);
    }
}
