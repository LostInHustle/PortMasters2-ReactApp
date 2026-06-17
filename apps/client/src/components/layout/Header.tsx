import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useOpenManual } from '../manual/ManualModal.js';
import { LangToggle } from './LangToggle.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's .header markup (lines 1191-1206)
// and applyLanguage's header section (lines 1751-1757) / logout() (lines 1930-1935).
export function Header() {
  const { tr } = useTranslate();
  const { currentUser, toggleChat } = useSession();
  const openManual = useOpenManual();

  const logout = () => {
    const confirmed = window.confirm(
      tr(
        '确定要退出登录吗？游戏进度已保存在服务器，重新登录可继续。',
        'Log out? Your progress is saved on the server — log back in to continue.',
      ),
    );
    if (!confirmed) return;
    window.location.reload();
  };

  return (
    <div className="header">
      <div className="brand">
        <span className="logo">⚓</span>
        <div>
          <h1>
            PortMasters<span className="gen-badge">2</span>
          </h1>
          <div className="subtitle">
            {tr(
              '海上丝绸之路 · 双人联机贸易战略 — 采购 · 互市 · 生产 · 远航',
              'Maritime Silk Road · 2-Player Co-op Trading — Procure · Barter · Produce · Voyage',
            )}
          </div>
        </div>
      </div>
      <div className="header-actions">
        {currentUser && <span className="me-chip">{currentUser}</span>}
        <LangToggle />
        <button
          className="btn btn-ghost"
          onClick={() => openManual()}
          title={tr('打开游戏手册（快捷键 F1）', 'Open the game manual (F1)')}
        >
          {tr('📖 手册', '📖 Manual')}
        </button>
        <button
          className="btn btn-ghost"
          onClick={toggleChat}
          title={tr('与伙伴聊天', 'Chat with your partner')}
        >
          {tr('💬 聊天', '💬 Chat')}
        </button>
        <button
          className="btn btn-ghost"
          onClick={logout}
          title={tr('退出登录并返回登录页', 'Log out and return to the login page')}
        >
          {tr('🚪 退出', '🚪 Log Out')}
        </button>
      </div>
    </div>
  );
}
