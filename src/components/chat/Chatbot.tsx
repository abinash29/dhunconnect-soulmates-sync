
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, X, Send, Music, Heart, Frown, Smile, Zap, PartyPopper, Play, Disc3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  type?: 'text' | 'mood-buttons' | 'song-suggestions';
  data?: any;
}

interface MoodSong {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  album_art: string;
}

const moodConfig = [
  { name: 'happy', icon: Smile, color: 'bg-yellow-500', label: '😊 Happy' },
  { name: 'sad', icon: Frown, color: 'bg-blue-500', label: '😢 Sad' },
  { name: 'relaxed', icon: Heart, color: 'bg-green-500', label: '😌 Relaxed' },
  { name: 'energetic', icon: Zap, color: 'bg-orange-500', label: '⚡ Energetic' },
  { name: 'party', icon: PartyPopper, color: 'bg-purple-500', label: '🎉 Party' },
  { name: 'dance', icon: Disc3, color: 'bg-pink-500', label: '💃 Dance' },
  { name: '90s', icon: Music, color: 'bg-indigo-500', label: '🎵 90s' }
];

const Chatbot: React.FC = () => {
  const { currentUser } = useAuth();
  const { loadSong, songs } = useMusic();
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
        ? `Hello ${currentUser.name}! 🎵 I'm your music assistant. How are you feeling today? I can recommend songs based on your mood: Happy, Sad, Relaxed, Energetic, Party, Dance, or 90s vibes!`
        : "Hello! Welcome to DhunConnect. 🎵 I'm your music assistant. Sign in to get personalized recommendations based on your mood!";
      
      setTimeout(() => {
        addMessage('bot', greeting);
        
        // Add mood button after greeting
        setTimeout(() => {
          addMessage('bot', "Click on 'My Mood' to explore music based on how you're feeling! 🎭", 'mood-buttons');
        }, 1000);
        
        setHasGreeted(true);
      }, 600);
    }
  }, [open, currentUser, hasGreeted]);
  
  const addMessage = (sender: 'bot' | 'user', content: string, type: 'text' | 'mood-buttons' | 'song-suggestions' = 'text', data?: any) => {
    setMessages(prev => [
      ...prev, 
      {
        id: Date.now().toString(),
        content,
        sender,
        timestamp: new Date(),
        type,
        data
      }
    ]);
  };
  
  const fetchSongsByMood = async (mood: string): Promise<MoodSong[]> => {
    try {
      console.log(`Fetching songs for mood: ${mood}`);
      
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist, audio_url, album_art')
        .contains('mood', [mood]);
        
      if (error) {
        console.error('Error fetching songs by mood:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} songs for mood: ${mood}`, data);
      
      // Shuffle and return 2 random songs
      const shuffled = data?.sort(() => 0.5 - Math.random()) || [];
      return shuffled.slice(0, 2);
    } catch (error) {
      console.error('Error fetching songs by mood:', error);
      return [];
    }
  };
  
  const handleMoodClick = async (mood: string) => {
    const moodLabel = moodConfig.find(m => m.name === mood)?.label || mood;
    addMessage('user', `I'm feeling ${moodLabel}`);
    
    setTimeout(async () => {
      const songResults = await fetchSongsByMood(mood);
      
      if (songResults.length > 0) {
        addMessage('bot', `Perfect! Here are ${songResults.length} ${moodLabel} songs just for you:`, 'song-suggestions', { songs: songResults, mood });
      } else {
        addMessage('bot', `I don't have any ${moodLabel} songs right now. Try another mood or explore our music library!`);
      }
    }, 1000);
  };
  
  const handleSongPlay = (song: MoodSong) => {
    const songToPlay = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      audioUrl: song.audio_url,
      albumArt: song.album_art || 'https://via.placeholder.com/300',
      duration: 180, // Default duration
      genre: 'Unknown',
      language: 'english' as const
    };
    
    loadSong(songToPlay);
    addMessage('bot', `🎵 Now playing "${song.title}" by ${song.artist}. Enjoy the music!`);
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
      return `Hi there! 🎵 How can I help you with your music journey today? Try clicking "My Mood" to get personalized song recommendations!`;
    }
    
    if (message.includes('mood') || message.includes('feeling')) {
      setTimeout(() => {
        addMessage('bot', 'Choose your current mood:', 'mood-buttons');
      }, 500);
      return `Great! Let me help you find the perfect music for your mood. 🎭`;
    }
    
    if (message.includes('recommend') || message.includes('suggestion')) {
      if (currentUser && userListeningHistory.length > 0) {
        const recText = userListeningHistory.slice(0, 3).map(item => 
          item.songs ? `"${item.songs.title}" by ${item.songs.artist}` : 'Unknown song'
        ).join(', ');
        return `Based on your listening history: ${recText}. Would you like me to play one of these or find similar songs?`;
      } else {
        return `I'd love to recommend some music! Click "My Mood" to get songs that match how you're feeling right now!`;
      }
    }
    
    if (message.includes('thank')) {
      return `You're welcome! 🎵 I'm here to help whenever you need music assistance. Try exploring different moods for amazing song discoveries!`;
    }
    
    // Default responses
    const defaultResponses = [
      "I'm here to help you discover music based on your mood! Try clicking 'My Mood' for personalized recommendations! 🎵",
      "Want to find the perfect song for your current mood? Click 'My Mood' and let's get started! 🎭",
      "Music brings people together! Click 'My Mood' to find songs that match how you're feeling today. 🎶",
      "Ready for some mood-based music? Click 'My Mood' and choose from Happy, Sad, Relaxed, Energetic, Party, Dance, or 90s vibes! 😊",
      "Let's find your perfect soundtrack! Click 'My Mood' and I'll suggest songs that match your current vibe! 🎵"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const renderMessage = (msg: Message) => {
    if (msg.type === 'mood-buttons') {
      return (
        <div className="space-y-3">
          <p className="text-sm">{msg.content}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setTimeout(() => {
                  addMessage('bot', 'Choose your mood from these options:', 'text');
                  setTimeout(() => {
                    addMessage('bot', 'Select how you\'re feeling right now:', 'text');
                    // Show all mood buttons
                    setTimeout(() => {
                      const moodButtons = (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {moodConfig.map((mood) => {
                            const IconComponent = mood.icon;
                            return (
                              <Button
                                key={mood.name}
                                variant="outline"
                                size="sm"
                                className={`${mood.color} text-white hover:opacity-80 text-xs p-2`}
                                onClick={() => handleMoodClick(mood.name)}
                              >
                                <IconComponent size={14} className="mr-1" />
                                {mood.label}
                              </Button>
                            );
                          })}
                        </div>
                      );
                      
                      setMessages(prev => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          content: '',
                          sender: 'bot',
                          timestamp: new Date(),
                          type: 'text',
                          data: { customRender: moodButtons }
                        }
                      ]);
                    }, 500);
                  }, 500);
                }, 500);
              }}
              className="bg-dhun-purple hover:bg-dhun-purple/90 text-white"
              size="sm"
            >
              <Music size={16} className="mr-2" />
              My Mood 🎭
            </Button>
          </div>
        </div>
      );
    }
    
    if (msg.type === 'song-suggestions' && msg.data?.songs) {
      return (
        <div className="space-y-3">
          <p className="text-sm">{msg.content}</p>
          <div className="space-y-2">
            {msg.data.songs.map((song: MoodSong, index: number) => (
              <div key={song.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img 
                  src={song.album_art || 'https://via.placeholder.com/40'} 
                  alt={song.title}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSongPlay(song)}
                  className="bg-dhun-purple hover:bg-dhun-purple/90 text-white px-3"
                >
                  <Play size={14} className="mr-1" />
                  Play
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Check for custom render data
    if (msg.data?.customRender) {
      return (
        <div>
          {msg.content && <p className="text-sm mb-2">{msg.content}</p>}
          {msg.data.customRender}
        </div>
      );
    }
    
    return <p className="text-sm">{msg.content}</p>;
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
                    "flex w-max max-w-[85%] rounded-lg p-3",
                    msg.sender === 'user' 
                      ? "bg-dhun-light-purple ml-auto" 
                      : "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  {msg.sender === 'bot' && (
                    <Bot size={16} className="mr-2 mt-0.5 shrink-0" />
                  )}
                  <div className="w-full">
                    {renderMessage(msg)}
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
