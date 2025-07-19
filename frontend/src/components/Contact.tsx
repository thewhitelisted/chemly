import { motion } from 'framer-motion';

export default function Contact() {
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
              Get in <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">Touch</span> with Our <span className="inline-block bg-[#e0f7f4] text-[#007d40] font-bold px-3 py-2 rounded-md my-2 whitespace-nowrap">Team</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2 }}
              className="text-lg md:text-xl text-[#0097b2] font-medium mb-8 max-w-xl text-center md:text-left"
            >
              Have questions, feedback, or want to collaborate? We'd love to hear from you.
            </motion.p>
          </div>
          {/* Animated contact icons on the right */}
          <div className="w-full flex justify-center items-center z-10">
            <div className="relative w-[340px] h-[340px]">
              {/* Main contact icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#007d40] to-[#0097b2] rounded-3xl shadow-2xl flex items-center justify-center animate-[pulse-contact_4s_ease-in-out_infinite]">
                  <span className="text-6xl">💬</span>
                </div>
              </div>
              
              {/* Floating contact method icons */}
              <div className="absolute inset-0 animate-[rotate-orbit_25s_linear_infinite]">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center animate-[float-contact1_3s_ease-in-out_infinite]">
                  <span className="text-2xl">📧</span>
                </div>
              </div>
              
              <div className="absolute inset-0 animate-[rotate-orbit_25s_linear_infinite_reverse]">
                <div className="absolute top-8 right-8 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center animate-[float-contact2_4s_ease-in-out_infinite]">
                  <span className="text-xl">💻</span>
                </div>
              </div>
              
              <div className="absolute inset-0 animate-[rotate-orbit_20s_linear_infinite]">
                <div className="absolute bottom-8 left-8 w-14 h-14 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center animate-[float-contact3_3.5s_ease-in-out_infinite]">
                  <span className="text-xl">🤝</span>
                </div>
              </div>
              
              <div className="absolute inset-0 animate-[rotate-orbit_22s_linear_infinite_reverse]">
                <div className="absolute bottom-8 right-1/2 translate-x-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center animate-[float-contact4_2.5s_ease-in-out_infinite]">
                  <span className="text-lg">💡</span>
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
          <a href="#contact-form" onClick={e => {
            e.preventDefault();
            const el = document.getElementById('contact-form');
            if (el) {
              const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
            className="animate-bounce text-[#0097b2] text-3xl md:text-4xl cursor-pointer hover:text-[#007d40] transition-colors duration-200 focus:outline-none"
            aria-label="Scroll to contact form section"
          >
            ↓
          </a>
        </motion.div>
      </section>

      {/* Contact Information Section */}
      <section id="contact-form" className="w-full py-12 px-4 pb-40">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#007d40] tracking-tight">
              Get in <span className="text-[#0097b2]">Touch</span>
            </h2>
            <p className="text-xl text-[#18181b] max-w-3xl mx-auto">
              Have questions, feedback, or want to collaborate? We'd love to hear from you.
            </p>
          </motion.div>

          {/* Compact Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl p-12 md:p-16 border border-[#e0f7f4] max-w-6xl mx-auto"
          >
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-[#007d40] font-semibold text-sm mb-2">Name</label>
                  <input 
                    id="name" 
                    name="name" 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#e0f7f4] bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:outline-none text-base transition-all duration-300 hover:border-[#0097b2] hover:bg-white/90" 
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[#007d40] font-semibold text-sm mb-2">Email</label>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#e0f7f4] bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:outline-none text-base transition-all duration-300 hover:border-[#0097b2] hover:bg-white/90" 
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-[#007d40] font-semibold text-sm mb-2">Subject</label>
                  <select 
                    id="subject" 
                    name="subject" 
                    required 
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#e0f7f4] bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:outline-none text-base transition-all duration-300 hover:border-[#0097b2] hover:bg-white/90"
                  >
                    <option value="">Select subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-[#007d40] font-semibold text-sm mb-2">Message</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={4} 
                  required 
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#e0f7f4] bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#0097b2] focus:border-[#0097b2] focus:outline-none text-base transition-all duration-300 hover:border-[#0097b2] hover:bg-white/90 resize-none" 
                  placeholder="Tell us how we can help you..."
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#007d40] to-[#0097b2] text-white py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#0097b2]/30"
              >
                Send Message →
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <style>{`
        @keyframes pulse-contact {
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
        
        @keyframes float-contact1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
        
        @keyframes float-contact2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(0.95); }
        }
        
        @keyframes float-contact3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        
        @keyframes float-contact4 {
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