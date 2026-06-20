import { useState } from 'react';
import { PHASE_FLOW } from '../../i18n/phaseFlow.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { pm1Label, pm1Url } from '../../i18n/pm1Links.js';
import { useSession } from '../../state/SessionContext.js';
import { CharterBanner } from '../panels/CharterBanner.js';
import { EnvironmentBanner } from '../panels/EnvironmentBanner.js';
import { useOpenManual } from '../manual/ManualModal.js';
import { PhaseBrief } from './PhaseBrief.js';
import { SetSailButton } from './SetSailButton.js';

const DISMISSED_KEY = 'pm2_banner_dismissed';

// Ported verbatim from PortMasters2/PortMasters_online.html welcomeHTML (lines 2600-2640):
// the first-voyage welcome page. Phase 0 doubles as the inter-round sync gate, so round 2+
// shows RoundStart instead (the original's "Phase 0 is both... " comment, lines 2602-2604).
export function SetSailPhase() {
  const { tr, pf, lang } = useTranslate();
  const { serverState } = useSession();
  const openManual = useOpenManual();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1');
  const g = serverState?.yourGame;
  if (!g) return null;

  if (g.currentRound > 1) return <RoundStartPhase />;

  return (
    <div className="center-block">
      <div className="hero-title">⚓ PortMasters 2 🚢</div>
      <div className="subtitle-text">
        {tr(
          '海上丝绸之路 · 扬帆远航 · 与其他船长同船竞航，成为海上霸主！',
          'The Maritime Silk Road · Set your course · Race fellow captains fleet-to-fleet to rule the seas!',
        )}
      </div>
      <EnvironmentBanner g={g} />
      {!dismissed && (
        <div className="pm-banner">
          <span className="pm-icon">📣</span>
          <span>
            {tr('欢迎来到 PortMasters 2！', 'Welcome to PortMasters 2!')}
            {tr(
              '本作引入增值税、所得税、工匠工资、多人同步互市等深度机制，上手门槛高于一代。建议先按 F1 阅读手册；若感到吃力，可先体验 ',
              ' This sequel adds VAT, income tax, artisan wages and synchronized bartering with fellow captains, a steeper curve than the original. Press F1 to read the manual; if it feels overwhelming, warm up with ',
            )}
            <a href={pm1Url(lang)} target="_blank" rel="noopener noreferrer">
              {pm1Label(lang)}
            </a>
          </span>
          <button
            className="pm-close"
            onClick={() => {
              localStorage.setItem(DISMISSED_KEY, '1');
              setDismissed(true);
            }}
            title={tr('不再显示此提示', "Don't show this again")}
          >
            ×
          </button>
        </div>
      )}
      <div className="section-box" style={{ textAlign: 'left' }}>
        <h3>{tr('🗺️ 本回合你将经历', "🗺️ This Round's Journey")}</h3>
        <div className="section-hint">
          {PHASE_FLOW.map((s, i) => (
            <span key={s.key}>
              {i > 0 && ' → '}
              {s.icon} <strong>{pf(s.name)}</strong>
            </span>
          ))}
          <br />
          {tr(
            '每个阶段都需所有船长确认后同步推进；互市阶段可与其他船长自由交易货物与金币。',
            'Every phase advances only after every captain confirms; during Barter you can trade goods and gold freely with anyone.',
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', margin: '22px 0' }}>
        <SetSailButton />
        <br />
        <button className="btn btn-lg" style={{ marginTop: 12 }} onClick={() => openManual()}>
          {tr('📖 游戏手册与新手指引', '📖 Manual & Beginner Guide')}
        </button>
      </div>
    </div>
  );
}

// Ported verbatim from PortMasters2/PortMasters_online.html roundStartHTML (lines 2643-2673):
// the round N (N>=2) Set Sail transition page, carrying the previous round's settlement recap.
function RoundStartPhase() {
  const { tr } = useTranslate();
  const { serverState } = useSession();
  const g = serverState?.yourGame;
  if (!g) return null;
  const s = g.lastRoundSummary;
  const net = s ? s.revenue - s.costs - s.incomeTax : 0;
  const gold = tr('金币', 'gold');

  return (
    <>
      <PhaseBrief phaseKey={0} />
      <div className="center-block" style={{ textAlign: 'center' }}>
        <CharterBanner charterEvent={g.charterEvent} />
        <EnvironmentBanner g={g} />
        <div style={{ fontSize: 54 }}>🌅</div>
        <div className="hero-title">
          {tr(`第 ${g.currentRound} 程 · 整装启航`, `Round ${g.currentRound} · Ready to Sail`)}
        </div>
        <div className="subtitle-text">
          {tr(
            `航程进度 ${g.currentRound} / ${g.maxRounds} · 与其他船长确认后抽取本程福缘`,
            `Voyage ${g.currentRound} of ${g.maxRounds} · confirm with your fellow captains to draw this round's fortunes`,
          )}
        </div>
        {s && (
          <div
            className="section-box"
            style={{ maxWidth: 460, margin: '14px auto', textAlign: 'left' }}
          >
            <h3>{tr(`📜 第 ${s.round} 程结算回顾`, `📜 Round ${s.round} Settlement Recap`)}</h3>
            <div className="stat-row" style={{ fontSize: 13 }}>
              <span>{tr('💰 本程营收', '💰 Revenue')}</span>
              <span className="profit-positive">
                +{s.revenue} {gold}
              </span>
            </div>
            <div className="stat-row" style={{ fontSize: 13 }}>
              <span>
                {tr(
                  '💸 本程支出（采购 / 运费 / 工资 / 维护）',
                  '💸 Expenses (purchases / shipping / wages / upkeep)',
                )}
              </span>
              <span className="profit-negative">
                −{s.costs} {gold}
              </span>
            </div>
            <div className="stat-row" style={{ fontSize: 13 }}>
              <span>{tr('📜 所得税', '📜 Income tax')}</span>
              <span className="profit-negative">
                −{s.incomeTax} {gold}
              </span>
            </div>
            <div
              className="stat-row"
              style={{
                fontSize: 13,
                borderTop: '1px solid rgba(148,163,184,.3)',
                marginTop: 4,
                paddingTop: 6,
              }}
            >
              <span>
                <strong>{tr('程末净利', 'Net result')}</strong>
              </span>
              <span className={net >= 0 ? 'profit-positive' : 'profit-negative'}>
                {net >= 0 ? '+' : ''}
                {net} {gold}
              </span>
            </div>
            <div className="stat-row" style={{ fontSize: 13 }}>
              <span>
                <strong>{tr('当前现金 · 声望', 'Gold · Renown')}</strong>
              </span>
              <strong>
                {s.money} {gold} · {s.score}
              </strong>
            </div>
          </div>
        )}
        <div style={{ margin: '20px 0' }}>
          <SetSailButton />
        </div>
      </div>
    </>
  );
}
