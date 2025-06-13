import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react'; // Added useRef
import NotificationService from '../services/NotificationService';
import { useAuth } from './AuthContext'; // To know if user is authenticated and their roles

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser, isAuthenticated } = useAuth();
  const audioRef = useRef(null); // Ref for the audio element
  const prevUnreadCountRef = useRef(0); // Ref to store previous unread count

  // Initialize Audio element
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3'); // Path to sound file in public folder
    audioRef.current.load(); // Preload the sound
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.log("Error playing sound:", error)); // Play sound
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated()) { // Check using isAuthenticated from useAuth
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
      return;
    }

    // Only fetch for Manager or TO roles for now
    const userRoles = currentUser?.roles || [];
    const isManager = userRoles.includes('ROLE_MANAGER');
    const isTO = userRoles.includes('ROLE_TRANSPORT_OFFICER');

    if (!isManager && !isTO) {
        setNotifications([]);
        setUnreadCount(0);
        return;
    }

    try {
      const response = await NotificationService.getPendingNotifications();
      const fetchedNotifications = response.data || [];

      // Filter notifications based on role for frontend count (backend might do this already)
      let relevantNotifications = [];
      if (isManager) {
        relevantNotifications = fetchedNotifications.filter(n => n.status === 'PENDING');
      } else if (isTO) { // TO sees what Manager has approved
        relevantNotifications = fetchedNotifications.filter(n => n.status === 'MANAGER_APPROVED');
      }
      // If an admin is both, they'd see both. The /pending endpoint might need refinement or separate calls.
      // For simplicity, if user is both, this logic might show only manager notifications if manager check is first.
      // A more robust solution might involve the backend sending role-specific pending counts or separate endpoints.
      // Current /pending endpoint as per backend returns PENDING and MANAGER_APPROVED.

      setNotifications(relevantNotifications); // Store only relevant ones for display

      const newCount = relevantNotifications.length;
      // setUnreadCount(newCount); // This will be set by comparing with previous count to detect "new"

      // Play sound if new notifications have arrived (count increased or items are new)
      // More robust: check if `relevantNotifications` contains items not previously seen.
      // For now, simple count increase detection.
      if (newCount > 0 && newCount > prevUnreadCountRef.current) {
        playNotificationSound();
      }
      setUnreadCount(newCount); // Update the badge count regardless
      prevUnreadCountRef.current = newCount; // Update previous count for next comparison

    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Optionally set an error state or toast
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    fetchNotifications(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchNotifications]);

  // Function to manually refresh notifications if needed
  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Function to mark notifications as read (clears count, could be more granular later)
  const markAsRead = () => {
    // For now, simply opening the modal might be considered "reading"
    // Or, this could be a more explicit action later.
    // setUnreadCount(0); // This would clear badge, but notifications list might still be full.
    // More advanced: keep track of seen notification IDs.
  };


  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, refreshNotifications, markAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
