import { useEffect, useState } from 'react';
import { listPublishers } from '../api/publishers.js';
import { listInstitutions } from '../api/institution.js';
import { fetchAllPages } from '../api/client.js';

/**
 * The publisher/institution picker's own options for whichever scope the chosen role needs -
 * same reasoning as EntitlementScopeTargetField's useTargetOptions: an operator is scoped by
 * id, but nobody should have to know or type a raw `pub_...`/`inst_...` id, so this walks the
 * full list (`size` is capped at 100 by the contract) and maps it to a name a human can pick.
 * Loaded once per role, not per keystroke - a console's operator list is not catalogue-sized.
 */
export function useOperatorScopeOptions(role) {
  const [state, setState] = useState({ options: [], loading: false, error: null });

  useEffect(() => {
    if (role !== 'PUBLISHER_ADMIN' && role !== 'INSTITUTION_ADMIN') {
      setState({ options: [], loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState({ options: [], loading: true, error: null });

    const walk =
      role === 'PUBLISHER_ADMIN'
        ? fetchAllPages((page) => listPublishers({ page, size: 100 })).then((items) =>
            items.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))
          )
        : fetchAllPages((page) => listInstitutions({ page, size: 100 })).then((items) =>
            items.map((inst) => ({ value: inst.id, label: `${inst.name} (${inst.code})` }))
          );

    walk
      .then((options) => {
        if (!cancelled) setState({ options, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ options: [], loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  return state;
}
