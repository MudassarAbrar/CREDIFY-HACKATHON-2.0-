import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { authApi } from '@/lib/api';
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
  const [userType, setUserType] = useState<'student' | 'professional'>('student');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        // Password reset not implemented in MVP
        toast({
          title: 'Feature coming soon',
          description: 'Password reset will be available in a future update.',
        });
        setMode('signin');
      } else if (mode === 'signup') {
        await authApi.register({ email, password, user_type: userType, full_name: fullName || undefined });
        toast({
          title: 'Account created!',
          description: 'Welcome to Credify!',
        });
        onClose();
        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('auth-state-changed'));
        setTimeout(() => window.location.reload(), 500);
      } else {
        await authApi.login(email, password);
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        onClose();
        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('auth-state-changed'));
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Authentication failed', variant: 'destructive' });
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
      <div className="fixed inset-0 bg-black opacity-50 z-[2999]" onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[3000] shadow-2xl transition-transform duration-300 ${isOpen ? 'animate-slide-in-right' : ''}`}>
        {/* Close button - above everything */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 md:absolute md:top-8 md:right-8 text-white hover:text-gray-300 transition-colors z-[3001] p-2"
        >
          <X size={28} />
        </button>

        <div className="flex flex-col h-full px-8 md:px-10 pt-20 md:pt-24 pb-10 overflow-y-auto">
          <h2 className="text-white text-3xl md:text-4xl font-medium mb-2">{title}</h2>
          <p className="text-gray-400 text-sm mb-8">{subtitle}</p>

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            {mode === 'signup' && (
              <div>
                <label htmlFor="full_name" className="block text-white text-sm font-medium mb-2 uppercase tracking-wide">Full Name (Optional)</label>
                <input
                  id="full_name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#FA76FF] transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="user_type" className="block text-white text-sm font-medium mb-2 uppercase tracking-wide">User Type</label>
                <select
                  id="user_type"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'student' | 'professional')}
                  className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#FA76FF] transition-colors"
                >
                  <option value="student" className="bg-[#1A1A1A]">Student</option>
                  <option value="professional" className="bg-[#1A1A1A]">Professional</option>
                </select>
              </div>
            )}
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
