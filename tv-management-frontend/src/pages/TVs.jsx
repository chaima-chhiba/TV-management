import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import tvService from '../services/tvService';
import TVForm from '../components/TVForm';

export default function TVs() {
  const [tvs, setTvs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTV, setEditingTV] = useState(null);

  useEffect(() => {
    tvService.getTVs().then(data => setTvs(data));
  }, []);

  const getId = (tv) => tv.id || tv._id;

  const handleAddTV = async (data) => {
    const newTV = await tvService.addTV(data);
    setTvs(prev => [...prev, newTV]);
    setShowAddForm(false);
  };

  const handleEditTV = async (id, data) => {
    const updated = await tvService.updateTV(id, data);
    setTvs(prev => prev.map(tv => getId(tv) === id ? updated : tv));
    setEditingTV(null);
    setShowAddForm(false);
  };

  const handleDeleteTV = async (id) => {
    if (!window.confirm('Are you sure you want to delete this TV?')) return;
    await tvService.deleteTV(id);
    setTvs(prev => prev.filter(tv => getId(tv) !== id));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f9fc',
      padding: '2.5rem 2rem',
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>TV Management</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Add, monitor, and organize your digital screens
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: '#4f7cff',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
            fontSize: 14,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background 0.2s',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          Add TV
        </button>
      </div>

      {/* TV Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {tvs.map(tv => (
          <div key={getId(tv)} style={{
            flex: '1 1 280px',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            transition: 'box-shadow 0.2s ease-in-out'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{tv.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{tv.department}</p>
                </div>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: tv.status === 'online' ? '#22c55e' : '#dc2626'
                }} />
              </div>

              {/* Status Info */}
              <div style={{ marginTop: 16, fontSize: 14, color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Layout:</span>
                  <span>{tv.layout === 1 ? 'Full Screen' : `${tv.layout} Split`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status:</span>
                  <span style={{ color: tv.status === 'online' ? '#16a34a' : '#dc2626' }}>
                    {tv.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button
                onClick={() => {
                  setEditingTV(tv);
                  setShowAddForm(true);
                }}
                style={{
                  flex: 1,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTV(getId(tv))}
                style={{
                  flex: 1,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {tvs.length === 0 && (
          <div style={{
            flex: '1 1 100%',
            background: '#f5f7fa',
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            color: '#64748b',
            fontSize: 14
          }}>
            No TVs found. Add one to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <TVForm
          tv={editingTV}
          onSubmit={editingTV
            ? (data) => handleEditTV(getId(editingTV), data)
            : handleAddTV}
          onCancel={() => {
            setShowAddForm(false);
            setEditingTV(null);
          }}
        />
      )}
    </div>
  );
}
