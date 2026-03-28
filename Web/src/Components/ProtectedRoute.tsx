import React from "react";
import { Navigate, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
  onlyAdmin?: boolean;
  allowedRoles?: string[];
  redirectTo?: string; // fallback when not authenticated/authorized
};

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const {
    children,
    onlyAdmin = false,
    allowedRoles,
    redirectTo = "/login",
  } = props;
  const location = useLocation();

  // Obtém usuário do localStorage (compatível com api.ts)
  let user: { role?: string } | null = null;
  if (typeof window !== "undefined") {
    try {
      const userStr = window.localStorage.getItem("user");
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch {
      user = null;
    }
  }

  const isAuthenticated = !!user;
  const role = (user?.role || "").toString();

  // Regras de autorização
  let authorized = isAuthenticated;
  if (authorized && onlyAdmin) {
    authorized = role === "admin" || role === "master";
  }
  if (authorized && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    authorized = allowedRoles.includes(role);
  }

  if (!authorized) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

