import axios from 'axios';
import { Song } from '@/types';

// Base URL for our Supabase Edge Function (will be created later)
const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jiosaavn-api`
  : '/api/jiosaavn-api'; // fallback for local dev

// Existing fallback tracks for reliability
const fallbackTracks: Song[] = [
  {
    id: "fallback-1",
    title: "Summer Vibes",
    artist: "DJ Sunshine",
    albumArt: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 180,
    genre: "Pop",
    language: "english" as const
  },
  {
    id: "fallback-2",
    title: "Midnight Dreams",
    artist: "Luna Echo",
    albumArt: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 210,
    genre: "Ambient",
    language: "english" as const
  },
  {
    id: "fallback-3",
    title: "Urban Groove",
    artist: "Beat Master",
    albumArt: "https://images.unsplash.com/photo-1509781827353-fb95c262f5a0?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 195,
    genre: "Hip Hop",
    language: "english" as const
  },
  {
    id: "fallback-4",
    title: "Dil Ka Safar",
    artist: "Raj Kumar",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 225,
    genre: "Bollywood",
    language: "hindi" as const
  },
  {
    id: "fallback-5",
    title: "Pyaar Ka Izhaar",
    artist: "Meera Sharma",
    albumArt: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: 240,
    genre: "Bollywood",
    language: "hindi" as const
  },
  {
    id: "fallback-6",
    title: "Chill Afternoon",
    artist: "Relaxation Masters",
    albumArt: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    duration: 230,
    genre: "Lofi",
    language: "english" as const
  },
  {
    id: "fallback-7",
    title: "Dance Tonight",
    artist: "Party People",
    albumArt: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    duration: 185,
    genre: "Dance",
    language: "english" as const
  },
  {
    id: "fallback-8",
    title: "Tumse Milke",
    artist: "Neha Kapoor",
    albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: 255,
    genre: "Bollywood",
    language: "hindi" as const
  }
];

// New function to convert JioSaavn track format to our app's Song format
const convertJioSaavnTrackToSong = (track: any): Song => {
  return {
    id: track.id || `saavn-${Math.random().toString(36).substring(7)}`,
    title: track.name || track.title || 'Unknown Title',
    artist: track.primaryArtists || track.artist || 'Unknown Artist',
    albumArt: track.image?.[2]?.link || track.image || 'https://via.placeholder.com/150',
    audioUrl: track.downloadUrl?.[2]?.link || track.downloadUrl || track.url || track.media_url,
    duration: track.duration || 0,
    genre: track.language || 'Unknown',
    language: track.language?.toLowerCase() === 'hindi' ? 'hindi' : 'english' as const
  };
};

export const fetchTracks = async (limit = 20): Promise<Song[]> => {
  try {
    console.log("Attempting to fetch tracks from JioSaavn API...");
    
    try {
      // Call our Supabase Edge Function to get trending songs
      const response = await axios.get(`${EDGE_FUNCTION_URL}/trending`);
      
      if (response.data && response.data.songs) {
        // Map JioSaavn response to our Song format
        const tracks = response.data.songs.map(convertJioSaavnTrackToSong);
        console.log(`Fetched ${tracks.length} tracks from JioSaavn API`);
        return tracks;
      }
    } catch (apiError) {
      console.error('Error fetching from JioSaavn API:', apiError);
      console.log('Falling back to reliable tracks');
    }
    
    // Return fallback tracks if API fails
    return fallbackTracks;
  } catch (error) {
    console.error('Error in fetchTracks:', error);
    return fallbackTracks;
  }
};

export const searchTracks = async (query: string, limit = 10): Promise<Song[]> => {
  if (!query.trim()) return [];
  
  try {
    console.log(`Searching JioSaavn for: "${query}"`);
    
    try {
      // Call our Supabase Edge Function to search for songs
      const response = await axios.get(`${EDGE_FUNCTION_URL}/search`, {
        params: { query }
      });
      
      if (response.data && response.data.songs) {
        // Map JioSaavn response to our Song format
        const tracks = response.data.songs.map(convertJioSaavnTrackToSong);
        console.log(`Found ${tracks.length} tracks for query "${query}" from JioSaavn API`);
        return tracks;
      }
    } catch (apiError) {
      console.error('Error searching JioSaavn API:', apiError);
      console.log('Falling back to local search');
    }
    
    // Fallback to filtering local tracks if API fails
    const filteredFallbacks = fallbackTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) || 
      track.artist.toLowerCase().includes(query.toLowerCase()) ||
      track.genre.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredFallbacks;
  } catch (error) {
    console.error('Error in searchTracks:', error);
    // Filter fallback tracks based on the query
    const filteredFallbacks = fallbackTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) || 
      track.artist.toLowerCase().includes(query.toLowerCase())
    );
    return filteredFallbacks;
  }
};
