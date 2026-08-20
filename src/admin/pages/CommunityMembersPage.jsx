import { useState, useEffect } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

const API_BASE = '/api/admin';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function CommunityMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Delete
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await request('/community-members');
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await request(`/community-members/${deleteItem.id}`, { method: 'DELETE' });
      setMembers(members.filter((m) => m.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Derive unique locations for filter
  const uniqueLocations = ['All', ...new Set(members.map((m) => m.location).filter(Boolean))];

  // Apply client-side filters
  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_id.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchesLocation = locationFilter === 'All' || m.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    return new Date(b.created_at) - new Date(a.created_at); // newest
  });

  const totalCount = members.length;
  const filteredCount = sorted.length;

  return (
    <>
      <div className="admin-title" style={{ paddingBottom: '10px', borderBottom: 'none' }}>
        <div>
          <span>Administration</span>
          <h1>Community Members</h1>
          <p>
            View and manage registered community members.
            {totalCount > 0 && (
              <strong style={{ marginLeft: '8px' }}>
                {filteredCount === totalCount
                  ? `${totalCount} member${totalCount !== 1 ? 's' : ''}`
                  : `${filteredCount} of ${totalCount} shown`}
              </strong>
            )}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          placeholder="Search by name, ID, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: '#fff',
            minWidth: '240px',
            flex: '1 1 240px',
          }}
        />
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc === 'All' ? 'All Locations' : loc}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {error && <div className="admin-notice">{error}</div>}

      {/* Data Table */}
      <section className="admin-panel" style={{ overflow: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Member ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Photo</th>
              <th style={thStyle}>Joined</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={tdEmpty}>
                  Loading community members…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan="7" style={tdEmpty}>
                  {search || locationFilter !== 'All'
                    ? 'No members match your filters.'
                    : 'No community members have registered yet.'}
                </td>
              </tr>
            ) : (
              sorted.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={tdStyle}>
                    <code
                      style={{
                        padding: '2px 8px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      {m.member_id}
                    </code>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{m.name}</td>
                  <td style={tdStyle}>{m.phone}</td>
                  <td style={tdStyle}>{m.location}</td>
                  <td style={tdStyle}>
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#f3f4f6',
                          color: '#9ca3af',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      className="button button-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                      onClick={() => setDeleteItem(m)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Remove Community Member"
        message={`Are you sure you want to remove "${deleteItem?.name}" (${deleteItem?.member_id}) from the community?`}
        isSubmitting={deleting}
      />
    </>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '2px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.88rem',
  color: '#1f2937',
  verticalAlign: 'middle',
};

const tdEmpty = {
  padding: '40px 16px',
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: '0.9rem',
};
