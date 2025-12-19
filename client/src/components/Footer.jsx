import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="fgc-footer">
      <div className="footer-container">
        <div className="col">
          <h4>FGC OTOBI</h4>
          <p className="muted">Federal Government College – Alumni Network</p>
          <p className="muted">Otobi, Kogi State · contact@fgcotobi.edu.ng</p>
        </div>

        <div className="col">
          <h5>Quick Links</h5>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/events">Events</Link></li>
          </ul>
        </div>

        <div className="col">
          <h5>Community</h5>
          <ul>
            <li><Link to="/directory">Directory</Link></li>
            <li><Link to="/jobs">Jobs</Link></li>
            <li><Link to="/join">Join</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <small>© {new Date().getFullYear()} FGC OTOBI Alumni Network. All rights reserved.</small>
      </div>
    </footer>
  );
};

export default Footer;
