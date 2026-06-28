import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./ClientDashboard.css";

/* ─────────────────────────────────────────────────────
   WISHLIST HELPERS  (localStorage)
───────────────────────────────────────────────────── */
const WL_KEY = "mecora_wishlist";
const loadWishlist  = () => { try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; } catch { return []; } };
const saveWishlist  = (list) => localStorage.setItem(WL_KEY, JSON.stringify(list));

/* ─────────────────────────────────────────────────────
   GLOBAL RESPONSIVE CSS
───────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  * { box-sizing: border-box; }

  /* ── Wishlist heart button ── */
  .wl-heart-btn {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    background: rgba(255,255,255,0.92);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
    box-shadow: 0 1px 6px rgba(0,0,0,0.12);
    transition: transform 0.15s, background 0.15s;
  }
  .wl-heart-btn:hover { transform: scale(1.15); }
  .wl-heart-btn.active { background: #fef2f2; }

  /* ── Wishlist page ── */
  .wl-page {
    min-height: 60vh;
    padding: 1.25rem 1rem;
    background: #f1f5f9;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .wl-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1.1rem;
  }
  .wl-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }
  .wl-count-badge {
    background: #4f46e5;
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 99px;
  }
  .wl-empty {
    text-align: center;
    padding: 3.5rem 1rem;
    background: #fff;
    border-radius: 14px;
    color: #94a3b8;
  }
  .wl-empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .wl-empty-text { font-size: 0.92rem; margin: 0 0 1.1rem; }
  .wl-browse-btn {
    background: #4f46e5;
    color: #fff;
    border: none;
    padding: 0.6rem 1.4rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
  }
  .wl-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
  }
  @media (min-width: 480px) { .wl-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 720px) { .wl-grid { grid-template-columns: repeat(4, 1fr); } }

  .wl-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    position: relative;
    cursor: pointer;
    transition: box-shadow 0.15s;
  }
  .wl-card:hover { box-shadow: 0 4px 18px rgba(79,70,229,0.12); }
  .wl-card-img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    display: block;
  }
  .wl-remove-btn {
    position: absolute;
    top: 7px;
    right: 7px;
    background: rgba(255,255,255,0.92);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.85rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    z-index: 5;
  }
  .wl-card-body { padding: 0.6rem 0.75rem 0.75rem; }
  .wl-card-name {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.2rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.35;
  }
  .wl-card-salt {
    font-size: 0.65rem;
    color: #64748b;
    margin: 0 0 0.35rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wl-card-price {
    font-size: 1rem;
    font-weight: 800;
    color: #4f46e5;
    margin: 0 0 0.5rem;
  }
  .wl-card-add-btn {
    width: 100%;
    padding: 0.42rem 0;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }
  .wl-card-add-btn:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }
  .wl-card-stepper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #eef2ff;
    border-radius: 8px;
    padding: 0.2rem 0.35rem;
  }
  .wl-card-step-btn {
    width: 26px; height: 26px;
    background: #4f46e5; color: #fff;
    border: none; border-radius: 6px;
    font-weight: 700; font-size: 1rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }

  /* Product detail page layout */
  .pdp-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #f1f5f9;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .pdp-back-bar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .pdp-image-block {
    background: #fff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .pdp-image-block img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;
    display: block;
  }

  .pdp-info-block {
    background: #fff;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pdp-cta-block {
    background: #fff;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pdp-tabs {
    display: flex;
    background: #fff;
    border-bottom: 2px solid #e2e8f0;
    position: sticky;
    top: 49px;
    z-index: 40;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .pdp-tabs::-webkit-scrollbar { display: none; }

  .pdp-tab-btn {
    flex: 1;
    min-width: 130px;
    padding: 0.75rem 0.5rem;
    background: none;
    border: none;
    font-size: 0.85rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    white-space: nowrap;
    transition: color 0.15s;
  }
  .pdp-tab-btn.active {
    font-weight: 700;
    color: #4f46e5;
    border-bottom-color: #4f46e5;
  }

  .pdp-tab-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #f1f5f9;
  }

  .pdp-section-card {
    background: #fff;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    border-left: 3px solid #4f46e5;
  }
  .pdp-section-card.warn { border-left-color: #f59e0b; }
  .pdp-section-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4f46e5;
    margin-bottom: 0.35rem;
  }
  .pdp-section-card.warn .pdp-section-label { color: #b45309; }
  .pdp-section-text {
    font-size: 0.88rem;
    color: #334155;
    line-height: 1.6;
    margin: 0;
  }

  .pdp-kv-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
  .pdp-kv-chip {
    background: #fff;
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
  }
  .pdp-kv-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    display: block;
    margin-bottom: 0.2rem;
  }
  .pdp-kv-value {
    font-size: 0.88rem;
    font-weight: 600;
    color: #0f172a;
  }

  .pdp-similar-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  @media (min-width: 480px) { .pdp-similar-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 700px) { .pdp-similar-grid { grid-template-columns: repeat(4, 1fr); } }

  .pdp-sim-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  .pdp-sim-card img { width: 100%; height: 90px; object-fit: cover; display: block; }
  .pdp-sim-body { padding: 0.6rem; }
  .pdp-sim-name {
    font-size: 0.78rem; font-weight: 700; color: #0f172a;
    margin: 0 0 0.15rem; line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .pdp-sim-salt { font-size: 0.65rem; color: #64748b; margin: 0 0 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pdp-sim-price { font-size: 0.95rem; font-weight: 800; color: #4f46e5; margin: 0 0 0.5rem; }
  .pdp-sim-add-btn { width: 100%; padding: 0.4rem 0; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
  .pdp-sim-stepper { display: flex; align-items: center; justify-content: space-between; background: #eef2ff; border-radius: 8px; padding: 0.2rem 0.35rem; }
  .pdp-sim-step-btn { width: 26px; height: 26px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  .pdp-sticky-cta {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #fff;
    border-top: 1px solid #e2e8f0;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 100;
    box-shadow: 0 -4px 16px rgba(0,0,0,0.08);
  }
  .pdp-sticky-price { font-size: 1.2rem; font-weight: 900; color: #0f172a; flex: 1; }
  .pdp-sticky-price small { display: block; font-size: 0.68rem; font-weight: 500; color: #94a3b8; }
  .pdp-sticky-add-btn {
    background: #4f46e5; color: #fff; border: none; border-radius: 12px;
    padding: 0.75rem 1.5rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  }
  .pdp-sticky-add-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
  .pdp-sticky-stepper { display: flex; align-items: center; gap: 0.6rem; background: #eef2ff; border-radius: 12px; padding: 0.5rem 0.75rem; flex-shrink: 0; }
  .pdp-sticky-step-btn { width: 34px; height: 34px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  /* PDP wishlist heart (top-right of image) */
  .pdp-wl-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255,255,255,0.92);
    border: none;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.13);
    transition: transform 0.15s;
    z-index: 10;
  }
  .pdp-wl-btn:hover { transform: scale(1.15); }

  @media (min-width: 768px) {
    .pdp-sticky-cta { display: none; }
    .pdp-layout { padding-bottom: 0 !important; }
    .pdp-image-block img { max-height: 340px; }
    .pdp-similar-grid { grid-template-columns: repeat(4, 1fr); }
  }
`;

/* ─────────────────────────────────────────────────────
   PRODUCT DETAIL PAGE
───────────────────────────────────────────────────── */
function ProductDetailPage({ product, allProducts, cart, onAddToCart, onDecrease, onBack, wishlist, onToggleWishlist }) {
  const [activeTab, setActiveTab] = useState("details");

  const similar = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 8);

  const cartItem  = cart.find((i) => i.id === product.id);
  const quantity  = cartItem?.quantity || 0;
  const inWishlist = wishlist.some((w) => w.id === product.id);

  const imgSrc = product.image_url?.trim()
    ? product.image_url
    : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";

  const hasDiscount = product.discount && parseFloat(product.discount) > 0;
  const mrp = hasDiscount ? Math.round(product.price / (1 - parseFloat(product.discount) / 100)) : null;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="pdp-layout" style={{ paddingBottom: 80 }}>

        {/* Back bar */}
        <div className="pdp-back-bar">
          <button onClick={onBack} style={{ background: "none", border: "1px solid #e2e8f0", padding: "0.35rem 0.75rem", borderRadius: 8, fontWeight: 600, fontSize: "0.82rem", color: "#4f46e5", cursor: "pointer", flexShrink: 0 }}>
            ← Back
          </button>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.category} / {product.name}
          </span>
        </div>

        {/* Product image */}
        <div className="pdp-image-block">
          {hasDiscount && (
            <span style={{ position: "absolute", top: 12, left: 12, background: "#ef4444", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 8, zIndex: 10 }}>
              {product.discount}% OFF
            </span>
          )}
          {/* Wishlist heart on PDP */}
          <button
            className="pdp-wl-btn"
            onClick={() => onToggleWishlist(product)}
            title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {inWishlist ? "❤️" : "🤍"}
          </button>
          <img src={imgSrc} alt={product.name} />
        </div>

        {/* Product info */}
        <div className="pdp-info-block">
          <span style={{ display: "inline-block", background: "#e0e7ff", color: "#4f46e5", fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 20 }}>
            {product.category || "General"}
          </span>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.35 }}>
            {product.name}
          </h1>
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
            <span style={{ fontWeight: 700, color: "#4f46e5" }}>Salt: </span>
            {product.salt || "Standard Components"}
          </div>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 99, background: product.stock > 0 ? "#dcfce7" : "#fee2e2", color: product.stock > 0 ? "#15803d" : "#dc2626", alignSelf: "flex-start" }}>
            {product.stock > 0 ? `✓ In Stock` : "✗ Out of Stock"}
          </span>
        </div>

        {/* Tabs */}
        <div className="pdp-tabs">
          <button className={`pdp-tab-btn${activeTab === "details" ? " active" : ""}`} onClick={() => setActiveTab("details")}>Product Details</button>
          <button className={`pdp-tab-btn${activeTab === "similar" ? " active" : ""}`} onClick={() => setActiveTab("similar")}>
            Similar Products {similar.length > 0 && `(${similar.length})`}
          </button>
        </div>

        {/* Tab content */}
        <div className="pdp-tab-content">
          {activeTab === "details" && (
            <>
              <div className="pdp-section-card">
                <div className="pdp-section-label">Description</div>
                <p className="pdp-section-text">{product.description || "Premium formula verified under Mecora distribution guidelines."}</p>
              </div>
              {product.manufacturer && (
                <div className="pdp-section-card">
                  <div className="pdp-section-label">Manufacturer</div>
                  <p className="pdp-section-text">{product.manufacturer}</p>
                </div>
              )}
              {product.dosage && (
                <div className="pdp-section-card">
                  <div className="pdp-section-label">Dosage</div>
                  <p className="pdp-section-text">{product.dosage}</p>
                </div>
              )}
              {product.side_effects && (
                <div className="pdp-section-card warn">
                  <div className="pdp-section-label">⚠️ Side Effects</div>
                  <p className="pdp-section-text">{product.side_effects}</p>
                </div>
              )}
              <div className="pdp-kv-grid">
                <div className="pdp-kv-chip"><span className="pdp-kv-label">Category</span><span className="pdp-kv-value">{product.category || "General"}</span></div>
                <div className="pdp-kv-chip"><span className="pdp-kv-label">Stock</span><span className="pdp-kv-value">{product.stock ?? "N/A"}</span></div>
                {product.expiry && <div className="pdp-kv-chip"><span className="pdp-kv-label">Expiry</span><span className="pdp-kv-value">{product.expiry}</span></div>}
                {product.batch  && <div className="pdp-kv-chip"><span className="pdp-kv-label">Batch No.</span><span className="pdp-kv-value">{product.batch}</span></div>}
              </div>
            </>
          )}

          {activeTab === "similar" && (
            <>
              {similar.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.9rem", padding: "2.5rem 0", background: "#fff", borderRadius: 12 }}>
                  No similar products found in this category.
                </div>
              ) : (
                <div className="pdp-similar-grid">
                  {similar.map((sim) => {
                    const sc = cart.find((i) => i.id === sim.id);
                    const sq = sc?.quantity || 0;
                    const si = sim.image_url?.trim() ? sim.image_url : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";
                    return (
                      <div key={sim.id} className="pdp-sim-card">
                        <img src={si} alt={sim.name} />
                        <div className="pdp-sim-body">
                          <p className="pdp-sim-name">{sim.name}</p>
                          <p className="pdp-sim-salt">{sim.salt || "—"}</p>
                          <p className="pdp-sim-price">₹{sim.price}</p>
                          {sq === 0 ? (
                            <button className="pdp-sim-add-btn" onClick={() => onAddToCart(sim)}>Add to Cart</button>
                          ) : (
                            <div className="pdp-sim-stepper">
                              <button className="pdp-sim-step-btn" onClick={() => onDecrease(sim)}>−</button>
                              <span style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 20, textAlign: "center" }}>{sq}</span>
                              <button className="pdp-sim-step-btn" onClick={() => onAddToCart(sim)}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="pdp-sticky-cta">
        <div className="pdp-sticky-price">
          <small>{hasDiscount ? `MRP ₹${mrp}` : "Price"}</small>
          ₹{product.price}
          {quantity > 0 && (
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500, marginLeft: "0.4rem" }}>
              × {quantity} = ₹{(product.price * quantity).toFixed(0)}
            </span>
          )}
        </div>
        {quantity === 0 ? (
          <button className="pdp-sticky-add-btn" onClick={() => onAddToCart(product)} disabled={product.stock <= 0}>
            {product.stock > 0 ? "🛒 Add to Cart" : "Out of Stock"}
          </button>
        ) : (
          <div className="pdp-sticky-stepper">
            <button className="pdp-sticky-step-btn" onClick={() => onDecrease(product)}>−</button>
            <span style={{ fontWeight: 800, fontSize: "1rem", minWidth: 24, textAlign: "center" }}>{quantity}</span>
            <button className="pdp-sticky-step-btn" onClick={() => onAddToCart(product)}>+</button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   WISHLIST PAGE
───────────────────────────────────────────────────── */
function WishlistPage({ wishlist, cart, onAddToCart, onDecrease, onToggleWishlist, onBrowse, onOpenProduct }) {
  return (
    <div className="wl-page">
      <style>{GLOBAL_CSS}</style>
      <div className="wl-header">
        <h2 className="wl-title">❤️ My Wishlist</h2>
        {wishlist.length > 0 && <span className="wl-count-badge">{wishlist.length}</span>}
      </div>

      {wishlist.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-icon">🤍</div>
          <p className="wl-empty-text">Your wishlist is empty.<br />Save products you love and find them here anytime.</p>
          <button className="wl-browse-btn" onClick={onBrowse}>Browse Products</button>
        </div>
      ) : (
        <div className="wl-grid">
          {wishlist.map((product) => {
            const cartItem = cart.find((i) => i.id === product.id);
            const qty      = cartItem?.quantity || 0;
            const imgSrc   = product.image_url?.trim()
              ? product.image_url
              : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";

            return (
              <div key={product.id} className="wl-card" onClick={() => onOpenProduct(product)}>
                {/* Remove from wishlist */}
                <button
                  className="wl-remove-btn"
                  onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                  title="Remove from Wishlist"
                >
                  ❤️
                </button>
                <img src={imgSrc} alt={product.name} className="wl-card-img" />
                <div className="wl-card-body">
                  <p className="wl-card-name">{product.name}</p>
                  <p className="wl-card-salt">{product.salt || "—"}</p>
                  <p className="wl-card-price">₹{product.price}</p>
                  {qty === 0 ? (
                    <button
                      className="wl-card-add-btn"
                      disabled={product.stock <= 0}
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  ) : (
                    <div className="wl-card-stepper" onClick={(e) => e.stopPropagation()}>
                      <button className="wl-card-step-btn" onClick={() => onDecrease(product)}>−</button>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 20, textAlign: "center" }}>{qty}</span>
                      <button className="wl-card-step-btn" onClick={() => onAddToCart(product)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════ */
export default function ClientDashboard({
  products = [],
  cart = [],
  setCart,
  searchQuery = "",
  setSearchQuery,
  currentView,
  setCurrentView,
  role = "customer",
  user,
  onLogout,
  localCategory = "All",
  setLocalCategory,
  isNavbarOnly = false,
  fetchOrders,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast]                     = useState({ show: false, message: "" });
  const [localProducts, setLocalProducts]     = useState(products);

  /* ── Wishlist state, seeded from localStorage ── */
  const [wishlist, setWishlist] = useState(() => loadWishlist());

  useEffect(() => { setLocalProducts(products); }, [products]);

  const profileName = user?.full_name || user?.first_name || "Operator";

  /* Persist wishlist whenever it changes */
  useEffect(() => { saveWishlist(wishlist); }, [wishlist]);

  /* ─── FIX: clear selectedProduct whenever view changes away from products ─── */
  useEffect(() => {
    if (currentView !== "products") {
      setSelectedProduct(null);
    }
  }, [currentView]);

  /* Toggle a product in/out of wishlist */
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.id === product.id);
      if (exists) {
        showToast(`💔 Removed from Wishlist`);
        return prev.filter((w) => w.id !== product.id);
      } else {
        showToast(`❤️ Added to Wishlist`);
        return [...prev, product];
      }
    });
  };

  useEffect(() => {
    const id = `schema-db-changes-${Math.random().toString(36).substr(2, 9)}`;
    const ch = supabase.channel(id).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      (payload) => {
        setLocalProducts((prev) => {
          if (payload.eventType === "INSERT") return [...prev, payload.new];
          if (payload.eventType === "UPDATE") return prev.map((p) => p.id === payload.new.id ? payload.new : p);
          if (payload.eventType === "DELETE") return prev.filter((p) => p.id !== payload.old.id);
          return prev;
        });
      }
    );
    ch.subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    const id = `user-orders-${Math.random().toString(36).substr(2, 9)}`;
    const ch = supabase.channel(id).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => { if (typeof fetchOrders === "function") fetchOrders(); }
    ).subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchOrders]);

  const cartCount     = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const wishlistCount = wishlist.length;
  const categories    = ["All", "Antibiotics", "Cardiovascular", "Respiratory", "OTC Supplements", "Medicine"];

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return showToast("❌ Out of stock!");
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      setCart(cart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(`🛒 Added ${product.name} to cart!`);
  };

  const decreaseFromCart = (product) => {
    const existing = cart.find((i) => i.id === product.id);
    if (!existing) return;
    if (existing.quantity === 1) {
      setCart(cart.filter((i) => i.id !== product.id));
    } else {
      setCart(cart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  /* ── Quantity stepper for product grid ── */
  const QuantityStepper = ({ product }) => {
    const cartItem = cart.find((i) => i.id === product.id);
    const quantity = cartItem?.quantity || 0;
    if (quantity === 0) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
          style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", padding: "0.5rem 0.85rem", borderRadius: "8px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>
          Add
        </button>
      );
    }
    return (
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "5px", background: "#eef2ff", borderRadius: "8px", padding: "0.25rem 0.4rem" }}>
        <button onClick={(e) => { e.stopPropagation(); decreaseFromCart(product); }} style={{ width: 24, height: 24, borderRadius: "5px", border: "none", background: "#4f46e5", color: "#fff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>−</button>
        <span style={{ fontWeight: "700", fontSize: "0.85rem", minWidth: 16, textAlign: "center" }}>{quantity}</span>
        <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} style={{ width: 24, height: 24, borderRadius: "5px", border: "none", background: "#4f46e5", color: "#fff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>+</button>
      </div>
    );
  };

  /* ── NAVBAR ONLY ── */
  if (isNavbarOnly) {
    return (
      <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderBottom: "1px solid #e2e8f0", width: "100%" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", fontFamily: "system-ui, sans-serif", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span onClick={() => { setCurrentView("products"); setSelectedProduct(null); }} style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "2px", color: "#4f46e5", cursor: "pointer" }}>MECORA</span>
            <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "#4f46e5", background: "#e0e7ff", padding: "0.2rem 0.45rem", borderRadius: "6px", whiteSpace: "nowrap" }}>
              {role === "admin" ? "🛡️ ADMIN" : `👤 ${profileName.toUpperCase()}`}
            </span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            {["products", "orders"].map((view) => (
              <button key={view} onClick={() => { setCurrentView(view); setSelectedProduct(null); }}
                style={{ background: "none", border: "none", color: currentView === view ? "#4f46e5" : "#475569", fontWeight: currentView === view ? "700" : "500", fontSize: "0.82rem", cursor: "pointer", padding: "0.25rem 0.4rem", textTransform: "capitalize" }}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
            {role !== "admin" && (
              <>
                {/* Wishlist nav button */}
                <button onClick={() => { setCurrentView("wishlist"); setSelectedProduct(null); }}
                  style={{ border: "none", background: currentView === "wishlist" ? "#fff1f2" : "none", color: currentView === "wishlist" ? "#e11d48" : "#475569", fontWeight: "600", fontSize: "0.82rem", cursor: "pointer", padding: "0.25rem 0.5rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "3px" }}>
                  {currentView === "wishlist" ? "❤️" : "🤍"}
                  {wishlistCount > 0 && (
                    <span style={{ background: "#e11d48", color: "#fff", fontSize: "0.6rem", padding: "1px 5px", borderRadius: "99px" }}>{wishlistCount}</span>
                  )}
                </button>
                {/* Cart nav button */}
                <button onClick={() => setCurrentView("cart")}
                  style={{ border: "none", background: currentView === "cart" ? "#eff6ff" : "none", color: currentView === "cart" ? "#1e40af" : "#475569", fontWeight: "600", fontSize: "0.82rem", cursor: "pointer", padding: "0.25rem 0.5rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "3px" }}>
                  🛒<span style={{ background: "#4f46e5", color: "#fff", fontSize: "0.6rem", padding: "1px 5px", borderRadius: "99px" }}>{cartCount}</span>
                </button>
              </>
            )}
            <button onClick={() => setCurrentView("profile")} style={{ background: "none", border: "none", color: currentView === "profile" ? "#4f46e5" : "#475569", fontWeight: currentView === "profile" ? "700" : "500", fontSize: "0.82rem", cursor: "pointer", padding: "0.25rem 0.4rem" }}>Profile</button>
            <button onClick={onLogout} style={{ backgroundColor: "#fef2f2", border: "none", color: "#991b1b", fontWeight: "600", fontSize: "0.78rem", padding: "0.3rem 0.6rem", borderRadius: "8px", cursor: "pointer" }}>Sign Out</button>
          </nav>
        </header>

        {currentView === "products" && role !== "admin" && (
          <div style={{ display: "flex", flexDirection: "column", padding: "0.6rem 1rem", gap: "0.6rem", borderTop: "1px solid #f1f5f9" }}>
            <input type="text" placeholder="🔍 Search items, salt, or label..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.85rem", border: "1px solid #e2e8f0", borderRadius: "10px", outline: "none", fontSize: "0.88rem" }} />
            <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "3px", WebkitOverflowScrolling: "touch" }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setLocalCategory(cat)}
                  style={{ padding: "0.35rem 0.85rem", borderRadius: "99px", fontSize: "0.73rem", fontWeight: "600", cursor: "pointer", flexShrink: 0, backgroundColor: localCategory === cat ? "#4f46e5" : "#f1f5f9", border: "none", color: localCategory === cat ? "#fff" : "#475569" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── FIX: WISHLIST PAGE — checked BEFORE selectedProduct ─── */
  if (currentView === "wishlist") {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        {toast.show && <div className="toast-popup">{toast.message}</div>}
        <WishlistPage
          wishlist={wishlist}
          cart={cart}
          onAddToCart={addToCart}
          onDecrease={decreaseFromCart}
          onToggleWishlist={toggleWishlist}
          onBrowse={() => setCurrentView("products")}
          onOpenProduct={(p) => {
            setSelectedProduct(p);
            setCurrentView("products"); // switch view so PDP renders in products context
          }}
        />
      </>
    );
  }

  /* ── PRODUCT DETAIL PAGE ── */
  if (selectedProduct) {
    return (
      <>
        <ProductDetailPage
          product={selectedProduct}
          allProducts={localProducts}
          cart={cart}
          onAddToCart={addToCart}
          onDecrease={decreaseFromCart}
          onBack={() => setSelectedProduct(null)}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
        {toast.show && <div className="toast-popup">{toast.message}</div>}
      </>
    );
  }

  /* ── PRODUCT GRID ── */
  const lowercaseQuery = searchQuery.toLowerCase();
  const filteredProducts = localProducts.filter((product) => {
    const matchesCategory = localCategory === "All" || product.category === localCategory;
    return matchesCategory && (
      product.name?.toLowerCase().includes(lowercaseQuery) ||
      product.category?.toLowerCase().includes(lowercaseQuery) ||
      product.description?.toLowerCase().includes(lowercaseQuery) ||
      product.salt?.toLowerCase().includes(lowercaseQuery)
    );
  });

  return (
    <div className="dashboard-container">
      <style>{GLOBAL_CSS}</style>
      {toast.show && <div className="toast-popup">{toast.message}</div>}
      <div className="products-grid">
        {filteredProducts.map((product) => {
          const productImgSrc = product.image_url?.trim()
            ? product.image_url
            : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";
          const inWl = wishlist.some((w) => w.id === product.id);

          return (
            <div key={product.id} className="product-card" onClick={() => setSelectedProduct(product)} style={{ cursor: "pointer", position: "relative" }}>
              {product.discount && parseFloat(product.discount) > 0 && (
                <span style={{ position: "absolute", top: "10px", right: "10px", zIndex: 5, background: "#ef4444", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "7px", fontSize: "0.68rem", fontWeight: "700" }}>
                  {product.discount}% OFF
                </span>
              )}

              {/* ── Wishlist heart ── */}
              <button
                className={`wl-heart-btn${inWl ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                title={inWl ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                {inWl ? "❤️" : "🤍"}
              </button>

              <div style={{ width: "100%", height: "150px", position: "relative", overflow: "hidden", background: "#f8fafc" }}>
                <img src={productImgSrc} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.95)", padding: "0.15rem 0.45rem", borderRadius: "20px", fontSize: "0.65rem", fontWeight: "700", color: "#4f46e5" }}>
                  {product.category || "General"}
                </span>
              </div>
              <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <h4 style={{ margin: "0 0 0.15rem", fontWeight: "700", color: "#0f172a", fontSize: "0.88rem" }}>{product.name}</h4>
                  <div style={{ fontSize: "0.65rem", fontWeight: "600", color: "#4f46e5", marginBottom: "0.35rem" }}>🧪 {product.salt || "Standard Components"}</div>
                  <p style={{ margin: "0", fontSize: "0.75rem", color: "#64748b", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {product.description || "Premium formula verified under Mecora distribution guidelines."}
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "#0f172a" }}>₹{product.price}</span>
                  <QuantityStepper product={product} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}