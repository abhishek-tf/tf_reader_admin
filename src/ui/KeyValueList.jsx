/**
 * A short list of keys and their values, stacked one per line.
 *
 * `pairs` is an array of [key, value]. It exists for the audit trail's before, after and
 * metadata columns, which are free-form objects that used to render as one JSON string per
 * cell. The values are monospace because they are machine-written, not prose.
 */
export default function KeyValueList({ pairs }) {
  return (
    <dl className="kv">
      {pairs.map(([key, value]) => (
        <div className="kv-row" key={key}>
          <dt className="kv-key">{key}</dt>
          <dd className="kv-value trace">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
