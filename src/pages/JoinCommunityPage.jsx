import { useState, useRef } from 'react';
import { CommunityIdCard } from '../components/CommunityIdCard';
import { Link } from 'react-router-dom';

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
      const res = await fetch('/api/public/community/join', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to join community');
      
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
      const res = await fetch(`/api/public/community/member/${loginId.trim()}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch member details');
      
      setMemberData(data);
      setMode('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content">
      <section className="section container">
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 0' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="eyebrow">Youth Empowerment Hub</span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Community Member</h1>
            {mode !== 'success' && (
              <p style={{ color: '#4b5563', fontSize: '1.1rem' }}>
                Join the community to collaborate and grow. Upon registration, you will be provided with an official digital ID card.
              </p>
            )}
          </div>

          {error && (
            <div className="admin-notice" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#f87171' }}>
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="login-card" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
              <form onSubmit={handleRegister} className="admin-form" style={{ marginTop: 0 }}>
                <label>
                  Full Name
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ambrish Gupta" />
                </label>
                <label>
                  Contact Number
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 9876543210" />
                </label>
                <label>
                  Location (City/State)
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Delhi, India" />
                </label>
                <label>
                  Profile Photo (Optional)
                  <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
                  <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>Recommended for your ID card (max 5MB)</small>
                </label>

                <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                  {loading ? 'Processing...' : 'Register & Generate ID Card'}
                </button>
              </form>
              
              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '10px' }}>Already a registered member?</p>
                <button type="button" className="button button-secondary" onClick={() => { setMode('login'); setError(''); }}>
                  View my ID Card
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="login-card" style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
              <form onSubmit={handleLogin} className="admin-form" style={{ marginTop: 0 }}>
                <label>
                  Member ID
                  <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} required placeholder="YEH-XXXXXX" />
                </label>

                <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                  {loading ? 'Verifying...' : 'Access ID Card'}
                </button>
              </form>
              
              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '10px' }}>Not a member yet?</p>
                <button type="button" className="button button-secondary" onClick={() => { setMode('register'); setError(''); }}>
                  Register now
                </button>
              </div>
            </div>
          )}

          {mode === 'success' && memberData && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center', border: '1px solid #bae6fd', width: '100%' }}>
                <strong>Important:</strong> Please remember your Member ID (<strong>{memberData.member_id}</strong>) for future reference.
              </div>

              <CommunityIdCard member={memberData} />

              <div style={{ marginTop: '40px', display: 'flex', gap: '15px' }}>
                <button className="button button-secondary" onClick={() => { setMode('login'); setMemberData(null); setLoginId(''); setName(''); setPhone(''); setLocation(''); setPhoto(null); setError(''); }}>
                  Return to Login
                </button>
                <Link to="/" className="button button-primary">
                  Back to Home
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
