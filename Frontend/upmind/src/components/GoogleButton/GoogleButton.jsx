export default function GoogleButton({ text = "Continue with Google" }) {
    return (
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-3 rounded-md text-gray-700 hover:bg-gray-50 transition"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google Logo"
          className="w-5 h-5"
        />
        <span className="text-sm">{text}</span>
      </button>
    );
  }
  