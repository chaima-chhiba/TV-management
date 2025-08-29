// (Minor tweak to support id/_id already done via wrapper above; kept same structure)
import React from 'react';

function apiBase() {
  return (import.meta.env?.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, '');
}

function getMediaSrc(item, asset) {
  const base = apiBase();
  // Prefer asset-level media if provided
  const srcItem = asset || item;
  if (srcItem?.mediaDataUrl) return srcItem.mediaDataUrl;
  if (srcItem?.filePath) return `${base}/${String(srcItem.filePath).replace(/^\/+/, '')}`;
  if (srcItem?.url) return srcItem.url;
  // Build data URL from Buffer-like object
  if (srcItem?.media?.data && srcItem?.media?.contentType) {
    const mime = srcItem.media.contentType;
    const data = srcItem.media.data;
    if (typeof data === 'string') {
      return `data:${mime};base64,${data}`;
    }
    // Mongoose Buffer JSON: { type:'Buffer', data:[...numbers] }
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

export default function ContentCard({ item, onDelete, onPreview }) {
  const count = Array.isArray(item.assets) ? item.assets.length : 0;
  const firstAsset = count ? item.assets[0] : null;
  const typeLabel = item.type?.toUpperCase();
  const extra = count > 1 ? ` • ${count} item(s)` : '';
  const showType = firstAsset?.type || item.type;

  return (
    <div
      style={{
        background:'#fff',
        borderRadius:16,
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
        padding:16,
        display:'flex',
        flexDirection:'column',
        gap:12,
        minHeight: 340,              // fixed card height
      }}
    >
      <div>
        <div style={{fontWeight:600, fontSize:16, color:'#1e293b', lineHeight:1.3}}>
          {item.title}
        </div>
        <div style={{fontSize:12, fontWeight:500, letterSpacing:.5, color:'#6366f1'}}>
          {typeLabel} • {item.layout || '-'}{extra}
        </div>
      </div>

      {/* Fixed-size media container */}
      <div
        style={{
          height: 160,
          borderRadius:10,
          border:'1px solid #e2e8f0',
          background:'#f8fafc',
          overflow:'hidden',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          cursor: onPreview ? 'pointer' : 'default'
        }}
        onClick={onPreview}
        title="Click to preview"
      >
        {showType === 'image' && (
          <img
            src={getMediaSrc(item, firstAsset)}
            alt={item.title}
            style={{width:'100%', height:'100%', objectFit:'cover'}}
            onError={(e)=>{ e.currentTarget.style.opacity='0.4'; }}
          />
        )}
        {showType === 'video' && (
          <video
            src={getMediaSrc(item, firstAsset)}
            style={{width:'100%', height:'100%', objectFit:'cover'}}
            muted
          />
        )}
        {showType === 'text' && (
          <div style={{padding:12, color:'#334155', fontSize:14, lineHeight:1.35, textAlign:'center'}}>
            {(item.content || firstAsset?.title || '').slice(0,160) || '—'}
          </div>
        )}
        {showType !== 'text' && !getMediaSrc(item, firstAsset) && (
          <div style={{color:'#94a3b8', fontSize:12}}>No media</div>
        )}
      </div>

      {/* Actions (Preview only to avoid duplicate Delete) */}
      <div style={{display:'flex', gap:8, marginTop:'auto'}}>
        {onPreview && (
          <button
            onClick={onPreview}
            style={{ background:'#f1f5f9', color:'#334155', border:'none', borderRadius:8, padding:'8px 10px', fontSize:12, fontWeight:600, cursor:'pointer', flex:1 }}
          >
            Preview
          </button>
        )}
      </div>
    </div>
  );
}