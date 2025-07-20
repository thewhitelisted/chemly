import { motion } from 'framer-motion';
import { 
  Palette, 
  Bot, 
  Dna, 
  ArrowDown 
} from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-[#fffae2] via-[#e0f7f4] to-[#f8fafc] flex flex-col items-center font-sans px-0 py-0 pt-24">
      {/* Hero Section - visually engaging */}
      <section className="w-full relative overflow-hidden min-h-[60vh] md:min-h-[80vh] py-24 md:py-36 px-4 mb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[auto_340px] place-items-center gap-x-16">
          {/* Floating molecule SVG background */}
          <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[320px] opacity-30 blur-md z-0 hidden md:block" viewBox="0 0 420 320" fill="none">
            <circle cx="110" cy="160" r="60" fill="#0097b2" fillOpacity="0.18" />
            <circle cx="310" cy="120" r="40" fill="#007d40" fillOpacity="0.13" />
            <circle cx="220" cy="220" r="80" fill="#fffae2" fillOpacity="0.18" />
            <ellipse cx="320" cy="240" rx="30" ry="18" fill="#0097b2" fillOpacity="0.12" />
          </svg>
          <div className="w-full flex flex-col items-center md:items-start text-center md:text-left z-10 px-2 md:px-0">
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              className="text-3xl md:text-5xl font-extrabold mb-6 max-w-6xl lg:max-w-none text-center md:text-left tracking-tight drop-shadow-2xl text-[#18181b]"
            >
              Reimagining <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">chemistry</span> for the <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">next generation</span> of <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">scientists</span>, <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">educators</span>, and <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">innovators</span>.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2 }}
              className="text-lg md:text-xl text-[#0097b2] font-medium mb-8 max-w-xl text-center md:text-left"
            >
              Our mission is to make research-grade tools beautiful, accessible, and a joy to use.
            </motion.p>
          </div>
          {/* Animated molecule SVG on the right */}
          <div className="w-full flex justify-center items-center z-10">
            <svg width="340" height="340" viewBox="0 0 340 340" fill="none" className="animate-[float-molecule_7s_ease-in-out_infinite]">
              {/* Background molecule structure */}
              <circle cx="170" cy="170" r="120" fill="#e0f7f4" fillOpacity="0.3" />
              
              {/* Central atom with gradient effect */}
              <defs>
                <radialGradient id="centralAtom" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#007d40" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0097b2" stopOpacity="0.6" />
                </radialGradient>
                <radialGradient id="atom1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0097b2" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0097b2" stopOpacity="0.4" />
                </radialGradient>
                <radialGradient id="atom2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#007d40" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#007d40" stopOpacity="0.4" />
                </radialGradient>
              </defs>
              
              {/* Central atom */}
              <circle cx="170" cy="170" r="28" fill="url(#centralAtom)" className="animate-[float-molecule1_6s_ease-in-out_infinite] drop-shadow-lg" />
              
              {/* Orbiting atoms */}
              <circle cx="80" cy="80" r="20" fill="url(#atom1)" className="animate-[float-molecule1_6s_ease-in-out_infinite] drop-shadow-md" />
              <circle cx="240" cy="100" r="16" fill="url(#atom2)" className="animate-[float-molecule2_8s_ease-in-out_infinite] drop-shadow-md" />
              <circle cx="220" cy="240" r="18" fill="url(#atom1)" className="animate-[float-molecule3_7.5s_ease-in-out_infinite] drop-shadow-md" />
              <circle cx="120" cy="230" r="14" fill="url(#atom2)" className="animate-[float-molecule4_5.5s_ease-in-out_infinite] drop-shadow-md" />
              
              {/* Bond lines with enhanced styling */}
              <rect x="150" y="150" width="40" height="6" rx="3" fill="#0097b2" fillOpacity="0.7" transform="rotate(30 170 153)" className="animate-[float-molecule5_7s_ease-in-out_infinite] drop-shadow-sm" />
              <rect x="190" y="200" width="32" height="6" rx="3" fill="#007d40" fillOpacity="0.7" transform="rotate(-20 206 203)" className="animate-[float-molecule6_6.5s_ease-in-out_infinite] drop-shadow-sm" />
              
              {/* Additional connecting lines for molecular structure */}
              <line x1="170" y1="170" x2="80" y2="80" stroke="#0097b2" strokeWidth="3" strokeOpacity="0.4" className="animate-[float-molecule1_6s_ease-in-out_infinite]" />
              <line x1="170" y1="170" x2="240" y2="100" stroke="#007d40" strokeWidth="3" strokeOpacity="0.4" className="animate-[float-molecule2_8s_ease-in-out_infinite]" />
              <line x1="170" y1="170" x2="220" y2="240" stroke="#0097b2" strokeWidth="3" strokeOpacity="0.4" className="animate-[float-molecule3_7.5s_ease-in-out_infinite]" />
              <line x1="170" y1="170" x2="120" y2="230" stroke="#007d40" strokeWidth="3" strokeOpacity="0.4" className="animate-[float-molecule4_5.5s_ease-in-out_infinite]" />
            </svg>
          </div>
        </div>
        {/* Scroll cue - always centered below hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mt-20 flex justify-center w-full"
        >
          <a href="#mission-values" onClick={e => {
            e.preventDefault();
            const el = document.getElementById('mission-values');
            if (el) {
              const y = el.getBoundingClientRect().top + window.pageYOffset - 80; // 80px offset
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
            className="animate-bounce text-[#0097b2] cursor-pointer hover:text-[#007d40] transition-colors duration-200 focus:outline-none"
            aria-label="Scroll to Mission & Values section"
          >
            <ArrowDown className="w-8 h-8 md:w-10 md:h-10" />
          </a>
        </motion.div>
      </section>
      {/* Mission & Values Section - Modern Glass Style */}
      <section id="mission-values" className="w-full py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-20">
          {/* Left: Mission Heading and Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center md:items-start text-center md:text-left gap-8"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-2 text-[#007d40] tracking-tight">
              Our <span className="text-[#0097b2]">Mission</span>
            </h2>
            <p className="text-2xl text-[#18181b] font-semibold mb-6 max-w-2xl">
              OrgoLab believes research-grade software shouldn't be an eyesore. Furthermore, we believe now is the time for AI to be used in everything, and are determined to develop cursor for organic chemists.
            </p>
          </motion.div>
          {/* Right: Three Feature Boxes */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-8 w-full"
          >
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/80 hover:backdrop-blur-xl cursor-pointer">
              <div className="flex items-center gap-4">
                <Palette className="w-8 h-8 text-[#007d40]" />
                <span className="font-bold text-[#007d40] text-xl">Beautiful by Design</span>
              </div>
              <span className="text-[#18181b] text-lg">We are committed to making research tools that are visually stunning and easy to use.</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/80 hover:backdrop-blur-xl cursor-pointer">
              <div className="flex items-center gap-4">
                <Bot className="w-8 h-8 text-[#0097b2]" />
                <span className="font-bold text-[#0097b2] text-xl">AI Everywhere</span>
              </div>
              <span className="text-[#18181b] text-lg">We harness the latest in artificial intelligence to empower chemists at every step.</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/80 hover:backdrop-blur-xl cursor-pointer">
              <div className="flex items-center gap-4">
                <Dna className="w-8 h-8 text-[#007d40]" />
                <span className="font-bold text-[#007d40] text-xl">Cursor for Chemists</span>
              </div>
              <span className="text-[#18181b] text-lg">Our vision is to build the cursor for organic chemistry: intuitive, intelligent, and indispensable.</span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full mt-auto bg-transparent backdrop-blur-sm border-t border-[#e0f7f4]/50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-12">
            {/* Section 1: Slogan */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-extrabold tracking-tight drop-shadow-[0_1px_4px_#0097b2aa]">
                  <span className="text-[#007d40]">Orgo</span>
                  <span className="text-[#0097b2]">Lab</span>
                </h3>
                <p className="text-lg text-[#18181b] opacity-80 leading-relaxed">
                  Reimagining chemistry for the next generation of scientists, educators, and innovators.
                </p>
              </div>
            </div>

            {/* Section 2: Product, Company, Support - Horizontal */}
            <div className="space-y-6 ml-8">
              <div className="flex flex-wrap gap-12">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#007d40] uppercase tracking-wide">Product</h4>
                  <ul className="space-y-3">
                    <li><a href="/app" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors text-sm">OrgoDraw</a></li>
                    <li><a href="/pricing" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors text-sm">Pricing</a></li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#007d40] uppercase tracking-wide">Company</h4>
                  <ul className="space-y-3">
                    <li><a href="/about" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors text-sm">About</a></li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#007d40] uppercase tracking-wide">Support</h4>
                  <ul className="space-y-3">
                    <li><a href="/contact" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors text-sm">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3: Newsletter */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#007d40] uppercase tracking-wide">Newsletter</h4>
                <p className="text-sm text-[#18181b] opacity-70">
                  Stay updated with our latest features and chemistry insights.
                </p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 px-4 py-2 text-sm border border-[#e0f7f4] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#0097b2] focus:border-transparent"
                  />
                  <button className="px-4 py-2 bg-[#007d40] text-white text-sm font-medium rounded-r-lg hover:bg-[#0097b2] transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-[#e0f7f4]/50">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-[#18181b] opacity-80">
                &copy; {new Date().getFullYear()} OrgoLab. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors">Privacy Policy</a>
                <a href="#" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors">Terms of Service</a>
                <a href="#" className="text-[#18181b] opacity-80 hover:text-[#0097b2] transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        @keyframes float-molecule {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-32px); }
        }
        @keyframes float-molecule1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px) scale(1.05); }
        }
        @keyframes float-molecule2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-28px) scale(0.97); }
        }
        @keyframes float-molecule3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px) scale(1.08); }
        }
        @keyframes float-molecule4 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px) scale(1.12); }
        }
        @keyframes float-molecule5 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(8deg); }
        }
        @keyframes float-molecule6 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(-10deg); }
        }
      `}</style>
    </div>
  );
} 