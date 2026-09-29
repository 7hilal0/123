// High-fidelity vector avatars optimized for DZCORE
// SVG Data URIs ensure instant rendering without external network dependency or broken links

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
  
  <!-- Base Background -->
  <rect width="100" height="100" rx="50" fill="url(#bgGrad)" />
  <circle cx="50" cy="50" r="48" fill="none" stroke="#27272a" stroke-width="2" />
  
  <!-- Outer subtle emerald ring -->
  <circle cx="50" cy="50" r="48" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" stroke-dasharray="16 8" opacity="0.6" />

  <!-- Avatar Silhouette -->
  <g filter="url(#glow)">
    <!-- Head -->
    <circle cx="50" cy="38" r="16" fill="url(#bodyGrad)" stroke="#3f3f46" stroke-width="2"/>
    <!-- Sleek visor / face accent -->
    <rect x="40" y="34" width="20" height="4" rx="2" fill="url(#accentGrad)"/>
    
    <!-- Torso / Shoulders -->
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
  <!-- Mini Official Star -->
  <polygon points="50,14 52,18 56,19 53,22 54,26 50,24 46,26 47,22 44,19 48,18" fill="#10b981"/>
</svg>
`.trim())}`;

export const PRESET_AVATARS = [
  {
    id: 'default',
    name: 'DZCORE Cyber (Default)',
    url: DEFAULT_USER_AVATAR,
  },
  {
    id: 'official',
    name: 'DZCORE Official',
    url: OFFICIAL_DZCORE_AVATAR,
  },
  {
    id: 'coder_neon',
    name: 'Cyber Coder',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="50" fill="#09090b"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#06b6d4" stroke-width="2"/>
  <circle cx="50" cy="38" r="16" fill="#18181b" stroke="#06b6d4" stroke-width="2"/>
  <!-- Glasses / Terminal eyes -->
  <rect x="38" y="34" width="10" height="7" rx="2" fill="#06b6d4"/>
  <rect x="52" y="34" width="10" height="7" rx="2" fill="#06b6d4"/>
  <line x1="48" y1="37" x2="52" y2="37" stroke="#06b6d4" stroke-width="2"/>
  <!-- Smile -->
  <path d="M 44 45 Q 50 49 56 45" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
  <!-- Body -->
  <path d="M 22 84 C 24 64, 34 56, 50 56 C 66 56, 76 64, 78 84 Z" fill="#18181b" stroke="#06b6d4" stroke-width="2"/>
</svg>
`.trim())}`,
  },
  {
    id: 'friendly_smiley',
    name: 'DZCORE Smile :)',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="smGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#smGrad)"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#10b981" stroke-width="2"/>
  <!-- Eyes -->
  <circle cx="36" cy="42" r="5" fill="#34d399"/>
  <circle cx="64" cy="42" r="5" fill="#34d399"/>
  <!-- Big Friendly Smile -->
  <path d="M 33 56 C 38 72, 62 72, 67 56" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round"/>
</svg>
`.trim())}`,
  },
  {
    id: 'purple_galaxy',
    name: 'Cosmic Violet',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="purpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b0764"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
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
    id: 'amber_flame',
    name: 'Solar Amber',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="ambGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#ambGrad)"/>
  <circle cx="50" cy="50" r="47" fill="none" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="50" cy="38" r="16" fill="#292524" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="44" cy="36" r="3" fill="#fef3c7"/>
  <circle cx="56" cy="36" r="3" fill="#fef3c7"/>
  <path d="M 44 45 Q 50 49 56 45" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
  <path d="M 22 84 C 24 64, 34 56, 50 56 C 66 56, 76 64, 78 84 Z" fill="#292524" stroke="#fbbf24" stroke-width="2"/>
</svg>
`.trim())}`,
  },
];
