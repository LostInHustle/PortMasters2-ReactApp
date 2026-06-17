import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';
import { Modules } from '../panels/FleetCard.js';
import { ModuleDraft } from './ModuleDraft.js';
import { PhaseBrief } from './PhaseBrief.js';

// Ported verbatim from PortMasters2/PortMasters_online.html shipyardHTML (lines 3129-3167).
export function ShipyardPhase() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  const g = serverState?.yourGame;
  if (!g) return null;

  const canUpgrade = g.shipLevel < 3;
  const upgCost = canUpgrade ? g.shipUpgradeCost[g.shipLevel]! + g.shipUpgradePenalty : 0;
  const slots = g.equippedModules.length;
  const slotsFull = g.shipLevel > 0 && slots >= g.shipLevel;

  return (
    <>
      <PhaseBrief phaseKey={4} />
      <div className="center-block">
        <div className="section-box">
          <h3>{tr('🚢 旗舰档案', '🚢 Flagship Profile')}</h3>
          <div className="stat-row" style={{ fontSize: 13 }}>
            <span>{tr('当前等级', 'Current level')}</span>
            <strong>Lv.{g.shipLevel} / 3</strong>
          </div>
          <div className="stat-row" style={{ fontSize: 13 }}>
            <span
              title={tr(
                '每单运费 = max(5, 件数×2 − 此减免)',
                'Shipping per order = max(5, items ×2 − this discount)',
              )}
            >
              {tr('运费永久减免', 'Permanent shipping discount')}
            </span>
            <strong>
              −{g.shipLevel * 5} {tr('金币/单', 'gold/order')}
            </strong>
          </div>
          <div className="stat-row" style={{ fontSize: 13 }}>
            <span>{tr('模块槽位', 'Module slots')}</span>
            <strong>
              {slots} / {g.shipLevel}
            </strong>
          </div>
          <div style={{ marginTop: 6 }}>
            <Modules g={g} />
          </div>
        </div>

        {g.draftOpen && <ModuleDraft g={g} draft={g.draftChoices} slotsFull={slotsFull} />}

        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {canUpgrade ? (
            <button
              className="btn btn-lg"
              disabled={g.money < upgCost}
              onClick={() => send({ action: 'upgradeShip' })}
              title={tr(
                '升级后每单运费永久再减5金币，并增加1个模块槽位',
                'Each upgrade permanently cuts shipping by another 5 gold and adds a module slot',
              )}
            >
              {tr(
                `⚓ 升级商船至 Lv.${g.shipLevel + 1}（${upgCost}💰）`,
                `⚓ Upgrade Ship to Lv.${g.shipLevel + 1} (${upgCost}💰)`,
              )}
              <span className="btn-sub">
                {tr('运费/单再 −5 金币 · +1 模块槽', 'Shipping −5 gold/order · +1 module slot')}
              </span>
            </button>
          ) : (
            <span className="chip green">
              {tr('⚓ 旗舰已满级 Lv.3', '⚓ Flagship at max level (Lv.3)')}
            </span>
          )}
          {!g.draftOpen && (
            <button
              className={`btn ${g.shipLevel > 0 ? 'btn-gold' : 'btn-grey'} btn-lg`}
              disabled={g.shipLevel === 0}
              onClick={() => send({ action: 'draftModules' })}
              title={
                g.shipLevel > 0
                  ? slotsFull
                    ? tr(
                        '查看本回合的模块选项，可替换现有模块',
                        "View this round's module options; you can replace an installed module",
                      )
                    : tr(
                        '查看本回合固定的 3 个模块选项，选择一个安装',
                        "View this round's fixed 3 module options and install one",
                      )
                  : tr(
                      '商船升至 Lv.1 后解锁模块槽位，方可选择船舶模块',
                      'Upgrade your ship to Lv.1 to unlock module slots before choosing',
                    )
              }
            >
              {g.shipLevel > 0 ? (
                <>
                  🔧{' '}
                  {slotsFull
                    ? tr('选择船舶模块（可替换）', 'Choose Ship Modules (replace)')
                    : tr('选择船舶模块', 'Choose Ship Modules')}
                </>
              ) : (
                <>
                  {tr('🔒 选择船舶模块', '🔒 Choose Ship Modules')}
                  <span className="btn-sub">
                    {tr('需先升级商船解锁槽位', 'Upgrade your ship to unlock slots')}
                  </span>
                </>
              )}
            </button>
          )}
          <button
            className="btn btn-success btn-lg"
            onClick={() => send({ action: 'ready_for_next_phase' })}
            title={tr(
              '双方确认后开始下一航程',
              'The next voyage begins once both captains confirm',
            )}
          >
            {tr('⏭️ 结束本航程', '⏭️ End This Voyage')}
            <span className="btn-sub">
              {tr('双方确认后开启下一程', 'Advances when both confirm')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
