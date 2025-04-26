
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Song } from '@/types';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener('loadedmetadata', handleMetadataLoaded);
    audioRef.current.addEventListener('ended', handleSongEnd);
    audioRef.current.addEventListener('error', handleAudioError);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleMetadataLoaded);
        audioRef.current.removeEventListener('ended', handleSongEnd);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      console.log("Audio metadata loaded, duration:", audioRef.current.duration);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSongEnd = () => {
    console.log("Song ended");
    setIsPlaying(false);
    setProgress(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handleAudioError = (e: Event) => {
    console.error('Audio playback error:', e);
    toast({
      title: "Playback Error",
      description: "There was an error playing this song. Please try another.",
      variant: "destructive",
    });
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      
      progressTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      }, 1000);
    } else if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying]);

  const loadSong = (song: Song) => {
    if (!audioRef.current) return;
    
    console.log("Loading song:", song.title, "by", song.artist);
    console.log("Audio URL:", song.audioUrl);
    
    setIsPlaying(false);
    setProgress(0);
    setCurrentSong(song);
    audioRef.current.src = song.audioUrl;
    audioRef.current.load();
    audioRef.current.volume = volume;
    
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("Song playing successfully");
        setIsPlaying(true);
        toast({
          title: "Now Playing",
          description: `${song.title} by ${song.artist}`,
        });
      }).catch(error => {
        console.error('Playback failed:', error);
        toast({
          title: "Playback Error",
          description: "There was an error playing this song. Please try another.",
          variant: "destructive",
        });
      });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      console.log("Pausing playback");
      audioRef.current.pause();
    } else {
      console.log("Resuming playback");
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        toast({
          title: "Playback Error",
          description: "Could not play this song. Please try another.",
          variant: "destructive",
        });
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;
    console.log("Setting volume to:", newVolume);
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
  };

  const seekToPosition = (position: number) => {
    if (!audioRef.current) return;
    console.log("Seeking to position:", position);
    audioRef.current.currentTime = position;
    setProgress(position);
  };

  return {
    isPlaying,
    volume,
    progress,
    duration,
    currentSong,
    loadSong,
    togglePlay,
    setVolume,
    seekToPosition,
  };
};
