import { useState, useEffect } from 'react';
import { applicationsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ApplicationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteItem, setDeleteItem] = useState(null);

  // Google Sheets sync state
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedRoleKey, setSelectedRoleKey] = useState('campus_ambassador');
  const [customRoleName, setCustomRoleName] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [saveSheetUrl, setSaveSheetUrl] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await applicationsApi.getAll();
      setItems(Array.isArray(data) ? data : data.applications || []);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    try {
      const data = await applicationsApi.getSources();
      setSources(data || []);
      // If a role key is selected, pre-fill its sheet URL
      const current = (data || []).find((s) => s.key === selectedRoleKey);
      if (current && current.sheetUrl) {
        setSheetUrl(current.sheetUrl);
      }
    } catch {
      // Fallback silently if sources endpoint fails
    }
  };

  useEffect(() => {
    fetchItems();
    loadSources();
  }, []);

  // When selected role changes in sync modal, auto-populate its saved sheet URL
  const handleRoleSelectChange = (key) => {
    setSelectedRoleKey(key);
    setSyncMessage('');
    if (key === 'custom') {
      setSheetUrl('');
      return;
    }
    const found = sources.find((s) => s.key === key);
    if (found && found.sheetUrl) {
      setSheetUrl(found.sheetUrl);
    } else {
      setSheetUrl('');
    }
  };

  const handleOpenSync = async () => {
    setIsSyncOpen(true);
    setSyncMessage('');
    await loadSources();
    // Default to currently filtered role if applicable
    if (filterRole !== 'All') {
      const match = sources.find((s) => s.roleName.toLowerCase() === filterRole.toLowerCase());
      if (match) {
        setSelectedRoleKey(match.key);
        setSheetUrl(match.sheetUrl || '');
        return;
      }
    }
    // Otherwise pick first source with a sheet or first source
    const defaultSource = sources.find((s) => s.sheetUrl) || sources[0];
    if (defaultSource) {
      setSelectedRoleKey(defaultSource.key);
      setSheetUrl(defaultSource.sheetUrl || '');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item) => {
    setDeleteItem(item);
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await applicationsApi.delete(deleteItem.id);
      setItems(items.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      applicant_name: formData.get('applicant_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      role: formData.get('role'),
      district: formData.get('district'),
      state: formData.get('state'),
      college: formData.get('college'),
      status: formData.get('status'),
      notes: formData.get('notes'),
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await applicationsApi.update(editingItem.id, data);
        setItems(items.map((i) => (i.id === editingItem.id ? { ...i, ...data } : i)));
      } else {
        await applicationsApi.create(data);
        await fetchItems();
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync a single sheet
  const handleSync = async (e) => {
    e.preventDefault();
    setSyncing(true);
    setSyncMessage('');

    let effectiveRole = '';
    let formKey = null;

    if (selectedRoleKey === 'custom') {
      effectiveRole = customRoleName.trim() || 'General Applicant';
    } else {
      const source = sources.find((s) => s.key === selectedRoleKey);
      effectiveRole = source?.roleName || 'General Applicant';
      formKey = selectedRoleKey;
    }

    try {
      const result = await applicationsApi.syncSheet({
        sheet_url: sheetUrl.trim(),
        default_role: effectiveRole,
        form_key: formKey,
        save_sheet_url: saveSheetUrl,
      });

      setSyncMessage(result.message || 'Sync completed successfully.');
      await fetchItems();
      await loadSources();

      setTimeout(() => {
        setIsSyncOpen(false);
        setSyncMessage('');
      }, 3500);
    } catch (err) {
      setSyncMessage(err.message || 'Failed to sync Google Sheet.');
    } finally {
      setSyncing(false);
    }
  };

  // 1-Click Sync across all connected sheets
  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncMessage('');
    try {
      const result = await applicationsApi.syncAll();
      setSyncMessage(result.message);
      await fetchItems();
      await loadSources();
      setTimeout(() => {
        setIsSyncOpen(false);
        setSyncMessage('');
      }, 4000);
    } catch (err) {
      setSyncMessage(err.message || 'Sync All failed.');
    } finally {
      setSyncingAll(false);
    }
  };

  const statusColors = {
    Received: '#3b82f6',
    'Under Review': '#f59e0b',
    Selected: '#22c55e',
    Waitlisted: '#8b5cf6',
    Rejected: '#ef4444',
    Withdrawn: '#6b7280',
  };

  const getColumns = () => {
    return [
      {
        label: 'Applicant Name',
        field: 'applicant_name',
        render: (row) => (
          <div>
            <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{row.applicant_name}</strong>
            {row.application_id && (
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                {row.application_id}
              </span>
            )}
          </div>
        ),
        width: '22%',
      },
      {
        label: 'Role / Opportunity',
        render: (row) => (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
            }}
          >
            {row.role || 'General Applicant'}
          </span>
        ),
        width: '16%',
      },
      {
        label: 'Contact Info',
        render: (row) => (
          <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
            <div style={{ color: '#0f172a' }}>{row.email}</div>
            {row.phone && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>📞 {row.phone}</div>}
          </div>
        ),
        width: '22%',
      },
      {
        label: 'College / Location',
        render: (row) => (
          <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
            {row.college && <div style={{ fontWeight: 600, color: '#334155' }}>🎓 {row.college}</div>}
            {(row.district || row.state) && (
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                📍 {[row.district, row.state].filter(Boolean).join(', ')}
              </div>
            )}
            {!row.college && !row.district && !row.state && <span style={{ color: '#94a3b8' }}>—</span>}
          </div>
        ),
        width: '18%',
      },
      {
        label: 'Status',
        render: (row) => (
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: `${statusColors[row.status || 'Received'] || '#6b7280'}15`,
              color: statusColors[row.status || 'Received'] || '#6b7280',
              border: `1px solid ${statusColors[row.status || 'Received'] || '#6b7280'}30`,
            }}
          >
            {row.status || 'Received'}
          </span>
        ),
        width: '12%',
      },
      {
        label: 'Applied',
        render: (row) => (
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            {row.applied_date?.split('T')[0] || row.created_at?.split('T')[0] || '—'}
          </span>
        ),
        width: '10%',
      },
    ];
  };

  const uniqueRoles = [
    'All',
    'Campus Ambassador',
    'Volunteer',
    'District Representative',
    'State Representative',
    'Community Member',
    ...new Set(items.map((i) => i.role).filter(Boolean)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const uniqueStatuses = ['All', 'Received', 'Under Review', 'Selected', 'Waitlisted', 'Rejected', 'Withdrawn'];

  const filteredItems = items.filter((i) => {
    const roleMatch = filterRole === 'All' || (i.role || '').toLowerCase() === filterRole.toLowerCase();
    const statusMatch = filterStatus === 'All' || (i.status || 'Received') === filterStatus;
    return roleMatch && statusMatch;
  });

  const connectedSources = sources.filter((s) => s.hasSheet);

  return (
    <>
      <div className="admin-title" style={{ paddingBottom: '10px', borderBottom: 'none' }}>
        <div>
          <span>Administration</span>
          <h1>Application Records</h1>
          <p>Track, filter, and manage applicant submissions. Sync directly from linked Google Sheets.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setFilterStatus('All');
            }}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
          >
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Roles' : r}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
          >
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
          <button className="button button-secondary" onClick={handleOpenSync}>
            Sync from Sheet 🔄
          </button>
          <button className="button button-primary" onClick={handleCreate}>
            Add record <span>+</span>
          </button>
        </div>
      </div>

      {error && <div className="admin-notice">{error}</div>}

      <DataTable
        columns={getColumns()}
        data={filteredItems}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Sync from Google Sheet Modal */}
      <Modal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} title="Sync Applications from Google Sheets" maxWidth={620}>
        <div>
          {/* Quick Sync Connected Sheets Section */}
          {connectedSources.length > 0 && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                  Connected Sheets ({connectedSources.length})
                </strong>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ minHeight: '30px', padding: '4px 12px', fontSize: '0.75rem' }}
                  onClick={handleSyncAll}
                  disabled={syncing || syncingAll}
                >
                  {syncingAll ? 'Syncing all…' : 'Sync All Connected Sheets ⚡'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {connectedSources.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleRoleSelectChange(s.key)}
                    style={{
                      background: selectedRoleKey === s.key ? '#0284c7' : '#ffffff',
                      color: selectedRoleKey === s.key ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {s.roleName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Sync Form */}
          <form className="admin-form" onSubmit={handleSync}>
            <label>
              Select Opportunity / Role to Sync
              <select
                value={selectedRoleKey}
                onChange={(e) => handleRoleSelectChange(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccd9cc' }}
                disabled={syncing || syncingAll}
              >
                {sources.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.roleName} {s.hasSheet ? '✓ (Sheet linked)' : ''}
                  </option>
                ))}
                <option value="custom">Other / Custom Role…</option>
              </select>
            </label>

            {selectedRoleKey === 'custom' && (
              <label>
                Role Name
                <input
                  type="text"
                  value={customRoleName}
                  onChange={(e) => setCustomRoleName(e.target.value)}
                  placeholder="e.g. Media Volunteer, Lead Coordinator"
                  required
                />
              </label>
            )}

            <label>
              Google Sheet URL
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1.../edit#gid=0"
                required
                disabled={syncing || syncingAll}
              />
              <small style={{ color: '#64748b', marginTop: '2px', display: 'block' }}>
                Paste the full browser URL of the Google Sheet containing responses.
              </small>
            </label>

            {selectedRoleKey !== 'custom' && (
              <label className="remember" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={saveSheetUrl}
                  onChange={(e) => setSaveSheetUrl(e.target.checked)}
                />
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Save this Sheet URL for future 1-click syncs
                </span>
              </label>
            )}

            {syncMessage && (
              <div
                className="admin-notice"
                style={{
                  marginTop: '15px',
                  background: syncMessage.includes('Successfully') || syncMessage.includes('complete') ? '#e0f0e6' : '#fef2f2',
                  color: syncMessage.includes('Successfully') || syncMessage.includes('complete') ? '#2d6b45' : '#b91c1c',
                  borderColor: syncMessage.includes('Successfully') || syncMessage.includes('complete') ? '#2d6b45' : '#f87171',
                  lineHeight: 1.5,
                }}
              >
                {syncMessage}
              </div>
            )}

            {/* Expandable Sharing Instructions Guide */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {showGuide ? '▼ Hide Google Sheet setup checklist' : '► How to get the Google Sheet URL & ensure access'}
              </button>

              {showGuide && (
                <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#475569', background: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', lineHeight: 1.6 }}>
                  <strong>Prerequisites for Google Sheets Sync:</strong>
                  <ol style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    <li>
                      <strong>Link Google Form to Sheet:</strong> In your Google Form, click the <strong>Responses</strong> tab → click the green <strong>Link to Sheets</strong> icon.
                    </li>
                    <li>
                      <strong>Make the Sheet readable:</strong> In the opened Google Sheet, click <strong>Share</strong> (top right) → under <em>General access</em>, change from Restricted to <strong>Anyone with the link</strong> → ensure the role is set to <strong>Viewer</strong>.
                    </li>
                    <li>
                      <strong>Copy the link:</strong> Copy the URL from your browser address bar (it looks like <code>https://docs.google.com/spreadsheets/d/.../edit#gid=...</code>).
                    </li>
                    <li>
                      <strong>Sync:</strong> Paste that link here and click <strong>Import & Sync Records</strong>.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="button button-secondary" onClick={() => setIsSyncOpen(false)}>
                Close
              </button>
              <button type="submit" className="button button-primary" disabled={syncing || syncingAll}>
                {syncing ? 'Syncing Sheet…' : 'Import & Sync Records'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Add/Edit Application Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'Edit Application' : 'New Application'} maxWidth={600}>
        <form className="admin-form" onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              Applicant Name
              <input type="text" name="applicant_name" defaultValue={editingItem?.applicant_name || ''} required />
            </label>
            <label>
              Email
              <input type="email" name="email" defaultValue={editingItem?.email || ''} required />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              Phone
              <input type="text" name="phone" defaultValue={editingItem?.phone || ''} />
            </label>
            <label>
              Role
              <input type="text" name="role" defaultValue={editingItem?.role || ''} required />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <label>
              District
              <input type="text" name="district" defaultValue={editingItem?.district || ''} />
            </label>
            <label>
              State
              <input type="text" name="state" defaultValue={editingItem?.state || ''} />
            </label>
            <label>
              College
              <input type="text" name="college" defaultValue={editingItem?.college || ''} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>
              Status
              <select name="status" defaultValue={editingItem?.status || 'Received'}>
                {uniqueStatuses.filter((s) => s !== 'All').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <input type="text" name="notes" defaultValue={editingItem?.notes || ''} placeholder="Internal reviewer notes" />
            </label>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Application'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Application Record"
        message={`Are you sure you want to delete the application record for ${deleteItem?.applicant_name || 'this applicant'}? This cannot be undone.`}
        confirmText="Delete Record"
        danger
        loading={isSubmitting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteItem(null)}
      />
    </>
  );
}
