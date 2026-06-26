import { useState } from "react";
import * as hostService from "../../services/host.service";

const ApplyHost = () => {
  const [form, setForm] = useState({
    agencyName: "",
    businessEmail: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await hostService.submitApplication(form);

      setSuccess("Application submitted! Our team will review it shortly.");

      setForm({
        agencyName: "",
        businessEmail: "",
        phone: "",
        description: "",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Become a Host</h1>
        <p>Apply to list your travel packages on TravelSaaS</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="host-benefits">
            {["Create packages", "Manage bookings", "Grow your business"].map(
              (item) => (
                <div key={item} className="host-benefit">
                  ✓ {item}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Application Form</h2>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Agency Name</label>
              <input
                name="agencyName"
                value={form.agencyName}
                onChange={handleChange}
                placeholder="Your travel agency name"
                required
              />
            </div>
            <div className="form-group">
              <label>Business Email</label>
              <input
                type="email"
                name="businessEmail"
                value={form.businessEmail}
                onChange={handleChange}
                placeholder="agency@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>
            <div className="form-group">
              <label>
                Description{" "}
                <span style={{ color: "var(--muted)" }}>(optional)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Tell us about your agency and the kind of packages you offer..."
              />
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyHost;
