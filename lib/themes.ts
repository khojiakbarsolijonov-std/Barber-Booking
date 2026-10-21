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
    name: 'Royal Gold & Deep Obsidian',
    tagline: 'Signature Luxury',
    description: "Klassik qirollik tillasi, iliq yaltiroq bronza va chuqur obsidian",
    primary: '#E5C365',
    primaryHover: '#F5D67D',
    secondary: '#D4AF37',
    bg: '#0A0C12',
    bgGradient: 'linear-gradient(180deg, #131722 0%, #080A0E 100%)',
    surface: '#141824',
    surfaceHover: '#1B2132',
    border: 'rgba(229, 195, 101, 0.18)',
    borderActive: '#E5C365',
    glow: 'rgba(229, 195, 101, 0.28)',
    badgeBg: 'rgba(229, 195, 101, 0.14)',
    badgeText: '#FBF3DC',
    badgeBorder: 'rgba(229, 195, 101, 0.38)',
  },
  'emerald-copper': {
    id: 'emerald-copper',
    name: 'Mayfair Emerald & Copper',
    tagline: 'British Heritage',
    description: "Britaniya boy zumrad yashili va issiq sayqallangan mis bronza",
    primary: '#10B981',
    primaryHover: '#34D399',
    secondary: '#EA580C',
    bg: '#05110C',
    bgGradient: 'linear-gradient(180deg, #0A1E16 0%, #040D09 100%)',
    surface: '#0D241B',
    surfaceHover: '#133527',
    border: 'rgba(16, 185, 129, 0.18)',
    borderActive: '#10B981',
    glow: 'rgba(16, 185, 129, 0.28)',
    badgeBg: 'rgba(16, 185, 129, 0.14)',
    badgeText: '#D1FAE5',
    badgeBorder: 'rgba(16, 185, 129, 0.38)',
  },
  'royal-navy': {
    id: 'royal-navy',
    name: 'Savile Row Sapphire & Platinum',
    tagline: 'Executive Modern',
    description: "Chuqur okean ko'ki, yorqin sapfir va muzdek kumush",
    primary: '#38BDF8',
    primaryHover: '#7DD3FC',
    secondary: '#60A5FA',
    bg: '#060D18',
    bgGradient: 'linear-gradient(180deg, #0C192E 0%, #040912 100%)',
    surface: '#0F213D',
    surfaceHover: '#162F56',
    border: 'rgba(56, 189, 248, 0.18)',
    borderActive: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.28)',
    badgeBg: 'rgba(56, 189, 248, 0.14)',
    badgeText: '#E0F2FE',
    badgeBorder: 'rgba(56, 189, 248, 0.38)',
  },
  'imperial-ruby': {
    id: 'imperial-ruby',
    name: 'Imperial Ruby & Rose Bronze',
    tagline: 'Velvet Lounge',
    description: "Aristokrat yoqut qizili, iliq atirgul bronzasi va baxmal qora",
    primary: '#F43F5E',
    primaryHover: '#FB7185',
    secondary: '#E11D48',
    bg: '#12070C',
    bgGradient: 'linear-gradient(180deg, #1E0C15 0%, #0D0408 100%)',
    surface: '#240F1A',
    surfaceHover: '#331525',
    border: 'rgba(244, 63, 94, 0.18)',
    borderActive: '#F43F5E',
    glow: 'rgba(244, 63, 94, 0.28)',
    badgeBg: 'rgba(244, 63, 94, 0.14)',
    badgeText: '#FFE4E6',
    badgeBorder: 'rgba(244, 63, 94, 0.38)',
  },
  'amber-espresso': {
    id: 'amber-espresso',
    name: 'Vintage Cognac & Smoked Amber',
    tagline: 'Heritage Lounge',
    description: "Qimmatbaho eman konyak, tutunli qahrabo va boy charm ohangi",
    primary: '#F59E0B',
    primaryHover: '#FBBF24',
    secondary: '#D97706',
    bg: '#110A05',
    bgGradient: 'linear-gradient(180deg, #1C120A 0%, #0B0603 100%)',
    surface: '#22150D',
    surfaceHover: '#2E1E12',
    border: 'rgba(245, 158, 11, 0.18)',
    borderActive: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.28)',
    badgeBg: 'rgba(245, 158, 11, 0.14)',
    badgeText: '#FEF3C7',
    badgeBorder: 'rgba(245, 158, 11, 0.38)',
  },
};

export function getTheme(presetId?: string | null, customAccent?: string | null): LuxuryTheme {
  // Alias tokyo-carbon or fallback
  const resolvedId = presetId === 'tokyo-carbon' ? 'noir-gold' : (presetId || 'noir-gold');
  const base = LUXURY_THEMES[resolvedId] || LUXURY_THEMES['noir-gold'];
  if (customAccent && customAccent !== '#C8A97E' && customAccent !== base.primary) {
    return {
      ...base,
      primary: customAccent,
      borderActive: customAccent,
      glow: `${customAccent}40`,
    };
  }
  return base;
}
