import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthSheet } from './AuthSheet';

export const Navbar: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/clip', label: 'Clipper' },
  ];

  return createPortal(
    <>
      <nav className="fixed top-8 left-4 right-4 md:left-8 md:right-8 z-[2000] flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-0">
          <div className="bg-foreground text-background h-[34px] w-[34px] border border-foreground flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative overflow-hidden h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-foreground leading-none group ${
                location.pathname === link.to
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground'
              }`}
            >
              <span className="relative z-10">{link.label}</span>
              {location.pathname !== link.to && (
                <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              )}
            </Link>
          ))}
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-0">
          {user ? (
            <>
              <div className="h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-foreground bg-background text-foreground">
                <User className="w-3.5 h-3.5 mr-1.5" />
                {user.email?.split('@')[0]}
              </div>
              <button
                onClick={handleLogout}
                className="relative overflow-hidden h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-foreground bg-background text-foreground leading-none group"
              >
                <span className="relative z-10">Logout</span>
                <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="relative overflow-hidden h-[34px] px-4 flex items-center text-[11px] font-medium uppercase border border-foreground bg-foreground text-background leading-none group"
            >
              <span className="relative z-10">Sign In</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          )}
        </div>
      </nav>
      <AuthSheet isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>,
    document.body
  );
};
