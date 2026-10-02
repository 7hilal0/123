// High-fidelity vector thumbnails & avatars optimized for DZCORE
// Self-contained SVG Data URIs ensure instant rendering without external network dependency, broken links or CORS taint.

export interface PresetThumbnail {
  id: string;
  name: string;
  nameAr: string;
  category: 'dzcore' | 'cyber' | 'gaming' | 'beasts' | 'cosmic' | 'art';
  url: string;
}

export const DEFAULT_USER_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#042f2e"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#10b981" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <rect width="100" height="100" rx="50" fill="url(#bgGrad)" />
  <circle cx="50" cy="50" r="48" fill="none" stroke="#27272a" stroke-width="2" />
  <circle cx="50" cy="50" r="48" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" stroke-dasharray="16 8" opacity="0.6" />

  <g filter="url(#glow)">
    <circle cx="50" cy="38" r="16" fill="url(#bodyGrad)" stroke="#3f3f46" stroke-width="2"/>
    <rect x="40" y="34" width="20" height="4" rx="2" fill="url(#accentGrad)"/>
    <path d="M 22 84 C 24 64, 34 56, 50 56 C 66 56, 76 64, 78 84 Z" fill="url(#bodyGrad)" stroke="#3f3f46" stroke-width="2"/>
    <path d="M 42 56 L 50 67 L 58 56 Z" fill="url(#accentGrad)" opacity="0.8"/>
  </g>
</svg>
`.trim())}`;

export const OFFICIAL_DZCORE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="adminBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#adminBg)"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="url(#emeraldGrad)" stroke-width="3"/>
  <text x="50" y="62" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" text-anchor="middle" letter-spacing="-1">
    <tspan fill="#10b981">D</tspan><tspan fill="#ffffff">Z</tspan>
  </text>
  <polygon points="50,14 52,18 56,19 53,22 54,26 50,24 46,26 47,22 44,19 48,18" fill="#10b981"/>
</svg>
`.trim())}`;

export const PRESET_AVATARS: PresetThumbnail[] = [
  // --- DZCORE & National ---
  {
    id: 'default',
    name: 'DZCORE Cyber',
    nameAr: 'ديزاد كور سايبر',
    category: 'dzcore',
    url: DEFAULT_USER_AVATAR,
  },
  {
    id: 'official',
    name: 'DZCORE Official',
    nameAr: 'الرسمي DZCORE',
    category: 'dzcore',
    url: OFFICIAL_DZCORE_AVATAR,
  },
  {
    id: 'dz_crescent',
    name: 'Emerald Crescent',
    nameAr: 'الهلال الزمردي',
    category: 'dzcore',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="dzg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b"/><stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#dzg)"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#10b981" stroke-width="2.5"/>
  <path d="M 54 28 A 22 22 0 1 0 54 72 A 16 16 0 1 1 54 28 Z" fill="#ffffff"/>
  <polygon points="62,45 64,49 68,50 65,53 66,57 62,55 58,57 59,53 56,50 60,49" fill="#ef4444"/>
</svg>
`.trim())}`,
  },
  {
    id: 'dz_gold_crown',
    name: 'Golden Vanguard',
    nameAr: 'التاج الذهبي الملكي',
    category: 'dzcore',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="#18181b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="url(#goldG)" stroke-width="2"/>
  <path d="M 28 65 L 72 65 L 74 44 L 60 54 L 50 32 L 40 54 L 26 44 Z" fill="url(#goldG)"/>
  <circle cx="50" cy="27" r="4" fill="#fbbf24"/>
  <circle cx="26" cy="40" r="3" fill="#fbbf24"/>
  <circle cx="74" cy="40" r="3" fill="#fbbf24"/>
</svg>
`.trim())}`,
  },

  // --- Cyber & Tech ---
  {
    id: 'coder_neon',
    name: 'Cyber Coder',
    nameAr: 'المبرمج السيبراني',
    category: 'cyber',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#09090b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#06b6d4" stroke-width="2"/>
  <circle cx="50" cy="38" r="16" fill="#18181b" stroke="#06b6d4" stroke-width="2"/>
  <rect x="38" y="34" width="10" height="7" rx="2" fill="#06b6d4"/>
  <rect x="52" y="34" width="10" height="7" rx="2" fill="#06b6d4"/>
  <line x1="48" y1="37" x2="52" y2="37" stroke="#06b6d4" stroke-width="2"/>
  <path d="M 44 45 Q 50 49 56 45" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
  <path d="M 22 84 C 24 64, 34 56, 50 56 C 66 56, 76 64, 78 84 Z" fill="#18181b" stroke="#06b6d4" stroke-width="2"/>
</svg>
`.trim())}`,
  },
  {
    id: 'hacker_terminal',
    name: 'Terminal Zero',
    nameAr: 'ترمينال هاكر',
    category: 'cyber',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#022c22"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#10b981" stroke-width="2"/>
  <rect x="25" y="28" width="50" height="44" rx="8" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
  <path d="M 33 44 L 40 50 L 33 56" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="44" y1="56" x2="56" y2="56" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>
</svg>
`.trim())}`,
  },
  {
    id: 'neon_samurai',
    name: 'Cyber Samurai',
    nameAr: 'ساموراي نيون',
    category: 'cyber',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#1e1b4b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#ec4899" stroke-width="2"/>
  <path d="M 28 32 L 50 18 L 72 32 L 66 58 L 50 74 L 34 58 Z" fill="#312e81" stroke="#f43f5e" stroke-width="2"/>
  <polygon points="50,26 58,40 42,40" fill="#f43f5e"/>
  <rect x="36" y="44" width="28" height="5" rx="2" fill="#38bdf8"/>
</svg>
`.trim())}`,
  },
  {
    id: 'ai_core',
    name: 'Quantum Core',
    nameAr: 'النواة الكمية الذكية',
    category: 'cyber',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#030712"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#3b82f6" stroke-width="2"/>
  <circle cx="50" cy="50" r="24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="50" cy="50" r="14" fill="#1d4ed8"/>
  <circle cx="50" cy="50" r="6" fill="#93c5fd"/>
</svg>
`.trim())}`,
  },

  // --- Gaming & Esports ---
  {
    id: 'gamepad_pro',
    name: 'Pro Controller',
    nameAr: 'يد تحكم إحترافية',
    category: 'gaming',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#18181b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#8b5cf6" stroke-width="2"/>
  <path d="M 28 42 C 34 34, 66 34, 72 42 C 78 52, 76 68, 70 70 C 64 72, 60 62, 54 62 L 46 62 C 40 62, 36 72, 30 70 C 24 68, 22 52, 28 42 Z" fill="#27272a" stroke="#a78bfa" stroke-width="2"/>
  <circle cx="66" cy="46" r="3" fill="#ec4899"/>
  <circle cx="61" cy="52" r="3" fill="#06b6d4"/>
  <rect x="36" y="47" width="8" height="3" rx="1.5" fill="#a78bfa"/>
  <rect x="38.5" y="44.5" width="3" height="8" rx="1.5" fill="#a78bfa"/>
</svg>
`.trim())}`,
  },
  {
    id: 'mecha_pilot',
    name: 'Mecha Pilot',
    nameAr: 'طيار ميكا قتالي',
    category: 'gaming',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#0f172a"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#f97316" stroke-width="2"/>
  <polygon points="50,22 68,36 68,64 50,78 32,64 32,36" fill="#1e293b" stroke="#fb923c" stroke-width="2"/>
  <polygon points="50,34 62,44 62,60 50,70 38,60 38,44" fill="#0284c7"/>
  <line x1="38" y1="52" x2="62" y2="52" stroke="#38bdf8" stroke-width="3"/>
</svg>
`.trim())}`,
  },
  {
    id: 'pixel_hero',
    name: 'Pixel Champion',
    nameAr: 'بطل البكسل الكلاسيكي',
    category: 'gaming',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#172554"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#38bdf8" stroke-width="2"/>
  <rect x="36" y="30" width="28" height="26" fill="#facc15"/>
  <rect x="40" y="36" width="6" height="6" fill="#0f172a"/>
  <rect x="54" y="36" width="6" height="6" fill="#0f172a"/>
  <rect x="42" y="48" width="16" height="4" fill="#dc2626"/>
  <rect x="30" y="58" width="40" height="24" fill="#2563eb"/>
</svg>
`.trim())}`,
  },
  {
    id: 'vr_spectre',
    name: 'VR Spectre',
    nameAr: 'خوذة الواقع الافتراضي',
    category: 'gaming',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#2e1065"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#c084fc" stroke-width="2"/>
  <rect x="26" y="36" width="48" height="22" rx="8" fill="#581c87" stroke="#e879f9" stroke-width="2"/>
  <line x1="26" y1="47" x2="74" y2="47" stroke="#22d3ee" stroke-width="3"/>
  <rect x="18" y="44" width="8" height="6" rx="2" fill="#a855f7"/>
  <rect x="74" y="44" width="8" height="6" rx="2" fill="#a855f7"/>
</svg>
`.trim())}`,
  },

  // --- Beasts & Creatures ---
  {
    id: 'cyber_falcon',
    name: 'Cyber Falcon',
    nameAr: 'الصقر السيبراني',
    category: 'beasts',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#042f2e"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#10b981" stroke-width="2"/>
  <polygon points="50,22 66,42 54,42 64,66 50,56 36,66 46,42 34,42" fill="#14b8a6"/>
  <circle cx="46" cy="38" r="2.5" fill="#fef08a"/>
  <circle cx="54" cy="38" r="2.5" fill="#fef08a"/>
</svg>
`.trim())}`,
  },
  {
    id: 'neon_wolf',
    name: 'Digital Wolf',
    nameAr: 'الذئب الرقمي',
    category: 'beasts',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#0f172a"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#38bdf8" stroke-width="2"/>
  <polygon points="32,24 40,42 26,46" fill="#0284c7"/>
  <polygon points="68,24 60,42 74,46" fill="#0284c7"/>
  <polygon points="36,44 50,76 64,44 50,34" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="43" cy="50" r="2.5" fill="#38bdf8"/>
  <circle cx="57" cy="50" r="2.5" fill="#38bdf8"/>
</svg>
`.trim())}`,
  },
  {
    id: 'golden_lion',
    name: 'Atlas Lion',
    nameAr: 'أسد الأطلس الذهبي',
    category: 'beasts',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#451a03"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="50" cy="50" r="26" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
  <polygon points="50,38 60,60 40,60" fill="#fbbf24"/>
  <polygon points="46,56 54,56 50,62" fill="#451a03"/>
  <circle cx="43" cy="48" r="3" fill="#fef3c7"/>
  <circle cx="57" cy="48" r="3" fill="#fef3c7"/>
</svg>
`.trim())}`,
  },

  // --- Cosmic & Space ---
  {
    id: 'cosmic_astronaut',
    name: 'Deep Voyager',
    nameAr: 'رائد الفضاء الكوني',
    category: 'cosmic',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#09090b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#a855f7" stroke-width="2"/>
  <circle cx="50" cy="40" r="18" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>
  <ellipse cx="50" cy="40" rx="13" ry="10" fill="#18181b" stroke="#06b6d4" stroke-width="2"/>
  <path d="M 28 84 C 30 65, 40 60, 50 60 C 60 60, 70 65, 72 84 Z" fill="#e4e4e7"/>
</svg>
`.trim())}`,
  },
  {
    id: 'purple_galaxy',
    name: 'Cosmic Violet',
    nameAr: 'المجرة البنفسجية',
    category: 'cosmic',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="purpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b0764"/><stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#purpGrad)"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#a855f7" stroke-width="2"/>
  <circle cx="50" cy="38" r="16" fill="#2e1065" stroke="#c084fc" stroke-width="2"/>
  <circle cx="43" cy="36" r="3" fill="#e9d5ff"/>
  <circle cx="57" cy="36" r="3" fill="#e9d5ff"/>
  <path d="M 45 45 Q 50 48 55 45" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round"/>
  <path d="M 22 84 C 24 64, 34 56, 50 56 C 66 56, 76 64, 78 84 Z" fill="#2e1065" stroke="#c084fc" stroke-width="2"/>
</svg>
`.trim())}`,
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    nameAr: 'التوهج الشمسي',
    category: 'cosmic',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="sunG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="#18181b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="url(#sunG)" stroke-width="2"/>
  <circle cx="50" cy="50" r="22" fill="url(#sunG)"/>
  <circle cx="50" cy="50" r="28" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="8 6"/>
</svg>
`.trim())}`,
  },

  // --- Art & Minimal ---
  {
    id: 'friendly_smiley',
    name: 'DZCORE Smile :)',
    nameAr: 'ابتسامة ديزاد كور',
    category: 'art',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="smGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/><stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#smGrad)"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#10b981" stroke-width="2"/>
  <circle cx="36" cy="42" r="5" fill="#34d399"/>
  <circle cx="64" cy="42" r="5" fill="#34d399"/>
  <path d="M 33 56 C 38 72, 62 72, 67 56" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round"/>
</svg>
`.trim())}`,
  },
  {
    id: 'prism_gradient',
    name: 'Spectrum Prism',
    nameAr: 'طيف الموشور الملون',
    category: 'art',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="prismG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="#09090b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="url(#prismG)" stroke-width="2.5"/>
  <polygon points="50,26 74,68 26,68" fill="url(#prismG)"/>
  <polygon points="50,38 64,62 36,62" fill="#09090b"/>
</svg>
`.trim())}`,
  },
];
