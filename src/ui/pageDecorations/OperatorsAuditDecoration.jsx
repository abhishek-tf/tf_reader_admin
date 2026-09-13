/** Operators & Audit Log: the node-and-ledger diagram from Stitch's own banner. */
export default function OperatorsAuditDecoration() {
  return (
    <svg viewBox="0 0 420 120" fill="none" preserveAspectRatio="xMidYMid meet">
      <g
        stroke="rgba(0,60,178,0.14)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M30 60 L70 60 M110 60 L150 60 M190 60 L230 60 M270 60 L310 60 M350 60 L390 60" />
        <circle cx="90" cy="60" r="16" strokeDasharray="3 3" />
        <circle cx="90" cy="60" r="8" />
        <rect x="150" y="44" width="32" height="32" rx="6" />
        <path d="M166 52 L166 68 M158 60 L174 60" />
        <circle cx="250" cy="60" r="16" strokeDasharray="3 3" />
        <path d="M244 60 L248 64 L257 55" />
        <rect x="310" y="44" width="32" height="32" rx="6" />
        <path d="M326 50 L326 56 M321 56 L331 56 M321 56 L321 68 L331 68 L331 56" />
        <path
          d="M90 44 C90 26 150 22 166 22 C210 22 250 26 250 44"
          stroke="rgba(0,60,178,0.1)"
          strokeDasharray="2 4"
        />
        <path
          d="M166 76 C166 96 220 100 250 100 C290 100 326 94 326 76"
          stroke="rgba(0,60,178,0.1)"
          strokeDasharray="2 4"
        />
        <polygon points="380,24 394,32 394,48 380,56 366,48 366,32" stroke="rgba(0,60,178,0.1)" />
        <circle cx="380" cy="40" r="4" stroke="rgba(0,60,178,0.12)" />
      </g>
    </svg>
  );
}
