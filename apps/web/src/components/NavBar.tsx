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
    <header className="navbar">
      <nav className="navbar-inner">
        <Link to="/" className="brand">
          InternTrackr
        </Link>
        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "link link-active" : "link"
            }
          >
            Home
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/applications"
              className={({ isActive }) =>
                isActive ? "link link-active" : "link"
              }
            >
              Applications
            </NavLink>
          )}
          {isAuthenticated ? (
            <div className="nav-links">
              <div className="nav-links">
                <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  {user?.email}
                </span>
                <span
                  className="status-dot"
                  style={{
                    backgroundColor: isConnected ? "#10b981" : "#ef4444",
                  }}
                  title={isConnected ? "Live" : "Offline"}
                />
              </div>
              <button onClick={handleLogout} className="btn btn-ghost">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-links">
              <NavLink to="/login" className="btn btn-ghost">
                Login
              </NavLink>
              <NavLink to="/signup" className="btn btn-primary">
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
