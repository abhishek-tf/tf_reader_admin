/**
 * Sign-in background art: an open book with pages fanning into a few drifting lines and dots,
 * the same restrained blue-only line-art language as every other page decoration (see
 * pageDecorations.jsx) — just full-bleed and much fainter, since it sits behind a form rather
 * than beside a heading. Lines are drawn in with a one-time CSS stroke animation
 * (`.login-decoration-line`, see index.css), skipped under prefers-reduced-motion.
 */
export default function LoginDecoration() {
  return (
    <svg
      className="login-decoration"
      viewBox="0 0 800 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g
        stroke="rgba(0,60,178,0.16)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* the open book, centred low */}
        <path
          className="login-decoration-line"
          d="M400 430 L400 300 C400 280 380 268 340 268 C300 268 260 280 230 300 L230 420 C260 400 300 388 340 388 C380 388 400 400 400 420 Z"
        />
        <path
          className="login-decoration-line"
          d="M400 430 L400 300 C400 280 420 268 460 268 C500 268 540 280 570 300 L570 420 C540 400 500 388 460 388 C420 388 400 400 400 420 Z"
        />
        <path className="login-decoration-line" d="M280 300 L280 400" strokeOpacity="0.6" />
        <path className="login-decoration-line" d="M320 290 L320 392" strokeOpacity="0.6" />
        <path className="login-decoration-line" d="M520 300 L520 400" strokeOpacity="0.6" />
        <path className="login-decoration-line" d="M480 290 L480 392" strokeOpacity="0.6" />

        {/* drifting shelf lines, top-left */}
        <path
          className="login-decoration-line"
          d="M40 90 L220 90"
          strokeDasharray="2 6"
          strokeOpacity="0.5"
        />
        <path
          className="login-decoration-line"
          d="M40 130 L170 130"
          strokeDasharray="2 6"
          strokeOpacity="0.4"
        />
        <path
          className="login-decoration-line"
          d="M40 170 L200 170"
          strokeDasharray="2 6"
          strokeOpacity="0.45"
        />

        {/* a small network of nodes, top-right, echoing the dashboard decoration's motif */}
        <path className="login-decoration-line" d="M620 120 L700 90 L760 140" strokeOpacity="0.4" />
        <circle cx="620" cy="120" r="4" strokeOpacity="0.5" />
        <circle cx="700" cy="90" r="4" strokeOpacity="0.5" />
        <circle cx="760" cy="140" r="4" strokeOpacity="0.5" />

        {/* a lone page corner, bottom-right */}
        <path
          className="login-decoration-line"
          d="M700 520 L760 500 L760 560 Z"
          strokeOpacity="0.35"
        />
      </g>
    </svg>
  );
}
