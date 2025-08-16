import React from 'react';

function getMediaSrc(item) {
  if (!item) return '';
  if (item.mediaDataUrl) return item.mediaDataUrl;
  if (item.filePath) return `http://localhost:5000/${item.filePath}`;
  if (item.url) return item.url;

  const media = item.media;
  if (media?.contentType && media?.data) {
    const mime = media.contentType;
    const data = media.data;
    if (typeof data === 'string') return `data:${mime};base64,${data}`;
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

export default function ProfileCard({ item, onEdit, onDelete, onPreview }) {
  const src = getMediaSrc(item);

  return (
    <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:16, display:'flex', flexDirection:'column', gap:12, minHeight:340 }}>
      <div>
        <div style={{fontWeight:600, fontSize:16, color:'#1e293b', lineHeight:1.3}}>{item.title}</div>
        <div style={{fontSize:12, fontWeight:500, letterSpacing:.5, color:'#6366f1'}}>
          {item.type?.toUpperCase()} • {item.layout || '-'}
        </div>
      </div>

      <div
        style={{ height:160, borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', cursor: onPreview ? 'pointer' : 'default' }}
        onClick={onPreview}
        title="Click to preview"
      >
        {item.type === 'image' && src && (<img src={src} alt={item.title} style={{width:'100%', height:'100%', objectFit:'cover'}} />)}
        {item.type === 'video' && src && (<video src={src} style={{width:'100%', height:'100%', objectFit:'cover'}} muted />)}
        {item.type === 'text' && (<div style={{padding:12, color:'#334155', fontSize:14, lineHeight:1.35, textAlign:'center'}}>{item.content?.slice(0,160) || '—'}</div>)}
        {item.type !== 'text' && !src && (<div style={{color:'#94a3b8', fontSize:12}}>No media</div>)}
      </div>

      {item.description && (
        <div style={{fontSize:12, color:'#64748b', lineHeight:1.35, maxHeight:48, overflow:'hidden'}}>
          {item.description}
        </div>
      )}

      <div style={{display:'flex', gap:8, marginTop:'auto'}}>
        {onEdit && (<button onClick={() => onEdit(item)} style={pill('#e0e7ff','#3730a3')}>Edit</button>)}
        {onPreview && (<button onClick={onPreview} style={pill('#f1f5f9','#334155')}>Preview</button>)}
        <button onClick={() => onDelete(item._id || item.id)} style={pill('#fee2e2','#b91c1c')}>Delete</button>
      </div>
    </div>
  );
}

const pill = (bg,color) => ({ background:bg, color, border:'none', borderRadius:8, padding:'8px 10px', fontSize:12, fontWeight:600, cursor:'pointer' });