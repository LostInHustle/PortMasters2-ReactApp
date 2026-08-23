import { useState, type JSX } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useModal } from '../modal/ModalContext.js';
import { BoonsTab } from './content/boonsTab.js';
import { EconomyTab } from './content/economyTab.js';
import { ExpansionTab } from './content/expansionTab.js';
import { FaqTab } from './content/faqTab.js';
import { FlowTab } from './content/flowTab.js';
import { ShipTab } from './content/shipTab.js';
import { StartTab } from './content/startTab.js';
import { TradeTab } from './content/tradeTab.js';
import { WorkersTab } from './content/workersTab.js';

export type ManualTabId =
  | 'start'
  | 'flow'
  | 'economy'
  | 'workers'
  | 'trade'
  | 'boons'
  | 'ship'
  | 'expansion'
  | 'faq';

// Ported verbatim from PortMasters2/PortMasters_online.html MANUAL_TABS_I18N (lines 3426-3450).
const TAB_IDS: ManualTabId[] = [
  'start',
  'flow',
  'economy',
  'workers',
  'trade',
  'boons',
  'ship',
  'expansion',
  'faq',
];

const TAB_LABELS: Record<ManualTabId, { zh: string; en: string }> = {
  start: { zh: '🚀 快速上手', en: '🚀 Quick Start' },
  flow: { zh: '🔄 回合流程', en: '🔄 Round Flow' },
  economy: { zh: '💰 经济与税务', en: '💰 Economy & Taxes' },
  workers: { zh: '👥 工匠与生产', en: '👥 Artisans & Crafting' },
  trade: { zh: '🤝 互市与联机', en: '🤝 Barter & Online' },
  boons: { zh: '🍀 福缘图鉴', en: '🍀 Fortune Codex' },
  ship: { zh: '🚢 船坞升级', en: '🚢 Ship Upgrades' },
  expansion: { zh: '🗺️ 难度与拓展', en: '🗺️ Difficulty & Expansion' },
  faq: { zh: '❓ 常见问题', en: '❓ FAQ' },
};

const TAB_COMPONENTS: Record<ManualTabId, () => JSX.Element> = {
  start: StartTab,
  flow: FlowTab,
  economy: EconomyTab,
  workers: WorkersTab,
  trade: TradeTab,
  boons: BoonsTab,
  ship: ShipTab,
  expansion: ExpansionTab,
  faq: FaqTab,
};

// Mirrors the original's `activeManualTab` module global (line 3925): remembers the last tab
// viewed across opens of the modal, since this component unmounts (and a plain useState would
// reset) every time the modal closes.
let lastActiveTab: ManualTabId = 'start';

// Ported verbatim from PortMasters2/PortMasters_online.html showManual/switchManualTab
// (lines 3926-3946).
export function ManualModal({ initialTab }: { initialTab?: ManualTabId }) {
  const { tr } = useTranslate();
  const { closeModal } = useModal();
  const [activeTab, setActiveTab] = useState<ManualTabId>(initialTab ?? lastActiveTab);

  const switchTab = (tab: ManualTabId) => {
    lastActiveTab = tab;
    setActiveTab(tab);
  };

  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <>
      <h2>{tr('📖 PortMasters 2 · 航海手册', "📖 PortMasters 2 · Captain's Manual")}</h2>
      <div className="manual-tabs">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            className={`mtab ${id === activeTab ? 'active' : ''}`}
            onClick={() => switchTab(id)}
          >
            {tr(TAB_LABELS[id].zh, TAB_LABELS[id].en)}
          </button>
        ))}
      </div>
      <div className="manual-body" id="manual-body">
        <ActiveTab />
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn" onClick={closeModal}>
          {tr('关闭（Esc）', 'Close (Esc)')}
        </button>
      </div>
    </>
  );
}

// Ported verbatim from PortMasters2/PortMasters_online.html showInstructions (line 3949) and
// every showManual()/showManual(tab) call site: opens the manual modal, remembering the last
// tab viewed if none is specified.
export function useOpenManual(): (tab?: ManualTabId) => void {
  const { openModal } = useModal();
  return (tab) => {
    if (tab) lastActiveTab = tab;
    openModal(<ManualModal initialTab={tab ?? lastActiveTab} />, true);
  };
}
