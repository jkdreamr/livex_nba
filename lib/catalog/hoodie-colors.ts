import type { HoodieColor, HoodieColorDef } from './types';
export const HOODIE_COLORS: HoodieColorDef[] = [
  { id: 'bone',  label: 'Bone',  hex: '#EDE6D6' },
  { id: 'black', label: 'Black', hex: '#1B1B1B' },
  { id: 'grey',  label: 'Grey',  hex: '#9B9FA4' },
  { id: 'white', label: 'White', hex: '#F7F7F5' },
];
export const FABRIC_HEX: Record<HoodieColor, string> =
  Object.fromEntries(HOODIE_COLORS.map(c => [c.id, c.hex])) as Record<HoodieColor, string>;
