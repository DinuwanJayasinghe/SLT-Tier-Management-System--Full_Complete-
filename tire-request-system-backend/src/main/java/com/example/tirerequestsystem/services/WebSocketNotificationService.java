package com.example.tirerequestsystem.services;

import com.example.tirerequestsystem.dto.NotificationMessageDTO;
import com.example.tirerequestsystem.models.TireRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Sends a notification about a tire request to a general topic.
     * This might be used for new requests relevant to all managers, for example.
     * @param type The type of notification (e.g., "NEW_REQUEST_FOR_MANAGER", "STATUS_UPDATE_FOR_TO")
     * @param request The TireRequest data
     */
    public void notifyManagers(String type, TireRequest request) {
        String message = String.format("New tire request for vehicle %s requires manager approval.", request.getVehicleNo());
        NotificationMessageDTO notification = new NotificationMessageDTO(type, message, request);
        // Managers subscribe to /topic/managerNotifications
        messagingTemplate.convertAndSend("/topic/managerNotifications", notification);
    }

    public void notifyTransportOfficers(String type, TireRequest request) {
        String message = String.format("Tire request for vehicle %s (approved by manager) requires your final approval.", request.getVehicleNo());
        NotificationMessageDTO notification = new NotificationMessageDTO(type, message, request);
        // Transport officers subscribe to /topic/transportOfficerNotifications
        messagingTemplate.convertAndSend("/topic/transportOfficerNotifications", notification);
    }

    /**
     * Sends a notification about a tire request status update to the user who created it.
     * @param userId The ID of the user to notify.
     * @param request The TireRequest data with updated status.
     */
    public void notifyUserAboutStatusUpdate(String userId, TireRequest request) {
        String message = String.format("Your tire request for vehicle %s has been updated to: %s.",
                                       request.getVehicleNo(), request.getStatus());
        NotificationMessageDTO notification = new NotificationMessageDTO("STATUS_UPDATE", message, request);
        // Users subscribe to their specific queue, e.g., /user/{userId}/queue/requestUpdates
        // Note: For user-specific messages, @SendToUser or SimpMessagingTemplate.convertAndSendToUser might be used
        // if Spring Security context is integrated with WebSockets, or use a user-specific topic.
        // Using a general topic for now for simplicity, but this should be user-specific.
        // A simple approach for user-specific topics without full user-destination setup:
        messagingTemplate.convertAndSend("/topic/user." + userId + ".requestUpdates", notification);
    }

    /**
     * Sends a general notification about a request, could be to multiple roles or a general info topic.
     * @param request The TireRequest data
     * @param message A custom message for the notification.
     * @param targetRoles List of roles to target (e.g. "ROLE_MANAGER", "ROLE_ADMIN") - custom logic needed to map roles to topics.
     */
    public void sendGenericRequestNotification(TireRequest request, String message, List<String> targetRoles) {
        // This is a more complex scenario. For now, let's focus on the specific role topics.
        // Example: if targetRoles contains "ROLE_MANAGER", send to /topic/managerNotifications
        // if targetRoles contains "ROLE_USER" and it's about their request, send to their user-specific topic.
        // This method demonstrates a need for a more dynamic topic resolution or multiple sends.

        // For simplicity, this example won't implement the dynamic role-to-topic mapping here
        // but will use the existing specific methods as building blocks.

        if (targetRoles == null || targetRoles.isEmpty()) return;

        NotificationMessageDTO notification = new NotificationMessageDTO("GENERAL_UPDATE", message, request);

        if (targetRoles.contains("ROLE_MANAGER") && request.getStatus().equals("PENDING")) {
             messagingTemplate.convertAndSend("/topic/managerNotifications", notification);
        }
        if (targetRoles.contains("ROLE_TRANSPORT_OFFICER") && request.getStatus().equals("MANAGER_APPROVED")) {
             messagingTemplate.convertAndSend("/topic/transportOfficerNotifications", notification);
        }
        // Add more conditions as needed, or use a more sophisticated topic strategy
    }
}
