import Icon from './Icon.jsx';

/**
 * One metric card in the 4-column KPI row Stitch puts under every list screen's banner —
 * a label, a big Aleo-set number, an icon, and a short helper line underneath.
 *
 * `accent` colours the icon Ultramarine instead of Slate, for the one metric per row Stitch
 * highlights (e.g. "Active Publishers" next to the plain "Total Publishers" count).
 */
export default function KpiCard({ label, value, icon, helper, accent = false }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <span className="kpi-card-label">{label}</span>
        {icon ? (
          <Icon name={icon} className={`kpi-card-icon ${accent ? 'kpi-card-icon-accent' : ''}`.trim()} />
        ) : null}
      </div>
      <div className="kpi-card-bottom">
        <span className="kpi-card-value">{value}</span>
        {helper ? <span className="kpi-card-helper">{helper}</span> : null}
      </div>
    </div>
  );
}
