import React from 'react';

export default function ProfileCard({ item, onEdit, onDelete }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{fontWeight:600, fontSize:16, color:'#1e293b'}}>{item.title}</div>
        <div style={{fontSize:12, fontWeight:500, letterSpacing:.5, color:'#6366f1'}}>
          {item.type?.toUpperCase()} • {item.layout || '-'}
        </div>
      </div>

      {item.type === 'image' && (item.mediaDataUrl || item.url) && (
        <img src={item.mediaDataUrl || item.url} alt={item.title} style={{width:'100%', borderRadius:10}} />
      )}
      {item.type === 'video' && (item.mediaDataUrl || item.url) && (
        <video src={item.mediaDataUrl || item.url} style={{width:'100%', borderRadius:10}} controls />
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