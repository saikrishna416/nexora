import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="nx-global-footer">
      <style>{footerStyles}</style>

      {/* Trust Highlights Strip */}
      <div className="nx-footer-trust-strip">
        <div className="nx-footer-container nx-trust-grid">
          <div className="nx-trust-item">
            <Truck size={20} className="nx-trust-icon" />
            <div>
              <strong>Nationwide Delivery</strong>
              <span>Pan-India coverage to your PIN</span>
            </div>
          </div>

          <div className="nx-trust-item">
            <ShieldCheck size={20} className="nx-trust-icon" />
            <div>
              <strong>Secure Transactions</strong>
              <span>256-bit SSL & Razorpay PCI-DSS</span>
            </div>
          </div>

          <div className="nx-trust-item">
            <RotateCcw size={20} className="nx-trust-icon" />
            <div>
              <strong>Transparent Returns</strong>
              <span>Hassle-free return & refund policy</span>
            </div>
          </div>

          <div className="nx-trust-item">
            <CreditCard size={20} className="nx-trust-icon" />
            <div>
              <strong>Multiple Payment Modes</strong>
              <span>UPI, Cards, NetBanking & COD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Directory */}
      <div className="nx-footer-container nx-footer-columns">
        {/* Column 1: Brand & Contact Info */}
        <div className="nx-footer-col nx-brand-col">
          <Link to="/" className="nx-footer-logo">
            Nexora<span>.</span>
          </Link>
          <p className="nx-footer-tagline">Shop smarter. Live better.</p>
          <p className="nx-footer-about-text">
            Your trusted destination for curated lifestyle, fashion, electronics, and home essentials with verified
            payments and transparent customer policies across India.
          </p>

          <div className="nx-footer-contact-list">
            <div className="nx-contact-line">
              <Mail size={14} />
              <a href="mailto:support@nexora.com">support@nexora.com</a>
            </div>
            <div className="nx-contact-line">
              <Phone size={14} />
              <a href="tel:+919998880000">+91 9998880000</a>
            </div>
            <div className="nx-contact-line">
              <MapPin size={14} />
              <span>Hitech City, Hyderabad, Telangana, India</span>
            </div>
          </div>
        </div>

        {/* Column 2: Customer Service */}
        <div className="nx-footer-col">
          <h3>Customer Service</h3>
          <ul className="nx-footer-links">
            <li>
              <Link to="/contact">Contact Customer Care</Link>
            </li>
            <li>
              <Link to="/faq">Frequently Asked Questions</Link>
            </li>
            <li>
              <Link to="/orders">Track Your Orders</Link>
            </li>
            <li>
              <Link to="/cart">Shopping Cart</Link>
            </li>
            <li>
              <Link to="/wishlist">Your Wishlist</Link>
            </li>
            <li>
              <Link to="/profile">My Account</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal & Trust Policies */}
        <div className="nx-footer-col">
          <h3>Legal & Policies</h3>
          <ul className="nx-footer-links">
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
            </li>
            <li>
              <Link to="/return-refund-policy">Return & Refund Policy</Link>
            </li>
            <li>
              <Link to="/shipping-policy">Shipping & Delivery Policy</Link>
            </li>
            <li>
              <Link to="/payment-policy">Payment Policy & Security</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: About Nexora & Departments */}
        <div className="nx-footer-col">
          <h3>About Nexora</h3>
          <ul className="nx-footer-links">
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/products">All Products</Link>
            </li>
            <li>
              <Link to="/products?category=Electronics">Electronics & Gadgets</Link>
            </li>
            <li>
              <Link to="/products?category=Men%27s%20Fashion">Men's Fashion</Link>
            </li>
            <li>
              <Link to="/products?category=Women%27s%20Fashion">Women's Fashion</Link>
            </li>
            <li>
              <Link to="/products?category=Home%20%26%20Living">Home & Living</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal, Payment Badges & Deployment Attribution */}
      <div className="nx-footer-bottom">
        <div className="nx-footer-container nx-bottom-layout">
          <div className="nx-payment-badges">
            <span className="nx-payment-badge">Razorpay Secured</span>
            <span className="nx-payment-badge">UPI</span>
            <span className="nx-payment-badge">Visa</span>
            <span className="nx-payment-badge">MasterCard</span>
            <span className="nx-payment-badge">RuPay</span>
            <span className="nx-payment-badge">NetBanking</span>
            <span className="nx-payment-badge">Cash on Delivery</span>
          </div>

          <div className="nx-copyright-block">
            <p>
              © {currentYear} Nexora. All rights reserved. Platform hosted at{" "}
              <a
                href="https://nexora-six-weld.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="nx-deploy-link"
              >
                https://nexora-six-weld.vercel.app <ExternalLink size={11} />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerStyles = `
.nx-global-footer {
  background: #111827;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  margin-top: auto;
  border-top: 1px solid #1f2937;
}

.nx-footer-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 32px);
}

.nx-footer-trust-strip {
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  padding: 24px 0;
}

.nx-trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.nx-trust-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nx-trust-icon {
  color: #65d6bd;
  flex-shrink: 0;
}

.nx-trust-item strong {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
}

.nx-trust-item span {
  font-size: 12px;
  color: #94a3b8;
}

.nx-footer-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
  gap: clamp(24px, 4vw, 44px);
  padding: clamp(40px, 5vw, 60px) clamp(16px, 3vw, 32px) clamp(32px, 4vw, 48px);
}

.nx-footer-col h3 {
  font-size: 14.5px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.75px;
  margin: 0 0 18px;
}

.nx-footer-logo {
  font-size: 26px;
  font-weight: 900;
  color: #ffffff;
  text-decoration: none;
  letter-spacing: -0.5px;
  display: inline-block;
  margin-bottom: 4px;
}

.nx-footer-logo span {
  color: #65d6bd;
}

.nx-footer-tagline {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 12px;
  font-style: italic;
}

.nx-footer-about-text {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.6;
  margin: 0 0 18px;
  max-width: 380px;
}

.nx-footer-contact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nx-contact-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: #94a3b8;
}

.nx-contact-line svg {
  color: #65d6bd;
  flex-shrink: 0;
  margin-top: 3px;
}

.nx-contact-line a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.15s;
}

.nx-contact-line a:hover {
  color: #65d6bd;
  text-decoration: underline;
}

.nx-footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nx-footer-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 13.5px;
  transition: color 0.15s, transform 0.15s;
  display: inline-block;
}

.nx-footer-links a:hover {
  color: #65d6bd;
  transform: translateX(2px);
}

.nx-footer-bottom {
  border-top: 1px solid #1f2937;
  padding: 22px 0;
  background: #0b0f17;
  font-size: 12px;
  color: #94a3b8;
}

.nx-bottom-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.nx-payment-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nx-payment-badge {
  padding: 3px 8px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #cbd5e1;
}

.nx-copyright-block p {
  margin: 0;
  line-height: 1.5;
}

.nx-deploy-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #65d6bd;
  text-decoration: none;
  font-weight: 600;
}

.nx-deploy-link:hover {
  text-decoration: underline;
}

@media (max-width: 960px) {
  .nx-footer-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .nx-footer-columns {
    grid-template-columns: 1fr;
  }
  .nx-bottom-layout {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;
