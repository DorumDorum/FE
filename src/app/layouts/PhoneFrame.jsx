import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

const PHONE_W = 390;
const PHONE_H = 844;
const PAD = 64; // 2rem * 2

function useFrameScale() {
  const compute = () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return 1;
    return Math.min(
      (window.innerHeight - PAD) / PHONE_H,
      (window.innerWidth - PAD) / PHONE_W,
      1
    );
  };

  const [scale, setScale] = useState(compute);

  useEffect(() => {
    const handler = () => setScale(compute());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return scale;
}

export function PhoneFrame({ children }) {
  const scale = useFrameScale();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  return (
    <div className="phone-frame-shell">
      {isDesktop && scale < 1 ? (
        <div style={{
          width: PHONE_W * scale,
          height: PHONE_H * scale,
          position: 'relative',
          borderRadius: 40,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.05)',
          flexShrink: 0,
        }}>
          <div style={{
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            {children}
          </div>
        </div>
      ) : (
        <div className="phone-frame">{children}</div>
      )}
    </div>
  );
}

export function PhoneFrameLayout() {
  return (
    <PhoneFrame>
      <Outlet />
    </PhoneFrame>
  );
}
