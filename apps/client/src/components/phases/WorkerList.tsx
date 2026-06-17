import { RECIPES, WAGES, type ProductId, type Worker, type WorkerTypeId } from '@pm2/shared';
import { tn } from '../../i18n/enNames.js';
import { ITEM_ICONS } from '../../i18n/itemIcons.js';
import { wName } from '../../i18n/workerTypesText.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useWs } from '../../ws/WsContext.js';

interface WorkerListProps {
  type: WorkerTypeId;
  list: Worker[];
  tasks: readonly ProductId[];
}

// Ported verbatim from PortMasters2/PortMasters_online.html workerListHTML/fireWorkerConfirm
// (lines 2981-3018).
export function WorkerList({ type, list, tasks }: WorkerListProps) {
  const { tr, lang } = useTranslate();
  const { serverState } = useSession();
  const { send } = useWs();
  if (list.length === 0) return null;
  const name = wName(type, lang);
  const skilledTag = tr(' ⭐熟练（产2件）', ' ⭐ skilled (makes 2)');
  const inventory = serverState?.yourGame.inventory;

  const fireConfirm = (index: number) => {
    const confirmed = window.confirm(
      tr(
        `确定解雇这名${name}吗？需支付 ${WAGES[type]} 金币遣散费，且无法撤销。`,
        `Dismiss this ${name}? It costs ${WAGES[type]} gold severance and cannot be undone.`,
      ),
    );
    if (!confirmed) return;
    send({ action: 'fireWorker', workerType: type, index });
  };

  return (
    <div style={{ margin: '12px 0' }}>
      <strong style={{ color: 'var(--ocean-900)' }}>
        {name} × {list.length}
      </strong>
      {list.map((w, i) => (
        <div className="worker-row" key={i}>
          <span className="w-state">
            {name} {i + 1} ·{' '}
            {w.task ? (
              <span className="busy">
                {tr(`⚙️ 制作 ${w.task} 中`, `⚙️ crafting ${tn(w.task, lang)}`)}
              </span>
            ) : (
              <span className="idle">{tr('💤 空闲', '💤 idle')}</span>
            )}
            {w.isSkilled && skilledTag}
          </span>
          <span>
            {!w.task && (
              <button
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => fireConfirm(i)}
                title={tr(
                  `解雇需支付 ${WAGES[type]} 金币遣散费`,
                  `Dismissal costs ${WAGES[type]} gold severance`,
                )}
              >
                {tr(`解雇（付${WAGES[type]}💰）`, `Dismiss (${WAGES[type]}💰)`)}
              </button>
            )}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 6 }}>
        {tasks.map((t) => {
          const materials = Object.entries(RECIPES[t].materials) as [string, number][];
          const mats = materials
            .map(([m, a]) => `${ITEM_ICONS[m as keyof typeof ITEM_ICONS]}${tn(m, lang)}×${a}`)
            .join(' + ');
          const can = inventory
            ? materials.every(([m, a]) => (inventory[m as keyof typeof inventory] || 0) >= a)
            : false;
          return (
            <button
              key={t}
              className={`btn ${can ? '' : 'btn-grey'}`}
              style={{ margin: '3px 3px 0 0', padding: '7px 13px', fontSize: 11.5 }}
              onClick={() => send({ action: 'assignTask', workerType: type, task: t })}
              title={
                can
                  ? tr(
                      `指派一名空闲${name}生产，立即消耗：${mats}`,
                      `Assign an idle ${name}; immediately consumes: ${mats}`,
                    )
                  : tr(`材料不足：需 ${mats}`, `Missing materials: needs ${mats}`)
              }
            >
              {ITEM_ICONS[t]} {tr(`制作${t}`, `Craft ${tn(t, lang)}`)}
              <span className="btn-sub">
                {tr('耗', 'uses')} {mats}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
