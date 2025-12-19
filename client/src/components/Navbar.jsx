import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
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
          <Link to="/about" className="nav-item">About</Link>
          <Link to="/blog" className="nav-item">Blog</Link>
          <Link to="/events" className="nav-item">Events</Link>
          <Link to="/login" className="nav-item nav-cta">Login</Link>
          <Link to="/register" className="nav-item nav-cta btn-primary">Register</Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
