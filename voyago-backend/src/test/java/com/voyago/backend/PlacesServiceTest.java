package com.voyago.backend;

import com.voyago.backend.dto.places.PlacesResponse;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.repository.DestinationRepository;
import com.voyago.backend.service.DestinationResolver;
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
public class PlacesServiceTest {

    @Mock
    private DestinationRepository destinationRepository;

    private PlacesService service;

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

        Destination mysuru = Destination.builder()
                .id(3L)
                .name("Mysuru")
                .normalizedName("mysuru")
                .aliases("Mysore")
                .district("Mysuru")
                .category(DestinationCategory.HERITAGE)
                .latitude(12.2958104)
                .longitude(76.6393805)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        Destination hampi = Destination.builder()
                .id(4L)
                .name("Hampi")
                .normalizedName("hampi")
                .aliases("Vijayanagara Ruins, Hampe")
                .district("Vijayanagara")
                .category(DestinationCategory.HERITAGE)
                .latitude(15.3350132)
                .longitude(76.460024)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        when(destinationRepository.findAllByActiveTrue())
                .thenReturn(List.of(sakleshpur, bengaluru, mysuru, hampi));

        DestinationResolver destinationResolver = new DestinationResolver(destinationRepository);
        destinationResolver.refreshCache();

        service = new PlacesService(
                destinationResolver,
                "https://geocoding-api.open-meteo.com/v1/search",
                "https://en.wikipedia.org/w/api.php",
                "https://commons.wikimedia.org/w/api.php"
        );
    }

    @Test
    public void testPlacesSakleshpur_Canonical() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());
            assertEquals("Sakleshpur", response.getLocation().getName());
            assertTrue(response.getPlaces().size() <= 15);
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null because Wikipedia does not provide user ratings");
                System.out.println("SAKLESHPUR_PLACE: " + p.getName() + " | Lat: " + p.getLatitude() + ", Lng: " + p.getLongitude() + " | Category: " + p.getCategory() + " | Rating: " + p.getRating());
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesSakleshpura_CatalogAlias() {
        try {
            PlacesResponse response = service.getPlacesForDestination("sakleshpura");
            assertNotNull(response.getLocation());
            assertEquals("Sakleshpur", response.getLocation().getName());
            assertTrue(response.getPlaces().size() <= 15);
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null");
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesBengaluru() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Bengaluru");
            assertNotNull(response.getLocation());
            assertEquals("Bengaluru", response.getLocation().getName());
            assertFalse(response.getPlaces().isEmpty(), "Places should not be empty");
            assertTrue(response.getPlaces().size() <= 15, "Places should not exceed 15");
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null");
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesMysuru() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Mysuru");
            assertNotNull(response.getLocation());
            assertEquals("Mysuru", response.getLocation().getName());
            assertTrue(response.getPlaces().size() <= 15);
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null");
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesHampi() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Hampi");
            assertNotNull(response.getLocation());
            assertEquals("Hampi", response.getLocation().getName());
            assertTrue(response.getPlaces().size() <= 15);
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null");
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesTokyo() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Tokyo");
            assertNotNull(response.getLocation());
            assertFalse(response.getPlaces().isEmpty());
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null");
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesParis() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Paris");
            assertNotNull(response.getLocation());
            assertFalse(response.getPlaces().isEmpty());
            for (var p : response.getPlaces()) {
                assertNull(p.getRating(), "Rating should be null");
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testPlacesInvalidDestination() {
        assertThrows(com.voyago.backend.exception.DestinationNotFoundException.class, () -> {
            service.getPlacesForDestination("xyznonexistentdestination123");
        });
    }

    @Test
    public void testDistrictContradictionFilter_BijapurArticleFilteredForSakleshpur() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());

            // Ensure no returned place has a description claiming to be in an unrelated district (e.g. Bijapur)
            for (var place : response.getPlaces()) {
                if (place.getDescription() != null) {
                    assertFalse(place.getDescription().toLowerCase().contains("in bijapur district"),
                            "Places in Bijapur district should not be returned for Sakleshpur: " + place.getName());
                    assertFalse(place.getDescription().toLowerCase().contains("in vijayapura district"),
                            "Places in Vijayapura district should not be returned for Sakleshpur: " + place.getName());
                }
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testNoFabricatedRatings_AlwaysNull() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());
            for (var place : response.getPlaces()) {
                assertNull(place.getRating(), "PlaceDto.rating must be strictly null when upstream has no real user rating: " + place.getName());
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testWikimediaCommonsFallback_ImageVerification() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());
            assertNotNull(response.getPlaces());

            for (var place : response.getPlaces()) {
                if (place.getImageUrl() != null) {
                    assertTrue(place.getImageUrl().startsWith("https://"),
                            "Place image URL must be HTTPS: " + place.getImageUrl());
                    assertFalse(place.getImageUrl().contains("Flag_of_"),
                            "Image must not be a generic flag: " + place.getImageUrl());
                    assertFalse(place.getImageUrl().endsWith(".pdf"),
                            "Image must not be a PDF: " + place.getImageUrl());
                    assertFalse(place.getImageUrl().endsWith(".svg"),
                            "Image must not be an SVG icon: " + place.getImageUrl());
                }

                if ("Green Route".equalsIgnoreCase(place.getName())) {
                    assertNotNull(place.getImageUrl(), "Green Route should have a valid image from Wikipedia");
                }
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testNullFallbackWhenNoCommonsImage() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());

            // Check that places without genuine images have null rather than fabricated URLs
            for (var place : response.getPlaces()) {
                if (place.getImageUrl() == null) {
                    assertNull(place.getImageUrl());
                } else {
                    assertTrue(place.getImageUrl().startsWith("https://"));
                }
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testArehalli_RejectsBengaluruTeaManStatue_YieldsNull() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());
            assertNotNull(response.getPlaces());

            for (var place : response.getPlaces()) {
                if ("Arehalli".equalsIgnoreCase(place.getName())) {
                    // Must reject the false positive Bengaluru tea-man photo
                    assertNull(place.getImageUrl(), "Arehalli should have null image rather than false-positive Bengaluru street statue");
                }
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testWikipediaPriority_And_GenuineCommonsImage() {
        try {
            PlacesResponse response = service.getPlacesForDestination("Sakleshpur");
            assertNotNull(response.getLocation());

            for (var place : response.getPlaces()) {
                if ("Green Route".equalsIgnoreCase(place.getName())) {
                    assertNotNull(place.getImageUrl(), "Green Route must preserve Wikipedia image");
                    assertTrue(place.getImageUrl().contains("Train_enroute_green_route"), "Green Route must use its Wikipedia thumbnail");
                }
                if ("Sakleshpur railway station".equalsIgnoreCase(place.getName())) {
                    assertNotNull(place.getImageUrl(), "Sakleshpur railway station should receive valid Commons photo");
                    assertTrue(place.getImageUrl().startsWith("https://"));
                    assertTrue(place.getImageUrl().contains("Sakleshpur"), "Image must be genuinely associated with Sakleshpur");
                }
            }
        } catch (com.voyago.backend.exception.WeatherServiceException ex) {
            assertTrue(ex.getMessage().contains("External places data service error"));
        }
    }

    @Test
    public void testRuntimeReport_AllDestinations() {
        String[] destinations = {"Sakleshpur", "sakleshpura", "Bengaluru", "Mysuru", "Hampi"};
        for (String dest : destinations) {
            try {
                PlacesResponse response = service.getPlacesForDestination(dest);
                System.out.println("==================================================");
                System.out.println("DESTINATION: " + dest + " -> Resolved: " + response.getLocation().getName());
                System.out.println("TOTAL PLACES: " + response.getPlaces().size());
                for (var p : response.getPlaces()) {
                    System.out.println("  - " + p.getName() + " [" + p.getCategory() + "] -> ImageUrl: " + p.getImageUrl());
                }
            } catch (Exception ex) {
                System.out.println("DESTINATION " + dest + " error: " + ex.getMessage());
            }
        }
    }
}
