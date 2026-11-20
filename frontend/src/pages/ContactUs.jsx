import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Package,
  Copy,
  Check,
  Search,
} from "lucide-react";
import api from "../services/api";
import { useSEO } from "../utils/seo";

const SUPPORT_TICKET_STORAGE_KEY = "nexora_support_tickets";
const SUPPORT_CATEGORIES = [
  "Orders & Delivery",
  "Returns & Refunds",
  "Payments",
  "Products & Availability",
  "Account & Security",
  "Other",
];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function readSupportTickets() {
  try {
    const saved = window.localStorage.getItem(SUPPORT_TICKET_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return {};
    if (Array.isArray(parsed)) {
      return parsed.reduce((store, ticket) => {
        const key = normalizeEmail(ticket?.email);
        if (key && ticket?.ticketId) store[key] = [...(store[key] || []), ticket];
        return store;
      }, {});
    }
    return Object.entries(parsed).reduce((store, [email, tickets]) => {
      if (Array.isArray(tickets)) {
        const key = normalizeEmail(email);
        store[key] = tickets.filter((ticket) => ticket?.ticketId);
      }
      return store;
    }, {});
  } catch (error) {
    console.error("Could not read saved support tickets:", error);
    return {};
  }
}

function mergeSupportTickets(store, tickets, fallbackEmail = "") {
  const nextStore = { ...store };
  for (const ticket of tickets) {
    const email = normalizeEmail(ticket.email || fallbackEmail);
    if (!email || !ticket.ticketId) continue;
    const current = nextStore[email] || [];
    const existing = current.find((item) => item.ticketId === ticket.ticketId);
    const merged = {
      ...existing,
      ...ticket,
      email,
      name: ticket.name || existing?.name || "",
      message: ticket.message || existing?.message || "",
      latestUpdate: ticket.latestUpdate || existing?.latestUpdate || "",
      admin_reply: ticket.admin_reply ?? existing?.admin_reply ?? "",
    };
    nextStore[email] = [
      merged,
      ...current.filter((item) => item.ticketId !== ticket.ticketId),
    ].sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() -
        new Date(left.createdAt || 0).getTime()
    );
  }
  return nextStore;
}

function getTicketStatus(ticket) {
  const status = String(ticket.status || "new").toLowerCase();
  if (status === "resolved") {
    return {
      className: "resolved",
      label: ticket.statusLabel || "Resolved",
      progress: 3,
      update:
        ticket.latestUpdate ||
        "Your enquiry has been resolved. Please check your email for the resolution details.",
    };
  }
  if (["in_progress", "agent_assigned"].includes(status)) {
    return {
      className: "in-progress",
      label: ticket.statusLabel || (status === "agent_assigned" ? "Agent Assigned" : "In Progress / Under Review"),
      progress: 2,
      update:
        ticket.latestUpdate ||
        (status === "agent_assigned"
          ? "A support executive has been assigned to your enquiry."
          : "A support executive is reviewing your enquiry."),
    };
  }
  return {
    className: "open",
    label: ticket.statusLabel || "Open / Received",
    progress: 1,
    update:
      ticket.latestUpdate || "Your enquiry was received and is queued for review.",
  };
}

function formatSupportDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function SupportTicketCard({ ticket, onCopy, copied }) {
  const status = getTicketStatus(ticket);
  const steps = [
    "Enquiry Received",
    "Support Executive Reviewing",
    "Resolution Shared",
  ];

  return (
    <article className="nx-ticket-card">
      <header className="nx-ticket-card-header">
        <div className="nx-ticket-card-id">
          <strong>{ticket.ticketId}</strong>
          <button
            type="button"
            className="nx-ticket-copy-icon"
            onClick={() => onCopy(ticket.ticketId)}
            aria-label={`Copy ticket ID ${ticket.ticketId}`}
            title="Copy ticket ID"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <span className={`nx-ticket-status nx-ticket-status--${status.className}`}>
          <span aria-hidden="true" />
          {status.label}
        </span>
      </header>
      <div className="nx-ticket-card-summary">
        <div>
          <h3>{ticket.subject || "Support enquiry"}</h3>
          <span className="nx-ticket-category">{ticket.category || "General"}</span>
        </div>
        <time dateTime={ticket.createdAt || undefined}>
          {formatSupportDate(ticket.createdAt)}
        </time>
      </div>
      <ol className="nx-ticket-progress" aria-label="Enquiry progress">
        {steps.map((step, index) => {
          const complete = index < status.progress;
          const current = index === status.progress && status.progress < steps.length;
          return (
            <li
              className={`${complete ? "is-complete" : ""}${current ? " is-current" : ""}`}
              key={step}
            >
              <span>{complete ? <Check size={13} aria-hidden="true" /> : index + 1}</span>
              <strong>{step}</strong>
            </li>
          );
        })}
      </ol>
      <p className="nx-ticket-sla">
        Expected response within 24 hours via{" "}
        <a href="mailto:support@nexora.com">support@nexora.com</a>
      </p>
      <details className="nx-ticket-details">
        <summary>View Message &amp; Support Reply</summary>
        <div>
          <strong>Your message</strong>
          <p>
            {ticket.message ||
              "Your original message is available in the browser where this enquiry was submitted."}
          </p>
          <strong>Latest support update</strong>
          <p>{status.update}</p>
          {ticket.admin_reply && (
            <>
              <strong>Support reply</strong>
              <p>{ticket.admin_reply}</p>
            </>
          )}
          {ticket.updatedAt && (
            <small className="nx-ticket-updated">
              Updated {formatSupportDate(ticket.updatedAt)}
            </small>
          )}
          {ticket.syncStatus === "local_only" && (
            <p className="nx-ticket-local-warning">
              This enquiry is saved on this device only and has not reached support.
              Please submit the form again when online.
            </p>
          )}
        </div>
      </details>
    </article>
  );
}

export default function ContactUs() {
  useSEO({
    title: "Contact Us - Customer Support",
    description: "Get in touch with Nexora customer support for inquiries regarding orders, shipping, returns, and payments.",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    order_id: "",
    category: "Other",
    subject: "",
    message: "",
    honeypot: "", // invisible spam bot trap
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [submittedSubject, setSubmittedSubject] = useState("");
  const [submittedCategory, setSubmittedCategory] = useState("");
  const [ticketCopied, setTicketCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [ticketStore, setTicketStore] = useState(readSupportTickets);
  const [activeEmail, setActiveEmail] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [trackerError, setTrackerError] = useState("");
  const [copiedTicketId, setCopiedTicketId] = useState("");
  const [storageWarning, setStorageWarning] = useState("");

  const updateTicketStore = (nextStore) => {
    setTicketStore(nextStore);
    try {
      window.localStorage.setItem(
        SUPPORT_TICKET_STORAGE_KEY,
        JSON.stringify(nextStore)
      );
      setStorageWarning("");
    } catch (error) {
      console.error("Could not persist support ticket history:", error);
      setStorageWarning(
        "Ticket history could not be saved to this browser. Keep your ticket ID for reference."
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Please enter your full name (at least 2 characters).";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.category.trim()) {
      errors.category = "Please select a support category.";
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      errors.subject = "Please enter a subject (at least 3 characters).";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = "Please write a message of at least 10 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/core/contact/", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        order_id: formData.order_id.trim(),
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        honeypot: formData.honeypot,
      });

      const email = normalizeEmail(formData.email);
      const ticket = {
        ticketId: response.data?.ticketId,
        name: formData.name.trim(),
        email,
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim(),
        createdAt: response.data?.createdAt || new Date().toISOString(),
        updatedAt: response.data?.updatedAt || response.data?.createdAt,
        status: response.data?.status || "new",
        statusLabel: response.data?.statusLabel || "Open / Received",
        latestUpdate:
          response.data?.latestUpdate ||
          "Your enquiry was received and is queued for review.",
        admin_reply: response.data?.admin_reply || "",
        syncStatus: "synced",
      };
      if (!ticket.ticketId) {
        throw new Error("Support service did not return a ticket reference.");
      }

      updateTicketStore(mergeSupportTickets(ticketStore, [ticket]));
      setActiveEmail(email);
      setLookupQuery(email);
      setLookupResults([]);
      setTrackerError("");
      setSubmittedId(ticket.ticketId);
      setSubmittedSubject(formData.subject.trim());
      setSubmittedCategory(formData.category);
      setTicketCopied(false);
      setCopyError("");
      setFormData({
        name: "",
        email: "",
        phone: "",
        order_id: "",
        category: "Other",
        subject: "",
        message: "",
        honeypot: "",
      });
    } catch (err) {
      console.error("Contact inquiry submission failed:", err);
      const data = err.response?.data;
      if (!err.response || err.response.status >= 500) {
        const createdAt = new Date();
        const dateStamp = createdAt.toISOString().slice(0, 10).replace(/-/g, "");
        const localTicket = {
          ticketId: `NX-${dateStamp}-${Math.floor(100000 + Math.random() * 900000)}`,
          name: formData.name.trim(),
          email: normalizeEmail(formData.email),
          subject: formData.subject.trim(),
          category: formData.category,
          message: formData.message.trim(),
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
          status: "new",
          statusLabel: "Open / Received",
          latestUpdate: "Saved on this browser; support has not received it yet.",
          syncStatus: "local_only",
        };
        updateTicketStore(mergeSupportTickets(ticketStore, [localTicket]));
        setActiveEmail(localTicket.email);
        setLookupQuery(localTicket.email);
        setErrorMessage(
          `Nexora support could not be reached. Your enquiry is saved on this device only as ${localTicket.ticketId}; please submit again when the service is available.`
        );
      } else if (data && typeof data === "object") {
        if (data.detail) {
          setErrorMessage(data.detail);
        } else {
          const firstError = Object.values(data).flat()[0];
          setErrorMessage(firstError || "Unable to send your message. Please check the form and try again.");
        }
      } else {
        setErrorMessage("Unable to send your message. Please check the form and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyTicketId = async () => {
    try {
      await navigator.clipboard.writeText(submittedId);
      setTicketCopied(true);
      setCopyError("");
    } catch (error) {
      console.error("Could not copy support ticket ID:", error);
      setTicketCopied(false);
      setCopyError("Unable to copy automatically. Please select and copy the ticket ID.");
    }
  };

  const handleCopyTicket = async (ticketId) => {
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopiedTicketId(ticketId);
      window.setTimeout(() => setCopiedTicketId(""), 1800);
    } catch (error) {
      console.error("Could not copy support ticket ID:", error);
      setTrackerError("Unable to copy automatically. Select and copy the ticket ID.");
    }
  };

  const handleTicketLookup = async (event) => {
    event.preventDefault();
    const query = lookupQuery.trim();
    setTrackerError("");
    setLookupResults([]);
    if (!query) {
      setTrackerError("Enter an NX ticket ID or the email used to submit the enquiry.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    const isTicketId = /^NX-\d{8}-\d{6}$/i.test(query);
    if (!isEmail && !isTicketId) {
      setTrackerError("Enter a valid email address or NX-YYYYMMDD-XXXXXX ticket ID.");
      return;
    }

    setLookupLoading(true);
    try {
      const params = isEmail
        ? { email: normalizeEmail(query) }
        : { ticket_id: query.toUpperCase() };
      const response = await api.get("/core/contact/tickets/", { params });
      const results = Array.isArray(response.data?.tickets)
        ? response.data.tickets
        : [];
      if (!results.length) {
        if (isEmail) {
          const email = normalizeEmail(query);
          setActiveEmail(email);
          setTrackerError(
            (ticketStore[email] || []).length
              ? "No server-registered tickets were found; showing saved tickets from this browser."
              : "No support enquiries were found for that email."
          );
        } else {
          setTrackerError("No support enquiries were found for that ticket ID.");
        }
        return;
      }

      const localTickets = Object.values(ticketStore).flat();
      const normalizedResults = results.map((ticket) => {
        const localTicket = localTickets.find(
          (saved) => saved.ticketId === ticket.ticketId
        );
        return {
          ...localTicket,
          ...ticket,
          updatedAt: ticket.updatedAt || ticket.createdAt,
          email: localTicket?.email || (isEmail ? normalizeEmail(query) : ""),
          name: localTicket?.name || "",
          message: localTicket?.message || "",
          syncStatus: "synced",
        };
      });
      const fallbackEmail = isEmail
        ? normalizeEmail(query)
        : normalizedResults[0]?.email;
      updateTicketStore(
        mergeSupportTickets(ticketStore, normalizedResults, fallbackEmail)
      );
      if (isEmail) {
        setActiveEmail(normalizeEmail(query));
      } else {
        setLookupResults(normalizedResults);
        if (fallbackEmail) setActiveEmail(fallbackEmail);
      }
    } catch (error) {
      console.error("Support ticket lookup failed:", error);
      const localTickets = Object.values(ticketStore).flat();
      if (isEmail) {
        const email = normalizeEmail(query);
        const localMatches = ticketStore[email] || [];
        setActiveEmail(email);
        setTrackerError(
          localMatches.length
            ? "Live status is unavailable; showing saved ticket details."
            : error.response?.data?.detail ||
                "Could not check ticket status. Please try again later."
        );
      } else {
        const localMatch = localTickets.find(
          (ticket) => ticket.ticketId.toUpperCase() === query.toUpperCase()
        );
        if (localMatch) {
          setLookupResults([localMatch]);
          setActiveEmail(localMatch.email);
          setTrackerError("Live status is unavailable; showing saved ticket details.");
        } else {
          setTrackerError(
            error.response?.data?.detail ||
              "Could not check ticket status. Please try again later."
          );
        }
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const recentTickets = activeEmail ? ticketStore[activeEmail] || [] : [];

  return (
    <div className="nx-contact-page">
      <style>{contactStyles}</style>

      {/* Hero Section */}
      <section className="nx-contact-hero">
        <div className="nx-contact-container">
          <span className="nx-contact-kicker">CUSTOMER CARE</span>
          <h1>We're Here to Help</h1>
          <p>
            Have a question about your order, shipping, returns, or product availability? Send us a message and our
            dedicated support team will assist you.
          </p>
        </div>
      </section>

      {/* Content Grid */}
      <section className="nx-contact-container nx-contact-grid">
        <div className="nx-contact-main-column">
          {/* Contact Form */}
          <div className="nx-contact-form-card">
          <h2>Send Us a Message</h2>
          <p className="nx-form-subtext">Fill out the form below. We typically respond within 24 to 48 business hours.</p>

          {submittedId ? (
            <div className="nx-success-banner" role="alert">
              <CheckCircle2 size={32} className="nx-success-icon" />
              <div className="nx-success-content">
                <h3>Inquiry Submitted Successfully!</h3>
                <p>
                  Thank you for contacting Nexora. Our customer care team is reviewing your request.
                </p>
                <div className="nx-ticket-reference">
                  <span>Ticket ID</span>
                  <strong>{submittedId}</strong>
                  <button type="button" className="nx-copy-ticket-btn" onClick={copyTicketId}>
                    {ticketCopied ? <Check size={15} /> : <Copy size={15} />}
                    {ticketCopied ? "Copied" : "Copy Ticket ID"}
                  </button>
                </div>
                {copyError && <p className="nx-copy-error" role="status">{copyError}</p>}
                <dl className="nx-ticket-meta">
                  <div>
                    <dt>Submitted subject</dt>
                    <dd>{submittedSubject}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{submittedCategory}</dd>
                  </div>
                  <div>
                    <dt>Expected response</dt>
                    <dd>Within 24 hours via support@nexora.com</dd>
                  </div>
                </dl>
                {storageWarning && (
                  <p className="nx-storage-warning" role="status">{storageWarning}</p>
                )}
                <button
                  type="button"
                  className="nx-reset-btn"
                  onClick={() => {
                    setSubmittedId(null);
                    setSubmittedSubject("");
                    setSubmittedCategory("");
                    setTicketCopied(false);
                    setCopyError("");
                  }}
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {errorMessage && (
                <div className="nx-error-banner" role="alert">
                  <AlertCircle size={20} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Spam Trap Honeypot (hidden from human visitors) */}
              <div style={{ display: "none" }} aria-hidden="true">
                <label htmlFor="nx_honeypot_field">Leave this field blank</label>
                <input
                  id="nx_honeypot_field"
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleChange}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              <div className="nx-form-row">
                <div className="nx-form-group">
                  <label htmlFor="contact_name">
                    Full Name <span className="nx-required">*</span>
                  </label>
                  <input
                    id="contact_name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={fieldErrors.name ? "has-error" : ""}
                    disabled={submitting}
                    required
                  />
                  {fieldErrors.name && <span className="nx-field-error">{fieldErrors.name}</span>}
                </div>

                <div className="nx-form-group">
                  <label htmlFor="contact_email">
                    Email Address <span className="nx-required">*</span>
                  </label>
                  <input
                    id="contact_email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={fieldErrors.email ? "has-error" : ""}
                    disabled={submitting}
                    required
                  />
                  {fieldErrors.email && <span className="nx-field-error">{fieldErrors.email}</span>}
                </div>
              </div>

              <div className="nx-form-row">
                <div className="nx-form-group">
                  <label htmlFor="contact_phone">
                    Phone Number <small>(Optional)</small>
                  </label>
                  <input
                    id="contact_phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    disabled={submitting}
                  />
                </div>

                <div className="nx-form-group">
                  <label htmlFor="contact_order_id">
                    Order ID <small>(Optional)</small>
                  </label>
                  <input
                    id="contact_order_id"
                    type="text"
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleChange}
                    placeholder="e.g. NXR-1A2B3C4D"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="nx-form-group">
                <label htmlFor="contact_category">
                  Enquiry Category <span className="nx-required">*</span>
                </label>
                <select
                  id="contact_category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={fieldErrors.category ? "has-error" : ""}
                  disabled={submitting}
                  required
                >
                  {SUPPORT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <span className="nx-field-error">{fieldErrors.category}</span>
                )}
              </div>

              <div className="nx-form-group">
                <label htmlFor="contact_subject">
                  Subject <span className="nx-required">*</span>
                </label>
                <input
                  id="contact_subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="What can we help you with?"
                  className={fieldErrors.subject ? "has-error" : ""}
                  disabled={submitting}
                  required
                />
                {fieldErrors.subject && <span className="nx-field-error">{fieldErrors.subject}</span>}
              </div>

              <div className="nx-form-group">
                <label htmlFor="contact_message">
                  Message <span className="nx-required">*</span>
                </label>
                <textarea
                  id="contact_message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please describe your question or issue in detail..."
                  className={fieldErrors.message ? "has-error" : ""}
                  disabled={submitting}
                  required
                />
                {fieldErrors.message && <span className="nx-field-error">{fieldErrors.message}</span>}
              </div>

              <button
                type="submit"
                className="nx-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>Sending Message...</>
                ) : (
                  <>
                    <Send size={16} /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
          </div>

          <section className="nx-support-tracker-card" aria-labelledby="nx-tracker-title">
            <header className="nx-tracker-heading">
              <div>
                <h2 id="nx-tracker-title">Track Enquiry Status / My Support Tickets</h2>
                <p>Check an NX ticket reference or see enquiries linked to your email.</p>
              </div>
            </header>
            <form className="nx-ticket-lookup" onSubmit={handleTicketLookup}>
              <label htmlFor="nx-ticket-lookup-input">Quick Ticket Lookup</label>
              <div>
                <input
                  id="nx-ticket-lookup-input"
                  type="search"
                  value={lookupQuery}
                  onChange={(event) => setLookupQuery(event.target.value)}
                  placeholder="NX-20261119-123456 or you@example.com"
                  autoComplete="email"
                />
                <button type="submit" disabled={lookupLoading}>
                  <Search size={16} aria-hidden="true" />
                  {lookupLoading ? "Checking…" : "Check Status"}
                </button>
              </div>
            </form>
            {trackerError && (
              <p className="nx-tracker-message" role="status">{trackerError}</p>
            )}
            {storageWarning && (
              <p className="nx-tracker-message" role="status">{storageWarning}</p>
            )}

            {lookupResults.length > 0 && (
              <div className="nx-lookup-results" aria-live="polite">
                <h3>Ticket Status</h3>
                {lookupResults.map((ticket) => (
                  <SupportTicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    onCopy={handleCopyTicket}
                    copied={copiedTicketId === ticket.ticketId}
                  />
                ))}
              </div>
            )}

            <div className="nx-recent-tickets">
              <div className="nx-recent-tickets-heading">
                <h3>My Recent Enquiries</h3>
                {activeEmail && <span>{activeEmail}</span>}
              </div>
              {recentTickets.length ? (
                recentTickets.map((ticket) => (
                  <SupportTicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    onCopy={handleCopyTicket}
                    copied={copiedTicketId === ticket.ticketId}
                  />
                ))
              ) : (
                <p className="nx-tracker-empty">
                  Enter the email used for your enquiry to load recent tickets, or submit a new message above.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Information */}
        <aside className="nx-contact-sidebar">
          <div className="nx-info-card">
            <h3>Direct Contact Channels</h3>

            <div className="nx-info-item">
              <Mail className="nx-info-icon" size={20} />
              <div>
                <strong>Support Email</strong>
                <a href="mailto:support@nexora.com">support@nexora.com</a>
              </div>
            </div>

            <div className="nx-info-item">
              <Phone className="nx-info-icon" size={20} />
              <div>
                <strong>Customer Care Mobile</strong>
                <a href="tel:+919998880000">+91 9998880000</a>
              </div>
            </div>

            <div className="nx-info-item">
              <MapPin className="nx-info-icon" size={20} />
              <div>
                <strong>Office Address</strong>
                <p className="nx-address-text">Hitech City, Hyderabad, Telangana, India</p>
              </div>
            </div>

            <div className="nx-info-item">
              <Clock className="nx-info-icon" size={20} />
              <div>
                <strong>Operating Hours</strong>
                <p className="nx-address-text">Monday to Saturday: 10:00 AM – 7:00 PM IST</p>
              </div>
            </div>
          </div>

          <div className="nx-quick-links-card">
            <h3>Self-Service Resources</h3>
            <p>Save time by checking our instant help guides and tracking:</p>
            <ul>
              <li>
                <Link to="/orders">
                  <Package size={15} /> Track Your Existing Orders
                </Link>
              </li>
              <li>
                <Link to="/faq">
                  <HelpCircle size={15} /> Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/return-refund-policy">
                  <ShieldCheck size={15} /> Return & Refund Terms
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

const contactStyles = `
.nx-contact-page {
  background: #f8fafc;
  color: #1e293b;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding-bottom: 60px;
  overflow-x: hidden;
}

.nx-contact-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 32px);
}

.nx-contact-hero {
  background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
  color: #ffffff;
  padding: clamp(36px, 5vw, 60px) 0;
  border-bottom: 1px solid #334155;
  margin-bottom: 36px;
  text-align: center;
}

.nx-contact-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #65d6bd;
  display: block;
  margin-bottom: 10px;
}

.nx-contact-hero h1 {
  font-size: clamp(28px, 4.5vw, 44px);
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.nx-contact-hero p {
  font-size: clamp(15px, 2vw, 17px);
  color: #cbd5e1;
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}

.nx-contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 36px;
  align-items: start;
  min-width: 0;
}

.nx-contact-form-card {
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: clamp(20px, 4vw, 40px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nx-contact-form-card h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
}

.nx-form-subtext {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px;
}

.nx-form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.nx-form-group {
  margin-bottom: 18px;
}

.nx-form-group label {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.nx-required {
  color: #dc2626;
}

.nx-form-group input,
.nx-form-group textarea,
.nx-form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.nx-form-group input:focus,
.nx-form-group textarea:focus,
.nx-form-group select:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
}

.nx-form-group input.has-error,
.nx-form-group textarea.has-error,
.nx-form-group select.has-error {
  border-color: #dc2626;
  background: #fff5f5;
}

.nx-field-error {
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

.nx-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  background: #111827;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.nx-submit-btn:hover:not(:disabled) {
  background: #0f766e;
}

.nx-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nx-contact-main-column {
  display: grid;
  min-width: 0;
  gap: 24px;
}

.nx-support-tracker-card {
  display: grid;
  min-width: 0;
  gap: 17px;
  padding: clamp(18px, 3vw, 30px);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .05);
}

.nx-tracker-heading h2 {
  margin: 0 0 5px;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.nx-tracker-heading p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.nx-ticket-lookup {
  display: grid;
  gap: 7px;
}

.nx-ticket-lookup > label {
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.nx-ticket-lookup > div {
  display: flex;
  min-width: 0;
  gap: 8px;
}

.nx-ticket-lookup input {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  color: #1e293b;
  font: inherit;
  font-size: 13px;
}

.nx-ticket-lookup input:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, .12);
}

.nx-ticket-lookup button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 8px 13px;
  border: 0;
  border-radius: 7px;
  background: #0f766e;
  color: white;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}

.nx-ticket-lookup button:disabled {
  opacity: .65;
  cursor: wait;
}

.nx-tracker-message,
.nx-tracker-empty,
.nx-storage-warning {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.nx-tracker-message {
  color: #9a3412;
}

.nx-storage-warning,
.nx-ticket-local-warning {
  color: #9a3412 !important;
}

.nx-recent-tickets,
.nx-lookup-results {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.nx-recent-tickets-heading {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
}

.nx-recent-tickets-heading h3,
.nx-lookup-results h3 {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
}

.nx-recent-tickets-heading > span {
  color: #64748b;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.nx-ticket-card {
  display: grid;
  min-width: 0;
  gap: 13px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.nx-ticket-card-header,
.nx-ticket-card-id {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.nx-ticket-card-header {
  justify-content: space-between;
  flex-wrap: wrap;
}

.nx-ticket-card-id strong {
  color: #0f766e;
  font-size: 13px;
  letter-spacing: .02em;
  overflow-wrap: anywhere;
}

.nx-ticket-copy-icon {
  display: inline-grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #dce5e9;
  border-radius: 6px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
}

.nx-ticket-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.nx-ticket-status > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.nx-ticket-status--open {
  background: #eff6ff;
  color: #1d4ed8;
}

.nx-ticket-status--in-progress {
  background: #fff7ed;
  color: #b45309;
}

.nx-ticket-status--resolved {
  background: #ecfdf5;
  color: #047857;
}

.nx-ticket-card-summary {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 8px 14px;
}

.nx-ticket-card-summary h3 {
  margin: 0 0 5px;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.nx-ticket-category {
  display: inline-block;
  max-width: 100%;
  padding: 4px 7px;
  border-radius: 5px;
  background: #f1f5f9;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.nx-ticket-card-summary time {
  color: #64748b;
  font-size: 10px;
  line-height: 1.4;
  text-align: right;
  overflow-wrap: anywhere;
}

.nx-ticket-progress {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nx-ticket-progress li {
  display: grid;
  min-width: 0;
  justify-items: center;
  gap: 6px;
  color: #8a95a5;
  text-align: center;
}

.nx-ticket-progress li > span {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  font-size: 10px;
  font-weight: 800;
}

.nx-ticket-progress li strong {
  font-size: 10px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.nx-ticket-progress li.is-complete,
.nx-ticket-progress li.is-current {
  color: #0f766e;
}

.nx-ticket-progress li.is-complete > span,
.nx-ticket-progress li.is-current > span {
  border-color: #0f766e;
  background: #0f766e;
  color: #fff;
}

.nx-ticket-sla {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.nx-ticket-sla a {
  color: #0f766e;
  font-weight: 700;
  text-decoration: none;
}

.nx-ticket-details {
  border-top: 1px solid #edf2f7;
  padding-top: 10px;
  color: #475569;
  font-size: 12px;
}

.nx-ticket-details summary {
  color: #0f766e;
  font-weight: 750;
  cursor: pointer;
}

.nx-ticket-details > div {
  display: grid;
  gap: 6px;
  padding-top: 11px;
}

.nx-ticket-details strong {
  color: #334155;
}

.nx-ticket-details p {
  margin: 0 0 5px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.nx-ticket-updated {
  color: #64748b;
  font-size: 10px;
}

.nx-success-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 24px;
  border-radius: 8px;
  color: #166534;
  min-width: 0;
  overflow-wrap: anywhere;
}

.nx-success-content {
  min-width: 0;
  flex: 1;
}

.nx-success-icon {
  flex-shrink: 0;
  color: #16a34a;
}

.nx-success-banner h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
}

.nx-success-banner p {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px;
}

.nx-ticket-reference {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 0 0 14px;
  padding: 12px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #ffffff;
}

.nx-ticket-reference span {
  flex-basis: 100%;
  font-size: 12px;
  font-weight: 600;
  color: #166534;
}

.nx-ticket-reference strong {
  font-size: 16px;
  letter-spacing: 0.03em;
  overflow-wrap: anywhere;
}

.nx-copy-ticket-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  margin-left: auto;
  padding: 7px 10px;
  border: 1px solid #86efac;
  border-radius: 6px;
  background: #f0fdf4;
  color: #166534;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.nx-copy-ticket-btn:hover {
  background: #dcfce7;
}

.nx-copy-error {
  color: #991b1b;
  font-size: 12px;
  margin: -6px 0 12px;
}

.nx-ticket-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 18px;
}

.nx-ticket-meta div {
  min-width: 0;
}

.nx-ticket-meta dt {
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
}

.nx-ticket-meta dd {
  margin: 4px 0 0;
  color: #14532d;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.nx-reset-btn {
  padding: 8px 14px;
  background: #16a34a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.nx-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

.nx-contact-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.nx-info-card,
.nx-quick-links-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nx-info-card h3,
.nx-quick-links-card h3 {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.nx-info-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.nx-info-icon {
  color: #0f766e;
  flex-shrink: 0;
  margin-top: 2px;
}

.nx-info-item strong {
  display: block;
  font-size: 13.5px;
  color: #0f172a;
  margin-bottom: 2px;
}

.nx-info-item a {
  color: #0f766e;
  text-decoration: none;
  font-size: 14px;
}

.nx-info-item a:hover {
  text-decoration: underline;
}

.nx-address-text {
  font-size: 13.5px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.nx-pending-note {
  font-size: 13px;
  color: #64748b;
  font-style: italic;
}

.nx-quick-links-card p {
  font-size: 13.5px;
  color: #64748b;
  margin: 0 0 14px;
}

.nx-quick-links-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nx-quick-links-card a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e293b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 0;
  transition: color 0.15s;
}

.nx-quick-links-card a:hover {
  color: #0f766e;
}

@media (max-width: 768px) {
  .nx-contact-grid {
    grid-template-columns: 1fr;
  }
  .nx-form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .nx-ticket-lookup > div {
    align-items: stretch;
    flex-direction: column;
  }
  .nx-ticket-card-summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .nx-ticket-card-summary time {
    text-align: left;
  }
  .nx-ticket-progress {
    grid-template-columns: minmax(0, 1fr);
    gap: 7px;
  }
  .nx-ticket-progress li {
    grid-template-columns: 25px minmax(0, 1fr);
    justify-items: start;
    align-items: center;
    text-align: left;
  }
  .nx-ticket-progress li strong {
    font-size: 11px;
  }
  .nx-success-banner {
    gap: 12px;
    padding: 16px;
  }
  .nx-success-icon {
    width: 24px;
    height: 24px;
  }
  .nx-ticket-reference {
    align-items: flex-start;
  }
  .nx-copy-ticket-btn {
    margin-left: 0;
  }
  .nx-ticket-meta {
    grid-template-columns: 1fr;
  }
}
`;
