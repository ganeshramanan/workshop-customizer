import { useState } from "react";
import "./Login.css";
import grambiLogo from "./assets/grambi-logo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      console.log("Login API URL:", `${API_URL}/api/auth/login`);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      console.log("HTTP status:", response.status);

      const responseText = await response.text();

      console.log("Raw response:", responseText);

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);

          throw new Error("Backend returned an invalid response.");
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed (${response.status})`);
      }

      console.log("Login successful:", data);

      onLogin(data);
    } catch (error) {
      console.error("Login error:", error);

      setError(error.message || "Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background-shape shape-one" />
      <div className="login-background-shape shape-two" />

      <div className="login-card">
        {/* BRAND */}
        <div className="login-brand">
          <img src={grambiLogo} alt="Grambi" className="brand-logo" />
        </div>

        {/* LOGIN INTRO */}
        <div className="login-intro">
          <h1>Welcome back</h1>

          <p>Sign in to manage your website</p>
        </div>

        {/* LOGIN FORM */}
        <form className="login-form" onSubmit={handleLogin}>
          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="login-error">
              <span className="error-icon">!</span>

              <span>{error}</span>
            </div>
          )}

          {/* BUTTON */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <span className="button-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="login-footer">
          <span>Grambi</span>

          <span className="footer-dot">•</span>

          <span>Your business, your website.</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
