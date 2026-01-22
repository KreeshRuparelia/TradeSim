import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  const [error, setError] = useState('');
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      return;
    }

    handleCallback(code)
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication failed');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-display font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}