import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as bookingService from "../../services/booking.service";
import * as paymentService from "../../services/payment.service";

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
  return (
    <span className={`badge ${map[status] || "badge-gray"}`}>{status}</span>
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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const { user } = useSelector((s) => s.auth);

  const fetchBookings = () => {
    setLoading(true);
    bookingService
      .getBookings()
      .then((data) => setBookings(data.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePay = async (booking) => {
    setPayingId(booking._id);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      const orderData = await paymentService.createOrder(booking._id);
      const { order } = orderData;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "TravelSaaS",
        description: booking.packageId?.title || "Travel Package",
        order_id: order.id,
        prefill: { email: user?.email, name: user?.name },
        theme: { color: "#e8ff4d" },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            fetchBookings();
          } catch (err) {
            setError("Payment verification failed: " + err.message);
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingId(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await bookingService.cancelBooking(bookingId);
      fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Track and manage your travel bookings</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loader-wrap">
          <div className="spinner" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No bookings yet. Browse packages to get started!</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Booked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {b.packageId?.title || "—"}
                      </div>
                      <div className="text-muted">
                        📍 {b.packageId?.destination || "—"}
                      </div>
                    </td>
                    <td>₹{b.price?.toLocaleString("en-IN")}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>
                      <span
                        className={`badge ${b.paymentStatus === "SUCCESS" ? "badge-green" : b.paymentStatus === "FAILED" ? "badge-red" : "badge-yellow"}`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <div className="actions-row">
                        {b.status === "PENDING" &&
                          b.paymentStatus !== "SUCCESS" && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ width: "auto" }}
                              onClick={() => handlePay(b)}
                              disabled={payingId === b._id}
                            >
                              {payingId === b._id ? "Opening..." : "Pay Now"}
                            </button>
                          )}
                        {["PENDING", "CONFIRMED"].includes(b.status) && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(b._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
