import PolicyLayout, { ConfigValue } from "../components/PolicyLayout";
import { useBusinessConfig } from "../services/configService";
import { useSEO } from "../utils/seo";
import { Link } from "react-router-dom";

export default function PaymentPolicy() {
  useSEO({
    title: "Payment Policy & Security",
    description: "Learn about Nexora's secure payment methods via Razorpay, UPI, cards, NetBanking, Cash on Delivery, and payment security standards.",
  });

  const { config } = useBusinessConfig();
  const refundDays = config.refund_business_days;

  return (
    <PolicyLayout
      title="Payment Policy"
      subtitle="Details on accepted payment methods, Razorpay gateway security, transaction verification, and failed payment resolutions."
    >
      <section>
        <h2>1. Payment Security & Compliance</h2>
        <p>
          At Nexora, ensuring the confidentiality and integrity of your payment transactions is our top priority. We use
          industry-leading security protocols to protect every checkout on our platform:
        </p>
        <ul>
          <li>
            <strong>PCI-DSS Certified Infrastructure:</strong> All electronic transactions are handled directly through
            <strong> Razorpay</strong>, a Reserve Bank of India (RBI) authorized and PCI-DSS Level 1 certified payment processor.
          </li>
          <li>
            <strong>Zero Raw Card Storage:</strong> Nexora never collects, stores, or sees your 16-digit credit/debit card numbers, CVV codes, bank passwords, or UPI PINs on our servers.
          </li>
          <li>
            <strong>256-Bit SSL/TLS Encryption:</strong> All communications between your web browser, our servers, and Razorpay are encrypted with high-grade Transport Layer Security (TLS 1.3).
          </li>
          <li>
            <strong>Cryptographic Signature Verification:</strong> Every payment confirmation is verified on our backend using HMAC-SHA256 digital signatures to prevent tampering or spoofed payment confirmations.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Supported Payment Methods</h2>
        <p>Nexora offers a comprehensive selection of modern, secure payment channels during checkout:</p>

        <h3>A. Online Payments via Razorpay Checkout</h3>
        <ul>
          <li>
            <strong>UPI (Unified Payments Interface):</strong> Pay instantly with zero transaction surcharge via Google Pay, PhonePe, Paytm UPI, BHIM, Cred, WhatsApp Pay, or any valid VPA/UPI ID.
          </li>
          <li>
            <strong>Credit & Debit Cards:</strong> All major domestic and international cards including Visa, MasterCard, RuPay, Maestro, and American Express. Fully compliant with RBI card tokenization standards.
          </li>
          <li>
            <strong>Internet Banking:</strong> Direct net banking integration across 50+ Indian commercial and public sector banks, including SBI, HDFC, ICICI, Axis, Kotak Mahindra, Punjab National Bank, and others.
          </li>
          <li>
            <strong>Mobile Wallets:</strong> Convenient wallet checkouts through supported digital wallets such as Paytm Wallet and MobiKwik.
          </li>
        </ul>

        <h3>B. Cash on Delivery (COD)</h3>
        <ul>
          <li>Cash on Delivery is available for eligible order values and serviceable PIN codes across India.</li>
          <li>Payment must be made in cash directly to the courier executive upon parcel handover.</li>
          <li>COD orders require verification to protect our fulfillment system from spurious bookings.</li>
        </ul>
      </section>

      <section>
        <h2>3. Transaction Currency & Invoicing</h2>
        <p>
          All transactions on Nexora are denominated and settled in <strong>Indian Rupees (INR - ₹)</strong>. Product prices
          are inclusive of all applicable statutory taxes (including Goods and Services Tax - GST). An electronic tax invoice
          is generated for your order and accessible in your customer account.
        </p>
      </section>

      <section>
        <h2>4. Failed, Pending, or Interrupted Payments</h2>
        <p>
          Occasionally, a transaction may be interrupted due to network fluctuations, bank server downtime, or session timeouts:
        </p>
        <ul>
          <li>
            <strong>Amount Deducted but Order Not Confirmed:</strong> If funds have been debited from your bank account or card but you did not receive an order confirmation from Nexora, your payment was likely not captured by the gateway. The banking network automatically initiates an auto-reversal.
          </li>
          <li>
            <strong>Auto-Reversal Timelines:</strong> In accordance with RBI guidelines, the debited amount will be reversed by your issuing bank within{" "}
            <ConfigValue
              value={refundDays}
              fallback="5 to 7 banking business days (Configure in Admin)"
              suffix=" banking business days"
            />
            .
          </li>
          <li>
            <strong>Automated Webhook Reconciliation:</strong> Nexora runs server-to-server webhook reconciliation with Razorpay. If your bank confirms the delayed capture, our system will automatically confirm your order and notify you.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Duplicate Payments</h2>
        <p>
          If you are accidentally charged twice for the same order due to double clicking or connection lags, please note both
          transaction IDs and contact our team at once. We will investigate the transaction logs in our Razorpay gateway and
          immediately refund the duplicate transaction back to your original payment source.
        </p>
      </section>

      <section>
        <h2>6. Fraud Prevention & Order Authorization</h2>
        <p>
          To maintain a safe shopping ecosystem for all customers, Nexora reserves the right to hold, review, or cancel any
          order exhibiting high fraud risk, such as suspicious payment velocity, mismatched billing/shipping information, or
          unverified COD bookings.
        </p>
      </section>

      <section>
        <h2>7. Payment Support Assistance</h2>
        <p>For any billing inquiries, transaction verifications, or refund follow-ups:</p>
        <ul>
          <li>
            <strong>Contact Form:</strong> <Link to="/contact">Submit a Billing Ticket</Link>
          </li>
          <li>
            <strong>Billing Email:</strong>{" "}
            <a href="mailto:support@nexora.com">support@nexora.com</a>
          </li>
          <li>
            <strong>Helpline:</strong>{" "}
            <a href="tel:+919998880000">+91 9998880000</a>
          </li>
          <li>
            <strong>Office Address:</strong> Hitech City, Hyderabad, Telangana, India
          </li>
        </ul>
      </section>
    </PolicyLayout>
  );
}
