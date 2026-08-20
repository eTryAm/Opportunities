import { useEffect, useMemo, useState } from 'react';
import { safeApplicationUrl } from '../config/applicationLinks';
import { ApplicationContext } from '../context/applicationContext';

const roleLabels = {
  community_member: 'Community Membership', volunteer: 'Volunteer',
  district_representative: 'District Representative', state_representative: 'State Representative',
  campus_ambassador: 'Campus Ambassador',
};

export function ApplicationProvider({ children, formLinks }) {
  const [application, setApplication] = useState(null);
  const links = useMemo(() => Object.fromEntries((formLinks || []).map((link) => [link.key, link])), [formLinks]);

  useEffect(() => {
    const close = (event) => event.key === 'Escape' && closeModal();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const closeModal = () => {
    setApplication(null);
  };

  const handleContinue = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    closeModal();
  };

  const value = { openApplication: (key, options = {}) => { setApplication({ key, ...options }); } };
  const link = application ? links[application.key] : null;
  const url = safeApplicationUrl(application?.url || link?.url);
  const unavailable = !url || link?.enabled === false || application?.status === 'Coming Soon' || application?.status === 'Closed';
  const title = application?.title || roleLabels[application?.key] || 'Application';

  return <ApplicationContext.Provider value={value}>
    {children}
    {application && (
      <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
        <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="application-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className="icon-button modal-close" onClick={closeModal} aria-label="Close application dialog">×</button>
          
          <span className="eyebrow">Youth Empowerment Hub</span>
          <h2 id="application-title">{unavailable ? `${title} applications` : `Begin your ${title} application`}</h2>
          
          {unavailable ? (
            <p>{application?.status === 'Closed' ? 'Applications for this opportunity are currently closed.' : 'Applications are opening soon. Please check back for an official update.'}</p>
          ) : (
            <>
              <p>You are about to continue to our secure application form. Before you begin:</p>
              <ul className="check-list">
                <li>Use an active email address.</li>
                <li>Make sure your information is accurate.</li>
                <li>Complete all required questions before submitting.</li>
              </ul>
            </>
          )}

          <div className="modal-actions">
            {unavailable ? (
              <button className="button button-primary" onClick={closeModal}>Got it</button>
            ) : (
              <button className="button button-primary" onClick={() => handleContinue(url)}>
                Continue to application <span>↗</span>
              </button>
            )}
            {!unavailable && <button className="button button-secondary" onClick={closeModal}>Cancel</button>}
          </div>

          {!unavailable && <small>Your application is reviewed according to the requirements and availability of this opportunity. Submission does not guarantee selection.</small>}
        </section>
      </div>
    )}
  </ApplicationContext.Provider>;
}
