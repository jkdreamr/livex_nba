import { z } from 'zod';
export const answersSchema = z.object({
  hoodieColor: z.enum(['bone', 'black', 'grey']),
  teamsRanked: z.array(z.string()).default([]),
  density: z.enum(['minimal', 'balanced', 'maximal']),
  vibe: z.enum(['classic', 'vegas', 'streetwear', 'playful']),
  mustHaveIds: z.array(z.string()).optional(),
  audience: z.enum(['adult', 'kid']).optional(),
  size: z.string().optional(),
  seed: z.number().int().nonnegative().optional(),
});
