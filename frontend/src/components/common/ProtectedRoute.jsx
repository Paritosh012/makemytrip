import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  // ✅ Wait until auth is resolved
  if (loading) {
    return <div>Loading...</div>; // or spinner
  }

  // ❌ Only redirect AFTER loading is done
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;