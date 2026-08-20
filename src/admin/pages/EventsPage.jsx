import { useState, useEffect } from 'react';
import { eventsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getAll();
      setEvents(data.events || data);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
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
      await eventsApi.delete(deleteItem.id);
      setEvents(events.filter(e => e.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePublish = async (item) => {
    try {
      await eventsApi.togglePublish(item.id);
      setEvents(events.map(e => e.id === item.id ? { ...e, is_published: !e.is_published } : e));
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
      description: formData.get('description'),
      location: formData.get('location'),
      event_date: formData.get('event_date'),
      application_url: formData.get('application_url'),
      is_online: formData.get('is_online') === 'on' ? 1 : 0
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await eventsApi.update(editingItem.id, data);
        setEvents(events.map(e => e.id === editingItem.id ? (updated.event || updated) : e));
      } else {
        const created = await eventsApi.create(data);
        setEvents([...events, (created.event || created)]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { label: 'Event Title', field: 'title', width: '30%' },
    { label: 'Status', render: (row) => (
      <span className={`badge-status ${row.is_published ? 'published' : 'draft'}`}>
        {row.is_published ? 'Published' : 'Draft'}
      </span>
    ), width: '15%' },
    { label: 'Category', field: 'category', width: '20%' },
    { label: 'Date', render: (row) => row.event_date ? new Date(row.event_date).toLocaleDateString() : 'TBA', width: '20%' }
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Events</span>
          <h1>Manage Workshops & Events</h1>
          <p>Organize initiatives and events shown on the public site.</p>
        </div>
        <button className="button button-primary" onClick={handleCreate}>Add event <span>+</span></button>
      </div>

      {error && <div className="admin-notice">{error}</div>}

      <DataTable 
        columns={columns}
        data={events}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onTogglePublish={togglePublish}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'Edit Event' : 'New Event'} maxWidth={550}>
        <form className="admin-form" onSubmit={handleSave}>
          <label>Event Title
            <input type="text" name="title" defaultValue={editingItem?.title || ''} required />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label>Category
              <input type="text" name="category" defaultValue={editingItem?.category || 'Workshop'} required />
            </label>
            <label>Date
              <input type="datetime-local" name="event_date" defaultValue={editingItem?.event_date ? new Date(editingItem.event_date).toISOString().slice(0,16) : ''} />
            </label>
          </div>
          <label>Description
            <textarea name="description" defaultValue={editingItem?.description || ''} required />
          </label>
          <label>Location
            <input type="text" name="location" defaultValue={editingItem?.location || ''} />
          </label>
          <label>Registration URL (Optional)
            <input type="url" name="application_url" defaultValue={editingItem?.application_url || ''} />
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center' }}>
            <input type="checkbox" name="is_online" defaultChecked={editingItem?.is_online} style={{ width: 'auto' }} />
            This is an online event
          </label>
          
          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
