package com.voyago.backend.service;

import com.voyago.backend.dto.CreateItineraryItemRequest;
import com.voyago.backend.dto.ItineraryItemResponse;
import com.voyago.backend.dto.UpdateItineraryItemRequest;
import com.voyago.backend.entity.ItineraryItem;
import com.voyago.backend.entity.Trip;
import com.voyago.backend.entity.User;
import com.voyago.backend.repository.ItineraryItemRepository;
import com.voyago.backend.repository.TripRepository;
import com.voyago.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItineraryItemService {

    private final ItineraryItemRepository itineraryItemRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public ItineraryItemResponse createItineraryItem(Long tripId, CreateItineraryItemRequest request) {
        Trip trip = getOwnedTrip(tripId);

        ItineraryItem item = ItineraryItem.builder()
                .trip(trip)
                .title(request.getTitle())
                .description(request.getDescription())
                .date(request.getDate())
                .time(request.getTime())
                .location(request.getLocation())
                .build();

        ItineraryItem savedItem = itineraryItemRepository.save(item);
        return toResponse(savedItem);
    }

    @Transactional(readOnly = true)
    public List<ItineraryItemResponse> getItineraryItems(Long tripId) {
        getOwnedTrip(tripId);

        List<ItineraryItem> items = itineraryItemRepository.findByTripIdOrderByDateAscTimeAsc(tripId);
        return items.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ItineraryItemResponse getItineraryItem(Long tripId, Long itemId) {
        getOwnedTrip(tripId);

        ItineraryItem item = itineraryItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new IllegalArgumentException("Itinerary item not found with id: " + itemId));

        return toResponse(item);
    }

    @Transactional
    public ItineraryItemResponse updateItineraryItem(Long tripId, Long itemId, UpdateItineraryItemRequest request) {
        getOwnedTrip(tripId);

        ItineraryItem item = itineraryItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new IllegalArgumentException("Itinerary item not found with id: " + itemId));

        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setDate(request.getDate());
        item.setTime(request.getTime());
        item.setLocation(request.getLocation());

        ItineraryItem updatedItem = itineraryItemRepository.save(item);
        return toResponse(updatedItem);
    }

    @Transactional
    public void deleteItineraryItem(Long tripId, Long itemId) {
        getOwnedTrip(tripId);

        ItineraryItem item = itineraryItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new IllegalArgumentException("Itinerary item not found with id: " + itemId));

        itineraryItemRepository.delete(item);
    }

    private Trip getOwnedTrip(Long tripId) {
        User user = getCurrentUser();
        return tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with id: " + tripId));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    private ItineraryItemResponse toResponse(ItineraryItem item) {
        return ItineraryItemResponse.builder()
                .id(item.getId())
                .tripId(item.getTrip() != null ? item.getTrip().getId() : null)
                .title(item.getTitle())
                .description(item.getDescription())
                .date(item.getDate())
                .time(item.getTime())
                .location(item.getLocation())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
