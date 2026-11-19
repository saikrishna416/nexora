import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  Headphones,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useSEO } from "../utils/seo";

export default function AboutUs() {
  useSEO({
    title: "About Us - The Nexora Story",
    description: "Learn about Nexora's mission to deliver a dependable, customer-first online shopping experience with curated products and transparent service.",
  });

  return (
    <div className="nx-about-page">
      <style>{aboutStyles}</style>

      {/* Hero Section */}
      <section className="nx-about-hero">
        <div className="nx-about-container">
          <span className="nx-about-kicker">WHO WE ARE</span>
          <h1>Shop Smarter. Live Better.</h1>
          <p>
            Nexora is a modern e-commerce destination built to connect shoppers with carefully curated lifestyle, fashion,
            electronics, and home essentials backed by transparent policies and dependable customer care.
          </p>
        </div>
      </section>

      {/* Mission & Purpose */}
      <section className="nx-about-container nx-about-intro">
        <div className="nx-intro-copy">
          <span className="nx-section-kicker">OUR COMMITMENT</span>
          <h2>A Modern Shopping Experience Designed Around You</h2>
          <p>
            We believe buying products online should be clear, intuitive, and reassuring from the moment you explore our
            departments to the day your package arrives at your doorstep.
          </p>
          <p>
            Rather than overwhelming shoppers with cluttered choices or convoluted conditions, Nexora focuses on quality
            standards, upfront pricing, secure checkout processing, and honest policies you can rely on.
          </p>

          <div className="nx-intro-highlights">
            <div className="nx-highlight-item">
              <CheckCircle2 size={18} className="nx-check-icon" />
              <span>Direct access to diverse product departments</span>
            </div>
            <div className="nx-highlight-item">
              <CheckCircle2 size={18} className="nx-check-icon" />
              <span>Full compliance with Reserve Bank of India payment standards</span>
            </div>
            <div className="nx-highlight-item">
              <CheckCircle2 size={18} className="nx-check-icon" />
              <span>Transparent delivery tracking and customer support</span>
            </div>
          </div>
        </div>

        <div className="nx-intro-card">
          <div className="nx-brand-badge">
            <span>N</span>
          </div>
          <h3>The Nexora Standard</h3>
          <p>
            "Curating items that elevate everyday life while upholding integrity, security, and customer trust in every
            transaction."
          </p>
          <div className="nx-stats-grid">
            <div className="nx-stat-box">
              <strong>100%</strong>
              <span>Verified Checkouts</span>
            </div>
            <div className="nx-stat-box">
              <strong>256-Bit</strong>
              <span>SSL Encryption</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="nx-about-values-section">
        <div className="nx-about-container">
          <div className="nx-values-header">
            <span className="nx-section-kicker">WHAT DRIVES US</span>
            <h2>Our Core Principles</h2>
            <p>The foundations that guide how we build, source, and serve our community.</p>
          </div>

          <div className="nx-values-grid">
            <div className="nx-value-card">
              <div className="nx-value-icon">
                <ShieldCheck size={26} />
              </div>
              <h3>Customer Trust First</h3>
              <p>
                We maintain open, transparent communication. From accurate product descriptions to clear return windows and
                prompt refunds, we protect your shopping interests at every step.
              </p>
            </div>

            <div className="nx-value-card">
              <div className="nx-value-icon">
                <Sparkles size={26} />
              </div>
              <h3>Curated Selection</h3>
              <p>
                We carefully evaluate items across categories—from electronics and home appliances to fashion and personal
                care—ensuring quality design, functionality, and lasting value.
              </p>
            </div>

            <div className="nx-value-card">
              <div className="nx-value-icon">
                <Truck size={26} />
              </div>
              <h3>Reliable Fulfillment</h3>
              <p>
                Partnering with established logistics and courier networks across India, we aim for swift order processing,
                safe packaging, and timely dispatch to your postal code.
              </p>
            </div>

            <div className="nx-value-card">
              <div className="nx-value-icon">
                <Headphones size={26} />
              </div>
              <h3>Dedicated Assistance</h3>
              <p>
                Our customer care team is here to assist with inquiries, order tracking, address modifications, or billing
                questions with prompt and empathetic support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Next Steps Banner */}
      <section className="nx-about-container nx-about-cta">
        <div className="nx-cta-box">
          <div>
            <h2>Explore Our Collections Today</h2>
            <p>Discover everyday essentials, trending fashion, and electronic upgrades curated for your lifestyle.</p>
          </div>
          <div className="nx-cta-buttons">
            <Link to="/products" className="nx-btn-primary">
              Browse All Products <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="nx-btn-secondary">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const aboutStyles = `
.nx-about-page {
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding-bottom: 60px;
}

.nx-about-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 32px);
}

.nx-about-hero {
  background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
  color: #ffffff;
  padding: clamp(48px, 6vw, 76px) 0;
  border-bottom: 1px solid #334155;
  margin-bottom: 44px;
  text-align: center;
}

.nx-about-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #65d6bd;
  display: block;
  margin-bottom: 12px;
}

.nx-about-hero h1 {
  font-size: clamp(32px, 5vw, 50px);
  font-weight: 800;
  margin: 0 0 14px;
  letter-spacing: -1px;
}

.nx-about-hero p {
  font-size: clamp(15px, 2vw, 18px);
  color: #cbd5e1;
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.65;
}

.nx-section-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #0f766e;
  display: block;
  margin-bottom: 8px;
}

.nx-about-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  margin-bottom: 60px;
}

.nx-intro-copy h2 {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  margin: 0 0 16px;
}

.nx-intro-copy p {
  font-size: 15.5px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 16px;
}

.nx-intro-highlights {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.nx-highlight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14.5px;
  color: #1e293b;
  font-weight: 500;
}

.nx-check-icon {
  color: #0f766e;
  flex-shrink: 0;
}

.nx-intro-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: clamp(28px, 4vw, 40px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.nx-brand-badge {
  width: 60px;
  height: 60px;
  background: #111827;
  color: #65d6bd;
  font-size: 28px;
  font-weight: 900;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
}

.nx-intro-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
}

.nx-intro-card p {
  font-size: 14.5px;
  color: #64748b;
  font-style: italic;
  line-height: 1.6;
  margin: 0 0 24px;
}

.nx-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 20px;
}

.nx-stat-box strong {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #0f766e;
}

.nx-stat-box span {
  font-size: 12px;
  color: #64748b;
}

.nx-about-values-section {
  background: #f1f5f9;
  padding: clamp(48px, 6vw, 72px) 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 60px;
}

.nx-values-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 40px;
}

.nx-values-header h2 {
  font-size: clamp(24px, 3.5vw, 34px);
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}

.nx-values-header p {
  font-size: 15px;
  color: #64748b;
  margin: 0;
}

.nx-values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.nx-value-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 28px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nx-value-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f0fdfa;
  color: #0f766e;
  display: grid;
  place-items: center;
  margin-bottom: 18px;
}

.nx-value-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px;
}

.nx-value-card p {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.nx-about-cta {
  margin-top: 20px;
}

.nx-cta-box {
  background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
  color: #ffffff;
  border-radius: 16px;
  padding: clamp(32px, 5vw, 48px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.nx-cta-box h2 {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  margin: 0 0 8px;
}

.nx-cta-box p {
  font-size: 15px;
  color: #cbd5e1;
  margin: 0;
  max-width: 540px;
}

.nx-cta-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nx-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: #0f766e;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s;
}

.nx-btn-primary:hover {
  background: #0d9488;
}

.nx-btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 20px;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #475569;
  border-radius: 6px;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
}

.nx-btn-secondary:hover {
  border-color: #cbd5e1;
  background: rgba(255, 255, 255, 0.05);
}

@media (max-width: 860px) {
  .nx-about-intro {
    grid-template-columns: 1fr;
  }
}
`;
