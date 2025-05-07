
import { useState, useEffect } from 'react';
import { User, Song } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { unregisterActiveListener } from '@/services/musicApi';
import { useUserManagement } from './useUserManagement';
import { useMessageHandling } from './useMessageHandling';
import { useMatchLogic } from './useMatchLogic';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';

export const useMatchmaking = () => {
  const { currentUser } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<User | null>(null);
  const [matchTimer, setMatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeListeners, setActiveListeners] = useState<Record<string, number>>({});
  const [previousMatches, setPreviousMatches] = useState<string[]>([]);
  
  // Import functionality from our new hooks
  const {
    connectedUsers,
    registerConnectedUser,
    unregisterConnectedUser,
    addMockConnectedUsers
  } = useUserManagement();
  
  const {
    chatOpen,
    currentChat,
    setChatOpen,
    setCurrentChat,
    sendMessage,
    toggleChat
  } = useMessageHandling({ currentUser });
  
  const {
    findMatch,
    fetchMatchUserDetails,
    checkForRealTimeMatch
  } = useMatchLogic({
    currentUser,
    setCurrentMatch,
    setCurrentChat,
    setChatOpen
  });
  
  // Set up real-time subscriptions
  const { updateActiveListenersCount } = useRealtimeSubscriptions({
    currentUser,
    setActiveListeners,
    checkForRealTimeMatch,
    fetchMatchUserDetails
  });
  
  // Function to force a match (for testing)
  const forceMatch = async (song: Song) => {
    console.log("Force matching disabled - using only real matching");
    
    if (!currentUser) {
      return;
    }
    
    // Instead of creating a fake match, just check for real matches
    findMatch(song);
  };
  
  return {
    currentMatch,
    chatOpen,
    currentChat,
    activeListeners,
    setActiveListeners,
    findMatch,
    forceMatch,
    sendMessage,
    toggleChat,
    matchTimer,
    setMatchTimer,
    registerConnectedUser,
    unregisterConnectedUser,
    addMockConnectedUsers,
    connectedUsers
  };
};
