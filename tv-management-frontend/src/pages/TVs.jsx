import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Copy, Play } from 'lucide-react';
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

  const displayUrl = (id) => `${window.location.origin}/display/${id}`;

  const openDisplay = (id) => {
    window.open(displayUrl(id), '_blank', 'noopener,noreferrer');
  };

  const copyDisplay = async (id) => {
    try {
      await navigator.clipboard.writeText(displayUrl(id));
      alert('Display link copied');
    } catch {
      alert('Copy failed');
    }
  };

  const openAllDisplays = () => {
    tvs.forEach(tv => openDisplay(getId(tv)));
  };

  return (
    <div style={{maxWidth:1200, margin:'0 auto', padding:'2.5rem 2rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:700, color:'#1e293b'}}>TVs</h2>
        <div style={{display:'flex', gap:12}}>
          {tvs.length > 0 && (
            <button
              onClick={openAllDisplays}
              style={topBtnStyle('#6366f1')}
              title="Open all displays"
            >
              <Play size={16}/> Open All
            </button>
          )}
          <button
            onClick={()=>{ setShowAddForm(true); setEditingTV(null); }}
            style={topBtnStyle('#2563eb')}
          >
            <Plus size={16}/> Add TV
          </button>
        </div>
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

      <div style={{display:'grid', gap:24, gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
        {tvs.map(tv => {
          const id = getId(tv);
          return (
            <div key={id} style={cardStyle}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:600, fontSize:18}}>{tv.name || tv.tvId}</div>
                  <div style={{fontSize:13, color:'#64748b'}}>{tv.department || '—'}</div>
                </div>
                <span style={{
                  width:10, height:10, borderRadius:'50%',
                  background: tv.status === 'online' ? '#22c55e' : '#dc2626'
                }}/>
              </div>

              <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:14}}>
                <button onClick={()=>openDisplay(id)} style={pillBtn('#eef2ff','#3730a3')}>
                  <ExternalLink size={14}/> Open
                </button>
                <button onClick={()=>copyDisplay(id)} style={pillBtn('#f1f5f9','#334155')}>
                  <Copy size={14}/> Copy Link
                </button>
                <button
                  onClick={()=>setEditingTV(tv)}
                  style={pillBtn('#e0f2fe','#075985')}
                >
                  Edit
                </button>
                <button
                  onClick={()=>handleDeleteTV(id)}
                  style={pillBtn('#fee2e2','#991b1b')}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {tvs.length === 0 && (
          <div style={emptyBox}>
            No TVs yet. Add one to begin.
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const topBtnStyle = (bg) => ({
  background:bg,
  color:'#fff',
  border:'none',
  borderRadius:10,
  padding:'10px 18px',
  display:'flex',
  alignItems:'center',
  gap:8,
  cursor:'pointer',
  fontWeight:600,
  fontSize:14
});

const cardStyle = {
  background:'#fff',
  borderRadius:16,
  padding:18,
  boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
  display:'flex',
  flexDirection:'column'
};

const pillBtn = (bg,color) => ({
  background:bg,
  color,
  border:'none',
  borderRadius:30,
  padding:'6px 12px',
  fontSize:12,
  fontWeight:500,
  display:'flex',
  alignItems:'center',
  gap:6,
  cursor:'pointer'
});

const emptyBox = {
  gridColumn:'1 / -1',
  background:'#fff',
  padding:40,
  borderRadius:16,
  textAlign:'center',
  color:'#64748b',
  fontSize:14,
  boxShadow:'0 2px 8px rgba(0,0,0,0.06)'
};
