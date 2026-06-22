import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const styles = `
  .profile-root {
    max-width: 1200px;
    margin: 0 auto;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 0 1rem;
    box-sizing: border-box;
  }

  /* ── Admin header card ── */
  .admin-header-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .admin-header-meta h3 {
    font-size: clamp(1.2rem, 4vw, 1.6rem);
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  .admin-badge {
    background: #fee2e2;
    color: #ef4444;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    white-space: nowrap;
  }
  .admin-header-meta .name-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* ── Admin grid ── */
  .admin-grid {
    display: grid;
    grid-template-columns: 2.5fr 1fr;
    gap: 2rem;
  }
  @media (max-width: 900px) {
    .admin-grid { grid-template-columns: 1fr; }
  }

  /* ── Personal info fields grid ── */
  .fields-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.75rem 2.5rem;
  }
  @media (max-width: 600px) {
    .fields-grid { grid-template-columns: 1fr; }
    .fields-grid .full-row { grid-column: 1; }
  }

  /* ── Avatar upload button ── */
  .avatar-wrapper {
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
  }
  .avatar-wrapper img {
    display: block;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f1f5f9;
  }
  .avatar-edit-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    background: #4f46e5;
    padding: 0.35rem;
    border-radius: 50%;
    display: flex;
    border: 2px solid #ffffff;
    font-size: 10px;
    color: #ffffff;
  }
  .avatar-uploading {
    position: absolute;
    top: 35%;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #1e293b;
  }

  /* ── Section card ── */
  .section-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 2rem;
  }
  .section-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1rem;
  }

  /* ── Shared button styles ── */
  .btn {
    padding: 0.6rem 1.1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
    border: none;
    white-space: nowrap;
  }
  .btn-ghost { background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155; }
  .btn-primary { background: #4f46e5; color: #ffffff; }
  .btn-success { background: #10b981; color: #ffffff; }
  .btn-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }

  /* ── Field helpers ── */
  .field-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #94a3b8;
    display: block;
    margin-bottom: 0.35rem;
    letter-spacing: 0.05em;
  }
  .field-value {
    font-weight: 500;
    color: #334155;
    font-size: 1rem;
  }
  .field-input {
    width: 100%;
    padding: 0.5rem 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.95rem;
    box-sizing: border-box;
  }

  /* ════════════════════════════════
     CLIENT (Layout B)
  ════════════════════════════════ */
  .client-root {
    max-width: 950px;
    margin: 0 auto;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 0 1rem;
    box-sizing: border-box;
  }
  .client-card {
    background: #ffffff;
    border-radius: 24px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }
  .client-banner {
    height: 140px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  }
  .client-header {
    padding: 0 2rem;
    position: relative;
    margin-top: -52px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .client-header-left {
    display: flex;
    align-items: flex-end;
    gap: 1.25rem;
    flex-wrap: wrap;
  }
  .client-avatar {
    border-radius: 20px;
    object-fit: cover;
    border: 4px solid #ffffff;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    display: block;
  }
  .client-avatar-wrapper {
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
  }
  .client-avatar-upload-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: #4f46e5;
    color: #ffffff;
    font-size: 11px;
    padding: 0.2rem 0.45rem;
    border-radius: 8px;
    font-weight: bold;
  }
  .client-meta { margin-bottom: 0.25rem; }
  .client-meta h3 {
    font-size: clamp(1.2rem, 4vw, 1.6rem);
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  .client-meta p { color: #64748b; font-size: 0.95rem; margin: 0.25rem 0 0; }

  /* ── Client body columns ── */
  .client-body {
    padding: 2rem 2rem 2.5rem;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 3rem;
    border-top: 1px solid #f1f5f9;
  }
  @media (max-width: 680px) {
    .client-body { grid-template-columns: 1fr; gap: 2rem; padding: 1.5rem; }
    .client-header { padding: 0 1.25rem; margin-top: -44px; }
    .client-banner { height: 110px; }
  }

  .client-fields { display: flex; flex-direction: column; gap: 1.25rem; }

  @media (max-width: 480px) {
    .admin-header-card { flex-direction: column; align-items: flex-start; }
    .section-card { padding: 1.25rem; }
    .btn { font-size: 0.85rem; padding: 0.55rem 0.9rem; }
  }
`;

export default function ProfileSection({ user, role }) {
  if (!user) return null;

  const defaultMaleAvatar   = "https://itcgezjgxgfxpslopjcl.supabase.co/storage/v1/object/public/avatars/men%20avator.png";
  const defaultFemaleAvatar = "https://itcgezjgxgfxpslopjcl.supabase.co/storage/v1/object/public/avatars/female%20avator.png";
  const fallbackAvatar      = user.gender === 'female' ? defaultFemaleAvatar : defaultMaleAvatar;

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [firstName,  setFirstName]  = useState(user.first_name || '');
  const [lastName,   setLastName]   = useState(user.last_name  || '');
  const [email,      setEmail]      = useState(user.email      || '');
  const [mobile,     setMobile]     = useState(user.phone || user.mobile || '');
  const [gender,     setGender]     = useState(user.gender     || 'male');
  const [profilePhoto, setProfilePhoto] = useState(user.profile_photo || fallbackAvatar);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const fileInputRef = useRef(null);

  const parseAddressParts = (fullAddress) => {
    if (!fullAddress) return { street: '', city: 'New Delhi', country: 'India' };
    const parts = fullAddress.split(',').map(p => p.trim());
    return { street: parts[0] || '', city: parts[1] || 'New Delhi', country: parts[2] || 'India' };
  };

  const initialAddress = parseAddressParts(user.address);
  const [street,  setStreet]  = useState(initialAddress.street);
  const [city,    setCity]    = useState(initialAddress.city);
  const [country, setCountry] = useState(initialAddress.country);

  async function handleImageUpload(event) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Please select an image file to upload.');

      const file    = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data }    = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl   = data.publicUrl;
      setProfilePhoto(publicUrl);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          email:         email || user.email,
          mobile:        mobile || user.phone || null,
          address:       user.address || [street, city, country].filter(Boolean).join(', '),
          profile_photo: publicUrl,
          updated_at:    new Date().toISOString()
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

  const triggerFilePicker = () => fileInputRef.current?.click();

  async function handleUpdateProfile(section) {
    try {
      setSaving(true);
      const payload = { email: email || user.email, updated_at: new Date().toISOString() };
      if (section === 'details') {
        payload.first_name = firstName;
        payload.last_name  = lastName;
        payload.mobile     = mobile || null;
        payload.gender     = gender;
        payload.address    = [street, city, country].filter(Boolean).join(', ');
      }
      const { error: dbError } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (dbError) throw dbError;
      setIsEditingDetails(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      alert('❌ Update error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    if (!user.profile_photo || user.profile_photo === defaultMaleAvatar || user.profile_photo === defaultFemaleAvatar) {
      setProfilePhoto(selectedGender === 'female' ? defaultFemaleAvatar : defaultMaleAvatar);
    }
  };

  /* ── Reusable field renderer ── */
  const Field = ({ label, editing, value, onChange, type = 'text', fullRow = false }) => (
    <div className={fullRow ? 'full-row' : ''}>
      <label className="field-label">{label}</label>
      {editing
        ? <input type={type} className="field-input" value={value} onChange={e => onChange(e.target.value)} />
        : <div className="field-value">{value || 'Not Set'}</div>
      }
    </div>
  );

  const GenderField = ({ editing }) => (
    <div>
      <label className="field-label">GENDER (DEFAULT AVATAR)</label>
      {editing
        ? (
          <select className="field-input" value={gender} onChange={e => handleGenderChange(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        )
        : <div className="field-value" style={{ textTransform: 'capitalize' }}>{gender}</div>
      }
    </div>
  );

  const EditButtons = ({ onCancel, onSave, large = false }) => (
    isEditingDetails ? (
      <div className="btn-row">
        <button className={`btn btn-ghost`} onClick={onCancel}>Cancel</button>
        <button className={`btn ${large ? 'btn-success' : 'btn-primary'}`} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : large ? 'Confirm Changes' : 'Save'}
        </button>
      </div>
    ) : (
      <button
        className={`btn ${large ? 'btn-primary' : 'btn-ghost'}`}
        style={large ? {} : { border: '1px solid #e2e8f0' }}
        onClick={() => setIsEditingDetails(true)}
      >
        {large ? 'Update Account Settings' : 'Edit Details'}
      </button>
    )
  );

  /* ══════════════════════════════════════
     LAYOUT A — ADMIN
  ══════════════════════════════════════ */
  if (role === 'admin') {
    return (
      <>
        <style>{styles}</style>
        <div className="profile-root">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              My Admin Workspace
            </h2>
          </div>

          {/* Header card */}
          <div className="admin-header-card">
            <div className="avatar-wrapper" onClick={triggerFilePicker}>
              <img
                src={profilePhoto}
                alt="Avatar"
                style={{ width: 80, height: 80, opacity: uploading ? 0.4 : 1 }}
              />
              <div className="avatar-edit-badge">✏️</div>
              {uploading && <div className="avatar-uploading">Uploading…</div>}
            </div>

            <div className="admin-header-meta">
              <div className="name-row">
                <h3>{firstName || 'Admin'} {lastName}</h3>
                <span className="admin-badge">Root Admin</span>
              </div>
              <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                📍 {street}, {city}
              </p>
            </div>
          </div>

          {/* Info card */}
          <div className="admin-grid">
            <div className="section-card">
              <div className="section-card-header">
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  Personal Information
                </h4>
                <EditButtons
                  onCancel={() => setIsEditingDetails(false)}
                  onSave={() => handleUpdateProfile('details')}
                />
              </div>

              <div className="fields-grid">
                <Field label="FIRST NAME"    editing={isEditingDetails} value={firstName} onChange={setFirstName} />
                <Field label="LAST NAME"     editing={isEditingDetails} value={lastName}  onChange={setLastName} />
                <GenderField editing={isEditingDetails} />
                <Field label="PHONE NUMBER"  editing={isEditingDetails} value={mobile}    onChange={setMobile} />
                <Field label="EMAIL ID"      editing={isEditingDetails} value={email}     onChange={setEmail} type="email" />
                <Field label="STREET ADDRESS" editing={isEditingDetails} value={street}   onChange={setStreet} fullRow />
                <Field label="CITY"          editing={isEditingDetails} value={city}      onChange={setCity} />
                <Field label="COUNTRY"       editing={isEditingDetails} value={country}   onChange={setCountry} />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════════════
     LAYOUT B — CLIENT
  ══════════════════════════════════════ */
  return (
    <>
      <style>{styles}</style>
      <div className="client-root">
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

        <div className="client-card">
          <div className="client-banner" />

          {/* Header */}
          <div className="client-header">
            <div className="client-header-left">
              <div className="client-avatar-wrapper" onClick={triggerFilePicker}>
                <img
                  src={profilePhoto}
                  alt="Avatar"
                  className="client-avatar"
                  style={{ width: 100, height: 100, opacity: uploading ? 0.5 : 1 }}
                />
                <div className="client-avatar-upload-badge">{uploading ? '…' : 'Upload'}</div>
              </div>
              <div className="client-meta" style={{ marginBottom: '0.25rem' }}>
                <h3>{firstName || 'User'} {lastName}</h3>
                <p>{email || user.email}</p>
              </div>
            </div>

            <EditButtons
              large
              onCancel={() => setIsEditingDetails(false)}
              onSave={() => handleUpdateProfile('details')}
            />
          </div>

          {/* Body */}
          <div className="client-body">
            {/* Left col */}
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>
                Account Identity Details
              </h4>
              <div className="client-fields">
                <Field label="FIRST NAME" editing={isEditingDetails} value={firstName} onChange={setFirstName} />
                <Field label="LAST NAME"  editing={isEditingDetails} value={lastName}  onChange={setLastName} />
                <Field label="EMAIL ID"   editing={isEditingDetails} value={email}     onChange={setEmail} type="email" />
                <GenderField editing={isEditingDetails} />
                <Field label="MOBILE CONTACT NUMBER" editing={isEditingDetails} value={mobile} onChange={setMobile} />
              </div>
            </div>

            {/* Right col */}
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>
                Address Details
              </h4>
              <div className="client-fields">
                <Field label="STREET ADDRESS" editing={isEditingDetails} value={street}  onChange={setStreet} />
                <Field label="CITY"           editing={isEditingDetails} value={city}    onChange={setCity} />
                <Field label="COUNTRY"        editing={isEditingDetails} value={country} onChange={setCountry} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
