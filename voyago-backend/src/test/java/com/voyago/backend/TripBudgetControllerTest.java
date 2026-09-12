package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.ExpenseController;
import com.voyago.backend.controller.TripBudgetController;
import com.voyago.backend.dto.*;
import com.voyago.backend.exception.DuplicateResourceException;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.service.ExpenseService;
import com.voyago.backend.service.TripBudgetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {TripBudgetController.class, ExpenseController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class TripBudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripBudgetService tripBudgetService;

    @MockBean
    private ExpenseService expenseService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    // --- Budget Endpoints Tests ---

    @Test
    void testCreateBudget_Status201() throws Exception {
        CreateBudgetRequest request = CreateBudgetRequest.builder()
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .build();

        BudgetResponse response = BudgetResponse.builder()
                .id(1L)
                .tripId(10L)
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(tripBudgetService.createBudget(eq(10L), any(CreateBudgetRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/trips/10/budget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.tripId").value(10))
                .andExpect(jsonPath("$.totalBudget").value(50000.00))
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    void testCreateBudget_ValidationError_NegativeBudget() throws Exception {
        CreateBudgetRequest request = CreateBudgetRequest.builder()
                .totalBudget(new BigDecimal("-100"))
                .currency("INR")
                .build();

        mockMvc.perform(post("/api/trips/10/budget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.totalBudget").exists());
    }

    @Test
    void testCreateBudget_ValidationError_InvalidCurrency() throws Exception {
        CreateBudgetRequest request = CreateBudgetRequest.builder()
                .totalBudget(new BigDecimal("1000"))
                .currency("TOOLONG")
                .build();

        mockMvc.perform(post("/api/trips/10/budget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.currency").exists());
    }

    @Test
    void testCreateBudget_DuplicateConflict_Status409() throws Exception {
        CreateBudgetRequest request = CreateBudgetRequest.builder()
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .build();

        when(tripBudgetService.createBudget(eq(10L), any(CreateBudgetRequest.class)))
                .thenThrow(new DuplicateResourceException("A budget has already been created for trip with id: 10"));

        mockMvc.perform(post("/api/trips/10/budget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("A budget has already been created for trip with id: 10"));
    }

    @Test
    void testGetBudget_Status200() throws Exception {
        BudgetResponse response = BudgetResponse.builder()
                .id(1L)
                .tripId(10L)
                .totalBudget(new BigDecimal("50000.00"))
                .currency("INR")
                .build();

        when(tripBudgetService.getBudget(10L)).thenReturn(response);

        mockMvc.perform(get("/api/trips/10/budget"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBudget").value(50000.00))
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    void testGetBudget_NotFound_Status404() throws Exception {
        when(tripBudgetService.getBudget(10L))
                .thenThrow(new ResourceNotFoundException("Budget not found for trip with id: 10"));

        mockMvc.perform(get("/api/trips/10/budget"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void testDeleteBudget_Status204() throws Exception {
        doNothing().when(tripBudgetService).deleteBudget(10L);

        mockMvc.perform(delete("/api/trips/10/budget"))
                .andExpect(status().isNoContent());
    }

    @Test
    void testGetBudgetSummary_Status200() throws Exception {
        BudgetSummaryResponse summary = BudgetSummaryResponse.builder()
                .tripId(10L)
                .totalBudget(new BigDecimal("50000.00"))
                .totalSpent(new BigDecimal("23000.00"))
                .remainingBudget(new BigDecimal("27000.00"))
                .currency("INR")
                .expenseCount(3)
                .build();

        when(tripBudgetService.getBudgetSummary(10L)).thenReturn(summary);

        mockMvc.perform(get("/api/trips/10/budget/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBudget").value(50000.00))
                .andExpect(jsonPath("$.totalSpent").value(23000.00))
                .andExpect(jsonPath("$.remainingBudget").value(27000.00))
                .andExpect(jsonPath("$.expenseCount").value(3));
    }

    // --- Expense Endpoints Tests ---

    @Test
    void testCreateExpense_Status201() throws Exception {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .category("HOTEL")
                .amount(new BigDecimal("15000.00"))
                .description("Hotel stay")
                .expenseDate(LocalDate.of(2026, 6, 2))
                .paymentMethod("Credit Card")
                .build();

        ExpenseResponse response = ExpenseResponse.builder()
                .id(101L)
                .tripId(10L)
                .category("HOTEL")
                .amount(new BigDecimal("15000.00"))
                .description("Hotel stay")
                .expenseDate(LocalDate.of(2026, 6, 2))
                .paymentMethod("Credit Card")
                .build();

        when(expenseService.createExpense(eq(10L), any(CreateExpenseRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/trips/10/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.category").value("HOTEL"))
                .andExpect(jsonPath("$.amount").value(15000.00));
    }

    @Test
    void testCreateExpense_ValidationError_InvalidCategory() throws Exception {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .category("INVALID_CAT")
                .amount(new BigDecimal("50.00"))
                .expenseDate(LocalDate.of(2026, 6, 2))
                .build();

        mockMvc.perform(post("/api/trips/10/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.category").exists());
    }

    @Test
    void testGetExpenses_Status200() throws Exception {
        ExpenseResponse exp = ExpenseResponse.builder()
                .id(101L)
                .tripId(10L)
                .category("FOOD")
                .amount(new BigDecimal("500.00"))
                .expenseDate(LocalDate.of(2026, 6, 2))
                .build();

        when(expenseService.getExpenses(10L)).thenReturn(List.of(exp));

        mockMvc.perform(get("/api/trips/10/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].category").value("FOOD"));
    }

    @Test
    void testDeleteExpense_Status204() throws Exception {
        doNothing().when(expenseService).deleteExpense(10L, 101L);

        mockMvc.perform(delete("/api/trips/10/expenses/101"))
                .andExpect(status().isNoContent());
    }
}
