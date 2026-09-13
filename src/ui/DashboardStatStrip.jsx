/**
 * The dashboard's own KPI treatment — Stitch's single bordered strip divided into columns by
 * rules, rather than separate KpiCards. `stats` is `[{ label, value, helper, highlight }]`;
 * `highlight` tints one cell (Stitch's own "Pending Approvals" treatment) for the one number
 * on the strip worth a second look.
 */
export default function DashboardStatStrip({ stats }) {
  return (
    <div className="stat-strip">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={
            stat.highlight ? 'stat-strip-item stat-strip-item-highlight' : 'stat-strip-item'
          }
        >
          <div className="stat-strip-label">{stat.label}</div>
          <div className="stat-strip-value">{stat.value}</div>
          {stat.helper ? <div className="stat-strip-helper">{stat.helper}</div> : null}
        </div>
      ))}
    </div>
  );
}
