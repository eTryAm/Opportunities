import { useEffect } from 'react';
import { Icon } from '../../components/Icon';

export function Modal({ isOpen, onClose, title, children, maxWidth = 500 }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div 
        className="admin-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: `${maxWidth}px` }}
      >
        <header className="admin-modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close modal">
            <Icon name="close" />
          </button>
        </header>
        <div className="admin-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
