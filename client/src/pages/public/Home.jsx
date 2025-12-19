import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import HeroImg from "../../assets/images/school1.jpeg";
import StoryImg from "../../assets/images/school2.jpg";
import AlumniImg from "../../assets/images/school 3.jpeg";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const Home = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  return (
    <div className="page-root">
      <Navbar />
      <main className="home-page">
       <section
  className="hero"
  style={{
    backgroundImage: `linear-gradient(rgba(11,22,14,0.35), rgba(4,7,4,0.2)), url(${HeroImg})`
  }}
>
  <div className="hero-overlay">
    <div className="container">
      <div className="hero-content">
        <span className="kicker">FGC OTOBI</span>
        <h1 className="hero-title">
          Federal Government College Alumni Network
        </h1>
        <p className="hero-lead">
          A trusted alumni community for connection, mentorship, and opportunity sharing.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">Join Network</Link>
          <Link to="/login" className="btn btn-secondary">Login</Link>
        </div>

        <form className="hero-search" onSubmit={handleSearch} aria-label="Search alumni">
          <input
            className="hero-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alumni, opportunities, events..."
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        <div className="hero-stats">
          <span>5k+ Alumni</span>
          <span>120+ Opportunities</span>
          <span>30+ Events / Year</span>
        </div>
      </div>
    </div>
  </div>
</section>


        {/* ABOUT */}
        <section className="about container">
          <div className="about-grid">
            <div className="about-text">
              <span className="section-kicker">About</span>
              <h2>FGC Otobi Alumni Network</h2>
              <p className="about-lead">
                We are a growing alumni-led community committed to lifelong connection,
                career advancement, mentorship, and giving back to our school.
              </p>

              <ul className="about-list">
                <li>🎓 Alumni from diverse professions worldwide</li>
                <li>🤝 Mentorship & career guidance</li>
                <li>💼 Verified jobs & opportunities</li>
              </ul>

              <div className="about-actions">
                <Link to="/register" className="btn btn-primary">Join Alumni</Link>
                <Link to="/blog" className="btn btn-secondary">Read Stories</Link>
              </div>
            </div>

            <div className="about-media">
              <img src={AlumniImg} alt="FGC Otobi alumni" />
              <p className="image-caption">Alumni at a regional chapter meetup</p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features container">
          <div className="feature-card">
            <h3>Our Mission</h3>
            <p>
              To build a lifelong alumni community that supports students,
              uplifts members professionally, and promotes excellence.
            </p>
          </div>

          <div className="feature-card">
            <h3>Alumni Impact</h3>
            <p>
              Discover stories of alumni making meaningful impact
              across technology, business, and public service.
            </p>
          </div>

          <div className="feature-card">
            <h3>Opportunities</h3>
            <p>
              Access approved jobs, internships, and mentorship
              opportunities shared by fellow alumni.
            </p>
          </div>
        </section>

        {/* STORIES */}
        <section className="stories container">
          <div className="section-header">
            <h2>Impact Stories</h2>
            <Link to="/blog" className="view-all">View all</Link>
          </div>

          <div className="story-grid">
            <article className="story-card">
              <img src={StoryImg} alt="Alumni story" />
              <div className="story-body">
                <h4>From Classroom to Community Leader</h4>
                <p>How an alumnus built a social enterprise supporting graduates.</p>
                <Link to="/blog/1">Read more</Link>
              </div>
            </article>

            <article className="story-card">
              <div className="story-body">
                <h4>Career Growth Through Mentorship</h4>
                <p>A short preview of another inspiring journey.</p>
                <Link to="/blog/2">Read more</Link>
              </div>
            </article>

            <article className="story-card">
              <div className="story-body">
                <h4>Alumni Spotlight</h4>
                <p>Highlighting excellence and leadership.</p>
                <Link to="/blog/3">Read more</Link>
              </div>
            </article>
          </div>
        </section>

        {/* CTA */}
        <section className="cta container">
          <div className="cta-box">
            <h3>Ready to reconnect?</h3>
            <p>
              Join the alumni network to update your profile,
              post opportunities, and attend events.
            </p>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Home;
