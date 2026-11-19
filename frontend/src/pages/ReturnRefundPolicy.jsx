import PolicyLayout, { ConfigValue } from "../components/PolicyLayout";
import { useBusinessConfig } from "../services/configService";
import { useSEO } from "../utils/seo";
import { Link } from "react-router-dom";

export default function ReturnRefundPolicy() {
  useSEO({
    title: "Return, Refund & Cancellation Policy",
    description: "Read Nexora's transparent policy for product returns, refund timelines via Razorpay, cancellation criteria, and reverse pickups.",
  });

  const { config } = useBusinessConfig();

  const returnDays = config.return_window_days;
  const refundDays = config.refund_business_days;

  return (
    <PolicyLayout
      title="Return, Refund and Cancellation Policy"
      subtitle="Clear, fair, and transparent procedures for product returns, order cancellations, and refunds at Nexora."
    >
      <section>
        <h2>1. Policy Overview</h2>
        <p>
          At Nexora, we want you to be completely satisfied with your purchase. If you receive a product that is damaged,
          defective, incorrect, or does not meet your expectations, our return and refund policy is designed to make the
          resolution process smooth and hassle-free.
        </p>
      </section>

      <section>
        <h2>2. Return Window & Eligibility</h2>
        <p>
          Eligible items may be returned within{" "}
          <ConfigValue
            value={returnDays}
            fallback="7 to 10 calendar days (Configure in Admin)"
            suffix=" calendar days"
          />{" "}
          from the date of delivery.
        </p>
        <p>To qualify for a valid return, items must meet the following conditions:</p>
        <ul>
          <li>The product must be unused, unwashed, unworn, and free from any damage or signs of wear.</li>
          <li>The product must be in its original packaging with all manufacturer tags, labels, warranty cards, manuals, and accessories intact.</li>
          <li>You must provide the original order number or invoice as valid proof of purchase.</li>
        </ul>
      </section>

      <section>
        <h2>3. Non-Returnable Items</h2>
        <p>For health, hygiene, safety, and operational reasons, the following categories are strictly non-returnable unless received in a damaged or defective condition:</p>
        <ul>
          <li>Personal care, cosmetics, fragrances, and beauty items where safety seals have been opened.</li>
          <li>Innerwear, lingerie, swimwear, and personal hygiene goods.</li>
          <li>Perishable items or custom/personalized products.</li>
          <li>Items marked as "Final Sale" or "Non-Returnable" on the product detail page.</li>
        </ul>
      </section>

      <section>
        <h2>4. How to Initiate a Return</h2>
        <ol>
          <li>
            <strong>Submit a Return Request:</strong> Visit our <Link to="/contact">Contact Us</Link> page or email customer support. Include your <strong>Order ID</strong> (e.g. <code>NXR-XXXXXXXX</code>), clear photographs of the product, packaging, and the reason for return.
          </li>
          <li>
            <strong>Return Authorization:</strong> Our support team will verify your request within 24 to 48 hours and provide reverse pickup details or return shipping guidelines.
          </li>
          <li>
            <strong>Pickup & Quality Inspection:</strong> Our courier partner will collect the securely packed item from your address. Once received at our fulfillment center, our team conducts a quality check to verify condition.
          </li>
        </ol>
      </section>

      <section>
        <h2>5. Refund Process & Settlement Timelines</h2>
        <p>
          Once your returned product passes our inspection, a refund will be initiated immediately. Refunds are settled
          within{" "}
          <ConfigValue
            value={refundDays}
            fallback="5 to 7 business days (Configure in Admin)"
            suffix=" business days"
          />{" "}
          depending on the original mode of payment:
        </p>
        <ul>
          <li>
            <strong>Prepaid Orders (Cards, UPI, NetBanking, Wallets via Razorpay):</strong> The refund amount will be credited directly back to the original source bank account, card, or UPI ID used during checkout through Razorpay's automated gateway.
          </li>
          <li>
            <strong>Cash on Delivery (COD) Orders:</strong> Because cash cannot be returned electronically in person, our customer care team will request your verified bank account details (Account Number, IFSC, Account Holder Name) to disburse the refund via secure NEFT/IMPS bank transfer.
          </li>
          <li>
            <strong>Shipping Charges:</strong> Standard shipping fees (if applied) are non-refundable unless the return was necessitated by our error (damaged, defective, or incorrect product delivered).
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Order Cancellation Policy</h2>
        <ul>
          <li>
            <strong>Cancellation Before Dispatch:</strong> You may request order cancellation prior to warehouse fulfillment and shipment dispatch. In this case, 100% of the paid order amount will be refunded immediately to your original payment method.
          </li>
          <li>
            <strong>Cancellation After Dispatch:</strong> Orders that have already been shipped and handed over to courier partners cannot be cancelled in transit. You may refuse delivery when the courier arrives or initiate a standard return following delivery.
          </li>
          <li>
            <strong>Cancellations by Nexora:</strong> In rare cases of inventory stock-out, pricing errors, or failure of delivery to unserviceable PIN codes, Nexora reserves the right to cancel an order and immediately issue a 100% full refund.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Damaged, Defective, or Wrong Items</h2>
        <p>
          If your package arrives visibly damaged, tampered with, or contains the wrong item, please notify us within{" "}
          <strong>48 hours of delivery</strong>. Attach clear photographs of the outer carton, the shipping label, and the
          damaged item so we can arrange an expedited replacement or full refund at no additional charge to you.
        </p>
      </section>

      <section>
        <h2>8. Need Help with a Return?</h2>
        <p>For questions or assistance regarding your return or refund status:</p>
        <ul>
          <li>
            <strong>Support Form:</strong> <Link to="/contact">Submit a Contact / Return Ticket</Link>
          </li>
          <li>
            <strong>Support Email:</strong>{" "}
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
