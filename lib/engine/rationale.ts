import type { QuestionnaireAnswers } from '@/lib/catalog/types';
import { backById, placementById } from '@/lib/catalog';

const STYLE_WORD: Record<QuestionnaireAnswers['vibe'], string> = {
  classic: 'clean and team-first', vegas: 'Vegas',
  streetwear: 'streetwear', playful: 'bright and playful',
};

export function buildRationale(answers: QuestionnaireAnswers, backId: string, patchIds: string[]): string {
  const back = backById(backId);
  const hero = back?.label ?? 'Summer League';
  const patchLabels = patchIds.map(id => placementById(id)?.label).filter(Boolean) as string[];
  const patchWord = patchLabels.length === 1 ? 'patch' : 'patches';
  const accents = patchLabels.length
    ? ` and uses ${patchLabels.slice(0, 3).join(', ')} ${patchWord}`
    : '';
  return `${hero} anchors a ${answers.hoodieColor} hoodie. The patch mix leans ${STYLE_WORD[answers.vibe]}${accents}.`;
}
