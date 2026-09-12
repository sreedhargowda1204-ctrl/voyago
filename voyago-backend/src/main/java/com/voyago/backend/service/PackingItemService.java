package com.voyago.backend.service;

import com.voyago.backend.dto.CreatePackingItemRequest;
import com.voyago.backend.dto.PackingItemResponse;
import com.voyago.backend.dto.PackingSummaryResponse;
import com.voyago.backend.dto.UpdatePackingItemRequest;
import com.voyago.backend.entity.PackingItem;
import com.voyago.backend.entity.Trip;
import com.voyago.backend.entity.User;
import com.voyago.backend.exception.DuplicateResourceException;
import com.voyago.backend.exception.ResourceNotFoundException;
import com.voyago.backend.repository.PackingItemRepository;
import com.voyago.backend.repository.TripRepository;
import com.voyago.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PackingItemService {

    public static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "CLOTHING",
            "TOILETRIES",
            "ELECTRONICS",
            "DOCUMENTS",
            "MEDICINE",
            "ACCESSORIES",
            "OTHER"
    );

    private final PackingItemRepository packingItemRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public PackingItemResponse createPackingItem(Long tripId, CreatePackingItemRequest request) {
        Trip trip = getOwnedTrip(tripId);

        String normalizedCategory = validateAndNormalizeCategory(request.getCategory());
        String trimmedItemName = request.getItemName().trim();

        // Check for duplicate in the same trip
        if (packingItemRepository.findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(tripId, normalizedCategory, trimmedItemName).isPresent()) {
            throw new DuplicateResourceException(
                    "Packing item '" + trimmedItemName + "' already exists in category '" + normalizedCategory + "' for this trip"
            );
        }

        PackingItem packingItem = PackingItem.builder()
                .trip(trip)
                .itemName(trimmedItemName)
                .category(normalizedCategory)
                .quantity(request.getQuantity())
                .packed(Boolean.TRUE.equals(request.getPacked()))
                .notes(request.getNotes())
                .build();

        PackingItem saved = packingItemRepository.save(packingItem);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PackingItemResponse> getPackingItems(Long tripId) {
        getOwnedTrip(tripId);

        List<PackingItem> items = packingItemRepository.findByTripIdOrderByCategoryAscItemNameAsc(tripId);
        return items.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PackingItemResponse getPackingItem(Long tripId, Long itemId) {
        getOwnedTrip(tripId);

        PackingItem item = packingItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Packing item not found with id: " + itemId));

        return toResponse(item);
    }

    @Transactional
    public PackingItemResponse updatePackingItem(Long tripId, Long itemId, UpdatePackingItemRequest request) {
        getOwnedTrip(tripId);

        PackingItem item = packingItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Packing item not found with id: " + itemId));

        String normalizedCategory = validateAndNormalizeCategory(request.getCategory());
        String trimmedItemName = request.getItemName().trim();

        // Check duplicate if name or category changed
        Optional<PackingItem> existingDuplicate = packingItemRepository
                .findByTripIdAndCategoryIgnoreCaseAndItemNameIgnoreCase(tripId, normalizedCategory, trimmedItemName);

        if (existingDuplicate.isPresent() && !existingDuplicate.get().getId().equals(itemId)) {
            throw new DuplicateResourceException(
                    "Packing item '" + trimmedItemName + "' already exists in category '" + normalizedCategory + "' for this trip"
            );
        }

        item.setItemName(trimmedItemName);
        item.setCategory(normalizedCategory);
        item.setQuantity(request.getQuantity());
        item.setPacked(Boolean.TRUE.equals(request.getPacked()));
        item.setNotes(request.getNotes());

        PackingItem updated = packingItemRepository.save(item);
        return toResponse(updated);
    }

    @Transactional
    public PackingItemResponse togglePackedStatus(Long tripId, Long itemId) {
        getOwnedTrip(tripId);

        PackingItem item = packingItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Packing item not found with id: " + itemId));

        item.setPacked(!Boolean.TRUE.equals(item.getPacked()));

        PackingItem updated = packingItemRepository.save(item);
        return toResponse(updated);
    }

    @Transactional
    public void deletePackingItem(Long tripId, Long itemId) {
        getOwnedTrip(tripId);

        PackingItem item = packingItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Packing item not found with id: " + itemId));

        packingItemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public PackingSummaryResponse getPackingSummary(Long tripId) {
        getOwnedTrip(tripId);

        long totalItems = packingItemRepository.countByTripId(tripId);
        long packedItems = packingItemRepository.countByTripIdAndPacked(tripId, true);
        long unpackedItems = Math.max(0, totalItems - packedItems);

        double completionPercentage = 0.0;
        if (totalItems > 0) {
            completionPercentage = BigDecimal.valueOf((double) packedItems / totalItems * 100.0)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return PackingSummaryResponse.builder()
                .totalItems(totalItems)
                .packedItems(packedItems)
                .unpackedItems(unpackedItems)
                .completionPercentage(completionPercentage)
                .build();
    }

    private String validateAndNormalizeCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            throw new IllegalArgumentException("Category cannot be blank");
        }
        String normalized = category.trim().toUpperCase();
        if (!ALLOWED_CATEGORIES.contains(normalized)) {
            throw new IllegalArgumentException(
                    "Invalid category: " + category + ". Allowed categories are: " + String.join(", ", ALLOWED_CATEGORIES)
            );
        }
        return normalized;
    }

    private Trip getOwnedTrip(Long tripId) {
        User user = getCurrentUser();
        return tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
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

    private PackingItemResponse toResponse(PackingItem item) {
        return PackingItemResponse.builder()
                .id(item.getId())
                .tripId(item.getTrip() != null ? item.getTrip().getId() : null)
                .itemName(item.getItemName())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .packed(item.getPacked())
                .notes(item.getNotes())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
