import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useAuth } from './hooks/useAuth';
import { formLinksApi, dashboardApi } from './services/adminApi';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { EventsPage } from './pages/EventsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { FaqsPage } from './pages/FaqsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SecurityPage } from './pages/SecurityPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CommunityMembersPage } from './pages/CommunityMembersPage';
const adminLinks = [
  ['Dashboard', '/admin/dashboard', 'spark'], ['Community Members', '/admin/community', 'people'], ['Applications', '/admin/applications', 'briefcase'], ['Opportunities', '/admin/opportunities', 'compass'], ['Events', '/admin/events', 'calendar'], ['Announcements', '/admin/announcements', 'megaphone'], ['Testimonials', '/admin/testimonials', 'people'], ['FAQs', '/admin/faqs', 'graduation'], ['Application links', '/admin/forms', 'arrow'], ['Website settings', '/admin/settings', 'menu'], ['Security centre', '/admin/security', 'shield'], ['Audit logs', '/admin/audit-logs', 'shield'],
];

function AdminLogin() {
  const { login, isAuthenticated, sessionMessage } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [remember, setRemember] = useState(false); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  const submit = async (event) => { event.preventDefault(); setSubmitting(true); setError(''); try { await login(email, password, remember); navigate('/admin/dashboard'); } catch (err) { setError(err.message || 'Unable to sign in. Please check your details.'); } finally { setSubmitting(false); } };
  return <main className="admin-login"><Link to="/" className="admin-wordmark"><span className="wordmark-mark"><span /></span>Youth Empowerment Hub</Link><section className="login-card"><span className="eyebrow">Admin portal</span><h1>Sign in to manage the hub.</h1><p>Use your authorized administrator account to continue.</p>{(error || sessionMessage) && <div className="login-error" role="alert">{error || sessionMessage}</div>}<form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember this device</label><button className="button button-primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Secure sign in'} <span>→</span></button></form><small><Icon name="shield" size={14} /> Access is protected and monitored.</small></section></main>;
}

function RequireAuth({ children }) { const { loading, isAuthenticated } = useAuth(); if (loading) return <div className="admin-loading">Loading secure session…</div>; return isAuthenticated ? children : <Navigate to="/admin/login" replace />; }

function AdminShell({ children }) {
  const { user, logout } = useAuth(); const [menu, setMenu] = useState(false); const location = useLocation(); const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate('/admin/login'); };
  useEffect(() => { setMenu(false); }, [location.pathname]);
  return <div className="admin-app"><aside className={menu ? 'admin-sidebar is-open' : 'admin-sidebar'}><Link className="admin-brand" to="/admin/dashboard"><span className="wordmark-mark"><span /></span><span>Youth Empowerment<br />Hub <b>Admin</b></span></Link><nav>{adminLinks.map(([label, to, icon]) => <NavLink key={to} to={to}><Icon name={icon} size={17} />{label}</NavLink>)}</nav><div className="admin-sidebar-bottom"><Link to="/" target="_blank"><Icon name="arrow" size={16} />View public site</Link><button onClick={doLogout}><Icon name="close" size={16} />Sign out</button></div></aside><div className="admin-main"><header className="admin-header"><button className="admin-menu-toggle" onClick={() => setMenu(!menu)} aria-label="Toggle admin navigation"><Icon name="menu" /></button><div><span>Administration</span><strong>{user?.name || 'Administrator'}</strong></div><div className="admin-avatar">{(user?.name || 'A').charAt(0)}</div></header><main className="admin-content">{children}</main></div></div>;
}

function AdminTitle({ eyebrow = 'Administration', title, copy, action }) { return <div className="admin-title"><div><span>{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>; }

function Dashboard() { 
  const { user } = useAuth(); 
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    let active = true;
    dashboardApi.getStats().then((data) => {
      if (active) setStats(data.stats);
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  const cards = [
    ['Published opportunities', stats?.publishedOpportunities ?? '—', 'compass'], 
    ['Published events', stats?.publishedEvents ?? '—', 'calendar'], 
    ['Live announcements', stats?.publishedAnnouncements ?? '—', 'megaphone'], 
    ['Community members', stats?.communityMembers ?? '—', 'people'],
    ['Application records', stats?.applications ?? '—', 'briefcase']
  ]; 
  return <><AdminTitle title={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}.`} copy="Here is a clear view of your Youth Empowerment Hub workspace." action={<Link className="button button-primary" to="/admin/forms">Update application links <span>→</span></Link>} /><div className="admin-metrics">{cards.map(([label, number, icon]) => <article key={label}><span><Icon name={icon} /></span><strong>{number}</strong><p>{label}</p></article>)}</div><section className="admin-two-column"><article className="admin-panel"><div className="panel-heading"><div><span>Platform status</span><h2>Set up the essentials</h2></div></div><div className="setup-list"><Link to="/admin/forms"><b>01</b><div><strong>Add application destinations</strong><p>Connect the official Google Forms before publishing calls to apply.</p></div><span>→</span></Link><Link to="/admin/opportunities"><b>02</b><div><strong>Review opportunities</strong><p>Publish only accurate role descriptions, dates and eligibility.</p></div><span>→</span></Link><Link to="/admin/settings"><b>03</b><div><strong>Set official contact details</strong><p>Make sure public contact and legal content is approved.</p></div><span>→</span></Link></div></article><article className="admin-panel security-summary"><span className="admin-panel-icon"><Icon name="shield" /></span><span>Security centre</span><h2>Your workspace is protected.</h2><p>Manage your password, review recent activity and remove sessions from the security centre.</p><Link to="/admin/security" className="text-link">Open security centre →</Link></article></section></>; 
}

function ResourcePage({ title, copy, action = 'Add item' }) { return <><AdminTitle title={title} copy={copy} action={<button className="button button-primary" disabled title="Connect the API and database to enable record creation">{action} <span>+</span></button>} /><section className="admin-panel resource-empty"><span className="admin-panel-icon"><Icon name="spark" /></span><h2>Your {title.toLowerCase()} will appear here.</h2><p>Connect and run the admin API to create, publish and manage this content. Public visitors only see records you explicitly publish.</p><small>Nothing is being invented or published automatically.</small></section></>; }

function FormsPage() {
  const [links, setLinks] = useState([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');
  useEffect(() => { let active = true; formLinksApi.getAll().then((items) => active && setLinks(items)).catch(() => active && setMessage('The API is not connected yet. Start the server to manage live application links.')).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  const updateLink = (id, field, value) => setLinks((current) => current.map((link) => link.id === id ? { ...link, [field]: value } : link));
  const save = async (link) => { try { await formLinksApi.update(link.id, { label: link.label, url: link.url, enabled: link.enabled }); setMessage(`${link.label} saved.`); } catch (err) { setMessage(err.message || 'Unable to save this application link.'); } };
  return <><AdminTitle title="Application links" copy="Control each public application destination from one safe place." />{message && <div className="admin-notice">{message}</div>}<section className="admin-panel form-links-panel"><div className="form-links-head"><span>Application</span><span>HTTPS destination</span><span>Public status</span><span></span></div>{loading ? <div className="admin-table-empty">Loading application links…</div> : links.length ? links.map((link) => <div className="form-link-row" key={link.id}><input aria-label="Application label" value={link.label} onChange={(event) => updateLink(link.id, 'label', event.target.value)} /><input aria-label="Application URL" type="url" value={link.url} onChange={(event) => updateLink(link.id, 'url', event.target.value)} placeholder="https://forms.google.com/..." /><label className="toggle"><input type="checkbox" checked={Boolean(link.enabled)} onChange={(event) => updateLink(link.id, 'enabled', event.target.checked)} /><span></span><em>{link.enabled ? 'Enabled' : 'Disabled'}</em></label><button className="button button-secondary" onClick={() => save(link)}>Save</button></div>) : <div className="admin-table-empty">No application links found.</div>}</section><p className="admin-help">Only HTTPS URLs are accepted. Visitors will see a short application handoff screen before leaving for the form.</p></>;
}

export function AdminRoutes() { return <Routes><Route path="login" element={<AdminLogin />} /><Route path="*" element={<RequireAuth><AdminShell><Routes><Route path="dashboard" element={<Dashboard />} /><Route path="forms" element={<FormsPage />} /><Route path="security" element={<SecurityPage />} /><Route path="community" element={<CommunityMembersPage />} /><Route path="applications" element={<ApplicationsPage />} /><Route path="opportunities" element={<OpportunitiesPage />} /><Route path="events" element={<EventsPage />} /><Route path="announcements" element={<AnnouncementsPage />} /><Route path="testimonials" element={<TestimonialsPage />} /><Route path="faqs" element={<FaqsPage />} /><Route path="settings" element={<SettingsPage />} /><Route path="audit-logs" element={<AuditLogsPage />} /><Route path="*" element={<Navigate to="dashboard" replace />} /></Routes></AdminShell></RequireAuth>} /></Routes>; }
