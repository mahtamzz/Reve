import { useState } from "react";

export default function Contactus() {
  const [messageSent, setMessageSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessageSent(true);

  };

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">

      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE</div>
      </header>

      <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-8 sm:px-12 py-12 w-full max-w-3xl shadow">
        <h1 className="text-3xl text-chocolate text-center mb-6">Contact Us</h1>

        <p className="text-chocolate/80 text-center mb-8">
          Have a question or feedback? We’d love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Your email</label>
            <input
              type="email"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Message</label>
            <textarea
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 h-24"
              required
            />
          </div>

          {messageSent && (
            <p className="text-green-700 text-sm">
              Your message has been sent. We will get back to you soon!
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-chocolate text-creamtext py-3 rounded-md hover:bg-chocolate/90 transition-colors"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
