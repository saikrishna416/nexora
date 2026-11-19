import PolicyLayout from "../components/PolicyLayout";
import { useSEO } from "../utils/seo";

export default function PrivacyPolicy() {
  useSEO({
    title: "Privacy Policy",
    description: "Learn how Nexora collects, uses, and safeguards your personal data, payment information, and privacy under Indian and international privacy standards.",
  });

  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="How Nexora collects, protects, and handles your personal information across our website and services."
    >
      <section>
        <h2>1. Introduction & Overview</h2>
        <p>
          Welcome to Nexora. We respect your privacy and are committed to safeguarding the personal data you share with us.
          This Privacy Policy outlines our standards for collecting, using, disclosing, and protecting personal information
          in compliance with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices
          and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules), and the Digital Personal Data
          Protection Act, 2023 (DPDP Act).
        </p>
        <p>
          By visiting, accessing, or placing orders on Nexora, you acknowledge and agree to the practices described in this policy.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>We collect only the information necessary to fulfill your orders, provide customer care, and enhance your shopping experience:</p>
        <ul>
          <li>
            <strong>Account & Identification Data:</strong> Your name, username, email address, contact telephone number, and profile details provided during registration.
          </li>
          <li>
            <strong>Delivery & Shipping Information:</strong> Recipient full name, physical delivery address, city, state, postal PIN code, and delivery telephone number.
          </li>
          <li>
            <strong>Order & Transaction History:</strong> Records of items purchased, order numbers, transaction values, payment method selected (e.g. Razorpay or Cash on Delivery), and invoice details.
          </li>
          <li>
            <strong>Technical & Device Data:</strong> IP address, device operating system, browser type, referral URLs, and session activity logs to ensure platform integrity and prevent fraud.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Payment Processing & Razorpay PCI-DSS Security</h2>
        <p>
          We prioritize the security of your payment details. Nexora integrates with <strong>Razorpay</strong>, a RBI-authorized
          and PCI-DSS Level 1 certified payment gateway, to process online payments securely.
        </p>
        <ul>
          <li>
            <strong>Zero Raw Card Storage:</strong> Nexora never collects, stores, or processes your complete credit card numbers, debit card numbers, CVV codes, or UPI PINs on our servers.
          </li>
          <li>
            <strong>End-to-End Encryption:</strong> All payment interactions occur inside Razorpay's secure, 256-bit SSL-encrypted checkout interface.
          </li>
          <li>
            <strong>Tokenization & Compliance:</strong> In accordance with Reserve Bank of India (RBI) tokenization guidelines, card transactions are processed using encrypted tokens, preventing merchant exposure to sensitive credentials.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. How We Use Your Information</h2>
        <p>Nexora processes your data strictly for legitimate operational purposes:</p>
        <ul>
          <li>To verify, process, pack, and fulfill your orders and deliver goods to your address.</li>
          <li>To communicate order confirmation, shipment tracking, delivery updates, and support responses.</li>
          <li>To prevent fraudulent orders, duplicate transactions, and unauthorized account access.</li>
          <li>To comply with legal obligations, tax filings, GST accounting, and regulatory directives under Indian law.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cookies & Local Storage</h2>
        <p>
          Nexora uses necessary functional cookies and browser storage (such as <code>localStorage</code>) to maintain your
          authenticated login session, preserve shopping cart items across visits, and store your preferred delivery PIN code.
          You may control cookie preferences through your web browser settings; however, disabling essential cookies may impact
          your ability to complete checkouts.
        </p>
      </section>

      <section>
        <h2>6. Data Sharing & Third-Party Service Providers</h2>
        <p>
          We do not sell, rent, or trade your personal information to third parties for marketing purposes. Data is shared
          strictly on a need-to-know basis with trusted infrastructure partners:
        </p>
        <ul>
          <li><strong>Payment Processors:</strong> Razorpay Software Private Limited for online payment settlement.</li>
          <li><strong>Logistics Partners:</strong> Verified courier and delivery services solely for shipping packages to your address.</li>
          <li><strong>Cloud & Media Infrastructure:</strong> Cloudinary and cloud hosting facilities for asset delivery and system availability.</li>
          <li><strong>Law Enforcement & Regulators:</strong> When legally required by court order, statutory regulation, or government inquiry.</li>
        </ul>
      </section>

      <section>
        <h2>7. Data Retention & Security Measures</h2>
        <p>
          We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, resolve
          disputes, maintain statutory accounting records, and satisfy tax requirements. We employ industry-standard technical,
          administrative, and physical safeguards—including encrypted transport (HTTPS/TLS) and restricted database access—to
          protect your personal information from unauthorized access, alteration, or disclosure.
        </p>
      </section>

      <section>
        <h2>8. Your Rights & Choices</h2>
        <p>As a valued Nexora customer, you have the right to:</p>
        <ul>
          <li>Access and review your account details, saved addresses, and order history from your Profile.</li>
          <li>Request correction of inaccurate or incomplete personal information.</li>
          <li>Request deletion or deactivation of your customer account, subject to retention requirements for pending orders and tax compliance.</li>
        </ul>
      </section>

      <section>
        <h2>9. Grievance Redressal & Contact Officer</h2>
        <p>
          In accordance with the Information Technology Act, 2000 and rules made thereunder, any queries, concerns, or grievances
          regarding your data privacy may be addressed to our designated support officer:
        </p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@nexora.com">support@nexora.com</a>
          </li>
          <li>
            <strong>Telephone:</strong>{" "}
            <a href="tel:+919998880000">+91 9998880000</a>
          </li>
          <li>
            <strong>Registered Office:</strong>{" "}
            Hitech City, Hyderabad, Telangana, India
          </li>
        </ul>
      </section>
    </PolicyLayout>
  );
}
