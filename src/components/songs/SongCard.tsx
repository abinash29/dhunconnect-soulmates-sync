
import React from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { Play, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SongCardProps {
  songId: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const SongCard: React.FC<SongCardProps> = ({ 
  songId, 
  size = 'md', 
  showDetails = true,
  className
}) => {
  const { songs, currentSong, loadSong } = useMusic();
  
  const song = songs.find(s => s.id === songId);
  if (!song) return null;
  
  const isPlaying = currentSong?.id === song.id;
  
  const sizeClasses = {
    sm: 'w-28 h-28',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
  };
  
  const handlePlay = () => {
    loadSong(song);
  };
  
  return (
    <div className={cn("group relative", className)}>
      <div className={cn("relative rounded-lg overflow-hidden", sizeClasses[size])}>
        <img 
          src={song.albumArt || '/placeholder.svg'} 
          alt={song.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm text-white hover:bg-opacity-30"
            onClick={handlePlay}
          >
            <Play size={24} className="ml-1" />
          </Button>
        </div>
        
        {/* Now playing indicator */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 bg-dhun-purple text-white text-xs py-1 text-center">
            Now Playing
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-2 text-center">
          <h4 className="font-medium text-sm truncate">{song.title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
        </div>
      )}
    </div>
  );
};

export default SongCard;
