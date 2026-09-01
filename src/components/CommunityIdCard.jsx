import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { LOGO_BASE64 } from '../assets/logoBase64';

export function CommunityIdCard({ member }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Calculate resolved photo URL
  const photoSrc = member.photo_url
    ? (member.photo_url.startsWith('http://') || member.photo_url.startsWith('https://') || member.photo_url.startsWith('data:'))
      ? member.photo_url
      : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : ''}${member.photo_url}`
    : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);

      // Give 50ms for any pending paints
      await new Promise((resolve) => setTimeout(resolve, 50));

      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Crisp high-definition output
        backgroundColor: '#141922',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `YEH_ID_${member.member_id}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
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
          width: '350px',
          minHeight: '530px',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          background: 'radial-gradient(circle at 85% 15%, rgba(2, 132, 199, 0.22) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(234, 88, 12, 0.18) 0%, transparent 55%), #141922',
        }}
      >
        {/* Header with Logo + Organization Typography */}
        <div style={{ padding: '24px 20px 16px', textAlign: 'center', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Logo Frame */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            padding: '6px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            marginBottom: '10px' 
          }}>
            <img 
              src={LOGO_BASE64} 
              alt="Youth Empowerment Hub Logo" 
              style={{ width: '68px', height: '68px', objectFit: 'contain', display: 'block' }} 
            />
          </div>

          <div style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700 }}>
            Official ID Card
          </div>

          {/* Organization Name matching logo color scheme (Youth = Blue, Empowerment Hub = Orange) */}
          <div style={{ 
            margin: '6px 0 0', 
            fontSize: '1.22rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px' 
          }}>
            <span style={{ color: '#0284c7' }}>Youth</span>
            <span style={{ color: '#ea580c' }}>Empowerment Hub</span>
          </div>
        </div>

        {/* Photo + Name Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '22px 20px' }}>
          <div style={{ 
            width: '130px', 
            height: '130px', 
            borderRadius: '14px', 
            padding: '3px',
            background: 'linear-gradient(135deg, #0284c7, #ea580c)',
            marginBottom: '16px',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '11px',
              backgroundColor: '#1f2530',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {photoSrc ? (
                <img 
                  src={photoSrc} 
                  alt={member.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  crossOrigin="anonymous" 
                />
              ) : (
                <span style={{ fontSize: '2.8rem', fontWeight: 700, color: '#94a3b8' }}>
                  {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                </span>
              )}
            </div>
          </div>

          <div style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 700, textAlign: 'center', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {member.name}
          </div>
          <span style={{ 
            display: 'inline-block', 
            padding: '4px 14px', 
            background: 'rgba(2, 132, 199, 0.16)', 
            border: '1px solid rgba(2, 132, 199, 0.45)', 
            borderRadius: '20px', 
            color: '#7dd3fc', 
            fontSize: '0.74rem', 
            fontWeight: 700, 
            letterSpacing: '0.6px' 
          }}>
            COMMUNITY MEMBER
          </span>
        </div>

        {/* Footer Details */}
        <div style={{ padding: '16px 22px', background: 'rgba(10, 14, 20, 0.8)', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '14px' }}>
            <div>
              <div style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Member ID
              </div>
              <div style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {member.member_id}
              </div>
            </div>
            <div>
              <div style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Location
              </div>
              <div style={{ margin: '2px 0 0', fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleDownload} 
        disabled={downloading} 
        className="button button-primary" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}
      >
        {downloading ? 'Exporting ID Card...' : (
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
