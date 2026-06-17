import { useState } from 'react';
import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { LangToggle } from '../layout/LangToggle.js';
import { LoginForm } from './LoginForm.js';
import { RegisterForm } from './RegisterForm.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's #login-overlay markup
// (lines 1216-1239) and applyLanguage's login section (lines 1759-1773). The original toggled
// the inner login-form/register-form via display:none; here LoginOverlay swaps the rendered
// form. The language toggle lives here (the original's btn-lang-login) so a player can switch to
// Chinese before ever logging in.
export function LoginOverlay() {
  const { tr, lang } = useTranslate();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div id="login-overlay">
      <div className="login-box">
        <div className="login-brand">
          <div className="logo">⚓</div>
          <h2>PortMasters 2</h2>
          <div className="tagline">
            {tr(
              '海上丝绸之路 · 双人联机贸易战略',
              'Maritime Silk Road · 2-Player Co-op Trading Strategy',
            )}
          </div>
        </div>
        {mode === 'login' ? (
          <LoginForm onShowRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onShowLogin={() => setMode('login')} />
        )}
        <LangToggle className="btn btn-ghost" style={{ width: '100%', marginTop: 6 }} />
        <div className="pm-note">
          {tr('💡 ', '💡 ')}
          <strong>{tr('本作为 PortMasters 2', 'This is PortMasters 2')}</strong>
          {tr(
            '，引入了税务、工资、双人同步互市等更复杂的机制，',
            ' — it adds taxes, wages and synchronized two-captain bartering, so the learning curve is ',
          )}
          <strong>{tr('上手门槛较高', 'steeper than the original')}</strong>
          {tr('。如果是初次接触本系列，建议先体验上一代 ', '. New to the series? Start with ')}
          <a href={pm1Url(lang)} target="_blank" rel="noopener noreferrer">
            {pm1Label(lang)}
          </a>
          {tr(' 熟悉基础玩法。', ' to learn the basics.')}
        </div>
      </div>
    </div>
  );
}
