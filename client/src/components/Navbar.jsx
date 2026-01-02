import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fgc-navbar">
      <div className="nav-container">
        <div className="brand">
          <Link to="/" className="brand-link">
            <img src="/src/assets/images/logo.jpg" alt="FGC OTOBI" className="brand-logo" />
            <div className="brand-text">
              <strong>FGC OTOBI</strong>
              <span className="brand-sub">Alumni Network</span>
            </div>
          </Link>
        </div>

        <nav className="nav-links">
          <Link to="/" className="nav-item">Home</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-item">Dashboard</Link>
              <Link to="/alumni" className="nav-item">Alumni</Link>
            </>
          )}
          <Link to="/about" className="nav-item">About</Link>
          <Link to="/blog" className="nav-item">Blog</Link>
          <Link to="/events" className="nav-item">Events</Link>

          <div className="navbar-right">
            {user ? (
              <button
                className="nav-btn"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
