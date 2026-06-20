import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = "https://itcgezjgxgfxpslopjcl.supabase.co";
const supabaseAnonKey = "sb_publishable_JnxUP5KHpBXkfRUCYcPnYg__8egRXsD";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Toggle between editing an existing product or adding a completely brand new one
  const [isEditMode, setIsEditMode] = useState(false);

  // Operational processing states
  const [invLoading, setInvLoading] = useState(false);
  const [invMessage, setInvMessage] = useState({ type: "", text: "" });
  const [orderMessage, setOrderMessage] = useState({ type: "", text: "" });

  // Track form values with salt schema and discount fields
  const [editForm, setEditForm] = useState({
    barcode: "", 
    name: "",
    price: "",
    discount: "0",
    stock: "",
    category: "",
    image_url: "",
    salt: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Top header quick global look-up bar tracking state
  const [barcodeInput, setBarcodeInput] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchInventory();
    fetchOrders();
    fetchUserProfile();

    // Realtime Database subscription for orders (fixed layout chaining order)
    const ordersChannel = supabase
      .channel("admin-orders-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime order mutation detected:", payload);
          fetchOrders(); // Smart automated dashboard synchronization
        }
      )
      .subscribe(); // Always appended at the absolute end

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // Inline Barcode Autofill Scanner Listener
  useEffect(() => {
    if (!editForm.barcode.trim() || isEditMode) return;

    const matchedProduct = products.find(
      (p) =>
        p.barcode === editForm.barcode.trim() ||
        String(p.id) === editForm.barcode.trim(),
    );

    if (matchedProduct) {
      handleSelectProduct(matchedProduct);
      setInvMessage({
        type: "success",
        text: `🎯 Existing SKU Recognized! Automatically autofilled details for: "${matchedProduct.name}"`,
      });
    }
  }, [editForm.barcode, isEditMode, products]);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (!error && data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
  };

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let query = supabase.from("profiles").select("*");
    if (user) query = query.eq("id", user.id);
    const { data, error } = await query.limit(1).single();
    if (!error && data) {
      setProfileForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    }
  };

  const handleBarcodeRegistration = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const targetedItem = products.find(
      (p) =>
        p.barcode === barcodeInput.trim() ||
        String(p.id) === barcodeInput.trim(),
    );

    if (targetedItem) {
      handleSelectProduct(targetedItem);
      setInvMessage({
        type: "success",
        text: `🎯 Identified structural item match: ${targetedItem.name}`,
      });
      setActiveTab("inventory");
    } else {
      setInvMessage({
        type: "error",
        text: `❌ Unidentified hardware signature token: "${barcodeInput}"`,
      });
    }
    setBarcodeInput("");
  };

  const alterOrderShipmentLifecycle = async (orderId, targetStatus) => {
    setOrderMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("orders")
      .update({ status: targetStatus }) 
      .eq("id", orderId);

    if (error) {
      setOrderMessage({
        type: "error",
        text: `Fulfillment Error: ${error.message}`,
      });
    } else {
      setOrderMessage({
        type: "success",
        text: `Order status updated to "${targetStatus}" successfully! 🚀`,
      });
      fetchOrders();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setInvMessage({ type: "", text: "" });

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      setEditForm((prev) => ({ ...prev, image_url: publicUrl }));
      setInvMessage({
        type: "success",
        text: "Image file tracked successfully! Remember to click Save below. 📸",
      });
    } catch (error) {
      setInvMessage({ type: "error", text: `Upload Error: ${error.message}` });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setInvLoading(true);
    setInvMessage({ type: "", text: "" });

    const { error } = await supabase.from("products").insert([
      {
        barcode: editForm.barcode.trim(),
        name: editForm.name,
        price: parseFloat(editForm.price),
        discount: parseFloat(editForm.discount) || 0,
        stock: parseInt(editForm.stock, 10) || 0,
        category: editForm.category,
        image_url: editForm.image_url,
        salt: editForm.salt,
      },
    ]);

    setInvLoading(false);
    if (error) {
      setInvMessage({
        type: "error",
        text: `Database Insert Error: ${error.message}`,
      });
    } else {
      setInvMessage({
        type: "success",
        text: "📦 Brand new catalog listing item initialized successfully!",
      });
      resetFormState();
      fetchInventory();
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setInvLoading(true);
    setInvMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("products")
      .update({
        barcode: editForm.barcode.trim(),
        name: editForm.name,
        price: parseFloat(editForm.price),
        discount: parseFloat(editForm.discount) || 0,
        stock: parseInt(editForm.stock, 10),
        category: editForm.category,
        image_url: editForm.image_url,
        salt: editForm.salt,
      })
      .eq("id", selectedProduct.id);

    setInvLoading(false);
    if (error) {
      setInvMessage({
        type: "error",
        text: `Database Error: ${error.message}`,
      });
    } else {
      setInvMessage({
        type: "success",
        text: "Product parameters updated successfully! 🎉",
      });
      resetFormState();
      fetchInventory();
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently delete this item?")) return;
    setInvLoading(true);
    setInvMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    setInvLoading(false);
    if (error) {
      setInvMessage({
        type: "remove-error",
        text: `Failed to remove: ${error.message}`,
      });
    } else {
      setInvMessage({ type: "success", text: "Item successfully deleted. 🗑" });
      resetFormState();
      fetchInventory();
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: "", text: "" });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfileMessage({ type: "error", text: "No session found." });
      setProfileLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
      address: profileForm.address,
      updated_at: new Date().toISOString(),
    });

    setProfileLoading(false);
    if (error) {
      setProfileMessage({
        type: "error",
        text: `Sync Error: ${error.message}`,
      });
    } else {
      setProfileMessage({
        type: "success",
        text: "Profile metrics updated! ✨",
      });
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    setEditForm({
      barcode: product.barcode || "",
      name: product.name || "",
      price: product.price || "",
      discount: product.discount !== undefined ? String(product.discount) : "0",
      stock: product.stock !== undefined ? String(product.stock) : "",
      category: product.category || "",
      image_url: product.image_url || "",
      salt: product.salt || "",
    });
  };

  const initAddNewProductMode = () => {
    setSelectedProduct(null);
    setIsEditMode(false);
    setEditForm({
      barcode: "",
      name: "",
      price: "",
      discount: "0",
      stock: "10",
      category: "Medicine",
      image_url: "",
      salt: "",
    });
  };

  const resetFormState = () => {
    setSelectedProduct(null);
    setIsEditMode(false);
    setEditForm({
      barcode: "",
      name: "",
      price: "",
      discount: "0",
      stock: "",
      category: "",
      image_url: "",
      salt: "",
    });
  };

  const totalStockItems = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const totalValue = products.reduce((acc, curr) => acc + (curr.price || 0) * (curr.stock || 0), 0);

  const style = {
    wrapper: { padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, sans-serif", color: "#1e293b", boxSizing: "border-box" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "16px" },
    title: { fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 },
    subtitle: { color: "#4f46e5", fontWeight: "600" },
    tabContainer: { display: "flex", background: "#cbd5e1", padding: "4px", borderRadius: "8px", gap: "2px" },
    tabBtn: (isActive) => ({ padding: "8px 14px", fontSize: "13px", fontWeight: "600", border: "none", borderRadius: "6px", cursor: "pointer", background: isActive ? "#ffffff" : "transparent", color: isActive ? "#0f172a" : "#475569", boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }),
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "28px" },
    kpiCard: { padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", boxSizing: "border-box" },
    kpiLabel: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 6px 0" },
    kpiValue: { fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 },
    workspace: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", alignItems: "start" },
    mainCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", boxSizing: "border-box" },
    cardHeader: { padding: "16px 20px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    productRow: (isSelected) => ({ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: isSelected ? "#e0e7ff" : "transparent", borderLeft: isSelected ? "4px solid #4f46e5" : "4px solid transparent", transition: "all 0.15s" }),
    img: { width: "48px", height: "48px", borderRadius: "8px", objectFit: "contain", background: "#f1f5f9", marginRight: "14px", border: "1px solid #e2e8f0", padding: "2px" },
    badge: (status) => {
      let bg = "#f1f5f9"; let color = "#475569";
      if (status === "Delivered" || status === true) { bg = "#ecfdf5"; color = "#047857"; }
      if (status === "Shipped") { bg = "#eff6ff"; color = "#1e40af"; }
      if (status === "Processing" || status === false) { bg = "#fff1f2"; color = "#be123c"; }
      return { padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: bg, color: color };
    },
    input: { width: "100%", boxSizing: "border-box", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#334155", marginTop: "4px", marginBottom: "12px", outline: "none" },
    btnSubmit: { flex: 1, padding: "12px", background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" },
    btnRemove: { padding: "12px 16px", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" },
    actionBtn: (type) => ({ padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", background: type === "ship" ? "#eff6ff" : "#ecfdf5", color: type === "ship" ? "#2563eb" : "#16a34a", border: type === "ship" ? "1px solid #bfdbfe" : "1px solid #bbf7d0" }),
  };

  return (
    <div style={style.wrapper}>
      {/* Top Navigation Header */}
      <div style={style.header}>
        <h1 style={style.title}>
          Mechora <span style={style.subtitle}>Control Hub</span>
        </h1>

        <form onSubmit={handleBarcodeRegistration} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="📸 Scan Barcode / Enter Product ID..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            style={{ ...style.input, margin: 0, width: "240px", background: "#ffffff" }}
          />
          <button type="submit" style={{ ...style.btnSubmit, padding: "10px 14px", flex: "none" }}>
            Find SKU
          </button>
        </form>

        <div style={style.tabContainer}>
          <button onClick={() => setActiveTab("inventory")} style={style.tabBtn(activeTab === "inventory")}>
            📦 Inventory
          </button>
          <button onClick={() => setActiveTab("orders")} style={style.tabBtn(activeTab === "orders")}>
            📋 Orders Queue
          </button>
          <button onClick={() => setActiveTab("profile")} style={style.tabBtn(activeTab === "profile")}>
            👤 Fleet Coordinates
          </button>
        </div>
      </div>

      {/* Metric Counters Block */}
      <div style={style.grid3}>
        <div style={style.kpiCard}>
          <p style={style.kpiLabel}>Active SKU Count</p>
          <h3 style={style.kpiValue}>{products.length} Items</h3>
        </div>
        <div style={style.kpiCard}>
          <p style={style.kpiLabel}>Pending Requests</p>
          <h3 style={{ ...style.kpiValue, color: "#be123c" }}>
            {orders.filter((o) => o.status !== "Delivered").length} Active
          </h3>
        </div>
        <div style={style.kpiCard}>
          <p style={style.kpiLabel}>Aggregate Valuation</p>
          <h3 style={style.kpiValue}>₹{totalValue.toFixed(2)}</h3>
        </div>
      </div>

      {/* Main Tab Panels Layout Workspace */}
      {activeTab === "inventory" && (
        <div style={style.workspace}>
          <div style={style.mainCard}>
            <div style={style.cardHeader}>
              <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
                Product Catalog Records
              </span>
              <button onClick={initAddNewProductMode} style={{ background: "#4f46e5", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                ➕ Add New SKU
              </button>
            </div>

            <div style={{ maxHeight: "540px", overflowY: "auto" }}>
              {products.map((product) => (
                <div key={product.id} onClick={() => handleSelectProduct(product)} style={style.productRow(selectedProduct?.id === product.id)}>
                  <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <img
                      src={product.image_url || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=150&q=80"}
                      alt=""
                      style={style.img}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.name}
                        </span>
                        {product.discount && parseFloat(product.discount) > 0 && (
                          <span style={{ background: "#fef2f2", color: "#ef4444", fontSize: "9px", padding: "1px 4px", borderRadius: "4px", fontWeight: "700" }}>
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {product.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>
                        ₹{parseFloat(product.price).toFixed(2)}
                      </div>
                    </div>
                    <span style={style.badge(product.stock > 0)}>
                      {product.stock} Qty
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={style.kpiCard}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: 0, marginBottom: "16px" }}>
              {isEditMode ? "⚡ Edit Catalog Entry" : "➕ Inventory Console: Add New Product"}
            </h3>

            {invMessage.text && (
              <div style={{ padding: "10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", marginBottom: "12px", background: invMessage.type === "success" ? "#edfdf5" : "#fff1f2", color: invMessage.type === "success" ? "#047857" : "#be123c" }}>
                {invMessage.text}
              </div>
            )}

            <form onSubmit={isEditMode ? handleUpdateProduct : handleCreateProduct}>
              <label style={{ fontSize: "10px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase" }}>
                📡 Barcode / SKU Hardware Token
              </label>
              <input
                type="text"
                value={editForm.barcode}
                onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                style={{ ...style.input, border: "1px solid #a5b4fc", background: "#f0f3ff", fontWeight: "600" }}
                placeholder="Scan code here..."
              />

              <label style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Product Name *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={style.input}
                required
                placeholder="e.g. Paracetamol Extra"
              />

              <label style={{ fontSize: "10px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase" }}>
                🧪 Salt / Active Formula Ingredients
              </label>
              <input
                type="text"
                value={editForm.salt}
                placeholder="e.g. Paracetamol 500mg"
                onChange={(e) => setEditForm({ ...editForm, salt: e.target.value })}
                style={{ ...style.input, border: "1px solid #818cf8", background: "#f5f3ff" }}
              />

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    style={style.input}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", color: "#ef4444", textTransform: "uppercase" }}>
                    🏷 Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.discount}
                    onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                    style={{ ...style.input, border: "1px solid #fca5a5", color: "#b91c1c", fontWeight: "600" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Category *
                  </label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={style.input}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Stock Volume *
                  </label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    style={style.input}
                    required
                  />
                </div>
              </div>

              <label style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Product Image URL
              </label>
              <input
                type="text"
                value={editForm.image_url}
                onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                style={style.input}
              />

              <label style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Or Upload New Image Asset
              </label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ ...style.input, background: "#ffffff", padding: "8px" }} />

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                {isEditMode ? (
                  <>
                    <button type="button" onClick={() => handleRemoveProduct(selectedProduct.id)} disabled={invLoading} style={style.btnRemove}>
                      🗑 Delete
                    </button>
                    <button type="submit" disabled={invLoading || uploadingImage} style={style.btnSubmit}>
                      {invLoading ? "Saving Changes..." : "Save Row Alterations"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={resetFormState} style={{ ...style.btnRemove, background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>
                      Clear Form
                    </button>
                    <button type="submit" disabled={invLoading || uploadingImage} style={style.btnSubmit}>
                      {invLoading ? "Adding Item..." : "Publish to Catalog"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders Tab Layout */}
      {activeTab === "orders" && (
        <div style={style.mainCard}>
          <div style={style.cardHeader}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>
              Incoming Fleet Orders Pipeline
            </span>
          </div>

          {orderMessage.text && (
            <div style={{ padding: "12px", margin: "16px", borderRadius: "6px", fontSize: "13px", background: orderMessage.type === "success" ? "#ecfdf5" : "#fff1f2", color: orderMessage.type === "success" ? "#047857" : "#be123c" }}>
              {orderMessage.text}
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 20px", color: "#64748b" }}>Order ID</th>
                  <th style={{ padding: "14px 20px", color: "#64748b" }}>Customer Base</th>
                  <th style={{ padding: "14px 20px", color: "#64748b" }}>Amount</th>
                  <th style={{ padding: "14px 20px", color: "#64748b" }}>Current Lifecycle</th>
                  <th style={{ padding: "14px 20px", color: "#64748b", textAlign: "right" }}>Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                      No order metadata logs found inside this bucket.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#4f46e5" }}>#{order.id.slice(0, 8)}</td>
                      <td style={{ padding: "14px 20px", color: "#334155" }}>{order.user_id ? `Client: ${order.user_id.slice(0, 8)}` : "Guest Account"}</td>
                      <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a" }}>₹{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={style.badge(order.status)}>{order.status || "Processing"}</span>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {order.status !== "Shipped" && order.status !== "Delivered" && (
                            <button onClick={() => alterOrderShipmentLifecycle(order.id, "Shipped")} style={style.actionBtn("ship")}>
                              🚀 Ship Out
                            </button>
                          )}
                          {order.status !== "Delivered" && (
                            <button onClick={() => alterOrderShipmentLifecycle(order.id, "Delivered")} style={style.actionBtn("deliver")}>
                              ✅ Arrived
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fleet Profile Tab Layout */}
      {activeTab === "profile" && (
        <div style={{ ...style.kpiCard, maxWidth: "560px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>👤 System Coordinates & Hub Profile</h3>
          
          {profileMessage.text && (
            <div style={{ padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px", background: profileMessage.type === "success" ? "#ecfdf5" : "#fff1f2", color: profileMessage.type === "success" ? "#047857" : "#be123c" }}>
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>First Name</label>
                <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} style={style.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Last Name</label>
                <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} style={style.input} />
              </div>
            </div>

            <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Contact Terminal Phone No.</label>
            <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} style={style.input} placeholder="+91 XXXXX XXXXX" />

            <label style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Hub Coordinates / Dispatch Address</label>
            <textarea value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} style={{ ...style.input, height: "80px", resize: "none", fontFamily: "inherit" }} />

            <button type="submit" disabled={profileLoading} style={{ ...style.btnSubmit, width: "100%" }}>
              {profileLoading ? "Syncing Grid Configuration..." : "Rewrite Profile Master File"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}