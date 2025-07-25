import React, { useState } from 'react';
import { apiConfig } from '../config/api';

interface AuthProps {
  onAuthSuccess: (token: string) => void;
}

interface AuthForm {
  email: string;
  password: string;
  confirmPassword?: string;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState<AuthForm>({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      onAuthSuccess(data.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setForm({ email: '', password: '', confirmPassword: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffae2] via-[#e0f7f4] to-[#f8fafc] flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-[#007d40] to-[#0097b2] rounded-full flex items-center justify-center shadow-xl">
            <svg className="h-10 w-10 text-[#fffae2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="mt-8 text-4xl font-extrabold text-[#18181b]">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-3 text-base text-[#0097b2]">
            {isLogin ? 'Sign in to access your chemical naming tools' : 'Join us to start naming molecules'}
          </p>
        </div>

        {/* Form */}
        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-medium text-[#007d40]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleInputChange}
                className="mt-2 appearance-none relative block w-full px-4 py-4 border border-[#e0e0e0]/70 placeholder-[#0097b2]/60 text-[#18181b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:z-10 text-base transition-all duration-200 bg-white/60 backdrop-blur-lg"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-base font-medium text-[#007d40]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={form.password}
                onChange={handleInputChange}
                className="mt-2 appearance-none relative block w-full px-4 py-4 border border-[#e0e0e0]/70 placeholder-[#0097b2]/60 text-[#18181b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:z-10 text-base transition-all duration-200 bg-white/60 backdrop-blur-lg"
                placeholder="Enter your password"
              />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-base font-medium text-[#007d40]">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-2 appearance-none relative block w-full px-4 py-4 border border-[#e0e0e0]/70 placeholder-[#0097b2]/60 text-[#18181b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:z-10 text-base transition-all duration-200 bg-white/60 backdrop-blur-lg"
                  placeholder="Confirm your password"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-base">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-medium rounded-lg text-[#fffae2] bg-gradient-to-r from-[#007d40] to-[#0097b2] hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0097b2] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#fffae2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-base text-[#0097b2] hover:text-[#007d40] font-medium transition-colors duration-200"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth; 