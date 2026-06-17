import { useEffect, useRef } from 'react';
import { useSession } from '../../state/SessionContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html appendChatMessage
// (lines 2224-2231): each bubble is "sent" or "received" depending on who wrote it, and the
// list auto-scrolls to the newest message.
export function ChatMessageList() {
  const { chatHistory, currentUser } = useSession();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [chatHistory]);

  return (
    <div id="chat-messages" ref={ref}>
      {chatHistory.map((m, i) => (
        <div className={`chat-bubble ${m.from === currentUser ? 'sent' : 'received'}`} key={i}>
          {m.message}
        </div>
      ))}
    </div>
  );
}
