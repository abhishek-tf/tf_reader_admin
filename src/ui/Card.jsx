/**
 * The plain white, Cloud-bordered, rounded surface Stitch uses for every panel — a KPI card,
 * a table's wrapper, a sidebar summary block. Just the shell; layout inside is the caller's.
 */
export default function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
