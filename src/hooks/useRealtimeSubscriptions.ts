
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
    
    console.log('Setting up real-time subscriptions for user:', currentUser.id);
    
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
          // Check for new active listeners on songs
          if (payload.new && typeof payload.new === 'object' && 'song_id' in payload.new) {
            updateActiveListenersCount(payload.new.song_id);
            
            // Only process active listeners
            if (payload.new.is_active) {
              // If a new active listener is detected for a song the current user is listening to
              if (currentUser && payload.new.user_id !== currentUser.id) {
                console.log('Potential match detected with user:', payload.new.user_id);
                console.log('For song:', payload.new.song_id);
                // Wait a brief moment to ensure both database records are saved
                setTimeout(() => {
                  checkForRealTimeMatch(payload.new.song_id, payload.new.user_id);
                }, 500);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Active listeners subscription status:', status);
      });
      
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
        (payload: RealtimePostgresChangesPayload<MatchPayload>) => {
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
              
              // Display a toast notification immediately 
              toast({
                title: "New Music Connection!",
                description: `You've been matched with someone listening to the same song!`,
                variant: "default",
              });
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
