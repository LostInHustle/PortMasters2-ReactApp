import { useState } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { ChatMessageList } from './ChatMessageList.js';

// Mirrors PortMasters2/PortMasters_online.html's chat window markup
// and toggleChat/sendChat/updateChatSendState. `onkeypress`
// is replaced with the not deprecated `onKeyDown`, same Enter to send behavior, modern API.
export function ChatWindow() {
  const { tr } = useTranslate();
  const { chatOpen, currentUser, serverState, sendChat, closeChat } = useSession();
  const [draft, setDraft] = useState('');

  if (!chatOpen) return null;

  const others = serverState?.players.filter((p) => p.name !== currentUser) ?? [];
  const enabled = others.some((p) => p.online);

  const submit = () => {
    if (!draft.trim()) return;
    sendChat(draft);
    setDraft('');
  };

  return (
    <div id="chat-window" style={{ display: 'flex' }}>
      <div id="chat-header">
        <span id="chat-title">{tr('💬 船桥通话', '💬 Bridge Call')}</span>
        <button
          onClick={closeChat}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
          }}
          id="chat-close-btn"
          title={tr('关闭聊天窗口（Esc）', 'Close chat (Esc)')}
        >
          ×
        </button>
      </div>
      <ChatMessageList />
      <div id="chat-input-area">
        <input
          type="text"
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!enabled}
          placeholder={
            enabled
              ? tr('输入消息...', 'Type a message...')
              : tr('其他船长都已离线，无法发送', 'Everyone else is offline, cannot send')
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button className="btn btn-success" onClick={submit} disabled={!enabled} id="chat-send-btn">
          {tr('发送', 'Send')}
        </button>
      </div>
    </div>
  );
}
