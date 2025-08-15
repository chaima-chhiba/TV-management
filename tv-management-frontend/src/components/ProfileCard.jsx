import React from 'react';

function getMediaSrc(item) {
  if (!item) return '';
  if (item.mediaDataUrl) return item.mediaDataUrl;            // server-built data URL
  if (item.filePath) return `http://localhost:5000/${item.filePath}`; // disk (if you ever use it)
  if (item.url) return item.url;                              // external URL

  // Build data URL from Buffer-like object if present
  const media = item.media;
  if (media?.contentType && media?.data) {
    const mime = media.contentType;
    const data = media.data;
    // Already base64 string
    if (typeof data === 'string') return `data:${mime};base64,${data}`;
    // Mongoose Buffer JSON: { type:'Buffer', data:[...numbers] } or plain array
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : null);
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

export default function ProfileCard({ item, onEdit, onDelete }) {
  const src = getMediaSrc(item);

  return (
    <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{fontWeight:600, fontSize:16, color:'#1e293b'}}>{item.title}</div>
        <div style={{fontSize:12, fontWeight:500, letterSpacing:.5, color:'#6366f1'}}>
          {item.type?.toUpperCase()} • {item.layout || '-'}
        </div>
      </div>

      {item.type === 'image' && src && (
        <img src={src} alt={item.title} style={{width:'100%', borderRadius:10}} />
      )}
      {item.type === 'video' && src && (
        <video src={src} style={{width:'100%', borderRadius:10}} controls />
      )}
      {item.type === 'text' && item.content && (
        <div style={{ background:'#f1f5f9', padding:12, borderRadius:10, fontSize:14, color:'#334155', lineHeight:1.4, maxHeight:140, overflow:'auto' }}>
          {item.content}
        </div>
      )}

      {item.description && (
        <div style={{fontSize:12, color:'#64748b'}}>
          {item.description.length > 80 ? item.description.slice(0,80)+'...' : item.description}
        </div>
      )}

      <div style={{display:'flex', gap:8}}>
        <button onClick={() => onEdit(item)} style={pill('#e0e7ff','#3730a3')}>Edit</button>
        <button onClick={() => onDelete(item._id || item.id)} style={pill('#fee2e2','#b91c1c')}>Delete</button>
      </div>
    </div>
  );
}

const pill = (bg,color) => ({
  background:bg, color, border:'none', borderRadius:8, padding:'6px 10px',
  fontSize:12, fontWeight:500, cursor:'pointer'
});