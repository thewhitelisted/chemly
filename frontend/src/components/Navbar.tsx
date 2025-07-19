import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="w-full fixed top-4 md:top-6 left-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3 rounded-2xl shadow-xl bg-white/60 backdrop-blur-lg border border-[#e0e0e0]/70 ring-1 ring-[#0097b2]/10 transition-all duration-300">
        <div className="flex items-center gap-3 select-none">
          <span className="text-2xl font-extrabold tracking-tight drop-shadow-[0_1px_4px_#0097b2aa]">
            <span className="text-[#007d40]">Orgo</span>
            <span className="text-[#0097b2]">Lab</span>
          </span>
        </div>
        {/* Desktop nav */}
        <div className="hidden md:flex gap-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-5 py-2 rounded-full font-semibold text-base transition-all duration-450 ease-[cubic-bezier(0.4,0,0.2,1)]
                group/navbtn
                ${location.pathname === link.to
                  ? 'bg-gradient-to-r from-[#007d40] to-[#0097b2] text-[#fffae2] shadow-lg'
                  : 'text-[#007d40] hover:text-[#fffae2] hover:bg-gradient-to-r hover:from-[#007d40] hover:to-[#0097b2] hover:shadow-2xl hover:scale-105'}
              `}
              style={{ transitionProperty: 'background, color, box-shadow, transform' }}
            >
              <span className="relative z-10">{link.label}</span>
              <span className={`absolute left-1/2 bottom-1 -translate-x-1/2 w-2/3 h-1 rounded-full bg-gradient-to-r from-[#007d40] to-[#0097b2] opacity-0 group-hover/navbtn:opacity-100 nav-underline-fade ${location.pathname === link.to ? 'opacity-100' : ''}`}></span>
            </Link>
          ))}
        </div>
        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg border border-[#e0e0e0]/70 bg-white/60 backdrop-blur-lg shadow hover:shadow-lg transition-all"
          aria-label="Open menu"
          onClick={() => setMenuOpen(m => !m)}
        >
          <span className={`block w-6 h-0.5 bg-[#007d40] rounded transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#0097b2] rounded mt-1 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-[#007d40] rounded mt-1 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute left-0 right-0 mx-2 mt-2 rounded-2xl shadow-2xl bg-white/90 backdrop-blur-lg border border-[#e0e0e0]/70 ring-1 ring-[#0097b2]/10 flex flex-col items-center py-4 z-40 animate-fade-in-up gap-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`w-11/12 text-center py-3 rounded-full text-lg font-semibold transition-all duration-450 ease-[cubic-bezier(0.4,0,0.2,1)]
                group/navbtn
                ${location.pathname === link.to
                  ? 'bg-gradient-to-r from-[#007d40] to-[#0097b2] text-[#fffae2] shadow-lg'
                  : 'text-[#007d40] hover:text-[#fffae2] hover:bg-gradient-to-r hover:from-[#007d40] hover:to-[#0097b2] hover:shadow-2xl hover:scale-105'}
              `}
              style={{ transitionProperty: 'background, color, box-shadow, transform' }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
      <style>{`
        .nav-underline-fade {
          transition-property: opacity;
          transition-duration: 450ms;
          transition-timing-function: cubic-bezier(0.4,0,0.2,1);
        }
        .group-hover\/navbtn .nav-underline-fade {
          transition-duration: 450ms;
        }
        .group\/navbtn:not(:hover) .nav-underline-fade {
          transition-duration: 150ms;
        }
      `}</style>
    </nav>
  );
} 