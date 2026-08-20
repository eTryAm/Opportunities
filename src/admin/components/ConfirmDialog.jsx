import { Modal } from './Modal';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmDanger = true, isSubmitting = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={400}>
      <div className="admin-confirm-dialog">
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button 
            type="button" 
            className="button button-secondary" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={`button ${confirmDanger ? 'button-danger' : 'button-primary'}`} 
            onClick={onConfirm} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
