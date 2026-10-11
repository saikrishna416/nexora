
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Eye,
  EyeOff,
  ArrowRight,
  UserRound,
  Mail,
  LockKeyhole,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/accounts/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setSuccess("Account created successfully! Taking you to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error
      );

      const errorData = error.response?.data;

      setError(
        errorData?.username?.[0] ||
          errorData?.email?.[0] ||
          errorData?.password?.[0] ||
          errorData?.detail ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px 13px 43px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    outline: "none",
    backgroundColor: "#fafaff",
    color: "#1f2937",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const fieldStyle = {
    display: "block",
    marginBottom: "7px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "700",
  };

  const iconStyle = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    pointerEvents: "none",
  };

  const toggleStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: "#8b5cf6",
    cursor: "pointer",
    padding: "5px",
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 70px)",
        boxSizing: "border-box",
        padding: "36px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 10% 10%, #f3e8ff 0, transparent 32%), radial-gradient(circle at 90% 90%, #ffe4e6 0, transparent 30%), #f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
          background: "#ffffff",
          borderRadius: "26px",
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(76, 29, 149, 0.13)",
          border: "1px solid rgba(255,255,255,0.8)",
        }}
      >
        {/* Left welcome panel */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "42px 34px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            color: "white",
            background:
              "linear-gradient(145deg, #4c1d95 0%, #7c3aed 52%, #db2777 120%)",
            minHeight: "560px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "250px",
              height: "250px",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "50%",
              right: "-100px",
              top: "80px",
              boxShadow:
                "0 0 0 35px rgba(255,255,255,0.04), 0 0 0 70px rgba(255,255,255,0.03)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                color: "white",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: "42px",
                  height: "42px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "13px",
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <ShoppingBag size={23} />
              </span>
              <span style={{ fontSize: "23px", fontWeight: "800", letterSpacing: "-0.7px" }}>
                nexora
              </span>
            </Link>
          </div>

          <div style={{ position: "relative", zIndex: 1, margin: "50px 0" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 12px",
                borderRadius: "30px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "23px",
              }}
            >
              <Sparkles size={15} />
              YOUR SHOPPING JOURNEY STARTS HERE
            </div>

            <h1
              style={{
                fontSize: "clamp(32px, 4vw, 43px)",
                lineHeight: "1.15",
                letterSpacing: "-1.5px",
                margin: "0 0 18px",
                fontWeight: "800",
              }}
            >
              A little more
              <br />
              you. A lot more
              <br />
              <span style={{ color: "#fbcfe8" }}>Nexora.</span>
            </h1>

            <p
              style={{
                color: "#ede9fe",
                lineHeight: "1.8",
                fontSize: "14px",
                maxWidth: "300px",
                margin: 0,
              }}
            >
              Discover your favorites, save what you love, and enjoy a shopping
              experience designed around you.
            </p>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              color: "#ede9fe",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "9px", alignItems: "center", marginBottom: "9px" }}>
              <CheckCircle2 size={16} />
              Your next favorite thing is waiting.
            </div>
            <div style={{ opacity: 0.8 }}>Nexora · Shop Smarter. Live Better.</div>
          </div>
        </section>

        {/* Registration form */}
        <section
          style={{
            padding: "42px clamp(22px, 5vw, 55px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: "27px" }}>
            <p
              style={{
                color: "#8b5cf6",
                fontWeight: "800",
                fontSize: "12px",
                letterSpacing: "1.7px",
                margin: "0 0 10px",
              }}
            >
              CREATE YOUR ACCOUNT
            </p>

            <h2
              style={{
                color: "#1f2937",
                fontSize: "31px",
                letterSpacing: "-1px",
                margin: "0 0 9px",
              }}
            >
              Let's get you started.
            </h2>

            <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
              A few details and you're ready to go.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "17px" }}>
              <label htmlFor="username" style={fieldStyle}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <UserRound size={18} style={iconStyle} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="Choose a username"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "17px" }}>
              <label htmlFor="email" style={fieldStyle}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={iconStyle} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "17px" }}>
              <label htmlFor="password" style={fieldStyle}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <LockKeyhole size={18} style={iconStyle} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  required
                  style={{ ...inputStyle, paddingRight: "45px" }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  style={toggleStyle}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "21px" }}>
              <label htmlFor="confirmPassword" style={fieldStyle}>
                Confirm password
              </label>
              <div style={{ position: "relative" }}>
                <LockKeyhole size={18} style={iconStyle} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  required
                  style={{ ...inputStyle, paddingRight: "45px" }}
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={toggleStyle}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  color: "#b91c1c",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  marginBottom: "17px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  color: "#166534",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  marginBottom: "17px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 17px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                border: "none",
                borderRadius: "12px",
                background: loading
                  ? "#a78bfa"
                  : "linear-gradient(100deg, #7c3aed, #c026d3)",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "700",
                boxShadow: "0 8px 20px rgba(124,58,237,0.2)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              {loading ? "Creating your account..." : "Create my account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
              margin: "24px 0 18px",
              color: "#d1d5db",
              fontSize: "11px",
            }}
          >
            <span style={{ height: "1px", flex: 1, background: "#e5e7eb" }} />
            YOUR NEXT CHAPTER STARTS HERE
            <span style={{ height: "1px", flex: 1, background: "#e5e7eb" }} />
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: "13px",
              margin: 0,
            }}
          >
            Already part of Nexora?{" "}
            <Link
              to="/login"
              style={{
                color: "#7c3aed",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>

          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "11px",
              lineHeight: 1.6,
              margin: "22px 0 0",
            }}
          >
            By creating an account, you can save favorites and keep track of
            your shopping orders.
          </p>
        </section>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .register-unused {}
        }
        input:focus {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.16);
        }
        button[type="submit"]:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 25px rgba(124, 58, 237, 0.28);
        }
      `}</style>
    </div>
  );
}

export default Register;
