import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

const HostBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, CONFIRMED, CANCELLED

  // ✅ Fetch bookings for HOST's packages
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/bookings/host", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("✅ Bookings fetched:", response.data);
        setBookings(response.data.bookings || []);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        setError(err.response?.data?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "HOST") {
      fetchBookings();
    }
  }, [user]);

  // ✅ Filter bookings
  const filteredBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  // ✅ Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "badge-warning";
      case "CONFIRMED":
        return "badge-success";
      case "CANCELLED":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="loader">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Booking Requests</h1>
          <p className="text-muted">Manage bookings for your packages</p>
        </div>
        <div className="stats">
          <div className="stat-card">
            <div className="stat-value">{bookings.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {bookings.filter((b) => b.status === "PENDING").length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {bookings.filter((b) => b.status === "CONFIRMED").length}
            </div>
            <div className="stat-label">Confirmed</div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="filter-group">
        <button
          className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
          onClick={() => setFilter("ALL")}
        >
          All ({bookings.length})
        </button>
        <button
          className={`filter-btn ${filter === "PENDING" ? "active" : ""}`}
          onClick={() => setFilter("PENDING")}
        >
          Pending ({bookings.filter((b) => b.status === "PENDING").length})
        </button>
        <button
          className={`filter-btn ${filter === "CONFIRMED" ? "active" : ""}`}
          onClick={() => setFilter("CONFIRMED")}
        >
          Confirmed ({bookings.filter((b) => b.status === "CONFIRMED").length})
        </button>
        <button
          className={`filter-btn ${filter === "CANCELLED" ? "active" : ""}`}
          onClick={() => setFilter("CANCELLED")}
        >
          Cancelled ({bookings.filter((b) => b.status === "CANCELLED").length})
        </button>
      </div>

      {/* BOOKINGS TABLE */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No bookings found</h3>
          <p>
            {filter === "ALL"
              ? "You don't have any bookings yet. Promote your packages to get started!"
              : `No ${filter.toLowerCase()} bookings`}
          </p>
        </div>
      ) : (
        <div className="bookings-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Booked On</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <strong>{booking.packageTitle}</strong>
                    <div className="text-muted" style={{ fontSize: "12px" }}>
                      {booking.destination}
                    </div>
                  </td>
                  <td>
                    <strong>{booking.customerName}</strong>
                    <div className="text-muted" style={{ fontSize: "12px" }}>
                      {booking.customerEmail}
                    </div>
                  </td>
                  <td>
                    <div>{formatDate(booking.startDate)}</div>
                    <div className="text-muted">→</div>
                    <div>{formatDate(booking.endDate)}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{booking.seats}</span>
                  </td>
                  <td>
                    <strong>₹{booking.price.toLocaleString("en-IN")}</strong>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        booking.paymentStatus === "PAID"
                          ? "badge-success"
                          : "badge-warning"
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px" }}>
                      {formatDate(booking.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HostBookings;
