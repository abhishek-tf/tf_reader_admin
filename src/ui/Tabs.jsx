/**
 * The bottom-border sub-tab row Stitch uses within a screen (e.g. "Admin Operators" vs
 * "Security & Activity Audit Log"). `tabs` is [{ key, label, count }]; `active` and
 * `onChange` are the caller's — this component only renders the strip.
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={active === tab.key ? 'tab tab-active' : 'tab'}
          onClick={() => onChange(tab.key)}
        >
          <span>{tab.label}</span>
          {typeof tab.count === 'number' ? <span className="tab-count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
