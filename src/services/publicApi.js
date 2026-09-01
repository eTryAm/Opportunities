import { formLinkDefaults } from '../config/applicationLinks';

const ROOT_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '';
export const API_BASE = import.meta.env.VITE_PUBLIC_API_URL || `${ROOT_BASE}/api/public`;

export const fallbackHome = {
  settings: {
    orgName: 'Youth Empowerment Hub',
    heroHeadline: 'Be Part of the Movement. Build Your Future. Empower Others.',
    heroSubheadline: 'Youth Empowerment Hub is building a community of young people who want to learn, lead, volunteer, create opportunities and make meaningful impact.',
    heroPrimaryCta: 'Join the Community', heroSecondaryCta: 'Explore Opportunities',
    aboutTitle: 'A community built for young people who want to move forward.',
    aboutContent: 'Youth Empowerment Hub brings ambitious young people closer to meaningful leadership, learning and community-building opportunities. We create a place to contribute, connect and grow with intention.',
    aboutPillars: [
      { title: 'Learn', description: 'Learn new skills and gain exposure.' }, { title: 'Lead', description: 'Take responsibility and develop leadership abilities.' }, { title: 'Connect', description: 'Meet motivated young people and professionals.' }, { title: 'Create', description: 'Build projects, events and initiatives.' }, { title: 'Impact', description: 'Contribute to meaningful community activities.' },
    ],
    mission: 'To empower young people with leadership opportunities, community connections, and platforms to create meaningful social impact.',
    vision: 'A generation of young leaders who are equipped, connected, and committed to building stronger communities.',
    whyJoin: [
      { title: 'Leadership', description: 'Develop real leadership experience.' }, { title: 'Networking', description: 'Connect with ambitious students and young people.' }, { title: 'Experience', description: 'Gain exposure through events, projects and initiatives.' }, { title: 'Learning', description: 'Access educational and skill-development opportunities.' }, { title: 'Recognition', description: 'Build a portfolio of meaningful contributions.' }, { title: 'Impact', description: 'Use your skills to create positive change.' },
    ],
    howItWorks: [
      { step: '01', title: 'Explore', description: 'Discover the opportunity that fits you.' }, { step: '02', title: 'Apply', description: 'Complete the relevant application form.' }, { step: '03', title: 'Connect', description: 'Our team reviews applications and connects with selected candidates.' }, { step: '04', title: 'Lead & Grow', description: 'Become part of the Youth Empowerment Hub ecosystem.' },
    ],
    leadershipStructure: [
      { level: 'Youth Empowerment Hub', description: 'The community and its shared purpose.' }, { level: 'Central Leadership', description: 'Strategic direction and coordination.' }, { level: 'State Representatives', description: 'State-level leadership and support.' }, { level: 'District Representatives', description: 'Local networks and initiatives.' }, { level: 'Campus Ambassadors', description: 'Campus-based community building.' }, { level: 'Volunteers & Community Members', description: 'The people who power every initiative.' },
    ],
    trustStrip: [{ label: 'Growing Community' }, { label: 'Volunteer Network' }, { label: 'District Presence' }, { label: 'Leadership Opportunities' }, { label: 'Campus Opportunities' }],
    footerDescription: 'A youth leadership community for people who want to learn, lead and create meaningful impact.', contactEmail: 'contact@youthempowermenthub.org', contactLocation: '',
  },
  opportunities: [
    { slug: 'community-member', title: 'Community Member', description: 'Join a growing network of ambitious young people committed to learning, leadership and positive change.', benefits: ['Community access', 'Youth networking', 'Event participation', 'Learning opportunities', 'Announcements'], responsibilities: [], application_status: 'Open', sort_order: 1 },
    { slug: 'volunteer', title: 'Volunteer', description: 'Contribute your time, skills and ideas to help organize initiatives and create impact.', benefits: ['Real-world experience', 'Team collaboration', 'Leadership exposure', 'Recognition opportunities'], responsibilities: ['Support initiatives and events', 'Collaborate with the wider team', 'Bring ideas into action'], application_status: 'Open', sort_order: 2 },
    { slug: 'district-representative', title: 'District Representative', description: 'Represent Youth Empowerment Hub at the district level and help build a strong local youth network.', benefits: ['Leadership experience', 'District-level recognition', 'Networking', 'Professional exposure'], responsibilities: ['Coordinate district initiatives', 'Support local events', 'Build youth networks', 'Coordinate volunteers'], application_status: 'Open', sort_order: 3 },
    { slug: 'state-representative', title: 'State Representative', description: 'Take a larger leadership role by supporting Youth Empowerment Hub activities across your state.', benefits: ['State-level leadership exposure', 'Strategic experience', 'Professional networking', 'Large-scale project experience'], responsibilities: ['Support district representatives', 'Coordinate state initiatives', 'Help expand the network', 'Work with central leadership'], application_status: 'Open', sort_order: 4 },
  ],
  campusAmbassador: { title: 'Campus Ambassador Program', subtitle: 'Lead Where You Learn.', description: 'Become the face of Youth Empowerment Hub on your campus and help build a stronger student community around opportunity, learning and leadership.', benefits: ['Campus leadership experience', 'Networking opportunities', 'Event coordination experience', 'Leadership development', 'Community recognition'], responsibilities: ['Connect students with relevant opportunities', 'Help build campus community', 'Support local initiatives'], eligibility: 'Students and young people ready to lead responsibly on their campus.', badge: 'Premium / Flagship Opportunity', cta_text: 'Become a Campus Ambassador', application_status: 'Open', is_visible: true, is_premium: true },
  events: [], announcements: [], testimonials: [], impact: [], socialLinks: [],
  faqs: [
    { question: 'What is Youth Empowerment Hub?', answer: 'Youth Empowerment Hub is a community for young people who want to learn, lead, volunteer and create meaningful impact.' }, { question: 'Who can join?', answer: 'The community is designed for motivated young people who want to explore opportunities and contribute positively.' }, { question: 'Is membership free?', answer: 'Any membership details will be shared on the relevant application page or form.' }, { question: 'Can I apply for multiple roles?', answer: 'You may explore the roles that fit your interests and experience. Please read each role carefully before applying.' }, { question: 'How are applications reviewed?', answer: 'The team reviews applications according to the requirements and availability of each opportunity.' },
  ],
  formLinks: Object.entries(formLinkDefaults).map(([key, url]) => ({ key, url, enabled: true })),
};

export async function getHomeData() {
  const response = await fetch(`${API_BASE}/home`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Unable to load public content');
  const data = await response.json();
  
  // Prevent empty database arrays from wiping out the beautiful premium static data
  const finalData = { ...fallbackHome, ...data };
  
  if (!data.opportunities?.length) finalData.opportunities = fallbackHome.opportunities;
  if (!data.events?.length) finalData.events = fallbackHome.events;
  if (!data.announcements?.length) finalData.announcements = fallbackHome.announcements;
  if (!data.testimonials?.length) finalData.testimonials = fallbackHome.testimonials;
  if (!data.faqs?.length) finalData.faqs = fallbackHome.faqs;
  if (!data.impact?.length) finalData.impact = fallbackHome.impact;
  if (!data.socialLinks?.length) finalData.socialLinks = fallbackHome.socialLinks;
  if (!data.campusAmbassador || !data.campusAmbassador.is_visible) {
    finalData.campusAmbassador = fallbackHome.campusAmbassador;
  }
  
  return {
    ...finalData,
    settings: { ...fallbackHome.settings, ...data.settings },
    formLinks: data.formLinks?.length ? data.formLinks : fallbackHome.formLinks
  };
}
