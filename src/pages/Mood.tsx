
import React, { useState } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import Header from '@/components/common/Header';
import SongList from '@/components/songs/SongList';
import MusicPlayer from '@/components/player/MusicPlayer';
import ChatRoom from '@/components/chat/ChatRoom';
import { MoodType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

const moodOptions: { label: string; value: MoodType; emoji: string; description: string; color: string }[] = [
  { 
    label: 'Happy', 
    value: 'happy', 
    emoji: '😊', 
    description: 'Upbeat tunes to brighten your day', 
    color: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300'
  },
  { 
    label: 'Sad', 
    value: 'sad', 
    emoji: '😢', 
    description: 'Melancholic melodies for your emotions', 
    color: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300'
  },
  { 
    label: 'Energetic', 
    value: 'energetic', 
    emoji: '⚡', 
    description: 'High-energy songs to pump you up', 
    color: 'bg-red-100 dark:bg-red-900/20 border-red-300'
  },
  { 
    label: 'Romantic', 
    value: 'romantic', 
    emoji: '❤️', 
    description: 'Love songs to set the mood', 
    color: 'bg-pink-100 dark:bg-pink-900/20 border-pink-300'
  },
  { 
    label: 'Relaxed', 
    value: 'relaxed', 
    emoji: '😌', 
    description: 'Calm tunes to unwind and de-stress', 
    color: 'bg-green-100 dark:bg-green-900/20 border-green-300'
  },
  { 
    label: 'Party', 
    value: 'party', 
    emoji: '🎉', 
    description: 'Dance hits to get the party started', 
    color: 'bg-purple-100 dark:bg-purple-900/20 border-purple-300'
  },
  { 
    label: 'Focus', 
    value: 'focus', 
    emoji: '🧠', 
    description: 'Concentration music to help you get things done', 
    color: 'bg-gray-100 dark:bg-gray-800 border-gray-300'
  },
];

const Mood: React.FC = () => {
  const { getMoodRecommendations } = useMusic();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodSongs, setMoodSongs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    setLoading(true);
    try {
      const recommendations = await getMoodRecommendations(mood);
      setMoodSongs(recommendations.map(song => song.id));
    } catch (error) {
      console.error('Error getting mood recommendations:', error);
      setMoodSongs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-20">
      <Header />
      
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Mood-Based Music</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Discover songs that match how you're feeling right now
          </p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {moodOptions.map((mood) => (
            <Card 
              key={mood.value}
              className={`cursor-pointer border-2 transition-all hover:scale-105 ${
                selectedMood === mood.value 
                  ? 'border-dhun-purple ring-2 ring-dhun-purple/20' 
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
              } ${mood.color}`}
              onClick={() => handleMoodSelect(mood.value)}
            >
              <CardContent className="p-3 sm:p-6 flex flex-col items-center text-center">
                <span className="text-2xl sm:text-4xl mb-2 sm:mb-3" role="img" aria-label={mood.label}>
                  {mood.emoji}
                </span>
                <h3 className="text-sm sm:text-xl font-semibold mb-1">{mood.label}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  {mood.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {selectedMood && (
          <div className="bg-white dark:bg-dhun-dark rounded-lg shadow-sm p-3 sm:p-4">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-dhun-purple mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-500">Loading mood recommendations...</p>
              </div>
            ) : (
              <>
                <SongList 
                  songs={moodSongs} 
                  title={`${moodOptions.find(m => m.value === selectedMood)?.emoji} ${moodOptions.find(m => m.value === selectedMood)?.label} Music Recommendations`} 
                />
                
                {moodSongs.length === 0 && !loading && (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-sm sm:text-base text-gray-500">No songs found for this mood. Try a different one.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      
      <MusicPlayer />
      <ChatRoom />
    </div>
  );
};

export default Mood;
