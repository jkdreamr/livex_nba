export type HoodieColor = 'bone' | 'black' | 'grey' | 'white';
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
  density: Density; vibe: Vibe; mustHaveId?: string;
}
export interface DesignSpec {
  hoodieColor: HoodieColor;
  backGraphic: { id: string; zone: BackZone };
  patches: Array<{ id: string; zone: PatchZone; scale: number; rotationDeg: number }>;
  densityTier: Density;
  rationale: string;
  meta: { favoriteTeamsRanked: string[]; vibe: string; schemaVersion: '1.0' };
}
