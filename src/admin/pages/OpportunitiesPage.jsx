import { useState, useEffect } from 'react';
import { opportunitiesApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const data = await opportunitiesApi.getAll();
      setOpportunities(data.opportunities || data);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
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
      await opportunitiesApi.delete(deleteItem.id);
      setOpportunities(opportunities.filter(o => o.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePublish = async (item) => {
    try {
      await opportunitiesApi.togglePublish(item.id);
      setOpportunities(opportunities.map(o => o.id === item.id ? { ...o, is_published: !o.is_published } : o));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      eligibility: formData.get('eligibility'),
      application_status: formData.get('application_status'),
      badge: formData.get('badge'),
      benefits: formData.get('benefits') ? formData.get('benefits').split('\n').filter(Boolean) : [],
      responsibilities: formData.get('responsibilities') ? formData.get('responsibilities').split('\n').filter(Boolean) : [],
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await opportunitiesApi.update(editingItem.id, data);
        setOpportunities(opportunities.map(o => o.id === editingItem.id ? (updated.opportunity || updated) : o));
      } else {
        const created = await opportunitiesApi.create(data);
        setOpportunities([...opportunities, (created.opportunity || created)]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { label: 'Role', field: 'title', width: '25%' },
    { label: 'Status', render: (row) => (
      <span className={`badge-status ${row.is_published ? 'published' : 'draft'}`}>
        {row.is_published ? 'Published' : 'Draft'}
      </span>
    ), width: '15%' },
    { label: 'App Status', field: 'application_status', width: '20%' },
    { label: 'Eligibility', field: 'eligibility', width: '25%' }
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Opportunities</span>
          <h1>Manage Roles & Opportunities</h1>
          <p>Create, review and publish the roles shown on the public site.</p>
        </div>
        <button className="button button-primary" onClick={handleCreate}>Add opportunity <span>+</span></button>
      </div>

      {error && <div className="admin-notice">{error}</div>}

      <DataTable 
        columns={columns}
        data={opportunities}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onTogglePublish={togglePublish}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'Edit Opportunity' : 'New Opportunity'} maxWidth={600}>
        <form className="admin-form" onSubmit={handleSave}>
          <label>Title
            <input type="text" name="title" defaultValue={editingItem?.title || ''} required />
          </label>
          <label>URL Slug (e.g. state-representative)
            <input type="text" name="slug" defaultValue={editingItem?.slug || ''} required />
          </label>
          <label>Short Description
            <textarea name="description" defaultValue={editingItem?.description || ''} required />
          </label>
          <label>Eligibility
            <input type="text" name="eligibility" defaultValue={editingItem?.eligibility || ''} required />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>Application Status
              <input type="text" name="application_status" defaultValue={editingItem?.application_status || 'Open'} />
            </label>
            <label>Badge Text (Optional)
              <input type="text" name="badge" defaultValue={editingItem?.badge || ''} />
            </label>
          </div>
          <label>Benefits (one per line)
            <textarea name="benefits" defaultValue={editingItem?.benefits ? JSON.parse(editingItem.benefits).join('\n') : ''} />
          </label>
          <label>Responsibilities (one per line)
            <textarea name="responsibilities" defaultValue={editingItem?.responsibilities ? JSON.parse(editingItem.responsibilities).join('\n') : ''} />
          </label>
          
          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Opportunity'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
