import type { CSSProperties } from 'react';
import { useLang } from '../../i18n/LangContext.js';
import { useTranslate } from '../../i18n/useTranslate.js';

// The icon style switch, shown beside the language switch on every page (header, login,
// lobby). Emojis are the default. The label names the style the button will switch to, the
// same convention the language switch follows.
export function IconToggle({ className, style }: { className?: string; style?: CSSProperties }) {
  const { iconMode, toggleIconMode } = useLang();
  const { tr } = useTranslate();
  return (
    <button
      className={className ?? 'btn btn-ghost'}
      style={style}
      onClick={toggleIconMode}
      title={
        iconMode === 'han'
          ? tr(
              '将货物、工匠与船长头像切换为表情图标',
              'Show goods, artisans and captain avatars as emojis',
            )
          : tr(
              '将货物、工匠与船长头像切换为汉字图标',
              'Show goods, artisans and captain avatars as Chinese characters',
            )
      }
    >
      {iconMode === 'han'
        ? tr('😀 表情图标', '😀 Emoji Icons')
        : tr('🀄 汉字图标', '🀄 Character Icons')}
    </button>
  );
}
