export default function Contact() {
  return (
    <div className="min-h-[80vh] bg-[#fffae2] flex flex-col items-center justify-center font-sans px-4 py-16 pt-24">
      <div className="bg-white/80 rounded-2xl shadow-xl p-8 max-w-xl w-full flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#007d40] mb-4">Contact Us</h2>
        <p className="text-lg text-gray-800 text-center mb-6">
          Have questions, feedback, or want to collaborate? Reach out to the OrgoLab team below!
        </p>
        <form className="w-full space-y-5 mb-6">
          <div>
            <label htmlFor="name" className="block text-[#007d40] font-semibold mb-1">Name</label>
            <input id="name" name="name" type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#0097b2] focus:outline-none text-base" />
          </div>
          <div>
            <label htmlFor="email" className="block text-[#007d40] font-semibold mb-1">Email</label>
            <input id="email" name="email" type="email" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#0097b2] focus:outline-none text-base" />
          </div>
          <div>
            <label htmlFor="message" className="block text-[#007d40] font-semibold mb-1">Message</label>
            <textarea id="message" name="message" rows={4} required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#0097b2] focus:outline-none text-base" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-[#007d40] to-[#0097b2] text-[#fffae2] py-2.5 rounded-full font-bold text-lg shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-150">Send Message</button>
        </form>
        <div className="text-[#0097b2] font-semibold text-base text-center">
          OrgoLab, Inc.<br />
          contact@orgolab.com<br />
          123 Science Ave, Innovation City, USA
        </div>
      </div>
    </div>
  );
} 