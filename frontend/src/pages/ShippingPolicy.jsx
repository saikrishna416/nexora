import PolicyLayout, { ConfigValue } from "../components/PolicyLayout";
import { useBusinessConfig } from "../services/configService";
import { useSEO } from "../utils/seo";
import { Link } from "react-router-dom";

export default function ShippingPolicy() {
  useSEO({
    title: "Shipping & Delivery Policy",
    description: "Learn about Nexora's nationwide shipping rates, free shipping thresholds, dispatch timelines, and delivery tracking across India.",
  });

  const { config } = useBusinessConfig();

  const freeThreshold = config.free_shipping_threshold;
  const standardFee = config.standard_shipping_fee;
  const processingTime = config.order_processing_time;
  const deliveryTime = config.delivery_estimate_time;

  return (
    <PolicyLayout
      title="Shipping and Delivery Policy"
      subtitle="Information on shipping fees, fulfillment estimates, courier partners, and order tracking across India."
    >
      <section>
        <h2>1. Shipping Coverage & Scope</h2>
        <p>
          Nexora ships orders across India to all serviceable postal PIN codes. We partner with reliable, tier-1 domestic
          courier and logistics networks to ensure your packages are handled with care and delivered promptly.
        </p>
        <p>
          You can check PIN code serviceability at any time using the location selector in the top navigation bar or during checkout.
        </p>
      </section>

      <section>
        <h2>2. Order Processing & Fulfillment Timelines</h2>
        <p>
          Once your payment is verified or your Cash on Delivery order is confirmed, our fulfillment centers prepare your items:
        </p>
        <ul>
          <li>
            <strong>Order Processing Window:</strong> Orders are typically processed, packed, and handed over to courier
            partners within{" "}
            <ConfigValue
              value={processingTime}
              fallback="1 to 2 business days (Configure in Admin)"
            />
            .
          </li>
          <li>
            <strong>Business Days:</strong> Orders placed on Sundays or public national holidays are processed on the subsequent
            business working day.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Shipping Charges & Free Shipping Threshold</h2>
        <p>We maintain straightforward, transparent shipping costs with no hidden surcharges at checkout:</p>
        <ul>
          <li>
            <strong>Standard Shipping Fee:</strong> A standard delivery charge of{" "}
            <ConfigValue
              value={standardFee ? `₹${standardFee}` : null}
              fallback="Calculated at checkout (Configure in Admin)"
            />{" "}
            is applied to orders that do not qualify for promotional free shipping.
          </li>
          <li>
            <strong>Free Shipping Benefit:</strong>{" "}
            {config.free_shipping_enabled ? (
              <span>
                Free standard shipping is active! Orders with a cart subtotal of{" "}
                <ConfigValue
                  value={freeThreshold ? `₹${freeThreshold}` : null}
                  fallback="qualifying cart amount"
                />{" "}
                or above automatically qualify for <strong>FREE Shipping</strong>.
              </span>
            ) : (
              <span>
                Orders meeting our promotional subtotal threshold of{" "}
                <ConfigValue
                  value={freeThreshold ? `₹${freeThreshold}` : null}
                  fallback="qualifying cart amount"
                />{" "}
                may be eligible for free shipping when active.
              </span>
            )}
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Estimated Delivery Timelines</h2>
        <p>
          Once dispatched from our fulfillment center, standard transit delivery typically takes{" "}
          <ConfigValue
            value={deliveryTime}
            fallback="3 to 5 business days (Configure in Admin)"
          />
          .
        </p>
        <ul>
          <li>
            <strong>Metro & Tier-1 Cities:</strong> Deliveries typically arrive within 2 to 4 business days post-dispatch.
          </li>
          <li>
            <strong>Tier-2 & Regional Locations:</strong> Deliveries generally arrive within 4 to 7 business days depending on geographical accessibility.
          </li>
          <li>
            <strong>Unforeseen Delays:</strong> Delivery schedules may occasionally experience minor delays due to adverse weather events, regional strikes, or peak festive demand.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Shipment Tracking</h2>
        <p>
          As soon as your package is dispatched, we update your order record with tracking information. You can track your
          order status at any time:
        </p>
        <ul>
          <li>
            Log in to your account and navigate to <Link to="/orders">Your Orders</Link> to view real-time fulfillment status.
          </li>
          <li>
            Click on any individual order to review recipient address, payment status, and order item breakdown.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Undelivered & Returned Shipments (RTO)</h2>
        <p>
          Our courier partners will make up to three (3) delivery attempts. If a delivery cannot be completed due to incorrect
          address details, continuous customer unavailability, or refusal to accept a COD parcel, the package will be returned
          to our warehouse (Return to Origin - RTO).
        </p>
        <p>
          For prepaid orders returned via RTO, our team will contact you to confirm a corrected address or process a refund
          minus non-refundable carrier return charges.
        </p>
      </section>

      <section>
        <h2>7. Damaged or Tampered Shipments</h2>
        <p>
          If the outer delivery box appears heavily crushed, torn, or tampered with upon courier arrival:
        </p>
        <ul>
          <li>You may refuse to accept the delivery and immediately note the reason on the delivery slip.</li>
          <li>
            If already received, please take clear photographs/video of the unopened carton and notify our team via the{" "}
            <Link to="/contact">Contact Us</Link> page within <strong>48 hours</strong> of delivery.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Contact Shipping Support</h2>
        <p>If you have an urgent inquiry regarding a package in transit, please contact customer care:</p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@nexora.com">support@nexora.com</a>
          </li>
          <li>
            <strong>Helpline:</strong>{" "}
            <a href="tel:+919998880000">+91 9998880000</a>
          </li>
          <li>
            <strong>Office Address:</strong> Hitech City, Hyderabad, Telangana, India
          </li>
          <li>
            <strong>Tracking Portal:</strong> <Link to="/orders">View Orders & Tracking</Link>
          </li>
        </ul>
      </section>
    </PolicyLayout>
  );
}
