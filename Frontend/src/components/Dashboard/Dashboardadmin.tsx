// src/pages/DashboardAdmin.tsx
import React, { useEffect, useState } from "react";
import { logout_admin } from "@/utils/authToken";
import { ApiError, createApiClient } from "@/api/client";

interface AdminUser {
  id: number | string;
  username: string;
  email: string;
  role?: string;
}

// ✅ اگر از قبل authClient داری، این بخش رو حذف کن و از همون import کن.
// مثال: import { authClient } from "@/api/client";
const AUTH_BASE = import.meta.env.VITE_API_AUTH_BASE || "http://localhost:3000/api";
const authClient = createApiClient(AUTH_BASE).apiClient;

// ✅ اگر Gateway داری (8080) و می‌خوای از اون بزنی، اینو بذار:
const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || "http://localhost:8080/api";
// مسیر درست همونیه که داشتی:
const ADMIN_ME_PATH = "/auth/admin/me";

function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}

const DashboardAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        // ✅ اینجا از Gateway می‌زنیم (8080) چون endpoint اونجاست.
        // برای اینکار باید یه client مخصوص gateway بسازیم:
        const gatewayClient = createApiClient(API_GATEWAY).apiClient;

        const data: any = await gatewayClient.get(ADMIN_ME_PATH, {
          auth: true,
          retry: true,
        });

        const u = (data?.user ?? data) as any;

        if (!u || u.role !== "admin") {
          await logout_admin();
          return;
        }

        if (!mounted) return;
        setUser({
          id: u.id,
          username: u.username ?? "",
          email: u.email ?? "",
          role: u.role,
        });
      } catch (err) {
        const status = getHttpStatus(err);

        // ✅ اگه auth مشکل داشت → logout
        if (status === 401 || status === 403) {
          await logout_admin();
          return;
        }

        console.error("Admin /me failed:", err);
        await logout_admin();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
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
        <p className="text-creamtext">Admin session expired. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
      <h1 className="mt-10 text-2xl text-creamtext">Welcome Admin, {user.username}</h1>

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
