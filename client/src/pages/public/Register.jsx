import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Auth.css";

export default function Register(){
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSet, setSelectedSet] = useState("");
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch sets from Supabase
  useEffect(() => {
    const fetchSets = async () => {
      const { data, error } = await supabase.from('sets').select('*').order('year', { ascending: true });
      if (error) console.error("Error fetching sets:", error);
      else setSets(data);
    };
    fetchSets();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!firstName || !lastName || !email || !password || !selectedSet)
      return setError('Please fill all required fields.');

    if (password !== confirm) 
      return setError('Passwords do not match.');

    setLoading(true);
    try {
      // create an auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp(
        { email, password },
        { data: { full_name: `${firstName} ${lastName}`, set_id: selectedSet } }
      );
      if (authError) throw authError;

      // optional: create a profile row linked to the auth user id
      const userId = authData?.user?.id;
      if (userId) {
        try {
          const { error: profileError } = await supabase
            .from('profiles') // <- use profiles table for auth metadata
            .insert([{ id: userId, full_name: `${firstName} ${lastName}`, email, set_id: selectedSet }]);
          if (profileError) {
            console.error('Profile insert error:', profileError);
            // show helpful message with details if available
            throw profileError;
          }
        } catch (insErr) {
          console.error('Failed inserting profile row:', insErr);
          throw insErr;
        }
      }

      setSuccess('Registration successful — check your email to confirm, then sign in.');
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setConfirm(''); setSelectedSet('');
      setTimeout(()=> window.location.href = '/login', 1200);
    } catch(err) {
      console.error('Registration error:', err);
      // Provide detailed message when available
      const msg = err?.message || err?.error || err?.details || JSON.stringify(err) || 'Registration failed.';
      setError(msg.substring(0, 300));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-card">
        <h2>Create an account</h2>
        <div className="auth-sub">Join the FGC OTOBI network to access opportunities and events.</div>

        {error && <div className="error" role="alert">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" value={firstName} onChange={(e)=>setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" value={lastName} onChange={(e)=>setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@domain.com" />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Create password" />
                <button type="button" className="toggle-btn" aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"} onClick={()=>setShowPassword(s=>!s)}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm</label>
              <div className="input-wrap">
                <input id="confirm" type={showConfirm ? "text" : "password"} value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Repeat password" />
                <button type="button" className="toggle-btn" aria-pressed={showConfirm} aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"} onClick={()=>setShowConfirm(s=>!s)}>
                  <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="set">Select your Set</label>
            <select id="set" value={selectedSet} onChange={(e)=>setSelectedSet(e.target.value)}>
              <option value="">-- Select Set --</option>
              {sets.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
              ))}
            </select>
          </div>

          <div className="auth-actions">
            <div className="help">Already registered? <Link to="/login" className="link">Sign in</Link></div>
          </div>

          <button className="btn btn-primary submit-btn" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>
      </div>
    </div>
  )
}
