package com.voyago.backend;

import com.voyago.backend.dto.maps.MapResponse;
import com.voyago.backend.dto.maps.RouteResponse;
import com.voyago.backend.dto.places.PlacesResponse;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.repository.DestinationRepository;
import com.voyago.backend.service.DestinationResolver;
import com.voyago.backend.service.MapsService;
import com.voyago.backend.service.PlacesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class MapsServiceTest {

    @Mock
    private DestinationRepository destinationRepository;

    private MapsService mapsService;

    @BeforeEach
    public void setUp() {
        Destination sakleshpur = Destination.builder()
                .id(1L)
                .name("Sakleshpur")
                .normalizedName("sakleshpur")
                .aliases("Sakleshpura, Sakaleshpura")
                .district("Hassan")
                .category(DestinationCategory.HILL_STATION)
                .latitude(12.9698)
                .longitude(75.7824)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        Destination bengaluru = Destination.builder()
                .id(2L)
                .name("Bengaluru")
                .normalizedName("bengaluru")
                .aliases("Bangalore")
                .district("Bengaluru Urban")
                .category(DestinationCategory.CITY)
                .latitude(12.9715987)
                .longitude(77.5945627)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        when(destinationRepository.findAllByActiveTrue())
                .thenReturn(List.of(sakleshpur, bengaluru));

        DestinationResolver destinationResolver = new DestinationResolver(destinationRepository);
        destinationResolver.refreshCache();

        PlacesService placesService = new PlacesService(
                destinationResolver,
                "https://geocoding-api.open-meteo.com/v1/search",
                "https://en.wikipedia.org/w/api.php",
                "https://commons.wikimedia.org/w/api.php"
        );
        mapsService = new MapsService(
                placesService,
                destinationResolver,
                "https://geocoding-api.open-meteo.com/v1/search",
                "https://router.project-osrm.org/route/v1/driving"
        );
    }

    @Test
    public void testCoordinateValidation_NullCoordinates() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(null, 2.3376, 48.8606, 2.3376));
        assertTrue(ex1.getMessage().contains("required"));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, null, 48.8606, 2.3376));
        assertTrue(ex2.getMessage().contains("required"));

        IllegalArgumentException ex3 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, 2.2945, null, 2.3376));
        assertTrue(ex3.getMessage().contains("required"));

        IllegalArgumentException ex4 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, 2.2945, 48.8606, null));
        assertTrue(ex4.getMessage().contains("required"));
    }

    @Test
    public void testCoordinateValidation_InvalidLatitude() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(91.0, 2.2945, 48.8606, 2.3376));
        assertTrue(ex1.getMessage().contains("latitude must be between -90 and 90 degrees"));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(-91.0, 2.2945, 48.8606, 2.3376));
        assertTrue(ex2.getMessage().contains("latitude must be between -90 and 90 degrees"));

        IllegalArgumentException ex3 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, 2.2945, 999.0, 2.3376));
        assertTrue(ex3.getMessage().contains("latitude must be between -90 and 90 degrees"));
    }

    @Test
    public void testCoordinateValidation_InvalidLongitude() {
        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, 181.0, 48.8606, 2.3376));
        assertTrue(ex1.getMessage().contains("longitude must be between -180 and 180 degrees"));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, -181.0, 48.8606, 2.3376));
        assertTrue(ex2.getMessage().contains("longitude must be between -180 and 180 degrees"));

        IllegalArgumentException ex3 = assertThrows(IllegalArgumentException.class, () ->
                mapsService.validateCoordinates(48.8584, 2.2945, 48.8606, -200.0));
        assertTrue(ex3.getMessage().contains("longitude must be between -180 and 180 degrees"));
    }

    @Test
    public void testDestinationValidation_BlankOrNull() {
        assertThrows(IllegalArgumentException.class, () ->
                mapsService.getDestinationCoordinates(null));

        assertThrows(IllegalArgumentException.class, () ->
                mapsService.getDestinationCoordinates("   "));

        assertThrows(IllegalArgumentException.class, () ->
                mapsService.getPlacesForMap(null));

        assertThrows(IllegalArgumentException.class, () ->
                mapsService.getPlacesForMap("   "));
    }

    @Test
    public void testDestinationCoordinates_Sakleshpura_Catalog() {
        MapResponse response = mapsService.getDestinationCoordinates("sakleshpura");
        assertNotNull(response);
        assertNotNull(response.getLocation());
        assertEquals("Sakleshpur", response.getLocation().getName());
        assertEquals(12.9698, response.getLocation().getLatitude());
        assertEquals(75.7824, response.getLocation().getLongitude());
    }

    @Test
    public void testDestinationCoordinates_Bengaluru() {
        MapResponse response = mapsService.getDestinationCoordinates("Bengaluru");
        assertNotNull(response);
        assertNotNull(response.getLocation());
        assertEquals("Bengaluru", response.getLocation().getName());
        assertEquals("India", response.getLocation().getCountry());
        assertEquals(12.9715987, response.getLocation().getLatitude());
        assertEquals(77.5945627, response.getLocation().getLongitude());
    }

    @Test
    public void testPlacesForMap_Paris() {
        PlacesResponse response = mapsService.getPlacesForMap("Paris");
        assertNotNull(response);
        assertNotNull(response.getLocation());
        assertNotNull(response.getPlaces());
        assertFalse(response.getPlaces().isEmpty());
        assertTrue(response.getPlaces().size() <= 15);
    }

    @Test
    public void testRouteCalculation_ParisEiffelToLouvre() {
        // Eiffel Tower: 48.8584, 2.2945 -> Louvre: 48.8606, 2.3376
        RouteResponse route = mapsService.calculateRoute(48.8584, 2.2945, 48.8606, 2.3376);
        assertNotNull(route);
        assertNotNull(route.getStart());
        assertEquals(48.8584, route.getStart().getLatitude());
        assertEquals(2.2945, route.getStart().getLongitude());
        assertNotNull(route.getEnd());
        assertEquals(48.8606, route.getEnd().getLatitude());
        assertEquals(2.3376, route.getEnd().getLongitude());

        assertNotNull(route.getDistanceKm());
        assertTrue(route.getDistanceKm() > 0.0);
        assertNotNull(route.getDurationMinutes());
        assertTrue(route.getDurationMinutes() > 0.0);

        assertNotNull(route.getGeometry());
        assertFalse(route.getGeometry().isEmpty());
        assertTrue(route.getGeometry().size() > 5);
    }
}
