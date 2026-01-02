import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { supabase } from "../../supabaseClient";
import AvatarImg from "../../assets/images/logo.jpg";
import "./Profile.css";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  // decode JWT payload helper (lightweight)
  const parseJwt = (token) => {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return;
      setLoading(true);
      setError("");
      try {
        const payload = parseJwt(user.token);
        const userId = payload?.sub || payload?.user_id || null;
        if (!userId) throw new Error("Unable to determine user id from token");

        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profErr) throw profErr;

        // if bio missing, set default in DB and use the returned record
        if (!prof?.bio || !prof.bio.trim()) {
          const defaultBio = "Proudly an Alumni 🎉";
          const { data: updated, error: upErr } = await supabase
            .from("profiles")
            .update({ bio: defaultBio })
            .eq("id", userId)
            .single();
          if (upErr) {
            console.warn("Failed to set default bio:", upErr);
            setProfile(prof || null);
          } else {
            setProfile(updated || prof || null);
          }
        } else {
          setProfile(prof || null);
        }

        if (prof?.set_id) {
          const { data: sdata, error: sErr } = await supabase
            .from("sets")
            .select("*")
            .eq("id", prof.set_id)
            .single();
          if (sErr) {
            // not fatal; keep profile but no set
            console.warn("Failed to load set:", sErr);
          } else {
            setSetInfo(sdata || null);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // resolve avatar url when profile changes
  useEffect(() => {
    const resolve = async () => {
      if (!profile?.avatar_url) return setAvatarUrl("");
      try {
        if (typeof profile.avatar_url === "string" && profile.avatar_url.startsWith("http")) {
          setAvatarUrl(profile.avatar_url);
          return;
        }
        const pub = supabase.storage.from("avatar").getPublicUrl(profile.avatar_url);
        const publicUrl = pub?.data?.publicUrl || pub?.publicURL || null;
        if (publicUrl) {
          setAvatarUrl(publicUrl);
          return;
        }
        const signed = await supabase.storage.from("avatar").createSignedUrl(profile.avatar_url, 60 * 60);
        setAvatarUrl(signed?.data?.signedUrl || "");
      } catch (e) {
        console.warn("Failed to resolve avatar url", e);
        setAvatarUrl("");
      }
    };
    resolve();
  }, [profile]);

  const displayName = profile?.full_name || profile?.name || "Alumnus";
  const displaySet = setInfo ? `${setInfo.name} (${setInfo.year})` : profile?.set_id ? `Set of ${profile.set_id}` : "Set not specified";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <img src={AvatarImg} alt="logo" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Welcome, {displayName}</h1>
          <div style={{ color: "#6B7280", marginTop: 6 }}>{displaySet}</div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button style={actionBtnStyle}>Home</button>
          </Link>
          <button onClick={() => (window.location.href = "/alumni")} style={actionBtnStyle}>View Alumni</button>
          <button onClick={() => (window.location.href = "/jobs")} style={actionBtnStyle}>View Jobs</button>
          <Link to="/profile" style={{ textDecoration: "none" }}>
            <button style={primaryBtnStyle}>Edit Profile</button>
          </Link>
          <button onClick={logout} style={logoutBtnStyle}>Logout</button>
        </div>
      </header>

      {loading && <p>Loading profile…</p>}
      {error && <div style={{ color: "#c53030", marginBottom: 12 }}>{error}</div>}

      <main style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left column: main dashboard cards */}
        <section>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link to="/alumni" style={quickLinkStyle}>Browse Alumni</Link>
              <Link to="/jobs" style={quickLinkStyle}>Browse Jobs</Link>
              <Link to="/events" style={quickLinkStyle}>Upcoming Events</Link>
              <Link to="/posts/new" style={quickLinkStyle}>Create Post</Link>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Announcements</h2>
            <ul style={{ paddingLeft: 18, color: "#6B7280" }}>
              <li>No announcements yet — check back later.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Latest Jobs</h2>
            <div style={{ color: "#6B7280" }}>
              <p>No jobs found. Click "View Jobs" to explore or post an opportunity.</p>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
            <div style={{ color: "#6B7280" }}>
              <p>No recent activity to show.</p>
            </div>
          </div>
        </section>

        {/* Right column: profile & stats */}
        <aside>
          <div className="profile-card compact">
            <div className="profile-top">
              <div className="profile-left">
                <div className="profile-avatar">
                  <div className="avatar-card">
                    <img src={avatarUrl || AvatarImg} alt="avatar" className="avatar-img" />
                  </div>
                </div>

                <div className="profile-meta">
                  <h3 className="profile-name">{displayName}</h3>
                  <div className="profile-profession">
                    {profile?.profession && <span className="profession-badge">{profile.profession}</span>}
                    <span className="profile-set">{displaySet}</span>
                  </div>
                  <div className="profile-sub">
                    {profile?.email && <span className="profile-email">{profile.email}</span>}
                  </div>
                  {profile?.bio ? (
                    <div className="profile-bio">{profile.bio.length > 160 ? profile.bio.slice(0, 157) + "…" : profile.bio}</div>
                  ) : null}
                </div>
              </div>

              <div className="profile-top-actions">
                <Link to="/profile" className="btn btn-ghost">View Profile</Link>
                <Link to="/profile/edit" className="btn btn-primary">Edit</Link>
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Connections</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Jobs Applied</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Events</div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// --- inline styles ---
const cardStyle = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
  marginBottom: 16,
  border: "1px solid #E5E7EB",
};

const actionBtnStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid transparent",
  background: "#f3f4f6",
  cursor: "pointer",
};

const primaryBtnStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#86EE60",
  cursor: "pointer",
};

// secondary button styling moved to Profile.css; inline usage removed

const logoutBtnStyle = {
  ...actionBtnStyle,
  background: "#fff",
  border: "1px solid #E5E7EB",
};

const quickLinkStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#f8faf9",
  border: "1px solid #E5E7EB",
  color: "#1F2937",
  textDecoration: "none",
};
