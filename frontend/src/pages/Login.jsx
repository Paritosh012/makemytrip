import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      const user = res.data.user;

      if (user.role === "SUPER_ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "HOST") {
        navigate("/host/dashboard");
      } else if (user.role === "END_USER") {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 bg-light">
      <Row className="h-100 align-items-center justify-content-center">

        <Col md={4}>
          <Card className="shadow-lg border-0">
            <Card.Body className="p-4">

              <div className="text-center mb-4">
                <h2 className="fw-bold">Travel SaaS</h2>
                <p className="text-muted">
                  Sign in to your account
                </p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" /> Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

              </Form>

              <div className="text-center mt-3">
                <small>
                  Don't have an account?{" "}
                  <Link to="/signup">Signup</Link>
                </small>
              </div>

            </Card.Body>
          </Card>
        </Col>

      </Row>
    </Container>
  );
};

export default Login;