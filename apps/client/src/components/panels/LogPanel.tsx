import { useEffect, useRef } from 'react';
import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// Ported from PortMasters2/PortMasters_online.html renderLog: the panel rides to the bottom
// when a new line arrives.
//
// It must ride down only then. Every captain's action broadcasts fresh state to the whole room,
// and each broadcast arrives as a brand new object, so keying the scroll off the logs array
// itself meant someone else buying a card yanked this panel away from whatever the reader had
// scrolled back to. logSeq is the server's monotonic count of this game's own log lines, so it
// changes exactly when there is something new to scroll to, and a restart resets it to a lower
// number, which still counts as a change and lands the reader at the top of a fresh log.
export function LogPanel() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const logs = serverState?.yourGame.logs;
  const logSeq = serverState?.yourGame.logSeq;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logSeq]);

  return (
    <div className="panel log-panel" id="log-panel" ref={ref}>
      <div className="log-title">
        {tr('📜 航海日志 · 最近操作记录', "📜 Captain's Log · Recent Actions")}
      </div>
      {logs && logs.length > 0 ? (
        logs.map((m, i) => (
          <div className="log-entry" key={i}>
            {lst(m, lang)}
          </div>
        ))
      ) : (
        <div className="log-entry muted">
          {tr(
            '暂无记录。你的采购、交易、生产等操作会记录在这里。',
            'Nothing yet. Your purchases, trades and production will be recorded here.',
          )}
        </div>
      )}
    </div>
  );
}
