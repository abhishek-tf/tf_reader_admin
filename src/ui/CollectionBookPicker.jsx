import { useEffect, useState } from 'react';
import FormActions from './FormActions.jsx';
import CollectionBookSearch from './CollectionBookSearch.jsx';
import CollectionPickedBooks from './CollectionPickedBooks.jsx';
import { useToast } from './ToastContext.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { setCollectionItems } from '../api/collections.js';
import { fetchAllPages } from '../api/client.js';

/**
 * Owns one collection's membership as a plain { id, title } list, loaded once from
 * GET /catalogue-items?collectionId=... (there is no GET for a single collection's members).
 * Search results already carry a title, so a picked book's title is known the moment it is
 * added - no separate title-resolution pass like ShelfPickedBooks needs.
 *
 * PUT /collections/{id}/items is a full replace, not an add/remove delta, so Save sends the
 * whole list built here, the same shape ShelvesScreen already uses for a shelf's itemIds.
 */
export default function CollectionBookPicker({ collectionId }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load(signal) {
    setLoading(true);
    return fetchAllPages((page) =>
      listCatalogueItems({ collectionId, page, size: 100 }, { signal })
    )
      .then((loaded) => {
        setItems(loaded.map((item) => ({ id: item.id, title: item.title })));
        setLoading(false);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        toast.failed(error);
        setLoading(false);
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  function add(book) {
    setItems((current) =>
      current.some((item) => item.id === book.id) ? current : [...current, book]
    );
  }

  function remove(itemId) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await setCollectionItems(
        collectionId,
        items.map((item) => item.id)
      );
      toast.saved('Saved.');
    } catch (error) {
      toast.failed(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="muted">Loading this collection's books...</p>;
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <CollectionBookSearch
        pickedIds={items.map((item) => item.id)}
        onAdd={add}
        disabled={saving}
      />
      <CollectionPickedBooks items={items} onRemove={remove} disabled={saving} />
      <FormActions onCancel={() => load()} saving={saving} saveLabel="Save" cancelLabel="Revert" />
    </form>
  );
}
