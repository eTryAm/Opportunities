import { useRef, useState, useEffect } from 'react';
import { LOGO_BASE64 } from '../assets/logoBase64';

// Helper function to draw rounded rectangles on standard 2D canvas
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function CommunityIdCard({ member }) {
  const [downloading, setDownloading] = useState(false);
  const previewCanvasRef = useRef(null);

  // Calculate resolved photo URL
  const photoSrc = member.photo_url
    ? (member.photo_url.startsWith('http://') || member.photo_url.startsWith('https://') || member.photo_url.startsWith('data:'))
      ? member.photo_url
      : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : ''}${member.photo_url}`
    : null;

  // Pre-render logo on preview canvas
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = LOGO_BASE64;

    return () => {
      active = false;
    };
  }, []);

  // Direct Native 2D Canvas Generator - 100% Guaranteed Export with Zero Library Bugs
  const handleDownload = async () => {
    try {
      setDownloading(true);

      // 1. Create High-Resolution Export Canvas (700 x 1060, 2x Retina Quality)
      const canvas = document.createElement('canvas');
      canvas.width = 700;
      canvas.height = 1060;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 2. Pre-load Images
      const logoImg = new Image();
      const logoPromise = new Promise((resolve) => {
        logoImg.onload = () => resolve(logoImg);
        logoImg.onerror = () => resolve(null);
        logoImg.src = LOGO_BASE64;
      });

      let photoImg = null;
      if (photoSrc) {
        const pImg = new Image();
        pImg.crossOrigin = 'anonymous';
        photoImg = await new Promise((resolve) => {
          pImg.onload = () => resolve(pImg);
          pImg.onerror = () => resolve(null);
          pImg.src = photoSrc;
        });
      }

      await logoPromise;

      // 3. Draw Outer Card with Rounded Corners Clip
      drawRoundedRect(ctx, 0, 0, 700, 1060, 36);
      ctx.save();
      ctx.clip();

      // Base Background
      ctx.fillStyle = '#141922';
      ctx.fillRect(0, 0, 700, 1060);

      // Ambient Lighting (Top Right Blue + Bottom Left Orange)
      const g1 = ctx.createRadialGradient(620, 140, 0, 620, 140, 480);
      g1.addColorStop(0, 'rgba(2, 132, 199, 0.28)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, 700, 1060);

      const g2 = ctx.createRadialGradient(100, 920, 0, 100, 920, 480);
      g2.addColorStop(0, 'rgba(234, 88, 12, 0.22)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, 700, 1060);

      // Header Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 275);
      ctx.lineTo(700, 275);
      ctx.stroke();

      // 4. Draw White Box for Logo
      const boxW = 160;
      const boxH = 160;
      const boxX = (700 - boxW) / 2; // 270
      const boxY = 32;

      ctx.save();
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 24);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      ctx.fill();
      ctx.restore();

      // Draw Logo Image inside the White Box
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const pad = 10;
        ctx.drawImage(logoImg, boxX + pad, boxY + pad, boxW - 2 * pad, boxH - 2 * pad);
      }

      // 5. Header Texts
      // "OFFICIAL ID CARD"
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 15px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('O F F I C I A L   I D   C A R D', 350, 226);

      // "Youth Empowerment Hub" (Exact logo branding colors: Youth = Blue, Empowerment Hub = Orange)
      ctx.font = '800 24px "Inter", -apple-system, sans-serif';
      const youthText = 'Youth ';
      const hubText = 'Empowerment Hub';
      const youthW = ctx.measureText(youthText).width;
      const hubW = ctx.measureText(hubText).width;
      const totalW = youthW + hubW;
      const startX = (700 - totalW) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0284c7'; // Royal Blue
      ctx.fillText(youthText, startX, 258);
      ctx.fillStyle = '#ea580c'; // Vibrant Orange
      ctx.fillText(hubText, startX + youthW, 258);

      // 6. Photo Frame / Avatar Section
      const frameSize = 250;
      const frameX = (700 - frameSize) / 2; // 225
      const frameY = 315;

      // Outer Gradient Border
      ctx.save();
      drawRoundedRect(ctx, frameX, frameY, frameSize, frameSize, 28);
      const frameGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameSize, frameY + frameSize);
      frameGrad.addColorStop(0, '#0284c7');
      frameGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = frameGrad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 6;
      ctx.fill();
      ctx.restore();

      // Inner Photo Container
      const innerSize = 238;
      const innerX = frameX + 6; // 231
      const innerY = frameY + 6; // 321
      drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, 22);
      ctx.fillStyle = '#1f2530';
      ctx.fill();

      // Draw Photo or Initials
      if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
        ctx.save();
        drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, 22);
        ctx.clip();
        ctx.drawImage(photoImg, innerX, innerY, innerSize, innerSize);
        ctx.restore();
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 96px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const initial = member.name ? member.name.charAt(0).toUpperCase() : 'M';
        ctx.fillText(initial, 350, innerY + 155);
      }

      // 7. Member Name
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 32px "Inter", -apple-system, sans-serif';
      ctx.fillText(member.name || 'Community Member', 350, 622);

      // 8. "COMMUNITY MEMBER" Badge
      const badgeW = 250;
      const badgeH = 42;
      const badgeX = (700 - badgeW) / 2;
      const badgeY = 648;

      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 21);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '700 14px "Inter", -apple-system, sans-serif';
      ctx.fillText('COMMUNITY MEMBER', 350, badgeY + 27);

      // 9. Footer Section
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 915);
      ctx.lineTo(700, 915);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
      ctx.fillRect(0, 915, 700, 145);

      // Left: Member ID
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px "Inter", -apple-system, sans-serif';
      ctx.fillText('MEMBER ID', 55, 962);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 24px monospace';
      ctx.fillText(member.member_id || 'YEH-000000', 55, 1004);

      // Right: Location
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px "Inter", -apple-system, sans-serif';
      ctx.fillText('LOCATION', 420, 962);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 22px "Inter", -apple-system, sans-serif';
      ctx.fillText(member.location || 'India', 420, 1004);

      // Restore outer clip
      ctx.restore();

      // 10. Outer Card Stroke
      drawRoundedRect(ctx, 1, 1, 698, 1058, 36);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 11. Trigger Instant PNG Download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate PNG image');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `YEH_ID_${member.member_id}.png`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');

    } catch (err) {
      console.error('Failed to generate ID card:', err);
      alert('Could not download the ID card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      {/* Visual Card Component for Web Preview */}
      <div 
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
            padding: '5px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            marginBottom: '10px',
            width: '84px',
            height: '84px'
          }}>
            <canvas 
              ref={previewCanvasRef} 
              width={160} 
              height={160} 
              style={{ width: '74px', height: '74px', display: 'block', borderRadius: '8px' }} 
            />
          </div>

          <div style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700 }}>
            Official ID Card
          </div>

          {/* Organization Name matching exact logo colors: Youth (Blue #0284c7), Empowerment Hub (Orange #ea580c) */}
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
        {downloading ? 'Generating High-Quality PNG...' : (
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
