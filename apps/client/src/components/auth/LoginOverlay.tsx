import { useState } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { LoginForm } from './LoginForm.js';
import { RegisterForm } from './RegisterForm.js';

// Ported from PortMasters2/PortMasters_online.html showRegister/showLogin (lines 1861-1869):
// the login overlay toggles between the login and register forms in place.
export function LoginOverlay() {
  const { tr } = useTranslate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="login-overlay">
      <p className="lg-tagline">
        {tr(
          '海上丝绸之路 · 双人联机贸易战略',
          'Maritime Silk Road · 2-Player Co-op Trading Strategy',
        )}
      </p>
      {mode === 'login' ? (
        <LoginForm onShowRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onShowLogin={() => setMode('login')} />
      )}
    </div>
  );
}
