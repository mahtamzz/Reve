import React, { useState } from "react";

const Contactus: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [sentMessage, setSentMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSentMessage("");
    setError("");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, message }),
      });

      const data = await res.json();
      console.log("CONTACT RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSentMessage(
        data.message ||
          "Your message has been sent. We will get back to you soon!"
      );

      setEmail("");
      setMessage("");

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE</div>
      </header>

      {/* Card */}
      <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-8 sm:px-12 py-12 w-full max-w-3xl shadow">
        <h1 className="text-3xl text-chocolate text-center mb-6">Contact Us</h1>

        <p className="text-chocolate/80 text-center mb-8">
          Have a question or feedback? We’d love to hear from you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email input */}
          <div>
            <label className="block text-sm mb-2">Your email</label>
            <input
              type="email"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          {/* Message input */}
          <div>
            <label className="block text-sm mb-2">Message</label>
            <textarea
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 h-24"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessage(e.target.value)
              }
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {/* Success */}
          {sentMessage && (
            <p className="text-green-700 text-sm">{sentMessage}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-chocolate text-creamtext py-3 rounded-md hover:bg-chocolate/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Send"}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Contactus;
