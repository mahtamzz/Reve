// src/pages/DashboardAdmin.tsx
import React, { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { logout_admin } from "@/utils/authToken";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role?: string;
}

const DashboardAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; 
    fetchedRef.current = true;

    const fetchMe = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8080/api/auth/admin/me");

        if (!res.ok) {
          console.error("ME ERROR STATUS (admin):", res.status);
          await logout_admin();
          return;
        }

        const data = await res.json();
        console.log("ME RESPONSE (admin dashboard):", data);

        const userData = data.user ?? data;

        if (userData.role !== "admin") {
          console.warn("User is NOT admin → redirecting");
          await logout_admin();
          return;
        }

        setUser(userData);
      } catch (err) {
        console.error("Admin /me failed:", err);
        await logout_admin();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-loginbg font-serif text-brand-text flex items-center justify-center">
        <p className="text-creamtext">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-loginbg font-serif text-brand-text flex items-center justify-center">
        <p className="text-creamtext">
          Admin session expired. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
      <h1 className="mt-10 text-2xl text-creamtext">
        Welcome Admin, {user.username}
      </h1>

      <button
        onClick={logout_admin}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>

      <p className="text-creamtext mt-2">{user.email}</p>
    </div>
  );
};

export default React.memo(DashboardAdmin);
