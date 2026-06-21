import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./ClientDashboard.css";

export default function ClientDashboard({
  products = [],
  cart = [],
  setCart,
  searchQuery = "",
  setSearchQuery,
  currentView,
  setCurrentView,
  role = "customer",
  user, // Reading current single source of truth directly from App level props
  onLogout,
  localCategory = "All",
  setLocalCategory,
  isNavbarOnly = false,
  fetchOrders,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 }); // Track X/Y
  const [toast, setToast] = useState({ show: false, message: "" });
  const [localProducts, setLocalProducts] = useState(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Derived variable using incoming user object directly to prevent hardcoded overrides
  const profileName = user?.full_name || user?.first_name || "Operator";

  // ========================================================
  // STRICTOR-SAFE PRODUCTS REALTIME SUBSCRIPTION
  // ========================================================
  useEffect(() => {
    const channelId = `schema-db-changes-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          setLocalProducts((prevProducts) => {
            if (payload.eventType === "INSERT")
              return [...prevProducts, payload.new];
            if (payload.eventType === "UPDATE") {
              return prevProducts.map((p) =>
                p.id === payload.new.id ? payload.new : p,
              );
            }
            if (payload.eventType === "DELETE") {
              return prevProducts.filter((p) => p.id !== payload.old.id);
            }
            return prevProducts;
          });
        },
      );

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ========================================================
  // STRICTOR-SAFE ORDERS REALTIME SUBSCRIPTION
  // ========================================================
  useEffect(() => {
    const orderChannelId = `user-orders-channel-${Math.random().toString(36).substr(2, 9)}`;

    const orderChannel = supabase
      .channel(orderChannelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime order stream updated:", payload);
          if (typeof fetchOrders === "function") fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [fetchOrders]);

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const categories = [
    "All",
    "Antibiotics",
    "Cardiovascular",
    "Respiratory",
    "OTC Supplements",
    "Medicine",
  ];

  const formatProductName = (name) => {
    if (!name) return "";
    return name.includes("BeastLife Liposomal Vitamin C")
      ? "BeastLife Liposomal Vitamin C"
      : name;
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const addToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (product.stock <= 0) return showToast("❌ Out of stock!");

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(`🛒 Added ${formatProductName(product.name)} to cart!`);
  };

  // ========================================================
  // NAVBAR HEADER BLOCK
  // ========================================================
  if (isNavbarOnly) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          width: "100%",
        }}
      >
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
            boxSizing: "border-box",
            gap: "1rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              onClick={() => setCurrentView("products")}
              style={{
                fontSize: "1.25rem",
                fontWeight: "900",
                letterSpacing: "2px",
                color: "#4f46e5",
                cursor: "pointer",
              }}
            >
              MECORA
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: "700",
                color: "#4f46e5",
                background: "#e0e7ff",
                padding: "0.2rem 0.5rem",
                borderRadius: "6px",
                whiteSpace: "nowrap",
              }}
            >
              {role === "admin"
                ? "🛡️ ADMIN"
                : `👤 ${profileName.toUpperCase()}`}
            </span>
          </div>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setCurrentView("products")}
              style={{
                background: "none",
                border: "none",
                color: currentView === "products" ? "#4f46e5" : "#475569",
                fontWeight: currentView === "products" ? "700" : "500",
                fontSize: "0.85rem",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              Products
            </button>
            <button
              onClick={() => setCurrentView("orders")}
              style={{
                background: "none",
                border: "none",
                color: currentView === "orders" ? "#4f46e5" : "#475569",
                fontWeight: currentView === "orders" ? "700" : "500",
                fontSize: "0.85rem",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              Orders
            </button>
            {role !== "admin" && (
              <button
                onClick={() => setCurrentView("cart")}
                style={{
                  border: "none",
                  background: currentView === "cart" ? "#eff6ff" : "none",
                  color: currentView === "cart" ? "#1e40af" : "#475569",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🛒 Cart{" "}
                <span
                  style={{
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontSize: "0.65rem",
                    padding: "1px 5px",
                    borderRadius: "99px",
                  }}
                >
                  {cartCount}
                </span>
              </button>
            )}
            <button
              onClick={() => setCurrentView("profile")}
              style={{
                background: "none",
                border: "none",
                color: currentView === "profile" ? "#4f46e5" : "#475569",
                fontWeight: currentView === "profile" ? "700" : "500",
                fontSize: "0.85rem",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              Profile
            </button>
            <button
              onClick={onLogout}
              style={{
                backgroundColor: "#fef2f2",
                border: "none",
                color: "#991b1b",
                fontWeight: "600",
                fontSize: "0.8rem",
                padding: "0.35rem 0.7rem",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </nav>
        </header>

        {currentView === "products" && role !== "admin" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "0.75rem 1rem",
              gap: "0.75rem",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ width: "100%" }}>
              <input
                type="text"
                placeholder="🔍 Search items, salt, or label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.9rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  outline: "none",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.4rem",
                overflowX: "auto",
                paddingBottom: "4px",
                width: "100%",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLocalCategory(cat)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "99px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    flexShrink: 0,
                    backgroundColor:
                      localCategory === cat ? "#4f46e5" : "#f1f5f9",
                    border: "none",
                    color: localCategory === cat ? "#ffffff" : "#475569",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const lowercaseQuery = searchQuery.toLowerCase();
  const filteredProducts = localProducts.filter((product) => {
    const matchesCategory =
      localCategory === "All" || product.category === localCategory;
    return (
      matchesCategory &&
      (product.name?.toLowerCase().includes(lowercaseQuery) ||
        product.category?.toLowerCase().includes(lowercaseQuery) ||
        product.description?.toLowerCase().includes(lowercaseQuery) ||
        product.salt?.toLowerCase().includes(lowercaseQuery))
    );
  });

  return (
    <div className="dashboard-container">
      {toast.show && <div className="toast-popup">{toast.message}</div>}

      <div className="products-grid">
        {filteredProducts.map((product) => {
          const productImgSrc = product.image_url?.trim()
            ? product.image_url
            : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";

          return (
            <div
              className="product-card"
              onClick={(e) => {
                // Get the click position relative to the viewport
                setModalPosition({ top: e.clientY, left: e.clientX });
                setSelectedProduct(product);
              }}
              // ... rest of your styling
            >
              {product.discount && parseFloat(product.discount) > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    zIndex: 5,
                    background: "#ef4444",
                    color: "#ffffff",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "8px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                  }}
                >
                  {product.discount}% OFF
                </span>
              )}

              <div
                style={{
                  width: "100%",
                  height: "160px",
                  position: "relative",
                  overflow: "hidden",
                  background: "#f8fafc",
                }}
              >
                <img
                  src={productImgSrc}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "20px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    color: "#4f46e5",
                  }}
                >
                  {product.category || "General"}
                </span>
              </div>

              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <h4
                    style={{
                      margin: "0 0 0.2rem 0",
                      fontWeight: "700",
                      color: "#0f172a",
                    }}
                  >
                    {formatProductName(product.name)}
                  </h4>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#4f46e5",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Abram 🧪 {product.salt || "Standard Components"}
                  </div>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "0.8rem",
                      color: "#64748b",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: "2",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.description ||
                      "Premium formula verified under Mecora distribution guidelines."}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "#0f172a",
                    }}
                  >
                    ₹{product.price}
                  </span>
                  <button
                    onClick={(e) => addToCart(product, e)}
                    style={{
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.5rem 0.85rem",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL DRAWER */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              width: "90%",
              maxWidth: "500px",
              borderRadius: "24px",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              maxHeight: "80vh",
            }}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 10,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#64748b",
              }}
            >
              ✕
            </button>

            <div style={{ overflowY: "auto", padding: "1rem" }}>
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16px",
                  position: "relative",
                  marginBottom: "1rem",
                }}
              >
                <img
                  src={
                    selectedProduct.image_url ||
                    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={selectedProduct.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: "0.5rem",
                  }}
                />
              </div>

              <span
                style={{
                  background: "#e0e7ff",
                  color: "#4f46e5",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "6px",
                  display: "inline-block",
                  marginBottom: "0.5rem",
                }}
              >
                {selectedProduct.category || "OTC Supplements"}
              </span>

              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "800",
                  color: "#0f172a",
                  margin: "0 0 0.5rem 0",
                }}
              >
                {formatProductName(selectedProduct.name)}
              </h2>

              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  color: "#4f46e5",
                  marginBottom: "1rem",
                }}
              >
                Salt Component:{" "}
                <span style={{ color: "#0f172a", fontWeight: "500" }}>
                  {selectedProduct.salt || "Standard Tech Specs"}
                </span>
              </div>

              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  margin: "0 0 1.5rem 0",
                }}
              >
                {selectedProduct.description ||
                  "Premium formula verified under Mecora distribution guidelines."}
              </p>
            </div>

            <div
              style={{
                padding: "1rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    display: "block",
                  }}
                >
                  Price
                </span>
                <span
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "900",
                    color: "#0f172a",
                  }}
                >
                  ₹{selectedProduct.price}
                </span>
              </div>
              <button
                onClick={(e) => {
                  addToCart(selectedProduct, e);
                  setSelectedProduct(null);
                }}
                style={{
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Add To Basket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
