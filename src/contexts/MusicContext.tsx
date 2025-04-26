
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Song, User, Match, Chat, Message, MoodType } from '../types';
import { toast } from '@/hooks/use-toast';
import { fetchTracks, searchTracks } from '@/services/musicApi';

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
  loadingSongs: boolean;
  loadingError: string | null;
  activeListeners: Record<string, number>;
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
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
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
  // Track how many users are listening to each song (for matching)
  const [activeListeners, setActiveListeners] = useState<Record<string, number>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch songs when component mounts
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoadingSongs(true);
        setLoadingError(null);
        console.log("Attempting to fetch tracks...");
        const tracks = await fetchTracks(50);
        console.log(`Fetched ${tracks.length} tracks`);
        if (tracks.length > 0) {
          setSongs(tracks);
        } else {
          setLoadingError("No songs found. Please try again later.");
        }
      } catch (error) {
        console.error("Failed to load songs:", error);
        setLoadingError("Failed to load songs. Please check your connection and try again.");
      } finally {
        setLoadingSongs(false);
      }
    };
    
    loadSongs();
  }, []);

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
      console.log("Audio metadata loaded, duration:", audioRef.current.duration);
      setDuration(audioRef.current.duration || 0);
    }
  };

  // Handle song ending
  const handleSongEnd = () => {
    console.log("Song ended");
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

  // Simulate active listeners for the matching logic
  useEffect(() => {
    // Initialize with random listeners for some songs
    const initialListeners: Record<string, number> = {};
    songs.forEach(song => {
      if (Math.random() > 0.7) { // Only some songs have active listeners
        initialListeners[song.id] = Math.floor(Math.random() * 5);
      }
    });
    setActiveListeners(initialListeners);
    
    // Update active listeners periodically to simulate real users
    const interval = setInterval(() => {
      setActiveListeners(prev => {
        const updated = { ...prev };
        songs.forEach(song => {
          // Random chance to add or remove listeners
          if (Math.random() > 0.8) {
            if (updated[song.id]) {
              updated[song.id] = Math.max(0, updated[song.id] + (Math.random() > 0.5 ? 1 : -1));
              if (updated[song.id] === 0) delete updated[song.id];
            } else if (Math.random() > 0.7) {
              updated[song.id] = 1;
            }
          }
        });
        return updated;
      });
    }, 10000); // Update every 10 seconds (more frequent for better demo)
    
    return () => clearInterval(interval);
  }, [songs]);

  // Load a song into the player
  const loadSong = (song: Song) => {
    if (!audioRef.current) return;
    
    console.log("Loading song:", song.title, "by", song.artist);
    console.log("Audio URL:", song.audioUrl);
    
    // Reset state
    setIsPlaying(false);
    setProgress(0);
    
    // Load new song
    setCurrentSong(song);
    audioRef.current.src = song.audioUrl;
    audioRef.current.load();
    audioRef.current.volume = volume;
    
    // Auto-play after loading
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("Song playing successfully");
        setIsPlaying(true);
        
        // Update active listeners for this song
        setActiveListeners(prev => {
          const updated = { ...prev };
          updated[song.id] = (updated[song.id] || 0) + 1;
          return updated;
        });
        
        // Start match timer
        if (matchTimer) clearTimeout(matchTimer);
        
        const matchDelay = 5000 + Math.random() * 5000; // Between 5-10 seconds (faster for demo)
        
        setMatchTimer(setTimeout(() => {
          findMatch(song);
        }, matchDelay));
        
        toast({
          title: "Now Playing",
          description: `${song.title} by ${song.artist}`,
        });
      }).catch(error => {
        console.error('Playback failed:', error);
        toast({
          title: "Playback Error",
          description: "There was an error playing this song. Please try another.",
          variant: "destructive",
        });
      });
    }
  };

  // Find a match for the current song
  const findMatch = (song: Song) => {
    console.log("Finding match for song:", song.title);
    
    // Check if anyone else is listening to this song (our simulation)
    const listeners = activeListeners[song.id] || 0;
    console.log("Active listeners for this song:", listeners);
    
    // Higher chance of match when more listeners (80% chance with other listeners)
    if (listeners > 1 || Math.random() > 0.2) {
      simulateMatch(song);
    } else {
      console.log("No match found at this time");
    }
  };
  
  // Simulate finding a match
  const simulateMatch = (song: Song) => {
    const names = ["Alex", "Taylor", "Jordan", "Morgan", "Riley", "Casey", "Avery", "Quinn", "Dakota", "Skyler"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    console.log(`Found match: ${randomName} is also listening to "${song.title}"`);
    
    const mockMatchUser: User = {
      id: 'match-' + Date.now(),
      name: randomName,
      email: `${randomName.toLowerCase()}@example.com`,
    };
    
    setCurrentMatch(mockMatchUser);
    
    // Create a mock chat
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      matchId: `match-${Date.now()}`,
      users: ['current-user', mockMatchUser.id],
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
    setChatOpen(true);
    
    toast({
      title: "You found a music soulmate!",
      description: `${mockMatchUser.name} is also listening to ${song.title}`,
    });
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      console.log("Pausing playback");
      audioRef.current.pause();
    } else {
      console.log("Resuming playback");
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        toast({
          title: "Playback Error",
          description: "Could not play this song. Please try another.",
          variant: "destructive",
        });
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  // Set volume
  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;
    
    console.log("Setting volume to:", newVolume);
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
  };

  // Seek to position
  const seekToPosition = (position: number) => {
    if (!audioRef.current) return;
    
    console.log("Seeking to position:", position);
    audioRef.current.currentTime = position;
    setProgress(position);
  };

  // Search songs
  const searchSongs = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    console.log("Searching for:", query);
    
    try {
      const results = await searchTracks(query);
      setSearchResults(results);
      console.log(`Found ${results.length} results for "${query}"`);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send message in chat
  const sendMessage = (content: string) => {
    if (!currentChat) return;
    
    console.log("Sending message:", content);
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      content,
      timestamp: new Date(),
    };
    
    // Add message to chat
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };
    
    setCurrentChat(updatedChat);
    
    // Simulate response after a delay
    setTimeout(() => {
      simulateResponse(content);
    }, 1000 + Math.random() * 1000);
  };

  // Simulate match response
  const simulateResponse = (userMessage: string) => {
    if (!currentChat || !currentMatch) return;
    
    // Common responses
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
    
    // Check for keywords in user message
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
      // Random response
      responseContent = responses[Math.floor(Math.random() * responses.length)];
    }
    
    console.log("Match response:", responseContent);
    
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

  // Toggle chat open/closed
  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  // Get mood-based recommendations
  const getMoodRecommendations = (mood: MoodType): Song[] => {
    if (songs.length === 0) return [];
    
    console.log(`Getting recommendations for mood: ${mood}`);
    
    // Map moods to genre filters
    const moodGenreMap: Record<MoodType, string[]> = {
      'happy': ['Pop', 'Dance', 'Electro', 'Funk'],
      'sad': ['Acoustic', 'Ambience', 'Jazz', 'Classical'],
      'energetic': ['Rock', 'Electronic', 'Metal', 'Punk'],
      'romantic': ['R&B', 'Acoustic', 'Soul', 'Jazz'],
      'relaxed': ['Lofi', 'Ambient', 'Chillout', 'Jazz'],
      'party': ['Dance', 'Hip Hop', 'Electro', 'House'],
      'focus': ['Ambient', 'Classical', 'Chillout', 'Lofi']
    };
    
    const relevantGenres = moodGenreMap[mood] || [];
    
    // Filter songs by genres that match the mood
    let filteredSongs = songs.filter(song => {
      const songGenre = song.genre.toLowerCase();
      return relevantGenres.some(genre => songGenre.includes(genre.toLowerCase()));
    });
    
    // If we don't have enough songs, add some random ones
    if (filteredSongs.length < 5) {
      const remainingSongs = songs.filter(
        song => !filteredSongs.find(s => s.id === song.id)
      );
      const randomSongs = remainingSongs
        .sort(() => 0.5 - Math.random())
        .slice(0, 5 - filteredSongs.length);
      
      filteredSongs = [...filteredSongs, ...randomSongs];
    }
    
    return filteredSongs.slice(0, 10);
  };

  // Get songs by genre
  const getSongsByGenre = (genre: string): Song[] => {
    return songs.filter(song => 
      song.genre.toLowerCase().includes(genre.toLowerCase())
    );
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
    loadingSongs,
    loadingError,
    activeListeners
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
