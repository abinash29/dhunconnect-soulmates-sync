
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';

type RealtimeSubscriptionProps = {
  currentUser: User | null;
  setActiveListeners: (callback: (prev: Record<string, number>) => Record<string, number>) => void;
  checkForRealTimeMatch: (songId: string, userId: string) => void;
  fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => void;
};

export const useRealtimeSubscriptions = ({
  currentUser,
  setActiveListeners,
  checkForRealTimeMatch,
  fetchMatchUserDetails,
}: RealtimeSubscriptionProps) => {
  // Manage real-time subscriptions for active listeners and matches
  useEffect(() => {
    if (!currentUser) return;
    
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
        (payload) => {
          console.log('Active listener change detected:', payload);
          // Check for new active listeners on songs
          if (payload.new && typeof payload.new === 'object' && 'song_id' in payload.new) {
            updateActiveListenersCount(payload.new.song_id);
            
            // If a new active listener is detected for a song the current user is listening to
            if (currentUser && payload.new.user_id !== currentUser.id && payload.eventType === 'INSERT') {
              console.log('Potential match detected - checking same song');
              checkForRealTimeMatch(payload.new.song_id, payload.new.user_id);
            }
          }
        }
      )
      .subscribe();
      
    // Subscribe to new matches
    const matchesChannel = supabase
      .channel('matches_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          console.log('New match created:', payload);
          if (payload.new && currentUser) {
            // Check if current user is part of this match
            const isUserInMatch = payload.new.user1_id === currentUser.id || 
                                  payload.new.user2_id === currentUser.id;
            
            if (isUserInMatch) {
              console.log('Current user is part of new match, fetching details');
              const otherUserId = payload.new.user1_id === currentUser.id ? 
                                  payload.new.user2_id : payload.new.user1_id;
              
              fetchMatchUserDetails(otherUserId, payload.new.id, payload.new.song_id);
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(activeListenersChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, [currentUser, setActiveListeners, checkForRealTimeMatch, fetchMatchUserDetails]);

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
