import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import AdminDashboard from "./components/AdminDashboard";
import ClientDashboard from "./components/ClientDashboard";
import CartView from "./components/CartView";
import OrdersView from "./components/OrdersView";
import ProfileSection from "./components/ProfileSection";
import "./App.css";

const slidingImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=80",
];

// ─────────────────────────────────────────────
// Toast system
// ─────────────────────────────────────────────
const TOAST_ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#22c55e" />
      <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#ef4444" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#4f46e5" />
      <path d="M10 9v5M10 7v.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#f59e0b" />
      <path d="M10 6v5M10 13v.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const toastContainerStyle = {
  position: "fixed",
  top: "1.25rem",
  right: "1.25rem",
  zIndex: 99999,
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  pointerEvents: "none",
  maxWidth: "min(380px, calc(100vw - 2.5rem))",
};

function Toast({ id, type = "info", message, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount → slide-in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // auto-dismiss after 3.5 s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 350);
    }, 3500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [id, onDismiss]);

  const accent = {
    success: "#22c55e",
    error:   "#ef4444",
    info:    "#4f46e5",
    warning: "#f59e0b",
  }[type];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "14px",
        padding: "0.85rem 1rem",
        boxShadow: "0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        pointerEvents: "all",
        cursor: "pointer",
        transform: visible ? "translateX(0)" : "translateX(calc(100% + 2rem))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
        boxSizing: "border-box",
        width: "100%",
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onDismiss(id), 350);
      }}
    >
      <div style={{ flexShrink: 0, marginTop: "1px" }}>{TOAST_ICONS[type]}</div>
      <p
        style={{
          margin: 0,
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#0f172a",
          lineHeight: 1.5,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {message}
      </p>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={toastContainerStyle}>
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook – call useToast() inside App, then pass `notify` down or use a ref/context
function useToast() {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, notify, dismiss };
}

// ─────────────────────────────────────────────
// Responsive auth styles
// ─────────────────────────────────────────────
const authResponsiveStyles = `
  .auth-page {
    display: flex;
    min-height: 100vh;
    background-color: #f1f5f9;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
    font-family: system-ui, -apple-system, sans-serif;
    box-sizing: border-box;
  }

  .auth-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transition: background-image 1.2s ease-in-out;
    z-index: 1;
  }

  .auth-card {
    display: flex;
    width: 100%;
    max-width: 1000px;
    background-color: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    overflow: hidden;
    z-index: 2;
  }

  .auth-left {
    flex: 1.1;
    padding: 4.5rem 3.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
  }

  .auth-brand {
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: 3px;
    color: #4f46e5;
  }

  .auth-headline {
    font-size: 2.85rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
    margin: 0;
  }

  .auth-headline span { color: #4f46e5; }

  .auth-dots { display: flex; gap: 0.6rem; }

  .auth-dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background-color: #cbd5e1;
    transition: all 0.5s ease;
  }

  .auth-dot.active {
    width: 28px;
    background-color: #4f46e5;
  }

  .auth-right {
    flex: 1;
    padding: 3.5rem;
    background-color: #ffffff;
    box-sizing: border-box;
    min-width: 0;
  }

  .auth-right h2 {
    font-size: 2.1rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
  }

  .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }

  .auth-form input {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.85rem 1.1rem;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .auth-address-row { display: flex; gap: 6px; }
  .auth-address-row input { flex: 1; min-width: 0; }

  .auth-gps-btn {
    padding: 0 1rem;
    background: #e0e7ff;
    border: none;
    border-radius: 12px;
    color: #4f46e5;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .auth-submit {
    padding: 0.95rem;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  .auth-toggle { margin-top: 1rem; font-size: 0.9rem; text-align: center; }
  .auth-toggle span { color: #4f46e5; cursor: pointer; }

  @media (max-width: 860px) {
    .auth-page { padding: 1.25rem; }
    .auth-left { padding: 3rem 2.25rem; }
    .auth-right { padding: 2.5rem; }
    .auth-headline { font-size: 2.25rem; }
  }

  @media (max-width: 640px) {
    .auth-page { padding: 0; align-items: flex-start; }
    .auth-card { flex-direction: column; max-width: 100%; border-radius: 0; min-height: 100vh; }
    .auth-left { border-right: none; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 2.25rem 1.5rem; gap: 2rem; }
    .auth-headline { font-size: 1.85rem; }
    .auth-right { padding: 2rem 1.5rem 2.5rem 1.5rem; }
    .auth-right h2 { font-size: 1.6rem; }
    .auth-address-row { flex-wrap: wrap; }
    .auth-gps-btn { width: 100%; padding: 0.85rem 1rem; }
  }

  @media (max-width: 380px) {
    .auth-left { padding: 1.75rem 1.25rem; }
    .auth-right { padding: 1.75rem 1.25rem 2.25rem 1.25rem; }
    .auth-brand { font-size: 1.25rem; }
    .auth-headline { font-size: 1.55rem; }
  }
`;

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const { toasts, notify, dismiss } = useToast();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const [currentView, setCurrentView] = useState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [localCategory, setLocalCategory] = useState("All");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (!user) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slidingImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [user]);

  useEffect(() => {
    setFullName(`${firstName.trim()} ${lastName.trim()}`.trim());
  }, [firstName, lastName]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        getProfileData(session.user);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getProfileData(session.user);
      } else {
        setUser(null);
        setRole("customer");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function getProfileData(authUser) {
    try {
      if (!authUser) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      const meta = authUser.user_metadata || {};

      if (data) {
        setUser({
          ...authUser,
          ...data,
          first_name:
            data.first_name ||
            meta.first_name ||
            data.full_name?.split(" ")[0] ||
            "Operator",
          full_name: data.full_name || meta.full_name || authUser.email,
        });
        setRole(data.role || "customer");
      } else {
        setUser({
          ...authUser,
          first_name:
            meta.first_name || meta.full_name?.split(" ")[0] || "Operator",
          full_name: meta.full_name || authUser.email,
        });
        setRole("customer");
      }
    } catch (err) {
      console.error("Error fetching profile metadata:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchOrders();
    }
  }, [user, role]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) setProducts(data);
  }

  async function fetchOrders() {
    if (!user) return;
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (role === "customer") {
      query = query.eq("customer_email", user.email);
    }
    const { data, error } = await query;
    if (!error && data) setOrders(data);
  }

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      notify("Geolocation is not supported by this browser.", "warning");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`Lat: ${latitude}, Lon: ${longitude}`);
          }
          notify("Location detected successfully.", "success");
        } catch (err) {
          setAddress(`Lat: ${latitude}, Lon: ${longitude}`);
          notify("Could not resolve address — coordinates saved.", "warning");
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        notify(`Location error: ${error.message}`, "error");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const { data: authData, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                phone: mobile.trim(),
                address: address.trim(),
              },
            },
          });
        if (signUpError) throw signUpError;

        setFirstName("");
        setLastName("");
        setMobile("");
        setAddress("");
        setEmail("");
        setPassword("");
        setIsRegistering(false);
        notify("Account created! Please sign in.", "success");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginIdentifier.trim(),
          password: password,
        });
        if (error) throw error;
        notify("Signed in successfully.", "success");
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    setSearchQuery("");
    setCurrentView("products");
  };

  async function handleCheckout(orderData) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      notify("Your session has expired. Please log in again.", "error");
      setUser(null);
      return;
    }

    try {
      const { error } = await supabase.from("orders").insert([
        {
          customer_email: session.user.email,
          total_price: parseFloat(orderData.totalPrice),
          items: orderData.items,
          payment_method: orderData.paymentMethod,
          delivery_date: orderData.deliveryDate,
          shipping_address: orderData.address,
          status: "Processing",
        },
      ]);

      if (error) throw error;

      notify("Order placed successfully!", "success");
      setCart([]);
      fetchOrders();
      setCurrentView("orders");
    } catch (err) {
      console.error("Checkout failed:", err);
      notify("Checkout failed: " + err.message, "error");
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1.5rem",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              border: "2px dashed #cbd5e1",
              borderTop: "2px solid #4f46e5",
              borderBottom: "2px solid #4f46e5",
              borderRadius: "50%",
              animation:
                "propellerSpin 0.8s cubic-bezier(0.4, 0.1, 0.3, 1) infinite",
              marginBottom: "1.25rem",
            }}
          />
        </div>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 0.25rem 0",
            letterSpacing: "0.5px",
          }}
        >
          MECORA
        </h3>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.8rem",
            fontWeight: "500",
            letterSpacing: "1px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Connecting Core Nodes...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <style>{authResponsiveStyles}</style>

        {/* Toast layer is available even on the auth screen */}
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        <div
          className="auth-bg"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(241,245,249,0.85) 100%), url("${slidingImages[currentImageIndex]}")`,
          }}
        />

        <div className="auth-card">
          <div className="auth-left">
            <div>
              <span className="auth-brand">MECORA</span>
            </div>
            <div>
              <h1 className="auth-headline">
                Capturing Moments,
                <br />
                <span>Creating Systems.</span>
              </h1>
            </div>
            <div className="auth-dots">
              {slidingImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`auth-dot ${idx === currentImageIndex ? "active" : ""}`}
                />
              ))}
            </div>
          </div>

          <div className="auth-right">
            <h2>{isRegistering ? "Create an account" : "Welcome back"}</h2>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              {!isRegistering ? (
                <input
                  type="text"
                  placeholder="Email or Mobile"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                  <div className="auth-address-row">
                    <input
                      type="text"
                      placeholder="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={fetchLiveLocation}
                      className="auth-gps-btn"
                    >
                      {locLoading ? "🛰️..." : "📍 GPS"}
                    </button>
                  </div>
                </>
              )}
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="auth-submit">
                {isRegistering ? "Register" : "Sign In"}
              </button>
            </form>
            <p className="auth-toggle">
              <span onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering
                  ? "Already have an account? Sign In"
                  : "New operator? Register here"}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout" style={{ paddingBottom: "70px" }}>
      {/* Global toast layer */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{ position: "sticky", top: 0, zIndex: 100, width: "100%" }}>
        <ClientDashboard
          products={products}
          cart={cart}
          setCart={setCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentView={currentView}
          setCurrentView={setCurrentView}
          role={role}
          user={user}
          onLogout={handleLogout}
          localCategory={localCategory}
          setLocalCategory={setLocalCategory}
          isNavbarOnly={true}
          fetchOrders={fetchOrders}
        />
      </div>

      <main className="main-content">
        <div style={{ width: "100%", margin: "0", boxSizing: "border-box" }}>
          {currentView === "products" &&
            (role === "admin" ? (
              <AdminDashboard
                products={products}
                orders={orders}
                fetchProducts={fetchProducts}
              />
            ) : (
              <ClientDashboard
                products={products}
                cart={cart}
                setCart={setCart}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentView={currentView}
                setCurrentView={setCurrentView}
                role={role}
                user={user}
                onLogout={handleLogout}
                localCategory={localCategory}
                setLocalCategory={setLocalCategory}
                isNavbarOnly={false}
                fetchOrders={fetchOrders}
              />
            ))}

          {currentView === "categories" && (
            <ClientDashboard
              products={products}
              cart={cart}
              setCart={setCart}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentView={currentView}
              setCurrentView={setCurrentView}
              role={role}
              user={user}
              onLogout={handleLogout}
              localCategory={localCategory}
              setLocalCategory={setLocalCategory}
              isNavbarOnly={false}
              fetchOrders={fetchOrders}
            />
          )}

          {currentView === "cart" && (
            <CartView
              cart={cart}
              setCart={setCart}
              products={products}
              onCheckoutSuccess={handleCheckout}
            />
          )}
          {currentView === "orders" && (
            <OrdersView role={role} orders={orders} fetchOrders={fetchOrders} />
          )}
          {currentView === "profile" && (
            <ProfileSection user={user} role={role} />
          )}
        </div>
      </main>
    </div>
  );
}