import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../../services/auth.service";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register(form);
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      setError(err.message);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>
          Create account<span className="accent-dot">.</span>
        </h1>
        <p className="subtitle">Start exploring the world with TravelSaaS</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
            />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"}
          </button>
        </form>

        <div className="auth-link-row">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
