// src/pages/Dashboard.tsx
import React, { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { logout } from "@/utils/authToken";

interface User {
  id: number;
  username: string;
  email: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchMe = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8080/api/users/me");

        if (!res.ok) {
          console.error("ME ERROR STATUS:", res.status);
          await logout();
          return;
        }

        const data = await res.json();
        console.log("ME RESPONSE (user dashboard):", data);

        setUser(data.user ?? data);
      } catch (err) {
        console.error("ME REQUEST FAILED:", err);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

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

      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>

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
