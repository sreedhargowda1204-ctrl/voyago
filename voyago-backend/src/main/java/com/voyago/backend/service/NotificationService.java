package com.voyago.backend.service;

import com.voyago.backend.dto.notification.NotificationResponse;
import com.voyago.backend.entity.*;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final TripBudgetRepository tripBudgetRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional
    public List<NotificationResponse> getUserNotifications() {
        User user = getCurrentUser();
        generateNotificationsForUser(user);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User user = getCurrentUser();
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    @Transactional
    public int markAllAsRead() {
        User user = getCurrentUser();
        return notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void deleteNotification(Long id) {
        User user = getCurrentUser();
        Notification notification = notificationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        notificationRepository.delete(notification);
    }

    @Transactional
    public List<NotificationResponse> generateAndFetchNotifications() {
        User user = getCurrentUser();
        generateNotificationsForUser(user);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void generateNotificationsForUser(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        LocalDate today = LocalDate.now();
        List<Trip> trips = tripRepository.findByUserId(user.getId());

        for (Trip trip : trips) {
            evaluateTripStarting(user, trip, today);
            evaluateTripStarted(user, trip, today);
            evaluateItineraryToday(user, trip, today);
            evaluateBudgetExceeded(user, trip);
        }
    }

    private void evaluateTripStarting(User user, Trip trip, LocalDate today) {
        if (trip.getStartDate() != null && trip.getStartDate().equals(today.plusDays(7))) {
            boolean exists = notificationRepository.existsByUserIdAndTripIdAndType(
                    user.getId(), trip.getId(), NotificationType.TRIP_STARTING
            );
            if (!exists) {
                Notification notification = Notification.builder()
                        .user(user)
                        .trip(trip)
                        .type(NotificationType.TRIP_STARTING)
                        .title("Trip Starting Soon: " + trip.getTitle())
                        .message("Your trip to " + trip.getDestination() + " starts in 7 days on " + trip.getStartDate() + ".")
                        .read(false)
                        .build();
                notificationRepository.save(notification);
                log.info("Generated TRIP_STARTING notification for user {} and trip {}", user.getId(), trip.getId());
            }
        }
    }

    private void evaluateTripStarted(User user, Trip trip, LocalDate today) {
        if (trip.getStartDate() != null && trip.getStartDate().equals(today)) {
            boolean exists = notificationRepository.existsByUserIdAndTripIdAndType(
                    user.getId(), trip.getId(), NotificationType.TRIP_STARTED
            );
            if (!exists) {
                Notification notification = Notification.builder()
                        .user(user)
                        .trip(trip)
                        .type(NotificationType.TRIP_STARTED)
                        .title("Trip Started: " + trip.getTitle())
                        .message("Your adventure to " + trip.getDestination() + " begins today! Have a wonderful and safe journey.")
                        .read(false)
                        .build();
                notificationRepository.save(notification);
                log.info("Generated TRIP_STARTED notification for user {} and trip {}", user.getId(), trip.getId());
            }
        }
    }

    private void evaluateItineraryToday(User user, Trip trip, LocalDate today) {
        List<ItineraryItem> items = itineraryItemRepository.findByTripId(trip.getId());
        List<ItineraryItem> todayItems = items.stream()
                .filter(item -> item.getDate() != null && item.getDate().equals(today))
                .toList();

        if (!todayItems.isEmpty()) {
            LocalDateTime startOfDay = today.atStartOfDay();
            LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
            boolean existsToday = notificationRepository.existsByUserIdAndTripIdAndTypeAndCreatedAtBetween(
                    user.getId(), trip.getId(), NotificationType.ITINERARY_TODAY, startOfDay, endOfDay
            );

            if (!existsToday) {
                int count = todayItems.size();
                String activityText = count == 1 ? "1 activity" : count + " activities";
                Notification notification = Notification.builder()
                        .user(user)
                        .trip(trip)
                        .type(NotificationType.ITINERARY_TODAY)
                        .title("Today's Itinerary: " + trip.getTitle())
                        .message("You have " + activityText + " scheduled for today in " + trip.getDestination() + ".")
                        .read(false)
                        .build();
                notificationRepository.save(notification);
                log.info("Generated ITINERARY_TODAY notification for user {} and trip {}", user.getId(), trip.getId());
            }
        }
    }

    private void evaluateBudgetExceeded(User user, Trip trip) {
        tripBudgetRepository.findByTripId(trip.getId()).ifPresent(budget -> {
            if (budget.getTotalBudget() != null && budget.getTotalBudget().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal totalSpent = expenseRepository.calculateTotalExpensesByTripId(trip.getId());
                if (totalSpent != null && totalSpent.compareTo(budget.getTotalBudget()) > 0) {
                    boolean exists = notificationRepository.existsByUserIdAndTripIdAndType(
                            user.getId(), trip.getId(), NotificationType.BUDGET_EXCEEDED
                    );
                    if (!exists) {
                        String currency = budget.getCurrency() != null ? budget.getCurrency() : "";
                        Notification notification = Notification.builder()
                                .user(user)
                                .trip(trip)
                                .type(NotificationType.BUDGET_EXCEEDED)
                                .title("Budget Exceeded: " + trip.getTitle())
                                .message("Total expenses of " + currency + " " + totalSpent + " have exceeded your planned budget of " + currency + " " + budget.getTotalBudget() + " for " + trip.getTitle() + ".")
                                .read(false)
                                .build();
                        notificationRepository.save(notification);
                        log.info("Generated BUDGET_EXCEEDED notification for user {} and trip {}", user.getId(), trip.getId());
                    }
                }
            }
        });
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .tripId(n.getTrip() != null ? n.getTrip().getId() : null)
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));
    }
}
