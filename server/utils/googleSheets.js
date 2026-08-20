/**
 * Google Sheets Integration Utility
 * 
 * Fetches data from a publicly shared Google Sheet (published as CSV).
 * No OAuth required — uses the standard export URL pattern.
 * 
 * Usage: Share the Google Sheet publicly (View access), then use the sheet URL.
 */

/**
 * Extracts the Google Sheet ID from various URL formats
 */
export function extractSheetId(url) {
  if (!url || typeof url !== 'string') return null;
  // Match: https://docs.google.com/spreadsheets/d/{SHEET_ID}/...
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Builds the CSV export URL for a Google Sheet
 */
export function buildCsvUrl(sheetId) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

/**
 * Parses CSV text into an array of objects using the first row as headers
 */
export function parseCsv(csvText) {
  const lines = csvText.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Parses a single CSV line, handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Maps a Google Sheet row to an application_records row.
 * Tries common column name variations.
 */
export function mapToApplicationRecord(row) {
  // Convert all keys to lowercase without special characters for easy matching
  const normalizedRow = {};
  for (const key in row) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalizedRow[cleanKey] = row[key];
  }

  const getBestMatch = (...targets) => {
    // 1. Exact match
    for (const target of targets) {
      if (normalizedRow[target]) return normalizedRow[target];
    }
    
    // 2. Starts with or ends with (stronger than just includes)
    for (const target of targets) {
      const match = Object.keys(normalizedRow).find(k => k.startsWith(target) || k.endsWith(target));
      if (match && normalizedRow[match]) return normalizedRow[match];
    }
    
    // 3. Includes, but avoid matching long question sentences (length > 30)
    for (const target of targets) {
      const match = Object.keys(normalizedRow).find(k => k.includes(target) && k.length < 30);
      if (match && normalizedRow[match]) return normalizedRow[match];
    }
    
    return '';
  };

  return {
    applicant_name: getBestMatch('name', 'applicantname', 'fullname'),
    // Look for exact "email" first, otherwise fallback to "emailaddress"
    email: getBestMatch('email', 'emailaddress', 'mail'),
    phone: getBestMatch('phone', 'mobilewhatsappnumber', 'whatsapp', 'mobile', 'contact'),
    role: getBestMatch('role', 'position', 'opportunity', 'applyingfor'),
    district: getBestMatch('district'),
    state: getBestMatch('state'),
    college: getBestMatch('collegeuniversityname', 'college', 'university', 'institution', 'campus'),
    applied_date: getBestMatch('timestamp', 'submitted', 'date') || new Date().toISOString(),
  };
}

/**
 * Fetches and parses application records from a public Google Sheet
 */
export async function fetchSheetApplications(sheetUrl) {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    throw new Error('Invalid Google Sheets URL. Please use a URL like: https://docs.google.com/spreadsheets/d/SHEET_ID/edit');
  }

  const csvUrl = buildCsvUrl(sheetId);
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet (${response.status}). Make sure the sheet is shared publicly with "Anyone with the link" set to Viewer.`);
  }

  const csvText = await response.text();
  const rawRows = parseCsv(csvText);

  if (rawRows.length === 0) {
    throw new Error('The sheet appears to be empty or has no data rows.');
  }

  return rawRows.map(mapToApplicationRecord).filter((r) => r.applicant_name && r.email);
}
