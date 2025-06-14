package com.example.tirerequestsystem.dto;

import com.example.tirerequestsystem.models.TireRequest;

import java.time.LocalDateTime;

public class NotificationMessageDTO {
    private String type; // e.g., "NEW_REQUEST", "STATUS_UPDATE"
    private String message;
    private TireRequest data; // The actual TireRequest object or relevant parts
    private LocalDateTime timestamp;

    public NotificationMessageDTO() {
        this.timestamp = LocalDateTime.now();
    }

    public NotificationMessageDTO(String type, String message, TireRequest data) {
        this();
        this.type = type;
        this.message = message;
        this.data = data;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public TireRequest getData() {
        return data;
    }

    public void setData(TireRequest data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
