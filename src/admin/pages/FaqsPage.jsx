import { useState, useEffect } from 'react';
import { faqsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function FaqsPage() {
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
      const data = await faqsApi.getAll();
      setItems(data.faqs || data);
    } catch (err) {
      setError(err.message || 'Failed to load FAQs');
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
      await faqsApi.delete(deleteItem.id);
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
      await faqsApi.togglePublish(item.id);
      setItems(items.map(i => i.id === item.id ? { ...i, is_published: !i.is_published } : i));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      question: formData.get('question'),
      answer: formData.get('answer'),
      category: formData.get('category'),
    };

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await faqsApi.update(editingItem.id, data);
        setItems(items.map(i => i.id === editingItem.id ? (updated.faq || updated) : i));
      } else {
        const created = await faqsApi.create(data);
        setItems([...items, (created.faq || created)]);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { label: 'Question', field: 'question', width: '35%' },
    { label: 'Status', render: (row) => (
      <span className={`badge-status ${row.is_published ? 'published' : 'draft'}`}>
        {row.is_published ? 'Published' : 'Draft'}
      </span>
    ), width: '15%' },
    { label: 'Category', field: 'category', width: '20%' },
    { label: 'Answer Preview', render: (row) => (
      <span style={{ display: 'inline-block', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {row.answer}
      </span>
    ), width: '20%' }
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <span>FAQs</span>
          <h1>Manage Frequently Asked Questions</h1>
          <p>Keep frequently asked questions accurate and accessible.</p>
        </div>
        <button className="button button-primary" onClick={handleCreate}>Add FAQ <span>+</span></button>
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

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? 'Edit FAQ' : 'New FAQ'} maxWidth={550}>
        <form className="admin-form" onSubmit={handleSave}>
          <label>Question
            <input type="text" name="question" defaultValue={editingItem?.question || ''} required />
          </label>
          <label>Category (e.g. General, Opportunities, Applications)
            <input type="text" name="category" defaultValue={editingItem?.category || 'General'} required />
          </label>
          <label>Answer
            <textarea name="answer" defaultValue={editingItem?.answer || ''} required style={{ minHeight: '120px' }} />
          </label>
          
          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete FAQ"
        message={`Are you sure you want to delete the question "${deleteItem?.question}"?`}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
