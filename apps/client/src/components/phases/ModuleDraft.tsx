import type { PlayerGameState, ShipModule } from '@pm2/shared';
import { modDesc, modName } from '../../i18n/boonModuleMonsoonText.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useWs } from '../../ws/WsContext.js';

interface ModuleDraftProps {
  g: PlayerGameState;
  draft: ShipModule[];
  slotsFull: boolean;
}

// Ported verbatim from PortMasters2/PortMasters_online.html moduleDraftHTML (lines 3169-3209).
export function ModuleDraft({ g, draft, slotsFull }: ModuleDraftProps) {
  const { tr, lang } = useTranslate();
  const { send } = useWs();

  return (
    <div className="section-box" style={{ maxWidth: 780, margin: '18px auto' }}>
      <h3>{tr('🔧 模块选择', '🔧 Module Draft')}</h3>
      <div className="section-hint">
        {tr(
          '本回合的模块选项是固定的，关闭后再次打开仍是同一批。',
          "This round's options are fixed; closing and reopening shows the same batch.",
        )}{' '}
        {slotsFull
          ? tr(
              '槽位已满，选择新模块后需指定要替换的现有模块。',
              'All slots are full, so pick a new module then choose which installed one to replace.',
            )
          : tr('选择一个模块安装到空置槽位。', 'Pick one module to install in an empty slot.')}
      </div>
      {draft.length > 0 ? (
        <div className="card-grid">
          {draft.map((m, i) => (
            <div className="card" key={m.id}>
              <div className="card-header">
                <span>
                  {m.icon} {modName(m, lang)}
                </span>
              </div>
              <div className="card-body" style={{ fontSize: 12.5 }}>
                {modDesc(m, lang)}
              </div>
              <div className="card-footer">
                {slotsFull ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {g.equippedModules.map((old, j) => (
                      <button
                        className="btn btn-danger"
                        style={{ width: '100%', fontSize: 11.5 }}
                        onClick={() =>
                          send({ action: 'equipModule', choiceIndex: i, swapIndex: j })
                        }
                        key={old.id}
                      >
                        {tr('🔁 替换', '🔁 Replace')} {old.icon} {modName(old, lang)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    className="btn btn-success"
                    style={{ width: '100%' }}
                    onClick={() => send({ action: 'equipModule', choiceIndex: i })}
                  >
                    {tr('✅ 安装', '✅ Install')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="section-hint">
          {tr('本批模块已全部安装。', 'You have installed every module in this batch.')}
          {!g.draftRerolled &&
            tr('可点「换一批」再抽一批。', ' Use Change Batch for a fresh draw.')}
        </div>
      )}
      <div
        style={{
          textAlign: 'center',
          marginTop: 10,
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`btn ${g.draftRerolled ? 'btn-grey' : 'btn-gold'}`}
          disabled={g.draftRerolled}
          onClick={() => send({ action: 'rerollModuleDraft' })}
          title={
            g.draftRerolled
              ? tr('本回合的「换一批」已用过', 'Reroll already used this round')
              : tr(
                  '每回合一次：重新抽取一批可选模块',
                  'Once per round: draw a fresh batch of module options',
                )
          }
        >
          {g.draftRerolled
            ? tr('🔀 本回合已换过一批', '🔀 Batch already changed')
            : tr('🔀 换一批', '🔀 Change Batch')}
        </button>
        <button className="btn btn-ghost" onClick={() => send({ action: 'cancelModuleDraft' })}>
          {tr('❌ 关闭', '❌ Close')}
        </button>
      </div>
    </div>
  );
}
