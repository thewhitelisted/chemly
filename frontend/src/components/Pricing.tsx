import { motion } from 'framer-motion';
import { 
  Check, 
  Star, 
  Zap, 
  Users, 
  ArrowDown,
  Crown,
  Sparkles,
  Shield,
  Globe,
  Clock,
  MessageCircle
} from 'lucide-react';

// Product configuration - easily scalable for new products
const PRODUCTS = {
  orgodraw: {
    name: "OrgoDraw",
    tagline: "AI-powered molecular drawing",
    description: "The next generation of molecular structure drawing, powered by artificial intelligence.",
    icon: Zap,
    color: "#007d40",
    accentColor: "#0097b2",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Try OrgoDraw for free",
        features: [
          "Basic molecular drawing tools",
          "Community support",
          "5 named structures per week"
        ],
        limitations: [
          "Basic features only"
        ],
        cta: "Get Started Free",
        popular: false
      },
      {
        name: "Monthly",
        price: "$5.99",
        period: "per month",
        description: "Flexible monthly billing",
        features: [
          "Everything in Free",
          "Advanced AI features",
          "Export to multiple formats",
          "Priority support",
          "1000 named structures per week"
        ],
        limitations: [],
        cta: "Start Monthly",
        popular: false
      },
      {
        name: "4 Months",
        price: "$4.99",
        period: "per month",
        description: "Most popular for students",
        features: [
          "Everything in Free",
          "Advanced AI features",
          "Export to multiple formats",
          "Priority support",
          "1000 named structures per week"
        ],
        limitations: [],
        cta: "Start 4-Month Plan",
        popular: true
      },
      {
        name: "Annual",
        price: "$4.50",
        period: "per month",
        description: "Best value with yearly billing",
        features: [
          "Everything in Free",
          "Advanced AI features",
          "Export to multiple formats",
          "Priority support",
          "1000 named structures per week"
        ],
        limitations: [],
        cta: "Start Annual Plan",
        popular: false
      }
    ]
  }
  // Easy to add new products here:
  // newproduct: {
  //   name: "NewProduct",
  //   tagline: "Product description",
  //   plans: [...]
  // }
};

// Feature comparison configuration
const FEATURE_COMPARISON = {
  orgodraw: {
    features: [
      {
        name: "Molecular Drawing",
        description: "Advanced drawing tools with AI assistance",
        free: "Basic",
        paid: "Advanced"
      },
      {
        name: "AI Suggestions",
        description: "Intelligent structure completion and validation",
        free: "Not available",
        paid: "Advanced"
      },
      {
        name: "Export Formats",
        description: "File formats you can export to",
        free: "Not available",
        paid: "PNG, SVG, PDF, SMILES, MOL"
      },
      {
        name: "Support",
        description: "Customer support level",
        free: "Community",
        paid: "Priority email"
      },
      {
        name: "Naming",
        description: "Molecular naming capabilities",
        free: "5 per week",
        paid: "1000 per week"
      }
    ]
  }
};

export default function Pricing() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-[#fffae2] via-[#e0f7f4] to-[#f8fafc] flex flex-col items-center font-sans px-0 py-0 pt-24">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden min-h-[50vh] md:min-h-[60vh] py-16 md:py-24 px-4 mb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[auto_400px] place-items-center gap-x-16">
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
              className="text-5xl md:text-7xl font-extrabold mb-6 max-w-6xl lg:max-w-none text-center md:text-left tracking-tight text-[#18181b]"
            >
              <span className="text-[#007d40] drop-shadow-[0_1px_4px_#0097b2aa]">Orgo</span><span className="text-[#0097b2] drop-shadow-[0_1px_4px_#0097b2aa]">Lab</span> pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2 }}
              className="text-lg md:text-xl text-[#0097b2] font-medium mb-8 max-w-xl text-center md:text-left"
            >
              Plans built for students, teachers, and researchers.
            </motion.p>
          </div>
          {/* Molecular pricing animation */}
          <div className="w-full flex justify-center items-center z-10">
            <div className="relative w-[400px] h-[400px]">
              {/* Central molecule structure */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Central atom */}
                  <div className="w-24 h-24 bg-gradient-to-br from-[#007d40] to-[#0097b2] rounded-full shadow-2xl animate-[molecule-pulse_3s_ease-in-out_infinite]"></div>
                  
                  {/* Bond lines */}
                  <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-gradient-to-r from-[#007d40] to-[#0097b2] transform -translate-x-1/2 -translate-y-1/2 rotate-0 animate-[bond-rotate1_6s_linear_infinite]"></div>
                  <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-gradient-to-r from-[#0097b2] to-[#007d40] transform -translate-x-1/2 -translate-y-1/2 rotate-60 animate-[bond-rotate2_8s_linear_infinite]"></div>
                  <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-gradient-to-r from-[#007d40] to-[#0097b2] transform -translate-x-1/2 -translate-y-1/2 rotate-120 animate-[bond-rotate3_7s_linear_infinite]"></div>
                  <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-gradient-to-r from-[#0097b2] to-[#007d40] transform -translate-x-1/2 -translate-y-1/2 rotate-180 animate-[bond-rotate4_9s_linear_infinite]"></div>
                  <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-gradient-to-r from-[#007d40] to-[#0097b2] transform -translate-x-1/2 -translate-y-1/2 rotate-240 animate-[bond-rotate5_5s_linear_infinite]"></div>
                  <div className="absolute top-1/2 left-1/2 w-28 h-1 bg-gradient-to-r from-[#0097b2] to-[#007d40] transform -translate-x-1/2 -translate-y-1/2 rotate-300 animate-[bond-rotate6_10s_linear_infinite]"></div>
                  
                  {/* Orbiting electrons */}
                  <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#0097b2] rounded-full shadow-lg animate-[electron-orbit1_4s_linear_infinite] transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-[#007d40] rounded-full shadow-lg animate-[electron-orbit2_6s_linear_infinite] transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-5.5 h-5.5 bg-[#0097b2] rounded-full shadow-lg animate-[electron-orbit3_5s_linear_infinite] transform -translate-x-1/2 -translate-y-1/2"></div>
                  
                  {/* Energy waves */}
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-[#0097b2]/20 rounded-full animate-[wave-expand1_4s_ease-out_infinite] transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-[#007d40]/20 rounded-full animate-[wave-expand2_6s_ease-out_infinite] transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-[#0097b2]/15 rounded-full animate-[wave-expand3_8s_ease-out_infinite] transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
              </div>
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
          <a href="#pricing-plans" onClick={e => {
            e.preventDefault();
            const el = document.getElementById('pricing-plans');
            if (el) {
              const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
            className="animate-bounce text-[#0097b2] cursor-pointer hover:text-[#007d40] transition-colors duration-200 focus:outline-none"
            aria-label="Scroll to pricing plans section"
          >
            <ArrowDown className="w-8 h-8 md:w-10 md:h-10" />
          </a>
        </motion.div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing-plans" className="w-full py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Product Pricing Cards */}
          {Object.entries(PRODUCTS).map(([productKey, product]) => {
            const ProductIcon = product.icon;
            return (
              <motion.div
                key={productKey}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mb-20"
              >
                {/* Product Header */}
                <div className="text-center mb-12">
                  <div className="mb-4">
                    <h3 className="text-4xl font-bold text-[#18181b]">{product.name}</h3>
                  </div>
                  <p className="text-xl text-[#0097b2] font-medium">{product.tagline}</p>
                  <p className="text-lg text-[#18181b] opacity-80 mt-2">{product.description}</p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
                  {product.plans.map((plan, index) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.7, delay: 0.3 + index * 0.1 }}
                      className={`relative bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                        plan.popular 
                          ? 'border-[#0097b2] shadow-[#0097b2]/20' 
                          : 'border-[#e0f7f4] hover:border-[#0097b2]'
                      }`}
                    >
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <div className="bg-gradient-to-r from-[#007d40] to-[#0097b2] text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Most Popular
                          </div>
                        </div>
                      )}

                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <h4 className="text-xl font-bold text-[#18181b] mb-2">{plan.name}</h4>
                        <div className="mb-3">
                          <span className="text-3xl font-bold text-[#007d40]">{plan.price}</span>
                          {plan.period !== "forever" && (
                            <span className="text-sm text-[#18181b] opacity-60">/{plan.period}</span>
                          )}
                        </div>
                        <p className="text-[#0097b2] font-medium text-sm">{plan.description}</p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#007d40] mt-0.5 flex-shrink-0" />
                            <span className="text-[#18181b] text-xs">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Limitations */}
                      {plan.limitations.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <p className="text-xs font-medium text-[#18181b] opacity-60">Limitations:</p>
                          {plan.limitations.map((limitation, limitationIndex) => (
                            <div key={limitationIndex} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-[#18181b] opacity-40 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span className="text-[#18181b] opacity-60 text-xs">{limitation}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTA Button */}
                      <button 
                        className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-[#007d40] to-[#0097b2] text-white hover:shadow-xl hover:scale-105'
                            : 'bg-white/80 text-[#007d40] border-2 border-[#007d40] hover:bg-[#007d40] hover:text-white hover:scale-105'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section className="w-full py-20 px-4 bg-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-[#007d40] tracking-tight">
              Feature <span className="text-[#0097b2]">Comparison</span>
            </h2>
            <p className="text-xl text-[#18181b] max-w-3xl mx-auto">
              See exactly what's included in each plan to make the best choice for your needs.
            </p>
          </motion.div>

          {/* Feature Comparison Table */}
          {Object.entries(FEATURE_COMPARISON).map(([productKey, comparison]) => (
            <motion.div
              key={productKey}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-[#e0f7f4]"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#007d40] to-[#0097b2] text-white">
                      <th className="px-6 py-4 text-left font-bold">Feature</th>
                      <th className="px-6 py-4 text-center font-bold">Free</th>
                      <th className="px-6 py-4 text-center font-bold">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.features.map((feature, index) => (
                      <tr key={index} className={`border-b border-[#e0f7f4] ${index % 2 === 0 ? 'bg-white/40' : 'bg-white/20'}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-[#18181b]">{feature.name}</div>
                            <div className="text-sm text-[#18181b] opacity-60">{feature.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-[#18181b]">{feature.free}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-[#18181b]">{feature.paid}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-r from-[#007d40] to-[#0097b2] rounded-3xl p-12 text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of chemists who are already using OrgoDraw to create amazing molecular structures.
            </p>
            <div className="flex justify-center">
              <button className="bg-white text-[#007d40] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
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
        @keyframes molecule-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        @keyframes bond-rotate1 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scaleX(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scaleX(1.2); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scaleX(1); }
        }
        
        @keyframes bond-rotate2 {
          0% { transform: translate(-50%, -50%) rotate(60deg) scaleX(1); }
          50% { transform: translate(-50%, -50%) rotate(240deg) scaleX(1.1); }
          100% { transform: translate(-50%, -50%) rotate(420deg) scaleX(1); }
        }
        
        @keyframes bond-rotate3 {
          0% { transform: translate(-50%, -50%) rotate(120deg) scaleX(1); }
          50% { transform: translate(-50%, -50%) rotate(300deg) scaleX(1.3); }
          100% { transform: translate(-50%, -50%) rotate(480deg) scaleX(1); }
        }
        
        @keyframes bond-rotate4 {
          0% { transform: translate(-50%, -50%) rotate(180deg) scaleX(1); }
          50% { transform: translate(-50%, -50%) rotate(360deg) scaleX(1.1); }
          100% { transform: translate(-50%, -50%) rotate(540deg) scaleX(1); }
        }
        
        @keyframes bond-rotate5 {
          0% { transform: translate(-50%, -50%) rotate(240deg) scaleX(1); }
          50% { transform: translate(-50%, -50%) rotate(420deg) scaleX(1.2); }
          100% { transform: translate(-50%, -50%) rotate(600deg) scaleX(1); }
        }
        
        @keyframes bond-rotate6 {
          0% { transform: translate(-50%, -50%) rotate(300deg) scaleX(1); }
          50% { transform: translate(-50%, -50%) rotate(480deg) scaleX(1.1); }
          100% { transform: translate(-50%, -50%) rotate(660deg) scaleX(1); }
        }
        
        @keyframes electron-orbit1 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(80px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(80px) rotate(-360deg); }
        }
        
        @keyframes electron-orbit2 {
          0% { transform: translate(-50%, -50%) rotate(120deg) translateX(100px) rotate(-120deg); }
          100% { transform: translate(-50%, -50%) rotate(480deg) translateX(100px) rotate(-480deg); }
        }
        
        @keyframes electron-orbit3 {
          0% { transform: translate(-50%, -50%) rotate(240deg) translateX(90px) rotate(-240deg); }
          100% { transform: translate(-50%, -50%) rotate(600deg) translateX(90px) rotate(-600deg); }
        }
        
        @keyframes wave-expand1 {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        
        @keyframes wave-expand2 {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
        
        @keyframes wave-expand3 {
          0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
} 