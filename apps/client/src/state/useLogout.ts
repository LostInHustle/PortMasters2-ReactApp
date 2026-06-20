import { useTranslate } from '../i18n/useTranslate.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's logout() (lines 1930-1935):
// confirm, then drop the connection by reloading -- the server's disconnect handler does the
// rest. Shared by the in-game header and the lobby (the lobby previously had no logout button
// of its own; the user could only get back to the login screen via the header).
export function useLogout(): () => void {
  const { tr } = useTranslate();
  return () => {
    const confirmed = window.confirm(
      tr(
        '确定要退出登录吗？游戏进度已保存在服务器，重新登录可继续。',
        'Log out? Your progress is saved on the server, log back in to continue.',
      ),
    );
    if (!confirmed) return;
    window.location.reload();
  };
}
