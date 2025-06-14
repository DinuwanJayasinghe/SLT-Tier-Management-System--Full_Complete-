package com.example.tirerequestsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enables a simple in-memory message broker to carry messages back to the client on destinations prefixed with "/topic" or "/queue"
        config.enableSimpleBroker("/topic", "/queue");
        // Designates the "/app" prefix for messages that are bound for @MessageMapping-annotated methods in controllers.
        config.setApplicationDestinationPrefixes("/app");
        // Use "/user" prefix for user-specific messages (e.g., /user/queue/errors)
        // config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registers the "/ws-tire-request" endpoint, enabling SockJS fallback options so that alternate transports
        // may be used if WebSocket is not available. SockJS is recommended for broader browser compatibility.
        registry.addEndpoint("/ws-tire-request")
                .setAllowedOrigins(
                    "http://localhost:3000", // Local React dev server
                    "http://localhost:8080"  // If serving frontend from backend, or for testing
                    // Add other origins as needed (e.g., deployed frontend URL)
                 )
                .withSockJS();
    }
}
