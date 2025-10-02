import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side validation
  const validate = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(email, password);
      navigate("/applications");
    } catch (err) {
      // Parse server error
      const message = err instanceof Error ? err.message : "Signup failed";

      if (message.includes("409")) {
        setServerError("An account with this email already exists");
      } else if (message.includes("400")) {
        setServerError("Please check your input and try again");
      } else {
        setServerError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <div
        style={{
          maxWidth: 400,
          margin: "2rem auto",
          padding: "2rem",
          border: "1px solid #333",
          borderRadius: 12,
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Sign Up</h1>

        {serverError && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#fee",
              border: "1px solid #c33",
              borderRadius: 8,
              color: "#c33",
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: 8,
                border: errors.email ? "1px solid #c33" : "1px solid #333",
                backgroundColor: "transparent",
                color: "inherit",
              }}
              disabled={isSubmitting}
            />
            {errors.email && (
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#c33",
                  marginTop: "0.25rem",
                }}
              >
                {errors.email}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: 8,
                border: errors.password ? "1px solid #c33" : "1px solid #333",
                backgroundColor: "transparent",
                color: "inherit",
              }}
              disabled={isSubmitting}
            />
            {errors.password && (
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#c33",
                  marginTop: "0.25rem",
                }}
              >
                {errors.password}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontWeight: 500,
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: 8,
                border: errors.confirmPassword
                  ? "1px solid #c33"
                  : "1px solid #333",
                backgroundColor: "transparent",
                color: "inherit",
              }}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#c33",
                  marginTop: "0.25rem",
                }}
              >
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #646cff",
              backgroundColor: "#646cff",
              color: "white",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#646cff", fontWeight: 500 }}>
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
