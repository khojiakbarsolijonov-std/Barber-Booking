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
    name: 'Atelier Bronze & Slate',
    tagline: 'Modern Atelier',
    description: "Zamonaviy atelye, issiq bronza va arxitektura slati",
    primary: '#C5A880',
    primaryHover: '#D4B892',
    secondary: '#A38F78',
    bg: '#121316',
    bgGradient: 'linear-gradient(180deg, #16181D 0%, #111215 100%)',
    surface: '#181A20',
    surfaceHover: '#20232B',
    border: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(197, 168, 128, 0.45)',
    glow: 'rgba(197, 168, 128, 0.12)',
    badgeBg: 'rgba(197, 168, 128, 0.08)',
    badgeText: '#E6DACB',
    badgeBorder: 'rgba(197, 168, 128, 0.2)',
  },
  'emerald-copper': {
    id: 'emerald-copper',
    name: 'Mayfair Emerald & Copper',
    tagline: 'British Heritage',
    description: "Britaniya aristokrat uslubi, to'q zumrad va mis bronza",
    primary: '#D48C5B',
    primaryHover: '#E29E6F',
    secondary: '#5EA37B',
    bg: '#0D1311',
    bgGradient: 'linear-gradient(180deg, #101915 0%, #0A0F0D 100%)',
    surface: '#131C18',
    surfaceHover: '#1A2621',
    border: 'rgba(212, 140, 91, 0.14)',
    borderActive: 'rgba(212, 140, 91, 0.5)',
    glow: 'rgba(212, 140, 91, 0.14)',
    badgeBg: 'rgba(94, 163, 123, 0.1)',
    badgeText: '#A7F3D0',
    badgeBorder: 'rgba(94, 163, 123, 0.22)',
  },
  'royal-navy': {
    id: 'royal-navy',
    name: 'Savile Row Navy & Platinum',
    tagline: 'Executive Modern',
    description: "Zamonaviy biznes eleqantligi, to'q ko'k va muzdek kumush",
    primary: '#7BA4D9',
    primaryHover: '#96B9E8',
    secondary: '#CBD5E1',
    bg: '#0D1117',
    bgGradient: 'linear-gradient(180deg, #111722 0%, #0A0D13 100%)',
    surface: '#131A26',
    surfaceHover: '#1B2433',
    border: 'rgba(123, 164, 217, 0.14)',
    borderActive: 'rgba(123, 164, 217, 0.5)',
    glow: 'rgba(123, 164, 217, 0.14)',
    badgeBg: 'rgba(123, 164, 217, 0.1)',
    badgeText: '#BFDBFE',
    badgeBorder: 'rgba(123, 164, 217, 0.22)',
  },
  'tokyo-carbon': {
    id: 'tokyo-carbon',
    name: 'Ginza Carbon & Titanium',
    tagline: 'Tokyo Minimalist',
    description: "Yapon arxitektura minimalizmi, mat qora va oq titan",
    primary: '#E4E4E7',
    primaryHover: '#F4F4F5',
    secondary: '#A1A1AA',
    bg: '#0F0F12',
    bgGradient: 'linear-gradient(180deg, #15151A 0%, #0B0B0E 100%)',
    surface: '#16161C',
    surfaceHover: '#1E1E26',
    border: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(255, 255, 255, 0.35)',
    glow: 'rgba(255, 255, 255, 0.08)',
    badgeBg: 'rgba(255, 255, 255, 0.06)',
    badgeText: '#F4F4F5',
    badgeBorder: 'rgba(255, 255, 255, 0.16)',
  },
  'amber-espresso': {
    id: 'amber-espresso',
    name: 'Vintage Cognac & Smoked Amber',
    tagline: 'Heritage Lounge',
    description: "Qimmatbaho charm, konyak va tutunli qahrabo ohangi",
    primary: '#D69E43',
    primaryHover: '#E5AF57',
    secondary: '#B57028',
    bg: '#120F0D',
    bgGradient: 'linear-gradient(180deg, #1A1411 0%, #0E0C0A 100%)',
    surface: '#1A1512',
    surfaceHover: '#231D19',
    border: 'rgba(214, 158, 67, 0.14)',
    borderActive: 'rgba(214, 158, 67, 0.5)',
    glow: 'rgba(214, 158, 67, 0.14)',
    badgeBg: 'rgba(214, 158, 67, 0.1)',
    badgeText: '#FDE68A',
    badgeBorder: 'rgba(214, 158, 67, 0.22)',
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
