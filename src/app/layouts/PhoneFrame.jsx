import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handler = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return landscape;
}

export function PhoneFrame({ children }) {
  const landscape = useIsLandscape();
  return (
    <div
      className="phone-frame-shell"
      style={landscape ? { alignItems: 'flex-start', overflowY: 'auto', minHeight: '100vh' } : {}}
    >
      <div
        className="phone-frame"
        style={landscape ? { height: 880 } : {}}
      >
        {children}
      </div>
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

