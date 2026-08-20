import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export function CommunityIdCard({ member }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#1a1f24',
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `YEH_ID_${member.member_id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download ID card:', err);
      alert('Could not download the ID card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      {/* Card Container */}
      <div 
        ref={cardRef}
        style={{
          width: '340px',
          height: '520px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#1a1f24',
        }}
      >
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#3b82f6', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: '#22c55e', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.3 }}></div>

        {/* Header with Logo */}
        <div style={{ padding: '24px 24px 10px', textAlign: 'center', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '5px', display: 'inline-block', marginBottom: '8px' }}>
            <img src="/logo.jpg" alt="Youth Empowerment Hub" style={{ height: '40px', display: 'block' }} crossOrigin="anonymous" />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#cbd5e1', letterSpacing: '2px', textTransform: 'uppercase' }}>Official ID Card</p>
        </div>

        {/* Photo + Name Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '20px' }}>
          <div style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '12px', 
            padding: '4px',
            background: 'linear-gradient(135deg, #3b82f6, #22c55e)',
            marginBottom: '20px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '8px',
              backgroundColor: '#2a313a',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              ) : (
                <span style={{ fontSize: '3rem', color: '#64748b' }}>{member.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          {/* Using a div instead of h2 to avoid global CSS h2 color override */}
          <div style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', color: '#ffffff', letterSpacing: '-0.02em' }}>{member.name}</div>
          <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: '20px', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            COMMUNITY MEMBER
          </span>
        </div>

        {/* Footer Details */}
        <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.4)', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Member ID</div>
              <div style={{ margin: '2px 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>{member.member_id}</div>
            </div>
            <div>
              <div style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</div>
              <div style={{ margin: '2px 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.location}</div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} disabled={downloading} className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {downloading ? 'Generating...' : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download ID Card
          </>
        )}
      </button>
    </div>
  );
}
