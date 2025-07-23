import { motion } from 'framer-motion';
import { 
  ArrowDown 
} from 'lucide-react';

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
          {/* Modern geometric animation */}
          <div className="w-full flex justify-center items-center z-10">
            <div className="relative w-[340px] h-[340px]">
              {/* Central geometric shape */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-[#007d40] to-[#0097b2] rounded-2xl shadow-2xl flex items-center justify-center animate-[geometric-rotate_8s_linear_infinite] relative">
                  <div className="w-20 h-20 bg-white/20 rounded-xl"></div>
                </div>
              </div>
              
              {/* Floating geometric elements */}
              <div className="absolute top-12 left-12 w-16 h-16 bg-gradient-to-br from-[#0097b2] to-[#007d40] rounded-full shadow-lg animate-[float-geo1_6s_ease-in-out_infinite]"></div>
              
              <div className="absolute top-16 right-16 w-12 h-12 bg-gradient-to-br from-[#007d40] to-[#0097b2] rounded-lg shadow-lg animate-[float-geo2_7s_ease-in-out_infinite]"></div>
              
              <div className="absolute bottom-16 left-16 w-14 h-14 bg-gradient-to-br from-[#0097b2] to-[#007d40] rounded-xl shadow-lg animate-[float-geo3_5.5s_ease-in-out_infinite]"></div>
              
              <div className="absolute bottom-12 right-12 w-10 h-10 bg-gradient-to-br from-[#007d40] to-[#0097b2] rounded-2xl shadow-lg animate-[float-geo4_6.5s_ease-in-out_infinite]"></div>
              
              {/* Accent lines */}
              <div className="absolute top-1/2 left-1/4 w-1 h-8 bg-gradient-to-b from-[#0097b2] to-transparent animate-[line-grow1_4s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/2 right-1/4 w-1 h-8 bg-gradient-to-b from-[#007d40] to-transparent animate-[line-grow2_4.5s_ease-in-out_infinite]"></div>
              <div className="absolute left-1/2 top-1/4 w-8 h-1 bg-gradient-to-r from-[#0097b2] to-transparent animate-[line-grow3_5s_ease-in-out_infinite]"></div>
              <div className="absolute left-1/2 bottom-1/4 w-8 h-1 bg-gradient-to-r from-[#007d40] to-transparent animate-[line-grow4_5.5s_ease-in-out_infinite]"></div>
              
              {/* Floating particles */}
              <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-[#0097b2] rounded-full opacity-60 animate-[particle-float1_8s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#007d40] rounded-full opacity-60 animate-[particle-float2_9s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 bg-[#0097b2] rounded-full opacity-60 animate-[particle-float3_7s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-[#007d40] rounded-full opacity-60 animate-[particle-float4_10s_ease-in-out_infinite]"></div>
              
              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-6 h-6 border-2 border-[#0097b2]/30 rounded-full animate-[corner-pulse1_3s_ease-in-out_infinite]"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-2 border-[#007d40]/30 rounded-full animate-[corner-pulse2_3.5s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-[#0097b2]/30 rounded-full animate-[corner-pulse3_4s_ease-in-out_infinite]"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-[#007d40]/30 rounded-full animate-[corner-pulse4_4.5s_ease-in-out_infinite]"></div>
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
            className="animate-bounce text-[#0097b2] cursor-pointer hover:text-[#007d40] transition-colors duration-200 focus:outline-none"
            aria-label="Scroll to contact form section"
          >
            <ArrowDown className="w-8 h-8 md:w-10 md:h-10" />
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
        @keyframes geometric-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes float-geo1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        
        @keyframes float-geo2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(12px) scale(0.9); }
        }
        
        @keyframes float-geo3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        
        @keyframes float-geo4 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(8px) scale(0.95); }
        }
        
        @keyframes line-grow1 {
          0% { height: 0; opacity: 0; }
          50% { height: 32px; opacity: 0.6; }
          100% { height: 0; opacity: 0; }
        }
        
        @keyframes line-grow2 {
          0% { height: 0; opacity: 0; }
          50% { height: 36px; opacity: 0.6; }
          100% { height: 0; opacity: 0; }
        }
        
        @keyframes line-grow3 {
          0% { width: 0; opacity: 0; }
          50% { width: 32px; opacity: 0.6; }
          100% { width: 0; opacity: 0; }
        }
        
        @keyframes line-grow4 {
          0% { width: 0; opacity: 0; }
          50% { width: 36px; opacity: 0.6; }
          100% { width: 0; opacity: 0; }
        }
        
        @keyframes particle-float1 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        
        @keyframes particle-float2 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { transform: translateY(15px) translateX(-8px); opacity: 0.8; }
        }
        
        @keyframes particle-float3 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { transform: translateY(-12px) translateX(-5px); opacity: 0.8; }
        }
        
        @keyframes particle-float4 {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          50% { transform: translateY(18px) translateX(6px); opacity: 0.8; }
        }
        
        @keyframes corner-pulse1 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
        
        @keyframes corner-pulse2 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        
        @keyframes corner-pulse3 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.25); opacity: 0.6; }
        }
        
        @keyframes corner-pulse4 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }

        @keyframes geometric-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes float-geo1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-geo2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }

        @keyframes float-geo3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes float-geo4 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        @keyframes line-grow1 {
          0% { height: 0; }
          100% { height: 80px; }
        }

        @keyframes line-grow2 {
          0% { height: 0; }
          100% { height: 90px; }
        }

        @keyframes line-grow3 {
          0% { width: 0; }
          100% { width: 80px; }
        }

        @keyframes line-grow4 {
          0% { width: 0; }
          100% { width: 90px; }
        }

        @keyframes particle-float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes particle-float2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }

        @keyframes particle-float3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes particle-float4 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        @keyframes corner-pulse1 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes corner-pulse2 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes corner-pulse3 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        @keyframes corner-pulse4 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
} 