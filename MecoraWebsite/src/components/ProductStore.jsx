import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ProductStore.css';

export default function ProductStore({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInventory() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;
        
        setProducts(data || []);

        const uniqueCategories = ['All', ...new Set(data?.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Supabase cluster link exception:", err.message);
        setError("Could not resolve inventory lines from database cloud.");
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="store-container">
      
      <div className="promo-banner">
        <span className="promo-tag">SECURE LOGISTICS TERMINAL</span>
        <h2>Verified Clinical Formulations & Medical Supplies</h2>
        <p>Direct inventory assignment via authorized local routing channels.</p>
      </div>

      {/* Category Selection Filter Pills */}
      {!loading && !error && categories.length > 1 && (
        <div className="category-filter-bar">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active-pill' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <h3 className="section-title">
        {activeCategory === 'All' ? 'Available Items Catalog' : `${activeCategory} Solutions`}
      </h3>

      {loading && <div className="status-text">Synchronizing parameters from cloud databases...</div>}
      {error && <div className="status-text" style={{ color: '#ef4444' }}>{error}</div>}
      
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="status-text">No active products match this category filter.</div>
      )}

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            
            {/* CORRECTLY ALIGNED & SHAPED IMAGE HOUSING */}
            <div className="product-image-container">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="product-image-fluid"
                  onError={(e) => {
                    // Fallback element handler if source links return 404 or drop
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<span class="product-fallback-icon">💊</span>';
                  }}
                />
              ) : (
                <span className="product-fallback-icon">💊</span>
              )}
            </div>

            <h4>{product.name}</h4>
            <div className="product-salt">Salt: {product.salt || 'N/A'}</div>
            <div className="product-price">₹{parseFloat(product.price).toFixed(2)}</div>
            
            <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
              Add to Basket
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}