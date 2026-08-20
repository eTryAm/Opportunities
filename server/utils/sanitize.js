const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function sanitizeText(value) {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function sanitizeObject(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] != null && typeof result[field] === 'string') {
      result[field] = sanitizeText(result[field]);
    }
  }
  return result;
}

export function isValidHttpsUrl(url) {
  if (!url || url === '#') return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseJsonField(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return Boolean(value);
}

export function boolToInt(value) {
  return toBool(value) ? 1 : 0;
}

export function formatRow(row, jsonFields = []) {
  if (!row) return row;
  const formatted = { ...row };
  for (const field of jsonFields) {
    if (formatted[field] != null) {
      formatted[field] = parseJsonField(formatted[field], []);
    }
  }
  for (const key of Object.keys(formatted)) {
    if (key.startsWith('is_') || key === 'enabled') {
      formatted[key] = toBool(formatted[key]);
    }
  }
  return formatted;
}

export function formatRows(rows, jsonFields = []) {
  return rows.map((row) => formatRow(row, jsonFields));
}
