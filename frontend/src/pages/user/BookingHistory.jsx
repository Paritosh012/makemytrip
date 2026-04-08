import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as bookingService from "../../services/booking.service";
import * as paymentService from "../../services/payment.service";

// ======================
// HELPERS
// ======================
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusBadge = (status) => {
  const map = {
    PENDING: "badge-yellow",
    CONFIRMED: "badge-green",
    CANCELLED: "badge-red",
  };
  return <span className={`badge ${map[status]}`}>{status}</span>;
};

// 🔥 FIXED PAYMENT BADGE (clear + honest)
const paymentBadge = (status) => {
  const map = {
    SUCCESS: "badge-green",
    FAILED: "badge-red",
    REFUNDED: "badge-blue",
    PENDING: "badge-yellow",
  };

  const labelMap = {
    SUCCESS: "PAID",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED (MOCK)",
    PENDING: "PENDING",
  };

  return <span className={`badge ${map[status]}`}>{labelMap[status]}</span>;
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

// ======================
// COMPONENT
// ======================
const BookingHistory = () => {
  const { user } = useSelector((s) => s.auth);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ======================
  // FETCH
  // ======================
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookings();

      if (!res.success) throw new Error("Failed to fetch");

      setBookings(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ======================
  // PAYMENT
  // ======================
  const handlePay = async (booking) => {
    setPayingId(booking._id);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed");

      const { order } = await paymentService.createOrder(booking._id);

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Travel SaaS",
        description: booking.packageId?.title,
        order_id: order.id,

        prefill: {
          name: user?.name,
          email: user?.email,
        },

        handler: async (response) => {
          await paymentService.verifyPayment(response);
          fetchBookings();
        },
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingId(null);
    }
  };

  // ======================
  // CANCEL (FIXED)
  // ======================
  const handleCancel = async (booking) => {
    const confirmMsg =
      booking.paymentStatus === "SUCCESS"
        ? "Cancel this booking? (Refund will be simulated)"
        : "Cancel this booking?";

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(booking._id);

      await bookingService.cancelBooking(booking._id);

      alert("Booking cancelled successfully");

      fetchBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ======================
  // UI STATES
  // ======================
  if (loading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Bookings Yet</h2>
        <p>Go book something instead of staring at this.</p>
      </div>
    );
  }

  // ======================
  // MAIN UI
  // ======================
  return (
    <div>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Manage your trips, payments & cancellations</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Price</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((b) => {
                // 🔥 FIXED LOGIC
                const canCancel =
                  ["PENDING", "CONFIRMED"].includes(b.status) &&
                  b.paymentStatus !== "REFUNDED";

                const canPay =
                  b.status === "PENDING" && b.paymentStatus !== "SUCCESS";

                return (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {b.packageId?.title}
                      </div>

                      <div className="text-muted">
                        📍 {b.packageId?.destination}
                      </div>

                      <div className="text-muted" style={{ fontSize: 12 }}>
                        🪑 {b.seats} seats
                      </div>
                    </td>

                    <td>₹{b.price?.toLocaleString()}</td>

                    <td>{statusBadge(b.status)}</td>

                    <td>{paymentBadge(b.paymentStatus)}</td>

                    <td>{formatDate(b.createdAt)}</td>

                    <td>
                      <div className="actions-row">
                        {canPay && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePay(b)}
                            disabled={payingId === b._id}
                          >
                            {payingId === b._id ? "Opening..." : "Pay Now"}
                          </button>
                        )}

                        {canCancel && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(b)}
                            disabled={actionLoading === b._id}
                          >
                            {actionLoading === b._id
                              ? "Processing..."
                              : b.paymentStatus === "SUCCESS"
                                ? "Cancel (Refund Simulated)"
                                : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
