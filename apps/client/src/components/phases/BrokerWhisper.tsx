import type { PlayerGameState } from '@pm2/shared';
import { useState } from 'react';
import { tn } from '../../i18n/enNames.js';
import { ITEM_ICONS } from '../../i18n/itemIcons.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useWs } from '../../ws/WsContext.js';

// Ported verbatim from PortMasters2/PortMasters_online.html brokerWhisperHTML
// (lines 2760-2806). The collapsed/expanded state is local UI state, not server state, so a
// plain useState (defaulting open, matching the original's `_whisperOpen = true`) replaces the
// original's module-global + ontoggle handler -- React preserves it across re-renders for free.
export function BrokerWhisper({ g }: { g: PlayerGameState }) {
  const { tr, lang } = useTranslate();
  const { send } = useWs();
  const [open, setOpen] = useState(true);
  const revealed = g.revealedIntel;
  const remaining = g.intelRemaining;
  const canBuy = remaining > 0 && g.money >= g.intelCost;
  const hasNetwork = g.equippedModules.some((m) => m.id === 'brokers_network');
  const hasOceanRelay = g.equippedModules.some((m) => m.id === 'ocean_relay');

  return (
    <details className="whisper-panel" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        {tr('🗣️ 牙行密语', "🗣️ Broker's Whisper")}
        <span className="chip amber">
          {tr(
            `🔮 花 ${g.intelCost} 金币打探未来需求`,
            `🔮 ${g.intelCost} gold buys future-demand intel`,
          )}
        </span>
        {revealed.length > 0 && (
          <span className="chip green">
            {tr(
              `📜 已获 ${revealed.length} 条线索`,
              `📜 ${revealed.length} clue${revealed.length > 1 ? 's' : ''} gathered`,
            )}
          </span>
        )}
        {hasNetwork && (
          <span className="chip green">
            {tr('🕵️ 牙行网络已生效', "🕵️ Broker's Network active")}
          </span>
        )}
        {hasOceanRelay && (
          <span className="chip green">
            {tr('📡 远洋通译已生效', '📡 Ocean-Going Interpreter active')}
          </span>
        )}
      </summary>
      <div className="whisper-body">
        <div className="section-hint">
          {tr(
            `花费 ${g.intelCost} 金币向牙行打探贸易阶段（未来订单）的货物需求，每条密语都会在贸易阶段兑现为一张对应货品与港口的订单，提前备货即可稳赚。`,
            `Pay the brokers ${g.intelCost} gold for intel on upcoming Trade phase demand, every whisper becomes a real order for that exact item and port, so stock up early for a guaranteed sale.`,
          )}{' '}
          {hasNetwork
            ? tr(
                `当前已装备 🕵️ 牙行网络：每次仅需 ${g.intelCost} 金币，且一次获得 2 条线索。`,
                `🕵️ Broker's Network equipped: each purchase costs only ${g.intelCost} gold and reveals 2 clues.`,
              )
            : tr(
                '提示：在船坞安装 🕵️ 牙行网络模块后，每次仅需 2 金币且一次获得 2 条线索。',
                "Tip: install the 🕵️ Broker's Network module at the Shipyard to pay only 2 gold and get 2 clues per purchase.",
              )}
          {hasOceanRelay &&
            tr(
              ' 此外，📡 远洋通译已生效：每次额外多获得 1 条线索（不增加花费）。',
              ' Additionally, 📡 Ocean-Going Interpreter is active: each purchase reveals 1 extra clue at no added cost.',
            )}
          {g.brokerCorruption &&
            tr(
              ' ⚠️ 高难航路上并非每个牙行都可信：每次打探都有可能遇到可疑牙行走漏你的行踪，抬高本程海盗袭扰概率，记得在结算阶段权衡是否雇佣护航。',
              " ⚠️ On the hard route not every broker is trustworthy: each purchase risks a shady broker leaking your route and raising this voyage's pirate raid chance, so weigh hiring an escort at Upkeep.",
            )}
        </div>
        <div style={{ margin: '10px 0' }}>
          <button
            className="btn btn-gold"
            disabled={!canBuy}
            onClick={() => send({ action: 'purchaseIntel' })}
            title={
              remaining > 0
                ? canBuy
                  ? tr(`花费${g.intelCost}金币购买密语`, `Buy a whisper for ${g.intelCost} gold`)
                  : tr('现金不足', 'Not enough gold')
                : tr('本回合密语已打探完毕', 'No whispers left this round')
            }
          >
            {tr('🔮 购买密语', '🔮 Buy Whisper')} ({g.intelCost}💰)
            {remaining > 0
              ? tr(` · 剩余 ${remaining} 条`, ` · ${remaining} left`)
              : tr(' · 已无更多', ' · sold out')}
          </button>
        </div>
        {revealed.length > 0 ? (
          <>
            <div style={{ fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 4 }}>
              {tr('📜 已打探的消息：', '📜 Gathered intel:')}
            </div>
            {revealed.map((clue, i) => (
              <div className="whisper-clue" key={i}>
                {tr(
                  `🗣️ '${clue.port} 求购 ${clue.item}${ITEM_ICONS[clue.item] ?? ''}'`,
                  `🗣️ '${tn(clue.port, lang)} seeks ${tn(clue.item, lang)} ${ITEM_ICONS[clue.item] ?? ''}'`,
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="muted" style={{ padding: '6px 0' }}>
            {tr(
              '✨ 尚未打探到任何消息...花费金币聆听牙行的密语吧。',
              '✨ No intel yet... spend a little gold and lend the brokers your ear.',
            )}
          </div>
        )}
      </div>
    </details>
  );
}
