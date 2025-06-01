
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Song } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type UseSupabaseRealtimeProps = {
  setChatOpen?: () => void;
  fetchMatchUserDetails?: (userId: string, matchId: string, songId: string) => void;
  registerConnectedUser?: (user: User) => void;
};

export const useSupabaseRealtime = ({
  setChatOpen = () => {},
  fetchMatchUserDetails = () => {},
  registerConnectedUser = () => {}
}: UseSupabaseRealtimeProps) => {
  const { currentUser } = useAuth();
  const [newMatches, setNewMatches] = useState<any[]>([]);
  const [newMessages, setNewMessages] = useState<any[]>([]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('Setting up Supabase realtime subscriptions for user:', currentUser.id);
    
    // Subscribe to ALL new matches in the matches table - this will notify BOTH users
    const matchesChannel = supabase
      .channel('realtime_matches_all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches'
        },
        async (payload) => {
          console.log('New match notification received:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            
            // Check if current user is involved in this match
            const isCurrentUserInMatch = newData.user1_id === currentUser.id || newData.user2_id === currentUser.id;
            
            if (isCurrentUserInMatch) {
              console.log('Current user is part of this match:', newData);
              setNewMatches(prev => [...prev, payload.new]);
              
              // Determine the other user ID
              const otherUserId = newData.user1_id === currentUser.id ? newData.user2_id : newData.user1_id;
              
              // Fetch the other user's details and add to connected users
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
                  
                  // Register the matched user as connected - THIS IS KEY
                  registerConnectedUser(userObj);
                  
                  // Fetch match details and open chat
                  fetchMatchUserDetails(otherUserId, newData.id, newData.song_id);
                  
                  toast({
                    title: "New Music Match!",
                    description: `You've matched with ${otherUser.name}!`,
                    variant: "default",
                  });
                  
                  // Open chat for both users
                  setChatOpen();
                } else {
                  console.error('Error fetching matched user details:', error);
                }
              } catch (error) {
                console.error('Error in match notification handler:', error);
              }
            } else {
              console.log('Current user is not part of this match');
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
          table: 'chat_messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('New message received (as receiver):', payload);
          if (payload.new) {
            handleNewMessage(payload.new);
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
  }, [currentUser, fetchMatchUserDetails, setChatOpen, registerConnectedUser]);
  
  // Handle incoming message
  const handleNewMessage = async (messageData: any) => {
    if (!currentUser) return;
    
    try {
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
        
        setChatOpen();
      }
    } catch (error) {
      console.error('Error handling new message:', error);
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
