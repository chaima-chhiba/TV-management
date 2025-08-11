import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import contentService from '../services/contentService';
import ContentForm from '../components/ContentForm';
import ContentCard from '../components/ContentCard';

export default function ContentLibrary() {
  const [content, setContent] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    contentService.getAll()
      .then(setContent)
      .finally(()=>setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateOrUpdate = async (data) => {
  try {
    setSaving(true);
    if (editing) {
      await contentService.update(editing._id || editing.id, data);
    } else {
      await contentService.create(data);
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
    if (!window.confirm('Delete this content item?')) return;
    try {
      await contentService.remove(id);
      setContent(prev => prev.filter(c => (c._id || c.id) !== id));
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  return (
    <div style={{maxWidth:1300, margin:'0 auto', padding:'2.5rem 2rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:700, color:'#1e293b'}}>Content Library</h2>
        <button
          onClick={()=>{ setShowForm(true); setEditing(null); }}
          style={{
            background:'#2563eb',
            color:'#fff',
            border:'none',
            borderRadius:12,
            padding:'12px 22px',
            display:'flex',
            gap:8,
            fontWeight:600,
            cursor:'pointer',
            fontSize:15
          }}
        >
          <Plus size={18}/> Add Content
        </button>
      </div>

      {showForm && (
        <ContentForm
          initial={editing}
          onSubmit={handleCreateOrUpdate}
            onCancel={()=>{ setShowForm(false); setEditing(null); }}
          submitting={saving}
        />
      )}

      {!showForm && (
        <>
          {loading && <div style={{padding:24}}>Loading content...</div>}
          {!loading && content.length === 0 && (
            <div style={{
              background:'#fff',
              padding:40,
              borderRadius:16,
              textAlign:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{fontSize:48}}>🗂️</div>
              <h3 style={{margin:'12px 0 4px', fontSize:20, fontWeight:600, color:'#334155'}}>No content yet</h3>
              <p style={{margin:0, color:'#64748b'}}>Click "Add Content" to create your first item.</p>
            </div>
          )}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',
            gap:24,
            marginTop:content.length?24:0
          }}>
            {content.map(item=>(
              <div key={item._id || item.id} style={{position:'relative'}}>
                <ContentCard
                  item={{
                    ...item,
                    id: item._id || item.id
                  }}
                  onDelete={()=>handleDelete(item._id || item.id)}
                />
                <div style={{
                  position:'absolute',
                  top:10,
                  right:10,
                  display:'flex',
                  gap:8
                }}>
                  <button
                    onClick={()=>{ setEditing(item); setShowForm(true); }}
                    style={{
                      background:'#e0e7ff',
                      color:'#3730a3',
                      border:'none',
                      borderRadius:8,
                      padding:'6px 10px',
                      fontSize:12,
                      cursor:'pointer',
                      fontWeight:500
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={()=>handleDelete(item._id || item.id)}
                    style={{
                      background:'#fee2e2',
                      color:'#b91c1c',
                      border:'none',
                      borderRadius:8,
                      padding:'6px 10px',
                      fontSize:12,
                      cursor:'pointer',
                      fontWeight:500,
                      display:'flex',
                      alignItems:'center',
                      gap:4
                    }}
                  >
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