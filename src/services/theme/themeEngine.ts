import type { StageThemeName } from '../../types';

export type StageTheme = {
  name: StageThemeName;
  label: string;
  className: string;
};

export const stageThemes: StageTheme[] = [
  { name: 'standard-dark', label: 'Standard Dark', className: 'bg-slate-950 text-slate-100' },
  { name: 'standard-light', label: 'Standard Light', className: 'bg-stage-paper text-slate-950' },
  { name: 'coffeehouse', label: 'Coffeehouse', className: 'stage-coffeehouse bg-[#110d0a] text-[#f4ead2]' },
  { name: 'high-contrast', label: 'High Contrast', className: 'bg-black text-white' },
  { name: 'outdoor', label: 'Outdoor Visibility', className: 'bg-white text-black' }
];

export function getStageTheme(name: StageThemeName) {
  return stageThemes.find((theme) => theme.name === name) ?? stageThemes[0];
}
