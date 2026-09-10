/**
 * The faint line-art each Stitch screen draws behind its own page banner — a different motif
 * per screen, not one piece of art reused everywhere. Each export here is lifted from that
 * screen's own banner background, purely decorative and `aria-hidden` wherever it's used.
 */

/** Publishers: the orbit-and-node diagram from Stitch's "Publishers" banner. */
export function PublishersDecoration() {
  return (
    <svg viewBox="0 0 360 110" fill="none" preserveAspectRatio="none">
      <g opacity="0.9">
        <circle cx="270" cy="55" r="42" stroke="rgba(0,60,178,0.12)" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="270" cy="55" r="32" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" />
        <line x1="160" y1="55" x2="238" y2="55" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="302" y1="55" x2="355" y2="55" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M270 33 L285 55 L270 77 L255 55 Z" stroke="rgba(0,60,178,0.16)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M110 32 Q 185 24 235 38" stroke="rgba(0,60,178,0.12)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M80 55 Q 165 48 238 55" stroke="rgba(0,60,178,0.12)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M110 78 Q 185 86 235 72" stroke="rgba(0,60,178,0.12)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Books: the open-book fanned-page diagram from Stitch's "Books & Catalogue" banner. */
export function BooksDecoration() {
  return (
    <svg viewBox="0 0 320 120" fill="none" preserveAspectRatio="none">
      <path d="M160 16 V108" stroke="rgba(0,60,178,0.18)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 22 C125 15 75 22 28 34" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 38 C125 31 75 38 28 50" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 54 C125 47 75 54 28 66" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 70 C125 63 75 70 28 82" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 86 C125 79 75 86 28 98" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 34 V98" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 22 C195 15 245 22 292 34" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 38 C195 31 245 38 292 50" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 54 C195 47 245 54 292 66" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 70 C195 63 245 70 292 82" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 86 C195 79 245 86 292 98" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M292 34 V98" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M154 104 C158 107 162 107 166 104" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M150 108 C156 112 164 112 170 108" stroke="rgba(0,60,178,0.12)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
