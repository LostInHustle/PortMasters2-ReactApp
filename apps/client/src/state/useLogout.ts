import { useTranslate } from '../i18n/useTranslate.js';
import { useWs } from '../ws/WsContext.js';
import { clearStoredToken, getStoredToken } from './sessionToken.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's logout() (lines 1930-1935):
// confirm, then drop the connection by reloading -- the server's disconnect handler does the
// rest. Shared by the in-game header and the lobby (the lobby previously had no logout button
// of its own; the user could only get back to the login screen via the header). Now also
// revokes the resume token server-side and clears it locally, so this is a real logout: without
// that, the next page load (or the next reconnect, if one happened to fire before the reload)
// would silently log the player right back in via sessionToken.ts's resume_token flow.
export function useLogout(): () => void {
  const { tr } = useTranslate();
  const { send } = useWs();
  return () => {
    const confirmed = window.confirm(
      tr(
        '确定要退出登录吗？游戏进度已保存在服务器，重新登录可继续。',
        'Log out? Your progress is saved on the server, log back in to continue.',
      ),
    );
    if (!confirmed) return;
    const token = getStoredToken();
    if (token) send({ action: 'logout', token });
    clearStoredToken();
    window.location.reload();
  };
}
