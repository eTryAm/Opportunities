import config from '../config.js';
import { hashPassword } from '../utils/password.js';

export async function seedDatabase(db) {
  const adminPassword = config.adminPassword;
  const passwordHash = await hashPassword(adminPassword);

  db.prepare(`
    INSERT INTO admins (email, password_hash, name, role, is_active)
    VALUES (?, ?, ?, 'SUPER_ADMIN', 1)
  `).run(config.adminEmail, passwordHash, 'Super Admin');

  console.log('\n========================================');
  console.log('  Youth Empowerment Hub — Database Seeded');
  console.log('========================================');
  console.log(`  Initial administrator: ${config.adminEmail}`);
  console.log('  Credentials were sourced from environment configuration.');
  console.log('========================================\n');

  const formLinks = [
    { key: 'community_member', label: 'Community Member Application', url: '#' },
    { key: 'volunteer', label: 'Volunteer Application', url: '#' },
    { key: 'district_representative', label: 'District Representative Application', url: '#' },
    { key: 'state_representative', label: 'State Representative Application', url: '#' },
    { key: 'campus_ambassador', label: 'Campus Ambassador Application', url: '#' },
  ];

  const insertFormLink = db.prepare(`
    INSERT INTO form_links (key, label, url, enabled) VALUES (?, ?, ?, 1)
  `);
  for (const link of formLinks) {
    insertFormLink.run(link.key, link.label, link.url);
  }

  const settings = {
    org_name: 'Youth Empowerment Hub',
    hero_headline: 'Be Part of the Movement. Build Your Future. Empower Others.',
    hero_subheadline:
      'Youth Empowerment Hub is building a community of young people who want to learn, lead, volunteer, create opportunities and make meaningful impact.',
    hero_primary_cta: 'Join the Community',
    hero_secondary_cta: 'Explore Opportunities',
    about_title: 'About Youth Empowerment Hub',
    about_content:
      'Youth Empowerment Hub exists to connect ambitious young people with leadership opportunities, community initiatives, and meaningful growth experiences. We believe in empowering the next generation to learn, lead, connect, create, and impact their communities.',
    about_pillars: [
      { title: 'Learn', description: 'Learn new skills and gain exposure.' },
      { title: 'Lead', description: 'Take responsibility and develop leadership abilities.' },
      { title: 'Connect', description: 'Meet motivated young people and professionals.' },
      { title: 'Create', description: 'Build projects, events and initiatives.' },
      { title: 'Impact', description: 'Contribute to meaningful community activities.' },
    ],
    mission:
      'To empower young people with leadership opportunities, community connections, and platforms to create meaningful social impact.',
    vision:
      'A generation of young leaders who are equipped, connected, and committed to building stronger communities.',
    contact_email: 'contact@youthempowermenthub.org',
    contact_location: '',
    why_join: [
      { title: 'Leadership', description: 'Develop real leadership experience.' },
      { title: 'Networking', description: 'Connect with ambitious students and young people.' },
      { title: 'Experience', description: 'Gain exposure through events, projects and initiatives.' },
      { title: 'Learning', description: 'Access educational and skill-development opportunities.' },
      { title: 'Recognition', description: 'Build a portfolio of meaningful contributions.' },
      { title: 'Impact', description: 'Use your skills to create positive change.' },
    ],
    how_it_works: [
      { step: '01', title: 'Explore', description: 'Discover the opportunity that fits you.' },
      { step: '02', title: 'Apply', description: 'Complete the relevant application form.' },
      { step: '03', title: 'Connect', description: 'Our team reviews applications and connects with selected candidates.' },
      { step: '04', title: 'Lead & Grow', description: 'Become part of the Youth Empowerment Hub ecosystem.' },
    ],
    leadership_structure: [
      { level: 'Youth Empowerment Hub', description: 'Central organization and leadership team.' },
      { level: 'Central Leadership', description: 'Strategic direction and national coordination.' },
      { level: 'State Representatives', description: 'State-level coordination and network expansion.' },
      { level: 'District Representatives', description: 'District-level initiatives and local youth networks.' },
      { level: 'Campus Ambassadors', description: 'Campus-level leadership and student community building.' },
      { level: 'Volunteers & Community Members', description: 'The foundation of our growing community.' },
    ],
    trust_strip: [
      { label: 'Growing Community', key: 'community' },
      { label: 'Volunteer Network', key: 'volunteers' },
      { label: 'District Presence', key: 'districts' },
      { label: 'Leadership Opportunities', key: 'leadership' },
      { label: 'Campus Opportunities', key: 'campus' },
    ],
    comparison_matrix: {
      rows: [
        { feature: 'Community Access', community_member: true, volunteer: true, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Volunteer Experience', community_member: false, volunteer: true, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Leadership Responsibility', community_member: false, volunteer: false, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Networking', community_member: true, volunteer: true, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Event Participation', community_member: true, volunteer: true, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Recognition', community_member: false, volunteer: true, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Leadership Exposure', community_member: false, volunteer: false, district_representative: true, state_representative: true, campus_ambassador: true },
        { feature: 'Campus Leadership', community_member: false, volunteer: false, district_representative: false, state_representative: false, campus_ambassador: true },
        { feature: 'District-Level Responsibility', community_member: false, volunteer: false, district_representative: true, state_representative: true, campus_ambassador: false },
        { feature: 'State-Level Responsibility', community_member: false, volunteer: false, district_representative: false, state_representative: true, campus_ambassador: false },
      ],
      columns: ['community_member', 'volunteer', 'district_representative', 'state_representative', 'campus_ambassador'],
    },
    footer_description:
      'Youth Empowerment Hub is a community platform for young people who want to learn, lead, volunteer, and create meaningful impact.',
    privacy_policy:
      'Your privacy is important to us. This policy describes how Youth Empowerment Hub collects, uses, and protects your information when you use our platform and submit applications.',
    terms_conditions:
      'By using the Youth Empowerment Hub platform, you agree to these terms and conditions governing your use of our website and services.',
    code_of_conduct:
      'All members and applicants are expected to maintain respectful, inclusive, and professional conduct within the Youth Empowerment Hub community.',
    community_guidelines:
      'Our community guidelines outline expected behavior, communication standards, and principles for positive engagement.',
    application_disclaimer:
      'Submitting an application does not guarantee selection. Applications are reviewed according to the requirements and availability of each opportunity.',
    seo_title: 'Youth Empowerment Hub — Community, Leadership & Opportunities',
    seo_description:
      'Join Youth Empowerment Hub. Explore community membership, volunteer roles, district and state representative opportunities, and the Campus Ambassador program.',
    theme_primary_color: '#1a365d',
    theme_secondary_color: '#2d3748',
    theme_accent_color: '#3182ce',
  };

  const insertSetting = db.prepare(`
    INSERT INTO site_settings (key, value) VALUES (?, ?)
  `);
  for (const [key, value] of Object.entries(settings)) {
    insertSetting.run(key, JSON.stringify(value));
  }

  const opportunities = [
    {
      slug: 'community-member',
      title: 'Community Member',
      description:
        'Join the Youth Empowerment Hub community and become part of a growing network of ambitious young people.',
      benefits: ['Community access', 'Youth networking', 'Event participation', 'Learning opportunities', 'Announcements', 'Community initiatives'],
      responsibilities: [],
      eligibility: 'Open to all motivated young people who want to be part of a growing community.',
      badge: null,
      application_status: 'Open',
      sort_order: 1,
    },
    {
      slug: 'volunteer',
      title: 'Volunteer',
      description: 'Contribute your time, skills and ideas to help organize initiatives and create impact.',
      benefits: ['Real-world experience', 'Event participation', 'Team collaboration', 'Leadership exposure', 'Community contribution', 'Recognition opportunities'],
      responsibilities: ['Support event organization', 'Contribute skills and ideas', 'Collaborate with team members', 'Participate in community initiatives'],
      eligibility: 'Young people willing to contribute time and skills to community initiatives.',
      badge: null,
      application_status: 'Open',
      sort_order: 2,
    },
    {
      slug: 'district-representative',
      title: 'District Representative',
      description: 'Represent Youth Empowerment Hub at the district level and help build a strong local youth network.',
      benefits: ['Leadership experience', 'District-level recognition', 'Networking', 'Event leadership', 'Professional exposure'],
      responsibilities: [
        'Coordinate district-level initiatives',
        'Support local events',
        'Build student/youth networks',
        'Coordinate volunteers',
        'Promote opportunities',
        'Communicate with the central team',
      ],
      eligibility: 'Young leaders with strong local networks and commitment to youth empowerment.',
      badge: 'Leadership Role',
      application_status: 'Open',
      sort_order: 3,
    },
    {
      slug: 'state-representative',
      title: 'State Representative',
      description: 'Take a larger leadership role by helping coordinate Youth Empowerment Hub activities across the state.',
      benefits: ['State-level leadership exposure', 'Strategic experience', 'Professional networking', 'Leadership recognition', 'Large-scale project experience'],
      responsibilities: [
        'Support district representatives',
        'Coordinate state-level initiatives',
        'Help expand the network',
        'Support campaigns/events',
        'Work with the central leadership team',
      ],
      eligibility: 'Experienced young leaders with demonstrated commitment and organizational skills.',
      badge: 'State Leadership',
      application_status: 'Open',
      sort_order: 4,
    },
    {
      slug: 'campus-ambassador',
      title: 'Campus Ambassador',
      description: 'Become the face of Youth Empowerment Hub on your campus and help build a stronger student community.',
      benefits: [
        'Campus leadership experience',
        'Networking opportunities',
        'Event coordination experience',
        'Leadership development',
        'Community recognition',
        'Experience working with a growing youth organization',
      ],
      responsibilities: [
        'Represent Youth Empowerment Hub on campus',
        'Build student community engagement',
        'Promote opportunities and events',
        'Coordinate campus-level initiatives',
      ],
      eligibility: 'Enrolled students with leadership potential and campus engagement experience.',
      badge: 'Premium / Flagship Opportunity',
      application_status: 'Coming Soon',
      sort_order: 5,
    },
  ];

  const insertOpp = db.prepare(`
    INSERT INTO opportunities (slug, title, description, benefits, responsibilities, eligibility, badge, application_status, is_published, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  for (const opp of opportunities) {
    insertOpp.run(
      opp.slug,
      opp.title,
      opp.description,
      JSON.stringify(opp.benefits),
      JSON.stringify(opp.responsibilities),
      opp.eligibility,
      opp.badge,
      opp.application_status,
      opp.slug === 'campus-ambassador' ? 1 : 0,
      opp.sort_order
    );
  }

  const faqs = [
    {
      question: 'What is Youth Empowerment Hub?',
      answer:
        'Youth Empowerment Hub is a community platform that connects young people with leadership opportunities, volunteer roles, and meaningful growth experiences. We help you learn, lead, connect, create, and make impact.',
      category: 'General',
      sort_order: 1,
    },
    {
      question: 'Who can join?',
      answer:
        'Youth Empowerment Hub is open to motivated young people who want to be part of a growing community. Specific roles may have additional eligibility requirements listed on each opportunity page.',
      category: 'General',
      sort_order: 2,
    },
    {
      question: 'Is membership free?',
      answer:
        'Yes, joining the Youth Empowerment Hub community as a member is free. Some specialized roles may have specific requirements, but there are no membership fees.',
      category: 'General',
      sort_order: 3,
    },
    {
      question: 'How can I become a volunteer?',
      answer:
        'Visit the Volunteer opportunity page and click "Apply as Volunteer" to complete the application form. Our team will review your application and contact selected candidates.',
      category: 'Opportunities',
      sort_order: 4,
    },
    {
      question: 'How can I become a District Representative?',
      answer:
        'Apply through the District Representative application form available on the opportunities page. We look for young leaders with strong local networks and commitment to youth empowerment.',
      category: 'Opportunities',
      sort_order: 5,
    },
    {
      question: 'How can I become a State Representative?',
      answer:
        'State Representative applications are reviewed based on leadership experience, organizational skills, and commitment. Apply through the State Representative application form on our website.',
      category: 'Opportunities',
      sort_order: 6,
    },
    {
      question: 'What is the Campus Ambassador Program?',
      answer:
        'The Campus Ambassador Program is our flagship leadership opportunity. Campus Ambassadors represent Youth Empowerment Hub on their campus, build student communities, and coordinate campus-level initiatives.',
      category: 'Campus Ambassador',
      sort_order: 7,
    },
    {
      question: 'How are applications reviewed?',
      answer:
        'Our team reviews each application based on the requirements and availability of each opportunity. Review timelines may vary depending on the role and application volume.',
      category: 'Applications',
      sort_order: 8,
    },
    {
      question: 'How will selected candidates be contacted?',
      answer:
        'Selected candidates will be contacted via the email address provided in their application. Please ensure you use an active email address when applying.',
      category: 'Applications',
      sort_order: 9,
    },
    {
      question: 'Can I apply for multiple roles?',
      answer:
        'Yes, you may apply for multiple roles. However, each application is reviewed independently based on the specific requirements of that role.',
      category: 'Applications',
      sort_order: 10,
    },
  ];

  const insertFaq = db.prepare(`
    INSERT INTO faqs (question, answer, category, sort_order, is_published) VALUES (?, ?, ?, ?, 1)
  `);
  for (const faq of faqs) {
    insertFaq.run(faq.question, faq.answer, faq.category, faq.sort_order);
  }

  db.prepare(`
    INSERT INTO campus_ambassador_settings (id, title, subtitle, description, benefits, responsibilities, eligibility, application_status, badge, cta_text, is_visible, is_premium)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  `).run(
    'Campus Ambassador Program',
    'Lead Where You Learn.',
    'Become the face of Youth Empowerment Hub on your campus and help build a stronger student community around opportunities, learning and leadership.',
    JSON.stringify([
      'Campus leadership experience',
      'Certificate/recognition',
      'Networking opportunities',
      'Event coordination experience',
      'Personal branding exposure',
      'Leadership development',
      'Access to selected opportunities',
      'Community recognition',
      'Experience working with a growing youth organization',
    ]),
    JSON.stringify([
      'Represent Youth Empowerment Hub on your campus',
      'Build and engage a student community',
      'Promote opportunities, events, and initiatives',
      'Coordinate campus-level activities',
      'Communicate with the central team',
    ]),
    'Enrolled students with leadership potential, campus engagement experience, and commitment to youth empowerment.',
    'Coming Soon',
    'Premium / Flagship Opportunity',
    'Become a Campus Ambassador'
  );

  const impactStats = [
    { key: 'members', label: 'Community Members', display_value: 'Growing', sort_order: 1 },
    { key: 'volunteers', label: 'Volunteers', display_value: 'Active Network', sort_order: 2 },
    { key: 'districts', label: 'Districts', display_value: 'Expanding', sort_order: 3 },
    { key: 'states', label: 'States', display_value: 'Growing', sort_order: 4 },
    { key: 'events', label: 'Events', display_value: 'Ongoing', sort_order: 5 },
    { key: 'initiatives', label: 'Initiatives', display_value: 'Community-Led', sort_order: 6 },
  ];

  const insertImpact = db.prepare(`
    INSERT INTO impact_statistics (key, label, value, display_value, is_visible, sort_order) VALUES (?, ?, ?, ?, 1, ?)
  `);
  for (const stat of impactStats) {
    insertImpact.run(stat.key, stat.label, null, stat.display_value, stat.sort_order);
  }

  const socialLinks = [
    { platform: 'Instagram', url: 'https://instagram.com/', sort_order: 1 },
    { platform: 'YouTube', url: 'https://youtube.com/', sort_order: 2 },
    { platform: 'LinkedIn', url: 'https://linkedin.com/', sort_order: 3 },
    { platform: 'Email', url: 'mailto:contact@youthempowermenthub.org', sort_order: 4 },
  ];

  const insertSocial = db.prepare(`
    INSERT INTO social_links (platform, url, is_visible, sort_order) VALUES (?, ?, 0, ?)
  `);
  for (const link of socialLinks) {
    insertSocial.run(link.platform, link.url, link.sort_order);
  }
}
