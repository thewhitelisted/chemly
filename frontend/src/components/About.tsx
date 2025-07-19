import { motion } from 'framer-motion';

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
              <circle cx="170" cy="170" r="120" fill="#e0f7f4" />
              <circle cx="80" cy="80" r="36" fill="#0097b2" fillOpacity="0.7" className="animate-[float-molecule1_6s_ease-in-out_infinite]" />
              <circle cx="240" cy="100" r="24" fill="#007d40" fillOpacity="0.7" className="animate-[float-molecule2_8s_ease-in-out_infinite]" />
              <circle cx="220" cy="240" r="32" fill="#0097b2" fillOpacity="0.5" className="animate-[float-molecule3_7.5s_ease-in-out_infinite]" />
              <circle cx="120" cy="230" r="20" fill="#007d40" fillOpacity="0.5" className="animate-[float-molecule4_5.5s_ease-in-out_infinite]" />
              <rect x="150" y="150" width="40" height="8" rx="4" fill="#0097b2" fillOpacity="0.5" transform="rotate(30 170 154)" className="animate-[float-molecule5_7s_ease-in-out_infinite]" />
              <rect x="190" y="200" width="32" height="8" rx="4" fill="#007d40" fillOpacity="0.5" transform="rotate(-20 206 204)" className="animate-[float-molecule6_6.5s_ease-in-out_infinite]" />
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
            className="animate-bounce text-[#0097b2] text-3xl md:text-4xl cursor-pointer hover:text-[#007d40] transition-colors duration-200 focus:outline-none"
            aria-label="Scroll to Mission & Values section"
          >
            ↓
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
                <span className="text-3xl">🎨</span>
                <span className="font-bold text-[#007d40] text-xl">Beautiful by Design</span>
              </div>
              <span className="text-[#18181b] text-lg">We are committed to making research tools that are visually stunning and easy to use.</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/80 hover:backdrop-blur-xl cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🤖</span>
                <span className="font-bold text-[#0097b2] text-xl">AI Everywhere</span>
              </div>
              <span className="text-[#18181b] text-lg">We harness the latest in artificial intelligence to empower chemists at every step.</span>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/80 hover:backdrop-blur-xl cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🧬</span>
                <span className="font-bold text-[#007d40] text-xl">Cursor for Chemists</span>
              </div>
              <span className="text-[#18181b] text-lg">Our vision is to build the cursor for organic chemistry: intuitive, intelligent, and indispensable.</span>
            </div>
          </motion.div>
        </div>
      </section>
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