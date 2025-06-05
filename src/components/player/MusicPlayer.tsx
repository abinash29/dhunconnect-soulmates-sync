
import React, { useState } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/utils';
import { Play, Pause, Volume2, Volume1, VolumeX } from 'lucide-react';

const MusicPlayer: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    progress, 
    duration, 
    togglePlay, 
    setVolume, 
    seekToPosition 
  } = useMusic();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentSong) return null;

  const VolumeIcon = () => {
    if (volume === 0) return <VolumeX size={16} />;
    if (volume < 0.5) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dhun-dark border-t border-gray-200 dark:border-gray-800 p-2 sm:p-3 z-40">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-1/4">
          <img 
            src={currentSong.albumArt || '/placeholder.svg'} 
            alt={currentSong.title} 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <div className="overflow-hidden min-w-0 flex-1">
            <h4 className="font-medium text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">{currentSong.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">{currentSong.artist}</p>
          </div>
        </div>
        
        {/* Player Controls */}
        <div className="flex flex-col items-center w-full sm:w-2/4 gap-1 sm:gap-2">
          {/* Play/Pause Button */}
          <div className="flex items-center justify-center">
            <Button 
              onClick={togglePlay} 
              size="sm" 
              variant="ghost" 
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-xs hidden sm:block">{formatTime(progress)}</span>
            <div className="flex-1">
              <input 
                type="range" 
                min="0" 
                max={duration || 1} 
                value={progress} 
                onChange={(e) => seekToPosition(parseFloat(e.target.value))} 
                className="w-full h-1 rounded-full progress-bar appearance-none bg-gray-200 dark:bg-gray-700 cursor-pointer"
              />
            </div>
            <span className="text-xs hidden sm:block">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center gap-2 w-full sm:w-1/4 justify-center sm:justify-end">
          <div
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center"
            >
              <VolumeIcon />
            </Button>
            
            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-dhun-dark shadow-lg rounded-lg p-2 w-24 sm:w-32 flex flex-col items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))} 
                  className="w-full h-1 volume-slider appearance-none bg-gray-200 dark:bg-gray-700 cursor-pointer"
                />
              </div>
            )}
          </div>
          
          {/* Music Visualizer (Simple) */}
          {isPlaying && (
            <div className="hidden md:flex music-visualizer ml-4">
              <div className="music-bar animate-equalizer-1"></div>
              <div className="music-bar animate-equalizer-2"></div>
              <div className="music-bar animate-equalizer-3"></div>
              <div className="music-bar animate-equalizer-1"></div>
              <div className="music-bar animate-equalizer-2"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
