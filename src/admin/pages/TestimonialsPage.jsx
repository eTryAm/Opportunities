import { useState, useEffect } from 'react';
import { testimonialsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await testimonialsApi.getAll();
      setItems(data.testimonials || data);
    } catch (err) {
      setError(err.message || 'Failed to load testimonials');
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
      await testimonialsApi.delete(deleteItem.id);
      setItems(items.filter(i => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePublish = async (item) => {
    try {
      await testimonialsApi.togglePublish(item.id);
      setItems(items.map(i => i.id === item.id ? { ...i, is_published: !i.is_published } : i));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      role: formData.get('role'),
      organization: formData.get('organization'),
      photo_url: formData.get('photo_url'),
      content: formData.get('content')
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await testimonialsApi.update(editingItem.id, data);
        setItems(items.map(i => i.id === editingItem.id ? (updated.testimonial || updated) : i));
      } else {
        const created = await testimonialsApi.create(data);
        setItems([...items, (created.testimonial || created)]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { label: 'Name', field: 'name', width: '25%' },
    { label: 'Status', render: (row) => (
      <span className={`badge-status ${row.is_published ? 'published' : 'draft'}`}>
        {row.is_published ? 'Published' : 'Draft'}
      </span>
    ), width: '15%' },
    { label: 'Role', field: 'role', width: '25%' },
    { label: 'Quote', render: (row) => (
      <span style={{ display: 'inline-block', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        "{row.content}"
      </span>
    ), width: '25%' }
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Testimonials</span>
          <h1>Manage Community Voices</h1>
          <p>Only approved, real testimonials should be published.</p>
        </div>
        <button className="button button-primary" onClick={handleCreate}>Add testimonial <span>+</span></button>
      </div>

      {error && <div className="admin-notice">{error}</div>}

      <DataTable 
        columns={columns}
        data={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onTogglePublish={togglePublish}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'Edit Testimonial' : 'New Testimonial'} maxWidth={550}>
        <form className="admin-form" onSubmit={handleSave}>
          <label>Name
            <input type="text" name="name" defaultValue={editingItem?.name || ''} required />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>Role (e.g. Volunteer)
              <input type="text" name="role" defaultValue={editingItem?.role || ''} required />
            </label>
            <label>Organization (Optional)
              <input type="text" name="organization" defaultValue={editingItem?.organization || ''} />
            </label>
          </div>
          <label>Photo URL (Optional)
            <input type="url" name="photo_url" defaultValue={editingItem?.photo_url || ''} />
          </label>
          <label>Quote Content
            <textarea name="content" defaultValue={editingItem?.content || ''} required />
          </label>
          
          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Testimonial'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial by "${deleteItem?.name}"?`}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
