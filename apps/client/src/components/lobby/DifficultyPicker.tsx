import type { Difficulty } from '@pm2/shared';
import { difficultyInfo } from '../../i18n/difficultyInfo.js';
import { useTranslate } from '../../i18n/useTranslate.js';

const DIFFICULTIES: Difficulty[] = ['easy', 'standard', 'hard'];

// Shared by the invitation and room composers so both pickers stay identical.
export function DifficultyPicker({
  difficulty,
  onChange,
}: {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}) {
  const { pf } = useTranslate();
  const info = difficultyInfo(difficulty);

  return (
    <>
      <div className="diff-options">
        {DIFFICULTIES.map((key) => {
          const optionInfo = difficultyInfo(key);
          return (
            <button
              type="button"
              key={key}
              className={`diff-option ${difficulty === key ? 'selected' : ''}`}
              onClick={() => onChange(key)}
            >
              <span className={`diff-badge diff-${key}`}>{pf(optionInfo.badge)}</span>
              <span className="diff-tagline">{pf(optionInfo.tagline)}</span>
            </button>
          );
        })}
      </div>
      <div className="diff-summary">{pf(info.summary)}</div>
    </>
  );
}
