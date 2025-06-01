
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, X, Send, Music } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const { currentUser } = useAuth();
  const { loadSong, songs, getMoodRecommendations } = useMusic();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [userListeningHistory, setUserListeningHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Fetch user's listening history when component mounts
  useEffect(() => {
    if (currentUser && open) {
      fetchUserListeningHistory();
    }
  }, [currentUser, open]);
  
  // Fetch user's listening history
  const fetchUserListeningHistory = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('active_listeners')
        .select(`
          song_id,
          started_at,
          songs:song_id (title, artist, genre, language)
        `)
        .eq('user_id', currentUser.id)
        .order('started_at', { ascending: false })
        .limit(10);
        
      if (!error && data) {
        setUserListeningHistory(data);
        console.log('User listening history:', data);
      }
    } catch (error) {
      console.error('Error fetching listening history:', error);
    }
  };
  
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
        ? `Hello ${currentUser.name}! I'm your music assistant. I can recommend songs based on your listening history, your mood, or help you discover new music. How can I help you today?`
        : "Hello! Welcome to DhunConnect. I'm your music assistant. Sign in to get personalized recommendations based on your listening history!";
      
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
  
  const getPersonalizedRecommendations = () => {
    if (!currentUser || userListeningHistory.length === 0) {
      return songs.slice(0, 3);
    }
    
    // Get user's favorite genres from history
    const genreCounts: Record<string, number> = {};
    userListeningHistory.forEach(item => {
      if (item.songs?.genre) {
        genreCounts[item.songs.genre] = (genreCounts[item.songs.genre] || 0) + 1;
      }
    });
    
    const favoriteGenre = Object.keys(genreCounts).reduce((a, b) => 
      genreCounts[a] > genreCounts[b] ? a : b, 'Pop'
    );
    
    // Find songs in user's favorite genre
    const recommendedSongs = songs.filter(song => 
      song.genre.toLowerCase().includes(favoriteGenre.toLowerCase())
    ).slice(0, 3);
    
    return recommendedSongs.length > 0 ? recommendedSongs : songs.slice(0, 3);
  };
  
  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for different message types
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `Hi there! How can I help you with your music journey today?`;
    }
    
    if (message.includes('recommend') || message.includes('suggestion')) {
      if (currentUser && userListeningHistory.length > 0) {
        const recommendations = getPersonalizedRecommendations();
        const recText = recommendations.map(song => `"${song.title}" by ${song.artist}`).join(', ');
        return `Based on your listening history, I recommend: ${recText}. Would you like me to play one of these?`;
      } else {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        return `I'd recommend "${randomSong.title}" by ${randomSong.artist}. Would you like me to play it for you?`;
      }
    }
    
    // Mood-based recommendations
    if (message.includes('happy') || message.includes('upbeat')) {
      const happySongs = getMoodRecommendations('happy').slice(0, 2);
      if (happySongs.length > 0) {
        const songText = happySongs.map(song => `"${song.title}" by ${song.artist}`).join(' or ');
        return `For a happy mood, try ${songText}! Want me to play one?`;
      }
    }
    
    if (message.includes('sad') || message.includes('down')) {
      const sadSongs = getMoodRecommendations('sad').slice(0, 2);
      if (sadSongs.length > 0) {
        const songText = sadSongs.map(song => `"${song.title}" by ${song.artist}`).join(' or ');
        return `For when you're feeling down, I suggest ${songText}. Music can be healing.`;
      }
    }
    
    if (message.includes('energetic') || message.includes('workout') || message.includes('exercise')) {
      const energeticSongs = getMoodRecommendations('energetic').slice(0, 2);
      if (energeticSongs.length > 0) {
        const songText = energeticSongs.map(song => `"${song.title}" by ${song.artist}`).join(' or ');
        return `For energy and workouts, try ${songText}! Perfect for getting pumped up.`;
      }
    }
    
    if (message.includes('romantic') || message.includes('love')) {
      const romanticSongs = getMoodRecommendations('romantic').slice(0, 2);
      if (romanticSongs.length > 0) {
        const songText = romanticSongs.map(song => `"${song.title}" by ${song.artist}`).join(' or ');
        return `For romantic moments, I recommend ${songText}. Perfect for setting the mood!`;
      }
    }
    
    if (message.includes('relax') || message.includes('chill') || message.includes('calm')) {
      const relaxedSongs = getMoodRecommendations('relaxed').slice(0, 2);
      if (relaxedSongs.length > 0) {
        const songText = relaxedSongs.map(song => `"${song.title}" by ${song.artist}`).join(' or ');
        return `To relax and unwind, try ${songText}. Great for chilling out!`;
      }
    }
    
    if (message.includes('party') || message.includes('dance')) {
      const partySongs = getMoodRecommendations('party').slice(0, 2);
      if (partySongs.length > 0) {
        const songText = partySongs.map(song => `"${song.title}" by ${song.artist}`).join(' or ');
        return `For party vibes, pump up ${songText}! Let's get this party started!`;
      }
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
      
      // Play a personalized recommendation
      const recommendations = getPersonalizedRecommendations();
      const randomSong = recommendations[Math.floor(Math.random() * recommendations.length)];
      loadSong(randomSong);
      return `I've put on "${randomSong.title}" by ${randomSong.artist} based on your taste. Hope you enjoy it!`;
    }
    
    if (message.includes('history') || message.includes('played') || message.includes('listened')) {
      if (currentUser && userListeningHistory.length > 0) {
        const recentSongs = userListeningHistory.slice(0, 3).map(item => 
          item.songs ? `"${item.songs.title}" by ${item.songs.artist}` : 'Unknown song'
        ).join(', ');
        return `Your recent listening history includes: ${recentSongs}. Would you like similar recommendations?`;
      } else {
        return `I don't see any listening history yet. Start playing some songs to get personalized recommendations!`;
      }
    }
    
    if (message.includes('how') && message.includes('work')) {
      return `DhunConnect helps you find music soulmates! When you listen to a song, we look for other users listening to the same track. When we find a match, we'll connect you so you can chat and share your love for music!`;
    }
    
    if (message.includes('thank')) {
      return `You're welcome! I'm here to help whenever you need music assistance.`;
    }
    
    // Default responses
    const defaultResponses = [
      "I'm here to help you discover music and connect with others who share your taste. Try asking me for mood-based recommendations!",
      "You can ask me to recommend songs based on your mood (happy, sad, energetic, romantic, relaxed, party) or your listening history.",
      "Music brings people together! Try listening to some songs and we'll match you with others who share your taste.",
      "Want personalized recommendations? Tell me your mood or ask about your listening history!",
      "I can suggest songs for any mood - just tell me how you're feeling or what you want to listen to!"
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
            aria-label="Open music assistant"
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
                placeholder="Ask for mood-based recommendations..."
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
