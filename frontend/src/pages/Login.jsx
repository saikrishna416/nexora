
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/accounts/login/", {
        username,
        password,
      });

      login(response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      navigate("/");
    } catch (error) {
      console.error(error);

      if (error.response?.data) {
        setError("Invalid username or password. Please try again.");
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #dbe3ee",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#f8fafc",
    color: "#111827",
  };

  return (
    <main
      className="nx-login-page"
      style={{
        minHeight: "calc(100vh - 70px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #eef2ff 100%)",
        boxSizing: "border-box",
      }}
    >
      <div
        className="nx-login-layout"
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          background: "#ffffff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        {/* Welcome panel */}
        <section
          className="nx-login-welcome"
          style={{
            padding: "48px 38px",
            background: "linear-gradient(145deg, #0f172a, #134e4a 75%, #0f766e)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "36px",
          }}
        >
          <div>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                color: "white",
                textDecoration: "none",
                fontSize: "25px",
                fontWeight: "800",
                letterSpacing: "-0.8px",
              }}
            >
              <ShoppingBag size={28} />
              Nexora
            </Link>

            <p
              style={{
                color: "#99f6e4",
                fontWeight: "700",
                fontSize: "12px",
                letterSpacing: "2px",
                marginTop: "54px",
              }}
            >
              SHOP SMARTER. LIVE BETTER.
            </p>

            <h1
              style={{
                fontSize: "clamp(30px, 4vw, 43px)",
                lineHeight: "1.15",
                letterSpacing: "-1.2px",
                margin: "16px 0",
              }}
            >
              Good to see
              <br />
              you again.
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                lineHeight: "1.8",
                fontSize: "15px",
                maxWidth: "340px",
              }}
            >
              Your next favorite find is waiting. Sign in and pick up where
              your shopping journey left off.
            </p>
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: "15px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <ShieldCheck size={28} color="#99f6e4" />
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px" }}>
                Your account, your way
              </div>
              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "12px",
                  marginTop: "5px",
                }}
              >
                Sign in to access your Nexora account.
              </div>
            </div>
          </div>
        </section>

        {/* Login form */}
        <section
          className="nx-login-form"
          style={{
            padding: "clamp(28px, 5vw, 54px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ marginBottom: "30px" }}>
            <p
              style={{
                color: "#0f766e",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1.8px",
                margin: "0 0 10px",
              }}
            >
              WELCOME BACK
            </p>

            <h2
              style={{
                fontSize: "32px",
                letterSpacing: "-1px",
                color: "#0f172a",
                margin: "0 0 10px",
              }}
            >
              Sign in
            </h2>

            <p style={{ color: "#64748b", margin: 0, lineHeight: "1.6" }}>
              Enter your details to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "21px" }}>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  marginBottom: "9px",
                  fontWeight: "700",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                placeholder="Enter your username"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "9px",
                  fontWeight: "700",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                Password
              </label>

              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: "48px" }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    padding: "5px",
                  }}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
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
                  borderRadius: "10px",
                  marginBottom: "18px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background: loading
                  ? "#64748b"
                  : "linear-gradient(100deg, #0f766e, #115e59)",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 8px 18px rgba(15, 118, 110, 0.2)",
              }}
            >
              {loading ? "Signing in..." : "Sign in to Nexora"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              margin: "27px 0",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            YOUR SHOPPING JOURNEY
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            New to Nexora?{" "}
            <Link
              to="/register"
              style={{
                color: "#0f766e",
                fontWeight: "800",
                textDecoration: "none",
              }}
            >
              Create an account
            </Link>
          </p>

          <p
            style={{
              textAlign: "center",
              margin: "25px 0 0",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            <Link
              to="/"
              style={{ color: "#64748b", textDecoration: "none" }}
            >
              ← Back to shopping
            </Link>
          </p>
        </section>
      </div>
      <style>{`
        .nx-login-page { width: 100%; }
        .nx-login-layout { min-width: 0; }
        .nx-login-welcome, .nx-login-form { min-width: 0; }
        @media (max-width: 760px) {
          .nx-login-page { padding: 18px 12px !important; align-items: flex-start !important; }
          .nx-login-layout { max-width: 440px !important; grid-template-columns: minmax(0, 1fr) !important; border-radius: 18px !important; }
          .nx-login-welcome { display: none !important; }
          .nx-login-form { padding: 24px 20px !important; }
          .nx-login-form h1, .nx-login-form h2 { font-size: clamp(24px, 6vw, 30px) !important; }
        }
        @media (max-width: 380px) {
          .nx-login-page { padding: 12px 8px !important; }
          .nx-login-form { padding: 20px 16px !important; }
        }
      `}</style>
    </main>
  );
}

export default Login;
