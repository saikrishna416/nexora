
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProfileEdit() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/accounts/profile/")
      .then((response) => {
        setForm({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          email: response.data.email || "",
          phone_number: response.data.phone_number || "",
          address: response.data.address || "",
        });
      })
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch("/accounts/profile/", form);
      setSuccess("Profile updated successfully!");

      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      setError(
        err.response?.data?.email?.[0] ||
        "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={messageStyle}>Loading profile...</p>;

  return (
    <main style={pageStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h1>Edit Personal Details</h1>
        <p style={{ color: "#6b7280" }}>
          Update your account and delivery information.
        </p>

        <label>First Name</label>
        <input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>Last Name</label>
        <input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>Email Address</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <label>Mobile Number</label>
        <input
          type="tel"
          name="phone_number"
          value={form.phone_number}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>Delivery Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          rows={4}
          style={inputStyle}
        />

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        {success && <p style={{ color: "#168746" }}>{success}</p>}

        <button type="submit" disabled={saving} style={saveButton}>
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          style={cancelButton}
        >
          Cancel
        </button>
      </form>
    </main>
  );
}

const pageStyle = {
  minHeight: "70vh",
  backgroundColor: "#f8fafc",
  padding: "40px 20px",
};

const formStyle = {
  maxWidth: "550px",
  margin: "0 auto",
  padding: "30px",
  backgroundColor: "white",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
};

const inputStyle = {
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "15px",
  marginBottom: "12px",
  fontFamily: "inherit",
};

const saveButton = {
  padding: "13px",
  backgroundColor: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const cancelButton = {
  padding: "12px",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  cursor: "pointer",
};

const messageStyle = { textAlign: "center", padding: "40px" };

export default ProfileEdit;
