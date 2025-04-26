
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Song, User, Match, Chat, Message, MoodType } from '../types';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { mockSongs } from '../data/mockSongs';

interface MusicContextType {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  currentMatch: User | null;
  chatOpen: boolean;
  searchResults: Song[];
  currentChat: Chat | null;
  searchQuery: string;
  loadSong: (song: Song) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seekToPosition: (position: number) => void;
  searchSongs: (query: string) => void;
  sendMessage: (content: string) => void;
  toggleChat: () => void;
  getMoodRecommendations: (mood: MoodType) => Song[];
  getSongsByGenre: (genre: string) => Song[];
  getSongsByLanguage: (language: "hindi" | "english") => Song[];
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<User | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [matchTimer, setMatchTimer] = useState<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    
    // Set up audio element event listeners
    audioRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
    audioRef.current.addEventListener('ended', handleSongEnd);
    audioRef.current.addEventListener('error', handleAudioError);
    
    // Cleanup event listeners on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
        audioRef.current.removeEventListener('ended', handleSongEnd);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
      
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      
      if (matchTimer) {
        clearTimeout(matchTimer);
      }
    };
  }, []);

  // Handle audio metadata loaded
  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle song ending
  const handleSongEnd = () => {
    setIsPlaying(false);
    setProgress(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  // Handle audio errors
  const handleAudioError = (e: Event) => {
    console.error('Audio playback error:', e);
    toast({
      title: "Playback Error",
      description: "There was an error playing this song. Please try another.",
      variant: "destructive",
    });
    setIsPlaying(false);
  };

  // Update progress while song is playing
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      
      progressTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      }, 1000);
    } else if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying]);

  // Load a song into the player
  const loadSong = (song: Song) => {
    if (!audioRef.current) return;
    
    // Reset state
    setIsPlaying(false);
    setProgress(0);
    
    // Load new song
    setCurrentSong(song);
    audioRef.current.src = song.audioUrl;
    audioRef.current.load();
    
    // Auto-play after loading
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      
      // Start match timer - simulate finding a match after listening for 10-15 seconds
      if (matchTimer) clearTimeout(matchTimer);
      
      setMatchTimer(setTimeout(() => {
        findMatch(song);
      }, 10000)); // 10 seconds for demo purposes
    }).catch(error => {
      console.error('Playback failed:', error);
    });
  };

  // Find a match for the current song
  const findMatch = (song: Song) => {
    // In a real app, this would be a backend call to find other users listening to the same song
    // For demo, we'll create a mock match
    const mockMatchUser: User = {
      id: 'match-1',
      name: 'Alex',
      email: 'alex@example.com',
    };
    
    setCurrentMatch(mockMatchUser);
    
    // Create a mock chat
    if (currentUser) {
      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        matchId: `match-${Date.now()}`,
        users: [currentUser.id, mockMatchUser.id],
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderId: 'bot',
            content: `You and ${mockMatchUser.name} are both enjoying "${song.title}" by ${song.artist}! Why not say hello?`,
            timestamp: new Date(),
            isBot: true,
          }
        ]
      };
      
      setCurrentChat(newChat);
      
      toast({
        title: "You found a music soulmate!",
        description: `${mockMatchUser.name} is also listening to ${song.title}`,
      });
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Set volume
  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
  };

  // Seek to position
  const seekToPosition = (position: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = position;
    setProgress(position);
  };

  // Search songs
  const searchSongs = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = songs.filter(song => 
      song.title.toLowerCase().includes(query.toLowerCase()) || 
      song.artist.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };

  // Send message in chat
  const sendMessage = (content: string) => {
    if (!currentUser || !currentChat) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content,
      timestamp: new Date(),
    };
    
    // Add message to chat
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };
    
    setCurrentChat(updatedChat);
    
    // Simulate bot response if user asks about music recommendations
    if (content.toLowerCase().includes('recommend') || content.toLowerCase().includes('suggestion')) {
      setTimeout(() => {
        const botMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: 'bot',
          content: "Based on your current song, I'd recommend 'Blinding Lights' by The Weeknd. Let me know if you'd like more suggestions!",
          timestamp: new Date(),
          isBot: true,
        };
        
        setCurrentChat(chat => {
          if (!chat) return null;
          return {
            ...chat,
            messages: [...chat.messages, botMessage]
          };
        });
      }, 1000);
    }
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  // Get mood-based recommendations
  const getMoodRecommendations = (mood: MoodType): Song[] => {
    // In a real app, this would use more sophisticated matching
    // For demo, we'll just return a filtered subset based on genre
    switch (mood) {
      case 'happy':
        return songs.filter(s => s.genre === 'Pop' || s.genre === 'Dance').slice(0, 5);
      case 'sad':
        return songs.filter(s => s.genre === 'Ballad' || s.genre === 'Acoustic').slice(0, 5);
      case 'energetic':
        return songs.filter(s => s.genre === 'Rock' || s.genre === 'EDM').slice(0, 5);
      case 'romantic':
        return songs.filter(s => s.genre === 'R&B' || s.genre === 'Acoustic').slice(0, 5);
      case 'relaxed':
        return songs.filter(s => s.genre === 'Lofi' || s.genre === 'Ambient').slice(0, 5);
      case 'party':
        return songs.filter(s => s.genre === 'Dance' || s.genre === 'Hip Hop').slice(0, 5);
      case 'focus':
        return songs.filter(s => s.genre === 'Ambient' || s.genre === 'Classical').slice(0, 5);
      default:
        return songs.slice(0, 5);
    }
  };

  // Get songs by genre
  const getSongsByGenre = (genre: string): Song[] => {
    return songs.filter(song => song.genre.toLowerCase() === genre.toLowerCase());
  };

  // Get songs by language
  const getSongsByLanguage = (language: "hindi" | "english"): Song[] => {
    return songs.filter(song => song.language === language);
  };

  const value = {
    songs,
    currentSong,
    isPlaying,
    volume,
    progress,
    duration,
    currentMatch,
    chatOpen,
    searchResults,
    currentChat,
    searchQuery,
    loadSong,
    togglePlay,
    setVolume,
    seekToPosition,
    searchSongs,
    sendMessage,
    toggleChat,
    getMoodRecommendations,
    getSongsByGenre,
    getSongsByLanguage,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
