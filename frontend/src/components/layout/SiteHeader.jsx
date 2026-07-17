import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth";
import { logoutUser } from "../../features/auth/authSlice";
import { IconPlane, IconMenu, IconClose } from "../Icons";

const SiteHeader = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ✅ Dashboard link for SUPER_ADMIN
  const dashHref = user?.role === "SUPER_ADMIN" ? "/admin/dashboard" : null;

  // ✅ Get first letter for avatar
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <header className="site-header">
      <div className="container header-bar">
        {/* LOGO */}
        <Link to="/" className="site-logo" onClick={() => setOpen(false)}>
          <span className="logo-icon">
            <IconPlane />
          </span>
          <span className="logo-text">YATRI</span>
        </Link>

        {/* NAV (Desktop) */}
        <nav className="site-nav">
          <a href="/#packages">Packages</a>
          <a href="/#destinations">Destinations</a>
          <a href="/#how">How it works</a>
          <a href="/#reviews">Reviews</a>
        </nav>

        {/* RIGHT SECTION */}
        <div className="header-right">
          {/* NOT AUTHENTICATED */}
          {!isAuthenticated && !loading && (
            <div className="auth-group">
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          )}

          {/* END_USER AUTHENTICATED */}
          {isAuthenticated && user?.role === "END_USER" && (
            <div className="auth-group">
              <Link to="/bookings" className="btn btn-ghost">
                My trips
              </Link>
              <div className="user-avatar">
                <span className="avatar-circle">{initial}</span>
                <span className="user-name">{user?.name || "Traveler"}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}

          {/* HOST AUTHENTICATED */}
          {isAuthenticated && user?.role === "HOST" && (
            <div className="auth-group">
              <Link to="/host/dashboard" className="btn btn-primary btn-sm">
                Host Dashboard
              </Link>
              <Link to="/host/bookings" className="btn btn-ghost btn-sm">
                View Bookings
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}

          {/* ADMIN/SUPER_ADMIN AUTHENTICATED */}
          {isAuthenticated &&
            (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
              <div className="auth-group">
                <Link
                  to={dashHref || "/admin/users"}
                  className="btn btn-primary btn-sm"
                >
                  {user?.role === "SUPER_ADMIN"
                    ? "Admin Dashboard"
                    : "Admin Panel"}
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}

          {/* HAMBURGER (Mobile) */}
          <button
            className="hamburger"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="mobile-menu-wrapper">
          <div className="container">
            <nav className="mobile-menu">
              <a href="/#packages" onClick={() => setOpen(false)}>
                Packages
              </a>
              <a href="/#destinations" onClick={() => setOpen(false)}>
                Destinations
              </a>
              <a href="/#how" onClick={() => setOpen(false)}>
                How it works
              </a>
              <a href="/#reviews" onClick={() => setOpen(false)}>
                Reviews
              </a>

              <div className="menu-divider" />

              {/* NOT AUTHENTICATED (Mobile) */}
              {!isAuthenticated && !loading && (
                <div className="mobile-auth">
                  <Link
                    to="/login"
                    className="btn btn-ghost"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    onClick={() => setOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* END_USER (Mobile) */}
              {isAuthenticated && user?.role === "END_USER" && (
                <div className="mobile-auth">
                  <Link
                    to="/bookings"
                    className="btn btn-ghost"
                    onClick={() => setOpen(false)}
                  >
                    My trips
                  </Link>
                  <button className="btn btn-ghost" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}

              {/* HOST (Mobile) */}
              {isAuthenticated && user?.role === "HOST" && (
                <div className="mobile-auth">
                  <Link
                    to="/host/dashboard"
                    className="btn btn-primary"
                    onClick={() => setOpen(false)}
                  >
                    Host Dashboard
                  </Link>
                  <Link
                    to="/host/bookings"
                    className="btn btn-ghost"
                    onClick={() => setOpen(false)}
                  >
                    View Bookings
                  </Link>
                  <button className="btn btn-ghost" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}

              {/* ADMIN/SUPER_ADMIN (Mobile) */}
              {isAuthenticated &&
                (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                  <div className="mobile-auth">
                    <Link
                      to={dashHref || "/admin/users"}
                      className="btn btn-primary"
                      onClick={() => setOpen(false)}
                    >
                      {user?.role === "SUPER_ADMIN"
                        ? "Admin Dashboard"
                        : "Admin Panel"}
                    </Link>
                    <button className="btn btn-ghost" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
