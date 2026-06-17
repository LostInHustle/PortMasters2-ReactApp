import { useToast } from '../../state/ToastContext.js';

// Ported from PortMasters2/PortMasters_online.html's toast stack element (pushToast,
// lines 1822-1835): one fixed-position stack, each entry fading out before removal.
export function ToastStack() {
  const { toasts } = useToast();
  return (
    <div id="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`notification${t.kind ? ` ${t.kind}` : ''}${t.fading ? ' fading' : ''}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
