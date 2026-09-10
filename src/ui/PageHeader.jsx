/**
 * The banner at the top of every list screen in the Stitch designs: a title, an optional
 * subtitle, and the page's primary actions (usually one "New X" button) on the right.
 *
 * `decoration`, if given, is the faint line-art Stitch draws behind the banner — a different
 * motif per screen (see `pageDecorations.jsx`), not one piece of art reused everywhere. It's
 * purely cosmetic and `aria-hidden` wherever it's used; leaving it out renders no decoration
 * rather than falling back to some other screen's.
 */
export default function PageHeader({ title, subtitle, actions, decoration }) {
  return (
    <div className="page-banner">
      {decoration ? (
        <div className="page-banner-decoration" aria-hidden="true">
          {decoration}
        </div>
      ) : null}
      <div className="page-banner-text">
        <h1 className="page-banner-title">{title}</h1>
        {subtitle ? <p className="page-banner-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-banner-actions">{actions}</div> : null}
    </div>
  );
}
