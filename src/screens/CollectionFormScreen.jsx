import { Link, useNavigate, useParams } from 'react-router-dom';
import CollectionForm from './CollectionForm.jsx';

/**
 * Add one collection to a publisher, at its own address.
 *
 * Create only. There is no endpoint for changing a collection's name or code — the contract's
 * only write after creation is PUT /collections/{id}/items, which is a different job — so
 * there is deliberately no edit route to match this one.
 */
export default function CollectionFormScreen() {
  const { publisherId } = useParams();
  const navigate = useNavigate();

  const backToPublisher = `/publishers/${publisherId}`;

  return (
    <div className="stack">
      <section className="card">
        <div className="row-buttons">
          <Link className="btn" to={backToPublisher}>
            Back to the publisher
          </Link>
        </div>
        <h1>New collection</h1>
      </section>

      <CollectionForm
        publisherId={publisherId}
        onCreated={() => navigate(backToPublisher)}
        onCancel={() => navigate(backToPublisher)}
      />
    </div>
  );
}
