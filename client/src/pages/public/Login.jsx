import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient"; // adjust path if your client is elsewhere
import { useAuth } from "../../context/auth-context";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please enter email and password.");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const token = data?.session?.access_token;
      if (!token) throw new Error("No session token returned");
      login(token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <div className="auth-sub">Sign in to access your alumni dashboard</div>

        {error && <div className="error" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <div className="auth-actions">
            <div className="help"><Link to="/forgot" className="link">Forgot password?</Link></div>
            <div className="help">No account? <Link to="/register" className="link">Register</Link></div>
          </div>

          <button className="btn btn-primary submit-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
