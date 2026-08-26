import {
  BatteryCharging, Headphones, Move3d, ShieldCheck, Smartphone, Tablet, Watch, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';

/** Category `icon` strings resolve here so the data files stay free of imports. */
const iconMap: Record<string, LucideIcon> = {
  Smartphone, ShieldCheck, Headphones, Zap, BatteryCharging, Move3d, Tablet, Watch, Wrench,
};

export function categoryIcon(name: string): LucideIcon {
  return iconMap[name] ?? Smartphone;
}
