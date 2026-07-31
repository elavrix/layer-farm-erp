// Transparent SVG icons for the farm dashboard
// All icons are original SVG paths — no external dependencies

export function EggIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="36" rx="18" ry="22" fill="currentColor" opacity="0.15"/>
      <ellipse cx="32" cy="36" rx="18" ry="22" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <ellipse cx="26" cy="30" rx="3" ry="4" fill="currentColor" opacity="0.2"/>
    </svg>
  );
}

export function BrokenEggIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="36" rx="18" ry="22" fill="currentColor" opacity="0.1"/>
      <path d="M14 36 Q18 14 32 14 Q46 14 50 36" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M14 36 Q16 58 32 58 Q48 58 50 36" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M26 14 L30 22 L24 28 L32 36" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      <path d="M14 36 Q32 42 50 36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
    </svg>
  );
}

export function HenIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="32" cy="40" rx="16" ry="13" fill="currentColor" opacity="0.15"/>
      <ellipse cx="32" cy="40" rx="16" ry="13" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Head */}
      <circle cx="48" cy="26" r="8" fill="currentColor" opacity="0.15"/>
      <circle cx="48" cy="26" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Beak */}
      <path d="M55 26 L60 24 L60 28 Z" fill="currentColor"/>
      {/* Comb */}
      <path d="M44 18 Q46 13 48 18 Q50 13 52 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Eye */}
      <circle cx="50" cy="24" r="1.5" fill="currentColor"/>
      {/* Wing */}
      <path d="M18 36 Q22 28 30 32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Tail feathers */}
      <path d="M16 38 Q10 32 12 26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M16 40 Q8 36 8 30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Legs */}
      <path d="M26 53 L24 60 M24 60 L20 62 M24 60 L28 62" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M38 53 L36 60 M36 60 L32 62 M36 60 L40 62" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function FeedBagIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bag body */}
      <rect x="12" y="20" width="40" height="36" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="12" y="20" width="40" height="36" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Bag tie top */}
      <path d="M20 20 Q32 12 44 20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M28 14 L36 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      {/* Grain texture lines */}
      <line x1="20" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <line x1="20" y1="38" x2="44" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <line x1="20" y1="46" x2="44" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      {/* Label */}
      <rect x="20" y="26" width="24" height="16" rx="2" fill="currentColor" opacity="0.1"/>
      {/* Grain dots */}
      <circle cx="26" cy="32" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="32" cy="32" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="38" cy="32" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="29" cy="37" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="35" cy="37" r="1.5" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

export function MoneyIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bills stack */}
      <rect x="8" y="20" width="48" height="30" rx="4" fill="currentColor" opacity="0.08"/>
      <rect x="8" y="20" width="48" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="10" y="16" width="48" height="30" rx="4" fill="currentColor" opacity="0.08"/>
      <rect x="10" y="16" width="48" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="12" y="12" width="48" height="30" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="12" y="12" width="48" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Circle on bill */}
      <circle cx="36" cy="27" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Rupee symbol */}
      <path d="M33 23 L39 23 M33 26 L39 26 M33 23 Q33 31 38 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Lines */}
      <line x1="16" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="46" y1="22" x2="52" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="32" x2="22" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="46" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function ShedIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 32 L32 10 L56 32" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <rect x="12" y="32" width="40" height="22" fill="currentColor" opacity="0.1"/>
      <rect x="12" y="32" width="40" height="22" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="26" y="42" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="16" y="36" width="10" height="8" rx="1" fill="currentColor" opacity="0.2"/>
      <rect x="38" y="36" width="10" height="8" rx="1" fill="currentColor" opacity="0.2"/>
    </svg>
  );
}
