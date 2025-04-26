
import axios from 'axios';
import { Song } from '@/types';

// Using Jamendo API - a free music API with CC licensed music
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

// Fallback tracks to use when API fails
const fallbackTracks: Song[] = [
  {
    id: "fallback-1",
    title: "Summer Vibes",
    artist: "DJ Sunshine",
    albumArt: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=500&auto=format&fit=crop",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_4cf0391a34.mp3?filename=good-night-160166.mp3",
    duration: 180,
    genre: "Pop",
    language: "english" as const
  },
  {
    id: "fallback-2",
    title: "Midnight Dreams",
    artist: "Luna Echo",
    albumArt: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?w=500&auto=format&fit=crop",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0fd8f0487.mp3?filename=relaxing-145038.mp3",
    duration: 210,
    genre: "Ambient",
    language: "english" as const
  },
  {
    id: "fallback-3",
    title: "Urban Groove",
    artist: "Beat Master",
    albumArt: "https://images.unsplash.com/photo-1509781827353-fb95c262f5a0?w=500&auto=format&fit=crop",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/22/audio_af671dd12b.mp3?filename=electronic-future-beats-117997.mp3",
    duration: 195,
    genre: "Hip Hop",
    language: "english" as const
  },
  {
    id: "fallback-4",
    title: "Dil Ka Safar",
    artist: "Raj Kumar",
    albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe092a2.mp3?filename=india-documentary-168594.mp3",
    duration: 225,
    genre: "Bollywood",
    language: "hindi" as const
  },
  {
    id: "fallback-5",
    title: "Pyaar Ka Izhaar",
    artist: "Meera Sharma",
    albumArt: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=500&auto=format&fit=crop",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_1319120f27.mp3?filename=india-sitar-147618.mp3",
    duration: 240,
    genre: "Bollywood",
    language: "hindi" as const
  }
];

export const fetchTracks = async (limit = 20): Promise<Song[]> => {
  try {
    console.log("Fetching tracks from Jamendo API...");
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
      // Ensure language is properly typed as "english" or "hindi"
      language: Math.random() > 0.3 ? "english" as const : "hindi" as const,
    }));
    
    console.log(`Successfully fetched ${tracks.length} tracks`);
    return tracks.length > 0 ? tracks : fallbackTracks;
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
      // Filter fallback tracks based on the query
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
      // Ensure language is properly typed as "english" or "hindi"
      language: Math.random() > 0.3 ? "english" as const : "hindi" as const,
    }));
    
    console.log(`Found ${tracks.length} tracks for query "${query}"`);
    return tracks;
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
