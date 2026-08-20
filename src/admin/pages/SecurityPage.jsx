import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { authApi } from '../services/adminApi';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';

export function SecurityPage() {
  const { logout } = useAuth();
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSubmittingSessions, setIsSubmittingSessions] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    const formData = new FormData(e.target);
    const current = formData.get('currentPassword');
    const newPass = formData.get('newPassword');
    const confirm = formData.get('confirmPassword');

    if (newPass !== confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await authApi.changePassword(current, newPass);
      setPasswordSuccess('Password successfully updated.');
      e.target.reset();
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleRevokeSessions = async () => {
    try {
      setIsSubmittingSessions(true);
      setSessionError('');
      await authApi.revokeSessions();
      setIsSessionModalOpen(false);
      // Optional: Force a logout or just show success toast
      alert('All other active sessions have been revoked.');
    } catch (err) {
      setSessionError(err.message || 'Failed to revoke sessions.');
    } finally {
      setIsSubmittingSessions(false);
    }
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Security centre</span>
          <h1>Review the essentials that keep administrative access protected.</h1>
        </div>
      </div>

      <div className="security-grid">
        <article className="admin-panel">
          <span className="admin-panel-icon"><Icon name="shield" /></span>
          <h2>Account security</h2>
          <p>Use a unique, strong password and update it immediately after first setup.</p>
          <button className="button button-secondary" onClick={() => setIsPasswordModalOpen(true)}>Change password</button>
        </article>
        
        <article className="admin-panel">
          <span className="admin-panel-icon"><Icon name="people" /></span>
          <h2>Active sessions</h2>
          <p>If you left your account logged in on another device, you can revoke access to all other sessions.</p>
          <button className="button button-secondary" onClick={() => setIsSessionModalOpen(true)}>Revoke other sessions</button>
        </article>
        
        <article className="admin-panel">
          <span className="admin-panel-icon"><Icon name="megaphone" /></span>
          <h2>Activity review</h2>
          <p>Audit logs track important administrative actions and security events.</p>
          <Link className="button button-secondary" to="/admin/audit-logs">View audit logs</Link>
        </article>
      </div>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password" maxWidth={450}>
        <form className="admin-form" onSubmit={handlePasswordSubmit}>
          {passwordError && <div className="admin-notice" style={{ marginBottom: '16px' }}>{passwordError}</div>}
          {passwordSuccess && <div className="admin-notice" style={{ marginBottom: '16px', background: '#e0f0e6', color: '#2d6b45', borderColor: '#2d6b45' }}>{passwordSuccess}</div>}
          
          <label>Current Password
            <input type="password" name="currentPassword" required autoComplete="current-password" />
          </label>
          <label>New Password
            <input type="password" name="newPassword" required autoComplete="new-password" />
            <small style={{ fontWeight: 'normal', color: '#5a6d61' }}>Must be at least 12 characters</small>
          </label>
          <label>Confirm New Password
            <input type="password" name="confirmPassword" required autoComplete="new-password" />
          </label>
          
          <div className="admin-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onConfirm={handleRevokeSessions}
        title="Revoke active sessions?"
        message="This will immediately sign out all other devices logged into your administrator account. Your current session will remain active."
        confirmText="Revoke Sessions"
        confirmDanger={true}
        isSubmitting={isSubmittingSessions}
      />
    </>
  );
}
