package com.example.tirerequestsystem.controllers;

import com.example.tirerequestsystem.config.security.services.UserDetailsImpl;
import com.example.tirerequestsystem.models.TireRequest;
import com.example.tirerequestsystem.models.ApprovalStatus;
import com.example.tirerequestsystem.models.User;
import com.example.tirerequestsystem.repositories.TireRequestRepository;
import com.example.tirerequestsystem.repositories.UserRepository;
import com.example.tirerequestsystem.services.EmailService;
import com.example.tirerequestsystem.services.FileStorageService;
import com.example.tirerequestsystem.services.PdfGenerationService;
import com.example.tirerequestsystem.services.WebSocketNotificationService; // Added
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TireRequestController {
    @Autowired private TireRequestRepository tireRequestRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private EmailService emailService;
    @Autowired private PdfGenerationService pdfGenerationService;
    @Autowired private WebSocketNotificationService webSocketNotificationService; // Added

    private UserDetailsImpl getAuthenticatedUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return (UserDetailsImpl) authentication.getPrincipal();
        }
        return null;
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createTireRequest(@Valid @RequestPart("tireRequest") TireRequest tireRequest,
                                             @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();
        if (userDetails == null) {
            // This case should ideally be handled by Spring Security's default unauthorized response,
            // but an explicit check can be useful for specific logging or response shaping.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated or details not available.");
        }

        tireRequest.setRequestedByUserId(userDetails.getId());
        tireRequest.setRequestedByUsername(userDetails.getUsername());
        tireRequest.setRequestDate(LocalDateTime.now());
        tireRequest.setStatus(ApprovalStatus.PENDING);
        tireRequest.setManagerApproved(false);
        tireRequest.setTransportOfficerApproved(false);

        if (images != null && !images.isEmpty()) {
            List<String> imagePaths = images.stream()
                .filter(image -> image != null && !image.isEmpty())
                .map(fileStorageService::storeFile)
                .collect(Collectors.toList());
            tireRequest.setImagePaths(imagePaths);
        } else {
            tireRequest.setImagePaths(new ArrayList<>());
        }

        TireRequest savedRequest = tireRequestRepository.save(tireRequest);

        userRepository.findByRolesContaining("ROLE_MANAGER").stream()
           .filter(m -> m.getEmail() != null && !m.getEmail().isBlank())
           .forEach(m -> emailService.sendNewRequestEmailToManager(savedRequest, m.getEmail()));

        // WebSocket notification for managers
        webSocketNotificationService.notifyManagers("NEW_REQUEST_FOR_MANAGER", savedRequest);

        return new ResponseEntity<>(savedRequest, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_MANAGER', 'ROLE_TRANSPORT_OFFICER', 'ROLE_ADMIN')")
    public ResponseEntity<List<TireRequest>> getAllTireRequests() {
        return ResponseEntity.ok(tireRequestRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TireRequest> getTireRequestById(@PathVariable String id) {
        Optional<TireRequest> requestOpt = tireRequestRepository.findById(id);
        if(requestOpt.isEmpty()) return ResponseEntity.notFound().build();
        TireRequest request = requestOpt.get();
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();

        if (userDetails == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_TRANSPORT_OFFICER") || a.getAuthority().equals("ROLE_ADMIN"))
            || userDetails.getId().equals(request.getRequestedByUserId())) {
            return ResponseEntity.ok(request);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TireRequest> updateTireRequest(@PathVariable String id,
                                                         @Valid @RequestPart("tireRequest") TireRequest updatedRequestData,
                                                         @RequestPart(value = "images", required = false) List<MultipartFile> newImages) {
        Optional<TireRequest> requestOpt = tireRequestRepository.findById(id);
        if(requestOpt.isEmpty()) return ResponseEntity.notFound().build();
        TireRequest existingRequest = requestOpt.get();
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();

        if (userDetails == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        boolean canUpdate = false;
        boolean isAdminOrManagerOrTO = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_TRANSPORT_OFFICER"));
        boolean isOwnerAndPending = userDetails.getId().equals(existingRequest.getRequestedByUserId()) && existingRequest.getStatus() == ApprovalStatus.PENDING;

        if (isAdminOrManagerOrTO || isOwnerAndPending) canUpdate = true;

        if (!canUpdate) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        // Actual update logic for fields and images
        existingRequest.setVehicleNo(updatedRequestData.getVehicleNo());
        existingRequest.setVehicleType(updatedRequestData.getVehicleType());
        existingRequest.setVehicleBrand(updatedRequestData.getVehicleBrand());
        existingRequest.setVehicleModel(updatedRequestData.getVehicleModel());
        existingRequest.setUserSection(updatedRequestData.getUserSection());
        existingRequest.setLastTireReplacementDate(updatedRequestData.getLastTireReplacementDate());
        existingRequest.setMakeOfExistingTire(updatedRequestData.getMakeOfExistingTire());
        existingRequest.setTireSizeRequired(updatedRequestData.getTireSizeRequired());
        existingRequest.setNoOfTiresRequired(updatedRequestData.getNoOfTiresRequired());
        existingRequest.setNoOfTubesRequired(updatedRequestData.getNoOfTubesRequired());
        existingRequest.setCostCenter(updatedRequestData.getCostCenter());
        existingRequest.setPresentKmReading(updatedRequestData.getPresentKmReading());
        existingRequest.setKmReadingAtPreviousTireReplacement(updatedRequestData.getKmReadingAtPreviousTireReplacement());
        existingRequest.setApprovingOfficerServiceNo(updatedRequestData.getApprovingOfficerServiceNo());
        existingRequest.setTireWearIndicatorAppeared(updatedRequestData.getTireWearIndicatorAppeared());
        existingRequest.setTireWearPattern(updatedRequestData.getTireWearPattern());
        existingRequest.setComments(updatedRequestData.getComments());

        boolean newImagesWereActuallyProvided = newImages != null && newImages.stream().anyMatch(img -> img != null && !img.isEmpty());
        boolean clientJsonIndicatesRemoveAllImages = updatedRequestData.getImagePaths() != null && updatedRequestData.getImagePaths().isEmpty();

        if (newImagesWereActuallyProvided) {
            List<String> oldImagePaths = existingRequest.getImagePaths();
            if (oldImagePaths != null) {
                oldImagePaths.stream().filter(p -> p != null && !p.isBlank()).forEach(fileStorageService::deleteFile);
            }
            List<String> newImageFileNames = newImages.stream()
                .filter(img -> img != null && !img.isEmpty())
                .map(fileStorageService::storeFile)
                .collect(Collectors.toList());
            existingRequest.setImagePaths(newImageFileNames);
        } else if (clientJsonIndicatesRemoveAllImages) {
            List<String> oldImagePaths = existingRequest.getImagePaths();
            if (oldImagePaths != null) {
                oldImagePaths.stream().filter(p -> p != null && !p.isBlank()).forEach(fileStorageService::deleteFile);
            }
            existingRequest.setImagePaths(new ArrayList<>());
        }

        TireRequest saved = tireRequestRepository.save(existingRequest);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HttpStatus> deleteTireRequest(@PathVariable String id) {
        Optional<TireRequest> requestOpt = tireRequestRepository.findById(id);
        if(requestOpt.isEmpty()) return ResponseEntity.notFound().build();
        TireRequest request = requestOpt.get();
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();

        if (userDetails == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        boolean canDelete = false;
        boolean isAdminOrManagerOrTO = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_TRANSPORT_OFFICER"));
        boolean isOwner = userDetails.getId().equals(request.getRequestedByUserId());

        if (isAdminOrManagerOrTO || (isOwner && (request.getStatus() == ApprovalStatus.PENDING || request.getStatus() == ApprovalStatus.REJECTED))) canDelete = true;

        if (!canDelete) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<String> imagePaths = request.getImagePaths();
        if (imagePaths != null) {
            imagePaths.stream().filter(p -> p != null && !p.isBlank()).forEach(fileStorageService::deleteFile);
        }
        tireRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/manager-approve")
    @PreAuthorize("hasRole('ROLE_MANAGER')")
    public ResponseEntity<TireRequest> managerApproveRequest(@PathVariable String id, @RequestParam(required = false) String remarks) {
        return tireRequestRepository.findById(id).map(request -> {
            if (request.getStatus() != ApprovalStatus.PENDING) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(request);
            request.setManagerApproved(true); request.setManagerApprovalDate(LocalDateTime.now()); request.setStatus(ApprovalStatus.MANAGER_APPROVED);
            if (remarks != null && !remarks.isBlank()) request.setManagerRemarks(remarks);
            TireRequest saved = tireRequestRepository.save(request);
            userRepository.findByRolesContaining("ROLE_TRANSPORT_OFFICER").stream()
                .filter(to -> to.getEmail() != null && !to.getEmail().isBlank())
                .forEach(to -> emailService.sendManagerApprovalEmailToTransportOfficer(saved, to.getEmail()));

            // WebSocket notifications
            webSocketNotificationService.notifyTransportOfficers("MANAGER_APPROVAL_FOR_TO", saved);
            if (saved.getRequestedByUserId() != null) {
                webSocketNotificationService.notifyUserAboutStatusUpdate(saved.getRequestedByUserId(), saved);
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/manager-reject")
    @PreAuthorize("hasRole('ROLE_MANAGER')")
    public ResponseEntity<TireRequest> managerRejectRequest(@PathVariable String id, @RequestParam String remarks) {
        if (remarks == null || remarks.isBlank()) return ResponseEntity.badRequest().body(null); // Remarks mandatory
        return tireRequestRepository.findById(id).map(request -> {
            if (request.getStatus() == ApprovalStatus.FINAL_APPROVED || request.getStatus() == ApprovalStatus.REJECTED) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(request);
            request.setManagerApproved(false); request.setStatus(ApprovalStatus.REJECTED);
            request.setManagerRemarks(remarks); request.setTransportOfficerApproved(false);
            TireRequest saved = tireRequestRepository.save(request);
            if (saved.getRequestedByUserId() != null) userRepository.findById(saved.getRequestedByUserId())
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .ifPresent(u -> emailService.sendRejectionEmail(saved, u.getEmail(), "Manager", saved.getManagerRemarks()));

            // WebSocket notification for user
            if (saved.getRequestedByUserId() != null) {
                webSocketNotificationService.notifyUserAboutStatusUpdate(saved.getRequestedByUserId(), saved);
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/transport-approve")
    @PreAuthorize("hasRole('ROLE_TRANSPORT_OFFICER')")
    public ResponseEntity<TireRequest> transportOfficerApproveRequest(@PathVariable String id, @RequestParam(required = false) String remarks) {
        return tireRequestRepository.findById(id).map(request -> {
            if (request.getStatus() != ApprovalStatus.MANAGER_APPROVED) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(request);
            request.setTransportOfficerApproved(true); request.setTransportOfficerApprovalDate(LocalDateTime.now());
            request.setStatus(ApprovalStatus.FINAL_APPROVED);
            if (remarks != null && !remarks.isBlank()) request.setTransportOfficerRemarks(remarks);
            TireRequest saved = tireRequestRepository.save(request);
            String rEmail = null, mEmail = null;
            if (saved.getRequestedByUserId()!=null) rEmail = userRepository.findById(saved.getRequestedByUserId()).filter(u->u.getEmail()!=null && !u.getEmail().isBlank()).map(User::getEmail).orElse(null);
            mEmail = userRepository.findByRolesContaining("ROLE_MANAGER").stream().filter(m->m.getEmail()!=null && !m.getEmail().isBlank()).map(User::getEmail).findFirst().orElse(null);
            emailService.sendFinalApprovalEmail(saved, rEmail, mEmail);

            // WebSocket notification for user
            if (saved.getRequestedByUserId() != null) {
                webSocketNotificationService.notifyUserAboutStatusUpdate(saved.getRequestedByUserId(), saved);
            }
            // Optionally, notify manager as well if that's a requirement
            // webSocketNotificationService.notifyManagers("REQUEST_FINAL_APPROVED", savedRequest);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/transport-reject")
    @PreAuthorize("hasRole('ROLE_TRANSPORT_OFFICER')")
    public ResponseEntity<TireRequest> transportOfficerRejectRequest(@PathVariable String id, @RequestParam String remarks) {
        if (remarks == null || remarks.isBlank()) return ResponseEntity.badRequest().body(null); // Remarks mandatory
        return tireRequestRepository.findById(id).map(request -> {
            if (request.getStatus() == ApprovalStatus.FINAL_APPROVED || request.getStatus() == ApprovalStatus.REJECTED) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(request);
            request.setTransportOfficerApproved(false); request.setStatus(ApprovalStatus.REJECTED);
            request.setTransportOfficerRemarks(remarks);
            TireRequest saved = tireRequestRepository.save(request);
            if (saved.getRequestedByUserId() != null) userRepository.findById(saved.getRequestedByUserId())
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .ifPresent(u -> emailService.sendRejectionEmail(saved, u.getEmail(), "Transport Officer", saved.getTransportOfficerRemarks()));

            // WebSocket notification for user
            if (saved.getRequestedByUserId() != null) {
                webSocketNotificationService.notifyUserAboutStatusUpdate(saved.getRequestedByUserId(), saved);
            }
            // Optionally, notify manager if that's a requirement
            // webSocketNotificationService.notifyManagers("REQUEST_REJECTED_BY_TO", savedRequest);

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ROLE_MANAGER', 'ROLE_TRANSPORT_OFFICER', 'ROLE_ADMIN')")
    public ResponseEntity<List<TireRequest>> getPendingRequests() {
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();
        if (userDetails == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<ApprovalStatus> statusesToShow = new ArrayList<>();
        // Admin sees all pending and manager-approved requests
        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
             statusesToShow.addAll(List.of(ApprovalStatus.PENDING, ApprovalStatus.MANAGER_APPROVED));
        } else {
            // Manager sees requests pending their approval
            if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"))) {
                statusesToShow.add(ApprovalStatus.PENDING);
            }
            // Transport Officer sees requests pending their approval (i.e., manager approved)
            if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_TRANSPORT_OFFICER"))) {
                statusesToShow.add(ApprovalStatus.MANAGER_APPROVED);
            }
        }

        if (statusesToShow.isEmpty()) {
             // If user has no relevant roles to see any pending items (e.g. a ROLE_USER calling this somehow)
             return ResponseEntity.ok(new ArrayList<>());
        }
        return ResponseEntity.ok(tireRequestRepository.findByStatusIn(statusesToShow.stream().distinct().collect(Collectors.toList())));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TireRequest>> getRequestsByUserId(@PathVariable String userId) {
        if (userId == null || userId.isBlank()) return ResponseEntity.badRequest().build();
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();

        if (userDetails == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        // Admin, Manager, or TO can see any user's requests. Regular user can only see their own.
        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER") || a.getAuthority().equals("ROLE_TRANSPORT_OFFICER"))
            || userDetails.getId().equals(userId)) {
             return ResponseEntity.ok(tireRequestRepository.findByRequestedByUserId(userId));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("isAuthenticated()") // Similar authorization as getTireRequestById
    public ResponseEntity<byte[]> downloadTireRequestPdf(@PathVariable String id) {
        Optional<TireRequest> requestOpt = tireRequestRepository.findById(id);
        if (requestOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TireRequest request = requestOpt.get();
        UserDetailsImpl userDetails = getAuthenticatedUserDetails();

        if (userDetails == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        boolean canAccess = userDetails.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_ADMIN") ||
            a.getAuthority().equals("ROLE_MANAGER") ||
            a.getAuthority().equals("ROLE_TRANSPORT_OFFICER"))
            || userDetails.getId().equals(request.getRequestedByUserId());

        if (!canAccess) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            byte[] pdfBytes = pdfGenerationService.generateTireRequestPdf(request);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String filename = "tire_request_" + request.getVehicleNo().replaceAll("[^a-zA-Z0-9_]", "") + "_" + request.getId() + ".pdf";
            headers.setContentDispositionFormData("attachment", filename); // Or "inline" to display in browser
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            // Log the error
            System.err.println("Error generating PDF for request " + id + ": " + e.getMessage());
            // Check for the specific pagination error message
            if (e.getMessage() != null && e.getMessage().contains("Content exceeds page limit")) {
                 return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(("Error: PDF content is too large for a single page and automatic pagination failed. " + e.getMessage()).getBytes());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error generating PDF.".getBytes());
        }
    }
}
