import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  User,
  Mail,
} from "lucide-react";
import { useBusinessConfig } from "../services/configService";
import { useSEO } from "../utils/seo";

export default function FAQ() {
  useSEO({
    title: "Frequently Asked Questions (FAQ)",
    description: "Find instant answers to common questions about orders, payments, shipping, returns, and account management at Nexora.",
  });

  const { config } = useBusinessConfig();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const returnDays = config.return_window_days
    ? `${config.return_window_days} calendar days`
    : "our official return window (configured in business administration)";

  const refundDays = config.refund_business_days
    ? `${config.refund_business_days} business days`
    : "5 to 7 business days";

  const freeShippingNote = config.free_shipping_enabled
    ? `Free standard shipping is active on all qualifying orders${
        config.free_shipping_threshold ? ` of ₹${config.free_shipping_threshold} or more` : ""
      }.`
    : config.free_shipping_threshold
    ? `Orders of ₹${config.free_shipping_threshold} and above qualify for free standard shipping.`
    : "Shipping fees are calculated transparently at checkout before payment.";

  const standardFeeNote = config.standard_shipping_fee
    ? `₹${config.standard_shipping_fee}`
    : "calculated during checkout";

  const processingTime = config.order_processing_time || "1 to 2 business days";
  const deliveryTime = config.delivery_estimate_time || "3 to 5 business days";

  const supportEmail = config.support_email || "our customer support team via the Contact Us page";
  const supportPhone = config.support_phone || "our helpline available via the Contact Us form";

  const faqs = useMemo(
    () => [
      // Orders
      {
        id: "ord-1",
        category: "orders",
        question: "How do I place an order on Nexora?",
        answer:
          "Browse our catalog, select your preferred product, and click 'Add to Cart' or 'Buy Now'. When you are ready, proceed to checkout, enter your delivery address, choose your payment method, and complete your purchase.",
      },
      {
        id: "ord-2",
        category: "orders",
        question: "How can I track the delivery status of my order?",
        answer:
          "Log into your Nexora account and navigate to 'Your Orders'. You will find a list of all your placed orders along with their real-time fulfillment status (Pending, Confirmed, Shipped, or Delivered).",
      },
      {
        id: "ord-3",
        category: "orders",
        question: "Can I cancel my order after placing it?",
        answer:
          "You can cancel your order prior to warehouse dispatch and fulfillment. Contact our support team immediately with your Order ID. If the order has already been shipped, you can refuse the parcel upon delivery or initiate a return after receipt.",
      },

      // Payments
      {
        id: "pay-1",
        category: "payments",
        question: "What payment methods are supported on Nexora?",
        answer:
          "We offer comprehensive, secure checkout through Razorpay. You can pay using Credit Cards, Debit Cards (Visa, MasterCard, RuPay, Maestro, Amex), UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), Net Banking across 50+ Indian banks, and supported Mobile Wallets. Cash on Delivery (COD) is also available on eligible orders.",
      },
      {
        id: "pay-2",
        category: "payments",
        question: "Is my payment and card information safe?",
        answer:
          "Yes, completely. All online payments are handled directly via Razorpay, a PCI-DSS Level 1 certified payment gateway. Nexora never stores or accesses your raw card numbers, CVVs, or UPI PINs on our servers.",
      },
      {
        id: "pay-3",
        category: "payments",
        question: "What if money was deducted from my account but the order failed?",
        answer: `If your payment was debited but the order was not confirmed due to network lag, the banking network automatically initiates an auto-reversal. Your bank will reverse the funds back to your account within ${refundDays}. In addition, our automated Razorpay webhook checks for delayed captures to ensure no funds are lost.`,
      },

      // Shipping
      {
        id: "shp-1",
        category: "shipping",
        question: "How much does shipping cost, and how do I get free shipping?",
        answer: `${freeShippingNote} Otherwise, a standard delivery fee of ${standardFeeNote} applies. All delivery costs are displayed upfront in your order summary before payment.`,
      },
      {
        id: "shp-2",
        category: "shipping",
        question: "How long does order processing and delivery take?",
        answer: `Orders are typically processed and packed within ${processingTime}. Once handed over to our courier partners, transit delivery generally takes ${deliveryTime} depending on your PIN code.`,
      },
      {
        id: "shp-3",
        category: "shipping",
        question: "Do you deliver to my postal PIN code?",
        answer:
          "We deliver to serviceable PIN codes across all states and union territories in India. You can verify your PIN code using the location selector in the top navigation bar or during checkout.",
      },

      // Returns & Refunds
      {
        id: "ret-1",
        category: "returns",
        question: "What is Nexora's return window?",
        answer: `Eligible items can be returned within ${returnDays} from the date of delivery. The item must be unused, unwashed, in its original packaging, and with all tags intact.`,
      },
      {
        id: "ret-2",
        category: "returns",
        question: "How long does it take to receive my refund?",
        answer: `Once our fulfillment center receives and inspects your returned product, your refund is approved and credited back to your original payment method within ${refundDays}. For Cash on Delivery orders, refunds are settled via bank transfer (NEFT/IMPS).`,
      },
      {
        id: "ret-3",
        category: "returns",
        question: "Are any items non-returnable?",
        answer:
          "For hygiene and safety reasons, personal care items with broken safety seals, intimate innerwear, consumables, and items explicitly marked as 'Final Sale' cannot be returned unless received in a damaged or defective state.",
      },

      // Account & Security
      {
        id: "acc-1",
        category: "account",
        question: "Do I need an account to shop on Nexora?",
        answer:
          "You can browse products freely without an account. To complete a purchase, add items to your wishlist, or track order shipments, creating an account or logging in is required.",
      },
      {
        id: "acc-2",
        category: "account",
        question: "How do I update my profile or delivery address?",
        answer:
          "Log in and navigate to 'Profile' from the top right user menu. You can update your personal information, contact phone, and saved shipping addresses anytime.",
      },

      // Customer Support
      {
        id: "sup-1",
        category: "support",
        question: "How can I contact Nexora Customer Care?",
        answer: `You can send us an inquiry via our Contact Us page. You can also reach our support team at ${supportEmail} or ${supportPhone}. We respond to all inquiries within 24 to 48 business hours.`,
      },
    ],
    [
      returnDays,
      refundDays,
      freeShippingNote,
      standardFeeNote,
      processingTime,
      deliveryTime,
      supportEmail,
      supportPhone,
    ]
  );

  const categories = [
    { key: "all", label: "All Topics", icon: HelpCircle },
    { key: "orders", label: "Orders", icon: Package },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "shipping", label: "Shipping", icon: Truck },
    { key: "returns", label: "Returns & Refunds", icon: RotateCcw },
    { key: "account", label: "Account", icon: User },
    { key: "support", label: "Support", icon: Mail },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="nx-faq-page">
      <style>{faqStyles}</style>

      {/* Hero Header */}
      <section className="nx-faq-hero">
        <div className="nx-faq-container">
          <span className="nx-faq-kicker">KNOWLEDGE BASE</span>
          <h1>Frequently Asked Questions</h1>
          <p>Instant answers to help you navigate your orders, shipping, returns, and payment options.</p>

          {/* Search Box */}
          <div className="nx-faq-search-box">
            <Search size={18} className="nx-search-icon" />
            <input
              type="text"
              placeholder="Search by keywords (e.g., refund, delivery, UPI, return)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQs"
            />
            {searchQuery && (
              <button
                type="button"
                className="nx-search-clear"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter Pills */}
      <div className="nx-faq-container">
        <div className="nx-category-tabs" role="tablist">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`nx-category-pill ${isSelected ? "is-selected" : ""}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="nx-faq-list">
          {filteredFaqs.length === 0 ? (
            <div className="nx-faq-empty">
              <HelpCircle size={40} />
              <h3>No matching questions found</h3>
              <p>We couldn't find any questions matching "{searchQuery}". Try different keywords or browse all topics.</p>
              <button
                type="button"
                className="nx-reset-faq-btn"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div key={faq.id} className={`nx-accordion-item ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="nx-accordion-header"
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="nx-question-text">{faq.question}</span>
                    <span className="nx-accordion-arrow">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="nx-accordion-body">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div className="nx-faq-cta-card">
          <div>
            <h3>Still have questions?</h3>
            <p>Can't find the answer you're looking for? Please contact our friendly customer support team.</p>
          </div>
          <Link to="/contact" className="nx-faq-contact-btn">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

const faqStyles = `
.nx-faq-page {
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding-bottom: 60px;
}

.nx-faq-container {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 32px);
}

.nx-faq-hero {
  background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
  color: #ffffff;
  padding: clamp(36px, 5vw, 60px) 0 44px;
  border-bottom: 1px solid #334155;
  margin-bottom: 32px;
  text-align: center;
}

.nx-faq-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #65d6bd;
  display: block;
  margin-bottom: 10px;
}

.nx-faq-hero h1 {
  font-size: clamp(28px, 4.5vw, 42px);
  font-weight: 800;
  margin: 0 0 10px;
  letter-spacing: -0.5px;
}

.nx-faq-hero p {
  font-size: clamp(14px, 2vw, 17px);
  color: #cbd5e1;
  max-width: 620px;
  margin: 0 auto 28px;
  line-height: 1.6;
}

.nx-faq-search-box {
  max-width: 620px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
}

.nx-faq-search-box input {
  width: 100%;
  padding: 14px 44px 14px 46px;
  font-size: 15px;
  border-radius: 9999px;
  border: 1px solid #475569;
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.nx-faq-search-box input:focus {
  outline: none;
  border-color: #65d6bd;
  box-shadow: 0 0 0 3px rgba(101, 214, 189, 0.3);
}

.nx-search-icon {
  position: absolute;
  left: 18px;
  color: #64748b;
  pointer-events: none;
}

.nx-search-clear {
  position: absolute;
  right: 16px;
  background: #e2e8f0;
  border: none;
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
}

.nx-category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 28px;
  -webkit-overflow-scrolling: touch;
}

.nx-category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.nx-category-pill:hover {
  border-color: #0f766e;
  color: #0f766e;
}

.nx-category-pill.is-selected {
  background: #0f766e;
  border-color: #0f766e;
  color: #ffffff;
}

.nx-faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 40px;
}

.nx-accordion-item {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s;
}

.nx-accordion-item.is-open {
  border-color: #0f766e;
}

.nx-accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.nx-question-text {
  font-size: 15.5px;
  font-weight: 600;
  color: #0f172a;
  padding-right: 16px;
}

.nx-accordion-arrow {
  color: #64748b;
  flex-shrink: 0;
}

.nx-accordion-body {
  padding: 0 22px 20px;
  border-top: 1px solid #f1f5f9;
}

.nx-accordion-body p {
  margin: 14px 0 0;
  color: #334155;
  font-size: 14.5px;
  line-height: 1.65;
}

.nx-faq-empty {
  text-align: center;
  padding: 48px 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.nx-faq-empty h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 12px 0 6px;
}

.nx-reset-faq-btn {
  margin-top: 14px;
  padding: 8px 16px;
  background: #111827;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.nx-faq-cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 28px 32px;
  flex-wrap: wrap;
}

.nx-faq-cta-card h3 {
  font-size: 19px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
}

.nx-faq-cta-card p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.nx-faq-contact-btn {
  display: inline-flex;
  align-items: center;
  padding: 12px 22px;
  background: #0f766e;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.15s;
}

.nx-faq-contact-btn:hover {
  background: #0d9488;
}
`;
