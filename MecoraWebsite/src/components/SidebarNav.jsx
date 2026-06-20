import React from 'react';
import './SidebarNav.css';

export default function SidebarNav({
  currentView,
  setCurrentView,
  role,
  user,
  onLogout,
  cartCount
}) {
  const menuItems = [
    { id: 'products', label: 'Catalog', icon: '📦' },
    { id: 'cart', label: `Cart (${cartCount !== undefined ? cartCount : 0})`, icon: '🛒' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="sidebar-nav">
      <div className="sidebar-header">
        <h2 className="sidebar-title">MECORA</h2>

        <span className="sidebar-subtitle">
          {role === 'admin' ? 'Admin Hub' : 'Client Portal'}
        </span>

        <div className="customer-info">

          <div className="customer-name">
            {/* Added fallback to check Supabase's native user_metadata object directly */}
            {user?.full_name 
              ? user.full_name 
              : user?.user_metadata?.full_name
                ? user.user_metadata.full_name
                : user?.name 
                  ? user.name 
                  : user?.email 
                    ? user.email 
                    : "Loading..."}
          </div>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`menu-item ${
              currentView === item.id ? 'active' : ''
            }`}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      <button className="logout-btn" onClick={onLogout}>
        Sign Out
      </button>
    </div>
  );
}