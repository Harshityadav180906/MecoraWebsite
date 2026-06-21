import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import CartView from './components/CartView';
import OrdersView from './components/OrdersView';
import ProfileSection from './components/ProfileSection';
import './App.css'; 

const slidingImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=80"
];

// ==========================================
// Responsive styles for the auth (sign-in / register) screen.
// Inline `style={{}}` props can't contain media queries, so the layout
// that needs to *change shape* at breakpoints (two columns -> stacked,
// large padding -> compact padding, big type -> smaller type) lives here
// instead, scoped under .auth-page so it can't leak into the rest of the
// app. Anything that depends on component state (the sliding background
// image, the active dot) stays as an inline style since CSS can't read
// React state.
// ==========================================
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

  .auth-headline span {
    color: #4f46e5;
  }

  .auth-dots {
    display: flex;
    gap: 0.6rem;
  }

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
    min-width: 0; /* prevents flex children from forcing horizontal overflow */
  }

  .auth-right h2 {
    font-size: 2.1rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .auth-form input {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.85rem 1.1rem;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .auth-address-row {
    display: flex;
    gap: 6px;
  }

  .auth-address-row input {
    flex: 1;
    min-width: 0;
  }

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

  .auth-toggle {
    margin-top: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }

  .auth-toggle span {
    color: #4f46e5;
    cursor: pointer;
  }

  /* ---------- Tablet ---------- */
  @media (max-width: 860px) {
    .auth-page {
      padding: 1.25rem;
    }
    .auth-left {
      padding: 3rem 2.25rem;
    }
    .auth-right {
      padding: 2.5rem;
    }
    .auth-headline {
      font-size: 2.25rem;
    }
  }

  /* ---------- Phone: stack the two panels ---------- */
  @media (max-width: 640px) {
    .auth-page {
      padding: 0;
      align-items: flex-start;
    }
    .auth-card {
      flex-direction: column;
      max-width: 100%;
      border-radius: 0;
      min-height: 100vh;
    }
    .auth-left {
      border-right: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding: 2.25rem 1.5rem;
      gap: 2rem;
    }
    .auth-headline {
      font-size: 1.85rem;
    }
    .auth-right {
      padding: 2rem 1.5rem 2.5rem 1.5rem;
    }
    .auth-right h2 {
      font-size: 1.6rem;
    }
    .auth-address-row {
      flex-wrap: wrap;
    }
    .auth-gps-btn {
      width: 100%;
      padding: 0.85rem 1rem;
    }
  }

  /* ---------- Very small phones ---------- */
  @media (max-width: 380px) {
    .auth-left {
      padding: 1.75rem 1.25rem;
    }
    .auth-right {
      padding: 1.75rem 1.25rem 2.25rem 1.25rem;
    }
    .auth-brand {
      font-size: 1.25rem;
    }
    .auth-headline {
      font-size: 1.55rem;
    }
  }
`;

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState(''); 
  const [address, setAddress] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  const [currentView, setCurrentView] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [localCategory, setLocalCategory] = useState('All');

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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        getProfileData(session.user);
      } else {
        setUser(null);
        setRole('customer');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function getProfileData(authUser) {
    try {
      if (!authUser) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      const meta = authUser.user_metadata || {};

      if (data) {
        setUser({ 
          ...authUser, 
          ...data,
          first_name: data.first_name || meta.first_name || data.full_name?.split(' ')[0] || 'Operator',
          full_name: data.full_name || meta.full_name || authUser.email
        });
        setRole(data.role || 'customer');
      } else {
        setUser({
          ...authUser,
          first_name: meta.first_name || meta.full_name?.split(' ')[0] || 'Operator',
          full_name: meta.full_name || authUser.email
        });
        setRole('customer');
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
      .from('products')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) setProducts(data);
  }

  async function fetchOrders() {
    if (!user) return;
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (role === 'customer') {
      query = query.eq('customer_email', user.email);
    }
    const { data, error } = await query;
    if (!error && data) setOrders(data);
  }

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      return alert("Geolocation features are not supported by this browser interface.");
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`Lat: ${latitude}, Lon: ${longitude}`);
          }
        } catch (err) {
          setAddress(`Lat: ${latitude}, Lon: ${longitude}`);
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        alert(`Location Error: ${error.message}`);
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
        const currentFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const sanitizedEmail = email.trim();
        const sanitizedMobile = mobile.trim();

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password: password,
          options: {
            data: { 
              first_name: firstName.trim(), 
              last_name: lastName.trim(), 
              full_name: currentFullName, 
              phone: sanitizedMobile, 
              address: address.trim() 
            }
          }
        });
        if (signUpError) throw signUpError;

        if (authData?.user) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: sanitizedEmail,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: currentFullName,
              phone: sanitizedMobile, 
              address: address.trim()
            });
            
          if (upsertError) throw upsertError;
        }

        setFirstName('');
        setLastName('');
        setMobile('');
        setAddress('');
        setEmail('');
        setPassword('');
        setLoginIdentifier(sanitizedEmail);
        setIsRegistering(false);
        alert("🎉 Account created successfully! Please sign in.");
      } else {
        let targetEmail = loginIdentifier.trim();
        
        if (!targetEmail.includes('@')) {
          const { data: pRec, error: phoneErr } = await supabase
            .from('profiles')
            .select('email')
            .eq('phone', targetEmail)
            .maybeSingle();
            
          if (phoneErr || !pRec) throw new Error("No account linked to this mobile number.");
          targetEmail = pRec.email;
        }
        
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: targetEmail, 
          password: password 
        });
        if (signInError) throw new Error("Invalid login details.");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    setSearchQuery('');
    setCurrentView('products');
  };

  async function handleCheckout(totalPrice, paymentMethod, deliveryTimeline) {
    if (!user) return;
    const { error: orderError } = await supabase.from('orders').insert([
      { customer_email: user.email, total_price: parseFloat(totalPrice), items: cart, payment_method: paymentMethod, delivery_timeline: deliveryTimeline, status: 'Processing' }
    ]);
    if (orderError) return alert(orderError.message);

    alert("🎉 Order processed successfully!");
    setCart([]);
    fetchProducts();
    fetchOrders();
    setCurrentView('orders');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '1.5rem', boxSizing: 'border-box', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '2px dashed #cbd5e1', borderTop: '2px solid #4f46e5', borderBottom: '2px solid #4f46e5', borderRadius: '50%', animation: 'propellerSpin 0.8s cubic-bezier(0.4, 0.1, 0.3, 1) infinite', marginBottom: '1.25rem' }} />
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0', letterSpacing: '0.5px' }}>MECORA</h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Connecting Core Nodes...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <style>{authResponsiveStyles}</style>

        {/* Background image swap stays inline since it depends on React state */}
        <div
          className="auth-bg"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(241,245,249,0.85) 100%), url("${slidingImages[currentImageIndex]}")`
          }}
        />

        <div className="auth-card">
          <div className="auth-left">
            <div><span className="auth-brand">MECORA</span></div>
            <div>
              <h1 className="auth-headline">Capturing Moments,<br /><span>Creating Systems.</span></h1>
            </div>
            <div className="auth-dots">
              {slidingImages.map((_, idx) => (
                <div key={idx} className={`auth-dot ${idx === currentImageIndex ? 'active' : ''}`} />
              ))}
            </div>
          </div>

          <div className="auth-right">
            <h2>{isRegistering ? 'Create an account' : 'Welcome back'}</h2>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              {!isRegistering ? (
                <input type="text" placeholder="Email or Mobile" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required />
              ) : (
                <>
                  <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  <input type="text" placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} required />

                  <div className="auth-address-row">
                    <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required />
                    <button type="button" onClick={fetchLiveLocation} className="auth-gps-btn">
                      {locLoading ? '🛰️...' : '📍 GPS'}
                    </button>
                  </div>
                </>
              )}
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" className="auth-submit">{isRegistering ? 'Register' : 'Sign In'}</button>
            </form>
            <p className="auth-toggle">
              <span onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Already have an account? Sign In' : 'New operator? Register here'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout" style={{ paddingBottom: '70px' }}> {/* Gives room for the bottom navbar on mobile */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
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
        <div style={{ width: '100%', margin: '0', boxSizing: 'border-box' }}>
          {currentView === 'products' && (
            role === 'admin' ? (
              <AdminDashboard products={products} orders={orders} fetchProducts={fetchProducts} />
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
            )
          )}

          {currentView === 'categories' && (
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

          {currentView === 'cart' && <CartView cart={cart} setCart={setCart} products={products} handleCheckout={handleCheckout} />}
          {currentView === 'orders' && <OrdersView role={role} orders={orders} fetchOrders={fetchOrders} />}
          {currentView === 'profile' && <ProfileSection user={user} role={role} />}
        </div>
      </main>
    </div>
  );
}
