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
        } else {
          // Fall back to simulated match if match creation failed
          simulateMatch(song);
        }
      } else {
        // Fall back to simulated match if no real users are connected
        simulateMatch(song);
        toast({
          title: "Test Match Created",
          description: "A test match has been created for debugging purposes",
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
    
    // Get current listeners for this song
    const listeners = activeListeners[song.id] || 0;
    console.log("Active listeners for this song:", listeners);
    
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
        // More realistic matching logic - higher chance when there are more listeners
        if (listeners > 0 || Math.random() > 0.3) {
          simulateMatch(song);
        } else {
          console.log("No match found at this time");
          toast({
            title: "Looking for matches",
            description: "We'll notify you when someone else starts listening to this song",
          });
          
          // Set a timer to check again in a few seconds
          setTimeout(() => {
            if (Math.random() > 0.5) {
              simulateMatch(song);
            }
          }, 8000);
        }
      }
    } else {
      // More realistic matching logic - higher chance when there are more listeners
      if (listeners > 0 || Math.random() > 0.3) {
        simulateMatch(song);
      } else {
        console.log("No match found at this time");
        toast({
          title: "Looking for matches",
          description: "We'll notify you when someone else starts listening to this song",
        });
        
        // Set a timer to check again in a few seconds
        setTimeout(() => {
          if (Math.random() > 0.5) {
            simulateMatch(song);
          }
        }, 8000);
      }
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
  
  // Simulate a match with a generated user (fallback)
  const simulateMatch = (song: Song) => {
    const names = ["Alex", "Taylor", "Jordan", "Morgan", "Riley", "Casey", "Avery", "Quinn", "Dakota", "Skyler"];
    
    // Try to avoid repeating the same match
    let availableNames = names.filter(name => !previousMatches.includes(name));
    if (availableNames.length === 0) availableNames = names;
    
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    
    // Add to previous matches
    setPreviousMatches(prev => [...prev, randomName]);
    if (previousMatches.length > 5) {
      // Keep only the 5 most recent matches
      setPreviousMatches(prev => prev.slice(-5));
    }
    
    const mockMatchUser: User = {
      id: 'match-' + Date.now(),
      name: randomName,
      email: `${randomName.toLowerCase()}@example.com`,
      avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${randomName}`
    };
    
    setCurrentMatch(mockMatchUser);
    
    // Create more conversational opening messages
    const openingMessages = [
      `You and ${mockMatchUser.name} are both enjoying "${song.title}"! Why not say hello?`,
      `${mockMatchUser.name} loves "${song.title}" too! Start a conversation about your shared taste.`,
      `Musical match found! ${mockMatchUser.name} is also listening to "${song.title}" right now.`,
      `Great minds think alike! ${mockMatchUser.name} is also enjoying "${song.title}". Say hi!`
    ];
    
    const randomOpening = openingMessages[Math.floor(Math.random() * openingMessages.length)];
    
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      matchId: `match-${Date.now()}`,
      users: ['current-user', mockMatchUser.id],
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
      description: `${mockMatchUser.name} is also listening to ${song.title}`,
    });
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
    
    // For simulated matches, simulate a response
    if (currentChat.matchId.length < 20) {
      // Simulate typing delay based on message length
      const typingDelay = Math.min(1000 + content.length * 30, 3000);
      
      setTimeout(() => {
        simulateResponse(content);
      }, typingDelay);
    }
  };
  
  // Simulate a response (for mock matches only)
  const simulateResponse = (userMessage: string) => {
    if (!currentChat || !currentMatch) return;
    
    // More contextual responses based on what the user said
    let responseContent = '';
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('recommend') || lowerCaseMessage.includes('suggestion')) {
      const recommendations = [
        "I've been listening to a lot of indie rock lately. Have you heard of Tame Impala?",
        "Check out The Weeknd's new album, it's been on repeat for me!",
        "If you like this song, you might enjoy Dua Lipa's Future Nostalgia album.",
        "For something similar but different, try Glass Animals. Their beats are amazing!"
      ];
      responseContent = recommendations[Math.floor(Math.random() * recommendations.length)];
    } 
    else if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hey')) {
      const greetings = [
        `Hi there! Nice to meet someone with similar music taste!`,
        `Hello! So cool to find someone who enjoys the same tunes!`,
        `Hey! How long have you been listening to this artist?`,
        `Hi! This is one of my favorite songs right now! What about you?`
      ];
      responseContent = greetings[Math.floor(Math.random() * greetings.length)];
    } 
    else if (lowerCaseMessage.includes('name') || lowerCaseMessage.includes('who are')) {
      responseContent = `I'm ${currentMatch.name}! I love discovering new music and connecting with people who share my taste.`;
    } 
    else if (lowerCaseMessage.includes('favorite') || lowerCaseMessage.includes('best')) {
      const favorites = [
        "My favorite artist right now is probably The Weeknd. His production is incredible!",
        "I'm really into indie rock bands like Arctic Monkeys and Tame Impala.",
        "I've been on a huge 90s kick lately - Nirvana, Pearl Jam, you name it!",
        "I love anything with a good beat - electronic, hip-hop, even some jazz fusion."
      ];
      responseContent = favorites[Math.floor(Math.random() * favorites.length)];
    }
    else if (lowerCaseMessage.includes('concert') || lowerCaseMessage.includes('show') || lowerCaseMessage.includes('live')) {
      const concerts = [
        "I went to Coachella last year and it was amazing! Have you been to any festivals?",
        "I'm planning to see Coldplay when they come to town next month. Their live shows are incredible!",
        "The best concert I've ever been to was probably Daft Punk years ago. Still remember it vividly.",
        "I haven't been to many concerts lately, but I'm hoping to change that this year. Any recommendations?"
      ];
      responseContent = concerts[Math.floor(Math.random() * concerts.length)];
    }
    else if (lowerCaseMessage.length < 10) {
      const shortResponses = [
        "Tell me more about your music preferences! I'm always looking for new recommendations.",
        "What other artists are you into these days?",
        "How did you discover this song?",
        "Do you play any instruments yourself?"
      ];
      responseContent = shortResponses[Math.floor(Math.random() * shortResponses.length)];
    } 
    else {
      // General music-related responses
      const responses = [
        "I love this song too! What's your favorite part?",
        "Have you heard their other tracks? The whole album is amazing.",
        "This artist is so talented! Been following them for years.",
        "What other music do you like in this genre?",
        "The lyrics in this song really speak to me. Do you have a favorite line?",
        "Do you play any instruments? Music has always been a big part of my life.",
        "Music really connects people, doesn't it? It's like a universal language.",
        "I'd love to exchange playlists sometime! Always looking for new music.",
        "Have you ever seen this artist perform live? I'm hoping to catch their next tour.",
        "This reminds me of some older tracks I used to listen to. Music can be so nostalgic."
      ];
      responseContent = responses[Math.floor(Math.random() * responses.length)];
    }
    
    const matchResponse: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentMatch.id,
      content: responseContent,
      timestamp: new Date(),
    };
    
    setCurrentChat(chat => {
      if (!chat) return null;
      return {
        ...chat,
        messages: [...chat.messages, matchResponse]
      };
    });
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
