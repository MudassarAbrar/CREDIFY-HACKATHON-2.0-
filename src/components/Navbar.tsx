import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

export const Navbar: React.FC = () => {
  return createPortal(
    <nav className="fixed top-8 left-4 md:left-8 z-[2000] flex items-center gap-0">
      {/* Logo */}
      <div className="bg-foreground text-background h-[34px] w-[34px] border border-foreground flex items-center justify-center">
        <Scissors className="w-4 h-4" />
      </div>

      {/* Navigation */}
      <div className="flex items-center">
        <Link
          to="/"
          className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-foreground leading-none group"
        >
          <span className="relative z-10">CLIPPER</span>
          <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
        </Link>
      </div>
    </nav>,
    document.body
  );
};
