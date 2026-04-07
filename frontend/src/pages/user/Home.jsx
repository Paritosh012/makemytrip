import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as packageService from "../../services/package.service";
import * as bookingService from "../../services/booking.service";
import { setPendingBooking } from "../../features/booking/bookingSlice";

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookingPkg, setBookingPkg] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // ✅ Fetch public packages
  useEffect(() => {
    setLoading(true);
    setError("");

    packageService
      .getPublicPackages()
      .then((res) => {
        setPackages(res.data || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load packages");
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ Open booking modal
  const handleBook = (pkg) => {
    setBookingPkg(pkg);
    setBookingError("");
  };

  // ✅ Confirm booking
  const confirmBook = async () => {
    if (!bookingPkg) return;

    setBookingLoading(true);
    setBookingError("");

    try {
      const res = await bookingService.createBooking({
        packageId: bookingPkg._id,
      });

      dispatch(
        setPendingBooking({
          bookingId: res.data._id,
          pkg: bookingPkg,
        }),
      );

      setBookingPkg(null);

      // 👉 Move to booking page (payment next)
      navigate("/bookings");
    } catch (err) {
      console.log("BOOKING ERROR:", err.response?.data);
      setBookingError(
        err.response?.data?.message || err.message || "Booking failed",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Explore Packages</h1>
        <p>Discover handpicked travel experiences</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loader-wrap">
          <div className="spinner" />
        </div>
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✈</div>
          <p>No packages available yet</p>
        </div>
      ) : (
        <div className="grid-3">
          {packages.map((pkg) => (
            <div key={pkg._id} className="pkg-card">
              <div
                style={{
                  height: 140,
                  background:
                    "linear-gradient(135deg, #1a1a40 0%, #0f1a2e 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                }}
              >
                ✈
              </div>

              <div className="pkg-card-body">
                <h3>{pkg.title}</h3>

                <div className="text-muted" style={{ fontSize: 13 }}>
                  📍 {pkg.destination}
                </div>

                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {pkg.description?.slice(0, 80)}...
                </p>

                <div className="pkg-meta">
                  Starting Date : <span> {formatDate(pkg.startDate)}</span>
                  <span>💺 {pkg.seatsAvailable} seats</span>
                </div>

                <div className="flex-between" style={{ marginTop: 12 }}>
                  <div className="pkg-price">
                    ₹{pkg.price?.toLocaleString("en-IN")}
                    <span>/person</span>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    disabled={pkg.seatsAvailable === 0}
                    onClick={() => handleBook(pkg)}
                  >
                    {pkg.seatsAvailable === 0 ? "Full" : "Book Now"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Booking Modal */}
      {bookingPkg && (
        <div className="modal-overlay" onClick={() => setBookingPkg(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Booking</h2>

            <div className="card">
              <h3>{bookingPkg.title}</h3>
              <p>📍 {bookingPkg.destination}</p>
              <p>₹{bookingPkg.price?.toLocaleString("en-IN")}</p>
            </div>

            {bookingError && (
              <div className="alert alert-error">{bookingError}</div>
            )}

            <div className="actions-row">
              <button
                className="btn btn-primary"
                onClick={confirmBook}
                disabled={bookingLoading}
              >
                {bookingLoading ? "Processing..." : "Confirm & Continue"}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setBookingPkg(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
