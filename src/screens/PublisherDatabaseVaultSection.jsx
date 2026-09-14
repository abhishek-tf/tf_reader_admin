import { useState } from 'react';
import TextField from '../ui/TextField.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Icon from '../ui/Icon.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { isValid32ByteKey } from './tenantVaultKeyValidation.js';
import { useTenantSelfService } from './useTenantSelfService.js';
import TenantConfirmModal from './TenantConfirmModal.jsx';

// Split out of the main component purely to keep its own branching (loading/error/tenant/
// no-read-access) from adding to PublisherDatabaseVaultSection's own complexity count.
function CurrentStatus({ canRead, loading, error, tenant }) {
  if (!canRead) {
    return (
      <p className="muted small">
        Current status isn&apos;t shown here - only a SUPER_ADMIN can look up a publisher&apos;s
        tenant status. Saving below still applies immediately either way.
      </p>
    );
  }
  if (loading) return <p className="muted">Loading current status...</p>;
  if (error) return <p className="muted">{error.friendly}</p>;
  if (!tenant) return null;
  return (
    <p>
      Database connection: <StatusBadge status={tenant.connectionHealth} /> &nbsp;&middot;&nbsp;
      Encryption key: {tenant.vaultRef ? 'Configured' : "T&F's shared key"}
    </p>
  );
}

/**
 * The self-service "which database, which encryption key" controls for one publisher. Shared
 * between PublisherDetailScreen (a SUPER_ADMIN's normal path to any publisher) and
 * MyPublisherScreen (a PUBLISHER_ADMIN's normal path to their own one publisher) - neither
 * screen shares a route with the other, so this component, not a route, is what makes sure a
 * PUBLISHER_ADMIN actually encounters these controls in their normal flow.
 *
 * `canWrite` decides whether the two PUT actions render at all: true for any SUPER_ADMIN, and
 * for a PUBLISHER_ADMIN only when `publisherId` is their own scope. The server enforces the
 * real check on every PUT regardless (FORBIDDEN_ROLE otherwise) - this only avoids dangling a
 * control in front of someone who would just get a 403.
 *
 * `canRead` (SUPER_ADMIN only - GET /tenants/{id} has no self-service carve-out) decides
 * whether current connectionHealth/vaultRef are fetched and shown before any write. A
 * PUBLISHER_ADMIN never sees a "current status" here, only the write forms, until their own
 * first successful save populates it for the rest of that session.
 */
export default function PublisherDatabaseVaultSection({ publisherId, canRead, canWrite }) {
  const toast = useToast();
  const { tenant, loading, error, savingDatabase, savingVaultKey, saveDatabase, saveVaultKey } =
    useTenantSelfService(publisherId, canRead);

  const [mongoUri, setMongoUri] = useState('');
  const [mongoError, setMongoError] = useState(null);
  const [keyBase64, setKeyBase64] = useState('');
  const [keyError, setKeyError] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, isRevert, value }

  if (!canRead && !canWrite) return null;

  function changeMongoUri(_name, value) {
    setMongoUri(value);
    setMongoError(null);
  }

  function changeKeyBase64(_name, value) {
    setKeyBase64(value);
    setKeyError(null);
  }

  function handleSetDatabase() {
    const trimmed = mongoUri.trim();
    if (!trimmed) {
      setMongoError('Enter a connection string, or use "Revert to shared database" instead.');
      return;
    }
    setConfirm({ kind: 'database', isRevert: false, value: trimmed });
  }

  function handleRevertDatabase() {
    setConfirm({ kind: 'database', isRevert: true, value: null });
  }

  function handleSetVaultKey() {
    const trimmed = keyBase64.trim();
    if (!isValid32ByteKey(trimmed)) {
      setKeyError('Enter a base64-encoded 256-bit (32-byte) key.');
      return;
    }
    setConfirm({ kind: 'vaultKey', isRevert: false, value: trimmed });
  }

  function handleRevertVaultKey() {
    setConfirm({ kind: 'vaultKey', isRevert: true, value: null });
  }

  async function handleConfirm() {
    const { kind, value } = confirm;
    try {
      if (kind === 'database') {
        await saveDatabase(value);
        setMongoUri('');
        toast.saved(value ? 'Database updated.' : 'Reverted to the shared database.');
      } else {
        await saveVaultKey(value);
        setKeyBase64('');
        toast.saved(value ? 'Encryption key updated.' : "Reverted to T&F's shared key.");
      }
      setConfirm(null);
    } catch (failure) {
      setConfirm(null);
      toast.failed(failure);
    }
  }

  return (
    <Card>
      <div className="detail-section-title">
        <h2>
          <Icon name="lock" style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Database &amp; encryption key
        </h2>
      </div>

      <CurrentStatus canRead={canRead} loading={loading} error={error} tenant={tenant} />

      {canWrite ? (
        <div className="stack">
          <div>
            <TextField
              label="Dedicated MongoDB connection string"
              name="mongoUri"
              value={mongoUri}
              onChange={changeMongoUri}
              error={mongoError}
              placeholder="mongodb+srv://..."
              disabled={savingDatabase}
              hint="Switching does not migrate existing data - you'll be asked to confirm before this takes effect."
            />
            <div className="row-buttons">
              <Button variant="primary" onClick={handleSetDatabase} disabled={savingDatabase}>
                {savingDatabase ? 'Saving...' : 'Set database'}
              </Button>
              <Button onClick={handleRevertDatabase} disabled={savingDatabase}>
                Revert to shared database
              </Button>
            </div>
          </div>

          <div>
            <TextField
              label="Encryption key (base64, 256-bit)"
              name="keyBase64"
              value={keyBase64}
              onChange={changeKeyBase64}
              error={keyError}
              placeholder="44-character base64 string"
              disabled={savingVaultKey}
              hint="Never shown again once saved. Changing or clearing it makes anything encrypted with the old key unreadable."
            />
            <div className="row-buttons">
              <Button variant="primary" onClick={handleSetVaultKey} disabled={savingVaultKey}>
                {savingVaultKey ? 'Saving...' : 'Set key'}
              </Button>
              <Button onClick={handleRevertVaultKey} disabled={savingVaultKey}>
                Revert to shared key
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <TenantConfirmModal
        confirm={confirm}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
        saving={confirm?.kind === 'database' ? savingDatabase : savingVaultKey}
      />
    </Card>
  );
}
