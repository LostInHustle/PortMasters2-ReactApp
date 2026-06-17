import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  kind: string;
  fading: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  pushToast: (message: string, kind?: string, ttl?: number) => void;
  showNotification: (message: string, isError?: boolean) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 6;
const FADE_MS = 400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  // Ported verbatim from PortMasters2/PortMasters_online.html pushToast (lines 1822-1835): caps
  // visible toasts at 6 (a burst of actions can't fill the screen), drops the oldest first, then
  // fades and removes each toast after `ttl` ms.
  const pushToast = useCallback((message: string, kind = '', ttl = 10000) => {
    const id = nextId.current++;
    setToasts((prev) => {
      const next = [...prev, { id, message, kind, fading: false }];
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, fading: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, FADE_MS);
    }, ttl);
  }, []);

  // Ported verbatim from PortMasters2/PortMasters_online.html showNotification (lines 1837-1839).
  const showNotification = useCallback(
    (message: string, isError = false) => {
      pushToast(message, isError ? 'error' : '', 3500);
    },
    [pushToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, pushToast, showNotification }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
