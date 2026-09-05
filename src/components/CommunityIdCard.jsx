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

      // Standard ID Card Dimensions (660 x 1010 px, 2x Retina Quality)
      const canvas = document.createElement('canvas');
      canvas.width = 660;
      canvas.height = 1010;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Pre-load Images
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

      // 2. Draw Outer Card with Rounded Corners Clip
      drawRoundedRect(ctx, 0, 0, 660, 1010, 32);
      ctx.save();
      ctx.clip();

      // Base Background
      ctx.fillStyle = '#12161f';
      ctx.fillRect(0, 0, 660, 1010);

      // Ambient Lighting (Top Right Blue + Bottom Left Orange)
      const g1 = ctx.createRadialGradient(580, 120, 0, 580, 120, 420);
      g1.addColorStop(0, 'rgba(2, 132, 199, 0.26)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, 660, 1010);

      const g2 = ctx.createRadialGradient(90, 890, 0, 90, 890, 420);
      g2.addColorStop(0, 'rgba(234, 88, 12, 0.20)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, 660, 1010);

      // Header Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 245);
      ctx.lineTo(660, 245);
      ctx.stroke();

      // 3. Draw White Box for Logo
      const boxW = 126;
      const boxH = 126;
      const boxX = (660 - boxW) / 2; // 267
      const boxY = 28;

      ctx.save();
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 20);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      ctx.fill();
      ctx.restore();

      // Draw Logo Image inside the White Box
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const pad = 8;
        ctx.drawImage(logoImg, boxX + pad, boxY + pad, boxW - 2 * pad, boxH - 2 * pad);
      }

      // 4. Header Texts
      // "OFFICIAL ID CARD"
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 13px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('O F F I C I A L   I D   C A R D', 330, 192);

      // "Youth Empowerment Hub" (Brand colors: Youth = Blue, Empowerment Hub = Orange)
      ctx.font = '800 22px "Inter", -apple-system, sans-serif';
      const youthText = 'Youth ';
      const hubText = 'Empowerment Hub';
      const youthW = ctx.measureText(youthText).width;
      const hubW = ctx.measureText(hubText).width;
      const totalW = youthW + hubW;
      const startX = (660 - totalW) / 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0284c7'; // Royal Blue
      ctx.fillText(youthText, startX, 225);
      ctx.fillStyle = '#ea580c'; // Vibrant Orange
      ctx.fillText(hubText, startX + youthW, 225);

      // 5. Photo Frame / Avatar Section
      const frameSize = 220;
      const frameX = (660 - frameSize) / 2; // 220
      const frameY = 280;

      // Outer Gradient Border
      ctx.save();
      drawRoundedRect(ctx, frameX, frameY, frameSize, frameSize, 24);
      const frameGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameSize, frameY + frameSize);
      frameGrad.addColorStop(0, '#0284c7');
      frameGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = frameGrad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 5;
      ctx.fill();
      ctx.restore();

      // Inner Photo Container
      const innerSize = 210;
      const innerX = frameX + 5;
      const innerY = frameY + 5;
      drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, 19);
      ctx.fillStyle = '#1c222c';
      ctx.fill();

      // Draw Photo or Initials
      if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
        ctx.save();
        drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, 19);
        ctx.clip();
        ctx.drawImage(photoImg, innerX, innerY, innerSize, innerSize);
        ctx.restore();
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 88px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const initial = member.name ? member.name.charAt(0).toUpperCase() : 'M';
        ctx.fillText(initial, 330, innerY + 138);
      }

      // 6. Member Name
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 29px "Inter", -apple-system, sans-serif';
      ctx.fillText(member.name || 'Community Member', 330, 560);

      // 7. "COMMUNITY MEMBER" Badge
      const badgeW = 230;
      const badgeH = 38;
      const badgeX = (660 - badgeW) / 2;
      const badgeY = 585;

      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 19);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '700 13px "Inter", -apple-system, sans-serif';
      ctx.fillText('COMMUNITY MEMBER', 330, badgeY + 24);

      // 8. Footer Section
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 870);
      ctx.lineTo(660, 870);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
      ctx.fillRect(0, 870, 660, 140);

      // Left: Member ID
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Inter", -apple-system, sans-serif';
      ctx.fillText('MEMBER ID', 50, 915);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 22px monospace';
      ctx.fillText(member.member_id || 'YEH-000000', 50, 955);

      // Right: Location
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Inter", -apple-system, sans-serif';
      ctx.fillText('LOCATION', 400, 915);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 20px "Inter", -apple-system, sans-serif';
      ctx.fillText(member.location || 'India', 400, 955);

      // Restore outer clip
      ctx.restore();

      // 9. Outer Card Stroke
      drawRoundedRect(ctx, 1, 1, 658, 1008, 32);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 10. Trigger Instant PNG Download
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
      {/* Visual Standard ID Card Component */}
      <div 
        style={{
          width: '330px',
          height: '505px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 12px 32px 0 rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          background: 'radial-gradient(circle at 85% 15%, rgba(2, 132, 199, 0.22) 0%, transparent 55%), radial-gradient(circle at 15% 85%, rgba(234, 88, 12, 0.18) 0%, transparent 55%), #12161f',
        }}
      >
        {/* Header with Logo + Organization Typography */}
        <div style={{ padding: '20px 16px 14px', textAlign: 'center', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Logo Frame */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '10px', 
            padding: '4px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            marginBottom: '8px',
            width: '64px',
            height: '64px'
          }}>
            <canvas 
              ref={previewCanvasRef} 
              width={140} 
              height={140} 
              style={{ width: '56px', height: '56px', display: 'block', borderRadius: '6px' }} 
            />
          </div>

          <div style={{ margin: '1px 0 0', fontSize: '0.66rem', color: '#94a3b8', letterSpacing: '2.2px', textTransform: 'uppercase', fontWeight: 700 }}>
            Official ID Card
          </div>

          {/* Organization Name matching exact logo colors: Youth (Blue #0284c7), Empowerment Hub (Orange #ea580c) */}
          <div style={{ 
            margin: '4px 0 0', 
            fontSize: '1.15rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '5px' 
          }}>
            <span style={{ color: '#0284c7' }}>Youth</span>
            <span style={{ color: '#ea580c' }}>Empowerment Hub</span>
          </div>
        </div>

        {/* Photo + Name Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, padding: '16px 20px' }}>
          <div style={{ 
            width: '110px', 
            height: '110px', 
            borderRadius: '12px', 
            padding: '2.5px',
            background: 'linear-gradient(135deg, #0284c7, #ea580c)',
            marginBottom: '14px',
            boxShadow: '0 6px 20px -3px rgba(0, 0, 0, 0.45)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '9.5px',
              backgroundColor: '#1c222c',
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
                <span style={{ fontSize: '2.4rem', fontWeight: 700, color: '#94a3b8' }}>
                  {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                </span>
              )}
            </div>
          </div>

          <div style={{ margin: '0 0 5px 0', fontSize: '1.32rem', fontWeight: 700, textAlign: 'center', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {member.name}
          </div>
          <span style={{ 
            display: 'inline-block', 
            padding: '3px 12px', 
            background: 'rgba(2, 132, 199, 0.15)', 
            border: '1px solid rgba(2, 132, 199, 0.4)', 
            borderRadius: '16px', 
            color: '#7dd3fc', 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            letterSpacing: '0.5px' 
          }}>
            COMMUNITY MEMBER
          </span>
        </div>

        {/* Footer Details */}
        <div style={{ padding: '14px 20px', background: 'rgba(10, 14, 20, 0.82)', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px' }}>
            <div>
              <div style={{ margin: 0, fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                Member ID
              </div>
              <div style={{ margin: '2px 0 0', fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {member.member_id}
              </div>
            </div>
            <div>
              <div style={{ margin: 0, fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                Location
              </div>
              <div style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        {downloading ? 'Downloading...' : (
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
