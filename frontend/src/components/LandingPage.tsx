import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffae2] via-[#e0f7f4] to-[#f8fafc] flex flex-col font-sans pt-24">
      {/* Modern Glassy Navbar */}
      {/* Navbar removed: now global in App.tsx */}
      {/* Hero Section with WOW factor */}
      <section className="relative flex flex-col items-center justify-center flex-1 px-4 py-20 md:py-32 overflow-hidden">
        {/* Animated background gradient and shapes */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#0097b2]/60 via-[#007d40]/70 to-[#fffae2]/0 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#fffae2]/80 via-[#0097b2]/40 to-[#007d40]/0 rounded-full blur-2xl opacity-80 animate-pulse-slower" />
          <svg className="absolute left-1/2 top-0 -translate-x-1/2" width="800" height="120" fill="none" viewBox="0 0 800 120"><path d="M0 60 Q200 0 400 60 T800 60 V120 H0Z" fill="#0097b2" fillOpacity="0.08"/></svg>
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-[4.25rem] font-black text-center tracking-tight text-[#18181b] drop-shadow-xl mb-8 animate-fade-in-up">
          <div>Smarter tools for a new era of chemistry</div>
          <div className="mt-4 text-xl md:text-2xl lg:text-3xl font-medium text-[#0097b2]">powered by AI, inspired by academics, built for the future.</div>
        </h1>
        <div className="mt-10 flex flex-col items-center gap-6 animate-fade-in-up delay-200">
          <Link
            to="/app"
            className="inline-block bg-gradient-to-r from-[#007d40] to-[#0097b2] text-[#fffae2] px-10 py-4 rounded-full font-extrabold text-2xl shadow-2xl hover:scale-105 hover:shadow-3xl transition-transform duration-200 border-4 border-white/40"
          >
            {user ? 'Launch OrgoDraw' : 'Try OrgoDraw today'}
          </Link>
          {!user && (
            <p className="text-[#007d40] text-lg font-medium">
              Sign up for free and get 100 API calls per month
            </p>
          )}
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full mt-auto py-4 px-4 bg-transparent backdrop-blur-sm border-t border-[#e0f7f4]/50 text-center text-[#007d40] font-normal text-sm rounded-t-2xl shadow-none flex items-center justify-center" style={{letterSpacing: '0.01em'}}>
        &copy; {new Date().getFullYear()} OrgoLab. All rights reserved.
      </footer>
      {/* Animations */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1.1s cubic-bezier(.4,0,.2,1) both; }
        .animate-fade-in-up.delay-200 { animation-delay: 0.2s; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
        @keyframes pulse-slower { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        .animate-pulse-slower { animation: pulse-slower 8s ease-in-out infinite; }
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
    </div>
  );
} 