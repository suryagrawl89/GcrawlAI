import React, { useState } from "react";
import { FiMenu, FiX, FiPlay } from "react-icons/fi";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1140px] mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 text-slate-900 no-underline font-extrabold text-lg tracking-tight">
            <span className="w-9 h-9 rounded-xl bg-[#0b5cad] text-white flex items-center justify-center text-lg shadow-sm">
              ✈️
            </span>
            <span className="flex flex-col">
              <span className="leading-tight">Flight Price Intelligence</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">by Gramosoft</span>
            </span>
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <a href="#live-demo" className="hover:text-[#0b5cad] transition-colors no-underline">
            Price Check
          </a>
          <a href="#how-it-works" className="hover:text-[#0b5cad] transition-colors no-underline">
            How It Works
          </a>
          <a href="#features" className="hover:text-[#0b5cad] transition-colors no-underline">
            Features
          </a>
          <a href="#target-audiences" className="hover:text-[#0b5cad] transition-colors no-underline">
            Who It's For
          </a>
          <a href="#faq" className="hover:text-[#0b5cad] transition-colors no-underline">
            FAQ
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#live-demo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b5cad] hover:bg-[#084787] text-white text-sm font-bold shadow-sm transition-all no-underline"
          >
            <FiPlay className="text-xs" /> Try Live Demo
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 flex flex-col gap-3 shadow-lg">
          <a
            href="#live-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-700 font-semibold text-sm py-2 no-underline"
          >
            Price Check
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-700 font-semibold text-sm py-2 no-underline"
          >
            How It Works
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-700 font-semibold text-sm py-2 no-underline"
          >
            Features
          </a>
          <a
            href="#target-audiences"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-700 font-semibold text-sm py-2 no-underline"
          >
            Who It's For
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-700 font-semibold text-sm py-2 no-underline"
          >
            FAQ
          </a>
          <a
            href="#live-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 w-full text-center py-2.5 rounded-lg bg-[#0b5cad] text-white font-bold text-sm no-underline"
          >
            Try Live Demo
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
