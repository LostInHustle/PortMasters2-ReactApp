import type { ReactNode } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';

// The first mate's note: a short handwritten line that speaks to the captain about what is
// already on screen. It only ever restates game state, never adds rules or numbers of its own.
export function MateNote({ children, id }: { children: ReactNode; id?: string }) {
  const { tr } = useTranslate();
  return (
    <div className="mate-note" id={id}>
      {children}
      <small>{tr('你的大副', 'your first mate')}</small>
    </div>
  );
}
