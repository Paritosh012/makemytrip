import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth";
import { logoutUser } from "../../features/auth/authSlice";

/*
-------------------------------------------------------
NAV CONFIG (role + optional permission)
-------------------------------------------------------
*/
const navConfig = {
  END_USER: [
    { to: "/", label: "Browse Packages" },
    { to: "/bookings", label: "My Bookings" },
  ],

  HOST: [
    { to: "/host/dashboard", label: "Dashboard" },
    { to: "/host/packages", label: "Packages" },
    { to: "/host/bookings", label: "View Bookings" },
    { to: "/host/create-package", label: "New Package" },
    { to: "/host/subscription", label: "Subscription" },
  ],

  ADMIN: [
    { to: "/admin/users", label: "Users", permission: "VIEW_USERS" },
    { to: "/admin/tenants", label: "Tenants", permission: "VIEW_TENANTS" },
    {
      to: "/admin/applications",
      label: "Applications",
      permission: "APPROVE_HOSTS",
    },
  ],

  SUPER_ADMIN: [
    { to: "/admin/users", label: "Users" },
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/applications", label: "Applications" },
    { to: "/admin/tenants", label: "Tenants" },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();

  // ✅ DON'T render until auth is ready
  if (!user) return null;

  let links = navConfig[user.role] || [];

  // ✅ Permission filtering only for ADMIN
  if (user.role === "ADMIN") {
    links = links.filter(
      (link) => !link.permission || user.permissions?.includes(link.permission),
    );
  }

  // 🔥 CLEAN LOGOUT (NO NAVIGATION HERE)
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      // ❌ No navigate here
      // ProtectedRoute will handle redirect
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="sidebar-light">
      {/* LOGO SECTION */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          <div className="logo-text">YATRI</div>
        </div>
      </div>

      {/* ROLE BADGE */}
      <div className="sidebar-role-badge">
        {user.role.replace(/_/g, " ")}
      </div>

      {/* NAV SECTION */}
      <nav className="sidebar-nav">
        {links.length === 0 ? (
          <div className="nav-empty">No access available</div>
        ) : (
          <div className="nav-links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* USER SECTION */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
        </div>

        <button
          className="btn-logout"
          onClick={handleLogout}
          title="Sign out"
        >
          ← Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;