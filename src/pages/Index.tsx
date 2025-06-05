import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMusic } from '@/contexts/MusicContext';
import Header from '@/components/common/Header';
import SongCard from '@/components/songs/SongCard';
import SongList from '@/components/songs/SongList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoodType, Song } from '@/types';
import { Link } from 'react-router-dom';
import { Shuffle, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Updated mood options to match database mood column
const moodOptions: { label: string; value: string; emoji: string }[] = [
  { label: 'Happy', value: 'happy', emoji: '😊' },
  { label: 'Sad', value: 'sad', emoji: '😢' },
  { label: 'Energetic', value: 'energetic', emoji: '⚡' },
  { label: 'Party', value: 'party', emoji: '🎉' },
  { label: 'Relaxed', value: 'relaxed', emoji: '😌' },
  { label: 'Dance', value: 'dance', emoji: '💃' },
  { label: '90s', value: '90s', emoji: '🎵' },
];

const Index: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { 
    songs, 
    currentSong, 
    loadSong, 
    loadingSongs, 
    getRecommendedSongs, 
    getMostListenedGenre 
  } = useMusic();
  const [trendingSongs, setTrendingSongs] = useState<string[]>([]);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [moodSongs, setMoodSongs] = useState<string[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Get random trending songs
  useEffect(() => {
    if (songs.length > 0) {
      // Shuffle and get first 10 songs for "trending"
      const shuffled = [...songs].sort(() => 0.5 - Math.random());
      setTrendingSongs(shuffled.slice(0, 8).map(song => song.id));
    }
  }, [songs]);

  // Handle mood selection - fetch from database mood column
  const handleMoodSelect = async (mood: string) => {
    setCurrentMood(mood);
    
    try {
      console.log(`Fetching songs for mood: ${mood}`);
      
      const { data, error } = await supabase
        .from('songs')
        .select('id')
        .contains('mood', [mood]);
        
      if (error) {
        console.error('Error fetching songs by mood:', error);
        setMoodSongs([]);
        return;
      }
      
      console.log(`Found ${data?.length || 0} songs for mood: ${mood}`);
      
      if (data && data.length > 0) {
        // Shuffle and take up to 10 songs
        const shuffled = data.sort(() => 0.5 - Math.random());
        setMoodSongs(shuffled.slice(0, 10).map(song => song.id));
      } else {
        setMoodSongs([]);
      }
    } catch (error) {
      console.error('Error fetching mood songs:', error);
      setMoodSongs([]);
    }
  };

  // Handle random song play
  const handlePlayRandomSong = () => {
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      const randomSong = songs[randomIndex];
      loadSong(randomSong);
    }
  };

  // Handle recommendations based on listening history
  const handleGetRecommendations = async () => {
    if (!isAuthenticated) return;
    
    setLoadingRecommendations(true);
    try {
      console.log('Getting personalized recommendations...');
      const recommendations = await getRecommendedSongs(5);
      setRecommendedSongs(recommendations);
      
      const favoriteGenre = await getMostListenedGenre();
      if (favoriteGenre) {
        console.log(`Recommendations based on your favorite genre: ${favoriteGenre}`);
      } else {
        console.log('No listening history found, showing random recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-dhun-light-purple to-dhun-light-blue rounded-2xl p-6 md:p-10">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                {isAuthenticated 
                  ? `Welcome back, ${currentUser?.name.split(' ')[0]}!` 
                  : "Connect through music"}
              </h1>
              <p className="text-dhun-dark opacity-80 mb-6">
                Find your music soulmates - people who are listening to the same songs as you right now.
              </p>
              {!isAuthenticated ? (
                <div className="flex flex-wrap gap-3">
                  <Link to="/login">
                    <Button className="bg-dhun-purple hover:bg-dhun-purple/90">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="outline" className="border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10">
                      Explore Music
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handlePlayRandomSong} 
                    className="bg-dhun-blue hover:bg-dhun-blue/90"
                    disabled={songs.length === 0}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Listen to Random Song
                  </Button>
                  <Button 
                    onClick={handleGetRecommendations}
                    className="bg-dhun-orange hover:bg-dhun-orange/90"
                    disabled={loadingRecommendations}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {loadingRecommendations ? 'Loading...' : 'Get Recommendations'}
                  </Button>
                  <Link to="/profile">
                    <Button className="bg-dhun-purple hover:bg-dhun-purple/90">
                      My Profile
                    </Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="outline" className="border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10">
                      Discover Music
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Loading State */}
        {loadingSongs && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dhun-purple mx-auto mb-4"></div>
            <p>Loading songs for you...</p>
          </div>
        )}
        
        {/* Personalized Recommendations Section */}
        {isAuthenticated && recommendedSongs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-dhun-orange" />
                <h2 className="text-xl md:text-2xl font-semibold">Recommended For You</h2>
                {getMostListenedGenre() && (
                  <Badge variant="outline" className="border-dhun-orange text-dhun-orange">
                    Based on {getMostListenedGenre()} music
                  </Badge>
                )}
              </div>
              <Button 
                onClick={handleGetRecommendations}
                variant="outline"
                className="border-dhun-orange text-dhun-orange hover:bg-dhun-orange/10"
                disabled={loadingRecommendations}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-4 shadow-sm mb-6">
              <SongList songs={recommendedSongs.map(song => song.id)} />
            </div>
          </section>
        )}
        
        {/* All Songs Section - Added to ensure songs are visible */}
        {!loadingSongs && songs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Featured Songs</h2>
              {isAuthenticated && (
                <Button 
                  onClick={handlePlayRandomSong} 
                  variant="outline"
                  className="border-dhun-blue text-dhun-blue hover:bg-dhun-blue/10"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Random Song
                </Button>
              )}
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-4 shadow-sm mb-6">
              <SongList songs={songs.slice(0, 5).map(song => song.id)} />
            </div>
          </section>
        )}
        
        {/* Trending Section */}
        {!loadingSongs && trendingSongs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Trending Now</h2>
              <Link to="/discover" className="text-sm text-dhun-purple hover:underline">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {trendingSongs.slice(0, 6).map((songId) => (
                <SongCard key={songId} songId={songId} />
              ))}
            </div>
          </section>
        )}
        
        {/* How it Works Section */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">How DhunConnect Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-dhun-light-purple flex items-center justify-center mb-4">
                <span className="text-dhun-purple text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Music</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse our library and play songs you love in Hindi or English.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-dhun-light-blue flex items-center justify-center mb-4">
                <span className="text-dhun-blue text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Find Your Match</h3>
              <p className="text-gray-600 dark:text-gray-300">
                When someone else listens to the same song, we connect you automatically.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-dhun-light-purple flex items-center justify-center mb-4">
                <span className="text-dhun-orange text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect & Chat</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Start a conversation with your music soulmate and discover new favorites.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mood Section - Updated to fetch from database */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">What's your vibe today?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Choose from our mood collection: Happy, Sad, Energetic, Party, Relaxed, Dance, or 90s vibes!
          </p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant={currentMood === mood.value ? "default" : "outline"}
                className={currentMood === mood.value 
                  ? "bg-dhun-purple hover:bg-dhun-purple/90" 
                  : "border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10"
                }
                onClick={() => handleMoodSelect(mood.value)}
              >
                <span className="mr-2">{mood.emoji}</span>
                {mood.label}
              </Button>
            ))}
          </div>
          
          {currentMood && (
            <div className="bg-white dark:bg-dhun-dark rounded-lg shadow-sm p-4">
              {moodSongs.length > 0 ? (
                <SongList 
                  songs={moodSongs} 
                  title={`${moodOptions.find(m => m.value === currentMood)?.emoji} ${moodOptions.find(m => m.value === currentMood)?.label} Music`} 
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No songs found for this mood. Try another mood or check back later!
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
