/**
 * One Material Symbols Outlined glyph, by name — the icon set used throughout the Stitch
 * designs (nav glyphs, KPI icons, table actions). `name` is the exact symbol name Stitch's
 * own markup uses (e.g. "menu_book", "add", "expand_more"), so swapping an icon during page
 * migration is a one-word change against the Stitch screen, not a new import.
 *
 * Decorative by default (`aria-hidden`), since the label sitting next to it is almost always
 * what a screen reader should announce instead. Pass `label` on the rare icon that is the
 * only content of a control (e.g. an icon-only button).
 */
export default function Icon({ name, label, className = '', style }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      style={style}
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}
