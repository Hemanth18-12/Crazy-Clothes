import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            name: data.name || currentUser.displayName || "",
            phone: data.phone || "",
            address: data.address || ""
          });
        } else {
          // Fallback if doc doesn't exist yet
          setProfile({
            name: currentUser.displayName || "",
            phone: "",
            address: ""
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleInputChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const docRef = doc(db, "users", currentUser.uid);
      await setDoc(docRef, {
        name: profile.name,
        email: currentUser.email,
        phone: profile.phone,
        address: profile.address,
        updatedAt: new Date()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="container" style={{ minHeight: "80vh", paddingTop: "8rem", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "3.5rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            MY PROFILE
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            Manage your personal and shipping details
          </p>
          <div style={{ width: "80px", height: "2px", backgroundColor: "var(--color-accent)", margin: "1rem auto 0" }}></div>
        </div>

        {/* Profile Card */}
        <div className="auth-card" style={{ padding: "2.5rem 3rem", width: "100%", boxSizing: "border-box" }}>
          
          {/* Email Info (Read Only) */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem", 
            marginBottom: "2.5rem", 
            paddingBottom: "1.5rem", 
            borderBottom: "1px solid var(--color-border)",
            fontFamily: "var(--font-mono)"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(220,38,38,0.1)",
              border: "1px solid var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              color: "var(--color-accent)",
              fontWeight: 800
            }}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Logged In As
              </div>
              <div style={{ fontSize: "0.95rem", color: "var(--color-text-primary)", fontWeight: 600 }}>
                {currentUser.email}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Display message */}
            {error && (
              <div className="auth-message error visible" style={{ display: "block", margin: 0 }}>
                {error}
              </div>
            )}
            {success && (
              <div className="auth-message success visible" style={{ display: "block", margin: 0, backgroundColor: "rgba(16,185,129,0.1)", borderColor: "#10b981", color: "#10b981" }}>
                ✓ Profile details updated successfully!
              </div>
            )}

            {/* Name */}
            <div className="input-group" style={{ margin: 0 }}>
              <input
                type="text"
                id="profile-name"
                placeholder=" "
                className="form-input-premium"
                value={profile.name}
                onChange={handleInputChange("name")}
              />
              <label htmlFor="profile-name" className="form-label">Full Name</label>
              <div className="input-underline"></div>
            </div>

            {/* Phone */}
            <div className="input-group" style={{ margin: 0 }}>
              <input
                type="tel"
                id="profile-phone"
                placeholder=" "
                className="form-input-premium"
                value={profile.phone}
                onChange={handleInputChange("phone")}
              />
              <label htmlFor="profile-phone" className="form-label">Phone Number</label>
              <div className="input-underline"></div>
            </div>

            {/* Default Shipping Address */}
            <div className="input-group" style={{ margin: 0 }}>
              <textarea
                id="profile-address"
                placeholder=" "
                className="form-input-premium"
                style={{ minHeight: "100px", resize: "vertical", paddingTop: "1rem" }}
                value={profile.address}
                onChange={handleInputChange("address")}
              />
              <label htmlFor="profile-address" className="form-label" style={{ top: "0" }}>Default Delivery Address</label>
              <div className="input-underline"></div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-premium shimmer-btn"
                style={{ flex: 1, padding: "0.85rem 1.5rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              >
                {saving ? (
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid rgba(0,0,0,0.1)",
                    borderTop: "2px solid currentColor",
                    borderRadius: "50%",
                    animation: "button-spin 0.6s linear infinite"
                  }} />
                ) : (
                  "Save Profile"
                )}
              </button>
              <Link
                to="/orders"
                className="btn"
                style={{ 
                  padding: "0.85rem 1.5rem", 
                  border: "1px solid var(--color-border)", 
                  textDecoration: "none", 
                  color: "var(--color-text-primary)", 
                  fontFamily: "var(--font-display)", 
                  textTransform: "uppercase", 
                  fontSize: "0.9rem",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent"
                }}
              >
                My Orders
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
