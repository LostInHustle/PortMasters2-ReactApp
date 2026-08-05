import { useTranslate } from '../../i18n/useTranslate.js';
import { useToast } from '../../state/ToastContext.js';

// Ported from PortMasters2/PortMasters_online.html's toast stack element (pushToast): one
// stack pinned to the corner, each entry fading out before removal. A toast carrying an onClick
// (e.g. a chat alert) also acts as a button: clicking it runs the action and dismisses it.
//
// Every toast carries its own close button, and a burst of them gets a "Clear all" control.
// Previously only toasts that happened to have an onClick could be cleared, so an ordinary log
// or error notice simply sat in the corner blocking the view until its timer ran out.
export function ToastStack() {
  const { tr } = useTranslate();
  const { toasts, dismissToast, dismissAllToasts } = useToast();
  const dismissLabel = tr('关闭此通知', 'Dismiss this notification');

  return (
    <div id="toast-stack">
      {toasts.length > 1 && (
        <button className="toast-clear-all" type="button" onClick={dismissAllToasts}>
          {tr('✕ 全部清除', '✕ Clear all')}
        </button>
      )}
      {toasts.map((t) => {
        const clickable = Boolean(t.onClick);
        return (
          <div
            key={t.id}
            className={`notification${t.kind ? ` ${t.kind}` : ''}${t.fading ? ' fading' : ''}${
              clickable ? ' clickable' : ''
            }`}
            role={clickable ? 'button' : 'status'}
            tabIndex={clickable ? 0 : undefined}
            onClick={
              clickable
                ? () => {
                    t.onClick!();
                    dismissToast(t.id);
                  }
                : undefined
            }
          >
            <span className="toast-text">{t.message}</span>
            <button
              className="toast-close"
              type="button"
              aria-label={dismissLabel}
              title={dismissLabel}
              onClick={(e) => {
                // Never let the close button trigger the toast's own action.
                e.stopPropagation();
                dismissToast(t.id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
