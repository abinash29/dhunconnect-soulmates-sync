
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Song } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const useListeningHistory = () => {
  const { currentUser } = useAuth();

  const addToHistory = async (song: Song) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('listening_history')
        .insert({
          user_id: currentUser.id,
          song_id: song.id,
          genre: song.genre,
          listened_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error adding to listening history:', error);
      } else {
        console.log(`Added ${song.title} to listening history`);
      }
    } catch (error) {
      console.error('Error adding to listening history:', error);
    }
  };

  const getMostListenedGenre = async (): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      const { data, error } = await supabase.rpc('get_most_listened_genre', {
        user_uuid: currentUser.id
      });

      if (error) {
        console.error('Error getting most listened genre:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting most listened genre:', error);
      return null;
    }
  };

  const getRecommendedSongs = async (count: number = 5): Promise<Song[]> => {
    if (!currentUser) {
      console.log('No user logged in, returning empty recommendations');
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_recommended_songs', {
        user_uuid: currentUser.id,
        recommendation_count: count
      });

      if (error) {
        console.error('Error getting recommended songs:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('No recommendations found, returning empty array');
        return [];
      }

      const songs: Song[] = data.map((song: any) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        albumArt: song.album_art || 'https://via.placeholder.com/300',
        audioUrl: song.audio_url,
        duration: song.duration,
        genre: song.genre || 'Unknown',
        language: song.language as 'hindi' | 'english'
      }));

      console.log(`Found ${songs.length} recommended songs`);
      return songs;
    } catch (error) {
      console.error('Error getting recommended songs:', error);
      return [];
    }
  };

  return {
    addToHistory,
    getMostListenedGenre,
    getRecommendedSongs
  };
};
