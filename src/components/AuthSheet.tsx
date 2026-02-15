import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'A password reset link has been sent to your email.',
        });
        setMode('signin');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({
          title: 'Account created!',
          description: 'Check your email to verify your account.',
        });
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        onClose();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === 'forgot' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Sign In';
  const subtitle = mode === 'forgot'
    ? 'Enter your email to receive a reset link'
    : mode === 'signup'
    ? 'Join us to create and manage your clips'
    : 'Welcome back! Please sign in to continue';

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black opacity-50 z-[1000]" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[1001] shadow-2xl transition-transform duration-300 ${isOpen ? 'animate-slide-in-right' : ''}`}>
        {/* Close button - positioned above navbar z-index */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-gray-300 transition-colors z-[2001] p-2"
        >
          <X size={28} />
        </button>

        <div className="flex flex-col h-full px-8 md:px-10 pt-20 md:pt-24 pb-10 overflow-y-auto">
          <h2 className="text-white text-3xl md:text-4xl font-medium mb-2">{title}</h2>
          <p className="text-gray-400 text-sm mb-8">{subtitle}</p>

          {/* Google Login - not shown on forgot password */}
          {mode !== 'forgot' && (
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 px-6 text-sm hover:bg-gray-100 transition-colors mb-6"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {mode !== 'forgot' && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-gray-500 text-xs uppercase">or</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2 uppercase tracking-wide">Email</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#FA76FF] transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-white text-sm font-medium mb-2 uppercase tracking-wide">Password</label>
                <input
                  id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#FA76FF] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            {mode === 'signin' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-gray-400 hover:text-white transition-colors text-sm text-left -mt-3">
                Forgot password?
              </button>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#FA76FF] text-black font-medium py-3 px-6 uppercase text-sm border border-black hover:bg-[#ff8fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : mode === 'forgot' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'forgot' ? (
              <button onClick={() => setMode('signin')} className="text-gray-400 hover:text-white transition-colors text-sm">
                Back to sign in
              </button>
            ) : (
              <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="text-gray-400 hover:text-white transition-colors text-sm">
                {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
