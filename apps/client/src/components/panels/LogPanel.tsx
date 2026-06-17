import { useEffect, useRef } from 'react';
import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html renderLog (lines 3403-3411): logs
// scroll to the bottom on every update, matching `l.scrollTop = l.scrollHeight`.
export function LogPanel() {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const logs = serverState?.yourGame.logs ?? [];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="panel log-panel" id="log-panel" ref={ref}>
      <div className="log-title">
        {tr('📜 航海日志 · 最近操作记录', "📜 Captain's Log · Recent Actions")}
      </div>
      {logs.length > 0 ? (
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
