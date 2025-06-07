
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
import { Shuffle, Star, TrendingUp, Play } from 'lucide-react';
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
    playRecommendedSong
  } = useMusic();
  const [trendingSongs, setTrendingSongs] = useState<string[]>([]);
  const [featuredSongs, setFeaturedSongs] = useState<string[]>([]);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [moodSongs, setMoodSongs] = useState<string[]>([]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  
  // Get random songs with user-specific seeding for consistent but different order per user
  useEffect(() => {
    if (songs.length > 0) {
      // Create a user-specific seed for consistent randomization
      const userSeed = currentUser?.id ? 
        parseInt(currentUser.id.slice(-8), 16) : 
        Date.now();
      
      // Seeded shuffle function
      const seededShuffle = (array: Song[], seed: number) => {
        const shuffled = [...array];
        let m = shuffled.length;
        let t, i;
        
        // Use a simple LCG for seeded randomness
        let random = seed;
        const next = () => {
          random = (random * 1664525 + 1013904223) % Math.pow(2, 32);
          return random / Math.pow(2, 32);
        };
        
        while (m) {
          i = Math.floor(next() * m--);
          t = shuffled[m];
          shuffled[m] = shuffled[i];
          shuffled[i] = t;
        }
        return shuffled;
      };
      
      // Get different shuffled arrays for trending and featured
      const trendingShuffled = seededShuffle(songs, userSeed);
      const featuredShuffled = seededShuffle(songs, userSeed + 12345);
      
      setTrendingSongs(trendingShuffled.slice(0, 8).map(song => song.id));
      setFeaturedSongs(featuredShuffled.slice(0, 5).map(song => song.id));
    }
  }, [songs, currentUser?.id]);

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

  // Handle personalized recommendation
  const handleGetRecommendation = async () => {
    if (!isAuthenticated) return;
    
    setLoadingRecommendation(true);
    try {
      await playRecommendedSong();
    } catch (error) {
      console.error('Error playing recommendation:', error);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Welcome Section */}
        <section className="mb-6 sm:mb-10">
          <div className="bg-gradient-to-r from-dhun-light-purple to-dhun-light-blue rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-10">
            <div className="max-w-2xl">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
                {isAuthenticated 
                  ? `Welcome back, ${currentUser?.name.split(' ')[0]}!` 
                  : "Connect through music"}
              </h1>
              <p className="text-dhun-dark opacity-80 mb-4 sm:mb-6 text-sm sm:text-base">
                Find your music soulmates - people who are listening to the same songs as you right now.
              </p>
              {!isAuthenticated ? (
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  <Link to="/login">
                    <Button className="bg-dhun-purple hover:bg-dhun-purple/90 w-full sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="outline" className="border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10 w-full sm:w-auto">
                      Explore Music
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  <Button 
                    onClick={handlePlayRandomSong} 
                    className="bg-dhun-blue hover:bg-dhun-blue/90 w-full sm:w-auto"
                    disabled={songs.length === 0}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Random Song
                  </Button>
                  <Button 
                    onClick={handleGetRecommendation}
                    className="bg-dhun-orange hover:bg-dhun-orange/90 w-full sm:w-auto"
                    disabled={loadingRecommendation}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {loadingRecommendation ? 'Loading...' : 'Play Recommendation'}
                  </Button>
                  <Link to="/profile">
                    <Button className="bg-dhun-purple hover:bg-dhun-purple/90 w-full sm:w-auto">
                      My Profile
                    </Button>
                  </Link>
                  <Link to="/discover">
                    <Button variant="outline" className="border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10 w-full sm:w-auto">
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
          <div className="text-center py-6 sm:py-10">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-dhun-purple mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading songs for you...</p>
          </div>
        )}
        
        {/* Featured Songs Section - Now randomized per user */}
        {!loadingSongs && featuredSongs.length > 0 && (
          <section className="mb-6 sm:mb-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Featured Songs</h2>
              {isAuthenticated && (
                <Button 
                  onClick={handlePlayRandomSong} 
                  variant="outline"
                  className="border-dhun-blue text-dhun-blue hover:bg-dhun-blue/10 text-xs sm:text-sm"
                  size="sm"
                >
                  <Shuffle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Random Song
                </Button>
              )}
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
              <SongList songs={featuredSongs} />
            </div>
          </section>
        )}
        
        {/* Trending Section - Now randomized per user */}
        {!loadingSongs && trendingSongs.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Trending Now</h2>
              <Link to="/discover" className="text-xs sm:text-sm text-dhun-purple hover:underline">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
              {trendingSongs.slice(0, 6).map((songId) => (
                <SongCard key={songId} songId={songId} />
              ))}
            </div>
          </section>
        )}
        
        {/* How it Works Section */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6">How DhunConnect Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-dhun-light-purple flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-dhun-purple text-lg sm:text-xl font-bold">1</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Choose Your Music</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Browse our library and play songs you love in Hindi or English.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-dhun-light-blue flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-dhun-blue text-lg sm:text-xl font-bold">2</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Find Your Match</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                When someone else listens to the same song, we connect you automatically.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dhun-dark rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-dhun-light-purple flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-dhun-orange text-lg sm:text-xl font-bold">3</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Connect & Chat</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Start a conversation with your music soulmate and discover new favorites.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mood Section - Updated to fetch from database */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">What's your vibe today?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
            Choose from our mood collection: Happy, Sad, Energetic, Party, Relaxed, Dance, or 90s vibes!
          </p>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant={currentMood === mood.value ? "default" : "outline"}
                className={`text-xs sm:text-sm ${currentMood === mood.value 
                  ? "bg-dhun-purple hover:bg-dhun-purple/90" 
                  : "border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10"
                }`}
                size="sm"
                onClick={() => handleMoodSelect(mood.value)}
              >
                <span className="mr-1 sm:mr-2">{mood.emoji}</span>
                {mood.label}
              </Button>
            ))}
          </div>
          
          {currentMood && (
            <div className="bg-white dark:bg-dhun-dark rounded-lg shadow-sm p-3 sm:p-4">
              {moodSongs.length > 0 ? (
                <SongList 
                  songs={moodSongs} 
                  title={`${moodOptions.find(m => m.value === currentMood)?.emoji} ${moodOptions.find(m => m.value === currentMood)?.label} Music`} 
                />
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
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
