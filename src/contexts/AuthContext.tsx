
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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

// Generate a unique session ID for this tab
const tabSessionId = `auth_session_${Math.random().toString(36).substring(2, 15)}`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First set up the auth state listener to catch changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event, newSession);
        
        // Store session locally for this tab instance only
        if (newSession) {
          sessionStorage.setItem(tabSessionId, JSON.stringify(newSession));
        } else if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem(tabSessionId);
        }
        
        setSession(newSession);
        
        if (newSession?.user) {
          // Get the user profile from our profiles table
          setTimeout(async () => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newSession.user.id)
                .single();
                
              if (profileError) throw profileError;
              
              if (profileData) {
                const userData: User = {
                  id: profileData.id,
                  name: profileData.name || 'Unknown User',
                  email: profileData.email || newSession.user.email || '',
                  avatar: profileData.avatar
                };
                
                setCurrentUser(userData);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }, 0);
        } else {
          setCurrentUser(null);
        }
      }
    );

    // Then check for an existing session
    const initializeAuth = async () => {
      try {
        // Check for session in this tab's sessionStorage first
        const localSession = sessionStorage.getItem(tabSessionId);
        if (localSession) {
          const parsedSession = JSON.parse(localSession);
          setSession(parsedSession);
          
          // Get user profile
          if (parsedSession?.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', parsedSession.user.id)
              .single();
              
            if (!profileError && profileData) {
              const userData: User = {
                id: profileData.id,
                name: profileData.name || 'Unknown User',
                email: profileData.email || parsedSession.user.email || '',
                avatar: profileData.avatar
              };
              
              setCurrentUser(userData);
            }
          }
        } else {
          // If no session in this tab, check with Supabase
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          console.log('Existing session:', existingSession);
          
          if (existingSession) {
            // Store in this tab's session storage
            sessionStorage.setItem(tabSessionId, JSON.stringify(existingSession));
          }
          
          setSession(existingSession);
          
          if (existingSession?.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', existingSession.user.id)
              .single();
              
            if (profileError) throw profileError;
            
            if (profileData) {
              const userData: User = {
                id: profileData.id,
                name: profileData.name || 'Unknown User',
                email: profileData.email || existingSession.user.email || '',
                avatar: profileData.avatar
              };
              
              setCurrentUser(userData);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "Welcome to DhunConnect!",
      });

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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) throw error;
      
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

  const logout = async () => {
    try {
      sessionStorage.removeItem(tabSessionId);
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };
  
  const updateUser = async (userData: Partial<User>) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          avatar: userData.avatar
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile",
        variant: "destructive",
      });
    }
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
