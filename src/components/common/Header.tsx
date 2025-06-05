
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Home, MessageSquare, User, Search, LogOut, Music, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMusic } from '@/contexts/MusicContext';

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { searchSongs, searchResults, loadSong } = useMusic();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  console.log('Auth state in Header:', { isAuthenticated, currentUser });

  return (
    <header className="bg-white dark:bg-dhun-dark shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 sm:gap-2">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-dhun-purple flex items-center justify-center">
            <Music size={14} className="text-white sm:w-[18px] sm:h-[18px]" />
          </div>
          <span className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dhun-purple to-dhun-blue">
            DhunConnect
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link to="/">
            <Button 
              variant={isActive('/') ? "default" : "ghost"} 
              size="sm" 
              className={isActive('/') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          
          <Link to="/discover">
            <Button 
              variant={isActive('/discover') ? "default" : "ghost"} 
              size="sm" 
              className={isActive('/discover') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
            >
              Discover
            </Button>
          </Link>
          
          <Link to="/mood">
            <Button 
              variant={isActive('/mood') ? "default" : "ghost"} 
              size="sm" 
              className={isActive('/mood') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
            >
              Moods
            </Button>
          </Link>
          
          {isAuthenticated && (
            <>
              <Link to="/chat">
                <Button 
                  variant={isActive('/chat') ? "default" : "ghost"} 
                  size="sm" 
                  className={isActive('/chat') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button 
                  variant={isActive('/profile') ? "default" : "ghost"} 
                  size="sm" 
                  className={isActive('/profile') ? "bg-dhun-purple hover:bg-dhun-purple/90" : ""}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Search Button */}
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-200">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full h-[80vh] sm:h-auto">
              <SheetHeader>
                <SheetTitle className="text-base sm:text-lg">Search Music</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <Input
                  placeholder="Search for songs, artists..."
                  className="w-full text-sm sm:text-base"
                  onChange={handleSearch}
                  autoFocus
                />
                <div className="mt-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <ul className="space-y-2">
                      {searchResults.map((song) => (
                        <li 
                          key={song.id}
                          className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                          onClick={() => handleSongSelect(song.id)}
                        >
                          <img 
                            src={song.albumArt || '/placeholder.svg'} 
                            alt={song.title}
                            className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded"
                          />
                          <div className="flex-1 text-left min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm truncate">{song.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm sm:text-base">
                      Search for your favorite songs or artists
                    </p>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop User Menu */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {currentUser && (
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-dhun-purple text-white text-xs sm:text-sm">
                    {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block">
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <User size={14} className="sm:w-4 sm:h-4" />
                <span>Login</span>
              </Button>
            </Link>
          )}
          
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col gap-4 pt-8">
                <Link 
                  to="/" 
                  className="text-base sm:text-lg font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="inline-block w-4 h-4 mr-3" />
                  Home
                </Link>
                <Link 
                  to="/discover" 
                  className="text-base sm:text-lg font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Discover
                </Link>
                <Link 
                  to="/mood" 
                  className="text-base sm:text-lg font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Moods
                </Link>
                {isAuthenticated && (
                  <>
                    <Link 
                      to="/profile" 
                      className="text-base sm:text-lg font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="inline-block w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    <Link 
                      to="/chat" 
                      className="text-base sm:text-lg font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageSquare className="inline-block w-4 h-4 mr-3" />
                      Chat
                    </Link>
                    <div className="flex items-center gap-3 py-2 px-3 border-t border-gray-200 dark:border-gray-700 mt-4">
                      {currentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUser.avatar} />
                          <AvatarFallback className="bg-dhun-purple text-white text-sm">
                            {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium flex-1">{currentUser?.name}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="flex items-center gap-2 mt-2 justify-start"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </Button>
                  </>
                )}
                {!isAuthenticated && (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-start">
                      <User size={16} />
                      <span>Login</span>
                    </Button>
                  </Link>
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
