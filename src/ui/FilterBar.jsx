/**
 * The search box and dropdown filters that sit above a paged DataTable.
 *
 * `filters` is an array of { name, label, value, options, onChange, placeholder }, each an
 * independent dropdown shaped like SelectField's options: { value, label }.
 */
export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  filters = [],
}) {
  return (
    <div className="filter-bar">
      <input
        type="search"
        className="input filter-bar-search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
      {filters.map((filter) => (
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
      ))}
    </div>
  );
}
