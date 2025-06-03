import React, { createContext, useState, useContext, useEffect } from 'react';
import { Song, User, Chat, Message, MoodType } from '../types';
import { fetchTracks, searchTracks, registerActiveListener, unregisterActiveListener } from '@/services/musicApi';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useMusicRecommendations } from '@/hooks/useMusicRecommendations';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  testMatchmaking: (song: Song) => void;
  addMockConnectedUsers: () => void;
  connectedUsers: User[];
  setChatOpen: (isOpen: boolean) => void;
  setCurrentChat: (chat: Chat | null) => void;
  registerConnectedUser: (user: User) => void;
  unregisterConnectedUser: (userId: string) => void;
  fetchMatchUserDetails: (userId: string, matchId: string, songId: string) => Promise<void>;
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
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [matchTimer, setMatchTimer] = useState<NodeJS.Timeout | null>(null);

  const {
    isPlaying,
    volume,
    progress,
    duration,
    currentSong,
    loadSong: loadAudioSong,
    togglePlay,
    setVolume,
    seekToPosition,
  } = useAudioPlayer();

  const {
    currentMatch,
    chatOpen,
    currentChat,
    activeListeners,
    setActiveListeners,
    findMatch,
    forceMatch,
    sendMessage,
    toggleChat,
    connectedUsers,
    fetchMatchUserDetails,
    registerConnectedUser,
    unregisterConnectedUser,
    addMockConnectedUsers
  } = useMatchmaking();

  const { getMoodRecommendations, getSongsByGenre, getSongsByLanguage } = useMusicRecommendations(songs);
  
  // Use the Supabase realtime hook with proper props - fixed function signature
  useSupabaseRealtime({
    setChatOpen: () => {
      if (!chatOpen) {
        toggleChat();
      }
    },
    fetchMatchUserDetails,
    registerConnectedUser: (user: User) => registerConnectedUser(user)
  });

  // Register the current authenticated user when they log in
  useEffect(() => {
    if (currentUser) {
      console.log('Current user logged in:', currentUser);
      
      // Set up a unique session ID for this browser tab
      const sessionId = localStorage.getItem('sessionId') || `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('sessionId', sessionId);
      console.log('Browser tab session ID:', sessionId);
    }
    
    // Clean up when user logs out or component unmounts
    return () => {
      if (currentUser) {
        // Update active listener status to inactive
        unregisterActiveListener(currentUser.id);
        console.log('Unregistered active listener for user:', currentUser.id);
      }
    };
  }, [currentUser]);

  // Fetch songs when component mounts
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoadingSongs(true);
        setLoadingError(null);
        console.log("Attempting to fetch tracks from Supabase...");
        const tracks = await fetchTracks(50);
        console.log(`Fetched ${tracks.length} tracks`);
        if (tracks.length > 0) {
          setSongs(tracks);
          // Preload first song's audio for faster playback later
          const audio = new Audio();
          audio.src = tracks[0].audioUrl;
          audio.preload = 'metadata';
          
          toast({
            title: "Songs Loaded",
            description: `${tracks.length} songs loaded successfully.`,
          });
        } else {
          setLoadingError("No songs found. Please try again later.");
          toast({
            title: "No Songs Found",
            description: "Failed to load songs. Using fallback tracks.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to load songs:", error);
        setLoadingError("Failed to load songs. Please check your connection and try again.");
        toast({
          title: "Error Loading Songs",
          description: "Using fallback tracks instead.",
          variant: "destructive",
        });
      } finally {
        setLoadingSongs(false);
      }
    };
    
    loadSongs();
  }, []);

  // Track user's active listening status
  const loadSong = (song: Song) => {
    loadAudioSong(song);
    
    // Update active listeners for this song
    if (currentUser) {
      console.log(`User ${currentUser.name} is now listening to ${song.title}`);
      registerActiveListener(currentUser.id, song.id);
      
      // Show toast to indicate active listening
      toast({
        title: "Now Listening",
        description: `You're now listening to ${song.title} by ${song.artist}`,
      });
    }
    
    // Update active listeners count for this song
    setActiveListeners(prev => {
      const updated = { ...prev };
      updated[song.id] = (updated[song.id] || 0) + 1;
      return updated;
    });
    
    // Start match timer
    if (matchTimer) clearTimeout(matchTimer);
    
    // Look for real matches after a short delay
    setMatchTimer(setTimeout(() => {
      if (currentUser) {
        console.log("Starting matchmaking process for song:", song.title);
        findMatch(song);
      }
    }, 3000));
  };

  const searchSongs = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    console.log("Searching for:", query);
    setSearchLoading(true);
    
    try {
      const results = await searchTracks(query);
      setSearchResults(results);
      console.log(`Found ${results.length} results for "${query}"`);
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: `No songs found for "${query}". Try a different search term.`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      toast({
        title: "Search Error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const testMatchmaking = (song: Song) => {
    if (!currentUser) {
      toast({
        title: "Not Logged In",
        description: "Please login to test matchmaking.",
        variant: "destructive",
      });
      return;
    }
    console.log("Testing real matchmaking for song:", song.title);
    findMatch(song);
  };

  const setChatOpen = (isOpen: boolean) => {
    if (isOpen && !chatOpen) {
      toggleChat();
    } else if (!isOpen && chatOpen) {
      toggleChat();
    }
  };

  const setCurrentChat = (chat: Chat | null) => {
    // This will be handled through the useMatchmaking hook
    console.log('Setting current chat:', chat);
  };

  const value: MusicContextType = {
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
    activeListeners,
    testMatchmaking,
    addMockConnectedUsers,
    connectedUsers,
    setChatOpen,
    setCurrentChat,
    registerConnectedUser,
    unregisterConnectedUser,
    fetchMatchUserDetails,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
