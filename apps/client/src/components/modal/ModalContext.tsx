import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslate } from '../../i18n/useTranslate.js';

interface ModalState {
  content: ReactNode;
  wide: boolean;
}

interface ModalContextValue {
  isOpen: boolean;
  openModal: (content: ReactNode, wide?: boolean) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// Ported verbatim from PortMasters2/PortMasters_online.html showModal/closeModal
// (lines 3992-4002): a single generic dialog, closed by its × button, by clicking the overlay
// outside the box, or by Escape (wired centrally in useKeyboardShortcuts, since the original's
// Escape handler checks modal/spectate/chat in a fixed priority order, not three independent
// listeners).
//
// Invariant worth keeping: the overlay and the box belong to this provider, and a dialog's own
// content is held as an element in `modal`. A dialog that tracks its own state (the difficulty
// pickers in CreateRoomComposer and InviteComposer, the manual's tabs) therefore renders again
// entirely on its own, and the overlay is never touched. That matters because .modal-overlay
// covers the viewport and carries a fadeIn, and .modal carries a fadeUp: rebuilding either one
// replays those, which in the prototype made the whole screen fade out and back in on every
// difficulty click. Keep dialog state inside the dialog. Do not push it up here and reopen the
// modal to show a change.
export function ModalProvider({ children }: { children: ReactNode }) {
  const { tr } = useTranslate();
  const [modal, setModal] = useState<ModalState | null>(null);

  // Memoized so consumers (e.g. GameView's onboarding-tour effect) can safely depend on these
  // without re-firing every time this provider re-renders for an unrelated reason.
  const openModal = useCallback(
    (content: ReactNode, wide = false) => setModal({ content, wide }),
    [],
  );
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({ isOpen: modal !== null, openModal, closeModal }),
    [modal, openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className={`modal ${modal.wide ? 'modal-wide' : ''}`}>
              <button
                className="modal-x"
                onClick={closeModal}
                title={tr('关闭（Esc）', 'Close (Esc)')}
              >
                ×
              </button>
              {modal.content}
            </div>
          </div>,
          document.body,
        )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
}
