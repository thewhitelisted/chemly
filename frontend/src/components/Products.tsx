import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Products() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-[#fffae2] via-[#e0f7f4] to-[#f8fafc] flex flex-col items-center font-sans px-0 py-0 pt-24">
      {/* Hero Section */}
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
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              className="text-3xl md:text-5xl font-extrabold mb-6 max-w-6xl lg:max-w-none text-center md:text-left tracking-tight drop-shadow-2xl text-[#18181b]"
            >
              Our <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-2 py-1 rounded-md whitespace-nowrap">Products</span> and <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-2 py-1 rounded-md whitespace-nowrap">Features</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2 }}
              className="text-lg md:text-xl text-[#0097b2] font-medium mb-8 max-w-xl text-center md:text-left"
            >
              Discover the powerful tools we've built to revolutionize organic chemistry workflows.
            </motion.p>
          </div>
          {/* Animated product showcase on the right */}
          <div className="w-full flex justify-center items-center z-10">
            <div className="relative w-[340px] h-[340px]">
              {/* Main product icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#007d40] to-[#0097b2] rounded-3xl shadow-2xl flex items-center justify-center animate-[pulse-product_4s_ease-in-out_infinite]">
                  <span className="text-6xl">🧪</span>
                </div>
              </div>
              
              {/* Orbiting feature icons */}
              <div className="absolute inset-0 animate-[rotate-orbit_20s_linear_infinite]">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center animate-[float-feature1_3s_ease-in-out_infinite]">
                  <span className="text-2xl">✏️</span>
                </div>
              </div>
              
              <div className="absolute inset-0 animate-[rotate-orbit_20s_linear_infinite_reverse]">
                <div className="absolute top-8 right-8 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center animate-[float-feature2_4s_ease-in-out_infinite]">
                  <span className="text-xl">🤖</span>
                </div>
              </div>
              
              <div className="absolute inset-0 animate-[rotate-orbit_15s_linear_infinite]">
                <div className="absolute bottom-8 left-8 w-14 h-14 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center animate-[float-feature3_3.5s_ease-in-out_infinite]">
                  <span className="text-xl">🔍</span>
                </div>
              </div>
              
              <div className="absolute inset-0 animate-[rotate-orbit_18s_linear_infinite_reverse]">
                <div className="absolute bottom-8 right-1/2 translate-x-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center animate-[float-feature4_2.5s_ease-in-out_infinite]">
                  <span className="text-lg">⚡</span>
                </div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#0097b2] rounded-full opacity-60 animate-[float-particle1_6s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#007d40] rounded-full opacity-50 animate-[float-particle2_8s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-[#0097b2] rounded-full opacity-40 animate-[float-particle3_7s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[#007d40] rounded-full opacity-60 animate-[float-particle4_5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mt-20 flex justify-center w-full"
        >
          <a href="#main-products" onClick={e => {
            e.preventDefault();
            const el = document.getElementById('main-products');
            if (el) {
              const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
            className="animate-bounce text-[#0097b2] text-3xl md:text-4xl cursor-pointer hover:text-[#007d40] transition-colors duration-200 focus:outline-none"
            aria-label="Scroll to main products section"
          >
            ↓
          </a>
        </motion.div>
      </section>

      {/* Main Products Section */}
      <section id="main-products" className="w-full py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#007d40] tracking-tight">
              Our <span className="text-[#0097b2]">Flagship Product</span>
            </h2>
            <p className="text-xl text-[#18181b] max-w-3xl mx-auto">
              Experience the future of molecular drawing with our advanced chemical structure editor.
            </p>
          </motion.div>

          {/* Main Product Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border border-[#e0f7f4] mb-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-[#007d40] mb-4">
                  OrgoDraw Molecular Editor
                </h3>
                <p className="text-lg text-[#18181b] mb-6">
                  A powerful, intuitive molecular structure editor designed for organic chemists. 
                  Draw complex molecules with ease using our advanced AI-powered tools and beautiful interface.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <span className="bg-[#e0f7f4] text-[#007d40] px-4 py-2 rounded-full font-semibold text-sm">
                    AI-Powered
                  </span>
                  <span className="bg-[#e0f7f4] text-[#007d40] px-4 py-2 rounded-full font-semibold text-sm">
                    Real-time Validation
                  </span>
                  <span className="bg-[#e0f7f4] text-[#007d40] px-4 py-2 rounded-full font-semibold text-sm">
                    SMILES Export
                  </span>
                  <span className="bg-[#e0f7f4] text-[#007d40] px-4 py-2 rounded-full font-semibold text-sm">
                    Dark Mode
                  </span>
                </div>
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#007d40] to-[#0097b2] text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Try It Now →
                </Link>
              </div>
              <div className="bg-gradient-to-br from-[#e0f7f4] to-[#fffae2] rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧪</div>
                  <p className="text-[#007d40] font-semibold">Interactive Demo</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#007d40] tracking-tight">
              Powerful <span className="text-[#0097b2]">Features</span>
            </h2>
            <p className="text-xl text-[#18181b] max-w-3xl mx-auto">
              Everything you need for efficient molecular design and analysis.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "✏️",
                title: "Intuitive Drawing",
                description: "Draw molecules naturally with our smart drawing tools. Add atoms, bonds, and functional groups with just a few clicks.",
                color: "#007d40"
              },
              {
                icon: "🤖",
                title: "AI Assistance",
                description: "Let AI help you complete structures, suggest optimizations, and validate your molecular designs in real-time.",
                color: "#0097b2"
              },
              {
                icon: "🔍",
                title: "Structure Validation",
                description: "Automatic validation ensures your molecules are chemically sound and properly formatted.",
                color: "#007d40"
              },
              {
                icon: "📊",
                title: "SMILES Integration",
                description: "Export and import structures using SMILES notation for seamless integration with other chemistry tools.",
                color: "#0097b2"
              },
              {
                icon: "🌙",
                title: "Dark Mode",
                description: "Work comfortably in any lighting condition with our beautiful dark mode interface.",
                color: "#007d40"
              },
              {
                icon: "⚡",
                title: "Real-time Updates",
                description: "See changes instantly as you build and modify molecular structures with live preview.",
                color: "#0097b2"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/80 hover:backdrop-blur-xl cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{feature.icon}</span>
                  <span className="font-bold text-xl" style={{ color: feature.color }}>
                    {feature.title}
                  </span>
                </div>
                <span className="text-[#18181b] text-lg">
                  {feature.description}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#007d40] tracking-tight">
              Coming <span className="text-[#0097b2]">Soon</span>
            </h2>
            <p className="text-xl text-[#18181b] max-w-3xl mx-auto">
              We're constantly innovating. Here's what we're working on next.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: "🧬",
                title: "Reaction Planning",
                description: "AI-powered reaction planning and synthesis route optimization for complex organic molecules.",
                status: "In Development"
              },
              {
                icon: "🔬",
                title: "Lab Integration",
                description: "Seamless integration with laboratory equipment and data management systems.",
                status: "Planned"
              },
              {
                icon: "🔬",
                title: "Spectroscopy Tools",
                description: "Integrated NMR, IR, and mass spectrometry prediction and analysis tools.",
                status: "Research Phase"
              },
              {
                icon: "👥",
                title: "Collaboration Features",
                description: "Real-time collaboration tools for research teams and educational institutions.",
                status: "Planned"
              }
            ].map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-[#e0f7f4] flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-[#0097b2] hover:bg-white/60 hover:backdrop-blur-xl cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{product.icon}</span>
                    <span className="font-bold text-xl text-[#007d40]">
                      {product.title}
                    </span>
                  </div>
                  <span className="bg-[#e0f7f4] text-[#0097b2] px-3 py-1 rounded-full text-sm font-semibold">
                    {product.status}
                  </span>
                </div>
                <span className="text-[#18181b] text-lg">
                  {product.description}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse-product {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(2deg); }
          50% { transform: scale(1.1) rotate(0deg); }
          75% { transform: scale(1.05) rotate(-2deg); }
        }
        
        @keyframes rotate-orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes rotate-orbit-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes float-feature1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
        
        @keyframes float-feature2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(0.95); }
        }
        
        @keyframes float-feature3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        
        @keyframes float-feature4 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.15); }
        }
        
        @keyframes float-particle1 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          25% { transform: translateY(-15px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-25px) translateX(0); opacity: 0.4; }
          75% { transform: translateY(-15px) translateX(-10px); opacity: 0.6; }
        }
        
        @keyframes float-particle2 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
          33% { transform: translateY(-20px) translateX(-15px); opacity: 0.7; }
          66% { transform: translateY(-30px) translateX(15px); opacity: 0.3; }
        }
        
        @keyframes float-particle3 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          50% { transform: translateY(-18px) translateX(12px); opacity: 0.6; }
        }
        
        @keyframes float-particle4 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { transform: translateY(-22px) translateX(-8px); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
} 