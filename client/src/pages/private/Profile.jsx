import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { supabase } from "../../supabaseClient";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    set_id: "",
    profession: "",
    bio: "",
  });

  // snapshot of loaded form to detect changes
  const [initialForm, setInitialForm] = useState(null);

  // new avatar states
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  // resolved URL for displaying avatar (public or signed); always used in <img src=...>
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState("");
  const fileInputRef = useRef(null);

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

  // split combined full_name into first/last
  const splitFullName = (full = "") => {
    const parts = (full || "").toString().trim().split(/\s+/);
    if (!parts.length) return { first: "", last: "" };
    const first = parts.shift();
    const last = parts.length ? parts.join(" ") : "";
    return { first, last };
  };

  // join first + last to full_name
  const joinFullName = (first = "", last = "") => {
    return `${(first || "").toString().trim()} ${(last || "").toString().trim()}`.trim();
  };

  // helper: get usable url for avatar (public or signed) from stored path or return as-is if already a url
  const getAvatarUrl = async (avatarVal) => {
    if (!avatarVal) return "";
    if (typeof avatarVal === "string" && avatarVal.startsWith("http")) return avatarVal;
    const path = avatarVal.toString();
    try {
      // try public url first (works if bucket is public)
      const pub = supabase.storage.from("avatar").getPublicUrl(path);
      const publicUrl = pub?.data?.publicUrl || pub?.publicURL || null;
      if (publicUrl) return publicUrl;
    } catch {
      // ignore
    }
    try {
      // fallback to signed url (private bucket)
      const signed = await supabase.storage.from("avatar").createSignedUrl(path, 60 * 60); // 1 hour
      return signed?.data?.signedUrl || "";
    } catch (e) {
      console.warn("Failed to create signed url:", e);
      return "";
    }
  };

  // upload avatar -> return storage path (not public url)
  const uploadAvatar = async (file, userId) => {
    if (!file || !userId) return null;
    const ext = file.name.split(".").pop();
    // keep in a folder for clarity
    const filePath = `avatars/${userId}-${Date.now()}.${ext}`;
    try {
      const { error: uploadError } = await supabase.storage.from("avatar").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) {
        const msg = uploadError.message || String(uploadError);
        console.warn("Avatar upload failed:", uploadError);
        setError(
          `Avatar upload failed: ${msg}. Ensure the "avatar" bucket exists and policies allow uploads.`
        );
        return null;
      }
      return filePath; // store path in DB
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("Upload avatar error:", msg);
      setError(`Avatar upload error: ${msg}`);
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return;
      setLoading(true);
      setError("");
      try {
        const payload = parseJwt(user.token);
        const userId = payload?.sub || payload?.user_id || null;
        if (!userId) throw new Error("Invalid user token");

        const { data: prof, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (pErr) throw pErr;
        setProfile(prof || null);

        const { first, last } = splitFullName(prof?.full_name || prof?.name || "");
        setForm({
          first_name: first,
          last_name: last,
          email: prof?.email || "",
          set_id: prof?.set_id || "",
          profession: prof?.profession || "",
          bio: prof?.bio || "",
        });
        // keep a copy to compare for edits
        setInitialForm({
          first_name: first,
          last_name: last,
          email: prof?.email || "",
          set_id: prof?.set_id || "",
          profession: prof?.profession || "",
          bio: prof?.bio || "",
        });

        // resolve a usable preview URL (public or signed) from the stored avatar value
        const previewUrl = await getAvatarUrl(prof?.avatar_url || prof?.avatar_path || "");
        setAvatarDisplayUrl(previewUrl || "");

        const { data: sdata } = await supabase.from("sets").select("*").order("year", { ascending: false });
        setSets(sdata || []);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // avatar selection handler
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewAvatarFile(file);
    const preview = URL.createObjectURL(file);
    // show local preview immediately
    setAvatarDisplayUrl(preview);
  };

  const triggerAvatarInput = () => fileInputRef.current?.click();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // derive whether anything changed (form fields or new avatar file)
  const isDirty = (() => {
    if (newAvatarFile) return true;
    if (!initialForm) return false;
    const curr = {
      first_name: form.first_name || "",
      last_name: form.last_name || "",
      email: form.email || "",
      set_id: form.set_id || "",
      profession: form.profession || "",
      bio: form.bio || "",
    };
    return JSON.stringify(curr) !== JSON.stringify(initialForm);
  })();

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!user?.token) return;
    setError("");
    setSuccess("");

    // build minimal update object (only changed fields)
    const delta = {};
    if (!initialForm) {
      // fallback: update full set
      delta.full_name = joinFullName(form.first_name, form.last_name);
      delta.email = form.email;
      delta.profession = form.profession;
      delta.bio = form.bio;
      if (form.set_id) delta.set_id = form.set_id;
    } else {
      if (form.first_name !== initialForm.first_name || form.last_name !== initialForm.last_name) {
        delta.full_name = joinFullName(form.first_name, form.last_name);
      }
      if (form.email !== initialForm.email) delta.email = form.email;
      if (form.profession !== initialForm.profession) delta.profession = form.profession;
      if (form.bio !== initialForm.bio) delta.bio = form.bio;
      // only set set_id if user selected one different/non-empty
      if ((form.set_id || "") !== (initialForm.set_id || "") && form.set_id) delta.set_id = form.set_id;
    }

    // try avatar upload if a new file selected
    if (newAvatarFile) {
      try {
        const payload = parseJwt(user.token);
        const userId = payload?.sub || payload?.user_id || null;
        if (!userId) throw new Error("Invalid user token");
        const storagePath = await uploadAvatar(newAvatarFile, userId);
        if (storagePath) delta.avatar_url = storagePath;
        else {
          console.warn("Avatar not uploaded — continuing without avatar change.");
          if (!error) setError("Avatar upload failed — profile saved without avatar.");
        }
      } catch (err) {
        console.warn("Avatar upload skipped:", err);
      }
    }

    // nothing to update
    if (Object.keys(delta).length === 0) {
      setSuccess("No changes to save");
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const payload = parseJwt(user.token);
      const userId = payload?.sub || payload?.user_id || null;
      if (!userId) throw new Error("Invalid user token");

      const { data, error: upErr } = await supabase
        .from("profiles")
        .update(delta)
        .eq("id", userId)
        .single();
      if (upErr) throw upErr;

      setProfile(data);

      // refresh form fields from returned record (splitting full_name)
      const { first, last } = splitFullName(data?.full_name || "");
      const newForm = {
        first_name: first,
        last_name: last,
        email: data?.email || form.email,
        set_id: data?.set_id || form.set_id,
        profession: data?.profession || form.profession,
        bio: data?.bio || form.bio,
      };
      setForm(newForm);
      // update initial snapshot so subsequent edits compare correctly
      setInitialForm({ ...newForm });

      // resolve avatar display url if changed
      if (data?.avatar_url) {
        const displayUrl = await getAvatarUrl(data.avatar_url);
        if (displayUrl) setAvatarDisplayUrl(displayUrl);
      }

      setNewAvatarFile(null);
      setEditing(false);
      setSuccess("Profile updated successfully");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleCancel = async () => {
    const { first, last } = splitFullName(profile?.full_name || "");
    setForm({
      first_name: profile?.first_name || first || "",
      last_name: profile?.last_name || last || "",
      email: profile?.email || "",
      set_id: profile?.set_id || "",
      profession: profile?.profession || "",
      bio: profile?.bio || "",
    });
    // restore preview to saved avatar (resolve path -> url)
    setNewAvatarFile(null);
    const resolved = await getAvatarUrl(profile?.avatar_url || "");
    setAvatarDisplayUrl(resolved || "");
    setEditing(false);
    setError("");
  };

  if (!user) {
    return (
      <div>
        <Navbar />
        <main className="profile-container">
          <div className="profile-empty">
            <h3>You must be logged in to view your profile.</h3>
            <Link to="/login" className="btn btn-primary">Login</Link>
          </div>
    </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="profile-container">Loading profile…</main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="profile-container">
        <div className="profile-card">
          <header className="profile-top">
            <div className="profile-left">
              <div className="profile-avatar">
                <div className="avatar-card">
                  <img
                    src={avatarDisplayUrl || "/src/assets/images/avatar-placeholder.png"}
                    alt="avatar"
                    className="avatar-img"
                  />
                  <div className="avatar-actions">
                    {editing ? (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: "none" }} />
                        <div className="avatar-btns">
                          <button type="button" className="btn btn-change" onClick={triggerAvatarInput}>Change</button>
                          {newAvatarFile && (
                            <button
                              type="button"
                              className="btn btn-delete"
                              onClick={async () => {
                                setNewAvatarFile(null);
                                const url = await getAvatarUrl(profile?.avatar_url || "");
                                setAvatarDisplayUrl(url);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="profile-meta">
                <h1 className="profile-name">
                  {(profile?.full_name) ? profile.full_name : `${form.first_name} ${form.last_name}`.trim() || "Alumnus"}
                </h1>

                <div className="profile-profession">
                  {profile?.profession || form.profession ? (
                    <span className="profession-badge">{profile?.profession || form.profession}</span>
                  ) : null}
                  <span className="profile-set">
                    {profile?.set_id ? (sets.find((s) => s.id === profile.set_id)?.name || `Set of ${profile.set_id}`) : "Set not specified"}
                  </span>
                </div>

                <div className="profile-sub">
                  <span className="profile-email">{profile?.email || form.email}</span>
                </div>

                {/* show saved bio only when NOT editing; while editing bio stays in the input */}
                {!editing && profile?.bio ? (
                  <p className="profile-bio">{profile.bio}</p>
                ) : null}
              </div>
            </div>

            <div className="profile-top-actions">
              {!editing ? (
                <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving || !isDirty}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                </>
              )}
            </div>
          </header>

          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <label>
                First name
                <input name="first_name" value={form.first_name} onChange={handleChange} disabled={!editing} />
              </label>

              <label>
                Last name
                <input name="last_name" value={form.last_name} onChange={handleChange} disabled={!editing} />
              </label>
            </div>

            <div className="form-row">
              <label className="full">
                Email
                <input name="email" value={form.email} onChange={handleChange} disabled={!editing} type="email" />
              </label>
            </div>

            <div className="form-row">
              <label className="full">
                Profession
                <input name="profession" value={form.profession} onChange={handleChange} disabled={!editing} placeholder="e.g. Software Engineer" />
              </label>
            </div>

            <div className="form-row">
              <label className="full">
                Bio
                <textarea name="bio" value={form.bio} onChange={handleChange} disabled={!editing} rows={4} placeholder="Short professional bio" />
              </label>
            </div>

            <div className="form-row">
              <label className="full">
                Set
                {profile?.set_id ? (
                  <input value={sets.find((s) => s.id === profile.set_id)?.name || `Set of ${profile.set_id}`} disabled />
                ) : (
                  <select name="set_id" value={form.set_id || ""} onChange={handleChange} disabled={!editing}>
                    <option value="">Select set (optional)</option>
                    {sets.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.year}</option>
                    ))}
                  </select>
                )}
              </label>
            </div>

            <div style={{ display: "none" }}>
              <label>
                Role (hidden)
                <input value={profile?.role || ""} readOnly />
              </label>
            </div>

            <div className="avatar-note">Avatar upload available here.</div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}