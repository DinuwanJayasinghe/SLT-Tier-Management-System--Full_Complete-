import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import AuthService from '../services/AuthService'; // For checking auth status without context dependency if needed
import { toast } from 'react-toastify';

const NotificationsContext = createContext(null);
// REACT_APP_API_WS_URL should be defined in .env, e.g. http://localhost:8080/ws-tire-request
const WS_URL = process.env.REACT_APP_API_WS_URL || 'http://localhost:8080/ws-tire-request';

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]); // Holds actual notification messages/data for dropdown
  const [unreadCount, setUnreadCount] = useState(0);    // Primarily for the bell badge
  const { currentUser, isAuthenticated } = useAuth();
  const audioRef = useRef(null);
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef({}); // To keep track of subscriptions: {key: subscriptionObject}

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.load();
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.log("Error playing sound:", error));
    }
  }, []);

  const processIncomingMessage = useCallback((messageBody, sourceTopic = "unknown") => {
    try {
      const notification = JSON.parse(messageBody);
      console.log(`Received WS Notification from ${sourceTopic}:`, notification);

      // Add to a list of viewable notifications (e.g., for a dropdown)
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10, newest first.

      setUnreadCount(prevCount => prevCount + 1);
      playNotificationSound();

      toast.info(notification.message || `Update for request: ${notification.data?.vehicleNo || 'N/A'}`, {
        onClick: () => {
          // TODO: Navigate to relevant page based on notification.data or type
          console.log("Toast clicked, notification data:", notification.data);
          // Example: if (notification.data?.id) navigate(`/requests/${notification.data.id}`);
        }
      });

    } catch (e) {
      console.error("Error processing incoming WS message:", e, "Raw body:", messageBody);
    }
  }, [playNotificationSound]); // Removed navigate from dependencies for now


  const connectWebSocket = useCallback(() => {
    // Ensure not already connected and user is authenticated
    if (stompClientRef.current?.connected || !isAuthenticated() || !currentUser) {
      return;
    }

    console.log("Attempting to connect WebSocket...");

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        // If your Spring Security + WebSocket setup requires JWT for STOMP connection:
        // Authorization: `Bearer ${currentUser.token}`
      },
      debug: (str) => { console.log('STOMP DEBUG: ' + str); },
      reconnectDelay: 10000, // Increased reconnect delay
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('STOMP: Connected: ' + frame);
      toast.success('Real-time updates connected!');

      // Clear any existing subscriptions before creating new ones
      Object.values(subscriptionsRef.current).forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
      });
      subscriptionsRef.current = {};

      const userRoles = currentUser.roles || [];
      const userId = currentUser.id;

      if (userRoles.includes('ROLE_MANAGER')) {
        subscriptionsRef.current.manager = client.subscribe('/topic/managerNotifications', (message) => {
          processIncomingMessage(message.body, '/topic/managerNotifications');
        });
        console.log('STOMP: Subscribed to /topic/managerNotifications');
      }
      if (userRoles.includes('ROLE_TRANSPORT_OFFICER')) {
         subscriptionsRef.current.to = client.subscribe('/topic/transportOfficerNotifications', (message) => {
          processIncomingMessage(message.body, '/topic/transportOfficerNotifications');
        });
        console.log('STOMP: Subscribed to /topic/transportOfficerNotifications');
      }
      if (userId) { // All authenticated users might have user-specific updates
        subscriptionsRef.current.user = client.subscribe(`/topic/user.${userId}.requestUpdates`, (message) => {
          processIncomingMessage(message.body, `/topic/user.${userId}.requestUpdates`);
        });
        console.log(`STOMP: Subscribed to /topic/user.${userId}.requestUpdates`);
      }
    };

    client.onStompError = (frame) => {
      console.error('STOMP: Broker reported error: ' + frame.headers['message']);
      console.error('STOMP: Additional details: ' + frame.body);
      toast.error('Real-time updates connection error with broker.');
    };

    client.onWebSocketError = (event) => {
        console.error("STOMP: WebSocket Error:", event);
        toast.warn("Real-time updates connection lost. Attempting to reconnect...");
    };

    client.onDisconnect = () => {
        console.log("STOMP: Disconnected.");
        // toast.warn("Real-time updates disconnected."); // Can be noisy on logout
    };

    client.activate();
    stompClientRef.current = client;

  }, [currentUser, isAuthenticated, processIncomingMessage]);

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) { // Check if client instance exists
        stompClientRef.current.deactivate(); // This handles closing and cleanup
        console.log("STOMP: Deactivated client.");
    }
    stompClientRef.current = null; // Clear the ref
    subscriptionsRef.current = {}; // Clear subscriptions map
    setNotifications([]); // Clear notifications list in UI
    setUnreadCount(0);    // Reset unread count
  }, []);

  useEffect(() => {
    if (isAuthenticated() && currentUser) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    return () => { // Cleanup on component unmount or before re-running due to dependency change
      disconnectWebSocket();
    };
  }, [isAuthenticated, currentUser, connectWebSocket, disconnectWebSocket]);


  const refreshNotifications = useCallback(() => {
    // This is now primarily for dashboards to re-fetch their main data.
    // WebSocket pushes updates, so context doesn't need to poll.
    // Dashboards can call their own fetch methods.
    // However, if a manual "sync" for notifications dropdown is needed, it could be added here.
    console.log("`refreshNotifications` called in context - typically for dashboards to re-fetch their own data now.");
    // For example, if the bell dropdown is stale, it could re-fetch a list of *past* notifications.
    // The `unreadCount` is updated by live messages.
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, refreshNotifications, markAsRead, setNotifications, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
