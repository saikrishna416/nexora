import PolicyLayout from "../components/PolicyLayout";
import { useSEO } from "../utils/seo";

export default function TermsConditions() {
  useSEO({
    title: "Terms & Conditions",
    description: "Read Nexora's Terms & Conditions governing website usage, product orders, payments, warranties, and user responsibilities.",
  });

  return (
    <PolicyLayout
      title="Terms & Conditions"
      subtitle="The contractual terms and legal conditions governing your use of the Nexora online shopping platform."
    >
      <section>
        <h2>1. Agreement to Terms</h2>
        <p>
          These Terms and Conditions constitute a legally binding agreement between you (whether personally or on behalf of an
          entity) and Nexora ("we", "us", or "our"), concerning your access to and use of our website, platform, and online store.
        </p>
        <p>
          By creating an account, browsing products, or submitting orders, you agree that you have read, understood, and agreed
          to be bound by all of these Terms and Conditions. If you do not agree with any part of these terms, you must discontinue
          use of the platform immediately.
        </p>
      </section>

      <section>
        <h2>2. User Eligibility & Account Responsibilities</h2>
        <ul>
          <li>
            <strong>Age Requirement:</strong> You must be at least 18 years of age or possess legal parental or guardian consent to register an account and transact on Nexora.
          </li>
          <li>
            <strong>Account Accuracy:</strong> You agree to provide true, accurate, current, and complete information during registration and keep your account and delivery addresses updated.
          </li>
          <li>
            <strong>Credential Security:</strong> You are responsible for maintaining the confidentiality of your account credentials, password, and session access. You must notify us immediately of any unauthorized use of your account.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Product Information, Pricing & Availability</h2>
        <ul>
          <li>
            <strong>Catalog Accuracy:</strong> We endeavor to display product descriptions, specifications, colors, and stock levels as accurately as possible. However, actual colors may vary depending on your display device.
          </li>
          <li>
            <strong>Pricing in INR:</strong> All prices listed on Nexora are in Indian Rupees (INR) and include applicable taxes (such as GST) unless explicitly stated otherwise.
          </li>
          <li>
            <strong>Pricing Errors:</strong> In the rare event a product is listed at an incorrect price due to typographical or technical error, Nexora reserves the right to cancel orders placed for such products before dispatch, with full refund issued.
          </li>
          <li>
            <strong>Inventory Availability:</strong> Products are subject to stock availability. Adding an item to your cart does not reserve inventory until an order is created.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Order Placement & Contract Formation</h2>
        <ul>
          <li>
            <strong>Order Acceptance:</strong> Receiving an electronic order confirmation receipt acknowledges receipt of your purchase intent but does not constitute final acceptance of your order.
          </li>
          <li>
            <strong>Verification & Cancellation:</strong> We reserve the right to decline or cancel any order for reasons including non-availability of stock, failure of payment verification, suspected fraud, or pricing errors. If an order is cancelled after payment deduction, a full refund will be processed promptly.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Payment Terms & Obligations</h2>
        <ul>
          <li>
            <strong>Supported Gateways:</strong> Online payments are processed via Razorpay supporting Credit Cards, Debit Cards, UPI, NetBanking, and Digital Wallets. Cash on Delivery (COD) is available on eligible orders.
          </li>
          <li>
            <strong>Authorized Use:</strong> You warrant that you have lawful authority to use the payment card, account, or UPI identity utilized for the transaction.
          </li>
          <li>
            <strong>COD Commitment:</strong> By choosing Cash on Delivery, you agree to make full cash payment to the delivery representative upon package presentation at your delivery address.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Shipping, Title & Risk of Loss</h2>
        <p>
          Title and risk of loss for products purchased from Nexora pass to you upon delivery to the specified shipping address.
          Delivery schedules and estimates are provided in accordance with our official Shipping & Delivery Policy.
        </p>
      </section>

      <section>
        <h2>7. Intellectual Property Rights</h2>
        <p>
          All content on Nexora—including website design, trademarks, logos, texts, product photographs, software code, icons,
          and graphics—is the property of Nexora or licensed to us, protected under Indian and international copyright and
          intellectual property laws. No material may be copied, reproduced, republished, or exploited without our express prior
          written consent.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable Indian law, Nexora, its directors, employees, and agents shall not be
          liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the website or
          purchased items. In all cases, Nexora’s maximum aggregate liability shall not exceed the amount actually paid by you
          for the specific product or order giving rise to the claim.
        </p>
      </section>

      <section>
        <h2>9. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms and any contractual disputes arising out of or related to your transactions on Nexora shall be governed
          by and construed in accordance with the laws of the Republic of India. Courts situated at our registered headquarters
          jurisdiction shall have exclusive jurisdiction over any legal proceedings.
        </p>
      </section>

      <section>
        <h2>10. Customer Support & Inquiries</h2>
        <p>If you have questions regarding these Terms & Conditions, please contact us at:</p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@nexora.com">support@nexora.com</a>
          </li>
          <li>
            <strong>Phone:</strong>{" "}
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
