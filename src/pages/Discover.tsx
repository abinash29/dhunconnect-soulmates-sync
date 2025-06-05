
import React, { useState } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import Header from '@/components/common/Header';
import SongCard from '@/components/songs/SongCard';
import MusicPlayer from '@/components/player/MusicPlayer';
import ChatRoom from '@/components/chat/ChatRoom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'EDM', 'Dance',
  'Bollywood', 'Classical', 'Acoustic', 'Lofi', 'Ambient', 'Ballad'
];

const Discover: React.FC = () => {
  const { songs, getSongsByGenre, getSongsByLanguage } = useMusic();
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const [selectedGenre, setSelectedGenre] = useState<string>('Pop');
  
  // Filter songs by genre
  const genreFilteredSongs = getSongsByGenre(selectedGenre)
    .filter(song => song.language === selectedLanguage)
    .map(song => song.id);
  
  // Filter songs by language
  const languageSongs = getSongsByLanguage(selectedLanguage).map(song => song.id);

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-20">
      <Header />
      
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Discover Music</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Find new songs and connect with people who share your music taste
          </p>
        </div>
        
        <Tabs defaultValue="language" className="mb-6 sm:mb-8">
          <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
            <TabsTrigger value="language" className="text-xs sm:text-sm flex-1 sm:flex-none">By Language</TabsTrigger>
            <TabsTrigger value="genre" className="text-xs sm:text-sm flex-1 sm:flex-none">By Genre</TabsTrigger>
          </TabsList>
          
          <TabsContent value="language">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant={selectedLanguage === 'english' ? 'default' : 'outline'}
                className={`text-xs sm:text-sm ${selectedLanguage === 'english' 
                  ? "bg-dhun-purple hover:bg-dhun-purple/90" 
                  : "border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10"
                }`}
                onClick={() => setSelectedLanguage('english')}
              >
                English
              </Button>
              <Button
                variant={selectedLanguage === 'hindi' ? 'default' : 'outline'}
                className={`text-xs sm:text-sm ${selectedLanguage === 'hindi' 
                  ? "bg-dhun-purple hover:bg-dhun-purple/90" 
                  : "border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10"
                }`}
                onClick={() => setSelectedLanguage('hindi')}
              >
                Hindi
              </Button>
            </div>
            
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {languageSongs.map(songId => (
                <SongCard key={songId} songId={songId} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="genre">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-full">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant={selectedLanguage === 'english' ? 'default' : 'outline'}
                  className={`text-xs sm:text-sm ${selectedLanguage === 'english' 
                    ? "bg-dhun-purple hover:bg-dhun-purple/90" 
                    : "border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10"
                  }`}
                  onClick={() => setSelectedLanguage('english')}
                  size="sm"
                >
                  English
                </Button>
                <Button
                  variant={selectedLanguage === 'hindi' ? 'default' : 'outline'}
                  className={`text-xs sm:text-sm ${selectedLanguage === 'hindi' 
                    ? "bg-dhun-purple hover:bg-dhun-purple/90" 
                    : "border-dhun-purple text-dhun-purple hover:bg-dhun-purple/10"
                  }`}
                  onClick={() => setSelectedLanguage('hindi')}
                  size="sm"
                >
                  Hindi
                </Button>
              </div>
            </div>
            
            {genreFilteredSongs.length > 0 ? (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                {genreFilteredSongs.map(songId => (
                  <SongCard key={songId} songId={songId} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-gray-500">
                  No songs found for {selectedGenre} in {selectedLanguage}. Try a different genre or language.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MusicPlayer />
      <ChatRoom />
    </div>
  );
};

export default Discover;
