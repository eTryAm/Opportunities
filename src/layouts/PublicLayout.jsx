import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useApplication } from '../hooks/useApplication';

const navItems = [['Home', '/'], ['About', '/about'], ['Opportunities', '/opportunities'], ['Events', '/events'], ['Announcements', '/announcements'], ['Contact', '/contact']];

function Wordmark({ name }) {
  const brandName = name || 'Youth Empowerment Hub';
  return (
    <Link to="/" className="wordmark" aria-label={`${brandName} home`}>
      <img src="/logo.jpg" alt={brandName} className="wordmark-logo" />
      <span className="wordmark-text">{brandName}</span>
    </Link>
  );
}

function Navbar({ data }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return <header className="site-header"><div className="nav-shell">
    <Wordmark name={data.settings.orgName} />
    <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><Icon name={open ? 'close' : 'menu'} /></button>
    <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
      {navItems.map(([label, to]) => <NavLink key={to} to={to} onClick={close} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
      <Link className="button button-primary nav-cta" to="/join-community" onClick={close}>Join the community <span>→</span></Link>
    </nav>
  </div></header>;
}

function Footer({ data }) {
  const { openApplication } = useApplication();
  const legal = [['Privacy Policy', '/privacy'], ['Terms & Conditions', '/terms'], ['Code of Conduct', '/code-of-conduct']];
  
  // Use dynamic opportunities from the database, fallback to empty array if not loaded
  const dynamicOpportunities = data?.opportunities || [];

  const roleKeyBySlug = { community: 'community_member', volunteer: 'volunteer', 'district-representative': 'district_representative', 'state-representative': 'state_representative', 'campus-ambassador': 'campus_ambassador' };

  return <footer className="site-footer"><div className="footer-inner">
    <div className="footer-brand"><Wordmark name={data.settings.orgName} /><p>{data.settings.footerDescription}</p><a className="footer-email" href={`mailto:${data.settings.contactEmail}`}><Icon name="mail" size={16} /> {data.settings.contactEmail}</a></div>
    <div><h3>Explore</h3><Link to="/">Home</Link><Link to="/about">About</Link><Link to="/opportunities">Opportunities</Link><Link to="/events">Events</Link><Link to="/announcements">Announcements</Link><Link to="/faq">FAQs</Link></div>
    <div><h3>Opportunities</h3>{dynamicOpportunities.map((opp) => (opp.slug === 'community' || opp.slug === 'community-member') ? <Link key={opp.id || opp.slug} className="footer-link" to="/join-community">{opp.title}</Link> : <button key={opp.id || opp.slug} className="footer-link" onClick={() => openApplication(roleKeyBySlug[opp.slug] || opp.slug, { title: opp.title, url: opp.application_url, status: opp.application_status })}>{opp.title}</button>)}</div>
    <div><h3>Legal</h3>{legal.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}<a href="/admin/login">Admin portal</a></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} {data.settings.orgName}. All rights reserved.</span><span>Built for purposeful participation.</span></div></footer>;
}

export function PublicLayout({ data, children }) {
  return <div className="public-app"><Navbar data={data} /><main>{children}</main><Footer data={data} /></div>;
}
