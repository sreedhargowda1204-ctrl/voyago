package com.voyago.backend.service;

import com.voyago.backend.dto.CreateTripRequest;
import com.voyago.backend.dto.TripResponse;
import com.voyago.backend.dto.UpdateTripRequest;
import com.voyago.backend.entity.Trip;
import com.voyago.backend.entity.User;
import com.voyago.backend.repository.TripRepository;
import com.voyago.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public TripResponse createTrip(CreateTripRequest request) {
        validateTripDates(request.getStartDate(), request.getEndDate());

        User user = getCurrentUser();

        Trip trip = Trip.builder()
                .user(user)
                .title(request.getTitle())
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .notes(request.getNotes())
                .build();

        Trip savedTrip = tripRepository.save(trip);
        return toResponse(savedTrip);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> getMyTrips() {
        User user = getCurrentUser();
        List<Trip> trips = tripRepository.findByUserId(user.getId());
        return trips.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripResponse getTrip(Long tripId) {
        User user = getCurrentUser();
        Trip trip = tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with id: " + tripId));
        return toResponse(trip);
    }

    @Transactional
    public TripResponse updateTrip(Long tripId, UpdateTripRequest request) {
        validateTripDates(request.getStartDate(), request.getEndDate());

        User user = getCurrentUser();
        Trip trip = tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with id: " + tripId));

        trip.setTitle(request.getTitle());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setNotes(request.getNotes());

        Trip updatedTrip = tripRepository.save(trip);
        return toResponse(updatedTrip);
    }

    @Transactional
    public void deleteTrip(Long tripId) {
        User user = getCurrentUser();
        Trip trip = tripRepository.findByIdAndUserId(tripId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with id: " + tripId));

        tripRepository.delete(trip);
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

    private void validateTripDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
    }

    private TripResponse toResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .userId(trip.getUser() != null ? trip.getUser().getId() : null)
                .title(trip.getTitle())
                .destination(trip.getDestination())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .notes(trip.getNotes())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();
    }
}
