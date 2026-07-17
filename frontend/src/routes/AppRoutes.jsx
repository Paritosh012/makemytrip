import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import PublicLayout from "../components/layout/PublicLayout";

// Public / customer
import Home from "../pages/Home";
import BookingHistory from "../pages/user/BookingHistory";
import ApplyHost from "../pages/user/ApplyHost";

// Auth pages
import Register from "../pages/auth/Register";
import VerifyOtp from "../pages/auth/VerifyOtp";
import SetPassword from "../pages/auth/SetPassword";
import Login from "../pages/auth/Login";

// Host pages
import HostDashboard from "../pages/host/Dashboard";
import CreatePackage from "../pages/host/CreatePackage";
import ManagePackages from "../pages/host/ManagePackages";
import Subscription from "../pages/host/Subscription";
import ManageSubscription from "../pages/host/ManageSubscription";

// Admin pages
import AdminDashboard from "../pages/admin/Dashboard";
import Applications from "../pages/admin/Applications";
import Tenants from "../pages/admin/Tenants";
import Users from "../pages/admin/Users";
import HostBookings from "../pages/host/Hostbookings";

// Wrap a customer inner page in the light "site-page" shell.
const SitePage = ({ children }) => (
  <div className="site-page">
    <div className="container">{children}</div>
  </div>
);

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  const homeForRole = () => {
    if (isAuthenticated && user?.role === "SUPER_ADMIN")
      return "/admin/dashboard";
    if (isAuthenticated && user?.role === "HOST") return "/host/dashboard";
    return "/";
  };

  return (
    <Routes>
      {/* ---------- Public auth ---------- */}
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/login" element={<Login />} />

      {/* ---------- Public site (no login required) ---------- */}
      <Route element={<PublicLayout />}>
        {/* Home / landing — open to everyone */}
        <Route path="/" element={<Home />} />

        {/* Customer pages — require a signed-in END_USER */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRoles={["END_USER"]}>
              <SitePage>
                <BookingHistory />
              </SitePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply-host"
          element={
            <ProtectedRoute allowedRoles={["END_USER"]}>
              <SitePage>
                <ApplyHost />
              </SitePage>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Legacy redirect */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* ---------- HOST (dark dashboard) ---------- */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["HOST"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/packages" element={<ManagePackages />} />
        <Route path="/host/create-package" element={<CreatePackage />} />
        <Route path="/host/subscription" element={<Subscription />} />
        <Route
          path="/host/manage-subscription"
          element={<ManageSubscription />}
        />
        <Route path="/host/bookings" element={<HostBookings />} />
      </Route>

      {/* ---------- SUPER_ADMIN (dark dashboard) ---------- */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/applications" element={<Applications />} />
        <Route path="/admin/tenants" element={<Tenants />} />
      </Route>

      {/* Unauthorized */}
      <Route
        path="/unauthorized"
        element={<Navigate to={homeForRole()} replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
