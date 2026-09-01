import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

export function CommunityIdCard({ member }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [cachedPhotoUrl, setCachedPhotoUrl] = useState('');

  // Calculate resolved photo URL
  const resolvedPhotoSrc = member.photo_url
    ? (member.photo_url.startsWith('http://') || member.photo_url.startsWith('https://') || member.photo_url.startsWith('data:'))
      ? member.photo_url
      : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : ''}${member.photo_url}`
    : null;

  // Pre-load logo and convert to Base64 DataURL for 100% reliable canvas export
  useEffect(() => {
    let isMounted = true;
    
    // Convert static logo to DataURL
    const fetchLogo = async () => {
      try {
        const res = await fetch('/logo.jpg');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && reader.result) {
            setLogoDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        if (isMounted) setLogoDataUrl('/logo.jpg');
      }
    };

    // Pre-cache member photo if available
    const fetchPhoto = async () => {
      if (!resolvedPhotoSrc) return;
      try {
        const res = await fetch(resolvedPhotoSrc, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted && reader.result) {
              setCachedPhotoUrl(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        } else {
          if (isMounted) setCachedPhotoUrl(resolvedPhotoSrc);
        }
      } catch (e) {
        if (isMounted) setCachedPhotoUrl(resolvedPhotoSrc);
      }
    };

    fetchLogo();
    fetchPhoto();

    return () => { isMounted = false; };
  }, [resolvedPhotoSrc]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);

      // Brief delay to ensure render tree has repainted
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High-DPI crisp export
        backgroundColor: null,
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

  const finalPhotoSrc = cachedPhotoUrl || resolvedPhotoSrc;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      {/* Card Container */}
      <div 
        ref={cardRef}
        style={{
          width: '350px',
          minHeight: '540px',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          backgroundColor: '#161b22',
        }}
      >
        {/* Decorative ambient gradients */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '170px', height: '170px', background: '#38bdf8', borderRadius: '50%', filter: 'blur(55px)', opacity: 0.45 }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', background: '#34d399', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.35 }}></div>

        {/* Header with Logo + Organization Typography */}
        <div style={{ padding: '22px 20px 14px', textAlign: 'center', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '10px', 
            padding: '7px 14px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            marginBottom: '10px' 
          }}>
            <img 
              src={logoDataUrl || '/logo.jpg'} 
              alt="Youth Empowerment Hub Logo" 
              style={{ height: '54px', width: 'auto', maxWidth: '170px', objectFit: 'contain', display: 'block' }} 
              crossOrigin="anonymous" 
            />
          </div>
          <div style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700 }}>
            Official ID Card
          </div>
          <div style={{ 
            margin: '4px 0 0', 
            fontSize: '1.05rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            color: '#38bdf8' 
          }}>
            Youth Empowerment Hub
          </div>
        </div>

        {/* Photo + Name Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '20px' }}>
          <div style={{ 
            width: '135px', 
            height: '135px', 
            borderRadius: '14px', 
            padding: '3px',
            background: 'linear-gradient(135deg, #38bdf8, #34d399)',
            marginBottom: '16px',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.55)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '11px',
              backgroundColor: '#21262d',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {finalPhotoSrc ? (
                <img 
                  src={finalPhotoSrc} 
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
            background: 'rgba(56, 189, 248, 0.16)', 
            border: '1px solid rgba(56, 189, 248, 0.45)', 
            borderRadius: '20px', 
            color: '#7dd3fc', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            letterSpacing: '0.6px' 
          }}>
            COMMUNITY MEMBER
          </span>
        </div>

        {/* Footer Details */}
        <div style={{ padding: '18px 22px', background: 'rgba(10, 14, 20, 0.75)', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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

      <button onClick={handleDownload} disabled={downloading} className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
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
