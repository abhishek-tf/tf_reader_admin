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

// Split out of the main component purely to keep its own branching (loading/error/tenant) from
// adding to PublisherDatabaseVaultSection's own complexity count. No "not shown here" case
// remains: reading and writing a tenant now share the exact same access rule on the backend, so
// whoever can see this section at all can also see its current status.
function CurrentStatus({ loading, error, tenant }) {
  if (tenant) {
    return (
      <div className="stack" style={{ gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
        <div className="detail-hero-meta">
          <span className="muted small">Database connection</span>
          <StatusBadge status={tenant.connectionHealth} />
        </div>
        <div className="detail-hero-meta">
          <span className="muted small">Encryption key</span>
          <StatusBadge status={tenant.vaultRef ? 'CONFIGURED' : 'NOT_CONFIGURED'} />
        </div>
      </div>
    );
  }
  if (loading) return <p className="muted">Loading current status...</p>;
  if (error) return <p className="muted">{error.friendly}</p>;
  return null;
}

/**
 * The self-service "which database, which encryption key" controls for one publisher. Shared
 * between PublisherDetailScreen (a SUPER_ADMIN's normal path to any publisher) and
 * MyPublisherScreen (a PUBLISHER_ADMIN's normal path to their own one publisher) - neither
 * screen shares a route with the other, so this component, not a route, is what makes sure a
 * PUBLISHER_ADMIN actually encounters these controls in their normal flow.
 *
 * `canAccess` gates everything here - reading the current status and both PUT actions - because
 * the backend now uses the exact same rule for all three: true for any SUPER_ADMIN, and for a
 * PUBLISHER_ADMIN only when `publisherId` is their own scope. The server enforces the real check
 * regardless (FORBIDDEN_ROLE otherwise) - this only avoids dangling controls, or a doomed fetch,
 * in front of someone who would just get a 403.
 */
export default function PublisherDatabaseVaultSection({ publisherId, canAccess }) {
  const toast = useToast();
  const { tenant, loading, error, savingDatabase, savingVaultKey, saveDatabase, saveVaultKey } =
    useTenantSelfService(publisherId, canAccess);

  const [mongoUri, setMongoUri] = useState('');
  const [mongoError, setMongoError] = useState(null);
  const [keyBase64, setKeyBase64] = useState('');
  const [keyError, setKeyError] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, isRevert, value }

  if (!canAccess) return null;

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

      <CurrentStatus loading={loading} error={error} tenant={tenant} />

      {/* No canAccess check needed here: the component itself already returned null above
          when it's false, so reaching this point means both the status above and these
          controls are allowed. */}
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

      <TenantConfirmModal
        confirm={confirm}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
        saving={confirm?.kind === 'database' ? savingDatabase : savingVaultKey}
      />
    </Card>
  );
}
