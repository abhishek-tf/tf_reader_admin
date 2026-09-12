/** Publishers: the orbit-and-node diagram from Stitch's "Publishers" banner. */
export default function PublishersDecoration() {
  return (
    <svg viewBox="0 0 360 110" fill="none" preserveAspectRatio="none">
      <g opacity="0.9">
        <circle
          cx="270"
          cy="55"
          r="42"
          stroke="rgba(0,60,178,0.12)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <circle cx="270" cy="55" r="32" stroke="rgba(0,60,178,0.14)" strokeWidth="1.5" />
        <line
          x1="160"
          y1="55"
          x2="238"
          y2="55"
          stroke="rgba(0,60,178,0.14)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="302"
          y1="55"
          x2="355"
          y2="55"
          stroke="rgba(0,60,178,0.14)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M270 33 L285 55 L270 77 L255 55 Z"
          stroke="rgba(0,60,178,0.16)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M110 32 Q 185 24 235 38"
          stroke="rgba(0,60,178,0.12)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M80 55 Q 165 48 238 55"
          stroke="rgba(0,60,178,0.12)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M110 78 Q 185 86 235 72"
          stroke="rgba(0,60,178,0.12)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
