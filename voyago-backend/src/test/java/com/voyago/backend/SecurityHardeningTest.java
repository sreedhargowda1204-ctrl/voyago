package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.AuthController;
import com.voyago.backend.controller.TripController;
import com.voyago.backend.controller.TripShareController;
import com.voyago.backend.dto.AuthResponse;
import com.voyago.backend.dto.LoginRequest;
import com.voyago.backend.dto.PublicTripResponse;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.security.CustomUserDetailsService;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.security.SecurityConfig;
import com.voyago.backend.service.AuthService;
import com.voyago.backend.service.TripService;
import com.voyago.backend.service.TripShareService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {TripController.class, TripShareController.class, AuthController.class})
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
public class SecurityHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripService tripService;

    @MockBean
    private TripShareService tripShareService;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void testUnauthenticatedAccessToProtectedTrips_Rejected() throws Exception {
        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedAccessToPublicSharedTrip_Permitted() throws Exception {
        PublicTripResponse publicTrip = PublicTripResponse.builder()
                .id(1L)
                .title("Public Paris Journey")
                .destination("Paris")
                .build();

        when(tripShareService.getPublicTrip("valid-share-token")).thenReturn(publicTrip);

        mockMvc.perform(get("/api/shared/trips/valid-share-token"))
                .andExpect(status().isOk());
    }

    @Test
    void testUnauthenticatedAccessToAuthLogin_Permitted() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("SecretPassword123!");

        AuthResponse authResponse = AuthResponse.builder()
                .token("dummy-jwt-token")
                .email("test@example.com")
                .name("Test User")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void testAuthenticatedAccessToProtectedTrips_Success() throws Exception {
        when(tripService.getMyTrips()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isOk());
    }

    @Test
    void testCorsPreflightRequest_AllowsConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/trips")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void testSecurityHeaders_FrameOptionsDeny() throws Exception {
        mockMvc.perform(get("/api/shared/trips/any-token"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
