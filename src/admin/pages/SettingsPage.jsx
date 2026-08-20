import { useState, useEffect } from 'react';
import { settingsApi } from '../services/adminApi';

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let active = true;
    settingsApi.getAll()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load settings');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const camelToSnake = (str) => str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    setError('');

    try {
      const promises = Object.entries(settings).map(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          const dbKey = camelToSnake(key);
          return settingsApi.update(dbKey, value);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setSaveMessage('Settings saved successfully.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading settings…</div>;
  }

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Website Settings</span>
          <h1>Manage Platform Content</h1>
          <p>Update approved copy, social links and legal contact details.</p>
        </div>
        <button 
          className="button button-primary" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {error && <div className="admin-notice">{error}</div>}
      {saveMessage && <div className="admin-notice" style={{ background: '#e0f0e6', color: '#2d6b45', borderColor: '#2d6b45' }}>{saveMessage}</div>}

      <div className="security-grid">
        <article className="admin-panel">
          <h2>Hero Section</h2>
          <p>The main text displayed on the homepage.</p>
          <div className="admin-form" style={{ marginTop: '20px' }}>
            <label>Headline
              <input 
                type="text" 
                value={settings?.heroHeadline || ''} 
                onChange={(e) => handleChange('heroHeadline', e.target.value)} 
              />
            </label>
            <label>Subheadline
              <input 
                type="text" 
                value={settings?.heroSubheadline || ''} 
                onChange={(e) => handleChange('heroSubheadline', e.target.value)} 
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label>Primary CTA Text
                <input 
                  type="text" 
                  value={settings?.heroPrimaryCta || ''} 
                  onChange={(e) => handleChange('heroPrimaryCta', e.target.value)} 
                />
              </label>
              <label>Secondary CTA Text
                <input 
                  type="text" 
                  value={settings?.heroSecondaryCta || ''} 
                  onChange={(e) => handleChange('heroSecondaryCta', e.target.value)} 
                />
              </label>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <h2>About Section</h2>
          <p>Content for the About the Hub page.</p>
          <div className="admin-form" style={{ marginTop: '20px' }}>
            <label>About Title
              <input 
                type="text" 
                value={settings?.aboutTitle || ''} 
                onChange={(e) => handleChange('aboutTitle', e.target.value)} 
              />
            </label>
            <label>About Content
              <textarea 
                value={settings?.aboutContent || ''} 
                onChange={(e) => handleChange('aboutContent', e.target.value)} 
                style={{ minHeight: '80px' }}
              />
            </label>
            <label>Mission
              <textarea 
                value={settings?.mission || ''} 
                onChange={(e) => handleChange('mission', e.target.value)} 
                style={{ minHeight: '80px' }}
              />
            </label>
            <label>Vision
              <textarea 
                value={settings?.vision || ''} 
                onChange={(e) => handleChange('vision', e.target.value)} 
                style={{ minHeight: '80px' }}
              />
            </label>
          </div>
        </article>

        <article className="admin-panel">
          <h2>Contact Details & Footer</h2>
          <p>Official communication channels displayed on the Contact page and footer.</p>
          <div className="admin-form" style={{ marginTop: '20px' }}>
            <label>Contact Email
              <input 
                type="email" 
                value={settings?.contactEmail || ''} 
                onChange={(e) => handleChange('contactEmail', e.target.value)} 
              />
            </label>
            <label>Contact Phone (Optional)
              <input 
                type="text" 
                value={settings?.contactPhone || ''} 
                onChange={(e) => handleChange('contactPhone', e.target.value)} 
                placeholder="+1 (555) 000-0000"
              />
            </label>
            <label>Contact Location / Address
              <input 
                type="text" 
                value={settings?.contactLocation || ''} 
                onChange={(e) => handleChange('contactLocation', e.target.value)} 
                placeholder="City, Country"
              />
            </label>
            <label>Support Hours (Optional)
              <input 
                type="text" 
                value={settings?.contactHours || ''} 
                onChange={(e) => handleChange('contactHours', e.target.value)} 
                placeholder="Mon-Fri, 9AM-5PM"
              />
            </label>
          </div>
        </article>
      </div>
    </>
  );
}
