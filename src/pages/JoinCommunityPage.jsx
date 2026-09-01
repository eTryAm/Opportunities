import { useState } from 'react';
import { CommunityIdCard } from '../components/CommunityIdCard';
import { Link } from 'react-router-dom';
import { API_BASE } from '../services/publicApi';

function useDocumentTitle(title) {
  const org = 'Youth Empowerment Hub';
  document.title = title ? `${title} | ${org}` : org;
}

export function JoinCommunityPage() {
  useDocumentTitle('Join Community');
  
  const [mode, setMode] = useState('register'); // 'register' | 'login' | 'success'
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Registration form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);

  // Login form state
  const [loginId, setLoginId] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('location', location);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await fetch(`${API_BASE}/community/join`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to process community registration');
      
      setMemberData(data);
      setMode('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/community/member/${encodeURIComponent(loginId.trim())}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'No member record found for this Member ID.');
      
      setMemberData(data);
      setMode('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!memberData?.member_id) return;
    navigator.clipboard.writeText(memberData.member_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetAll = () => {
    setMode('login');
    setMemberData(null);
    setLoginId('');
    setName('');
    setPhone('');
    setLocation('');
    setPhoto(null);
    setError('');
  };

  return (
    <main className="page-content">
      <section className="section container">
        <div style={{ maxWidth: '620px', margin: '0 auto', padding: '30px 0' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '35px' }}>
            <span className="eyebrow">Youth Empowerment Hub</span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Community Membership</h1>
            {mode !== 'success' && (
              <p style={{ color: '#4b5563', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
                Join our network of ambitious youth leaders. Registered members receive an official digital membership ID card.
              </p>
            )}
          </div>

          {error && (
            <div className="admin-notice" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#f87171', marginBottom: '25px' }}>
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="login-card" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
              <form onSubmit={handleRegister} className="admin-form" style={{ marginTop: 0 }}>
                <label>
                  Full Name
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    placeholder="e.g. Rahul Sharma" 
                  />
                </label>
                <label>
                  Contact Number (Phone / WhatsApp)
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                    placeholder="e.g. +91 9876543210 or 9876543210" 
                  />
                  <small style={{ color: '#6b7280', marginTop: '2px', display: 'block' }}>
                    Used for member verification and retrieval
                  </small>
                </label>
                <label>
                  Location (City / State)
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    required 
                    placeholder="e.g. Jaipur, Rajasthan" 
                  />
                </label>
                <label>
                  Passport / Profile Photo (Optional)
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setPhoto(e.target.files[0])} 
                  />
                  <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>
                    JPEG, PNG, or WebP format (max 5MB). Displayed on your ID card.
                  </small>
                </label>

                <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                  {loading ? 'Verifying & Generating ID...' : 'Register & Generate ID Card'}
                </button>
              </form>
              
              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '12px' }}>Already a registered member?</p>
                <button type="button" className="button button-secondary" onClick={() => { setMode('login'); setError(''); }}>
                  View / Download My ID Card
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="login-card" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
              <form onSubmit={handleLogin} className="admin-form" style={{ marginTop: 0 }}>
                <label>
                  Member ID
                  <input 
                    type="text" 
                    value={loginId} 
                    onChange={e => setLoginId(e.target.value)} 
                    required 
                    placeholder="e.g. YEH-A1B2C3" 
                  />
                  <small style={{ color: '#6b7280', marginTop: '2px', display: 'block' }}>
                    Enter your 6-digit alphanumeric Member ID
                  </small>
                </label>

                <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                  {loading ? 'Verifying ID...' : 'Access My ID Card'}
                </button>
              </form>
              
              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '12px' }}>New to Youth Empowerment Hub?</p>
                <button type="button" className="button button-secondary" onClick={() => { setMode('register'); setError(''); }}>
                  Register as New Member
                </button>
              </div>
            </div>
          )}

          {mode === 'success' && memberData && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease' }}>
              
              {/* Context Notice for Existing vs New Member */}
              {memberData.alreadyMember ? (
                <div style={{ 
                  background: '#f0fdf4', 
                  color: '#166534', 
                  padding: '16px 20px', 
                  borderRadius: '10px', 
                  marginBottom: '26px', 
                  border: '1px solid #bbf7d0', 
                  width: '100%',
                  lineHeight: '1.5'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> You are already a registered member!
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#15803d' }}>
                    We verified your contact number. Your Member ID is <strong>{memberData.member_id}</strong>. You can use this ID to log in anytime or download your card below.
                  </div>
                </div>
              ) : (
                <div style={{ 
                  background: '#f0fdf4', 
                  color: '#166534', 
                  padding: '16px 20px', 
                  borderRadius: '10px', 
                  marginBottom: '26px', 
                  border: '1px solid #bbf7d0', 
                  width: '100%',
                  lineHeight: '1.5'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎉</span> Welcome to Youth Empowerment Hub!
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#15803d' }}>
                    Your registration is confirmed. Your official Member ID is <strong>{memberData.member_id}</strong>.
                  </div>
                </div>
              )}

              {/* Action Bar for Copying ID */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '10px 16px', 
                width: '100%', 
                marginBottom: '25px' 
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Member ID</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{memberData.member_id}</div>
                </div>
                <button 
                  type="button" 
                  onClick={handleCopyId}
                  className="button button-secondary"
                  style={{ minHeight: '34px', padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  {copied ? '✓ Copied!' : 'Copy ID'}
                </button>
              </div>

              {/* ID Card Component */}
              <CommunityIdCard member={memberData} />

              <div style={{ marginTop: '35px', display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="button button-secondary" onClick={resetAll}>
                  Return to Member Login
                </button>
                <Link to="/" className="button button-primary">
                  Back to Homepage
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
