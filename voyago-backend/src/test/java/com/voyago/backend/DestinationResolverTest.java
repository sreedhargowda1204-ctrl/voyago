package com.voyago.backend;

import com.voyago.backend.dto.destination.ResolvedDestination;
import com.voyago.backend.entity.Destination;
import com.voyago.backend.entity.DestinationCategory;
import com.voyago.backend.repository.DestinationRepository;
import com.voyago.backend.service.DestinationResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DestinationResolverTest {

    @Mock
    private DestinationRepository destinationRepository;

    private DestinationResolver destinationResolver;

    private Destination sakleshpur;
    private Destination bengaluru;
    private Destination mysuru;
    private Destination chikkamagaluru;
    private Destination kodagu;
    private Destination vijayapura;

    @BeforeEach
    public void setUp() {
        sakleshpur = Destination.builder()
                .id(1L)
                .name("Sakleshpur")
                .normalizedName("sakleshpur")
                .aliases("Sakleshpura, Sakaleshpura, Sakaleshpur, Poor Mans Ooty")
                .normalizedAliases("sakleshpura,sakaleshpura,sakaleshpur,poor mans ooty")
                .district("Hassan")
                .category(DestinationCategory.HILL_STATION)
                .latitude(12.9698)
                .longitude(75.7824)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        bengaluru = Destination.builder()
                .id(2L)
                .name("Bengaluru")
                .normalizedName("bengaluru")
                .aliases("Bangalore, Bengalooru, Silicon Valley of India, Garden City")
                .normalizedAliases("bangalore,bengalooru,silicon valley of india,garden city")
                .district("Bengaluru Urban")
                .category(DestinationCategory.CITY)
                .latitude(12.9715987)
                .longitude(77.5945627)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        mysuru = Destination.builder()
                .id(3L)
                .name("Mysuru")
                .normalizedName("mysuru")
                .aliases("Mysore, Maisuru, City of Palaces")
                .normalizedAliases("mysore,maisuru,city of palaces")
                .district("Mysuru")
                .category(DestinationCategory.CITY)
                .latitude(12.2958104)
                .longitude(76.6393805)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        chikkamagaluru = Destination.builder()
                .id(4L)
                .name("Chikkamagaluru")
                .normalizedName("chikkamagaluru")
                .aliases("Chikmagalur, Chikkamagalur, Chikmagaluru, Coffee Land")
                .normalizedAliases("chikmagalur,chikkamagalur,chikmagaluru,coffee land")
                .district("Chikkamagaluru")
                .category(DestinationCategory.HILL_STATION)
                .latitude(13.3161)
                .longitude(75.7720)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        kodagu = Destination.builder()
                .id(5L)
                .name("Kodagu")
                .normalizedName("kodagu")
                .aliases("Coorg, Madikeri, Mercara, Scotland of India")
                .normalizedAliases("coorg,madikeri,mercara,scotland of india")
                .district("Kodagu")
                .category(DestinationCategory.HILL_STATION)
                .latitude(12.4244)
                .longitude(75.7382)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        vijayapura = Destination.builder()
                .id(6L)
                .name("Vijayapura")
                .normalizedName("vijayapura")
                .aliases("Bijapur, Gol Gumbaz Bijapur, Vijayapur")
                .normalizedAliases("bijapur,gol gumbaz bijapur,vijayapur")
                .district("Vijayapura")
                .category(DestinationCategory.HERITAGE)
                .latitude(16.8302)
                .longitude(75.7100)
                .state("Karnataka")
                .country("India")
                .active(true)
                .build();

        when(destinationRepository.findAllByActiveTrue())
                .thenReturn(List.of(sakleshpur, bengaluru, mysuru, chikkamagaluru, kodagu, vijayapura));

        destinationResolver = new DestinationResolver(destinationRepository);
        destinationResolver.refreshCache();
    }

    @Test
    public void testSakleshpur_ExactMatch() {
        ResolvedDestination res = destinationResolver.resolve("Sakleshpur");
        assertTrue(res.isCatalogMatch());
        assertEquals("Sakleshpur", res.getCanonicalName());
        assertEquals("Hassan", res.getDistrict());
        assertEquals(12.9698, res.getLatitude());
        assertEquals(75.7824, res.getLongitude());
    }

    @Test
    public void testSakleshpura_AliasMatch() {
        ResolvedDestination res = destinationResolver.resolve("Sakleshpura");
        assertTrue(res.isCatalogMatch());
        assertEquals("Sakleshpur", res.getCanonicalName());
        assertEquals("Hassan", res.getDistrict());
    }

    @Test
    public void testSakaleshpura_PhoneticAliasMatch() {
        ResolvedDestination res = destinationResolver.resolve("Sakaleshpura");
        assertTrue(res.isCatalogMatch());
        assertEquals("Sakleshpur", res.getCanonicalName());
    }

    @Test
    public void testBangalore_To_Bengaluru() {
        ResolvedDestination res = destinationResolver.resolve("Bangalore");
        assertTrue(res.isCatalogMatch());
        assertEquals("Bengaluru", res.getCanonicalName());
        assertEquals("Bengaluru Urban", res.getDistrict());
        assertEquals(12.9715987, res.getLatitude());
    }

    @Test
    public void testMysore_To_Mysuru() {
        ResolvedDestination res = destinationResolver.resolve("Mysore");
        assertTrue(res.isCatalogMatch());
        assertEquals("Mysuru", res.getCanonicalName());
    }

    @Test
    public void testChikmagalur_To_Chikkamagaluru() {
        ResolvedDestination res = destinationResolver.resolve("Chikmagalur");
        assertTrue(res.isCatalogMatch());
        assertEquals("Chikkamagaluru", res.getCanonicalName());
    }

    @Test
    public void testCoorg_To_Kodagu() {
        ResolvedDestination res = destinationResolver.resolve("Coorg");
        assertTrue(res.isCatalogMatch());
        assertEquals("Kodagu", res.getCanonicalName());
    }

    @Test
    public void testBijapur_To_Vijayapura() {
        ResolvedDestination res = destinationResolver.resolve("Bijapur");
        assertTrue(res.isCatalogMatch());
        assertEquals("Vijayapura", res.getCanonicalName());
    }

    @Test
    public void testCaseInsensitiveMatching() {
        ResolvedDestination resUpper = destinationResolver.resolve("SAKLESHPURA");
        assertTrue(resUpper.isCatalogMatch());
        assertEquals("Sakleshpur", resUpper.getCanonicalName());

        ResolvedDestination resLower = destinationResolver.resolve("bengaluru");
        assertTrue(resLower.isCatalogMatch());
        assertEquals("Bengaluru", resLower.getCanonicalName());
    }

    @Test
    public void testWhitespaceAndQualifierNormalization() {
        ResolvedDestination res = destinationResolver.resolve("   Sakleshpur, Karnataka, India   ");
        assertTrue(res.isCatalogMatch());
        assertEquals("Sakleshpur", res.getCanonicalName());
    }

    @Test
    public void testNonKarnatakaDestination_Fallback() {
        ResolvedDestination tokyo = destinationResolver.resolve("Tokyo");
        assertFalse(tokyo.isCatalogMatch());
        assertNull(tokyo.toLocationDto());

        ResolvedDestination paris = destinationResolver.resolve("Paris, France");
        assertFalse(paris.isCatalogMatch());
    }

    @Test
    public void testInvalidAndBlankDestination() {
        ResolvedDestination empty = destinationResolver.resolve("");
        assertFalse(empty.isCatalogMatch());

        ResolvedDestination nullInput = destinationResolver.resolve(null);
        assertFalse(nullInput.isCatalogMatch());
    }
}
