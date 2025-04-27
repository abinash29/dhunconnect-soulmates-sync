import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Home, MessageSquare, User, Search, LogOut, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMusic } from '@/contexts/MusicContext';

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { searchSongs, searchResults, loadSong } = useMusic();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchSongs(e.target.value);
  };

  const handleSongSelect = (songId: string) => {
    const song = searchResults.find(s => s.id === songId);
    if (song) {
      loadSong(song);
      setSearchOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-dhun-dark shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-dhun-purple flex items-center justify-center">
            <Music size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dhun-purple to-dhun-blue">
            DhunConnect
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/">
            <Button 
              variant={isActive('/') ? "default" : "ghost"} 
              size="icon" 
              className={isActive('/') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
            >
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/chat">
            <Button 
              variant={isActive('/chat') ? "default" : "ghost"} 
              size="icon" 
              className={isActive('/chat') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/profile">
            <Button 
              variant={isActive('/profile') ? "default" : "ghost"} 
              size="icon" 
              className={isActive('/profile') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
            >
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-200">
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full">
              <SheetHeader>
                <SheetTitle>Search Music</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <Input
                  placeholder="Search for songs, artists..."
                  className="w-full"
                  onChange={handleSearch}
                  autoFocus
                />
                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <ul className="space-y-2">
                      {searchResults.map((song) => (
                        <li 
                          key={song.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                          onClick={() => handleSongSelect(song.id)}
                        >
                          <img 
                            src={song.albumArt || '/placeholder.svg'} 
                            alt={song.title}
                            className="h-12 w-12 object-cover rounded"
                          />
                          <div className="flex-1 text-left">
                            <h4 className="font-medium text-sm">{song.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{song.artist}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                      Search for your favorite songs or artists
                    </p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="bg-dhun-purple text-white">
                  {currentUser?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <User size={16} />
                <span>Login</span>
              </Button>
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 pt-8">
                <Link to="/" className="text-lg font-medium">Home</Link>
                <Link to="/discover" className="text-lg font-medium">Discover</Link>
                <Link to="/mood" className="text-lg font-medium">Moods</Link>
                {isAuthenticated && (
                  <Button variant="outline" onClick={logout} className="flex items-center gap-2 mt-4">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
