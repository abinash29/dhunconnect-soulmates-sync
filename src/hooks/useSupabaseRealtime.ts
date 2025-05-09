
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Song } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type UseSupabaseRealtimeProps = {
  setChatOpen: (isOpen: boolean) => void;
  setCurrentChat: (chat: any) => void;
  fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => void;
};

export const useSupabaseRealtime = ({
  setChatOpen = () => {},
  setCurrentChat = () => {},
  fetchMatchUserDetails = () => {}
}: UseSupabaseRealtimeProps = {}) => {
  const { currentUser } = useAuth();
  const [newMatches, setNewMatches] = useState<any[]>([]);
  const [newMessages, setNewMessages] = useState<any[]>([]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('Setting up Supabase realtime subscriptions for user:', currentUser.id);
    
    // Subscribe to real-time updates for matches
    const matchesChannel = supabase
      .channel('realtime_matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${currentUser.id}` // Matches where user is user1
        },
        (payload) => {
          console.log('New match notification received (user1):', payload);
          if (payload.new) {
            setNewMatches(prev => [...prev, payload.new]);
            const newData = payload.new as any;
            if ('id' in newData && 'user2_id' in newData && 'song_id' in newData) {
              // Automatically open chat when matched
              fetchMatchUserDetails(newData.user2_id, newData.id, newData.song_id);
              
              toast({
                title: "New Music Match!",
                description: `You've matched with someone listening to the same song!`,
                variant: "default",
              });
              
              // Open chat automatically
              setChatOpen(true);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${currentUser.id}` // Matches where user is user2
        },
        (payload) => {
          console.log('New match notification received (user2):', payload);
          if (payload.new) {
            setNewMatches(prev => [...prev, payload.new]);
            const newData = payload.new as any;
            if ('id' in newData && 'user1_id' in newData && 'song_id' in newData) {
              // Automatically open chat when matched
              fetchMatchUserDetails(newData.user1_id, newData.id, newData.song_id);
              
              toast({
                title: "New Music Match!",
                description: `You've matched with someone listening to the same song!`,
                variant: "default",
              });
              
              // Open chat automatically
              setChatOpen(true);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Matches subscription status:', status);
      });
    
    // Subscribe to real-time updates for chat messages
    const messagesChannel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          if (payload.new) {
            checkIfMessageIsRelevant(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up Supabase realtime subscriptions');
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUser, fetchMatchUserDetails, setChatOpen, setCurrentChat]);
  
  const checkIfMessageIsRelevant = async (messageData: any) => {
    if (!currentUser) return;
    
    try {
      // Fetch the match to see if the current user is part of it
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', messageData.match_id)
        .single();
      
      if (matchError) throw matchError;
      
      // Check if the current user is part of this match
      if (matchData.user1_id === currentUser.id || matchData.user2_id === currentUser.id) {
        // Only add the message if the sender is not the current user
        if (messageData.sender_id !== currentUser.id) {
          setNewMessages(prev => [...prev, messageData]);
          
          // Get sender name
          const { data: senderData, error: senderError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', messageData.sender_id)
            .single();
          
          if (!senderError && senderData) {
            toast({
              title: "New Message",
              description: `${senderData.name} sent you a message`,
              variant: "default",
            });
            
            // Auto-open chat window if there's a new message
            setChatOpen(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking if message is relevant:', error);
    }
  };
  
  const clearNewMatches = () => {
    setNewMatches([]);
  };
  
  const clearNewMessages = () => {
    setNewMessages([]);
  };
  
  return {
    newMatches,
    newMessages,
    clearNewMatches,
    clearNewMessages
  };
};
