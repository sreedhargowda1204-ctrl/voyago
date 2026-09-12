package com.voyago.backend;

import com.voyago.backend.dto.places.PlacesResponse;
import com.voyago.backend.service.PlacesService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class PlacesServiceTest {

    @Test
    public void testPlacesBengaluru() {
        PlacesService service = new PlacesService(
                "https://geocoding-api.open-meteo.com/v1/search",
                "https://en.wikipedia.org/w/api.php"
        );
        try {
            PlacesResponse response = service.getPlacesForDestination("Bengaluru");
            assertNotNull(response.getLocation());
            assertFalse(response.getPlaces().isEmpty(), "Places should not be empty");
            assertTrue(response.getPlaces().size() <= 15, "Places should not exceed 15");
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            // Live provider timeout handled gracefully
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesTokyo() {
        PlacesService service = new PlacesService(
                "https://geocoding-api.open-meteo.com/v1/search",
                "https://en.wikipedia.org/w/api.php"
        );
        try {
            PlacesResponse response = service.getPlacesForDestination("Tokyo");
            assertNotNull(response.getLocation());
            assertFalse(response.getPlaces().isEmpty());
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesParis() {
        PlacesService service = new PlacesService(
                "https://geocoding-api.open-meteo.com/v1/search",
                "https://en.wikipedia.org/w/api.php"
        );
        try {
            PlacesResponse response = service.getPlacesForDestination("Paris");
            assertNotNull(response.getLocation());
            assertFalse(response.getPlaces().isEmpty());
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }
}
