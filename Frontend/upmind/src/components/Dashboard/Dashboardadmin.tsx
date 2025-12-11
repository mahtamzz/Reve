import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AdminUser {
  id: number;
  username: string;
  email: string;
}

const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("ME ERROR STATUS (admin):", res.status);
          localStorage.removeItem("token");
          navigate("/admin/login", { replace: true });
          return;
        }

        const data = await res.json();
        console.log("ME RESPONSE (admin dashboard):", data);

        setUser(data);

      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/admin/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [navigate]);

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
        <p className="text-creamtext">No admin data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
      <h1 className="mt-10 text-2xl text-creamtext">
        inja masalan Dashboard admin hast
      </h1>
    </div>
  );
};

export default React.memo(DashboardAdmin);
