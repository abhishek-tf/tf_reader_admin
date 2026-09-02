import ItemRequestBrowser from './ItemRequestBrowser.jsx';
import CollectionRequestBrowser from './CollectionRequestBrowser.jsx';
import PublisherRequestBrowser from './PublisherRequestBrowser.jsx';

/**
 * An institution admin's own view, one section per scope: every book they can ask for
 * (ItemRequestBrowser), every collection the same way (CollectionRequestBrowser, against GET
 * /api/admin/v1/collections), and a plain id field for a publisher (PublisherRequestBrowser) —
 * there is still no browsable "every publisher, tagged with status" list, the same reason
 * BookForm uses a plain id for a publisher elsewhere in the console. Split three ways since
 * all three in one file was over the line budget; this component owns nothing beyond passing
 * institutionId down to each.
 */
export default function InstitutionCatalogueBrowser({ institutionId }) {
  return (
    <div className="stack">
      <ItemRequestBrowser institutionId={institutionId} />
      <CollectionRequestBrowser institutionId={institutionId} />
      <PublisherRequestBrowser institutionId={institutionId} />
    </div>
  );
}
