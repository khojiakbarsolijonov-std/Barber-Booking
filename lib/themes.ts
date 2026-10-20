export interface LuxuryTheme {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primary: string;         // Primary accent color (hex)
  primaryHover: string;
  secondary: string;
  bg: string;              // Main base background
  bgGradient: string;      // Hero / section rich gradient
  surface: string;         // Card background
  surfaceHover: string;
  border: string;          // Subtle card border
  borderActive: string;
  glow: string;            // Shadow / glow rgba
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const LUXURY_THEMES: Record<string, LuxuryTheme> = {
  'noir-gold': {
    id: 'noir-gold',
    name: 'Noir & Champagne Gold',
    tagline: 'Classic Luxury',
    description: "Klassik lyuks, iliq tilla va chuqur obsidian",
    primary: '#D4AF37',
    primaryHover: '#E5C158',
    secondary: '#C5A880',
    bg: '#0B0C10',
    bgGradient: 'radial-gradient(ellipse at top, #1A1813 0%, #0B0C10 70%)',
    surface: '#13141C',
    surfaceHover: '#181A24',
    border: 'rgba(212, 175, 55, 0.14)',
    borderActive: 'rgba(212, 175, 55, 0.6)',
    glow: 'rgba(212, 175, 55, 0.22)',
    badgeBg: 'rgba(212, 175, 55, 0.1)',
    badgeText: '#F3E5AB',
    badgeBorder: 'rgba(212, 175, 55, 0.25)',
  },
  'emerald-copper': {
    id: 'emerald-copper',
    name: 'Mayfair Emerald & Copper',
    tagline: 'British Heritage',
    description: "Britaniya aristokrat uslubi, to'q zumrad va mis bronza",
    primary: '#D48C5B',
    primaryHover: '#E29E6F',
    secondary: '#5EA37B',
    bg: '#08100C',
    bgGradient: 'radial-gradient(ellipse at top, #0E2018 0%, #08100C 70%)',
    surface: '#0F1B15',
    surfaceHover: '#15241C',
    border: 'rgba(212, 140, 91, 0.18)',
    borderActive: 'rgba(212, 140, 91, 0.65)',
    glow: 'rgba(212, 140, 91, 0.24)',
    badgeBg: 'rgba(94, 163, 123, 0.12)',
    badgeText: '#A7F3D0',
    badgeBorder: 'rgba(94, 163, 123, 0.25)',
  },
  'royal-navy': {
    id: 'royal-navy',
    name: 'Savile Row Navy & Platinum',
    tagline: 'Executive Modern',
    description: "Zamonaviy biznes eleqantligi, to'q ko'k va muzdek kumush",
    primary: '#60A5FA',
    primaryHover: '#93C5FD',
    secondary: '#CBD5E1',
    bg: '#070A12',
    bgGradient: 'radial-gradient(ellipse at top, #10192D 0%, #070A12 70%)',
    surface: '#0E1526',
    surfaceHover: '#131D33',
    border: 'rgba(96, 165, 250, 0.16)',
    borderActive: 'rgba(96, 165, 250, 0.6)',
    glow: 'rgba(96, 165, 250, 0.22)',
    badgeBg: 'rgba(96, 165, 250, 0.1)',
    badgeText: '#BFDBFE',
    badgeBorder: 'rgba(96, 165, 250, 0.25)',
  },
  'tokyo-carbon': {
    id: 'tokyo-carbon',
    name: 'Ginza Carbon & Titanium',
    tagline: 'Tokyo Minimalist',
    description: "Yapon arxitektura minimalizmi, mat qora va oq titan",
    primary: '#FAFAFA',
    primaryHover: '#E4E4E7',
    secondary: '#A1A1AA',
    bg: '#09090B',
    bgGradient: 'radial-gradient(ellipse at top, #18181B 0%, #09090B 70%)',
    surface: '#121215',
    surfaceHover: '#18181D',
    border: 'rgba(255, 255, 255, 0.12)',
    borderActive: 'rgba(255, 255, 255, 0.5)',
    glow: 'rgba(255, 255, 255, 0.16)',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    badgeText: '#F4F4F5',
    badgeBorder: 'rgba(255, 255, 255, 0.2)',
  },
  'amber-espresso': {
    id: 'amber-espresso',
    name: 'Vintage Cognac & Smoked Amber',
    tagline: 'Heritage Lounge',
    description: "Qimmatbaho charm, konyak va tutunli qahrabo ohangi",
    primary: '#E5A93C',
    primaryHover: '#F0B854',
    secondary: '#C27830',
    bg: '#0E0A08',
    bgGradient: 'radial-gradient(ellipse at top, #231610 0%, #0E0A08 70%)',
    surface: '#16110D',
    surfaceHover: '#1F1713',
    border: 'rgba(229, 169, 60, 0.18)',
    borderActive: 'rgba(229, 169, 60, 0.65)',
    glow: 'rgba(229, 169, 60, 0.24)',
    badgeBg: 'rgba(229, 169, 60, 0.12)',
    badgeText: '#FDE68A',
    badgeBorder: 'rgba(229, 169, 60, 0.25)',
  },
};

export function getTheme(presetId?: string | null, customAccent?: string | null): LuxuryTheme {
  const base = LUXURY_THEMES[presetId || 'noir-gold'] || LUXURY_THEMES['noir-gold'];
  if (customAccent && customAccent !== '#C8A97E' && customAccent !== base.primary) {
    return {
      ...base,
      primary: customAccent,
      borderActive: customAccent,
      glow: `${customAccent}33`,
    };
  }
  return base;
}
