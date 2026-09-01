import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useApplication } from '../hooks/useApplication';
import { API_BASE } from '../services/publicApi';

const roleKeyBySlug = { community: 'community_member', volunteer: 'volunteer', 'district-representative': 'district_representative', 'state-representative': 'state_representative', 'campus-ambassador': 'campus_ambassador' };
const iconByIndex = ['people', 'briefcase', 'compass', 'spark', 'graduation', 'shield'];

function useDocumentTitle(title) {
  const org = 'Youth Empowerment Hub';
  document.title = title ? `${title} | ${org}` : org;
}

export function SectionHeading({ eyebrow, title, copy, centered = false, action }) {
  return <div className={`section-heading ${centered ? 'centered' : ''}`}><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>{action}</div>;
}

function PageHero({ eyebrow, title, copy, children, theme = '' }) {
  return <section className={`page-hero ${theme}`}><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}{children}</div></section>;
}

function ArrowLink({ to, children }) { return <Link to={to} className="text-link">{children} <span>→</span></Link>; }

function ApplicationButton({ opportunity, className = 'button button-primary' }) {
  const { openApplication } = useApplication();
  const key = roleKeyBySlug[opportunity.slug] || opportunity.key;
  const closed = opportunity.application_status === 'Closed';
  const soon = opportunity.application_status === 'Coming Soon';
  const label = closed ? 'Applications closed' : soon ? 'Applications opening soon' : opportunity.cta_text || (opportunity.slug === 'community' || opportunity.slug === 'community-member' ? 'Join the community' : 'Start your application');
  
  if (opportunity.slug === 'community' || opportunity.slug === 'community-member') {
    if (closed || soon) {
      return <button className={className} disabled>{label}</button>;
    }
    return <Link to="/join-community" className={className}>{label} <span>→</span></Link>;
  }

  return <button className={className} onClick={() => openApplication(key, { title: opportunity.title, url: opportunity.application_url, status: opportunity.application_status })}>{label} {!closed && !soon && <span>→</span>}</button>;
}

function OpportunityCard({ opportunity, index = 0 }) {
  const legacySlugs = ['volunteer', 'district-representative', 'state-representative', 'campus-ambassador', 'community'];
  const detailPath = legacySlugs.includes(opportunity.slug) ? `/${opportunity.slug}` : `/opportunities/${opportunity.slug}`;
  return <article className="opportunity-card"><div className="card-top"><span className="card-number">0{index + 1}</span><span className={`status ${opportunity.application_status?.toLowerCase().replace(' ', '-') || 'open'}`}>{opportunity.application_status || 'Open'}</span></div><div className="opportunity-icon"><Icon name={iconByIndex[index % iconByIndex.length]} size={23} /></div><h3>{opportunity.title}</h3><p>{opportunity.description}</p><ul>{(opportunity.benefits || []).slice(0, 4).map((benefit) => <li key={benefit}><Icon name="check" size={15} />{benefit}</li>)}</ul><div className="card-actions"><ArrowLink to={detailPath}>Explore role</ArrowLink><ApplicationButton opportunity={opportunity} className="button button-quiet" /></div></article>;
}

function EmptyState({ icon = 'calendar', title, copy, link }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={25} /></span><h3>{title}</h3><p>{copy}</p>{link && <Link className="button button-secondary" to={link.to}>{link.label}</Link>}</div>;
}

function ListSection({ title, items }) {
  if (!items?.length) return null;
  return <section className="detail-list-section"><h2>{title}</h2><ul className="feature-list">{items.map((item) => <li key={item}><Icon name="check" size={18} />{item}</li>)}</ul></section>;
}

function TestimonialSubmissionModal({ isOpen, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      role: formData.get('role'),
      organization: formData.get('organization'),
      content: formData.get('content')
    };

    try {
      const response = await fetch(`${API_BASE}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit.');
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="application-modal testimonial-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✨</div>
            <h2>Thank you!</h2>
            <p>Your experience has been submitted and is pending review by our team.</p>
            <button className="button button-primary" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
          </div>
        ) : (
          <>
            <h2>Share your experience</h2>
            <p>We'd love to hear about your time with the Youth Empowerment Hub.</p>
            
            {error && <div className="content-notice">{error}</div>}
            
            <form onSubmit={handleSubmit} className="public-form" style={{ marginTop: '25px', display: 'grid', gap: '15px' }}>
              <label>Name
                <input type="text" name="name" required />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <label>Role / Position
                  <input type="text" name="role" placeholder="e.g. Volunteer" required />
                </label>
                <label>Organization (Optional)
                  <input type="text" name="organization" />
                </label>
              </div>
              <label>Your Testimonial
                <textarea name="content" required rows={4} placeholder="What was your experience like?"></textarea>
              </label>
              <div className="modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function TestimonialSection({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="section container testimonials-section">
      <SectionHeading eyebrow="Voices from the hub" title="Real experiences from our community." centered />
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
        <button className="button button-secondary" onClick={() => setIsModalOpen(true)}>
          <Icon name="spark" size={16} /> Share your experience
        </button>
      </div>

      <div className="testimonial-slider-container">
        <div className="testimonial-slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {testimonials.map((t) => (
            <div className="testimonial-slide" key={t.id}>
              <blockquote className="testimonial-quote">
                {t.content}
              </blockquote>
              <div className="testimonial-author">
                {t.photo_url ? <img src={t.photo_url} alt={t.name} className="author-image" /> : <div className="author-initial">{t.name.charAt(0)}</div>}
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {testimonials.length > 1 && (
          <div className="testimonial-controls">
            <button 
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="button button-secondary"
            >
              ←
            </button>
            <div className="testimonial-dots">
              {testimonials.map((_, i) => (
                <button 
                  key={i} 
                  className={`dot ${i === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button 
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, testimonials.length - 1))}
              disabled={currentIndex === testimonials.length - 1}
              className="button button-secondary"
            >
              →
            </button>
          </div>
        )}
      </div>
      
      <TestimonialSubmissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}

export function HomePage({ data, loading, error }) {
  useDocumentTitle('Leadership, opportunity & community');
  const { settings, opportunities, campusAmbassador, faqs } = data;
  return <>
    <section className="home-hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow">Youth leadership network</span><h1>{settings.heroHeadline}</h1><p>{settings.heroSubheadline}</p><div className="hero-actions"><ApplicationButton opportunity={{ slug: 'community', title: 'Community Membership', cta_text: settings.heroPrimaryCta }} /><Link className="button button-secondary" to="/opportunities">{settings.heroSecondaryCta} <span>↓</span></Link></div><p className="hero-note"><Icon name="shield" size={16} /> A purposeful space for people ready to contribute.</p></div><div className="hero-art" aria-hidden="true"><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="hero-grid-lines"></div><div className="portrait-card portrait-a"><span>Learn</span><b>01</b></div><div className="portrait-card portrait-b"><span>Lead</span><b>02</b></div><div className="portrait-card portrait-c"><span>Impact</span><b>03</b></div><div className="hero-badge"><Icon name="spark" size={18} /><span>Built for<br /><strong>new possibilities</strong></span></div></div></div></section>
    <section className="trust-strip"><div className="container">{settings.trustStrip.map(({ label }) => <div key={label}><span className="trust-dot"></span>{label}</div>)}</div></section>
    {error && <div className="container"><div className="content-notice">We’re showing the current platform overview while live content reconnects.</div></div>}
    <section className="section container intro-section"><div className="intro-quote"><span className="quote-mark">“</span><p>Growth becomes more powerful when it is shared with a community that believes in what comes next.</p></div><div><SectionHeading eyebrow="The hub" title={settings.aboutTitle} copy={settings.aboutContent} /><ArrowLink to="/about">Discover our purpose</ArrowLink></div></section>
    <section className="section soft-section"><div className="container"><SectionHeading eyebrow="Choose your path" title="Find the way you want to contribute." copy="Every path offers a different way to build experience, take ownership and connect with people who care." action={<Link className="text-link desktop-only" to="/opportunities">View all opportunities →</Link>} /><div className="opportunity-grid">{loading ? Array.from({ length: 4 }, (_, index) => <div className="skeleton-card" key={index}></div>) : opportunities.map((item, index) => <OpportunityCard key={item.slug} opportunity={item} index={index} />)}</div></div></section>
    {campusAmbassador?.is_visible !== false && <section className="section container"><div className="flagship-card"><div className="flagship-art"><div className="flagship-ring"></div><span className="flagship-symbol">✦</span><div className="flagship-label">Campus<br />Leadership</div></div><div className="flagship-content"><span className="premium-badge"><Icon name="spark" size={15} /> {campusAmbassador.badge || 'Premium / Flagship Opportunity'}</span><span className="eyebrow">{campusAmbassador.subtitle || 'Lead Where You Learn.'}</span><h2>{campusAmbassador.title}</h2><p>{campusAmbassador.description}</p><div className="chip-row">{(campusAmbassador.benefits || []).slice(0, 3).map((benefit) => <span key={benefit}>{benefit}</span>)}</div><div className="hero-actions"><Link to="/campus-ambassador" className="button button-secondary">Explore the program</Link><ApplicationButton opportunity={{ ...campusAmbassador, slug: 'campus-ambassador' }} /></div></div></div></section>}
    <section className="section container"><SectionHeading eyebrow="Why join us" title="Built to move potential into practice." copy="The work is not just about holding a role. It is about showing up, gaining perspective and contributing where it matters." centered /><div className="benefit-grid">{settings.whyJoin.map((item, index) => <article key={item.title} className="benefit-card"><span className="benefit-icon"><Icon name={iconByIndex[index]} /></span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>
    <TestimonialSection testimonials={data.testimonials} />
    <section className="section timeline-section"><div className="container"><SectionHeading eyebrow="How it works" title="A clear beginning to your next chapter." /><ol className="process-list">{settings.howItWorks.map((item) => <li key={item.step}><span>{item.step}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol></div></section>
    <section className="section container leadership-section"><div><SectionHeading eyebrow="One connected ecosystem" title="Leadership that stays close to the community." copy="Each level has a distinct responsibility, while staying connected to one shared mission." /></div><div className="leadership-stack">{settings.leadershipStructure.map((item, index) => <details open={index === 0} key={item.level}><summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.level}</strong><b>+</b></summary><p>{item.description}</p></details>)}</div></section>
    <section className="section container split-preview"><div><SectionHeading eyebrow="What’s ahead" title="Opportunities are shared when they are ready." copy="Keep an eye on the hub for new events, initiatives, applications and announcements." /><Link className="button button-secondary" to="/announcements">See announcements <span>→</span></Link></div><div className="preview-column"><div className="preview-block"><span className="preview-icon"><Icon name="calendar" /></span><div><b>Events & workshops</b><p>Upcoming experiences will be published here.</p></div><Link to="/events" aria-label="Explore events">→</Link></div><div className="preview-block"><span className="preview-icon"><Icon name="megaphone" /></span><div><b>Important updates</b><p>Official notices, openings and community news.</p></div><Link to="/announcements" aria-label="Explore announcements">→</Link></div></div></section>
    <section className="container"><div className="closing-cta"><div><span className="eyebrow">Your next step</span><h2>There is room here for what you want to build.</h2></div><ApplicationButton opportunity={{ slug: 'community', title: 'Community Membership', cta_text: 'Join the community' }} /></div></section>
  </>;
}

export function AboutPage({ data }) {
  useDocumentTitle('About'); const { settings } = data;
  return <><PageHero eyebrow="About the hub" title="A more connected future starts with young people who step forward." copy={settings.aboutContent} /><section className="section container narrative-grid"><div><span className="eyebrow">Our mission</span><h2>{settings.mission}</h2></div><div className="narrative-card"><span className="eyebrow">Our vision</span><p>{settings.vision}</p></div></section><section className="section soft-section"><div className="container"><SectionHeading eyebrow="How we show up" title="Five ways to make an impact." centered /><div className="pillar-grid">{settings.aboutPillars.map((pillar, index) => <article key={pillar.title}><span>0{index + 1}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>)}</div></div></section><section className="section container split-copy"><div><span className="eyebrow">A community, not a claim</span><h2>Real participation is at the centre of our work.</h2></div><p>We do not rely on inflated statistics or promises. The Hub is built deliberately: through people who learn from one another, take responsibility and make space for meaningful action.</p></section></>;
}

export function ListingPage({ data }) { useDocumentTitle('Opportunities'); return <><PageHero eyebrow="Opportunities" title="Choose a role that meets you where you are." copy="Explore pathways into the Youth Empowerment Hub community. Each role is designed with a clear purpose, responsibilities and room to grow." /><section className="section container"><div className="opportunity-grid listing-grid">{data.opportunities.map((item, index) => <OpportunityCard key={item.slug} opportunity={item} index={index} />)}</div></section><section className="section container"><div className="closing-cta compact"><div><span className="eyebrow">Flagship pathway</span><h2>Ready to lead on campus?</h2></div><Link className="button button-primary" to="/campus-ambassador">Explore Campus Ambassador <span>→</span></Link></div></section></>; }

export function CommunityPage({ data }) { const opportunity = data.opportunities.find((item) => item.slug === 'community-member' || item.slug === 'community') || {}; return <RolePage slug={opportunity.slug || 'community-member'} data={data} opportunity={opportunity} />; }

export function RolePage({ slug, data, premium = false, opportunity: passedOpportunity }) {
  const opportunity = passedOpportunity || (slug === 'campus-ambassador' ? { ...data.campusAmbassador, slug } : data.opportunities.find((item) => item.slug === slug));
  const title = opportunity?.title || 'Opportunity'; useDocumentTitle(title);
  if (!opportunity) return <NotFoundPage />;
  const roleLabel = title === 'Community Member' ? 'Community Membership' : title;
  return <><PageHero eyebrow={premium ? 'Flagship opportunity' : 'Youth Empowerment Hub opportunity'} title={title === 'Community Member' ? 'Community Membership' : title} copy={opportunity.description} theme={premium ? 'premium-page-hero' : ''}><div className="hero-actions"><ApplicationButton opportunity={opportunity} /><Link to="/opportunities" className="button button-secondary">Explore all roles</Link></div></PageHero><section className="section container role-overview"><div><span className="eyebrow">Role overview</span><h2>{premium ? 'Make your campus a place of possibility.' : `A role with purpose, not just a title.`}</h2><p>{opportunity.description}</p></div><aside><span className="aside-label">Application status</span><strong className={`status large ${opportunity.application_status?.toLowerCase().replace(' ', '-') || 'open'}`}>{opportunity.application_status || 'Open'}</strong><p>Read the role details before beginning your application.</p></aside></section><section className="section soft-section"><div className="container role-detail-grid"><ListSection title="What you can gain" items={opportunity.benefits} /><ListSection title={slug === 'community' || slug === 'community-member' ? 'What participation can look like' : 'What you’ll do'} items={opportunity.responsibilities?.length ? opportunity.responsibilities : ['Join community conversations', 'Take part in relevant initiatives', 'Stay connected with opportunities']} /></div></section><section className="section container eligibility-section"><div><span className="eyebrow">Who should apply</span><h2>People who are ready to participate with intention.</h2></div><div><p>{opportunity.eligibility || `This opportunity is for young people who want to contribute responsibly, collaborate with others and grow through real community experience.`}</p><p>Applications are reviewed according to each opportunity’s requirements and availability. Submitting an application does not guarantee selection.</p></div></section><section className="section container role-cta"><span className="eyebrow">Ready when you are</span><h2>Start your {roleLabel} application.</h2><ApplicationButton opportunity={opportunity} /></section></>;
}

export function DynamicRolePage({ data }) {
  const { slug } = useParams();
  return <RolePage slug={slug} data={data} />;
}

export function EventsPage({ data }) { useDocumentTitle('Events'); return <><PageHero eyebrow="Events & experiences" title="Meaningful spaces to learn, meet and contribute." copy="When events, workshops and community experiences are announced, you will find the official details here." /><section className="section container">{data.events.length ? <div className="event-grid">{data.events.map((event) => <article className="event-card" key={event.id || event.slug}><span>{event.category}</span><h2>{event.title}</h2><p>{event.description}</p><small>{event.event_date || 'Date to be announced'} · {event.is_online ? 'Online' : event.location || 'Location to be announced'}</small></article>)}</div> : <EmptyState title="No upcoming events at the moment." copy="Check back soon for workshops, initiatives and community experiences." link={{ to: '/announcements', label: 'View announcements' }} />}</section></>; }

export function AnnouncementsPage({ data }) { useDocumentTitle('Announcements'); return <><PageHero eyebrow="Announcements" title="Official updates from the Youth Empowerment Hub." copy="Application openings, opportunities, event news and community notices will be posted here." /><section className="section container">{data.announcements.length ? <div className="announcement-grid">{data.announcements.map((item) => <article key={item.id} className={item.is_featured ? 'announcement-card featured' : 'announcement-card'}><span>{item.category}</span><h2>{item.title}</h2><p>{item.content}</p><small>{item.published_at}</small></article>)}</div> : <EmptyState icon="megaphone" title="No announcements to share yet." copy="Official opportunities and community updates will appear here when they are published." link={{ to: '/opportunities', label: 'Explore opportunities' }} />}</section></>; }

export function FaqPage({ data }) { useDocumentTitle('Frequently asked questions'); return <><PageHero eyebrow="FAQs" title="Everything you may want to know before you apply." copy="If you still need help, use the official contact details to reach the team." /><section className="section container faq-page-list">{data.faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</section></>; }

export function ContactPage({ data }) { 
  useDocumentTitle('Contact'); 
  const { settings, socialLinks } = data; 
  return <><PageHero eyebrow="Get in touch" title="We’re here for meaningful questions and connections." copy="For official queries, use the contact information below. We will share additional local contact details when available." />
  <section className="section container contact-grid">
    <a className="contact-card" href={`mailto:${settings.contactEmail}`}><span><Icon name="mail" /></span><small>Email</small><strong>{settings.contactEmail}</strong><i>→</i></a>
    {settings.contactPhone && <a className="contact-card" href={`tel:${settings.contactPhone.replace(/[^0-9+]/g, '')}`}><span><Icon name="megaphone" /></span><small>Phone</small><strong>{settings.contactPhone}</strong><i>→</i></a>}
    {settings.contactLocation && <div className="contact-card"><span><Icon name="pin" /></span><small>Location</small><strong>{settings.contactLocation}</strong></div>}
    {settings.contactHours && <div className="contact-card"><span><Icon name="calendar" /></span><small>Support Hours</small><strong>{settings.contactHours}</strong></div>}
    <div className="contact-card"><span><Icon name="shield" /></span><small>Responsible contact</small><strong>Official channels only</strong><p>Protect your information and use the Hub’s verified links.</p></div>
  </section>
  {socialLinks.length > 0 && <section className="section container"><SectionHeading eyebrow="Connect" title="Find us on official social platforms." /><div className="social-grid">{socialLinks.map((item) => <a href={item.url} key={item.id || item.platform} target="_blank" rel="noopener noreferrer">{item.platform} <span>↗</span></a>)}</div></section>}
  </>; 
}

export function LegalPage({ type }) { useDocumentTitle(type); return <><PageHero eyebrow="Youth Empowerment Hub" title={type} copy="These guidelines help keep the platform clear, respectful and safe for everyone involved." /><section className="section container legal-copy"><h2>Our commitment</h2><p>Youth Empowerment Hub is committed to maintaining a professional, inclusive and responsible community space. This page will contain the full approved {type.toLowerCase()} before public launch.</p><h2>Application disclaimer</h2><p>Submitting an application does not guarantee selection. Applications are reviewed according to the stated requirements and opportunity availability. Please provide accurate information and use official links only.</p><h2>Need clarification?</h2><p>Contact the organization through the official contact channel listed on this site.</p></section></>; }

export function NotFoundPage() { useDocumentTitle('Page not found'); const location = useLocation(); return <section className="not-found container"><span className="eyebrow">404</span><h1>This page has moved, or it does not exist.</h1><p>We could not find <code>{location.pathname}</code>.</p><Link className="button button-primary" to="/">Return home <span>→</span></Link></section>; }
