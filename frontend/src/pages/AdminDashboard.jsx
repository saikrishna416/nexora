import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  ClipboardList,
  FolderTree,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { invalidateProductsCache } from "../utils/productCatalogCache";
import "./AdminDashboard.css";

const TABS = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "orders", label: "Orders & Returns", Icon: ClipboardList },
  { id: "products", label: "Products", Icon: Package },
  { id: "categories", label: "Categories", Icon: FolderTree },
  { id: "tickets", label: "Support Tickets", Icon: Ticket },
  { id: "users", label: "Users", Icon: Users },
];

const ORDER_STATUSES = [
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["processing", "Processing"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];
const PAYMENT_STATUSES = [
  ["pending", "Pending"],
  ["paid", "Paid"],
  ["failed", "Failed"],
  ["refunded", "Refunded"],
];
const RETURN_STATUSES = [
  ["requested", "Requested"],
  ["approved", "Approved"],
  ["pickup_scheduled", "Pickup Scheduled"],
  ["picked_up", "Picked Up / QC"],
  ["rejected", "Rejected"],
  ["completed", "Completed"],
];
const TICKET_STATUSES = [
  ["new", "Open"],
  ["in_progress", "In Progress"],
  ["agent_assigned", "Agent Assigned"],
  ["resolved", "Resolved"],
];

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

async function fetchAllPages(path) {
  const items = [];
  let next = path;
  while (next) {
    const response = await api.get(next);
    items.push(...listFromResponse(response.data));
    next = typeof response.data?.next === "string" ? response.data.next : "";
  }
  return items;
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function getErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "object" && data) {
    const first = Object.values(data).flat().find(Boolean);
    if (typeof first === "string") return first;
  }
  return fallback;
}

function toMultipart(form) {
  const body = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (key === "imageFile") {
      if (value) body.append("image", value);
      return;
    }
    if (value !== undefined && value !== null) body.append(key, String(value));
  });
  return body;
}

function ProductEditorModal({ product, categories, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    category: String(product?.category ?? categories[0]?.id ?? ""),
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ?? "",
    original_price: product?.original_price ?? "",
    stock: product?.stock ?? 0,
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    image_url: product?.image_url || "",
    imageFile: null,
  }));
  const [preview, setPreview] = useState(
    product?.image || product?.image_url || ""
  );
  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const chooseImage = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, imageFile: file, image_url: "" }));
    if (!file) {
      setPreview(product?.image || product?.image_url || "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="admin-modal-backdrop">
      <section
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-form-title"
      >
        <header className="admin-modal-header">
          <div>
            <span className="admin-dashboard-eyebrow">CATALOGUE</span>
            <h2 id="admin-product-form-title">
              {product ? "Edit Product" : "Add Product"}
            </h2>
          </div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </header>
        <form
          className="admin-editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(toMultipart(form));
          }}
        >
          <div className="admin-image-editor">
            {preview ? (
              <img src={preview} alt="Product preview" />
            ) : (
              <span><ImagePlus size={28} aria-hidden="true" /></span>
            )}
            <label>
              Product image
              <input type="file" accept="image/*" onChange={chooseImage} />
            </label>
            <label>
              Or image URL
              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={(event) => {
                  change(event);
                  setPreview(event.target.value || product?.image || "");
                }}
                placeholder="https://..."
              />
            </label>
          </div>
          <div className="admin-form-grid">
            <label>
              Product name
              <input name="name" value={form.name} onChange={change} maxLength={200} required />
            </label>
            <label>
              Category
              <select name="category" value={form.category} onChange={change} required>
                <option value="" disabled>Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Selling price (₹)
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} required />
            </label>
            <label>
              Original price / MRP (₹)
              <input name="original_price" type="number" min="0" step="0.01" value={form.original_price} onChange={change} />
            </label>
            <label>
              Stock quantity
              <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={change} required />
            </label>
            <div className="admin-toggle-stack">
              <label className="admin-checkbox-label">
                <input name="is_active" type="checkbox" checked={form.is_active} onChange={change} />
                Active
              </label>
              <label className="admin-checkbox-label">
                <input name="is_featured" type="checkbox" checked={form.is_featured} onChange={change} />
                Featured
              </label>
            </div>
            <label className="admin-form-wide">
              Description
              <textarea name="description" rows={4} value={form.description} onChange={change} required />
            </label>
          </div>
          <footer className="admin-modal-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving || !categories.length}>
              {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function CategoryEditorModal({ category, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: category?.name || "",
    description: category?.description || "",
    icon: category?.icon || "",
    image_url: category?.image_url || "",
    imageFile: null,
  }));
  const [preview, setPreview] = useState(category?.image || category?.image_url || "");
  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };
  const chooseImage = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, imageFile: file, image_url: "" }));
    if (!file) {
      setPreview(category?.image || category?.image_url || "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="admin-modal-backdrop">
      <section className="admin-modal admin-modal--narrow" role="dialog" aria-modal="true" aria-labelledby="admin-category-form-title">
        <header className="admin-modal-header">
          <div>
            <span className="admin-dashboard-eyebrow">CATALOGUE</span>
            <h2 id="admin-category-form-title">{category ? "Edit Category" : "Add Category"}</h2>
          </div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <form
          className="admin-editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(toMultipart(form));
          }}
        >
          <div className="admin-image-editor admin-image-editor--category">
            {preview ? <img src={preview} alt="Category preview" /> : <span><ImagePlus size={26} /></span>}
            <label>
              Category image
              <input type="file" accept="image/*" onChange={chooseImage} />
            </label>
            <label>
              Or image URL
              <input type="url" name="image_url" value={form.image_url} onChange={(event) => { change(event); setPreview(event.target.value || category?.image || ""); }} />
            </label>
          </div>
          <label>
            Category name
            <input name="name" value={form.name} onChange={change} maxLength={100} required />
          </label>
          <label>
            Icon name
            <input name="icon" value={form.icon} onChange={change} maxLength={100} placeholder="Optional icon identifier" />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} value={form.description} onChange={change} />
          </label>
          <footer className="admin-modal-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>{saving ? "Saving…" : category ? "Save Changes" : "Create Category"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [productEdits, setProductEdits] = useState({});
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [productEditor, setProductEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (activeTab === "overview") {
          const response = await api.get("/core/admin/overview/");
          if (active) setOverview(response.data);
        } else if (activeTab === "orders") {
          const orderList = await fetchAllPages("/orders/admin/?page_size=100");
          if (active) setOrders(orderList);
        } else if (activeTab === "products") {
          const [productList, categoryList] = await Promise.all([
            fetchAllPages("/products/admin/?page_size=100"),
            fetchAllPages("/products/categories/?page_size=100"),
          ]);
          if (active) {
            setProducts(productList);
            setCategories(categoryList);
            setProductEdits(
              Object.fromEntries(
                productList.map((product) => [
                  product.id,
                  { price: String(product.price), stock: String(product.stock) },
                ])
              )
            );
          }
        } else if (activeTab === "categories") {
          const categoryList = await fetchAllPages("/products/categories/?page_size=100");
          if (active) setCategories(categoryList);
        } else if (activeTab === "tickets") {
          const ticketList = await fetchAllPages("/core/admin/tickets/?page_size=100");
          if (active) setTickets(ticketList);
        } else {
          const userList = await fetchAllPages("/accounts/admin/users/?page_size=100");
          if (active) setUsers(userList);
        }
        if (active) setError("");
      } catch (loadError) {
        console.error("Could not load admin dashboard data:", loadError.response?.data || loadError);
        if (active) setError(getErrorMessage(loadError, "Dashboard data could not be loaded."));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [activeTab, reloadCount]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const searchMatch = !query || [
        order.id,
        order.order_number,
        order.username,
        order.customer_name,
        order.email,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const statusMatch = orderStatusFilter === "all" || order.status === orderStatusFilter;
      const paymentMatch = orderPaymentFilter === "all" || order.payment_status === orderPaymentFilter;
      return searchMatch && statusMatch && paymentMatch;
    });
  }, [orders, orderSearch, orderStatusFilter, orderPaymentFilter]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) =>
      !query || `${product.name} ${product.category_name || ""}`.toLowerCase().includes(query)
    );
  }, [products, productSearch]);
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return categories.filter((category) =>
      !query || `${category.name} ${category.slug || ""}`.toLowerCase().includes(query)
    );
  }, [categories, categorySearch]);
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((account) =>
      !query || `${account.username} ${account.email} ${account.first_name || ""} ${account.last_name || ""}`.toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };
  const setFailure = (requestError, fallback) => {
    console.error(fallback, requestError.response?.data || requestError);
    setError(getErrorMessage(requestError, fallback));
  };
  const changeTab = (tab) => {
    setLoading(true);
    clearAlerts();
    setActiveTab(tab);
  };
  const retryLoad = () => {
    setLoading(true);
    clearAlerts();
    setReloadCount((current) => current + 1);
  };

  const updateOrderField = async (order, field, value) => {
    setSavingKey(`${field}-${order.id}`);
    clearAlerts();
    try {
      const response = await api.patch(`/orders/admin/${order.id}/status/`, { [field]: value });
      setOrders((current) => current.map((item) =>
        item.id === order.id ? { ...item, ...response.data } : item
      ));
      setSuccess(`Order ${order.order_number || order.id} updated.`);
    } catch (requestError) {
      setFailure(requestError, "Order could not be updated.");
    } finally {
      setSavingKey("");
    }
  };

  const updateReturnStatus = async (order, value) => {
    setSavingKey(`return-${order.id}`);
    clearAlerts();
    try {
      const response = await api.patch(`/orders/admin/${order.id}/return-request/`, { status: value });
      setOrders((current) => current.map((item) => item.id === order.id
        ? {
            ...item,
            return_request: response.data,
            payment_status: response.data.payment_status || item.payment_status,
          }
        : item
      ));
      setSuccess(`Return / exchange request ${response.data.requestId} updated.`);
    } catch (requestError) {
      setFailure(requestError, "Return or exchange status could not be updated.");
    } finally {
      setSavingKey("");
    }
  };

  const updateProductEdit = (productId, field, value) => {
    setProductEdits((current) => ({
      ...current,
      [productId]: { ...current[productId], [field]: value },
    }));
  };
  const saveQuickProduct = async (product) => {
    const edit = productEdits[product.id] || {};
    const price = Number(edit.price);
    const stock = Number(edit.stock);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      setError("Enter a non-negative selling price and whole-number stock quantity.");
      return;
    }
    setSavingKey(`product-${product.id}`);
    clearAlerts();
    try {
      const response = await api.patch(`/products/admin/${product.id}/`, {
        price: price.toFixed(2),
        stock,
      });
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, ...response.data } : item));
      setProductEdits((current) => ({
        ...current,
        [product.id]: { price: String(response.data.price), stock: String(response.data.stock) },
      }));
      invalidateProductsCache();
      setSuccess(`${product.name} stock and price updated.`);
    } catch (requestError) {
      setFailure(requestError, "Product could not be updated.");
    } finally {
      setSavingKey("");
    }
  };

  const saveProduct = async (body) => {
    const editingProduct = productEditor?.product;
    setSavingKey("product-form");
    clearAlerts();
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = editingProduct
        ? await api.patch(`/products/admin/${editingProduct.id}/`, body, config)
        : await api.post("/products/admin/", body, config);
      const saved = response.data;
      setProducts((current) => editingProduct
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]
      );
      setProductEdits((current) => ({
        ...current,
        [saved.id]: { price: String(saved.price), stock: String(saved.stock) },
      }));
      invalidateProductsCache();
      setProductEditor(null);
      setSuccess(`${saved.name} ${editingProduct ? "updated" : "created"}.`);
    } catch (requestError) {
      setFailure(requestError, "Product could not be saved.");
    } finally {
      setSavingKey("");
    }
  };
  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setSavingKey(`delete-product-${product.id}`);
    clearAlerts();
    try {
      await api.delete(`/products/admin/${product.id}/`);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      invalidateProductsCache();
      setSuccess(`${product.name} deleted.`);
    } catch (requestError) {
      setFailure(requestError, "Product could not be deleted.");
    } finally {
      setSavingKey("");
    }
  };

  const saveCategory = async (body) => {
    const editingCategory = categoryEditor?.category;
    setSavingKey("category-form");
    clearAlerts();
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response = editingCategory
        ? await api.patch(`/products/categories/${editingCategory.id}/`, body, config)
        : await api.post("/products/categories/", body, config);
      const saved = response.data;
      setCategories((current) => editingCategory
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((a, b) => a.name.localeCompare(b.name))
      );
      invalidateProductsCache();
      setCategoryEditor(null);
      setSuccess(`${saved.name} ${editingCategory ? "updated" : "created"}.`);
    } catch (requestError) {
      setFailure(requestError, "Category could not be saved.");
    } finally {
      setSavingKey("");
    }
  };
  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setSavingKey(`delete-category-${category.id}`);
    clearAlerts();
    try {
      await api.delete(`/products/categories/${category.id}/`);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      invalidateProductsCache();
      setSuccess(`${category.name} deleted.`);
    } catch (requestError) {
      setFailure(requestError, "Category could not be deleted.");
    } finally {
      setSavingKey("");
    }
  };

  const saveTicket = async (ticket) => {
    setSavingKey(`ticket-${ticket.id}`);
    clearAlerts();
    try {
      const response = await api.patch(`/core/admin/tickets/${ticket.id}/`, {
        status: ticket.status,
        admin_reply: ticket.admin_reply || "",
      });
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, ...response.data } : item));
      setSuccess(`Reply and status saved for ${ticket.ticketId}.`);
    } catch (requestError) {
      setFailure(requestError, "Ticket reply could not be saved.");
    } finally {
      setSavingKey("");
    }
  };
  const updateTicket = (ticketId, field, value) => {
    setTickets((current) => current.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, [field]: value } : ticket
    ));
  };
  const updateUser = async (account, field, value) => {
    setSavingKey(`user-${account.id}-${field}`);
    clearAlerts();
    try {
      const response = await api.patch(`/accounts/admin/users/${account.id}/`, { [field]: value });
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, ...response.data } : item));
      setSuccess(`${account.username}'s ${field === "is_staff" ? "staff access" : "account status"} updated.`);
    } catch (requestError) {
      setFailure(requestError, "Account could not be updated.");
    } finally {
      setSavingKey("");
    }
  };

  const activeTabConfig = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-eyebrow"><ShieldCheck size={15} aria-hidden="true" /> NEXORA ADMIN</span>
          <h1>Store Operations</h1>
          <p>Manage catalogue, customer orders, enquiries, and existing accounts.</p>
        </div>
        <div className="admin-header-actions">
          {activeTab === "products" && (
            <button type="button" className="admin-primary-button" onClick={() => setProductEditor({ product: null })}>
              <Plus size={16} /> Add Product
            </button>
          )}
          <button type="button" className="admin-refresh-button" onClick={retryLoad} aria-label="Refresh dashboard data">
            <RefreshCw size={17} aria-hidden="true" /> Refresh
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin dashboard sections">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className={activeTab === id ? "is-active" : ""} aria-current={activeTab === id ? "page" : undefined} onClick={() => changeTab(id)}>
            <Icon size={17} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>

      {error && <div className="admin-alert admin-alert--error" role="alert"><span>{error}</span><button type="button" onClick={retryLoad}>Try again</button></div>}
      {success && <div className="admin-alert admin-alert--success" role="status"><Check size={17} aria-hidden="true" /> {success}</div>}

      <section className="admin-dashboard-content" aria-labelledby="admin-content-title">
        <div className="admin-content-heading">
          <div>
            <h2 id="admin-content-title">{activeTabConfig.label}</h2>
            <p>Store data is available only to authorized administrators.</p>
          </div>
        </div>
        {loading ? (
          <div className="admin-loading" role="status">Loading {activeTabConfig.label.toLowerCase()}…</div>
        ) : activeTab === "overview" ? (
          <div className="admin-stat-grid">
            {[
              ["Total Orders", overview?.total_orders ?? 0, ClipboardList],
              ["Paid Revenue", formatINR(overview?.revenue), BarChart3],
              ["Products", overview?.product_count ?? 0, Package],
              ["Pending Returns / Exchanges", overview?.pending_returns_exchanges ?? 0, RefreshCw],
              ["Open Support Tickets", overview?.open_support_tickets ?? 0, Ticket],
              ["Registered Users", overview?.user_count ?? 0, Users],
            ].map(([label, value, Icon]) => (
              <article className="admin-stat-card" key={label}>
                <span><Icon size={19} aria-hidden="true" /></span><small>{label}</small><strong>{value}</strong>
              </article>
            ))}
          </div>
        ) : activeTab === "orders" ? (
          <>
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={16} aria-hidden="true" /><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search order, customer, email…" /></label>
              <select aria-label="Filter by order status" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                <option value="all">All order statuses</option>
                {ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select aria-label="Filter by payment status" value={orderPaymentFilter} onChange={(event) => setOrderPaymentFilter(event.target.value)}>
                <option value="all">All payment statuses</option>
                {PAYMENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="admin-record-list">
              {filteredOrders.length ? filteredOrders.map((order) => (
                <details className="admin-record-card admin-order-card" key={order.id}>
                  <summary className="admin-order-summary">
                    <div className="admin-record-copy">
                      <strong>{order.order_number || `Order #${order.id}`}</strong>
                      <span>{order.customer_name || order.username} · {order.email} · {formatDate(order.created_at)}</span>
                    </div>
                    <strong>{formatINR(order.total_amount)}</strong>
                  </summary>
                  <div className="admin-order-controls">
                    <label>Order status
                      <select value={order.status} disabled={savingKey === `status-${order.id}`} onChange={(event) => updateOrderField(order, "status", event.target.value)}>
                        {ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>Payment status
                      <select value={order.payment_status} disabled={savingKey === `payment_status-${order.id}`} onChange={(event) => updateOrderField(order, "payment_status", event.target.value)}>
                        {PAYMENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="admin-order-details-grid">
                    <div className="admin-detail-box">
                      <h3>Customer &amp; Shipping</h3>
                      <p><strong>{order.customer_name || order.username}</strong><br />{order.email}</p>
                      <p>{order.shipping_address || "No shipping address recorded."}</p>
                    </div>
                    <div className="admin-detail-box">
                      <h3>Payment</h3>
                      <p>Method: {order.payment_method || "Not recorded"}</p>
                      <p>Status: {order.payment_status || "pending"}</p>
                      <p>Payment ID: {order.razorpay_payment_id || order.payment_transaction_id || "Not available"}</p>
                    </div>
                    <div className="admin-detail-box admin-order-items">
                      <h3>Items Ordered</h3>
                      {order.items?.length ? order.items.map((item) => (
                        <div className="admin-order-item" key={item.id}>
                          {item.product_image && <img src={item.product_image} alt="" />}
                          <span>{item.product_name} · Qty {item.quantity} · {formatINR(item.price)} each</span>
                          <strong>{formatINR(item.subtotal)}</strong>
                        </div>
                      )) : <p>No items recorded.</p>}
                    </div>
                    {order.return_request && (
                      <div className="admin-detail-box admin-return-editor">
                        <div>
                          <h3>{order.return_request.requestId} · {order.return_request.actionType}</h3>
                          <p>{order.return_request.reason} · Requested {formatDate(order.return_request.requestedAt)}</p>
                          <p>{order.return_request.note || "No additional customer note."}</p>
                        </div>
                        <label>Return / Exchange status
                          <select value={order.return_request.status || "requested"} disabled={savingKey === `return-${order.id}`} onChange={(event) => updateReturnStatus(order, event.target.value)}>
                            {RETURN_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                </details>
              )) : <p className="admin-empty">No orders match these filters.</p>}
            </div>
          </>
        ) : activeTab === "products" ? (
          <>
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={16} aria-hidden="true" /><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products or categories…" /></label>
            </div>
            <div className="admin-record-list">
              {filteredProducts.length ? filteredProducts.map((product) => (
                <article className="admin-record-card admin-product-row" key={product.id}>
                  <div className="admin-product-copy">
                    {product.image && <img src={product.image} alt="" />}
                    <div><strong>{product.name}</strong><span>{product.category_name || "Uncategorized"} · {product.slug || `ID ${product.id}`}</span><small>{product.is_active ? "Active" : "Inactive"}{product.is_featured ? " · Featured" : ""}</small></div>
                  </div>
                  <label>Selling price (₹)<input type="number" min="0" step="0.01" value={productEdits[product.id]?.price ?? ""} onChange={(event) => updateProductEdit(product.id, "price", event.target.value)} /></label>
                  <label>Stock<input type="number" min="0" step="1" value={productEdits[product.id]?.stock ?? ""} onChange={(event) => updateProductEdit(product.id, "stock", event.target.value)} /></label>
                  <div className="admin-row-actions">
                    <button type="button" className="admin-save-button" disabled={savingKey === `product-${product.id}`} onClick={() => saveQuickProduct(product)}>{savingKey === `product-${product.id}` ? "Saving…" : "Save stock / price"}</button>
                    <button type="button" className="admin-icon-button" onClick={() => setProductEditor({ product })} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button>
                    <button type="button" className="admin-icon-button admin-icon-button--danger" disabled={savingKey === `delete-product-${product.id}`} onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button>
                  </div>
                </article>
              )) : <p className="admin-empty">No products match this search.</p>}
            </div>
          </>
        ) : activeTab === "categories" ? (
          <>
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={16} aria-hidden="true" /><input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Search categories…" /></label>
              <button type="button" className="admin-primary-button" onClick={() => setCategoryEditor({ category: null })}>
                <Plus size={16} /> Add Category
              </button>
            </div>
            <div className="admin-record-list">
              {filteredCategories.length ? filteredCategories.map((category) => (
                <article className="admin-record-card admin-category-row" key={category.id}>
                  {category.image && <img src={category.image} alt="" />}
                  <div className="admin-product-copy"><strong>{category.icon ? `${category.icon} · ` : ""}{category.name}</strong><span>{category.slug || "Slug generated on save"}</span><small>{category.description || "No description"}</small></div>
                  <div className="admin-row-actions">
                    <button type="button" className="admin-icon-button" onClick={() => setCategoryEditor({ category })} aria-label={`Edit ${category.name}`}><Pencil size={16} /></button>
                    <button type="button" className="admin-icon-button admin-icon-button--danger" disabled={savingKey === `delete-category-${category.id}`} onClick={() => deleteCategory(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button>
                  </div>
                </article>
              )) : <p className="admin-empty">No categories match this search.</p>}
            </div>
          </>
        ) : activeTab === "tickets" ? (
          <div className="admin-record-list">
            {tickets.length ? tickets.map((ticket) => (
              <article className="admin-record-card admin-ticket-card" key={ticket.id}>
                <div className="admin-record-main">
                  <div className="admin-record-copy">
                    <strong>{ticket.ticketId} · {ticket.subject}</strong>
                    <span>{ticket.name} · {ticket.email} · {ticket.category} · {formatDate(ticket.createdAt)}</span>
                  </div>
                  <label>Ticket status
                    <select value={ticket.status} disabled={savingKey === `ticket-${ticket.id}`} onChange={(event) => updateTicket(ticket.id, "status", event.target.value)}>
                      {TICKET_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
                <details className="admin-ticket-message">
                  <summary>View customer message</summary>
                  <p>{ticket.message}</p>
                </details>
                <label className="admin-reply-field">Reply to customer
                  <textarea rows={4} maxLength={5000} value={ticket.admin_reply || ""} onChange={(event) => updateTicket(ticket.id, "admin_reply", event.target.value)} placeholder="Write the response visible in the customer's ticket tracker…" />
                </label>
                <div className="admin-ticket-footer">
                  <small>{ticket.admin_reply ? "A reply is visible to the customer." : "No reply has been sent yet."}</small>
                  <button type="button" className="admin-primary-button" disabled={savingKey === `ticket-${ticket.id}`} onClick={() => saveTicket(ticket)}>
                    <Check size={15} /> {savingKey === `ticket-${ticket.id}` ? "Saving…" : "Save Reply"}
                  </button>
                </div>
              </article>
            )) : <p className="admin-empty">No support tickets found.</p>}
          </div>
        ) : (
          <>
            <div className="admin-toolbar">
              <label className="admin-search"><Search size={16} aria-hidden="true" /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search username or email…" /></label>
            </div>
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead><tr><th>Account</th><th>Joined</th><th>Orders</th><th>Role</th><th>Active</th><th>Staff access</th></tr></thead>
                <tbody>
                  {filteredUsers.map((account) => {
                    const isSelf = account.id === currentUser?.id;
                    return (
                      <tr key={account.id}>
                        <td><strong>{account.username}</strong><span>{account.email}</span></td>
                        <td>{formatDate(account.date_joined)}</td>
                        <td>{account.orders_count ?? 0}</td>
                        <td><span className={`admin-role-badge${account.is_superuser ? " is-superuser" : account.is_staff ? " is-staff" : ""}`}>{account.is_superuser ? "Superuser" : account.is_staff ? "Staff" : "Customer"}</span></td>
                        <td><label className="admin-switch"><input type="checkbox" checked={account.is_active} disabled={isSelf || savingKey === `user-${account.id}-is_active`} onChange={(event) => updateUser(account, "is_active", event.target.checked)} /><span>{account.is_active ? "Active" : "Inactive"}</span></label></td>
                        <td><label className="admin-switch"><input type="checkbox" checked={account.is_staff} disabled={isSelf || savingKey === `user-${account.id}-is_staff`} onChange={(event) => updateUser(account, "is_staff", event.target.checked)} /><span>{account.is_staff ? "Staff" : "Customer"}</span></label></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredUsers.length && <p className="admin-empty">No accounts match this search.</p>}
            </div>
          </>
        )}
      </section>
      {productEditor && <ProductEditorModal product={productEditor.product} categories={categories} saving={savingKey === "product-form"} onClose={() => setProductEditor(null)} onSave={saveProduct} />}
      {categoryEditor && <CategoryEditorModal category={categoryEditor.category} saving={savingKey === "category-form"} onClose={() => setCategoryEditor(null)} onSave={saveCategory} />}
    </main>
  );
}

export default AdminDashboard;
