import { useState, useEffect } from 'react';
import { applicationsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

const API_BASE = '/api/admin';

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

  // Google Sheets sync
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [defaultRole, setDefaultRole] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

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

  useEffect(() => {
    fetchItems();
  }, []);

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
        const created = await applicationsApi.create(data);
        await fetchItems(); // refresh to get full record
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    setSyncing(true);
    setSyncMessage('');

    try {
      const response = await fetch(`${API_BASE}/applications/sync-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sheet_url: sheetUrl, default_role: defaultRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sync failed.');

      setSyncMessage(result.message);
      await fetchItems(); // Refresh data
      setTimeout(() => {
        setIsSyncOpen(false);
        setSyncMessage('');
        setSheetUrl('');
      }, 3000);
    } catch (err) {
      setSyncMessage(err.message);
    } finally {
      setSyncing(false);
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
    const isCampus = filterRole.toLowerCase().includes('campus') || filterRole.toLowerCase().includes('ambassador');
    const isDistrict = filterRole.toLowerCase().includes('district');

    const baseColumns = [
      { label: 'Name', field: 'applicant_name', width: '20%' },
      { label: 'Email', field: 'email', width: '25%' },
    ];

    if (filterRole === 'All') {
      baseColumns.push({ label: 'Role', field: 'role', width: '12%' });
      baseColumns.push({ label: 'Contact', field: 'phone', width: '12%' });
      baseColumns.push({ label: 'Location/College', render: (r) => r.college || r.district || r.state || '—', width: '15%' });
    } else if (isCampus) {
      baseColumns.push({ label: 'Contact', field: 'phone', width: '15%' });
      baseColumns.push({ label: 'College', field: 'college', width: '20%' });
    } else if (isDistrict) {
      baseColumns.push({ label: 'District', field: 'district', width: '15%' });
      baseColumns.push({ label: 'State', field: 'state', width: '15%' });
    } else {
      baseColumns.push({ label: 'State', field: 'state', width: '15%' });
    }

    baseColumns.push({
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
    });

    baseColumns.push({ label: 'Applied', render: (row) => row.applied_date?.split('T')[0] || row.created_at?.split('T')[0] || '—', width: '12%' });
    return baseColumns;
  };

  const uniqueRoles = ['All', ...new Set(items.map((i) => i.role).filter(Boolean))];
  const uniqueStatuses = ['All', 'Received', 'Under Review', 'Selected', 'Waitlisted', 'Rejected', 'Withdrawn'];

  const filteredItems = items.filter((i) => {
    const roleMatch = filterRole === 'All' || i.role === filterRole;
    const statusMatch = filterStatus === 'All' || (i.status || 'Received') === filterStatus;
    return roleMatch && statusMatch;
  });

  return (
    <>
      <div className="admin-title" style={{ paddingBottom: '10px', borderBottom: 'none' }}>
        <div>
          <span>Administration</span>
          <h1>Application Records</h1>
          <p>Track and manage all application submissions. Sync from Google Sheets or add records manually.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={filterRole} 
            onChange={(e) => { setFilterRole(e.target.value); setFilterStatus('All'); }}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
          >
            {uniqueRoles.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
          >
            {uniqueStatuses.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <button className="button button-secondary" onClick={() => setIsSyncOpen(true)}>
            Sync from Sheet
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
      <Modal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} title="Sync from Google Sheet" maxWidth={550}>
        <form className="admin-form" onSubmit={handleSync}>
          <p style={{ marginBottom: '15px', color: '#6b7c6e', fontSize: '0.85rem' }}>
            Paste the URL of a <strong>publicly shared</strong> Google Sheet. The sheet should have columns like:
            Name, Email, Phone, Role, District, State, College. Existing records (matched by email) will be skipped.
          </p>
          <label>
            Google Sheet URL
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              required
            />
          </label>
          <label>
            Default Role (Optional)
            <input
              type="text"
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              placeholder="e.g. Campus Ambassador"
            />
          </label>

          {syncMessage && (
            <div
              className="admin-notice"
              style={{
                marginTop: '12px',
                background: syncMessage.includes('Successfully') ? '#e0f0e6' : undefined,
                color: syncMessage.includes('Successfully') ? '#2d6b45' : undefined,
                borderColor: syncMessage.includes('Successfully') ? '#2d6b45' : undefined,
              }}
            >
              {syncMessage}
            </div>
          )}

          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsSyncOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={syncing}>
              {syncing ? 'Syncing…' : 'Import Records'}
            </button>
          </div>
        </form>
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
          <label>
            Status
            <select name="status" defaultValue={editingItem?.status || 'Received'}>
              <option value="Received">Received</option>
              <option value="Under Review">Under Review</option>
              <option value="Selected">Selected</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </label>
          <label>
            Notes
            <textarea name="notes" defaultValue={editingItem?.notes || ''} />
          </label>

          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete Application"
        message={`Are you sure you want to delete the application by "${deleteItem?.applicant_name}"?`}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
