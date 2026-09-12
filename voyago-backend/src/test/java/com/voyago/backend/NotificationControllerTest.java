package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.NotificationController;
import com.voyago.backend.dto.notification.NotificationResponse;
import com.voyago.backend.entity.NotificationType;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.service.NotificationService;
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

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
public class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void testGetMyNotifications_Success_200() throws Exception {
        NotificationResponse n1 = NotificationResponse.builder()
                .id(1L)
                .tripId(10L)
                .type(NotificationType.TRIP_STARTING)
                .title("Trip Starting Soon")
                .message("Your trip starts in 7 days.")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.getUserNotifications()).thenReturn(List.of(n1));

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].type").value("TRIP_STARTING"))
                .andExpect(jsonPath("$[0].title").value("Trip Starting Soon"))
                .andExpect(jsonPath("$[0].read").value(false));

        verify(notificationService, times(1)).getUserNotifications();
    }

    @Test
    void testGetUnreadCount_Success_200() throws Exception {
        when(notificationService.getUnreadCount()).thenReturn(5L);

        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(5));

        verify(notificationService, times(1)).getUnreadCount();
    }

    @Test
    void testMarkAsRead_Success_200() throws Exception {
        NotificationResponse updated = NotificationResponse.builder()
                .id(1L)
                .tripId(10L)
                .type(NotificationType.TRIP_STARTING)
                .title("Trip Starting Soon")
                .message("Your trip starts in 7 days.")
                .read(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.markAsRead(1L)).thenReturn(updated);

        mockMvc.perform(patch("/api/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.read").value(true));

        verify(notificationService, times(1)).markAsRead(1L);
    }

    @Test
    void testMarkAsRead_NotFound_404() throws Exception {
        when(notificationService.markAsRead(999L))
                .thenThrow(new ResourceNotFoundException("Notification not found with id: 999"));

        mockMvc.perform(patch("/api/notifications/999/read"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Notification not found with id: 999"));
    }

    @Test
    void testMarkAllAsRead_Success_200() throws Exception {
        when(notificationService.markAllAsRead()).thenReturn(3);

        mockMvc.perform(patch("/api/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(3))
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));

        verify(notificationService, times(1)).markAllAsRead();
    }

    @Test
    void testDeleteNotification_Success_204() throws Exception {
        doNothing().when(notificationService).deleteNotification(1L);

        mockMvc.perform(delete("/api/notifications/1"))
                .andExpect(status().isNoContent());

        verify(notificationService, times(1)).deleteNotification(1L);
    }

    @Test
    void testDeleteNotification_NotFound_404() throws Exception {
        doThrow(new ResourceNotFoundException("Notification not found with id: 999"))
                .when(notificationService).deleteNotification(999L);

        mockMvc.perform(delete("/api/notifications/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGenerateNotifications_Success_200() throws Exception {
        NotificationResponse n1 = NotificationResponse.builder()
                .id(2L)
                .tripId(20L)
                .type(NotificationType.ITINERARY_TODAY)
                .title("Today's Itinerary")
                .message("You have 2 activities today.")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.generateAndFetchNotifications()).thenReturn(List.of(n1));

        mockMvc.perform(post("/api/notifications/generate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("ITINERARY_TODAY"));

        verify(notificationService, times(1)).generateAndFetchNotifications();
    }
}
