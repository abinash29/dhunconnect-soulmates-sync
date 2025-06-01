
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
    
    // Subscribe to real-time updates for matches where current user is involved
    const matchesChannel = supabase
      .channel('realtime_matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${currentUser.id}`
        },
        async (payload) => {
          console.log('New match notification received (as user1):', payload);
          if (payload.new) {
            setNewMatches(prev => [...prev, payload.new]);
            const newData = payload.new as any;
            
            // Fetch the other user's details and add to connected users
            try {
              const { data: otherUser, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newData.user2_id)
                .single();
                
              if (!error && otherUser) {
                const userObj: User = {
                  id: otherUser.id,
                  name: otherUser.name,
                  email: otherUser.email,
                  avatar: otherUser.avatar
                };
                
                // Register the matched user as connected
                registerConnectedUser(userObj);
                
                // Fetch match details and open chat
                fetchMatchUserDetails(newData.user2_id, newData.id, newData.song_id);
                
                toast({
                  title: "New Music Match!",
                  description: `You've matched with ${otherUser.name}!`,
                  variant: "default",
                });
                
                setChatOpen();
              }
            } catch (error) {
              console.error('Error fetching matched user details:', error);
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
          filter: `user2_id=eq.${currentUser.id}`
        },
        async (payload) => {
          console.log('New match notification received (as user2):', payload);
          if (payload.new) {
            setNewMatches(prev => [...prev, payload.new]);
            const newData = payload.new as any;
            
            // Fetch the other user's details and add to connected users
            try {
              const { data: otherUser, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newData.user1_id)
                .single();
                
              if (!error && otherUser) {
                const userObj: User = {
                  id: otherUser.id,
                  name: otherUser.name,
                  email: otherUser.email,
                  avatar: otherUser.avatar
                };
                
                // Register the matched user as connected
                registerConnectedUser(userObj);
                
                // Fetch match details and open chat
                fetchMatchUserDetails(newData.user1_id, newData.id, newData.song_id);
                
                toast({
                  title: "New Music Match!",
                  description: `You've matched with ${otherUser.name}!`,
                  variant: "default",
                });
                
                setChatOpen();
              }
            } catch (error) {
              console.error('Error fetching matched user details:', error);
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
