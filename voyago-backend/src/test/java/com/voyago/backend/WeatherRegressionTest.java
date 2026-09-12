package com.voyago.backend;

import com.voyago.backend.controller.WeatherController;
import com.voyago.backend.dto.weather.CurrentWeatherDto;
import com.voyago.backend.dto.weather.LocationDto;
import com.voyago.backend.dto.weather.WeatherResponse;
import com.voyago.backend.exception.DestinationNotFoundException;
import com.voyago.backend.exception.GlobalExceptionHandler;
import com.voyago.backend.security.CustomUserDetailsService;
import com.voyago.backend.security.JwtAuthFilter;
import com.voyago.backend.security.JwtService;
import com.voyago.backend.security.SecurityConfig;
import com.voyago.backend.service.WeatherService;
import com.voyago.backend.util.WeatherCodeMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = WeatherController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
public class WeatherRegressionTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WeatherService weatherService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetWeather_ValidDestination_Success_200() throws Exception {
        WeatherResponse weatherResponse = WeatherResponse.builder()
                .location(LocationDto.builder()
                        .name("Paris")
                        .country("France")
                        .latitude(48.8534)
                        .longitude(2.3488)
                        .build())
                .current(CurrentWeatherDto.builder()
                        .temperature(22.5)
                        .weatherCode(0)
                        .condition("Clear sky")
                        .build())
                .build();

        when(weatherService.getWeatherForDestination("Paris")).thenReturn(weatherResponse);

        mockMvc.perform(get("/api/weather").param("destination", "Paris"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.location.name").value("Paris"))
                .andExpect(jsonPath("$.current.temperature").value(22.5));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetWeather_MissingDestinationParam_Throws400() throws Exception {
        mockMvc.perform(get("/api/weather"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Destination query parameter is required and cannot be blank"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetWeather_BlankDestinationParam_Throws400() throws Exception {
        mockMvc.perform(get("/api/weather").param("destination", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Destination query parameter is required and cannot be blank"));
    }

    @Test
    @WithMockUser(username = "alice@example.com")
    void testGetWeather_DestinationNotFound_Throws404() throws Exception {
        when(weatherService.getWeatherForDestination("UnknownPlaceXYZ123"))
                .thenThrow(new DestinationNotFoundException("No geographic coordinates found for destination: UnknownPlaceXYZ123"));

        mockMvc.perform(get("/api/weather").param("destination", "UnknownPlaceXYZ123"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No geographic coordinates found for destination: UnknownPlaceXYZ123"));
    }

    @Test
    void testWeatherCodeMapper() {
        String clear = WeatherCodeMapper.mapCodeToCondition(0);
        assertNotNull(clear);
        assertEquals("Clear sky", clear);

        String rain = WeatherCodeMapper.mapCodeToCondition(61);
        assertNotNull(rain);
        assertEquals("Slight rain", rain);

        String unknown = WeatherCodeMapper.mapCodeToCondition(999);
        assertNotNull(unknown);
        assertEquals("Variable conditions", unknown);
    }
}
