import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  FileText,
  Truck,
  RotateCcw,
  CreditCard,
  HelpCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

const POLICY_NAV_LINKS = [
  { path: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
  { path: "/terms-and-conditions", label: "Terms & Conditions", icon: FileText },
  { path: "/return-refund-policy", label: "Return & Refund Policy", icon: RotateCcw },
  { path: "/shipping-policy", label: "Shipping & Delivery", icon: Truck },
  { path: "/payment-policy", label: "Payment Policy", icon: CreditCard },
  { path: "/faq", label: "Frequently Asked Questions", icon: HelpCircle },
  { path: "/contact", label: "Contact Customer Care", icon: Mail },
];

export function ConfigValue({ value, fallback = "Pending administrator configuration", prefix = "", suffix = "" }) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="nx-config-pending" title="This detail has not been officially configured yet in Django Admin">
        [{fallback}]
      </span>
    );
  }
  return (
    <strong className="nx-config-value">
      {prefix}{value}{suffix}
    </strong>
  );
}

export default function PolicyLayout({
  title,
  subtitle,
  children,
}) {
  const location = useLocation();

  return (
    <div className="nx-policy-page">
      <style>{policyStyles}</style>

      {/* Hero Header */}
      <header className="nx-policy-hero">
        <div className="nx-policy-container">
          <nav className="nx-policy-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/about">About & Legal</Link>
            <ChevronRight size={14} />
            <span>{title}</span>
          </nav>
          <h1>{title}</h1>
          {subtitle && <p className="nx-policy-hero-subtitle">{subtitle}</p>}

          <div className="nx-policy-meta-bar">
            <span className="nx-policy-meta-item">
              <Calendar size={14} /> Effective Date: November 19, 2026
            </span>
            <span className="nx-policy-status-pill is-published">
              Published
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="nx-policy-container nx-policy-layout-grid">
        <main className="nx-policy-content">
          {children}
        </main>

        {/* Sidebar Navigation */}
        <aside className="nx-policy-sidebar" aria-label="Legal & Support Navigation">
          <div className="nx-sidebar-card">
            <h3>Policies & Support</h3>
            <nav className="nx-sidebar-nav">
              {POLICY_NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`nx-sidebar-link ${isActive ? "is-active" : ""}`}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="nx-sidebar-support-card">
            <h4>Need Immediate Help?</h4>
            <p>Our customer care team is available to assist you with orders, returns, and payments.</p>
            <Link to="/contact" className="nx-sidebar-cta">
              Contact Support <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

const policyStyles = `
.nx-policy-page {
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding-bottom: 60px;
}

.nx-policy-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 32px);
}

.nx-policy-hero {
  background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
  color: #ffffff;
  padding: 42px 0 36px;
  border-bottom: 1px solid #334155;
  margin-bottom: 36px;
}

.nx-policy-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.nx-policy-breadcrumbs a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.15s;
}

.nx-policy-breadcrumbs a:hover {
  color: #65d6bd;
}

.nx-policy-breadcrumbs span {
  color: #ffffff;
  font-weight: 600;
}

.nx-policy-hero h1 {
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 10px;
  letter-spacing: -0.5px;
}

.nx-policy-hero-subtitle {
  font-size: clamp(14px, 1.8vw, 17px);
  color: #cbd5e1;
  max-width: 760px;
  line-height: 1.6;
  margin: 0 0 20px;
}

.nx-policy-meta-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
}

.nx-policy-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
}

.nx-policy-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.nx-policy-status-pill.is-published {
  background: #0f766e;
  color: #ffffff;
}

.nx-policy-layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 36px;
  align-items: start;
}

.nx-policy-content {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: clamp(20px, 4vw, 44px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  line-height: 1.7;
}

.nx-policy-content h2 {
  font-size: clamp(19px, 2.5vw, 24px);
  color: #0f172a;
  font-weight: 700;
  margin: 36px 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f1f5f9;
}

.nx-policy-content h2:first-of-type {
  margin-top: 0;
}

.nx-policy-content h3 {
  font-size: 17px;
  color: #1e293b;
  font-weight: 600;
  margin: 22px 0 10px;
}

.nx-policy-content p {
  margin: 0 0 16px;
  color: #334155;
  font-size: 15px;
}

.nx-policy-content ul,
.nx-policy-content ol {
  margin: 0 0 18px;
  padding-left: 24px;
  color: #334155;
  font-size: 15px;
}

.nx-policy-content li {
  margin-bottom: 8px;
}

.nx-config-pending {
  color: #d97706;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  font-style: italic;
}

.nx-config-value {
  color: #0f766e;
  font-weight: 700;
}

.nx-policy-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 20px;
}

.nx-sidebar-card,
.nx-sidebar-support-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nx-sidebar-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nx-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nx-sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #475569;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nx-sidebar-link:hover {
  background: #f1f5f9;
  color: #0f766e;
}

.nx-sidebar-link.is-active {
  background: #0f766e;
  color: #ffffff;
  font-weight: 600;
}

.nx-sidebar-support-card h4 {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.nx-sidebar-support-card p {
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 16px;
}

.nx-sidebar-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  background: #111827;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s;
}

.nx-sidebar-cta:hover {
  background: #0f766e;
}

@media (max-width: 960px) {
  .nx-policy-layout-grid {
    grid-template-columns: 1fr;
  }
  .nx-policy-sidebar {
    position: static;
  }
}
`;
