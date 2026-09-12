package com.voyago.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyago.backend.controller.AuthController;
import com.voyago.backend.dto.AuthResponse;
import com.voyago.backend.dto.LoginRequest;
import com.voyago.backend.dto.RegisterRequest;
import com.voyago.backend.dto.UserDto;
import com.voyago.backend.entity.Role;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.security.CustomUserDetailsService;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.security.SecurityConfig;
import com.voyago.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
public class AuthRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void testRegister_Success_201() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice Traveler");
        request.setEmail("alice@example.com");
        request.setMobile("9876543210");
        request.setPassword("SecurePass123!");

        UserDto userDto = UserDto.builder()
                .id(1L)
                .name("Alice Traveler")
                .email("alice@example.com")
                .mobile("9876543210")
                .role(Role.USER)
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(userDto);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice Traveler"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void testRegister_DuplicateEmail_Throws400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice Traveler");
        request.setEmail("alice@example.com");
        request.setPassword("SecurePass123!");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Email already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void testRegister_MissingRequiredFields_Throws400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        // Missing name, email, password
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Required registration fields are missing"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Required registration fields are missing"));
    }

    @Test
    void testLogin_Success_ReturnsJwt() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("SecurePass123!");

        AuthResponse authResponse = AuthResponse.builder()
                .token("mocked.jwt.token")
                .id(1L)
                .name("Alice Traveler")
                .email("alice@example.com")
                .role(Role.USER)
                .verified(false)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void testLogin_BadCredentials_Throws401() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("WrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }
}
