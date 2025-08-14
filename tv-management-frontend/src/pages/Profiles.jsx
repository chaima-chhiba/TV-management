import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import profileService from '../services/profileService';
import ProfileForm from '../components/ProfileForm';
import ProfileCard from '../components/ProfileCard';

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    profileService.getAll()
      .then(setProfiles)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreateOrUpdate = async (data) => {
    try {
      setSaving(true);
      if (editing) {
        await profileService.update(editing._id || editing.id, data);
      } else {
        await profileService.create(data);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this profile?')) return;
    try {
      await profileService.remove(id);
      setProfiles(prev => prev.filter(p => (p._id || p.id) !== id));
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  return (
    <div style={{maxWidth:1300, margin:'0 auto', padding:'2.5rem 2rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:700, color:'#1e293b'}}>Profiles</h2>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:12, padding:'12px 22px', display:'flex', gap:8, fontWeight:600, cursor:'pointer', fontSize:15 }}
          >
            <Plus size={18}/> Add Profile
          </button>
        )}
      </div>

      {showForm && (
        <ProfileForm
          initial={editing}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          submitting={saving}
        />
      )}

      {!showForm && (
        <>
          {loading && <div style={{padding:24}}>Loading profiles...</div>}
          {!loading && profiles.length === 0 && (
            <div style={{ background:'#fff', padding:40, borderRadius:16, textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{fontSize:48}}>👤</div>
              <h3 style={{margin:'12px 0 4px', fontSize:20, fontWeight:600, color:'#334155'}}>No profiles yet</h3>
              <p style={{margin:0, color:'#64748b'}}>Click "Add Profile" to create one.</p>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24, marginTop: profiles.length ? 24 : 0 }}>
            {profiles.map(item => (
              <div key={item._id || item.id} style={{ position:'relative' }}>
                <ProfileCard
                  item={{ ...item, id: item._id || item.id }}
                  onEdit={(p) => { setEditing(p); setShowForm(true); }}
                  onDelete={handleDelete}
                />
                <div style={{ position:'absolute', top:10, right:10, display:'flex', gap:8 }}>
                  <button onClick={() => { setEditing(item); setShowForm(true); }} style={{ background:'#e0e7ff', color:'#3730a3', border:'none', borderRadius:8, padding:'6px 10px', fontSize:12, cursor:'pointer', fontWeight:500 }}>Edit</button>
                  <button onClick={() => handleDelete(item._id || item.id)} style={{ background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:8, padding:'6px 10px', fontSize:12, cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                    <Trash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}