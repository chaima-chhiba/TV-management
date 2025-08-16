import React, { useEffect, useState, useMemo } from 'react';
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

  // NEW: search + pagination state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // NEW: preview modal state
  const [previewItem, setPreviewItem] = useState(null);

  const load = () => {
    setLoading(true);
    contentService.getAll()
      .then(setContent)
      .finally(()=>setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Reset to page 1 when search or list changes
  useEffect(() => { setPage(1); }, [search, content.length]);

  // NEW: memoized filtered + paged items
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return content;
    return content.filter(c => {
      const s = [
        c.title, c.description, c.type, c.layout,
        c.content, c.url
      ].filter(Boolean).join(' ').toLowerCase();
      return s.includes(q);
    });
  }, [content, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

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
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:700, color:'#1e293b'}}>Content Library</h2>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          {/* Search input */}
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search content..."
            style={{
              border:'1px solid #cbd5e1', borderRadius:12, padding:'10px 12px',
              fontSize:14, width:240
            }}
          />
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
      </div>

      {/* Results summary */}
      {!showForm && (
        <div style={{fontSize:12, color:'#64748b', marginBottom:8}}>
          {loading ? 'Loading...' : `${filtered.length} result(s)`}{search ? ` for "${search}"` : ''}
        </div>
      )}

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
          {!loading && filtered.length === 0 && (
            <div style={{
              background:'#fff',
              padding:40,
              borderRadius:16,
              textAlign:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{fontSize:48}}>🗂️</div>
              <h3 style={{margin:'12px 0 4px', fontSize:20, fontWeight:600, color:'#334155'}}>No content found</h3>
              <p style={{margin:0, color:'#64748b'}}>Try a different search or add content.</p>
            </div>
          )}

          {/* Grid with consistent cards */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',
            gap:24,
            marginTop:filtered.length?16:0
          }}>
            {pageItems.map(item=>(
              <div key={item._id || item.id} style={{position:'relative'}}>
                <ContentCard
                  item={{ ...item, id: item._id || item.id }}
                  onDelete={()=>handleDelete(item._id || item.id)}
                  onPreview={()=>setPreviewItem(item)}
                />
                {/* Keep your existing edit/delete overlay if desired */}
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

          {/* Pagination */}
          {filtered.length > 0 && (
            <div style={{
              display:'flex', justifyContent:'center', alignItems:'center',
              gap:6, marginTop:24
            }}>
              <button
                onClick={()=>setPage(p=>Math.max(1, p-1))}
                disabled={page===1}
                style={pagerBtn(page===1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({length:totalPages}).map((_,i)=>(
                <button
                  key={i}
                  onClick={()=>setPage(i+1)}
                  style={page===i+1 ? pagerActive : pagerNormal}
                >
                  {i+1}
                </button>
              ))}
              <button
                onClick={()=>setPage(p=>Math.min(totalPages, p+1))}
                disabled={page===totalPages}
                style={pagerBtn(page===totalPages)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={()=>setPreviewItem(null)}
        />
      )}
    </div>
  );
}

// Simple button styles for pager
const pagerBtn = (disabled) => ({
  background: disabled ? '#e5e7eb' : '#f3f4f6',
  color: '#374151',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '8px 12px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600
});
const pagerNormal = {
  background:'#fff',
  color:'#374151',
  border:'1px solid #e5e7eb',
  borderRadius:8,
  padding:'8px 12px',
  cursor:'pointer',
  fontWeight:600
};
const pagerActive = {
  ...pagerNormal,
  background:'#2563eb',
  color:'#fff',
  borderColor:'#2563eb'
};

// Helper reused for preview
function getMediaSrc(item) {
  if (item?.mediaDataUrl) return item.mediaDataUrl;
  if (item?.filePath) return `http://localhost:5000/${item.filePath}`;
  if (item?.url) return item.url;
  if (item?.media?.data && item?.media?.contentType) {
    const mime = item.media.contentType;
    const data = item.media.data;
    if (typeof data === 'string') return `data:${mime};base64,${data}`;
    const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null;
    if (arr) {
      const bytes = new Uint8Array(arr);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return `data:${mime};base64,${btoa(binary)}`;
    }
  }
  return '';
}

// Preview Modal
function PreviewModal({ item, onClose }) {
  const src = getMediaSrc(item);
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
    }}
      onClick={onClose}
    >
      <div
        style={{
          background:'#fff', borderRadius:12, padding:16, width:'min(900px, 92vw)',
          maxHeight:'90vh', overflow:'auto', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'
        }}
        onClick={(e)=>e.stopPropagation()}
      >
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <div style={{fontSize:18, fontWeight:700, color:'#1e293b'}}>{item.title}</div>
          <button onClick={onClose} style={{
            border:'none', background:'#f1f5f9', color:'#334155', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontWeight:600
          }}>Close</button>
        </div>
        <div style={{fontSize:12, color:'#64748b', marginBottom:12}}>
          {item.type?.toUpperCase()} • {item.layout || '-'}
        </div>
        {item.type === 'text' && (
          <div style={{whiteSpace:'pre-wrap', fontSize:16, lineHeight:1.5, color:'#111827'}}>
            {item.content || '—'}
          </div>
        )}
        {item.type === 'image' && src && (
          <img src={src} alt={item.title} style={{maxWidth:'100%', borderRadius:10}} />
        )}
        {item.type === 'video' && src && (
          <video src={src} style={{width:'100%', borderRadius:10}} controls autoPlay />
        )}
        {item.description && (
          <div style={{marginTop:12, fontSize:14, color:'#334155'}}>{item.description}</div>
        )}
      </div>
    </div>
  );
}