import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';

// Ported from PortMasters2/PortMasters_online.html renderOnlineUsers (lines 2064-2093). The
// original tracks a separate inviteStatus map per user; since the server only ever allows one
// outstanding invite per sender, "pending" here is just "this user is the current lastInviteTo"
// -- an equivalent, simpler derivation, not a behavior change. The difficulty-picker composer
// (a modal in the original) is deferred to the Phase 7 modal system; for now an invite always
// proposes Easy, matching the composer's own default before the inviter changes it.
export function OnlineUsersList() {
  const { tr } = useTranslate();
  const { onlineUsers, lastInviteTo, sendInvite } = useSession();

  if (onlineUsers.length === 0) {
    return (
      <p>
        {tr(
          '🌊 暂无其他在线玩家。让朋友打开本页面注册登录，即可向其发出航程邀请。',
          '🌊 No other players online. Ask a friend to open this page and sign up — then you can invite them to a voyage.',
        )}
      </p>
    );
  }

  return (
    <div>
      {onlineUsers.map((user) => (
        <div key={user} className="online-user-item">
          <span className="u-name">
            <span className="dot on" />
            {user}
          </span>
          {user === lastInviteTo ? (
            <button className="btn btn-grey" disabled>
              {tr('⏳ 等待回应...', '⏳ Awaiting reply...')}
            </button>
          ) : (
            <button
              className="btn btn-success"
              title={tr(
                '邀请该玩家加入双人航程（每分钟限一次，60秒内有效）',
                'Invite this player to a two-captain voyage (once per minute, valid for 60s)',
              )}
              onClick={() => sendInvite(user, 'easy')}
            >
              {tr('📨 邀请同航', '📨 Invite to Voyage')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
