export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'patterns' | 'colors';
  bgClass: string;
  previewBg: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'default-doodle',
    name: 'WhatsApp Classic',
    category: 'patterns',
    bgClass: 'wallpaper-default-doodle',
    previewBg: 'bg-[#efeae2] dark:bg-[#0b141a]',
  },
  {
    id: 'subtle-dots',
    name: 'Polka Dots',
    category: 'patterns',
    bgClass: 'wallpaper-subtle-dots',
    previewBg: 'bg-emerald-50 dark:bg-[#0f1d18]',
  },
  {
    id: 'grid-matrix',
    name: 'Minimal Grid',
    category: 'patterns',
    bgClass: 'wallpaper-grid-matrix',
    previewBg: 'bg-slate-100 dark:bg-[#141d24]',
  },
  {
    id: 'hex-honeycomb',
    name: 'Honeycomb',
    category: 'patterns',
    bgClass: 'wallpaper-honeycomb',
    previewBg: 'bg-amber-50 dark:bg-[#1c1813]',
  },
  {
    id: 'solid-cream',
    name: 'Warm Parchment',
    category: 'colors',
    bgClass: 'wallpaper-warm-parchment',
    previewBg: 'bg-[#f4efe6] dark:bg-[#191917]',
  },
  {
    id: 'mint-fresh',
    name: 'Sage Mint',
    category: 'colors',
    bgClass: 'wallpaper-sage-mint',
    previewBg: 'bg-[#e7f3ec] dark:bg-[#0d1f18]',
  },
  {
    id: 'soft-lavender',
    name: 'Dusk Lavender',
    category: 'colors',
    bgClass: 'wallpaper-soft-lavender',
    previewBg: 'bg-[#ede8f5] dark:bg-[#1b1726]',
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Sky',
    category: 'colors',
    bgClass: 'wallpaper-ocean-sky',
    previewBg: 'bg-[#e3f0f7] dark:bg-[#0f1e29]',
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Dark',
    category: 'colors',
    bgClass: 'wallpaper-midnight-dark',
    previewBg: 'bg-[#e2e8f0] dark:bg-[#070b0e]',
  },
];
