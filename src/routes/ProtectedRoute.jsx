import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute ensures that:
 * - The user is signed in.
 * - The user has the right role (if `roles` is provided).
 *
 * @param {ReactNode} children - The component/page to render
 * @param {Array<string>} roles - Optional: allowed roles
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
