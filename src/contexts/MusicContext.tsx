
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Song, User, Chat, Message, MoodType } from '../types';
import { fetchTracks, searchTracks } from '@/services/musicApi';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useMusicRecommendations } from '@/hooks/useMusicRecommendations';
import { toast } from '@/hooks/use-toast';

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
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

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
    sendMessage,
    toggleChat,
    matchTimer,
    setMatchTimer,
  } = useMatchmaking();

  const { getMoodRecommendations, getSongsByGenre, getSongsByLanguage } = useMusicRecommendations(songs);

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
          // Preload first song's audio for faster playback later
          const audio = new Audio();
          audio.src = tracks[0].audioUrl;
          audio.preload = 'metadata';
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

  // Simulate active listeners
  useEffect(() => {
    const initialListeners: Record<string, number> = {};
    songs.forEach(song => {
      if (Math.random() > 0.7) {
        initialListeners[song.id] = Math.floor(Math.random() * 5);
      }
    });
    setActiveListeners(initialListeners);
    
    const interval = setInterval(() => {
      setActiveListeners(prev => {
        const updated = { ...prev };
        songs.forEach(song => {
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
    }, 10000);
    
    return () => clearInterval(interval);
  }, [songs]);

  const loadSong = (song: Song) => {
    loadAudioSong(song);
    
    // Update active listeners for this song
    setActiveListeners(prev => {
      const updated = { ...prev };
      updated[song.id] = (updated[song.id] || 0) + 1;
      return updated;
    });
    
    // Start match timer
    if (matchTimer) clearTimeout(matchTimer);
    
    const matchDelay = 5000 + Math.random() * 5000;
    setMatchTimer(setTimeout(() => {
      findMatch(song);
    }, matchDelay));
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
