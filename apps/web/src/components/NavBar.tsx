import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";

export function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        borderBottom: "1px solid #333",
        background: "transparent",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
          InternTrackr
        </Link>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              textDecoration: "none",
              fontWeight: isActive ? 700 : 500,
            })}
          >
            Home
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/applications"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontWeight: isActive ? 700 : 500,
              })}
            >
              Applications
            </NavLink>
          )}

          {isAuthenticated ? (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  {user?.email}
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: isConnected ? "#10b981" : "#ef4444",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                  title={isConnected ? "Live" : "Offline"}
                />
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #333",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <NavLink
                to="/login"
                style={{
                  textDecoration: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #333",
                }}
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                style={{
                  textDecoration: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #646cff",
                  backgroundColor: "#646cff",
                  color: "white",
                }}
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
