
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, X, Send, Music } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const { currentUser } = useAuth();
  const { loadSong, songs } = useMusic();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Send welcome message when first opened
  useEffect(() => {
    if (open && !hasGreeted) {
      const greeting = currentUser 
        ? `Hello ${currentUser.name}! Welcome to DhunConnect. I'm your music assistant. I can help you find songs, recommend music based on your mood, or answer questions about the app. How can I help you today?`
        : "Hello! Welcome to DhunConnect. I'm your music assistant. I can help you find songs, recommend music based on your mood, or answer questions about the app. Sign in to unlock all features!";
      
      setTimeout(() => {
        addMessage('bot', greeting);
        setHasGreeted(true);
      }, 600);
    }
  }, [open, currentUser, hasGreeted]);
  
  const addMessage = (sender: 'bot' | 'user', content: string) => {
    setMessages(prev => [
      ...prev, 
      {
        id: Date.now().toString(),
        content,
        sender,
        timestamp: new Date()
      }
    ]);
  };
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addMessage('user', inputValue);
    setInputValue('');
    
    // Process user message and generate response
    setTimeout(() => {
      const response = generateResponse(inputValue.trim());
      addMessage('bot', response);
    }, 600);
  };
  
  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for different message types
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `Hi there! How can I help you with your music journey today?`;
    }
    
    if (message.includes('recommend') || message.includes('suggestion')) {
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      return `I'd recommend "${randomSong.title}" by ${randomSong.artist}. Would you like me to play it for you?`;
    }
    
    if ((message.includes('play') || message.includes('listen')) && songs.length > 0) {
      // Extract potential song name
      let potentialSongTitle = message.replace('play', '').replace('listen to', '').trim();
      if (potentialSongTitle.length > 3) {
        // Try to find a matching song
        const matchingSongs = songs.filter(s => 
          s.title.toLowerCase().includes(potentialSongTitle) || 
          s.artist.toLowerCase().includes(potentialSongTitle)
        );
        
        if (matchingSongs.length > 0) {
          const song = matchingSongs[0];
          loadSong(song);
          return `Now playing "${song.title}" by ${song.artist}. Enjoy!`;
        }
      }
      
      // Play random if no match
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      loadSong(randomSong);
      return `I've put on "${randomSong.title}" by ${randomSong.artist} for you. Hope you enjoy it!`;
    }
    
    if (message.includes('sad') || message.includes('happy') || message.includes('energetic') || 
        message.includes('romantic') || message.includes('relax') || message.includes('party')) {
      return `Music can really help with your mood! Try checking out our mood recommendations section below. I've found that music is a great way to enhance or change your emotional state.`;
    }
    
    if (message.includes('how') && message.includes('work')) {
      return `DhunConnect helps you find music soulmates! When you listen to a song, we look for other users listening to the same track. When we find a match, we'll connect you so you can chat and share your love for music!`;
    }
    
    if (message.includes('thank')) {
      return `You're welcome! I'm here to help whenever you need music assistance.`;
    }
    
    // Default responses
    const defaultResponses = [
      "I'm here to help you discover music and connect with others who share your taste. What would you like to know?",
      "You can ask me to recommend songs, explain how the app works, or help find music for your current mood.",
      "Music brings people together! Try listening to some songs and we'll match you with others who share your taste.",
      "Need music for a specific mood? You can explore our mood-based recommendations in the main section.",
      "Remember, the more music you listen to, the better your chances of finding a music soulmate!"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="fixed bottom-24 right-4 z-40">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            className="h-12 w-12 rounded-full bg-dhun-purple text-white shadow-lg hover:bg-dhun-purple/90"
            aria-label="Open chatbot"
          >
            <Bot size={24} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 sm:w-96 p-0 mr-4 mb-2 border border-dhun-light-purple shadow-lg"
          align="end"
        >
          <div className="bg-dhun-purple text-white p-3 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center">
              <Bot size={20} className="mr-2" />
              <span className="font-medium">Music Assistant</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-white hover:bg-dhun-purple/80 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>
          <ScrollArea className="h-80 p-4 bg-white dark:bg-dhun-dark">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex w-max max-w-[80%] rounded-lg p-3",
                    msg.sender === 'user' 
                      ? "bg-dhun-light-purple ml-auto" 
                      : "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  {msg.sender === 'bot' && (
                    <Bot size={16} className="mr-2 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] opacity-70 text-right mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon"
                className="bg-dhun-purple hover:bg-dhun-purple/90"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Chatbot;
