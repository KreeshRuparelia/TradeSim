import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSignupUrl } from '../services/cognito';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, isCognitoEnabled } = useAuth();
  
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCognitoEnabled) {
      // Cognito login - redirects to hosted UI
      login();
    } else {
      // Dev mode login
      if (!username.trim()) {
        setError('Please enter a username');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        await login(username.trim());
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignup = () => {
    if (isCognitoEnabled) {
      window.location.href = getSignupUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-lg mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">TradeSim</h1>
          <p className="text-gray-500 mt-2">Learn to trade with virtual money</p>
        </div>

        {/* Login Card */}
        <div className="card animate-fade-in stagger-1">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isCognitoEnabled && (
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-400">
                  Development mode: enter any username to continue
                </p>
              </div>
            )}

            {isCognitoEnabled && (
              <p className="text-sm text-gray-500 text-center">
                Click below to sign in with your account
              </p>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              New to TradeSim?{' '}
              <button
                onClick={handleSignup}
                className="text-brand-600 font-medium hover:text-brand-700"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center animate-fade-in stagger-2">
          <div className="p-4">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-xs text-gray-500">Real-time quotes</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-xs text-gray-500">Virtual trading</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">📚</div>
            <p className="text-xs text-gray-500">Learn investing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
