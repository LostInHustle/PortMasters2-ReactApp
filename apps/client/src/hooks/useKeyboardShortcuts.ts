import { useEffect } from 'react';
import { useOpenManual } from '../components/manual/ManualModal.js';
import { useModal } from '../components/modal/ModalContext.js';
import { useSession } from '../state/SessionContext.js';
import { useSpectate } from '../state/SpectateContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's global keydown listener
// (lines 4005-4018): F1 opens the manual; Escape closes whichever of modal/spectate/chat is
// currently on top, in that fixed priority order, so a single press only ever closes one
// layer.
export function useKeyboardShortcuts(): void {
  const openManual = useOpenManual();
  const { isOpen: modalOpen, closeModal } = useModal();
  const { isSpectating, closeSpectate } = useSpectate();
  const { chatOpen, closeChat } = useSession();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'F1') {
        e.preventDefault();
        openManual();
      } else if (e.key === 'Escape') {
        if (modalOpen) {
          closeModal();
        } else if (isSpectating) {
          closeSpectate();
        } else if (chatOpen) {
          closeChat();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openManual, modalOpen, closeModal, isSpectating, closeSpectate, chatOpen, closeChat]);
}
