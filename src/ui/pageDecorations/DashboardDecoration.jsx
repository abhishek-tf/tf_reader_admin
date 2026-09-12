/** Dashboard: the pulse-and-node line art from Stitch's "Admin Dashboard" banner. */
export default function DashboardDecoration() {
  return (
    <svg viewBox="0 0 320 100" fill="none" preserveAspectRatio="xMidYMid meet">
      <g stroke="rgba(0,60,178,0.14)" strokeWidth="1" strokeLinecap="round">
        <line x1="20" y1="60" x2="90" y2="60" strokeDasharray="2 4" strokeOpacity="0.6" />
        <line x1="130" y1="60" x2="200" y2="60" strokeDasharray="2 4" strokeOpacity="0.6" />
        <line x1="240" y1="60" x2="300" y2="60" strokeDasharray="2 4" strokeOpacity="0.6" />
        <path d="M90 45 L100 35 L110 45 L100 55 Z" strokeOpacity="0.5" />
        <line x1="100" y1="55" x2="100" y2="75" strokeOpacity="0.4" />
        <circle cx="100" cy="80" r="2.5" strokeOpacity="0.5" />
        <path
          d="M130 60 L150 60 L156 40 L164 80 L172 50 L178 60 L200 60"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />
        <circle cx="240" cy="60" r="14" strokeDasharray="3 3" strokeOpacity="0.4" />
        <circle cx="240" cy="60" r="6" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}
