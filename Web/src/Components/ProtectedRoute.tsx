import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  onlyAdmin?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
};

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const {
    children,
    onlyAdmin = false,
    allowedRoles,
    redirectTo = "/admin",
  } = props;
  const location = useLocation();
  const { user } = useAuth();

  const isAuthenticated = !!user;
  const role = (user?.role || "").toString();

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
