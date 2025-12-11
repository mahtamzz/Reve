import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  email: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/me", {
          method: "GET",
          credentials: "include", 
        });

        if (!res.ok) {
          console.error("ME ERROR STATUS:", res.status);

          if (res.status === 401 || res.status === 403) {
            navigate("/login", { replace: true });
          }
          return;
        }

        const data = await res.json();
        console.log("ME RESPONSE (user dashboard):", data);

        // بسته به اینکه بک‌اند چی برمی‌گردونه:
        // اگر { id, username, email }:
        // setUser(data);
        // اگر { user: {...} }:
        setUser(data.user ?? data);
      } catch (err) {
        console.error("ME REQUEST FAILED:", err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-loginbg font-serif text-brand-text flex items-center justify-center">
        <p className="text-creamtext">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-loginbg font-serif text-brand-text flex items-center justify-center">
        <p className="text-creamtext">
          No user information available. Please login again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
      <h1 className="mt-10 text-2xl text-creamtext">
        inja masalan Dashboard hast
      </h1>

      <div className="mt-6 bg-creamtext text-chocolate rounded-lg px-6 py-4 shadow">
        <p className="text-lg">
          Welcome, <span className="font-semibold">{user.username}</span> 👋
        </p>
        <p className="text-sm text-chocolate/70 mt-1">{user.email}</p>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
