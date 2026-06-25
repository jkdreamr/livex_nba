import type { Graphic } from './types';
// SEED SUBSET — replaced by the PDF-generated catalog in Plan 2.
export const PLACEMENT_GRAPHIC_CATALOG: Graphic[] = [
  { id: 'plc_01_martini', label: 'Martini', category: 'fun', mood: ['vegas','playful'], dominantColors: ['#0A0A0A','#7CFC00'] },
  { id: 'plc_03_welcome-to-las-vegas', label: 'Welcome to Las Vegas', category: 'vegas', mood: ['vegas'], dominantColors: ['#E03A3E','#1D428A','#FFD200'] },
  { id: 'plc_05_basketball', label: 'Basketball', category: 'fun', mood: ['classic','streetwear'], dominantColors: ['#EE6730','#000000'] },
  { id: 'plc_40_flamingo', label: 'Flamingo', category: 'fun', mood: ['vegas','playful'], dominantColors: ['#FF6FA5','#FF9CC0'] },
  { id: 'plc_49_las-vegas-summer-league', label: 'Las Vegas Summer League', category: 'summer_league', mood: ['vegas','classic'], dominantColors: ['#1D428A','#E03A3E'] },
  { id: 'plc_54_cactus', label: 'Cactus', category: 'fun', mood: ['vegas','playful'], dominantColors: ['#4C9A2A'] },
  { id: 'plc_62_hawks', team: 'hawks', label: 'Atlanta Hawks', category: 'team', mood: ['classic','streetwear'], dominantColors: ['#E03A3E','#26282A'] },
  { id: 'plc_64_celtics', team: 'celtics', label: 'Boston Celtics', category: 'team', mood: ['classic'], dominantColors: ['#007A33','#FFFFFF'] },
  { id: 'plc_66_mavericks', team: 'mavericks', label: 'Dallas Mavericks', category: 'team', mood: ['classic'], dominantColors: ['#00538C'] },
  { id: 'plc_69_warriors', team: 'warriors', label: 'Golden State Warriors', category: 'team', mood: ['classic'], dominantColors: ['#1D428A','#FFC72C'] },
  // near-black graphic for harmony-rejection tests on black fabric:
  { id: 'plc_90_eclipse', label: 'Eclipse', category: 'fun', mood: ['streetwear'], dominantColors: ['#0A0A0A','#161616'] },
];
