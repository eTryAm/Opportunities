import { useState, useEffect } from 'react';
import { announcementsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function AnnouncementsPage() {
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
      const data = await announcementsApi.getAll();
      setItems(data.announcements || data);
    } catch (err) {
      setError(err.message || 'Failed to load announcements');
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
      await announcementsApi.delete(deleteItem.id);
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
      await announcementsApi.togglePublish(item.id);
      setItems(items.map(i => i.id === item.id ? { ...i, is_published: !i.is_published } : i));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      category: formData.get('category'),
      content: formData.get('content')
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await announcementsApi.update(editingItem.id, data);
        setItems(items.map(i => i.id === editingItem.id ? (updated.announcement || updated) : i));
      } else {
        const created = await announcementsApi.create(data);
        setItems([...items, (created.announcement || created)]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { label: 'Title', field: 'title', width: '40%' },
    { label: 'Status', render: (row) => (
      <span className={`badge-status ${row.is_published ? 'published' : 'draft'}`}>
        {row.is_published ? 'Published' : 'Draft'}
      </span>
    ), width: '20%' },
    { label: 'Category', field: 'category', width: '25%' }
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Announcements</span>
          <h1>Manage Official Notices</h1>
          <p>Publish clear, official community notices and updates.</p>
        </div>
        <button className="button button-primary" onClick={handleCreate}>New announcement <span>+</span></button>
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

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'Edit Announcement' : 'New Announcement'} maxWidth={550}>
        <form className="admin-form" onSubmit={handleSave}>
          <label>Title
            <input type="text" name="title" defaultValue={editingItem?.title || ''} required />
          </label>
          <label>Category (e.g., Update, Notice, Alert)
            <input type="text" name="category" defaultValue={editingItem?.category || 'Update'} required />
          </label>
          <label>Content
            <textarea name="content" defaultValue={editingItem?.content || ''} required />
          </label>
          
          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
