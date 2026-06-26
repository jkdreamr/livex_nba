export type HoodieColor = 'bone' | 'black' | 'grey';
export type Audience = 'adult' | 'kid';
export type Density = 'minimal' | 'balanced' | 'maximal';
export type Vibe = 'classic' | 'vegas' | 'streetwear' | 'playful';
export type Mood = 'classic' | 'vegas' | 'streetwear' | 'playful';
export type BackZone = 'back_center';
export type PatchZone =
  | 'front_chest' | 'back_upper'
  | 'left_sleeve_1' | 'left_sleeve_2' | 'left_sleeve_3' | 'left_sleeve_4'
  | 'right_sleeve_1' | 'right_sleeve_2' | 'right_sleeve_3' | 'right_sleeve_4';
export type GraphicCategory =
  | 'summer_league' | 'vegas' | 'nba_league' | 'conference' | 'team' | 'city_text' | 'fun';

export interface Graphic {
  id: string; label: string; category: GraphicCategory;
  mood: Mood[]; dominantColors: string[]; file: string; team?: string;
}
export interface HoodieColorDef { id: HoodieColor; label: string; hex: string; }
export interface QuestionnaireAnswers {
  hoodieColor: HoodieColor; teamsRanked: string[];
  density: Density; vibe: Vibe;
  /** Patches the fan explicitly wants, in priority order (tap order). The #1
   *  pick lands in the highest-priority zone (front chest). Still subject to
   *  the colour-harmony invariant and the density cap. */
  mustHaveIds?: string[];
  /** Wearer audience. The garment is unisex; this only affects content — 'kid'
   *  keeps the design all-ages by excluding adult-themed patches. Defaults to
   *  'adult' when omitted. */
  audience?: Audience;
  /** Unisex size id (e.g. 'M', 'XL'). An order detail — it does NOT change the
   *  design the engine produces. */
  size?: string;
}
export interface DesignSpec {
  hoodieColor: HoodieColor;
  backGraphic: { id: string; zone: BackZone };
  patches: Array<{ id: string; zone: PatchZone; scale: number; rotationDeg: number }>;
  densityTier: Density;
  rationale: string;
  meta: { favoriteTeamsRanked: string[]; vibe: string; audience?: Audience; size?: string; schemaVersion: '1.0' };
}
