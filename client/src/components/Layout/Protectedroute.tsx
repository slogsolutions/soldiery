import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../../store/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("manager" | "soldier")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user } = useSelector((s: RootState) => s.auth);
  console.log("Current User : ",user)

  // not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // wrong role → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "manager" ? "/manager/dashboard" : "/soldier/dashboard"}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;