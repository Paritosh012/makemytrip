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
    { to: "/", label: "✦ Browse Packages" },
    { to: "/bookings", label: "⊞ My Bookings" },
  ],

  HOST: [
    { to: "/host/dashboard", label: "⊡ Dashboard" },
    { to: "/host/packages", label: "⊞ Packages" },
    { to: "/host/create-package", label: "⊕ New Package" },
    { to: "/host/subscription", label: "◈ Subscription" },
  ],

  ADMIN: [
    { to: "/admin/users", label: "⊞ Users", permission: "VIEW_USERS" },
    { to: "/admin/tenants", label: "◈ Tenants", permission: "VIEW_TENANTS" },
    {
      to: "/admin/applications",
      label: "⊕ Applications",
      permission: "APPROVE_HOSTS",
    },
  ],

  SUPER_ADMIN: [
    { to: "/admin/users", label: "⊞ Users" },
    { to: "/admin/dashboard", label: "⊡ Dashboard" },
    { to: "/admin/applications", label: "⊞ Applications" },
    { to: "/admin/tenants", label: "◈ Tenants" },
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
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="logo-text">YATRI</div>
      </div>

      {/* ROLE */}
      <div className="sidebar-role">{user.role.replace("_", " ")}</div>

      {/* NAV */}
      <nav>
        {links.length === 0 ? (
          <p style={{ padding: "12px", color: "gray" }}>No access available</p>
        ) : (
          links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))
        )}
      </nav>

      {/* USER INFO */}
      <div style={{ marginTop: "auto", padding: "24px 24px 0" }}>
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginBottom: 4,
            }}
          >
            {user.name}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 12,
            }}
          >
            {user.email}
          </div>

          <button
            className="btn btn-ghost"
            style={{ padding: "6px 0", fontSize: 13 }}
            onClick={handleLogout}
          >
            → Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
