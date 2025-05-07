
import { useState, useEffect } from 'react';
import { User, Chat, Message, Song } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  registerActiveListener, 
  unregisterActiveListener, 
  findPotentialMatches, 
  createMatch, 
  sendChatMessage, 
  getChatMessages 
} from '@/services/musicApi';

export const useMatchmaking = () => {
  const { currentUser } = useAuth();
  const [currentMatch, setCurrentMatch] = useState<User | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [matchTimer, setMatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeListeners, setActiveListeners] = useState<Record<string, number>>({});
  const [previousMatches, setPreviousMatches] = useState<string[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  
  // Realtime subscription for active listeners and matches
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
  }, [currentUser]);
  
  // Function to fetch user details for a match
  const fetchMatchUserDetails = async (userId: string, matchId: string, songId: string) => {
    try {
      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      // Get song details
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
      
      simulateRealMatch(
        {
          id: songData.id,
          title: songData.title,
          artist: songData.artist,
          albumArt: songData.album_art,
          audioUrl: songData.audio_url,
          duration: songData.duration,
          genre: songData.genre || '',
          language: songData.language as 'hindi' | 'english'
        }, 
        matchUser, 
        matchId
      );
      
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  };
  
  // Check for real-time match when another user starts listening to the same song
  const checkForRealTimeMatch = async (songId: string, otherUserId: string) => {
    if (!currentUser || !songId) return;
    
    try {
      // Check if current user is listening to this song
      const { data: currentUserListening, error: listeningError } = await supabase
        .from('active_listeners')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('song_id', songId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (listeningError) throw listeningError;
      
      // If current user is listening to the same song as the other user
      if (currentUserListening) {
        console.log('Match confirmed! Both users listening to the same song');
        
        // Check if these users are already matched
        const { data: existingMatch, error: matchError } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
          .eq('song_id', songId)
          .maybeSingle();
        
        if (matchError) throw matchError;
        
        if (!existingMatch) {
          console.log('Creating new match between users');
          // Create a new match since one doesn't exist
          await createMatch(currentUser.id, otherUserId, songId);
          // Note: The match creation will trigger the realtime subscription above
        } else {
          console.log('Match already exists between these users for this song');
        }
      }
    } catch (error) {
      console.error('Error checking for real-time match:', error);
    }
  };
  
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
  
  // Find a match for the current song - this runs when the current user starts playing
  const findMatch = async (song: Song) => {
    console.log("Finding match for song:", song.title);
    
    if (!currentUser) return;
    
    // Register as active listener for this song
    await registerActiveListener(currentUser.id, song.id);
    console.log(`Registered user ${currentUser.id} as active listener for song ${song.id}`);
    
    // Look for real matches - other users currently listening to the same song
    const potentialMatches = await findPotentialMatches(currentUser.id, song.id);
    console.log('Potential matches found:', potentialMatches);
    
    if (potentialMatches && potentialMatches.length > 0) {
      // Get the first match
      const match = potentialMatches[0];
      
      // Create a user object from the match
      const matchUser: User = {
        id: match.user_id,
        name: match.profiles?.name || 'Unknown User',
        email: match.profiles?.email || '',
        avatar: match.profiles?.avatar
      };
      
      console.log('Creating match with user:', matchUser.name);
      
      // Create the match in the database
      const matchId = await createMatch(currentUser.id, matchUser.id, song.id);
      
      if (matchId) {
        simulateRealMatch(song, matchUser, matchId);
      } else {
        console.log("Failed to create match");
        toast({
          title: "Looking for matches",
          description: "We'll notify you when someone else starts listening to this song",
        });
      }
    } else {
      console.log("No match found at this time");
      toast({
        title: "Looking for matches",
        description: "We'll notify you when someone else starts listening to this song",
        variant: "default",
      });
    }
  };
  
  // Function to force a match (for testing)
  const forceMatch = async (song: Song) => {
    console.log("Force matching disabled - using only real matching");
    
    if (!currentUser) {
      toast({
        title: "Not Logged In",
        description: "Please login to find matches.",
        variant: "destructive",
      });
      return;
    }
    
    // Register as active listener for this song
    await registerActiveListener(currentUser.id, song.id);
    
    // Instead of creating a fake match, just check for real matches
    findMatch(song);
  };
  
  // Simulate a match with a real user
  const simulateRealMatch = (song: Song, matchUser: User, matchId?: string) => {
    setCurrentMatch(matchUser);
    
    // Create a more personalized opening message with the real user
    const openingMessages = [
      `You and ${matchUser.name} are both enjoying "${song.title}"! Why not say hello?`,
      `${matchUser.name} loves "${song.title}" too! Start a conversation about your shared taste.`,
      `Musical match found! ${matchUser.name} is also listening to "${song.title}" right now.`,
      `Great minds think alike! ${matchUser.name} is also enjoying "${song.title}". Say hi!`
    ];
    
    const randomOpening = openingMessages[Math.floor(Math.random() * openingMessages.length)];
    
    const chatId = matchId || `chat-${Date.now()}`;
    
    const newChat: Chat = {
      id: chatId,
      matchId: chatId,
      users: [currentUser?.id || 'current-user', matchUser.id],
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'bot',
          content: randomOpening,
          timestamp: new Date(),
          isBot: true,
        }
      ]
    };
    
    setCurrentChat(newChat);
    setChatOpen(true);
    
    toast({
      title: "You found a music soulmate!",
      description: `${matchUser.name} is also listening to ${song.title}`,
    });
    
    // If we have a real match ID, save the first message
    if (matchId && currentUser) {
      // We'll send the bot message to the database
      sendChatMessage(matchId, 'bot', randomOpening);
    }
  };
  
  // Add a function to register connected users
  const registerConnectedUser = (user: User) => {
    setConnectedUsers(prev => {
      // Check if user is already registered
      if (prev.some(existingUser => existingUser.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });
  };
  
  // Remove user when they disconnect
  const unregisterConnectedUser = (userId: string) => {
    setConnectedUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Mock function to simulate multiple connected users for testing
  const addMockConnectedUsers = () => {
    console.log("Mock users disabled - using only real users");
    toast({
      title: "Mock Users Disabled",
      description: "The app is now using only real user matching.",
    });
  };
  
  // Send a chat message
  const sendMessage = async (content: string) => {
    if (!currentChat || !currentUser) return;
    
    console.log("Sending message:", content);
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content,
      timestamp: new Date(),
    };
    
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };
    
    setCurrentChat(updatedChat);
    
    // If this is a real match (has a UUID match ID), save the message to the database
    if (currentChat.matchId.length > 20) { // Simple check for UUID format
      await sendChatMessage(currentChat.matchId, currentUser.id, content);
    }
  };
  
  const toggleChat = () => {
    setChatOpen(!chatOpen);
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
