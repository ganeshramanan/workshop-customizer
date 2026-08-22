import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("=================================");
console.log("API URL being used:", API_URL);
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("=================================");

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
          password: password,
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
      <div className="login-card">
        <h1>Workshop Customizer</h1>

        <p>Login to manage your workshop website</p>

        <form onSubmit={handleLogin}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
