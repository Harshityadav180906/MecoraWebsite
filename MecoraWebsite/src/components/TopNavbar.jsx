import React from 'react';

export default function TopNavbar({ currentView, setCurrentView, role, user, onLogout, cartCount, searchQuery, setSearchQuery }) {
  const menuItems = [
    { id: 'products', label: 'Catalog', icon: '📦' },
    { id: 'cart', label: `Cart (${cartCount})`, icon: '🛒' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav style={{
      height: '70px',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      gap: '2rem',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2dd4bf', margin: 0 }}>MECORA</h2>

      {/* Unified Search Bar */}
      <input
        type="text"
        placeholder="Search components, brand identifiers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ flex: 1, maxWidth: '400px', padding: '0.6rem 1rem', borderRadius: '6px', border: 'none' }}
      />

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setCurrentView(item.id)} style={{ background: currentView === item.id ? '#1e293b' : 'transparent', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '0.8rem' }}>
        <div style={{ color: '#94a3b8' }}>Session:</div>
        <div style={{ fontWeight: '600' }}>{user?.email}</div>
      </div>

      <button onClick={onLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
        Sign Out
      </button>
    </nav>
  );
}