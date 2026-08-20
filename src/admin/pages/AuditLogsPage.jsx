import { useState, useEffect } from 'react';
import { auditLogsApi } from '../services/adminApi';
import { DataTable } from '../components/DataTable';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    let active = true;
    auditLogsApi.getAll(100)
      .then((data) => {
        if (active) setLogs(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load audit logs');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const columns = [
    { label: 'Date / Time', render: (row) => new Date(row.created_at).toLocaleString(), width: '20%' },
    { label: 'Admin', field: 'admin_email', width: '20%' },
    { label: 'Action', render: (row) => (
      <div>
        <strong style={{ display: 'block', fontSize: '0.75rem', color: '#1f3629' }}>{row.action}</strong>
        <span style={{ fontSize: '0.7rem', color: '#6a7c70' }}>{row.resource_type} ({row.resource_id})</span>
      </div>
    ), width: '25%' },
    { label: 'IP Address', field: 'ip', width: '15%' },
    { label: 'Details', render: (row) => (
      <span style={{ fontSize: '0.7rem', color: '#6a7c70', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '200px' }} title={row.metadata}>
        {row.metadata || '-'}
      </span>
    ), width: '20%' }
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <span>Audit Logs</span>
          <h1>Activity Review</h1>
          <p>A secure record of recent administrative and security events.</p>
        </div>
      </div>

      {error && <div className="admin-notice">{error}</div>}

      <DataTable 
        columns={columns}
        data={logs}
        loading={loading}
        keyField="id"
        emptyMessage="No audit logs found."
      />
    </>
  );
}
