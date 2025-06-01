
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define payload types directly in this file
type ActiveListenerPayload = {
  id: string;
  user_id: string;
  song_id: string;
  is_active: boolean;
  started_at: string;
};

type MatchPayload = {
  id: string;
  user1_id: string;
  user2_id: string;
  song_id: string;
  created_at: string;
};

type RealtimeSubscriptionProps = {
  currentUser: User | null;
  setActiveListeners: (callback: (prev: Record<string, number>) => Record<string, number>) => void;
  checkForRealTimeMatch: (songId: string, userId: string) => void;
  fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => void;
  registerConnectedUser: (user: User) => void;
};

export const useRealtimeSubscriptions = ({
  currentUser,
  setActiveListeners,
  checkForRealTimeMatch,
  fetchMatchUserDetails,
  registerConnectedUser,
}: RealtimeSubscriptionProps) => {
  // Manage real-time subscriptions for active listeners
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('Setting up real-time subscriptions for active listeners for user:', currentUser.id);
    
    // Subscribe to active listener changes
    const activeListenersChannel = supabase
      .channel('active_listeners_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'active_listeners',
        },
        (payload: RealtimePostgresChangesPayload<ActiveListenerPayload>) => {
          console.log('Active listener change detected:', payload);
          
          // Use proper type casting and property checks
          const newData = payload.new as ActiveListenerPayload;
          if (newData && newData.song_id && newData.user_id) {
            updateActiveListenersCount(newData.song_id);
            
            // Only process active listeners and exclude current user
            if (newData.is_active && newData.user_id !== currentUser.id) {
              console.log('Potential match detected with user:', newData.user_id);
              console.log('For song:', newData.song_id);
              // Wait a brief moment to ensure both database records are saved
              setTimeout(() => {
                checkForRealTimeMatch(newData.song_id, newData.user_id);
              }, 500);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Active listeners subscription status:', status);
      });

    // Subscribe to matches table to catch new matches for BOTH users
    const matchesChannel = supabase
      .channel('matches_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches'
        },
        async (payload: RealtimePostgresChangesPayload<MatchPayload>) => {
          console.log('New match detected in real-time:', payload);
          const matchData = payload.new as MatchPayload;
          
          if (matchData) {
            // Check if current user is involved in this match
            const isCurrentUserInMatch = matchData.user1_id === currentUser.id || matchData.user2_id === currentUser.id;
            
            if (isCurrentUserInMatch) {
              console.log('Current user is part of this match, processing notification');
              
              // Determine the other user ID
              const otherUserId = matchData.user1_id === currentUser.id ? matchData.user2_id : matchData.user1_id;
              
              // Fetch the other user's details and register them
              try {
                const { data: otherUser, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', otherUserId)
                  .single();
                  
                if (!error && otherUser) {
                  console.log('Found matched user details:', otherUser);
                  
                  const userObj: User = {
                    id: otherUser.id,
                    name: otherUser.name,
                    email: otherUser.email,
                    avatar: otherUser.avatar
                  };
                  
                  // Register the matched user as connected
                  registerConnectedUser(userObj);
                  
                  // Fetch match details
                  fetchMatchUserDetails(otherUserId, matchData.id, matchData.song_id);
                  
                  toast({
                    title: "New Music Match!",
                    description: `You've matched with ${otherUser.name}!`,
                    variant: "default",
                  });
                } else {
                  console.error('Error fetching matched user details:', error);
                }
              } catch (error) {
                console.error('Error in match notification handler:', error);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Matches subscription status:', status);
      });
      
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(activeListenersChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, [currentUser, setActiveListeners, checkForRealTimeMatch, fetchMatchUserDetails, registerConnectedUser]);

  // Update active listeners count for a song
  const updateActiveListenersCount = async (songId: string) => {
    if (!songId) return;
    
    try {
      const { count, error } = await supabase
        .from('active_listeners')
        .select('id', { count: 'exact', head: true })
        .eq('song_id', songId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      console.log(`Updated active listener count for song ${songId}: ${count}`);
      
      setActiveListeners(prev => ({
        ...prev,
        [songId]: count || 0
      }));
    } catch (error) {
      console.error('Error updating active listeners count:', error);
    }
  };

  return {
    updateActiveListenersCount
  };
};
