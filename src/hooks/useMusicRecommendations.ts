
import { Song, MoodType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const useMusicRecommendations = (songs: Song[]) => {
  const getMoodRecommendations = async (mood: MoodType): Promise<Song[]> => {
    try {
      console.log(`Getting recommendations for mood: ${mood}`);
      
      // First try to fetch from database
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .contains('mood', [mood]);
        
      if (error) {
        console.error('Error fetching mood recommendations:', error);
        // Fallback to local filtering if database query fails
        return getLocalMoodRecommendations(mood);
      }
      
      if (data && data.length > 0) {
        // Convert database format to Song format
        const dbSongs: Song[] = data.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          audioUrl: song.audio_url,
          albumArt: song.album_art || 'https://via.placeholder.com/300',
          duration: song.duration,
          genre: song.genre || 'Unknown',
          language: song.language as 'hindi' | 'english'
        }));
        
        // Shuffle and return up to 10 songs
        const shuffled = dbSongs.sort(() => 0.5 - Math.random());
        console.log(`Found ${shuffled.length} songs for mood: ${mood} from database`);
        return shuffled.slice(0, 10);
      } else {
        console.log(`No songs found in database for mood: ${mood}, falling back to local`);
        return getLocalMoodRecommendations(mood);
      }
    } catch (error) {
      console.error('Error in getMoodRecommendations:', error);
      return getLocalMoodRecommendations(mood);
    }
  };

  const getLocalMoodRecommendations = (mood: MoodType): Song[] => {
    if (songs.length === 0) return [];
    
    console.log(`Getting local recommendations for mood: ${mood}`);
    
    const moodGenreMap: Record<MoodType, string[]> = {
      'happy': ['Pop', 'Dance', 'Electro', 'Funk'],
      'sad': ['Acoustic', 'Ambience', 'Jazz', 'Classical', 'Blues'],
      'energetic': ['Rock', 'Electronic', 'Metal', 'Punk', 'Hip Hop'],
      'romantic': ['R&B', 'Acoustic', 'Soul', 'Jazz', 'Bollywood'],
      'relaxed': ['Lofi', 'Ambient', 'Chillout', 'Jazz', 'New Age'],
      'party': ['Dance', 'Hip Hop', 'Electro', 'House', 'Funk'],
      'focus': ['Ambient', 'Classical', 'Chillout', 'Lofi', 'New Age']
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
