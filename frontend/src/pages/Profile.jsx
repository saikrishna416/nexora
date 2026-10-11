
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Package,
  Heart,
  MapPin,
  Mail,
  Phone,
  LogIn,
  UserPlus,
  Pencil,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

function Profile() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    api
      .get("/accounts/profile/")
      .then((response) => {
        if (isMounted) setProfile(response.data);
      })
      .catch((err) => {
        console.error("Profile loading failed:", err);
        if (isMounted) {
          setError(
            "Could not load your profile. Please log in again if your session has expired."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const accountName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      profile.username
    : "";

  if (!isAuthenticated) {
    return (
      <main className="nex-profile-page">
        <section className="nex-profile-guest">
          <div className="nex-profile-guest-icon">
            <UserRound size={38} />
          </div>

          <span className="nex-profile-eyebrow">
            YOUR NEXORA ACCOUNT
          </span>

          <h1>Welcome to Nexora</h1>

          <p className="nex-profile-muted">
            Sign in to manage your account, track orders, and keep your
            favorite finds close.
          </p>

          <div className="nex-profile-actions">
            <Link to="/login" className="nex-profile-primary">
              <LogIn size={18} />
              Login
              <ArrowRight size={16} />
            </Link>

            <Link to="/register" className="nex-profile-secondary">
              <UserPlus size={18} />
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="nex-profile-page">
        <div className="nex-profile-status">
          <RefreshCw className="nex-profile-spinner" size={25} />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="nex-profile-page">
        <div className="nex-profile-status nex-profile-error">
          <ShieldCheck size={28} />
          <p>{error}</p>
          <button
            type="button"
            className="nex-profile-primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="nex-profile-page">
        <div className="nex-profile-status">
          <UserRound size={28} />
          <p>Profile information is unavailable.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="nex-profile-page">
      <div className="nex-profile-content">
        <header className="nex-profile-header">
          <div>
            <span className="nex-profile-eyebrow">
              ACCOUNT CENTER
            </span>
            <h1>My Account</h1>
            <p>
              Welcome back, <strong>{accountName}</strong>. Manage your
              personal details and shopping activity here.
            </p>
          </div>

          <div className="nex-profile-header-icon">
            <UserRound size={27} />
          </div>
        </header>

        <section className="nex-profile-card">
          <div className="nex-profile-avatar">
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt={`${accountName}'s profile`}
              />
            ) : (
              <UserRound size={35} />
            )}
          </div>

          <div className="nex-profile-identity">
            <h2>{accountName}</h2>
            <p>@{profile.username}</p>
            {profile.email && (
              <span className="nex-profile-email">
                <Mail size={14} />
                {profile.email}
              </span>
            )}
          </div>

          <Link to="/profile/edit" className="nex-profile-edit">
            <Pencil size={16} />
            <span>Edit profile</span>
          </Link>
        </section>

        <section className="nex-profile-section">
          <div className="nex-profile-section-heading">
            <div>
              <h2>Personal information</h2>
              <p>Your contact and delivery details</p>
            </div>
            <Link
              to="/profile/edit"
              className="nex-profile-text-link"
            >
              Edit details <ArrowRight size={15} />
            </Link>
          </div>

          <div className="nex-profile-details">
            <Detail
              icon={<Mail size={20} />}
              label="Email address"
              value={profile.email || "Add your email address"}
            />
            <Detail
              icon={<Phone size={20} />}
              label="Mobile number"
              value={profile.phone_number || "Add your mobile number"}
            />
            <Detail
              icon={<MapPin size={20} />}
              label="Delivery address"
              value={profile.address || "Add your delivery address"}
            />
          </div>
        </section>

        <section className="nex-profile-section">
          <div className="nex-profile-section-heading">
            <div>
              <h2>Your shopping</h2>
              <p>Everything you need, all in one place</p>
            </div>
          </div>

          <div className="nex-profile-menu">
            <MenuLink
              to="/orders"
              icon={<Package size={22} />}
              title="My Orders"
              subtitle="View and track your purchases"
            />

            <MenuLink
              to="/wishlist"
              icon={<Heart size={22} />}
              title="My Wishlist"
              subtitle="Find the products you have saved"
            />

            <MenuLink
              to="/profile/edit"
              icon={<MapPin size={22} />}
              title="Personal details & address"
              subtitle="Update your contact and delivery information"
            />
          </div>
        </section>

        <footer className="nex-profile-footer">
          <ShieldCheck size={17} />
          <span>Your Nexora account, your shopping experience.</span>
        </footer>
      </div>

      <style>{`
        .nex-profile-page {
          min-height: 70vh;
          padding: 42px 20px 60px;
          background:
            radial-gradient(ellipse at 5% 0%, rgba(94, 234, 212, 0.08), transparent 34%),
            #f8fafc;
          color: #111827;
        }

        .nex-profile-content {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .nex-profile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .nex-profile-eyebrow {
          display: inline-block;
          margin-bottom: 9px;
          color: #0f766e;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.7px;
        }

        .nex-profile-header h1,
        .nex-profile-guest h1 {
          margin: 0 0 10px;
          color: #111827;
          font-size: clamp(27px, 4vw, 35px);
          line-height: 1.2;
          letter-spacing: -1px;
        }

        .nex-profile-header p,
        .nex-profile-muted {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.7;
        }

        .nex-profile-header-icon {
          display: grid;
          width: 58px;
          height: 58px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #ccfbf1;
          border-radius: 18px;
          background: #ecfdf5;
          color: #0f766e;
        }

        .nex-profile-card {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
          padding: 25px;
          margin-bottom: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: white;
          box-shadow: 0 5px 20px rgba(15, 23, 42, 0.04);
        }

        .nex-profile-avatar {
          display: grid;
          width: 76px;
          height: 76px;
          flex-shrink: 0;
          place-items: center;
          overflow: hidden;
          border: 3px solid #ccfbf1;
          border-radius: 50%;
          background: #e6fffb;
          color: #0f766e;
        }

        .nex-profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .nex-profile-identity {
          flex: 1;
          min-width: 0;
        }

        .nex-profile-identity h2 {
          margin: 0 0 5px;
          overflow-wrap: anywhere;
          font-size: 20px;
        }

        .nex-profile-identity p {
          margin: 0 0 9px;
          color: #6b7280;
          font-size: 13px;
        }

        .nex-profile-email {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: #6b7280;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .nex-profile-edit,
        .nex-profile-primary,
        .nex-profile-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 11px 15px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s;
        }

        .nex-profile-edit {
          flex-shrink: 0;
          border: 1px solid #99f6e4;
          background: #f0fdfa;
          color: #0f766e;
        }

        .nex-profile-primary {
          border: 1px solid #111827;
          background: #111827;
          color: white;
          cursor: pointer;
        }

        .nex-profile-secondary {
          border: 1px solid #d1d5db;
          background: white;
          color: #111827;
        }

        .nex-profile-primary:hover,
        .nex-profile-secondary:hover,
        .nex-profile-edit:hover {
          transform: translateY(-1px);
        }

        .nex-profile-section {
          margin-top: 30px;
        }

        .nex-profile-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 15px;
        }

        .nex-profile-section-heading h2 {
          margin: 0 0 5px;
          font-size: 19px;
          letter-spacing: -0.3px;
        }

        .nex-profile-section-heading p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .nex-profile-text-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          color: #0f766e;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .nex-profile-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .nex-profile-detail {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          min-width: 0;
          padding: 19px;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
          background: white;
        }

        .nex-profile-detail-icon {
          display: grid;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 11px;
          background: #ecfdf5;
          color: #0f766e;
        }

        .nex-profile-detail-label {
          margin: 1px 0 7px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
        }

        .nex-profile-detail-value {
          margin: 0;
          color: #111827;
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .nex-profile-menu {
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          background: white;
        }

        .nex-profile-menu-item {
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
          padding: 19px 21px;
          color: #111827;
          text-decoration: none;
          transition: background 0.2s;
        }

        .nex-profile-menu-item + .nex-profile-menu-item {
          border-top: 1px solid #f1f5f9;
        }

        .nex-profile-menu-item:hover {
          background: #f0fdfa;
        }

        .nex-profile-menu-icon {
          display: grid;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 12px;
          background: #ecfdf5;
          color: #0f766e;
        }

        .nex-profile-menu-copy {
          flex: 1;
          min-width: 0;
        }

        .nex-profile-menu-copy strong {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .nex-profile-menu-copy span {
          display: block;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }

        .nex-profile-menu-arrow {
          flex-shrink: 0;
          color: #0f766e;
        }

        .nex-profile-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 28px;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
        }

        .nex-profile-footer svg {
          flex-shrink: 0;
          color: #0f766e;
        }

        .nex-profile-guest {
          max-width: 480px;
          margin: 35px auto;
          padding: 42px 30px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: white;
          box-shadow: 0 10px 35px rgba(15, 23, 42, 0.06);
          text-align: center;
        }

        .nex-profile-guest-icon {
          display: grid;
          width: 76px;
          height: 76px;
          place-items: center;
          margin: 0 auto 22px;
          border: 1px solid #99f6e4;
          border-radius: 23px;
          background: #ecfdf5;
          color: #0f766e;
        }

        .nex-profile-guest .nex-profile-eyebrow {
          margin-bottom: 12px;
        }

        .nex-profile-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 25px;
        }

        .nex-profile-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          max-width: 520px;
          min-height: 230px;
          margin: 20px auto;
          padding: 28px;
          color: #0f766e;
          text-align: center;
        }

        .nex-profile-status p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.7;
        }

        .nex-profile-error {
          color: #dc2626;
        }

        .nex-profile-spinner {
          animation: nex-profile-spin 1s linear infinite;
        }

        @keyframes nex-profile-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .nex-profile-page {
            padding: 28px 14px 40px;
          }

          .nex-profile-header {
            align-items: flex-start;
          }

          .nex-profile-header-icon {
            width: 46px;
            height: 46px;
            border-radius: 14px;
          }

          .nex-profile-card {
            flex-wrap: wrap;
            gap: 14px;
            padding: 18px;
            border-radius: 15px;
          }

          .nex-profile-avatar {
            width: 60px;
            height: 60px;
          }

          .nex-profile-identity h2 {
            font-size: 17px;
          }

          .nex-profile-edit {
            margin-left: auto;
          }

          .nex-profile-details {
            grid-template-columns: minmax(0, 1fr);
          }

          .nex-profile-detail {
            padding: 16px;
          }

          .nex-profile-section-heading {
            align-items: flex-start;
          }

          .nex-profile-section-heading h2 {
            font-size: 17px;
          }

          .nex-profile-text-link {
            margin-top: 3px;
          }

          .nex-profile-menu-item {
            gap: 11px;
            padding: 16px 13px;
          }

          .nex-profile-menu-icon {
            width: 39px;
            height: 39px;
          }

          .nex-profile-menu-copy strong {
            font-size: 13px;
          }

          .nex-profile-menu-copy span {
            font-size: 11px;
          }

          .nex-profile-guest {
            margin: 15px auto;
            padding: 32px 20px;
          }

          .nex-profile-actions {
            flex-direction: column;
          }

          .nex-profile-actions a {
            width: 100%;
          }
        }

        @media (max-width: 360px) {
          .nex-profile-header-icon {
            display: none;
          }

          .nex-profile-card {
            padding: 15px;
          }

          .nex-profile-edit {
            width: 100%;
          }

          .nex-profile-section-heading {
            flex-direction: column;
            gap: 8px;
          }

          .nex-profile-detail {
            gap: 10px;
            padding: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nex-profile-page *,
          .nex-profile-page *::before,
          .nex-profile-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="nex-profile-detail">
      <div className="nex-profile-detail-icon">{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p className="nex-profile-detail-label">{label}</p>
        <p className="nex-profile-detail-value">{value}</p>
      </div>
    </div>
  );
}

function MenuLink({ to, icon, title, subtitle }) {
  return (
    <Link to={to} className="nex-profile-menu-item">
      <span className="nex-profile-menu-icon">{icon}</span>
      <span className="nex-profile-menu-copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
      <ArrowRight className="nex-profile-menu-arrow" size={18} />
    </Link>
  );
}

export default Profile;
