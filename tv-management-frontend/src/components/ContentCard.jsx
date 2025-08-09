// components/ContentCard.jsx
import React from 'react';

export default function ContentCard({ item, onDelete }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: 16,
        flex: '1 1 220px'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {item.type.toUpperCase()} • {item.duration}s
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginBottom: 12 }}>
        {item.type === 'image' && item.url && (
          <img src={item.url} alt={item.title} style={{ width: '100%', borderRadius: 8 }} />
        )}
        {item.type === 'text' && (
          <div
            style={{
              background: '#f5f7fa',
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
              color: '#374151'
            }}
          >
            {item.content}
          </div>
        )}
        {item.type === 'video' && (
          <div
            style={{
              background: '#000',
              color: '#fff',
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
              textAlign: 'center'
            }}
          >
            Video: {item.url || 'No URL'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={{
            background: '#e0e7ff',
            color: '#3730a3',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 13
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          style={{
            background: '#fecaca',
            color: '#991b1b',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 13
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
