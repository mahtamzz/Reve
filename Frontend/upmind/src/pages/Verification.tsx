import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VerificationView from "@/components/Verification/Verification";

const CODE_LENGTH = 6;
const OTP_DURATION = 10 * 60; // seconds

const getOtpExpiryKey = (email: string): string => `otpExpiry_${email}`;

type LocationState = {
  email?: string;
  from?: string;
};

const VerificationPage: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string>("");

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const email = location.state?.email;
  const from = location.state?.from;

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [otpInitialized, setOtpInitialized] = useState<boolean>(false);

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

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(interval);
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

  function goback(e: React.MouseEvent) {
    e.preventDefault();
    navigate("/");
  }

  // ------------------ CODE INPUT HANDLERS ------------------
  const updateCode = (index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        void handleSubmit(undefined, finalCode);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
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
  const handleResend = async (): Promise<void> => {
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
  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement>,
    overrideCode?: string
  ): Promise<void> => {
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
          email,
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

      const token = data.token as string | undefined;
      if (token) {
        localStorage.setItem("token", token);
      }

      try {
        const meRes = await fetch("http://localhost:8080/api/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${data.token}`,
            "Content-Type": "application/json"
          }
        });
    
        const meData = await meRes.json();
        console.log("ME RESPONSE:", meData);
    
        if (!meRes.ok) {
          setError("Could not fetch user info. Token may be invalid.");
          return;
        }
    
        localStorage.setItem("user", JSON.stringify(meData.user));
    
        navigate("/dashboard");

    
      } catch (err) {
        console.error(err);
        setError("Network error while verifying token.");
      }
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
};

export default React.memo(VerificationPage);
