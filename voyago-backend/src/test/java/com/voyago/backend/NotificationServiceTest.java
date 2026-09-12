package com.voyago.backend;

import com.voyago.backend.dto.notification.NotificationResponse;
import com.voyago.backend.entity.*;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.*;
import com.voyago.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private ItineraryItemRepository itineraryItemRepository;

    @Mock
    private TripBudgetRepository tripBudgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User user1;
    private User user2;
    private Trip tripStartingIn7Days;
    private Trip tripStartedToday;
    private Trip regularTrip;

    @BeforeEach
    void setUp() {
        user1 = User.builder()
                .id(1L)
                .email("user1@voyago.com")
                .name("User One")
                .role(Role.USER)
                .build();

        user2 = User.builder()
                .id(2L)
                .email("user2@voyago.com")
                .name("User Two")
                .role(Role.USER)
                .build();

        LocalDate today = LocalDate.now();

        tripStartingIn7Days = Trip.builder()
                .id(101L)
                .user(user1)
                .title("Goa Beach Vacation")
                .destination("Goa")
                .startDate(today.plusDays(7))
                .endDate(today.plusDays(12))
                .build();

        tripStartedToday = Trip.builder()
                .id(102L)
                .user(user1)
                .title("Mysore Heritage Tour")
                .destination("Mysuru")
                .startDate(today)
                .endDate(today.plusDays(3))
                .build();

        regularTrip = Trip.builder()
                .id(103L)
                .user(user1)
                .title("Sakleshpur Trek")
                .destination("Sakleshpur")
                .startDate(today.plusDays(20))
                .endDate(today.plusDays(23))
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user1@voyago.com",
                        "password",
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );
    }

    @Test
    void testGenerateTripStartingNotification_Success() {
        when(tripRepository.findByUserId(1L)).thenReturn(List.of(tripStartingIn7Days));
        when(notificationRepository.existsByUserIdAndTripIdAndType(1L, 101L, NotificationType.TRIP_STARTING))
                .thenReturn(false);

        notificationService.generateNotificationsForUser(user1);

        verify(notificationRepository, times(1)).save(argThat(notification ->
                notification.getType() == NotificationType.TRIP_STARTING
                        && notification.getTitle().contains("Goa Beach Vacation")
                        && !notification.isRead()
                        && notification.getTrip().getId().equals(101L)
        ));
    }

    @Test
    void testGenerateTripStartingNotification_DuplicateIgnored() {
        when(tripRepository.findByUserId(1L)).thenReturn(List.of(tripStartingIn7Days));
        when(notificationRepository.existsByUserIdAndTripIdAndType(1L, 101L, NotificationType.TRIP_STARTING))
                .thenReturn(true);

        notificationService.generateNotificationsForUser(user1);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testGenerateTripStartedNotification_Success() {
        when(tripRepository.findByUserId(1L)).thenReturn(List.of(tripStartedToday));
        when(notificationRepository.existsByUserIdAndTripIdAndType(1L, 102L, NotificationType.TRIP_STARTED))
                .thenReturn(false);

        notificationService.generateNotificationsForUser(user1);

        verify(notificationRepository, times(1)).save(argThat(notification ->
                notification.getType() == NotificationType.TRIP_STARTED
                        && notification.getTitle().contains("Mysore Heritage Tour")
                        && notification.getMessage().contains("begins today")
        ));
    }

    @Test
    void testGenerateItineraryTodayNotification_Success() {
        LocalDate today = LocalDate.now();
        ItineraryItem item = ItineraryItem.builder()
                .id(201L)
                .trip(tripStartedToday)
                .title("Visit Mysore Palace")
                .date(today)
                .time(LocalTime.of(10, 0))
                .build();

        when(tripRepository.findByUserId(1L)).thenReturn(List.of(tripStartedToday));
        when(itineraryItemRepository.findByTripId(102L)).thenReturn(List.of(item));
        when(notificationRepository.existsByUserIdAndTripIdAndTypeAndCreatedAtBetween(
                eq(1L), eq(102L), eq(NotificationType.ITINERARY_TODAY), any(), any()
        )).thenReturn(false);

        notificationService.generateNotificationsForUser(user1);

        verify(notificationRepository, times(1)).save(argThat(notification ->
                notification.getType() == NotificationType.ITINERARY_TODAY
                        && notification.getTitle().contains("Today's Itinerary")
                        && notification.getMessage().contains("1 activity")
        ));
    }

    @Test
    void testGenerateBudgetExceededNotification_Success() {
        TripBudget budget = TripBudget.builder()
                .id(301L)
                .trip(regularTrip)
                .totalBudget(new BigDecimal("10000.00"))
                .currency("INR")
                .build();

        when(tripRepository.findByUserId(1L)).thenReturn(List.of(regularTrip));
        when(tripBudgetRepository.findByTripId(103L)).thenReturn(Optional.of(budget));
        when(expenseRepository.calculateTotalExpensesByTripId(103L)).thenReturn(new BigDecimal("12500.00"));
        when(notificationRepository.existsByUserIdAndTripIdAndType(1L, 103L, NotificationType.BUDGET_EXCEEDED))
                .thenReturn(false);

        notificationService.generateNotificationsForUser(user1);

        verify(notificationRepository, times(1)).save(argThat(notification ->
                notification.getType() == NotificationType.BUDGET_EXCEEDED
                        && notification.getTitle().contains("Budget Exceeded")
                        && notification.getMessage().contains("12500")
        ));
    }

    @Test
    void testGetUnreadCount_Success() {
        when(userRepository.findByEmail("user1@voyago.com")).thenReturn(Optional.of(user1));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);

        long count = notificationService.getUnreadCount();

        assertEquals(3L, count);
        verify(notificationRepository, times(1)).countByUserIdAndReadFalse(1L);
    }

    @Test
    void testMarkAsRead_Success() {
        Notification notification = Notification.builder()
                .id(501L)
                .user(user1)
                .trip(regularTrip)
                .type(NotificationType.TRIP_STARTING)
                .title("Test Notification")
                .message("Test Message")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("user1@voyago.com")).thenReturn(Optional.of(user1));
        when(notificationRepository.findByIdAndUserId(501L, 1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(501L);

        assertNotNull(response);
        assertTrue(response.isRead());
        assertEquals(501L, response.getId());
    }

    @Test
    void testMarkAsRead_CrossUserIsolation_Throws404() {
        when(userRepository.findByEmail("user1@voyago.com")).thenReturn(Optional.of(user1));
        when(notificationRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead(999L));
    }

    @Test
    void testMarkAllAsRead_Success() {
        when(userRepository.findByEmail("user1@voyago.com")).thenReturn(Optional.of(user1));
        when(notificationRepository.markAllAsReadByUserId(1L)).thenReturn(4);

        int updated = notificationService.markAllAsRead();

        assertEquals(4, updated);
        verify(notificationRepository, times(1)).markAllAsReadByUserId(1L);
    }

    @Test
    void testDeleteNotification_Success() {
        Notification notification = Notification.builder()
                .id(501L)
                .user(user1)
                .build();

        when(userRepository.findByEmail("user1@voyago.com")).thenReturn(Optional.of(user1));
        when(notificationRepository.findByIdAndUserId(501L, 1L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification(501L);

        verify(notificationRepository, times(1)).delete(notification);
    }

    @Test
    void testDeleteNotification_CrossUserIsolation_Throws404() {
        when(userRepository.findByEmail("user1@voyago.com")).thenReturn(Optional.of(user1));
        when(notificationRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.deleteNotification(999L));
        verify(notificationRepository, never()).delete(any());
    }
}
