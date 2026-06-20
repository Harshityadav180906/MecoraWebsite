import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function OrdersView({ role, orders, fetchOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Sync selected order details when master list updates
  useEffect(() => {
    if (orders && orders.length > 0) {
      // If we already have an order selected, keep it selected but refresh its data
      if (selectedOrder) {
        const refreshed = orders.find(o => o.id === selectedOrder.id);
        setSelectedOrder(refreshed || orders[0]);
      } else {
        setSelectedOrder(orders[0]);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [orders]);

  // Admin function to transition product status state inside DB
  async function handleMarkAsDelivered(orderId) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Delivered', delivery_timeline: 'Delivered' })
        .eq('id', orderId);

      if (error) throw error;

      alert("🎉 Order status marked as Delivered!");
      if (fetchOrders) await fetchOrders(); // Triggers live state updates globally across app routing layout
    } catch (err) {
      alert("Fulfillment update failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
          {role === 'admin' ? "Mecora Centralized Orders Ledger" : "Your Mecora Purchase Orders"}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select any transaction line item to view tracking invoices.</p>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No transactional entries registered to this account profile context.</p>
        </div>
      ) : (
        /* Split View Canvas matching original-0d769d7032dc175ae64ee6e849182b4b.webp */
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', flexGrow: 1, minHeight: 0 }}>
          
          {/* Left Master List Column */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
            {orders.map((order, index) => {
              const sequentialDisplayId = orders.length - index; 
              const isSelected = selectedOrder?.id === order.id;
              const isDelivered = order.status === 'Delivered';

              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: isSelected ? '#edf2ff' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                      Order #{sequentialDisplayId}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-orange)' }}>
                      ${parseFloat(order.total_price).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>📆 {new Date(order.created_at).toLocaleDateString()}</span>
                    <span style={{ 
                      padding: '0.15rem 0.4rem', 
                      borderRadius: '4px', 
                      background: isDelivered ? '#d1fae5' : '#fee2e2', 
                      color: isDelivered ? '#065f46' : '#991b1b',
                      fontWeight: '600',
                      fontSize: '0.75rem'
                    }}>
                      {order.status || 'Processing'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    👤 {order.customer_email}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Detail Inspection Invoice Panel */}
          <div style={{ overflowY: 'auto' }}>
            {selectedOrder ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', height: '100%' }}>
                
                {/* Activity & Timeline Tracking */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: selectedOrder.status === 'Delivered' ? '#d1fae5' : '#e0e7ff', 
                      color: selectedOrder.status === 'Delivered' ? '#065f46' : 'var(--primary)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontWeight: '600' 
                    }}>
                      {selectedOrder.status === 'Delivered' ? '✅ Fulfillment Complete' : '🚚 Active Shipment'}
                    </span>
                    <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
                      Order #{orders.length - orders.findIndex(o => o.id === selectedOrder.id)}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>System DB Ref Key: {selectedOrder.id}</span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                  <div>
                    <h4>Logistics Tracking</h4>
                    <div style={{ marginTop: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {selectedOrder.status === 'Delivered' ? (
                        <div>
                          <div style={{ position: 'absolute', left: '-5px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                          <strong style={{ display: 'block', fontSize: '0.95rem' }}>Package Delivered Successfully</strong>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>🏁 Handed over to client recipient.</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ position: 'absolute', left: '-5px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                          <strong style={{ display: 'block', fontSize: '0.95rem' }}>Estimated Delivery Matrix</strong>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>⏳ Arriving via: {selectedOrder.delivery_timeline || '3 Days'}</span>
                        </div>
                      )}
                      <div>
                        <div style={{ position: 'absolute', left: '-5px', width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>Payment Authorization Verified</strong>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>💳 Method: {selectedOrder.payment_method || 'Credit Card'}</span>
                      </div>
                      <div>
                        <div style={{ position: 'absolute', left: '-5px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>Order Log Processed</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* ADMIN ONLY CONTROLS ACTION BLOCK */}
                  {role === 'admin' && selectedOrder.status !== 'Delivered' && (
                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '0.85rem', background: '#2563eb' }}
                        onClick={() => handleMarkAsDelivered(selectedOrder.id)}
                        disabled={updating}
                      >
                        {updating ? 'Updating Pipeline...' : '📦 Mark as Delivered'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Digital Receipt Breakdown Form */}
                <div className="card" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <div>
                        <h3 style={{ color: 'var(--primary)', fontWeight: '800' }}>Mecora Corp.</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Global Supply Chains Inc.</p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Invoice Account:</strong>
                        <div>{selectedOrder.customer_email}</div>
                        <div>Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Purchased Formulations</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.95rem' }}>
                          <div>
                            <span style={{ fontWeight: '600' }}>{item.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>x{item.quantity}</span>
                          </div>
                          <span style={{ fontWeight: '500' }}>${parseFloat(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Total Amount Charged:</span>
                      <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>
                        ${parseFloat(selectedOrder.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                Select an order block from the master left side registry list to review transactional properties.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}