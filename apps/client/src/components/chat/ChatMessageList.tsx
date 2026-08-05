import { useEffect, useRef } from 'react';
import { useSession } from '../../state/SessionContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html appendChatMessage
// (lines 2224-2231): each bubble is "sent" or "received" depending on who wrote it, the sender's
// name labels every received bubble, and the list auto-scrolls to the newest message.
export function ChatMessageList() {
  const { chatHistory, currentUser } = useSession();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [chatHistory]);

  return (
    <div id="chat-messages" ref={ref}>
      {chatHistory.map((m, i) => {
        const sent = m.from === currentUser;
        return (
          <div className={`chat-bubble ${sent ? 'sent' : 'received'}`} key={i}>
            {!sent && <div className="chat-bubble-name">{m.from}</div>}
            <div>{m.message}</div>
          </div>
        );
      })}
    </div>
  );
}
