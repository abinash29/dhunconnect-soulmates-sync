
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session in localStorage
    const storedUser = localStorage.getItem('dhunconnect_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('dhunconnect_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Mock login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      
      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - in a real app, this would be a backend call
      if (email === 'demo@example.com' && password === 'password') {
        const mockUser: User = {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=demo',
        };
        setCurrentUser(mockUser);
        localStorage.setItem('dhunconnect_user', JSON.stringify(mockUser));
        toast({
          title: "Login successful",
          description: "Welcome back to DhunConnect!",
        });
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Validate name
      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      
      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, create a new user with a generated avatar
      const seed = name.replace(/\s+/g, '-').toLowerCase();
      const avatarUrl = `https://api.dicebear.com/7.x/micah/svg?seed=${seed}`;
      
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        avatar: avatarUrl,
      };
      
      setCurrentUser(newUser);
      localStorage.setItem('dhunconnect_user', JSON.stringify(newUser));
      
      toast({
        title: "Account created successfully",
        description: "Welcome to DhunConnect!",
      });
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dhunconnect_user');
    setCurrentUser(null);
    toast({
      title: "Logged out successfully",
    });
  };
  
  const updateUser = (userData: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...userData };
    setCurrentUser(updatedUser);
    localStorage.setItem('dhunconnect_user', JSON.stringify(updatedUser));
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
