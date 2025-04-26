
import { useState, useEffect } from 'react';
import { User, Chat, Message, Song } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useMatchmaking = () => {
  const [currentMatch, setCurrentMatch] = useState<User | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [matchTimer, setMatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeListeners, setActiveListeners] = useState<Record<string, number>>({});

  const findMatch = (song: Song) => {
    console.log("Finding match for song:", song.title);
    const listeners = activeListeners[song.id] || 0;
    console.log("Active listeners for this song:", listeners);
    
    // More realistic matching logic - higher chance when there are more listeners
    if (listeners > 0 || Math.random() > 0.5) {
      simulateMatch(song);
    } else {
      console.log("No match found at this time");
      toast({
        title: "Looking for matches",
        description: "We'll notify you when someone else starts listening to this song",
      });
    }
  };

  const simulateMatch = (song: Song) => {
    const names = ["Alex", "Taylor", "Jordan", "Morgan", "Riley", "Casey", "Avery", "Quinn", "Dakota", "Skyler"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    const mockMatchUser: User = {
      id: 'match-' + Date.now(),
      name: randomName,
      email: `${randomName.toLowerCase()}@example.com`,
    };
    
    setCurrentMatch(mockMatchUser);
    
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      matchId: `match-${Date.now()}`,
      users: ['current-user', mockMatchUser.id],
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'bot',
          content: `You and ${mockMatchUser.name} are both enjoying "${song.title}"! Why not say hello?`,
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

  const sendMessage = (content: string) => {
    if (!currentChat) return;
    
    console.log("Sending message:", content);
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      content,
      timestamp: new Date(),
    };
    
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };
    
    setCurrentChat(updatedChat);
    
    setTimeout(() => {
      simulateResponse(content);
    }, 1000 + Math.random() * 1000);
  };

  const simulateResponse = (userMessage: string) => {
    if (!currentChat || !currentMatch) return;
    
    const responses = [
      "I love this song too! What's your favorite part?",
      "Have you heard their other tracks?",
      "This artist is amazing! Been following them for years.",
      "What other music do you like?",
      "This is such a great melody!",
      "The lyrics in this song are so meaningful.",
      "Do you play any instruments?",
      "Music really connects people, doesn't it?",
      "What's your favorite genre?",
      "I'd love to exchange playlists sometime!"
    ];
    
    let responseContent = '';
    
    if (userMessage.toLowerCase().includes('recommend') || userMessage.toLowerCase().includes('suggestion')) {
      responseContent = "I've been listening to a lot of indie rock lately. Have you heard of Tame Impala?";
    } else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi') || userMessage.toLowerCase().includes('hey')) {
      responseContent = `Hi there! Nice to meet someone with similar music taste!`;
    } else if (userMessage.toLowerCase().includes('name') || userMessage.toLowerCase().includes('who are')) {
      responseContent = `I'm ${currentMatch.name}! I love discovering new music and connecting with people.`;
    } else if (userMessage.length < 10) {
      responseContent = "Tell me more about your music preferences! I'm always looking for new recommendations.";
    } else {
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
    sendMessage,
    toggleChat,
    matchTimer,
    setMatchTimer,
  };
};
