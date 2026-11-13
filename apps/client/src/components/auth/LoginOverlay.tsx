import { useState } from 'react';
import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { MateNote } from '../common/MateNote.js';
import { LangToggle } from '../layout/LangToggle.js';
import { LoginForm } from './LoginForm.js';
import { RegisterForm } from './RegisterForm.js';

// Mirrors PortMasters2/PortMasters_online.html's #login-overlay markup
// and applyLanguage's login section. The original toggled
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
            {tr('海上丝绸之路 · 联机贸易战略', 'Maritime Silk Road, Online Trading Strategy')}
          </div>
        </div>
        <MateNote id="lg-mate">
          {tr(
            '船长，船就泊在老地方，灯已点亮，潮水只等你一声令下。',
            'Your ship is moored where you left her, Captain. The lanterns are lit and the tide turns at your word.',
          )}
        </MateNote>
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
            '，引入了税务、工资、多人同步互市等更复杂的机制，',
            ', which adds taxes, wages and synchronized bartering with fellow captains, so the learning curve is ',
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
