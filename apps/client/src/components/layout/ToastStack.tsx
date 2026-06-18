import { useToast } from '../../state/ToastContext.js';

// Ported from PortMasters2/PortMasters_online.html's toast stack element (pushToast,
// lines 1822-1835): one fixed-position stack, each entry fading out before removal. A toast
// carrying an onClick (e.g. a chat alert) is rendered as a clickable affordance: clicking it
// runs the action and dismisses the toast.
export function ToastStack() {
  const { toasts, dismissToast } = useToast();
  return (
    <div id="toast-stack">
      {toasts.map((t) => {
        const clickable = Boolean(t.onClick);
        return (
          <div
            key={t.id}
            className={`notification${t.kind ? ` ${t.kind}` : ''}${t.fading ? ' fading' : ''}${
              clickable ? ' clickable' : ''
            }`}
            role={clickable ? 'button' : undefined}
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
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
