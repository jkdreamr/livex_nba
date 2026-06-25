import type { QuestionnaireAnswers } from '@/lib/catalog/types';
import { backById, placementById } from '@/lib/catalog';

const VIBE_WORD: Record<QuestionnaireAnswers['vibe'], string> = {
  classic: 'clean and classic', vegas: 'full Vegas energy',
  streetwear: 'bold streetwear', playful: 'playful and fun',
};

export function buildRationale(answers: QuestionnaireAnswers, backId: string, patchIds: string[]): string {
  const back = backById(backId);
  const hero = back?.label ?? 'Summer League';
  const patchLabels = patchIds.map(id => placementById(id)?.label).filter(Boolean) as string[];
  const accents = patchLabels.length
    ? ` accented with ${patchLabels.slice(0, 3).join(', ')}`
    : '';
  return `Your ${hero} front-and-center on a ${answers.hoodieColor} hoodie, ${VIBE_WORD[answers.vibe]}${accents}.`;
}
