package com.example.tirerequestsystem.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank; // Using Jakarta validation
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "tire_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TireRequest {
    @Id
    private String id;

    @NotBlank(message = "Vehicle number is required")
    private String vehicleNo;

    private String vehicleType;
    private String vehicleBrand;
    private String vehicleModel;
    private String userSection;
    private LocalDate lastTireReplacementDate;
    private String makeOfExistingTire;

    @NotBlank(message = "Tire size is required")
    private String tireSizeRequired;

    @NotNull(message = "Number of tires required is required")
    @Min(value = 1, message = "At least one tire must be requested")
    private Integer noOfTiresRequired;

    private Integer noOfTubesRequired;
    private String costCenter;
    private Double presentKmReading;
    private Double kmReadingAtPreviousTireReplacement;
    private String approvingOfficerServiceNo; // Consider if this should be linked to a User ID
    private Boolean tireWearIndicatorAppeared;
    private String tireWearPattern;
    private String comments;
    private List<String> imagePaths; // Stores paths or identifiers for uploaded images

    private String requestedByUserId; // Links to the User who created the request
    private String requestedByUsername; // Denormalized for easy display

    private LocalDateTime requestDate;

    private boolean managerApproved = false;
    private LocalDateTime managerApprovalDate;
    private String managerRemarks;

    private boolean transportOfficerApproved = false;
    private LocalDateTime transportOfficerApprovalDate;
    private String transportOfficerRemarks;

    private ApprovalStatus status = ApprovalStatus.PENDING;
}
