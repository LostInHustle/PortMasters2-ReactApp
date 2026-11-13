import { useCallback, useState, type JSX } from 'react';
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
  'start' | 'flow' | 'economy' | 'workers' | 'trade' | 'boons' | 'ship' | 'expansion' | 'faq';

interface ManualTab {
  id: ManualTabId;
  label: { zh: string; en: string };
  component: () => JSX.Element;
}

// Mirrors PortMasters2/PortMasters_online.html MANUAL_TABS_I18N.
const TABS: ManualTab[] = [
  { id: 'start', label: { zh: '🚀 快速上手', en: '🚀 Quick Start' }, component: StartTab },
  { id: 'flow', label: { zh: '🔄 回合流程', en: '🔄 Round Flow' }, component: FlowTab },
  {
    id: 'economy',
    label: { zh: '💰 经济与税务', en: '💰 Economy & Taxes' },
    component: EconomyTab,
  },
  {
    id: 'workers',
    label: { zh: '👥 工匠与生产', en: '👥 Artisans & Crafting' },
    component: WorkersTab,
  },
  {
    id: 'trade',
    label: { zh: '🤝 互市与联机', en: '🤝 Barter & Online' },
    component: TradeTab,
  },
  { id: 'boons', label: { zh: '🍀 福缘图鉴', en: '🍀 Fortune Codex' }, component: BoonsTab },
  { id: 'ship', label: { zh: '🚢 船坞升级', en: '🚢 Ship Upgrades' }, component: ShipTab },
  {
    id: 'expansion',
    label: { zh: '🗺️ 难度与拓展', en: '🗺️ Difficulty & Expansion' },
    component: ExpansionTab,
  },
  { id: 'faq', label: { zh: '❓ 常见问题', en: '❓ FAQ' }, component: FaqTab },
];

// Mirrors the original's `activeManualTab` module global: remembers the last tab
// viewed across opens of the modal, since this component unmounts (and a plain useState would
// reset) every time the modal closes.
let lastActiveTab: ManualTabId = 'start';

// Mirrors PortMasters2/PortMasters_online.html showManual/switchManualTab
function ManualModal({ initialTab }: { initialTab?: ManualTabId }) {
  const { tr } = useTranslate();
  const { closeModal } = useModal();
  const [activeTab, setActiveTab] = useState<ManualTabId>(initialTab ?? lastActiveTab);

  const switchTab = (tab: ManualTabId) => {
    lastActiveTab = tab;
    setActiveTab(tab);
  };

  const ActiveTab = (TABS.find((tab) => tab.id === activeTab) ?? TABS[0]!).component;

  return (
    <>
      <h2>{tr('📖 PortMasters 2 · 航海手册', "📖 PortMasters 2, Captain's Manual")}</h2>
      <div className="manual-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`mtab ${tab.id === activeTab ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
          >
            {tr(tab.label.zh, tab.label.en)}
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

// Mirrors PortMasters2/PortMasters_online.html showInstructions and
// every showManual()/showManual(tab) call site: opens the manual modal, remembering the last
// tab viewed if none is specified.
// Memoized because useKeyboardShortcuts lists it as an effect dependency: an unstable identity
// there rebinds the global keydown listener on every render.
export function useOpenManual(): (tab?: ManualTabId) => void {
  const { openModal } = useModal();
  return useCallback(
    (tab?: ManualTabId) => {
      if (tab) lastActiveTab = tab;
      openModal(<ManualModal initialTab={tab ?? lastActiveTab} />, true);
    },
    [openModal],
  );
}
