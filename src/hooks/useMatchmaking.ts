
import { useState, useEffect } from 'react';
import { User, Song } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { unregisterActiveListener } from '@/services/musicApi';
import { useUserManagement } from './useUserManagement';
import { useMessageHandling } from './useMessageHandling';
import { useMatchLogic } from './useMatchLogic';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { useSupabaseRealtime } from './useSupabaseRealtime';

export const useMatchmaking = () => {
  const { currentUser } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<User | null>(null);
  const [matchTimer, setMatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeListeners, setActiveListeners] = useState<Record<string, number>>({});
  const [previousMatches, setPreviousMatches] = useState<string[]>([]);
  
  // Import functionality from our hooks
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
    setChatOpen: (isOpen: boolean) => {
      console.log('Setting chat open from match logic:', isOpen);
      setChatOpen(isOpen);
      
      // Notify both users when a match occurs
      if (isOpen && currentMatch) {
        console.log('Match found! Notifying users...');
        // This will handle the notification for both the first and second user
      }
    }
  });
  
  // Set up real-time subscriptions with all required props
  const { updateActiveListenersCount } = useRealtimeSubscriptions({
    currentUser,
    setActiveListeners,
    checkForRealTimeMatch: (song: Song) => {
      console.log('Real-time match check triggered for:', song.title);
      return checkForRealTimeMatch(song);
    },
    fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => {
      console.log('Fetching match details for users:', { userId, matchId, songId });
      return fetchMatchUserDetails(userId, matchId, songId);
    },
    registerConnectedUser: (user: User) => registerConnectedUser(user, currentUser?.id)
  });
  
  // Set up Supabase realtime for enhanced chat functionality
  const supabaseRealtime = useSupabaseRealtime({
    setChatOpen: (shouldOpen: boolean = true) => {
      console.log('Supabase realtime setting chat open:', shouldOpen);
      if (shouldOpen) {
        setChatOpen(true);
      }
    },
    fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => {
      console.log('Supabase realtime fetching match details:', { userId, matchId, songId });
      return fetchMatchUserDetails(userId, matchId, songId);
    },
    registerConnectedUser: (user: User) => registerConnectedUser(user, currentUser?.id)
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
    connectedUsers,
    fetchMatchUserDetails,
    setChatOpen,
    setCurrentChat
  };
};
