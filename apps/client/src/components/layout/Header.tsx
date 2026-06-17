import { useLang } from '../../i18n/LangContext.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useOpenManual } from '../manual/ManualModal.js';

// Ported from PortMasters2/PortMasters_online.html applyLanguage's header section
// (lines 1751-1757) and logout() (lines 1930-1935).
export function Header() {
  const { tr } = useTranslate();
  const { lang, toggleLang } = useLang();
  const { toggleChat } = useSession();
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
    <header>
      <span>
        {tr(
          '海上丝绸之路 · 双人联机贸易战略 — 采购 · 互市 · 生产 · 远航',
          'Maritime Silk Road · 2-Player Co-op Trading — Procure · Barter · Produce · Voyage',
        )}
      </span>
      <button
        onClick={toggleLang}
        title={
          lang === 'en'
            ? 'Switch to Chinese / 切换为中文界面'
            : 'Switch to English / 切换为英文界面'
        }
      >
        {lang === 'en' ? '🌐 中文' : '🌐 English'}
      </button>
      <button
        onClick={() => openManual()}
        title={tr('打开游戏手册（快捷键 F1）', 'Open the game manual (F1)')}
      >
        {tr('📖 手册', '📖 Manual')}
      </button>
      <button onClick={toggleChat} title={tr('与伙伴聊天', 'Chat with your partner')}>
        {tr('💬 聊天', '💬 Chat')}
      </button>
      <button
        onClick={logout}
        title={tr('退出登录并返回登录页', 'Log out and return to the login page')}
      >
        {tr('🚪 退出', '🚪 Log Out')}
      </button>
    </header>
  );
}
