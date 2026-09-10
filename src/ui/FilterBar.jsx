import Icon from './Icon.jsx';

/**
 * The search box and dropdown filters that sit above a paged DataTable.
 *
 * `filters` is an array of { name, label, value, onChange, placeholder, options, type }, each
 * an independent control. `type: 'text'` renders a plain box, for filtering on an id there is
 * no dropdown source for yet. Anything else renders a dropdown shaped like SelectField's
 * options: { value, label }.
 *
 * `trailing`, if given, renders inline after the dropdowns, in the same row — Stitch's own
 * placement for a filter bar's "Reset", rather than a whole extra row underneath just for
 * one quiet text button. Leaving it out renders exactly as before.
 */
export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  filters = [],
  trailing,
}) {
  return (
    <div className="filter-bar">
      <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
        <Icon
          name="search"
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18,
            color: 'var(--slate)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="search"
          className="input filter-bar-search"
          style={{ paddingLeft: 34 }}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
      {filters.map((filter) =>
        filter.type === 'text' ? (
          <input
            key={filter.name}
            type="text"
            className="input filter-bar-select"
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            placeholder={filter.placeholder ?? filter.label}
            aria-label={filter.label}
          />
        ) : (
          <select
            key={filter.name}
            className="input filter-bar-select"
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
          >
            <option value="">{filter.placeholder ?? filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      )}
      {trailing}
    </div>
  );
}
