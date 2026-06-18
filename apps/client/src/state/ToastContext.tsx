import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  kind: string;
  fading: boolean;
  /** Optional action run when the toast is clicked (e.g. a chat alert opening the chat window). */
  onClick?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  pushToast: (message: string, kind?: string, ttl?: number, onClick?: () => void) => void;
  showNotification: (message: string, isError?: boolean, onClick?: () => void) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 6;
const FADE_MS = 400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const fadeOut = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, fading: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, FADE_MS);
  }, []);

  // Ported from PortMasters2/PortMasters_online.html pushToast (lines 1822-1835): caps visible
  // toasts at 6 (a burst of actions can't fill the screen), drops the oldest first, then fades
  // and removes each toast after `ttl` ms. Extended with an optional onClick so a toast can act
  // as an alert that opens a relevant view (e.g. a chat message opening the chat window).
  const pushToast = useCallback(
    (message: string, kind = '', ttl = 10000, onClick?: () => void) => {
      const id = nextId.current++;
      setToasts((prev) => {
        const next = [...prev, { id, message, kind, fading: false, onClick }];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      setTimeout(() => fadeOut(id), ttl);
    },
    [fadeOut],
  );

  // Ported from PortMasters2/PortMasters_online.html showNotification (lines 1837-1839).
  const showNotification = useCallback(
    (message: string, isError = false, onClick?: () => void) => {
      pushToast(message, isError ? 'error' : '', 3500, onClick);
    },
    [pushToast],
  );

  // Dismiss a toast immediately (used when its onClick action fires, so the alert clears as soon
  // as it has been acted on).
  const dismissToast = useCallback((id: number) => fadeOut(id), [fadeOut]);

  return (
    <ToastContext.Provider value={{ toasts, pushToast, showNotification, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
