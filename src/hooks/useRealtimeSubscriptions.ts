
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
};

export const useRealtimeSubscriptions = ({
  currentUser,
  setActiveListeners,
  checkForRealTimeMatch,
  fetchMatchUserDetails,
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
      
    return () => {
      console.log('Cleaning up active listeners subscription');
      supabase.removeChannel(activeListenersChannel);
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
