import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import * as cognito from '../services/cognito';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCognitoEnabled: boolean;
  login: (username?: string) => Promise<void>;
  logout: () => void;
  handleCallback: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isCognitoEnabled = cognito.isCognitoConfigured();

  useEffect(() => {
    // Check existing auth state
    const checkAuth = async () => {
      try {
        if (isCognitoEnabled) {
          // Check Cognito tokens
          if (cognito.isAuthenticated()) {
            const userData = await api.getMe();
            setUser(userData);
          }
        } else {
          // Check dev mode auth
          const userId = localStorage.getItem('tradesim_user_id');
          if (userId) {
            const userData = await api.getMe();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid auth state
        if (isCognitoEnabled) {
          cognito.clearTokens();
        } else {
          localStorage.removeItem('tradesim_user_id');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isCognitoEnabled]);

  const login = async (username?: string) => {
    if (isCognitoEnabled) {
      // Redirect to Cognito hosted UI
      window.location.href = cognito.getLoginUrl();
    } else {
      // Dev mode login
      if (!username) throw new Error('Username required');
      setIsLoading(true);
      try {
        const userData = await api.devLogin(username);
        setUser(userData);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const logout = () => {
    if (isCognitoEnabled) {
      cognito.clearTokens();
      localStorage.removeItem('tradesim_active_portfolio');
      setUser(null);
      // Redirect to Cognito logout
      window.location.href = cognito.getLogoutUrl();
    } else {
      api.devLogout();
      setUser(null);
    }
  };

  const handleCallback = async (code: string) => {
    setIsLoading(true);
    try {
      // Exchange code for tokens
      const tokens = await cognito.exchangeCodeForTokens(code);
      cognito.storeTokens(tokens);
      
      // Get user data from our API
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Callback handling failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isCognitoEnabled,
        login,
        logout,
        handleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
