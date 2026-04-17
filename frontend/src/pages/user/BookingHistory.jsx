import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as bookingService from "../../services/booking.service";
import * as paymentService from "../../services/payment.service";

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

const statusBadge = (status) => {
  const map = {
    PENDING: "badge-yellow",
    CONFIRMED: "badge-green",
    CANCELLED: "badge-red",
  };
  return (
    <span className={`badge ${map[status] || "badge-yellow"}`}>{status}</span>
  );
};

const paymentBadge = (status) => {
  const colorMap = {
    SUCCESS: "badge-green",
    FAILED: "badge-red",
    REFUNDED: "badge-blue",
    PENDING: "badge-yellow",
  };
  const labelMap = {
    SUCCESS: "PAID",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
    PENDING: "PENDING",
  };
  return (
    <span className={`badge ${colorMap[status] || "badge-yellow"}`}>
      {labelMap[status] || status}
    </span>
  );
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

const BookingHistory = () => {
  const { user } = useSelector((s) => s.auth);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookings();
      if (!res.success) throw new Error("Failed to fetch bookings");
      setBookings(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load bookings",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePay = async (booking) => {
    setPayingId(booking._id);
    setError("");

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      // res is already r.data → has { order }
      const res = await paymentService.createOrder(booking._id);

      if (!res?.order) throw new Error("Invalid order response from server");

      const { order } = res;

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Travel SaaS",
        description: booking.packageId?.title || "Travel Booking",
        order_id: order.id,

        prefill: {
          name: user?.name,
          email: user?.email,
        },

        handler: async (response) => {
          try {
            // ✅ verifyPayment returns r.data already
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await fetchBookings();
          } catch (err) {
            setError(
              err.response?.data?.message ||
                err.message ||
                "Payment verification failed",
            );
          } finally {
            setPayingId(null);
          }
        },

        modal: {
          ondismiss: () => setPayingId(null),
        },
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment failed");
      setPayingId(null);
    }
  };

  const handleCancel = async (booking) => {
    const confirmMsg =
      booking.paymentStatus === "SUCCESS"
        ? "Cancel this booking? A refund will be simulated."
        : "Cancel this booking?";

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(booking._id);
    setError("");

    try {
      await bookingService.cancelBooking(booking._id);
      await fetchBookings();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Cancellation failed",
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (!loading && bookings.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🧳</div>
        <h2>No Bookings Yet</h2>
        <p>Browse packages and book your first trip!</p>
      </div>
    );
  }

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
                const canPay =
                  b.status === "PENDING" && b.paymentStatus !== "SUCCESS";

                const canCancel =
                  ["PENDING", "CONFIRMED"].includes(b.status) &&
                  b.paymentStatus !== "REFUNDED";

                return (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {b.packageId?.title || "—"}
                      </div>
                      <div className="text-muted">
                        📍 {b.packageId?.destination || "—"}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        🪑 {b.seats} seats
                      </div>
                    </td>

                    <td>₹{b.price?.toLocaleString("en-IN") || "—"}</td>
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
                                ? "Cancel & Refund"
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
