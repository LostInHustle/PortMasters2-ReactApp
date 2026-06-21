import { useTranslate } from '../../i18n/useTranslate.js';
import { useWs } from '../../ws/WsContext.js';

// New: a persistent indicator for "the WebSocket is currently down and WsContext is retrying."
// A toast alone isn't enough here -- it fades after a few seconds, but a reconnect can take
// several backoff cycles, and the whole point of this fix is that the app should never again
// look idle/broken with no explanation while it's actually just waiting on the network. This
// stays on screen for as long as `connected` is false, on every screen (including the login
// page itself, which needs a live connection just as much as the game does).
export function ConnectionBanner() {
  const { tr } = useTranslate();
  const { connected } = useWs();

  if (connected) return null;

  return (
    <div className="connection-banner" role="status">
      <span className="connection-banner-dot" />
      {tr('🔌 连接已断开，正在重新连接…', '🔌 Connection lost, reconnecting…')}
    </div>
  );
}
