import { useState } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { ChatMessageList } from './ChatMessageList.js';

// Ported verbatim from PortMasters2/PortMasters_online.html's chat window markup
// (lines 1258-1268) and toggleChat/sendChat/updateChatSendState (lines 2191-2222). `onkeypress`
// is replaced with the non-deprecated `onKeyDown` -- same Enter-to-send behavior, modern API.
export function ChatWindow() {
  const { tr } = useTranslate();
  const { chatOpen, currentUser, serverState, sendChat, closeChat } = useSession();
  const [draft, setDraft] = useState('');

  if (!chatOpen) return null;

  const others = serverState?.players.filter((p) => p.name !== currentUser) ?? [];
  const enabled = others.some((p) => p.online);
  const partnerLabel = others.length > 0 ? others.map((p) => p.name).join(tr('、', ', ')) : tr('无', 'none');

  const submit = () => {
    if (!draft.trim()) return;
    sendChat(draft);
    setDraft('');
  };

  return (
    <div id="chat-window" style={{ display: 'flex' }}>
      <div id="chat-header">
        <span id="chat-title">
          {tr(`💬 与 `, `💬 Bridge call with `)}
          <span id="chat-partner">{partnerLabel}</span>
          {tr(` 的船桥通话`, ``)}
        </span>
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
