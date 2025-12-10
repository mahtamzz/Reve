import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsValid(false);
      return;
    }

    fetch("http://localhost:8080/api/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          setIsValid(false);
          return;
        }

        setIsValid(true);
      })
      .catch(() => setIsValid(false));
  }, []);

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-creamtext">
        Loading...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
