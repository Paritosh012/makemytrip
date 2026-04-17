import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

// Auth pages
import Register from "../pages/auth/Register";
import VerifyOtp from "../pages/auth/VerifyOtp";
import SetPassword from "../pages/auth/SetPassword";
import Login from "../pages/auth/Login";

// User pages
import Home from "../pages/user/Home";
import BookingHistory from "../pages/user/BookingHistory";
import ApplyHost from "../pages/user/ApplyHost";

// Host pages
import HostDashboard from "../pages/host/Dashboard";
import CreatePackage from "../pages/host/CreatePackage";
import ManagePackages from "../pages/host/ManagePackages";
import Subscription from "../pages/host/Subscription";

// Admin pages
import AdminDashboard from "../pages/admin/Dashboard";
import Applications from "../pages/admin/Applications";
import Tenants from "../pages/admin/Tenants";
import Users from "../pages/admin/Users";
import ManageSubscription from "../pages/host/ManageSubscription";

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  const defaultRedirect = () => {
    if (!isAuthenticated) return "/login";
    if (user?.role === "SUPER_ADMIN") return "/admin/dashboard";
    if (user?.role === "HOST") return "/host/dashboard";
    return "/home";
  };

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/login" element={<Login />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={defaultRedirect()} replace />} />

      {/* Unauthorized */}
      <Route
        path="/unauthorized"
        element={
          <div className="auth-wrap">
            <div className="auth-card text-center">
              <h1>Access Denied</h1>
              <p className="subtitle">
                You don't have permission to view this page.
              </p>
              <Navigate to={defaultRedirect()} replace />
            </div>
          </div>
        }
      />

      {/* END_USER protected routes */}
      <Route
        element={
          <ProtectedRoute roles={["END_USER"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/bookings" element={<BookingHistory />} />
        <Route path="/apply-host" element={<ApplyHost />} />
      </Route>

      {/* HOST protected routes */}
      <Route
        element={
          <ProtectedRoute roles={["HOST"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/packages" element={<ManagePackages />} />
        <Route path="/host/create-package" element={<CreatePackage />} />
        <Route path="/host/subscription" element={<Subscription />} />
        <Route path="/host/manage-subscription" element={<ManageSubscription />} />
      </Route>

      {/* SUPER_ADMIN protected routes */}
      <Route
        element={
          <ProtectedRoute roles={["SUPER_ADMIN"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/applications" element={<Applications />} />
        <Route path="/admin/tenants" element={<Tenants />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultRedirect()} replace />} />
    </Routes>
  );
};

export default AppRoutes;
