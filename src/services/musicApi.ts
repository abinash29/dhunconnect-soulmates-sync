
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
      return [];
    }

    const tracks = response.data.results.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      albumArt: track.album_image,
      audioUrl: track.audio,
      duration: track.duration,
      genre: track.genres?.[0] || 'Unknown',
      // Since Jamendo has mostly English songs, we'll set this randomly for demo
      language: Math.random() > 0.3 ? 'english' : 'hindi',
    }));
    
    console.log(`Successfully fetched ${tracks.length} tracks`);
    return tracks;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
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
      return [];
    }

    const tracks = response.data.results.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      albumArt: track.album_image,
      audioUrl: track.audio,
      duration: track.duration,
      genre: track.genres?.[0] || 'Unknown',
      language: Math.random() > 0.3 ? 'english' : 'hindi',
    }));
    
    console.log(`Found ${tracks.length} tracks for query "${query}"`);
    return tracks;
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
};
