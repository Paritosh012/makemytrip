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

  // 🔥 DEBUG: Log auth state
  console.log("🔍 SiteHeader Auth Debug:", {
    user,
    isAuthenticated,
    loading,
    userRole: user?.role,
  });

  const handleLogout = async () => {
    setOpen(false);
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const dashHref =
    user?.role === "SUPER_ADMIN"
      ? "/admin/dashboard"
      : user?.role === "HOST"
        ? "/host/dashboard"
        : null;

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <header className="site-header">
      <div className="container bar">
        <Link to="/" className="site-logo" onClick={() => setOpen(false)}>
          <span className="mark">
            <IconPlane />
          </span>
          YATRI
        </Link>

        <nav className="site-nav">
          <a href="/#packages">Packages</a>
          <a href="/#destinations">Destinations</a>
          <a href="/#how">How it works</a>
          <a href="/#reviews">Reviews</a>
        </nav>

        <div className="right">
          {!isAuthenticated && (
            <div className="desktop-only" style={{ display: "flex", gap: 10 }}>
              <Link to="/login" className="ybtn ybtn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="ybtn ybtn-primary">
                Sign up
              </Link>
            </div>
          )}

          {isAuthenticated && user?.role === "END_USER" && (
            <div
              className="desktop-only"
              style={{ display: "flex", gap: 10, alignItems: "center" }}
            >
              <Link to="/bookings" className="ybtn ybtn-ghost">
                My trips
              </Link>
              <span className="user-chip">
                <span className="av">{initial}</span>
                <span className="nm">{user?.name || "Traveler"}</span>
              </span>
              <button className="ybtn ybtn-link" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}

          {isAuthenticated && dashHref && (
            <div
              className="desktop-only"
              style={{ display: "flex", gap: 10, alignItems: "center" }}
            >
              <Link to={dashHref} className="ybtn ybtn-primary">
                {user.role === "HOST" ? "Host dashboard" : "Admin panel"}
              </Link>
              <button className="ybtn ybtn-link" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}

          <button
            className="hamburger"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="container">
        <div className={`mobile-menu ${open ? "open" : ""}`}>
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
          <div className="divider" />

          {!isAuthenticated && (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                Sign up
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === "END_USER" && (
            <>
              <Link to="/bookings" onClick={() => setOpen(false)}>
                My trips
              </Link>
              <button onClick={handleLogout}>Sign out</button>
            </>
          )}

          {isAuthenticated && dashHref && (
            <>
              <Link to={dashHref} onClick={() => setOpen(false)}>
                {user.role === "HOST" ? "Host dashboard" : "Admin panel"}
              </Link>
              <button onClick={handleLogout}>Sign out</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
