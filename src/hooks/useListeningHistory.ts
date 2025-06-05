import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Song } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ListeningHistoryEntry {
  songId: string;
  genre: string;
  timestamp: Date;
}

export const useListeningHistory = () => {
  const { currentUser } = useAuth();
  const [listeningHistory, setListeningHistory] = useState<ListeningHistoryEntry[]>([]);

  // Load listening history from localStorage on mount
  useEffect(() => {
    if (currentUser) {
      const storedHistory = localStorage.getItem(`listeningHistory_${currentUser.id}`);
      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory).map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
          setListeningHistory(parsed);
        } catch (error) {
          console.error('Error parsing listening history:', error);
        }
      }
    }
  }, [currentUser]);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (currentUser && listeningHistory.length > 0) {
      localStorage.setItem(`listeningHistory_${currentUser.id}`, JSON.stringify(listeningHistory));
    }
  }, [listeningHistory, currentUser]);

  const addToHistory = (song: Song) => {
    if (!currentUser) return;

    const newEntry: ListeningHistoryEntry = {
      songId: song.id,
      genre: song.genre,
      timestamp: new Date()
    };

    setListeningHistory(prev => {
      // Remove any existing entry for this song and add new one at the beginning
      const filtered = prev.filter(entry => entry.songId !== song.id);
      const updated = [newEntry, ...filtered];
      
      // Keep only last 50 entries to prevent localStorage from getting too large
      return updated.slice(0, 50);
    });
  };

  const getMostListenedGenre = (): string | null => {
    if (listeningHistory.length === 0) return null;

    // Count genres
    const genreCounts = listeningHistory.reduce((acc, entry) => {
      acc[entry.genre] = (acc[entry.genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find most frequent genre
    const mostFrequentGenre = Object.entries(genreCounts).reduce((a, b) => 
      genreCounts[a[0]] > genreCounts[b[0]] ? a : b
    )[0];

    return mostFrequentGenre;
  };

  const getRecommendedSongs = async (count: number = 5): Promise<Song[]> => {
    const favoriteGenre = getMostListenedGenre();
    
    if (!favoriteGenre) {
      // If no history, return random songs
      console.log('No listening history found, returning random songs');
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .limit(count);
      
      if (error) {
        console.error('Error fetching random songs:', error);
        return [];
      }
      
      return data?.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        albumArt: song.album_art || 'https://via.placeholder.com/300',
        audioUrl: song.audio_url,
        duration: song.duration,
        genre: song.genre || 'Unknown',
        language: song.language as 'hindi' | 'english'
      })) || [];
    }

    console.log(`Recommending songs from favorite genre: ${favoriteGenre}`);
    
    // Get songs from the user's most listened genre, excluding already listened songs
    const listenedSongIds = listeningHistory.map(entry => entry.songId);
    
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .ilike('genre', `%${favoriteGenre}%`)
      .not('id', 'in', `(${listenedSongIds.join(',')})`)
      .limit(count * 2); // Get more to allow for randomization
    
    if (error) {
      console.error('Error fetching recommended songs:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      // Fallback: get songs from the genre including already listened ones
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('songs')
        .select('*')
        .ilike('genre', `%${favoriteGenre}%`)
        .limit(count);
      
      if (fallbackError) {
        console.error('Error fetching fallback songs:', error);
        return [];
      }
      
      const songs = fallbackData?.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        albumArt: song.album_art || 'https://via.placeholder.com/300',
        audioUrl: song.audio_url,
        duration: song.duration,
        genre: song.genre || 'Unknown',
        language: song.language as 'hindi' | 'english'
      })) || [];
      
      // Shuffle and return requested count
      return songs.sort(() => 0.5 - Math.random()).slice(0, count);
    }
    
    const songs = data.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      albumArt: song.album_art || 'https://via.placeholder.com/300',
      audioUrl: song.audio_url,
      duration: song.duration,
      genre: song.genre || 'Unknown',
      language: song.language as 'hindi' | 'english'
    }));
    
    // Shuffle and return requested count
    return songs.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  return {
    listeningHistory,
    addToHistory,
    getMostListenedGenre,
    getRecommendedSongs
  };
};
