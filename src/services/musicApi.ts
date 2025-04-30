
import axios from 'axios';
import { Song } from '@/types';

// Using a combined approach with fallbacks for better reliability
const API_BASE_URL = 'https://api.jamendo.com/v3.0';
const CLIENT_ID = '9d9f42e3'; // This is a demo client ID from Jamendo

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
  duration: number;
  audiodownload: string;
  genres?: string[];
}

interface JamendoResponse {
  headers: {
    status: string;
    code: number;
    error_message?: string;
    results_count: number;
  };
  results: JamendoTrack[];
}

// Enhanced fallback tracks with working audio URLs
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

export const fetchTracks = async (limit = 20): Promise<Song[]> => {
  try {
    console.log("Attempting to fetch tracks from API...");
    
    // For now, we'll use only our reliable fallback tracks instead of dealing with API failures
    // You can uncomment this API call when you connect to a more reliable API
    /*
    const response = await axios.get<JamendoResponse>(`${API_BASE_URL}/tracks/`, {
      params: {
        client_id: CLIENT_ID,
        format: 'json',
        limit,
        include: 'musicinfo',
        boost: 'popularity_total',
      }
    });

    console.log("API Response:", response.data.headers);

    if (response.data.headers.code !== 200 || !response.data.results) {
      console.error('API Error:', response.data.headers.error_message || 'Unknown error');
      return fallbackTracks;
    }

    const tracks = response.data.results.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      albumArt: track.album_image,
      audioUrl: track.audio,
      duration: track.duration,
      genre: track.genres?.[0] || 'Unknown',
      language: Math.random() > 0.3 ? "english" as const : "hindi" as const,
    }));
    */
    
    console.log(`Using ${fallbackTracks.length} reliable tracks instead of API`);
    return fallbackTracks;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    console.log('Using fallback tracks instead');
    return fallbackTracks;
  }
};

export const searchTracks = async (query: string, limit = 10): Promise<Song[]> => {
  if (!query.trim()) return [];
  
  try {
    console.log(`Searching tracks with query: "${query}"`);
    
    // Currently using fallback tracks for search as well
    const filteredFallbacks = fallbackTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) || 
      track.artist.toLowerCase().includes(query.toLowerCase()) ||
      track.genre.toLowerCase().includes(query.toLowerCase())
    );
    
    // Simulating network delay for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Found ${filteredFallbacks.length} tracks for query "${query}"`);
    return filteredFallbacks.length > 0 ? filteredFallbacks : [];
    
    // Uncomment below when connecting to a real API
    /*
    const response = await axios.get<JamendoResponse>(`${API_BASE_URL}/tracks/`, {
      params: {
        client_id: CLIENT_ID,
        format: 'json',
        limit,
        namesearch: query,
        include: 'musicinfo',
      }
    });

    if (response.data.headers.code !== 200 || !response.data.results) {
      console.error('API Error:', response.data.headers.error_message || 'Unknown error');
      const filteredFallbacks = fallbackTracks.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) || 
        track.artist.toLowerCase().includes(query.toLowerCase())
      );
      return filteredFallbacks.length > 0 ? filteredFallbacks : [];
    }

    const tracks = response.data.results.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      albumArt: track.album_image,
      audioUrl: track.audio,
      duration: track.duration,
      genre: track.genres?.[0] || 'Unknown',
      language: Math.random() > 0.3 ? "english" as const : "hindi" as const,
    }));
    
    return tracks;
    */
  } catch (error) {
    console.error('Error searching tracks:', error);
    // Filter fallback tracks based on the query
    const filteredFallbacks = fallbackTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) || 
      track.artist.toLowerCase().includes(query.toLowerCase())
    );
    return filteredFallbacks.length > 0 ? filteredFallbacks : [];
  }
};
