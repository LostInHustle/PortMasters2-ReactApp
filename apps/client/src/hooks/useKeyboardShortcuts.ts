import { useEffect } from 'react';
import { useOpenManual } from '../components/manual/ManualModal.js';
import { useModal } from '../components/modal/ModalContext.js';
import { useSession } from '../state/SessionContext.js';
import { useSpectate } from '../state/SpectateContext.js';

// Mirrors PortMasters2/PortMasters_online.html's global keydown listener: F1 opens the manual,
// and Escape closes whichever of modal/spectate/chat is currently on top, in that fixed priority
// order, so a single press only ever closes one layer.
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
