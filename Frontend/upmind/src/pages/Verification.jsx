import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VerificationView from "@/components/Verification/Verification";
import React from "react";

const CODE_LENGTH = 6;
const OTP_DURATION = 10 * 60;
const getOtpExpiryKey = (email) => `otpExpiry_${email}`;

 function VerificationPage() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const from = location.state?.from; 

  const [timeLeft, setTimeLeft] = useState(0);
  const [otpInitialized, setOtpInitialized] = useState(false);

  // ------------------ INIT OTP ------------------
  useEffect(() => {
    if (!email) return;

    const key = getOtpExpiryKey(email);
    const storedExpiry = localStorage.getItem(key);
    const now = Date.now();

    if (storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      const diff = Math.floor((expiry - now) / 1000);

      if (diff > 0) {
        setTimeLeft(diff);
        setOtpInitialized(true);
        return;
      }
    }

    if (from === "signup") {
      const newExpiry = Date.now() + OTP_DURATION * 1000;
      localStorage.setItem(key, String(newExpiry));
      setTimeLeft(OTP_DURATION);
      setOtpInitialized(true);
      return;
    }

    const sendInitialOtp = async () => {
      try {
        await handleResend();
      } finally {
        setOtpInitialized(true);
      }
    };

    sendInitialOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, from]);

  // ------------------ TIMER LOGIC ------------------
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const isExpired = otpInitialized && timeLeft <= 0;

  // ------------------ AUTO FOCUS ON FIRST INPUT ------------------
  useEffect(() => {
    if (otpInitialized && !isExpired) {
      inputsRef.current[0]?.focus();
    }
  }, [otpInitialized, isExpired]);

  // circle progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / OTP_DURATION;
  const strokeDashoffset = circumference * (1 - progress);

  function goback(e) {
    e.preventDefault();
    navigate("/");
  }

  // ------------------ CODE INPUT HANDLERS ------------------
  const updateCode = (index, value) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (!value) {
      updateCode(index, "");
      return;
    }

    const digit = value.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (index === CODE_LENGTH - 1) {
      const finalCode = newCode.join("");

      if (finalCode.length === CODE_LENGTH) {
        handleSubmit(undefined, finalCode);
      }
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

  // ------------------ RESEND ------------------
  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendMessage("");

    if (!email) {
      setError("no email found to resend code");
      return;
    }

    try {
      setResendLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("RESEND OTP RESPONSE:", data);

      if (!res.ok) {
        setError(data.message || data.error || "could not resend code");
        return;
      }

      setResendMessage(
        data.message || "A new code has been sent to your email."
      );

      const newExpiry = Date.now() + OTP_DURATION * 1000;
      const key = getOtpExpiryKey(email);
      localStorage.setItem(key, String(newExpiry));
      setTimeLeft(OTP_DURATION);
    } catch (err) {
      console.error(err);
      setError("there is a problem while resending code");
    } finally {
      setResendLoading(false);
    }
  };

  // ------------------ SUBMIT (VERIFY) ------------------
  const handleSubmit = async (e, overrideCode) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (isExpired) {
      setError("code has expired, please resend a new one.");
      return;
    }

    const finalCode = overrideCode ?? code.join("");

    if (!email) {
      setError("no such email found");
      return;
    }

    if (finalCode.length !== CODE_LENGTH) {
      setError("it has to be 6 digits!");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: finalCode,
        }),
      });

      const data = await res.json();
      console.log("VERIFY RESPONSE:", data);

      if (!res.ok) {
        setError(data.message || "invalid code");
        return;
      }

      setSuccess("email validated successfully");

      const token = data.token;
      if (token) {
        localStorage.setItem("token", token);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("there is a problem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VerificationView
      CODE_LENGTH={CODE_LENGTH}
      code={code}
      inputsRef={inputsRef}
      minutes={minutes}
      seconds={seconds}
      isExpired={isExpired}
      error={error}
      success={success}
      resendMessage={resendMessage}
      loading={loading}
      resendLoading={resendLoading}
      radius={radius}
      circumference={circumference}
      strokeDashoffset={strokeDashoffset}
      handleChange={handleChange}
      handleKeyDown={handleKeyDown}
      handleSubmit={handleSubmit}
      handleResend={handleResend}
      goback={goback}
      email={email}
    />
  );
}
export default React.memo(VerificationPage)
