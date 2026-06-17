import { AppShell } from './components/layout/AppShell.js';
import { LangProvider } from './i18n/LangContext.js';
import { SessionProvider } from './state/SessionContext.js';
import { ToastProvider } from './state/ToastContext.js';
import { WsProvider } from './ws/WsContext.js';

export function App() {
  return (
    <LangProvider>
      <WsProvider>
        <ToastProvider>
          <SessionProvider>
            <AppShell />
          </SessionProvider>
        </ToastProvider>
      </WsProvider>
    </LangProvider>
  );
}
