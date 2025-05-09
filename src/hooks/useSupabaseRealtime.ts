
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
}: UseSupabaseRealtimeProps = {
  setChatOpen: () => {},
  setCurrentChat: () => {},
  fetchMatchUserDetails: () => {}
}) => {
  const { currentUser } = useAuth();
  const [newMatches, setNewMatches] = useState<any[]>([]);
  const [newMessages, setNewMessages] = useState<any[]>([]);
  const [activeListenerUpdates, setActiveListenerUpdates] = useState<any[]>([]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to real-time updates for matches
    const matchesChannel = supabase
      .channel('public:matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${currentUser.id}` // Matches where user is user1
        },
        (payload) => {
          console.log('New match notification received:', payload);
          if (payload.new) {
            setNewMatches(prev => [...prev, payload.new]);
            const newData = payload.new as any;
            if ('id' in newData && 'user2_id' in newData && 'song_id' in newData) {
              // Automatically open chat when matched
              fetchMatchUserDetails(newData.user2_id, newData.id, newData.song_id);
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
          console.log('New match notification received:', payload);
          if (payload.new) {
            setNewMatches(prev => [...prev, payload.new]);
            const newData = payload.new as any;
            if ('id' in newData && 'user1_id' in newData && 'song_id' in newData) {
              // Automatically open chat when matched
              fetchMatchUserDetails(newData.user1_id, newData.id, newData.song_id);
            }
          }
        }
      )
      .subscribe();
    
    // Subscribe to real-time updates for chat messages
    const messagesChannel = supabase
      .channel('public:chat_messages')
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
      .subscribe();
    
    // Subscribe to active listener updates
    const activeListenersChannel = supabase
      .channel('public:active_listeners')
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'active_listeners'
        },
        (payload) => {
          console.log('Active listener update:', payload);
          setActiveListenerUpdates(prev => [...prev, payload]);
        }
      )
      .subscribe();
    
    // Clean up subscriptions
    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(activeListenersChannel);
    };
  }, [currentUser, fetchMatchUserDetails]);
  
  const fetchMatchDetails = async (matchId: string, otherUserId: string, songId: string) => {
    try {
      // Fetch other user details
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();
      
      if (userError) throw userError;
      
      // Fetch song details
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single();
      
      if (songError) throw songError;
      
      const matchUser: User = {
        id: userData.id,
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        avatar: userData.avatar
      };
      
      const song: Song = {
        id: songData.id,
        title: songData.title,
        artist: songData.artist,
        albumArt: songData.album_art,
        audioUrl: songData.audio_url,
        duration: songData.duration,
        genre: songData.genre || '',
        language: songData.language as 'hindi' | 'english'
      };
      
      // Fetch chat messages for this match
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;
      
      // Create a chat object
      const chat = {
        id: matchId,
        matchId: matchId,
        users: [currentUser?.id, otherUserId],
        messages: messagesData.map((msg) => ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isBot: msg.sender_id === 'bot'
        }))
      };
      
      // If no messages yet, create a default welcome message
      if (chat.messages.length === 0) {
        const welcomeMessage = `You've matched with ${matchUser.name} listening to "${song.title}"! Say hello and start chatting!`;
        chat.messages.push({
          id: `msg-${Date.now()}`,
          senderId: 'bot',
          content: welcomeMessage,
          timestamp: new Date(),
          isBot: true
        });
        
        // Save this welcome message to the database
        await supabase
          .from('chat_messages')
          .insert({
            match_id: matchId,
            sender_id: 'bot',
            content: welcomeMessage
          });
      }
      
      // Update the current chat and open the chat window
      setCurrentChat(chat);
      setChatOpen(true);
      
      toast({
        title: "New Music Connection!",
        description: `You've matched with ${matchUser.name} listening to "${song.title}"`,
      });
      
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  };
  
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
    activeListenerUpdates,
    clearNewMatches,
    clearNewMessages,
    fetchMatchDetails
  };
};
