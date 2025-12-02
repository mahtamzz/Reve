import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CODE_LENGTH = 6;

export default function Verification() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const navigate = useNavigate();

  function goback(e) {
    e.preventDefault();
    navigate("/");
  }

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) {
      updateCode(index, "");
      return;
    }

    updateCode(index, value.slice(-1));

    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const updateCode = (index, value) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCode = code.join("");
    console.log("Verification code:", finalCode);
    // اینجا کال API یا IAM رو می‌زنی
  };

  return (
    <div className="min-h-screen bg-loginbg flex flex-col justify-center items-center px-4">
      <main className="w-full max-w-xl">
        <div className="bg-creamtext w-full rounded-md shadow px-8 md:px-16 py-10">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-loginbg flex items-center justify-center shadow-md border border-creamtext/40">
              <svg
                className="w-6 h-6 text-creamtext"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                <polyline points="3,7 12,13 21,7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[10px] tracking-[0.35em] text-chocolate/70 mb-1">
                REVE
              </p>
              <h1 className="tracking-wide text-base md:text-lg font-semibold text-chocolate">
                VERIFY YOUR EMAIL ADDRESS
              </h1>
            </div>
          </div>

          <hr className="mb-6 border-chocolate/10" />

          {/* متن توضیحی */}
          <div className="text-sm text-brand-text mb-6 space-y-1 text-center md:text-left">
            <p>
              A verification code has been sent to{" "}
              <span className="font-semibold">your-email@example.com</span>
            </p>
            <p>
              Please check your inbox and enter the verification code below to
              verify your email address. The code will expire in{" "}
              <span className="font-semibold">00:00</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 md:gap-3 mb-6">
              {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[index]}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 md:w-12 md:h-14 border border-chocolate/30 rounded-md text-center text-lg md:text-xl tracking-widest bg-white
                             focus:outline-none focus:ring-2 focus:ring-niceblue focus:border-niceblue"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-chocolate hover:bg-chocolate/90 text-creamtext font-medium py-2.5 rounded-md transition-colors"
            >
              Verify
            </button>
          </form>

          <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-5 text-sm">
            <button
              type="button"
              className="text-niceblue hover:underline"
            >
              Resend code
            </button>
            <span className="hidden md:inline text-gray-400">|</span>
            <button
              type="button"
              className="text-niceblue hover:underline"
            >
              Change email
            </button>
          </div>

          <div className="mt-8 text-center text-sm">
            <button
              onClick={goback}
              type="button"
              className="text-niceblue hover:underline"
            >
              Back to previous page
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
