
import React from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { Badge } from '@/components/ui/badge';
import { Play, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SongListProps {
  songs: string[]; // Array of song IDs
  title?: string;
  className?: string;
}

const SongList: React.FC<SongListProps> = ({ songs, title, className }) => {
  const { loadSong, currentSong } = useMusic();
  
  if (songs.length === 0) {
    return (
      <div className="text-center py-8">
        <Music className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500">No songs available</p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      <div className="space-y-2">
        {songs.map((songId) => (
          <SongRow key={songId} songId={songId} />
        ))}
      </div>
    </div>
  );
};

interface SongRowProps {
  songId: string;
}

const SongRow: React.FC<SongRowProps> = ({ songId }) => {
  const { songs, loadSong, currentSong } = useMusic();
  
  const song = songs.find(s => s.id === songId);
  if (!song) return null;
  
  const isPlaying = currentSong?.id === song.id;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", 
        isPlaying && "bg-dhun-light-purple dark:bg-opacity-20"
      )}
    >
      <div className="relative h-12 w-12 flex-shrink-0">
        <img 
          src={song.albumArt || '/placeholder.svg'} 
          alt={song.title} 
          className="h-full w-full object-cover rounded"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
            <div className="music-visualizer">
              <div className="music-bar animate-equalizer-1"></div>
              <div className="music-bar animate-equalizer-2"></div>
              <div className="music-bar animate-equalizer-3"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{song.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {song.language}
        </Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={() => loadSong(song)}
        >
          <Play size={16} />
        </Button>
      </div>
    </div>
  );
};

export default SongList;
