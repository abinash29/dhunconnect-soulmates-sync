
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMusic } from '@/contexts/MusicContext';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { MoodType } from '@/types';

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { songs } = useMusic();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: '',
    age: '',
    favGenre: '',
    preferredLanguage: 'english',
    preferredMood: 'happy' as MoodType,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  
  if (!currentUser) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">You need to be logged in to view this page</h1>
          <Button onClick={() => navigate('/login')} className="bg-dhun-purple hover:bg-dhun-purple/90">
            Login
          </Button>
        </div>
      </div>
    );
  }
  
  // Get recently played songs (would normally come from API)
  const recentlyPlayed = songs.slice(0, 3).map(song => ({
    title: song.title,
    artist: song.artist,
    image: song.albumArt,
  }));
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would normally save to API here
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved",
    });
    setIsEditing(false);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-dhun-light-purple to-dhun-light-blue rounded-lg p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="text-2xl bg-dhun-purple text-white">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{currentUser.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">{currentUser.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                <Button 
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className={isEditing ? "" : "bg-dhun-purple hover:bg-dhun-purple/90"}
                >
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal details and preferences</CardDescription>
              </CardHeader>
              
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell others about your music taste..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="favGenre">Favorite Genre</Label>
                      <Input
                        id="favGenre"
                        name="favGenre"
                        value={formData.favGenre}
                        onChange={handleInputChange}
                        placeholder="Rock, Pop, Hip-Hop, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Preferred Language</Label>
                      <RadioGroup 
                        defaultValue={formData.preferredLanguage}
                        onValueChange={(value) => handleRadioChange('preferredLanguage', value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="english" id="english" />
                          <Label htmlFor="english">English</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hindi" id="hindi" />
                          <Label htmlFor="hindi">Hindi</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Default Mood</Label>
                      <RadioGroup 
                        defaultValue={formData.preferredMood}
                        onValueChange={(value) => handleRadioChange('preferredMood', value as MoodType)}
                        className="flex flex-wrap gap-4"
                      >
                        {['happy', 'sad', 'energetic', 'romantic', 'relaxed', 'party'].map((mood) => (
                          <div key={mood} className="flex items-center space-x-2">
                            <RadioGroupItem value={mood} id={mood} />
                            <Label htmlFor={mood} className="capitalize">{mood}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <Button type="submit" className="bg-dhun-purple hover:bg-dhun-purple/90 mt-2">
                      Save Changes
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</h3>
                      <p>{currentUser.name}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                      <p>{currentUser.email}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</h3>
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        {formData.bio || "No bio yet. Click 'Edit Profile' to add one."}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                        <p>{formData.age || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Favorite Genre</h3>
                        <p>{formData.favGenre || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Preferred Language</h3>
                        <p className="capitalize">{formData.preferredLanguage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Music Stats & History */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Music Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Connections Made</h3>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Songs Played</h3>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Favorite Mood</h3>
                      <p className="text-lg font-medium capitalize">{formData.preferredMood}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recently Played</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentlyPlayed.length > 0 ? (
                      recentlyPlayed.map((song, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={song.image || '/placeholder.svg'} 
                              alt={song.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{song.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No songs played yet</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/discover')}
                  >
                    Discover More Music
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
