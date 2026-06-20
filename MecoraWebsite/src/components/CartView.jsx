import React, { useState, useEffect } from 'react';

// DEFINE YOUR SERVICEABLE BOUNDARIES (Example: Service locked to India / specific states/cities)
// You can adjust these checks in the `checkServiceability` function below.
const ALLOWED_COUNTRY_CODE = 'in'; // India

export default function CartView({ cart, setCart, onCheckoutSuccess }) {
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'delivery' | 'payment'
  
  // Location & Address States
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [userAddress, setUserAddress] = useState(null); // Will hold structured address object
  const [isServiceable, setIsServiceable] = useState(true);
  
  // Checkout Details
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [specificUpiApp, setSpecificUpiApp] = useState('generic');

  // 1. AUTOMATIC LIVE LOCATION RESOLVER
  useEffect(() => {
    if (checkoutStep === 'delivery') {
      fetchLiveLocation();
    }
  }, [checkoutStep]);

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser network environment.");
      setIsServiceable(false);
      return;
    }

    setLoadingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch reverse-geocoding from OpenStreetMap free public API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'User-Agent': 'MecoraMedicalApp/1.0' } }
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addressObj = data.address;
            setUserAddress(data.display_name);

            // EVALUATE AREA SERVICEABILITY BOUNDARY
            // Example Rule: Must be within our allowed country code
            if (addressObj.country_code !== ALLOWED_COUNTRY_CODE) {
              setIsServiceable(false);
            } else {
              setIsServiceable(true);
              // AUTOMATIC DELIVERY DATE CALCULATION LOGIC
              // Example: Standard internal routing takes 3 days from current time matrix
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() + 3); 
              setDeliveryDate(targetDate.toISOString().split('T')[0]);
            }
          } else {
            setLocationError("Unable to safely resolve geocoding mapping strings.");
            setIsServiceable(false);
          }
        } catch (err) {
          setLocationError("Address translation connection exception occurred.");
          setIsServiceable(false);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        setIsServiceable(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location authorization credentials denied by user client.");
        } else {
          setLocationError("System geolocation ping processing timed out.");
        }
      }
    );
  };

  const updateQuantity = (id, amount) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQuant = item.quantity + amount;
        return nextQuant > 0 ? { ...item, quantity: nextQuant } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => {
    const discount = item.discount ? parseFloat(item.discount) : 0;
    const finalPrice = discount > 0 ? item.price * (1 - (discount / 100)) : item.price;
    return sum + (finalPrice * item.quantity);
  }, 0);

  // TRANSIT TERMINAL DEEP LINK GATEWAY
  const handleFinalSubmit = () => {
    if (!deliveryDate || !isServiceable) return;

    if (paymentMethod === 'upi') {
      const payeeAddress = "harshit.y.1809@oksbi"; 
      const payeeName = "Mecora Pharma";
      const transactionNote = "Mecora Order Supply Batch Settlement";
      const orderAmount = subtotal.toFixed(2);
      const txRefId = `MEC${Date.now()}`;

      const baseParams = `pa=${encodeURIComponent(payeeAddress)}&pn=${encodeURIComponent(payeeName)}&tn=${encodeURIComponent(transactionNote)}&am=${orderAmount}&cu=INR&tr=${txRefId}`;
      let deepLinkUrl = `upi://pay?${baseParams}`;

      if (specificUpiApp === 'gpay') deepLinkUrl = `gpay://upi/pay?${baseParams}`;
      else if (specificUpiApp === 'phonepe') deepLinkUrl = `phonepe://pay?${baseParams}`;
      else if (specificUpiApp === 'paytm') deepLinkUrl = `paytmmp://pay?${baseParams}`;

      window.location.href = deepLinkUrl;

      setTimeout(() => {
        const confirmSimulation = window.confirm(
          `Redirect instruction sent to: ${specificUpiApp.toUpperCase()} App.\n\nClick OK to simulate successful sandbox payment confirmation verification.`
        );
        if (confirmSimulation) {
          onCheckoutSuccess({ deliveryDate, paymentMethod: `UPI_${specificUpiApp.toUpperCase()}`, address: userAddress });
        }
      }, 1000);
    } else {
      onCheckoutSuccess({ deliveryDate, paymentMethod, address: userAddress });
    }
  };

  // UI Tokens
  const containerStyle = { maxWidth: '1200px', width: '92%', margin: '40px auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', textAlign: 'left' };
  const cardStyle = { background: '#ffffff', borderRadius: '12px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
  const stepIndicator = (active) => ({ flex: 1, padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px', borderBottom: active ? '3px solid #0f766e' : '3px solid #e2e8f0', color: active ? '#0f766e' : '#94a3b8' });

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* PROGRESS FLOW STEP BAR */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', padding: '10px 20px', border: '1px solid #e2e8f0' }}>
          <div style={stepIndicator(checkoutStep === 'cart')}>1. Review Basket</div>
          <div style={stepIndicator(checkoutStep === 'delivery')}>2. Schedule Logistics</div>
          <div style={stepIndicator(checkoutStep === 'payment')}>3. Settlement Terminal</div>
        </div>

        {/* STEP 1: BASKET OVERVIEW */}
        {checkoutStep === 'cart' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Your Medication Order Basket</h2>
            {cart.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>Your cart is empty. Explore the medical catalog to add lines.</p>
            ) : (
              cart.map(item => {
                const disc = item.discount ? parseFloat(item.discount) : 0;
                const finalP = disc > 0 ? item.price * (1 - (disc / 100)) : item.price;
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>{item.name}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Salt: {item.salt || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '24px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>-</button>
                      <span style={{ fontWeight: '600', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+</button>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontWeight: '700' }}>₹{(finalP * item.quantity).toFixed(1)}</div>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>Remove</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* STEP 2: LIVE LOCATION SCREEN & CONDITIONALS */}
        {checkoutStep === 'delivery' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Logistics Delivery Routing</h2>
            
            {loadingLocation ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#0f766e', fontWeight: '600' }}>
                Acquiring live location coordinates and checking network routing maps...
              </div>
            ) : !isServiceable ? (
              /* CRITICAL SERVICE UN-AVAILABLE NOTICE SCREEN */
              <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                <h1 style={{ color: '#ef4444', fontSize: '22px', fontWeight: '800', margin: '0 0 12px 0' }}>We are Working Hard to Provide Service that Your Area</h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>Currently outside the distribution network boundaries. {locationError}</p>
                <button onClick={fetchLiveLocation} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Retry Geolocation Ping</button>
              </div>
            ) : (
              /* SERVICEABLE CONFIRMED REGION VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>LOCATION ACQUIRED</span>
                  <p style={{ fontSize: '14px', margin: '8px 0 0 0', color: '#1e293b', fontWeight: '500' }}><strong>Auto-Selected Address:</strong><br/>{userAddress || 'Locating network site...'}</p>
                </div>

                <div style={{ maxWidth: '340px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Calculated Arrival Window Date</label>
                  <input 
                    type="date" 
                    value={deliveryDate} 
                    disabled
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f1f5f9', color: '#334155', fontWeight: '600', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Delivery date configured automatically based on warehouse dispatch proximity calculations.</small>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PAYMENT SCREEN */}
        {checkoutStep === 'payment' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Secure Settlement Terminal</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Select an authorized transactional protocol to conclude order lines.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', background: paymentMethod === 'upi' ? '#f0fdf4' : '#fff', borderColor: paymentMethod === 'upi' ? '#bbf7d0' : '#e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: paymentMethod === 'upi' ? '16px' : '0' }}>
                  <input type="radio" name="pay" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f766e' }}>⚡ Live UPI Mobile App Deep-Linking Gateway</div>
                  </div>
                </label>

                {paymentMethod === 'upi' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', paddingLeft: '24px' }}>
                    <button onClick={() => setSpecificUpiApp('generic')} style={{ padding: '10px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', border: specificUpiApp === 'generic' ? '2px solid #0f766e' : '1px solid #cbd5e1', background: '#fff' }}>System Chooser</button>
                    <button onClick={() => setSpecificUpiApp('gpay')} style={{ padding: '10px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', border: specificUpiApp === 'gpay' ? '2px solid #4285F4' : '1px solid #cbd5e1', background: '#fff', color: specificUpiApp === 'gpay' ? '#4285F4' : '#000' }}>🔵 Google Pay</button>
                    <button onClick={() => setSpecificUpiApp('phonepe')} style={{ padding: '10px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', border: specificUpiApp === 'phonepe' ? '2px solid #5f259f' : '1px solid #cbd5e1', background: '#fff', color: specificUpiApp === 'phonepe' ? '#5f259f' : '#000' }}>🟣 PhonePe</button>
                    <button onClick={() => setSpecificUpiApp('paytm')} style={{ padding: '10px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer', border: specificUpiApp === 'paytm' ? '2px solid #00baf2' : '1px solid #cbd5e1', background: '#fff', color: specificUpiApp === 'paytm' ? '#00baf2' : '#000' }}>🔵 Paytm</button>
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: paymentMethod === 'card' ? '#f0fdf4' : '#fff' }}>
                <input type="radio" name="pay" checked={paymentMethod === 'card'} onChange={() => { setPaymentMethod('card'); setSpecificUpiApp('generic'); }} />
                <div><div style={{ fontWeight: '600', fontSize: '14px' }}>Corporate Credit/Debit Card Network</div></div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', background: paymentMethod === 'cod' ? '#f0fdf4' : '#fff' }}>
                <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => { setPaymentMethod('cod'); setSpecificUpiApp('generic'); }} />
                <div><div style={{ fontWeight: '600', fontSize: '14px' }}>Pay on Collection Dispatch (COD)</div></div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* PERSISTENT SUMMARY SIDEBAR */}
      <div style={{ ...cardStyle, height: 'fit-content' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Order Pipeline Summary</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
          <span>Allocated Volume:</span>
          <span>{cart.reduce((s, i) => s + i.quantity, 0)} units</span>
        </div>
        
        {isServiceable && deliveryDate && checkoutStep !== 'cart' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
            <span>Target Delivery:</span>
            <span style={{ fontWeight: '600', color: '#0f766e' }}>{deliveryDate}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '15px', fontWeight: '700', color: '#0f172a', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <span>Estimated Settlement:</span>
          <span>₹{subtotal.toFixed(1)}</span>
        </div>

        {/* WORKFLOW NAVIGATION FOOTER TRIGGER BUTTONS */}
        {checkoutStep === 'cart' && (
          <button 
            onClick={() => setCheckoutStep('delivery')}
            disabled={cart.length === 0}
            style={{ width: '100%', height: '44px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: cart.length > 0 ? 'pointer' : 'not-allowed', opacity: cart.length > 0 ? 1 : 0.6 }}
          >
            Confirm Order & Choose Date
          </button>
        )}

        {checkoutStep === 'delivery' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCheckoutStep('cart')} style={{ flex: 1, height: '40px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Back</button>
            <button 
              onClick={() => setCheckoutStep('payment')} 
              disabled={!isServiceable || loadingLocation || !deliveryDate}
              style={{ flex: 2, height: '40px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: (isServiceable && !loadingLocation && deliveryDate) ? 'pointer' : 'not-allowed', opacity: (isServiceable && !loadingLocation && deliveryDate) ? 1 : 0.5 }}
            >
              Proceed to Payment
            </button>
          </div>
        )}

        {checkoutStep === 'payment' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCheckoutStep('delivery')} style={{ flex: 1, height: '40px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Back</button>
            <button 
              onClick={handleFinalSubmit} 
              style={{ flex: 2, height: '40px', background: paymentMethod === 'upi' ? '#0f766e' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              {paymentMethod === 'upi' ? `⚡ Open ${specificUpiApp.toUpperCase()} & Pay` : 'Confirm Order & Pay'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}