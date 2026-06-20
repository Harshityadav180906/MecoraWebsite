import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function ProfileSection({ user, role }) {
  if (!user) return null;

  // ==========================================
  // STEP 1: PLACE YOUR COPIED STORAGE URLS HERE
  // ==========================================
  const defaultMaleAvatar = "https://itcgezjgxgfxpslopjcl.supabase.co/storage/v1/object/public/avatars/men%20avator.png"; 
  const defaultFemaleAvatar = "https://itcgezjgxgfxpslopjcl.supabase.co/storage/v1/object/public/avatars/female%20avator.png";

  // Determine fallback image based on saved database preference
  const fallbackAvatar = user.gender === 'female' ? defaultFemaleAvatar : defaultMaleAvatar;

  // --- Operational States ---
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [mobile, setMobile] = useState(user.phone || user.mobile || '');
  const [gender, setGender] = useState(user.gender || 'male');

  // Tracks the current photo preview. Uses fallback if database field is empty.
  const [profilePhoto, setProfilePhoto] = useState(user.profile_photo || fallbackAvatar);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Address Parsing helper
  const parseAddressParts = (fullAddress) => {
    if (!fullAddress) return { street: '', city: 'New Delhi', country: 'India' };
    const parts = fullAddress.split(',').map(p => p.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || 'New Delhi',
      country: parts[2] || 'India'
    };
  };

  const initialAddress = parseAddressParts(user.address);
  const [street, setStreet] = useState(initialAddress.street);
  const [city, setCity] = useState(initialAddress.city);
  const [country, setCountry] = useState(initialAddress.country);

  // --- File Upload Processing ---
  // NOTE: there was previously a duplicate copy of this function further down
  // in the file. JS silently keeps only the LAST declaration, which is why
  // adding `email` to the second copy didn't fix the `mobile` NOT NULL error —
  // the fix needed to go into the copy that was actually running, and it still
  // didn't include `mobile`. That duplicate has been removed; this is the only
  // copy now, and it includes every NOT NULL column your `profiles` table needs.
  async function handleImageUpload(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select an image file to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file directly to 'avatars' Storage Bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Retrieve the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Instantly update the UI preview
      setProfilePhoto(publicUrl);

      // Save the public URL link directly to the profiles database table row.
      // NOTE: this used to be .upsert(..., { onConflict: 'id' }), but upsert
      // always attempts an INSERT first and only falls back to UPDATE if the
      // *named* conflict column (id) collides. Postgres still checks every
      // OTHER unique constraint (like `mobile`) during that insert attempt —
      // so even saving a row back to its own unchanged mobile number threw
      // "duplicate key value violates unique constraint profiles_mobile_key".
      // Since every user already has a profiles row (created at signup),
      // there's no real need to insert here — a plain update() never
      // attempts an insert, so it can't trigger that false conflict.
      // TEMP DEBUG — remove once the mobile duplicate-key issue is resolved.
      console.log('Uploading avatar for user.id:', user.id);
      console.log('Payload being sent:', {
        email: email || user.email,
        mobile: mobile || user.phone || null,
        address: user.address || [street, city, country].filter(Boolean).join(', '),
        profile_photo: publicUrl
      });

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          email: email || user.email,
          mobile: mobile || user.phone || null,
          address: user.address || [street, city, country].filter(Boolean).join(', '),
          profile_photo: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      alert('📸 New avatar uploaded and saved successfully!');
    } catch (error) {
      alert('❌ Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- Profile Details Save Handler ---
  // This was referenced by the Save/Confirm buttons but was never defined in
  // the original file, which would throw a ReferenceError as soon as someone
  // clicked Save. Added here so editing actually persists to the database.
  // Saves first name, last name, email, mobile, gender, and address together.
  // Uses update() rather than upsert() — see the note in handleImageUpload
  // above for why upsert can falsely throw a mobile unique-constraint error.
  async function handleUpdateProfile(section) {
    try {
      setSaving(true);

      const payload = {
        email: email || user.email,
        updated_at: new Date().toISOString()
      };

      if (section === 'details') {
        payload.first_name = firstName;
        payload.last_name = lastName;
        payload.mobile = mobile || null;
        payload.gender = gender;
        payload.address = [street, city, country].filter(Boolean).join(', ');
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (dbError) throw dbError;

      setIsEditingDetails(false);

      alert('✅ Profile updated successfully!');
    } catch (error) {
      alert('❌ Update error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Automatically update avatar view if gender drops back to default options
  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    if (!user.profile_photo || user.profile_photo === defaultMaleAvatar || user.profile_photo === defaultFemaleAvatar) {
      setProfilePhoto(selectedGender === 'female' ? defaultFemaleAvatar : defaultMaleAvatar);
    }
  };

  /* ==========================================
      LAYOUT A: SYSTEM ADMINISTRATOR PORTAL PROFILE
     ========================================== */
  if (role === 'admin') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>My Admin Workspace</h2>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={triggerFilePicker}>
            <img src={profilePhoto} alt="Avatar" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f1f5f9', opacity: uploading ? 0.4 : 1 }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4f46e5', padding: '0.35rem', borderRadius: '50%', display: 'flex', border: '2px solid #ffffff' }}>
              <span style={{ fontSize: '10px', color: '#ffffff' }}>✏️</span>
            </div>
            {uploading && <div style={{ position: 'absolute', top: '35%', left: '15%', fontSize: '0.75rem', fontWeight: '700' }}>Uploading...</div>}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{firstName || 'Admin'} {lastName}</h3>
              <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>Root Admin</span>
            </div>
            <p style={{ color: '#64748b', margin: '0.5rem 0 0 0' }}>📍 {street}, {city}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>Personal Information</h4>
              {!isEditingDetails ? (
                <button onClick={() => setIsEditingDetails(true)} style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Edit Details</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setIsEditingDetails(false)} style={{ backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleUpdateProfile('details')} disabled={saving} style={{ backgroundColor: '#4f46e5', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem 2.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>FIRST NAME</label>
                {isEditingDetails ? <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{firstName || 'Not Set'}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>LAST NAME</label>
                {isEditingDetails ? <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{lastName || 'Not Set'}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>GENDER (DEFAULT PHOTO PREFERENCE)</label>
                {isEditingDetails ? (
                  <select value={gender} onChange={e => handleGenderChange(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <div style={{ marginTop: '0.35rem', textTransform: 'capitalize', fontWeight: '500' }}>{gender}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>PHONE NUMBER</label>
                {isEditingDetails ? <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{mobile || 'Not Set'}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>EMAIL ID</label>
                {isEditingDetails ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{email || 'Not Set'}</div>}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>STREET ADDRESS</label>
                {isEditingDetails ? <input type="text" value={street} onChange={e => setStreet(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{street || 'Not Set'}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>CITY</label>
                {isEditingDetails ? <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{city || 'Not Set'}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>COUNTRY</label>
                {isEditingDetails ? <input type="text" value={country} onChange={e => setCountry(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <div style={{ marginTop: '0.35rem', fontWeight: '500' }}>{country || 'Not Set'}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================
      LAYOUT B: CLIENT CUSTOMER ACCOUNT PROFILE
     ========================================== */
  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

      <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: '160px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }} />

        <div style={{ padding: '0 3rem', position: 'relative', marginTop: '-48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.75rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={triggerFilePicker}>
              <img src={profilePhoto} alt="Avatar" style={{ width: '110px', height: '110px', borderRadius: '20px', objectFit: 'cover', border: '4px solid #ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', opacity: uploading ? 0.5 : 1 }} />
              <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: '#4f46e5', color: '#ffffff', fontSize: '11px', padding: '0.25rem 0.5rem', borderRadius: '8px', fontWeight: 'bold' }}>
                {uploading ? '...' : 'Upload'}
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{firstName || 'User'} {lastName}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>{email || user.email}</p>
            </div>
          </div>

          {!isEditingDetails ? (
            <button onClick={() => setIsEditingDetails(true)} style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Update Account Settings</button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setIsEditingDetails(false)} style={{ backgroundColor: '#f1f5f9', padding: '0.75rem 1.5rem', borderRadius: '12px', color: '#64748b', cursor: 'pointer', border: '1px solid #cbd5e1' }}>Cancel</button>
              <button onClick={() => handleUpdateProfile('details')} disabled={saving} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Confirm Changes'}</button>
            </div>
          )}
        </div>

        <div style={{ padding: '0 3rem 3rem 3rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.5rem 0' }}>Account Identity Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>FIRST NAME</span>
                {isEditingDetails ? <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{firstName || 'Not Set'}</span>}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>LAST NAME</span>
                {isEditingDetails ? <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{lastName || 'Not Set'}</span>}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>EMAIL ID</span>
                {isEditingDetails ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{email || 'Not Set'}</span>}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>GENDER (DEFAULT AVATAR CHOSEN)</span>
                {isEditingDetails ? (
                  <select value={gender} onChange={e => handleGenderChange(e.target.value)} style={{ width: '100%', marginTop: '0.35rem', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                ) : (
                  <span style={{ display: 'block', marginTop: '0.25rem', textTransform: 'capitalize', fontWeight: '500' }}>{gender}</span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>MOBILE CONTACT NUMBER</span>
                {isEditingDetails ? <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{mobile || 'Not Set'}</span>}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.5rem 0' }}>Address Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>STREET ADDRESS</span>
                {isEditingDetails ? <input type="text" value={street} onChange={e => setStreet(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{street || 'Not Set'}</span>}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>CITY</span>
                {isEditingDetails ? <input type="text" value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{city || 'Not Set'}</span>}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>COUNTRY</span>
                {isEditingDetails ? <input type="text" value={country} onChange={e => setCountry(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} /> : <span style={{ display: 'block', fontSize: '1rem', color: '#334155', marginTop: '0.25rem' }}>{country || 'Not Set'}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}