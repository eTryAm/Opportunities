import { Icon } from '../../components/Icon';

export function DataTable({ 
  columns, 
  data, 
  keyField = 'id', 
  loading = false, 
  emptyMessage = 'No records found.',
  onEdit,
  onDelete,
  onTogglePublish,
  onToggleFeatured,
  renderActions
}) {
  if (loading) {
    return <div className="admin-table-empty">Loading records…</div>;
  }

  if (!data || data.length === 0) {
    return <div className="admin-table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ width: col.width }}>{col.label}</th>
            ))}
            <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((col, i) => (
                <td key={i}>
                  {col.render ? col.render(row) : row[col.field]}
                </td>
              ))}
              <td className="admin-table-actions" style={{ textAlign: 'right' }}>
                {onToggleFeatured && (
                  <button 
                    onClick={() => onToggleFeatured(row)} 
                    title={row.is_featured ? 'Remove featured status' : 'Feature this'}
                    className={`action-btn ${row.is_featured ? 'is-featured' : ''}`}
                  >
                    <Icon name="spark" size={14} />
                  </button>
                )}
                {onTogglePublish && (
                  <button 
                    onClick={() => onTogglePublish(row)} 
                    title={row.is_published ? 'Unpublish' : 'Publish'}
                    className={`action-btn ${row.is_published ? 'is-published' : ''}`}
                  >
                    <Icon name={row.is_published ? 'arrow' : 'menu'} size={14} />
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(row)} title="Edit" className="action-btn">
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(row)} title="Delete" className="action-btn action-danger">
                    <Icon name="close" size={14} />
                  </button>
                )}
                {renderActions && renderActions(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
