
import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";
import Wishlist from "./pages/Wishlist";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";

import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ReturnRefundPolicy from "./pages/ReturnRefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PaymentPolicy from "./pages/PaymentPolicy";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import AdminDashboard from "./pages/AdminDashboard";

function AdminRoute({ children }) {
  const { isAuthenticated, user, userLoading } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userLoading) {
    return (
      <main className="admin-route-loading" role="status">
        Checking administrator access…
      </main>
    );
  }
  if (!user?.is_staff && !user?.is_superuser) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);

  useEffect(() => {
    const handleInternalNavigationClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target;
      const link = target.closest("a[href]");
      const internalLink =
        link &&
        link.origin === window.location.origin &&
        (!link.target || link.target === "_self") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;
      const productCardAction = target.closest(
        ".nex-product-card button, .nexora-suggestion, .nexora-view-all"
      );

      if (internalLink || productCardAction) {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    };

    document.addEventListener("click", handleInternalNavigationClick, true);
    return () =>
      document.removeEventListener("click", handleInternalNavigationClick, true);
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Customer Trust, Support & Policy Routes */}
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/return-refund-policy" element={<ReturnRefundPolicy />} />
          <Route path="/returns-and-refunds" element={<ReturnRefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/payment-policy" element={<PaymentPolicy />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>

        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
