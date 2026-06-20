import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useModal } from '../modal/ModalContext.js';
import { useOpenManual } from '../manual/ManualModal.js';

const ONBOARDED_KEY = 'pm2_onboarded';

// Ported verbatim from PortMasters2/PortMasters_online.html maybeShowOnboarding/
// finishOnboarding (lines 3952-3989): a one-time tour shown the first time a session is
// entered, skipped on every later visit once `pm2_onboarded` is set.
export function shouldShowOnboarding(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) !== '1';
}

export function OnboardingTour() {
  const { tr, lang } = useTranslate();
  const { closeModal } = useModal();
  const openManual = useOpenManual();

  const finish = (openManualAfter: boolean) => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    closeModal();
    if (openManualAfter) openManual('start');
  };

  return (
    <>
      <h2>{tr('🧭 欢迎登船，船长！', '🧭 Welcome Aboard, Captain!')}</h2>
      <div className="manual-body" style={{ maxHeight: '46vh' }}>
        <p>
          {tr(
            '这里是 PortMasters 2 ， 海上丝绸之路双人联机贸易战略。开始前 60 秒了解三件事：',
            'This is PortMasters 2, a trading strategy for two captains on the Maritime Silk Road. Sixty seconds, three things to know:',
          )}
        </p>
        <p className="muted">
          {tr(
            '小提示：每一局有轻松、标准、高难三档难度，默认是轻松，由邀请时双方商定。觉得吃力就保持轻松，它只包含基础货物，更适合上手；想要更多挑战可以拾级而上。',
            'Tip: each session has Easy, Standard and Hard difficulties, Easy by default, agreed between the two of you when the invite is sent. If it feels like a lot, stay on Easy, which keeps to the founding set of goods and is friendlier for getting started, and climb the ladder when you want more.',
          )}
        </p>
        <h4>{tr('1️⃣ 一切围绕现金流', '1️⃣ Cash flow is everything')}</h4>
        <p>
          {tr(
            '每回合必须支付工匠工资与 15 金币维护费，付不起立即破产。左侧面板会实时核算「本回合应付款项」，时刻盯紧它。',
            'Every round you must pay artisan wages plus 15 gold upkeep, miss it and you go bankrupt instantly. The left panel tallies "Due This Round" live; keep an eye on it.',
          )}
        </p>
        <h4>{tr('2️⃣ 与伙伴同船同行', '2️⃣ You sail in lockstep with a partner')}</h4>
        <p>
          {tr(
            '每个阶段都需双方确认才推进（看底部「船长就绪 n/N」）。右侧面板可随时查看伙伴的存款、声望、货物、工匠与增益；互市阶段可自由交易，💬 聊天随时沟通。',
            "Every phase advances only when both captains confirm (see 'Ready n/N' at the bottom). The right panel shows your partner's gold, renown, cargo, artisans and buffs; trade freely during Barter and talk any time via 💬.",
          )}
        </p>
        <h4>{tr('3️⃣ 生产成品才赚大钱', '3️⃣ Real money is in finished goods')}</h4>
        <p>
          {tr(
            '雇工匠把原料加工成成品（香囊市价 95 到 120！），再交付订单。注意成品要缴约 5% 增值税，回合末还有约 10% 所得税。',
            'Hire artisans to turn materials into products (Sachets fetch 95 to 120!) and deliver them on orders. Mind the ~5% VAT on products and ~10% income tax at round end.',
          )}
        </p>
        <div className="pm-banner">
          <span className="pm-icon">💡</span>
          <span>
            {tr(
              '本作上手门槛较高。若中途感到吃力，可先体验 ',
              'The learning curve here is steep. If it gets overwhelming, warm up with ',
            )}
            <a href={pm1Url(lang)} target="_blank" rel="noopener noreferrer">
              {pm1Label(lang)}
            </a>
            {tr('，再回来挑战。', ' and come back.')}
          </span>
        </div>
      </div>
      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          display: 'flex',
          gap: 10,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button className="btn btn-success btn-lg" onClick={() => finish(false)}>
          {tr('⚓ 我已了解，开始航行', "⚓ Got it, let's sail")}
        </button>
        <button className="btn btn-gold btn-lg" onClick={() => finish(true)}>
          {tr('📖 先看完整手册', '📖 Read the full manual first')}
        </button>
      </div>
    </>
  );
}
