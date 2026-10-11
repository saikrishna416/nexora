import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const getImageUrl = (image) => {
  if (!image) return "";

  // Keep full URLs unchanged
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Handle relative Django media URLs
  const baseURL = api.defaults.baseURL || "http://127.0.0.1:8000";

  return `${baseURL.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
};

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const removeFromWishlist = async (itemId) => {
    try {
      await api.delete(`/wishlist/${itemId}/remove/`);

      const response = await api.get("/wishlist/");
      setWishlist(response.data.results || response.data);
    } catch (error) {
      console.error(
        "Remove wishlist error:",
        error.response?.data || error
      );

      setError("Failed to remove item from wishlist.");
    }
  };

  useEffect(() => {
    api
      .get("/wishlist/")
      .then((response) => {
        setWishlist(response.data.results || response.data);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to load wishlist.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        Loading wishlist...
      </h2>
    );
  }

  if (error) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        {error}
      </h2>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
        }}
      >
        <h1>Your Wishlist is Empty</h1>

        <p
          style={{
            color: "#6b7280",
            margin: "15px 0 25px",
          }}
        >
          Save products you love and find them here later.
        </p>

        <Link
          to="/products"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#111827",
            color: "white",
            textDecoration: "none",
            borderRadius: "7px",
            fontWeight: "600",
          }}
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "45px 24px",
      }}
    >
      <h1
        style={{
          fontSize: "34px",
          marginBottom: "30px",
        }}
      >
        My Wishlist
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "25px",
        }}
      >
        {wishlist.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "white",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Product Image */}
            
{/* Product Image */}
<div
  style={{
    height: "220px",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }}
>
  {item.product_image ? (
    <img
      src={getImageUrl(item.product_image)}
      alt={item.product_name || "Wishlist product"}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        padding: "10px",
        boxSizing: "border-box",
      }}
    />
  ) : (
    <span style={{ color: "#6b7280" }}>No Image</span>
  )}
</div>


            {/* Product Information */}
            <div style={{ padding: "20px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  margin: "0 0 12px",
                }}
              >
                {item.product_name}
              </h2>

              <p
                style={{
                  fontSize: "21px",
                  fontWeight: "bold",
                  margin: "0 0 20px",
                }}
              >
                ₹{item.product_price}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <Link
                  to={`/products/${item.product}`}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "10px",
                    backgroundColor: "#111827",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  View Details
                </Link>

                <button
                  onClick={() => removeFromWishlist(item.id)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #dc2626",
                    borderRadius: "6px",
                    backgroundColor: "white",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;