
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
  
  // Realtime subscription for active listeners
  useEffect(() => {
    if (!currentUser) return;
    
    const channel = supabase
      .channel('active_listeners_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'active_listeners',
        },
        (payload) => {
          console.log('Active listener change:', payload);
          // Make sure we have a valid payload with song_id before updating
          if (payload.new && typeof payload.new === 'object' && 'song_id' in payload.new) {
            updateActiveListenersCount(payload.new.song_id);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);
  
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
      
      setActiveListeners(prev => ({
        ...prev,
        [songId]: count || 0
      }));
    } catch (error) {
      console.error('Error updating active listeners count:', error);
    }
  };
  
  // Function to force a match (for testing)
  const forceMatch = async (song: Song) => {
    console.log("Force matching for song:", song.title);
    
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
    
    // Check if we have connected users for a real match
    if (connectedUsers.length > 0) {
      // Pick a random connected user
      const randomUser = connectedUsers[Math.floor(Math.random() * connectedUsers.length)];
      simulateRealMatch(song, randomUser);
      toast({
        title: "Match Found!",
        description: `You've matched with ${randomUser.name} who is listening to the same song.`,
      });
    } else {
      // Find real matches on Supabase
      const potentialMatches = await findPotentialMatches(currentUser.id, song.id);
      
      if (potentialMatches && potentialMatches.length > 0) {
        // Get the first match
        const match = potentialMatches[0];
        
        // Create a real user
        const matchUser: User = {
          id: match.user_id,
          name: match.profiles?.name || 'Unknown User',
          email: match.profiles?.email || '',
          avatar: match.profiles?.avatar
        };
        
        // Create the match in the database
        const matchId = await createMatch(currentUser.id, matchUser.id, song.id);
        
        if (matchId) {
          simulateRealMatch(song, matchUser, matchId);
        }
      } else {
        toast({
          title: "No Matches Found",
          description: "No one is currently listening to the same song. Try again later!",
        });
      }
    }
  };
  
  // Find a match for the current song
  const findMatch = async (song: Song) => {
    console.log("Finding match for song:", song.title);
    
    if (!currentUser) return;
    
    // Register as active listener for this song
    await registerActiveListener(currentUser.id, song.id);
    
    // Look for real matches
    const potentialMatches = await findPotentialMatches(currentUser.id, song.id);
    
    if (potentialMatches && potentialMatches.length > 0) {
      // Get the first match
      const match = potentialMatches[0];
      
      // Create a real user
      const matchUser: User = {
        id: match.user_id,
        name: match.profiles?.name || 'Unknown User',
        email: match.profiles?.email || '',
        avatar: match.profiles?.avatar
      };
      
      // Create the match in the database
      const matchId = await createMatch(currentUser.id, matchUser.id, song.id);
      
      if (matchId) {
        simulateRealMatch(song, matchUser, matchId);
      } else {
        console.log("No match found at this time");
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
    const mockUsers = [
      {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        avatar: `https://api.dicebear.com/7.x/micah/svg?seed=Alice`
      },
      {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        avatar: `https://api.dicebear.com/7.x/micah/svg?seed=Bob`
      },
      {
        id: 'user-3',
        name: 'Charlie',
        email: 'charlie@example.com',
        avatar: `https://api.dicebear.com/7.x/micah/svg?seed=Charlie`
      }
    ];
    
    setConnectedUsers(mockUsers);
    toast({
      title: "Mock Users Connected",
      description: `Added ${mockUsers.length} mock users for testing.`,
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
