// Google Form URLs are public links. Admin-managed API values take precedence.
export const formLinkDefaults = {
  community_member: import.meta.env.VITE_COMMUNITY_MEMBER_FORM_URL || '#',
  volunteer: import.meta.env.VITE_VOLUNTEER_FORM_URL || '#',
  district_representative: import.meta.env.VITE_DISTRICT_REPRESENTATIVE_FORM_URL || '#',
  state_representative: import.meta.env.VITE_STATE_REPRESENTATIVE_FORM_URL || '#',
  campus_ambassador: import.meta.env.VITE_CAMPUS_AMBASSADOR_FORM_URL || '#',
};

export function safeApplicationUrl(url) {
  if (!url || url === '#' || url.trim() === '') return null;
  try {
    const urlStr = url.trim();
    const finalUrl = /^https?:\/\//i.test(urlStr) ? urlStr : `https://${urlStr}`;
    const parsed = new URL(finalUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}
