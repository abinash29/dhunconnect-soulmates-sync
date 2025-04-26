
import { Song, MoodType } from '@/types';

export const useMusicRecommendations = (songs: Song[]) => {
  const getMoodRecommendations = (mood: MoodType): Song[] => {
    if (songs.length === 0) return [];
    
    console.log(`Getting recommendations for mood: ${mood}`);
    
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
    let filteredSongs = songs.filter(song => {
      const songGenre = song.genre.toLowerCase();
      return relevantGenres.some(genre => songGenre.includes(genre.toLowerCase()));
    });
    
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

  const getSongsByGenre = (genre: string): Song[] => {
    return songs.filter(song => 
      song.genre.toLowerCase().includes(genre.toLowerCase())
    );
  };

  const getSongsByLanguage = (language: "hindi" | "english"): Song[] => {
    return songs.filter(song => song.language === language);
  };

  return {
    getMoodRecommendations,
    getSongsByGenre,
    getSongsByLanguage,
  };
};
