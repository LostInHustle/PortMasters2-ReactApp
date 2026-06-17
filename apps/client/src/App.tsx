import { AppShell } from './components/layout/AppShell.js';
import { ModalProvider } from './components/modal/ModalContext.js';
import { TooltipProvider } from './components/tooltip/TooltipProvider.js';
import { LangProvider } from './i18n/LangContext.js';
import { SessionProvider } from './state/SessionContext.js';
import { SpectateProvider } from './state/SpectateContext.js';
import { ToastProvider } from './state/ToastContext.js';
import { WsProvider } from './ws/WsContext.js';

export function App() {
  return (
    <LangProvider>
      <WsProvider>
        <ToastProvider>
          <SessionProvider>
            <SpectateProvider>
              <ModalProvider>
                <TooltipProvider>
                  <AppShell />
                </TooltipProvider>
              </ModalProvider>
            </SpectateProvider>
          </SessionProvider>
        </ToastProvider>
      </WsProvider>
    </LangProvider>
  );
}
