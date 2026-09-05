/**
 * Google Sheets Integration Utility
 * 
 * Fetches data from a publicly shared Google Sheet (exported as CSV).
 * No OAuth required — uses Google's standard export URL pattern.
 * 
 * Usage: Share the Google Sheet ("Anyone with the link can view"),
 * then paste the Google Sheet URL.
 */

/**
 * Extracts sheetId, publishedId, and gid from various Google Sheets URL formats
 */
export function extractSheetDetails(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Check if user accidentally pasted a Google Forms URL
  if (trimmed.includes('forms.gle/') || trimmed.includes('/forms/d/')) {
    throw new Error(
      'This appears to be a Google Form link, not a Google Sheet. ' +
      'To get the Sheet URL: Open your Google Form → click the "Responses" tab → ' +
      'click the green "Link to Sheets" icon → copy that Google Sheet URL from your browser.'
    );
  }

  // Check for published Google Sheet: /spreadsheets/d/e/{PUB_ID}/...
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (pubMatch) {
    const pubId = pubMatch[1];
    const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
    return {
      isPublished: true,
      pubId,
      gid: gidMatch ? gidMatch[1] : null,
    };
  }

  // Standard Google Sheet: /spreadsheets/d/{SHEET_ID}/...
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) return null;

  const sheetId = idMatch[1];
  const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);

  return {
    isPublished: false,
    sheetId,
    gid: gidMatch ? gidMatch[1] : null,
  };
}

/**
 * Backwards compatibility helper
 */
export function extractSheetId(url) {
  const details = extractSheetDetails(url);
  return details ? (details.sheetId || details.pubId) : null;
}

/**
 * Builds the CSV export URL for a Google Sheet, preserving the specific tab (gid)
 */
export function buildCsvUrl(sheetIdOrDetails, optionalGid = null) {
  if (typeof sheetIdOrDetails === 'object' && sheetIdOrDetails !== null) {
    const { isPublished, pubId, sheetId, gid } = sheetIdOrDetails;
    if (isPublished) {
      let url = `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`;
      if (gid) url += `&gid=${gid}`;
      return url;
    }
    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    if (gid) url += `&gid=${gid}`;
    return url;
  }

  // Fallback for direct string sheetId
  let url = `https://docs.google.com/spreadsheets/d/${sheetIdOrDetails}/export?format=csv`;
  if (optionalGid) url += `&gid=${optionalGid}`;
  return url;
}

/**
 * Robust CSV parser that handles:
 * - Newlines inside quoted fields (very common in Google Forms questions and paragraph answers)
 * - Escaped double quotes ("")
 * - Windows CRLF and Unix LF line endings
 */
export function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const records = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normalize line endings
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
      if (currentRecord.some(f => f.length > 0)) {
        records.push(currentRecord);
      }
      currentRecord = [];
    } else {
      currentField += char;
    }
  }

  // Push trailing field/record
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some(f => f.length > 0)) {
      records.push(currentRecord);
    }
  }

  if (records.length < 2) return [];

  // Normalize headers: replace newlines with space, convert to snake_case alphanumeric
  const headers = records[0].map((h) =>
    h
      .toLowerCase()
      .replace(/[\n\r]+/g, ' ')
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  );

  const rows = [];
  for (let i = 1; i < records.length; i++) {
    const row = {};
    const values = records[i];
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) {
        row[headers[j]] = values[j] !== undefined ? values[j] : '';
      }
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Maps a Google Sheet row to an application_records row.
 * Handles diverse Google Forms column variations and email detection.
 */
export function mapToApplicationRecord(row) {
  // Normalized key map with non-alphanumeric removed
  const normalizedRow = {};
  for (const key in row) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalizedRow[cleanKey] = (row[key] || '').trim();
  }

  const getBestMatch = (...targets) => {
    // 1. Exact match
    for (const target of targets) {
      if (normalizedRow[target]) return normalizedRow[target];
    }
    
    // 2. Starts with or ends with
    for (const target of targets) {
      const match = Object.keys(normalizedRow).find(
        (k) => (k.startsWith(target) || k.endsWith(target)) && normalizedRow[k]
      );
      if (match) return normalizedRow[match];
    }
    
    // 3. Includes target keyword (avoid matching long descriptive questions over 35 chars)
    for (const target of targets) {
      const match = Object.keys(normalizedRow).find(
        (k) => k.includes(target) && k.length < 35 && normalizedRow[k]
      );
      if (match) return normalizedRow[match];
    }
    
    return '';
  };

  // Find applicant name (avoid matching college name or state name)
  let applicantName = getBestMatch(
    'fullname',
    'name',
    'applicantname',
    'candidatename',
    'studentname',
    'yourname',
    'nameofapplicant',
    'nameofthecandidate'
  );

  // Find email address
  let email = getBestMatch(
    'emailaddress',
    'email',
    'emailid',
    'mail',
    'mailid',
    'username',
    'youremail',
    'officialemail',
    'personalemail'
  );

  // Email regex fallback: if header mapping missed it, scan all row values for a valid email
  if (!email || !email.includes('@')) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    for (const key in row) {
      const val = (row[key] || '').trim();
      if (emailRegex.test(val)) {
        email = val;
        break;
      }
    }
  }

  // Find phone number
  const phone = getBestMatch(
    'mobilewhatsappnumber',
    'whatsappnumber',
    'mobilenumber',
    'phonenumber',
    'phone',
    'whatsapp',
    'mobile',
    'contactnumber',
    'contact',
    'contactno'
  );

  // Find role / position
  const role = getBestMatch(
    'role',
    'position',
    'opportunity',
    'applyingfor',
    'roleappliedfor',
    'whichposition',
    'post'
  );

  // Find district & state
  const district = getBestMatch('district', 'homedistrict', 'currentdistrict', 'citytown', 'city');
  const state = getBestMatch(
    'stateyouwishtorepresentrequired',
    'stateyouwishtorepresent',
    'state',
    'homestate',
    'currentstate'
  );

  // Find college / institution
  const college = getBestMatch(
    'collegeuniversityname',
    'collegeorganizationcompanyname',
    'college',
    'university',
    'institution',
    'campus',
    'school'
  );

  // Find applied date / timestamp
  const appliedDate = getBestMatch('timestamp', 'submitted', 'date', 'submissiontime', 'applieddate') || new Date().toISOString();

  return {
    applicant_name: applicantName,
    email: email.toLowerCase(),
    phone,
    role,
    district,
    state,
    college,
    applied_date: appliedDate,
  };
}

/**
 * Fetches and parses application records from a public Google Sheet
 */
export async function fetchSheetApplications(sheetUrl) {
  const details = extractSheetDetails(sheetUrl);
  if (!details) {
    throw new Error('Invalid Google Sheets URL. Please use a URL like: https://docs.google.com/spreadsheets/d/SHEET_ID/edit');
  }

  const csvUrl = buildCsvUrl(details);
  
  let response;
  try {
    response = await fetch(csvUrl, { redirect: 'follow' });
  } catch (netErr) {
    throw new Error(`Could not connect to Google Sheets: ${netErr.message}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const finalUrl = response.url || '';

  // Check if Google redirected to a sign-in page (meaning the sheet is private)
  if (
    finalUrl.includes('accounts.google.com') ||
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error(
      'Google Sheet is not publicly accessible. Please change sharing to "Anyone with the link can view". ' +
      '(In Google Sheets: click the "Share" button at top right → Under General access, change to "Anyone with the link" → set role to "Viewer" → click Done).'
    );
  }

  if (!response.ok) {
    throw new Error(`Google Sheets returned HTTP ${response.status}. Make sure the sheet link is valid and shared publicly.`);
  }

  const csvText = await response.text();

  // If Google returned HTML instead of CSV, it is almost certainly a sign-in or permission error page
  if (
    contentType.includes('text/html') ||
    csvText.trim().startsWith('<!DOCTYPE') ||
    csvText.includes('ServiceLogin') ||
    csvText.includes('Sign in - Google Accounts')
  ) {
    throw new Error(
      'Google Sheet is private or requiring login. Please make the sheet public: ' +
      'Click "Share" in Google Sheets → set General access to "Anyone with the link can view" → click Done.'
    );
  }

  const rawRows = parseCsv(csvText);

  if (rawRows.length === 0) {
    throw new Error('The sheet appears to be empty or has no data rows.');
  }

  // Map each row to an application record
  const mapped = rawRows.map(mapToApplicationRecord);

  // Filter valid rows (must have at least a name and email, or name and phone)
  const validRecords = mapped.filter((r) => r.applicant_name && (r.email || r.phone));

  if (validRecords.length === 0) {
    throw new Error(
      `Found ${rawRows.length} rows in the sheet, but could not detect valid Applicant Name and Email columns. ` +
      `Please ensure your Google Form sheet has columns like "Name" and "Email".`
    );
  }

  return validRecords;
}
