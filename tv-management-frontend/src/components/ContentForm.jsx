import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, FileText, Video, Save, X } from 'lucide-react';
import tvService from '../services/tvService';

const typeOptions = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video }
];

// local unique id for new assets (for React keys)
const makeTempId = () =>
  `tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export default function ContentForm({ initial, onSubmit, onCancel, submitting }) {
  const [tvs, setTvs] = useState([]);
  const [mediaList, setMediaList] = useState([]);       // [{ _id?, name, preview, fileBase64, fileMime, url, filePath, type }]
  const [removedAssetIds, setRemovedAssetIds] = useState([]); // track deletions
  const [errors, setErrors] = useState({}); // ADD: validation errors

  // NEW: detect edit mode
  const isEditing = !!(initial && (initial._id || initial.id));
  const [tvQuery, setTvQuery] = useState('');
  // ADD: dropdown open/close + outside click
  const [tvDropdownOpen, setTvDropdownOpen] = useState(false);
  const tvDropdownRef = React.useRef(null);

  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    type: initial?.type || 'text',
    url: initial?.url || '',
    textContent: initial?.content || '',
    layout: initial?.layout || 'auto',
    tv: initial?.tv?._id || initial?.tv || '',
    // CHANGED: preselect current TV in edit, empty in create
    tvsSelected: (initial?.tvs && initial.tvs.length)
      ? initial.tvs.map(t => String(t?._id || t))
      : (initial?.tv ? [String(initial.tv?._id || initial.tv)] : []),
    fileBase64: initial?.mediaDataUrl ? initial.mediaDataUrl.split(',')[1] : '',
    fileMime: initial?.mediaDataUrl ? initial.mediaDataUrl.match(/^data:(.*?);/)[1] : '',
    // schedule state kept for create; hidden during edit
    scheduleEnabled: true,
    daysOfWeek: initial?.schedule?.daysOfWeek || [0,1,2,3,4,5,6],
    startTime: initial?.schedule?.startTime || '00:00',
    endTime: initial?.schedule?.endTime || '23:59',
    startDate: initial?.schedule?.startDate ? initial.schedule.startDate.slice(0,10) : '',
    endDate: initial?.schedule?.endDate ? initial.schedule.endDate.slice(0,10) : ''
  }));

  useEffect(() => {
    tvService.getTVs().then(setTvs).catch(console.error);
  }, []);

  // CLOSE on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!tvDropdownOpen) return;
      if (tvDropdownRef.current && !tvDropdownRef.current.contains(e.target)) {
        setTvDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [tvDropdownOpen]);

  const filteredTVs = React.useMemo(() => {
    const q = tvQuery.trim().toLowerCase();
    if (!q) return tvs;
    return tvs.filter(tv => {
      const name = (tv.name || '').toLowerCase();
      const dept = (tv.department || '').toLowerCase();
      const id = String(tv._id || tv.id || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || id.includes(q);
    });
  }, [tvs, tvQuery]);

  const toggleTVSelection = (id) => {
    const key = String(id);
    setForm(prev => {
      const set = new Set(prev.tvsSelected.map(String));
      set.has(key) ? set.delete(key) : set.add(key);
      return { ...prev, tvsSelected: Array.from(set) };
    });
  };

  const selectAllFiltered = () => {
    setForm(prev => {
      const set = new Set(prev.tvsSelected.map(String));
      filteredTVs.forEach(tv => set.add(String(tv._id || tv.id)));
      return { ...prev, tvsSelected: Array.from(set) };
    });
  };

  const clearAllSelected = () => {
    setForm(prev => ({ ...prev, tvsSelected: [] }));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (d) => {
    setForm(prev => {
      const set = new Set(prev.daysOfWeek);
      set.has(d) ? set.delete(d) : set.add(d);
      return { ...prev, daysOfWeek: Array.from(set).sort((a,b)=>a-b) };
    });
  };

  // Build a preview URL for an asset/item from server fields
  const API_BASE = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
  function getAssetPreview(a) {
    if (!a) return '';
    if (a.mediaDataUrl) return a.mediaDataUrl;
    if (a.filePath) return `${API_BASE}/${String(a.filePath).replace(/^\/+/, '')}`;
    if (a.url) return a.url;
    if (a.media?.contentType && a.media?.data) {
      const mime = a.media.contentType;
      const data = a.media.data;
      if (typeof data === 'string') return `data:${mime};base64,${data}`;
      const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : null);
      if (arr) {
        const bytes = new Uint8Array(arr);
        let binary = ''; const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return `data:${mime};base64,${btoa(binary)}`;
      }
    }
    return '';
  };

  // Preload existing assets on edit (keep _id so we can target deletions)
  React.useEffect(() => {
    if (!isEditing) return;
    const list = [];
    if (Array.isArray(initial?.assets) && initial.assets.length) {
      for (const a of initial.assets) {
        list.push({
          _id: a._id, // server id
          __tempId: a._id ? undefined : makeTempId(),
          name: a.title || (a.url ? a.url.split('/').pop() : (a.type || '').toUpperCase()),
          preview: getAssetPreview(a),
          fileBase64: '', fileMime: '',
          url: a.url || '',
          filePath: a.filePath || '',
          type: a.type || initial.type || 'image'
        });
      }
    } else {
      const preview = getAssetPreview(initial);
      if (preview) {
        list.push({
          _id: undefined,
          __tempId: makeTempId(),
          name: initial.title || 'Media',
          preview,
          fileBase64: '', fileMime: '',
          url: initial.url || '',
          filePath: initial.filePath || '',
          type: initial.type || 'image'
        });
      }
    }
    setMediaList(list);
    setRemovedAssetIds([]); // reset removals when initial changes
  }, [isEditing, initial]);

  // Stable key for list items (_id from DB or __tempId for new)
  const itemKey = (m) => String(m?._id || m?.__tempId);

  // Remove by key (not index)
  const removeMediaByKey = (key) => {
    setMediaList(prev => {
      const it = prev.find(x => itemKey(x) === String(key));
      if (it?._id) {
        setRemovedAssetIds(ids => [...ids, String(it._id)]);
      }
      return prev.filter(x => itemKey(x) !== String(key));
    });
  };

  // Add selected files (keep per-item type)
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        const mime = result.match(/^data:(.*?);/)[1];
        const t = mime.startsWith('video/') ? 'video' : (mime.startsWith('image/') ? 'image' : 'image');
        setMediaList(prev => ([
          ...prev,
          { _id: undefined, __tempId: makeTempId(), name: file.name, preview: result, fileBase64: base64, fileMime: mime, url: '', filePath: '', type: t }
        ]));
      };
      reader.readAsDataURL(file);
    });
  };

  // Add current URL input as an asset
  const addUrlItem = () => {
    const u = (form.url || '').trim();
    if (!u) return;
    setMediaList(prev => ([
      ...prev,
      { _id: undefined, __tempId: makeTempId(), name: u.split('/').pop() || u, preview: '', fileBase64: '', fileMime: '', url: u, filePath: '', type: form.type }
    ]));
    setForm(p => ({ ...p, url: '' }));
  };

  // UPDATED: submit as one content with assets[]
  const handleSubmit = async (e) => {
    e.preventDefault();
    const tvsPayload = (form.tvsSelected || []).map(String);
    if (tvsPayload.length === 0) {
      alert('Select at least one target TV.');
      return;
    }

    // Build only NEW assets to add (items without _id)
    const addAssets = form.type === 'text' ? [] : mediaList
      .filter(m => !m._id) // only new items
      .map(m => {
        const t = m.type || (m.fileMime?.startsWith('video/') ? 'video' : (m.fileMime?.startsWith('image/') ? 'image' : form.type));
        const a = { type: t, title: m.name || '', duration: 8 };
        if (m.fileBase64 && m.fileMime) { a.fileBase64 = m.fileBase64; a.fileMime = m.fileMime; }
        else if (m.url) { a.url = m.url; }
        else if (m.filePath) { a.filePath = m.filePath; }
        return a;
      });

    const payloadBase = {
      description: form.description?.trim(),
      type: form.type,
      layout: form.type === 'text' ? 'auto' : (form.layout || 'auto'),
      content: form.type === 'text' ? form.textContent?.trim() : undefined,
      title: form.title?.trim(),
      tvs: tvsPayload
    };

    if (isEditing) {
      const patch = {};
      if (removedAssetIds.length) patch.removeIds = removedAssetIds;
      if (addAssets.length) patch.add = addAssets;

      const payload = { ...payloadBase };
      if (Object.keys(patch).length) payload.assetsPatch = patch; // send patch only
      await onSubmit(payload);
      return;
    }

    // create
    const schedule = {
      enabled: true,
      daysOfWeek: form.daysOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined
    };

    await onSubmit({
      ...payloadBase,
      assets: addAssets, // all items are "new" on create
      schedule
    });
  };

  return (
    <form onSubmit={handleSubmit} style={formWrapperStyle}>
      <div style={headerRowStyle}>
        <h3 style={titleStyle}>{initial ? 'Edit Content' : 'Add New Content'}</h3>
        <button type="button" onClick={onCancel} style={iconBtnStyle('#e2e8f0', '#334155')}>
          <X size={18} />
        </button>
      </div>

      {/* Optional info banner during edit */}
      {isEditing && (
        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', fontSize: 13, fontWeight: 600 }}>
          Schedule is managed separately. This edit will not change the schedule.
        </div>
      )}

      <div style={gridStyle}>
        <Field label="Title" required>
          <input
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            style={inputStyle}
            placeholder="Title"
            required
          />
        </Field>

        <Field label="Type" required>
          <div style={{ display: 'flex', gap: 8 }}>
            {typeOptions.map(opt => {
              const active = form.type === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleChange('type', opt.value)}
                  style={{
                    ...typeBtnBase,
                    border: '1px solid ' + (active ? '#2563eb' : '#e2e8f0'),
                    background: active ? '#2563eb' : '#f8fafc',
                    color: active ? '#fff' : '#334155'
                  }}
                >
                  <Icon size={20} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* HIDE layout when type is text */}
        {form.type !== 'text' && (
          <Field label="Layout">
            <select
              value={form.layout}
              onChange={e => setForm(p => ({ ...p, layout: e.target.value }))}
              style={inputStyle}
            >
              <option value="auto">Auto</option>
              <option value="fullscreen">Full Screen</option>
              <option value="split2">2 Split</option>
              <option value="split4">4 Split</option>
            </select>
          </Field>
        )}

        {/* Target TV(s): use the dropdown for both create and edit */}
        <Field label="Target TV(s)">
          <div ref={tvDropdownRef} style={{ position:'relative' }}>
            <button
              type="button"
              onClick={() => setTvDropdownOpen(o => !o)}
              style={{ ...inputStyle, width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
              aria-haspopup="listbox"
              aria-expanded={tvDropdownOpen}
            >
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {form.tvsSelected.length === 0 ? 'Select TVs' : `${form.tvsSelected.length} selected`}
              </span>
              <span style={{ marginLeft:8, opacity:.7 }}>▾</span>
            </button>

            {tvDropdownOpen && (
              <div style={ddMenu}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                  <input
                    value={tvQuery}
                    onChange={e => setTvQuery(e.target.value)}
                    style={{ ...inputStyle, flex:1 }}
                    placeholder="Search TVs by name, department or id..."
                  />
                </div>
                <div style={ddActions}>
                  <button type="button" onClick={selectAllFiltered} style={miniBtnAlt}>Select all</button>
                  <button type="button" onClick={clearAllSelected} style={miniBtn}>Clear</button>
                </div>

                <div style={ddScroll}>
                  {filteredTVs.map(tv => {
                    const id = tv._id || tv.id;
                    const selected = form.tvsSelected.map(String).includes(String(id));
                    return (
                      <label key={id} style={ddItem} role="option" aria-selected={selected}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleTVSelection(id)}
                          style={{ marginRight:10 }}
                        />
                        <span style={{
                          width:8, height:8, borderRadius:'50%',
                          background: tv.status === 'online' ? '#16a34a' : '#dc2626',
                          marginRight:8, flex:'0 0 auto'
                        }}/>
                        <div style={{ overflow:'hidden' }}>
                          <div style={{ fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {tv.name || tv.tvId || 'TV'}
                          </div>
                          {tv.department && (
                            <div style={{ fontSize:12, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {tv.department}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                  {filteredTVs.length === 0 && (
                    <div style={{ fontSize:12, color:'#64748b', padding:'8px 2px' }}>No TVs match your search.</div>
                  )}
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:10 }}>
                  <button type="button" onClick={() => setTvDropdownOpen(false)} style={miniBtn}>Done</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize:12, color:'#475569', marginTop:6 }}>
            Selected: <b>{form.tvsSelected.length}</b>
          </div>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
          placeholder="Optional description"
        />
      </Field>

      {form.type === 'text' && (
        <Field label="Text Content" required>
          <textarea
            value={form.textContent}
            onChange={e => handleChange('textContent', e.target.value)}
            style={{ ...inputStyle, minHeight: 120, fontFamily: 'inherit' }}
            placeholder="Enter the text to display"
            required
          />
        </Field>
      )}

      {form.type !== 'text' && (
        <Field label={form.type === 'image' ? 'Images (multiple) or URLs' : 'Videos (multiple) or URLs'}>
          {/* NEW: multiple file input */}
          <input
            type="file"
            accept={form.type === 'video' ? 'video/*' : 'image/*'}
            multiple
            onChange={e => handleFiles(e.target.files)}
            style={{ marginBottom: 8 }}
          />
          {/* URL adder */}
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <input
              value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Add external URL and click +"
            />
            <button type="button" onClick={addUrlItem} style={{ ...buttonStyle('#f1f5f9', '#334155'), minWidth: 44, padding: '10px 12px' }}>+</button>
          </div>

          {/* NEW: show selected items list */}
          {mediaList.length > 0 && (
            <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))' }}>
              {mediaList.map((m) => {
                const key = itemKey(m);
                const itemType =
                  m.type ||
                  (m.fileMime?.startsWith?.('video/') ? 'video' :
                   m.fileMime?.startsWith?.('image/') ? 'image' : form.type);
                const src = m.preview || getAssetPreview({ filePath: m.filePath, url: m.url });

                return (
                  <div key={key} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:8, background:'#fff' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#334155', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {m.name}
                    </div>
                    <div style={{ height:120, borderRadius:8, overflow:'hidden', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6 }}>
                      {itemType === 'image' && src && (
                        <img src={src} alt={m.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      )}
                      {itemType === 'video' && src && (
                        <video src={src} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted />
                      )}
                      {!src && <div style={{ color:'#94a3b8', fontSize:12 }}>No media</div>}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <small style={{ color:'#64748b' }}>
                        {m.fileMime || (m.filePath ? 'file' : (m.url ? 'URL' : ''))}
                      </small>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMediaByKey(key); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        style={{ background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legacy single preview (if user didn’t add to mediaList) */}
          {mediaList.length === 0 && (form.fileBase64 || form.url) && (
            <small style={{ color: '#64748b' }}>
              {form.fileBase64 ? 'Using embedded file.' : 'Using external URL.'}
            </small>
          )}

          {errors.media && (
            <div style={{ color:'#b91c1c', fontSize:12, marginTop:6 }}>
              {errors.media}
            </div>
          )}
        </Field>
      )}

      {/* Schedule: show only on create */}
      {!isEditing && (
        <>
          <Field label="Days of week">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((lbl, idx) => {
                const active = form.daysOfWeek.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      padding:'6px 10px',
                      borderRadius:8,
                      border:'1px solid ' + (active ? '#2563eb' : '#cbd5e1'),
                      background: active ? '#2563eb' : '#fff',
                      color: active ? '#fff' : '#334155',
                      fontSize:12,
                      fontWeight:600
                    }}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Time window (local time)">
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="time" value={form.startTime} onChange={e=>handleChange('startTime', e.target.value)} style={inputStyle} />
                <button type="button" onClick={() => handleChange('startTime', nowHHMM())} style={miniBtn}>Now</button>
              </div>
              <span style={{ alignSelf:'center', color:'#64748b' }}>to</span>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="time" value={form.endTime} onChange={e=>handleChange('endTime', e.target.value)} style={inputStyle} />
                <button type="button" onClick={() => handleChange('endTime', nowHHMM())} style={miniBtn}>Now</button>
              </div>
              <button
                type="button"
                onClick={() => { handleChange('startTime', nowHHMM()); handleChange('endTime', '23:59'); }}
                style={miniBtnAlt}
              >
                Start now → 23:59
              </button>
            </div>
          </Field>

          <Field label="Date range (optional)">
            <div style={{ display:'flex', gap:10 }}>
              <input type="date" value={form.startDate} onChange={e=>handleChange('startDate', e.target.value)} style={inputStyle} />
              <span style={{ alignSelf:'center', color:'#64748b' }}>to</span>
              <input type="date" value={form.endDate} onChange={e=>handleChange('endDate', e.target.value)} style={inputStyle} />
            </div>
          </Field>
        </>
      )}

      <div style={previewBoxStyle}>
        <div style={previewLabelStyle}>Preview</div>
        {form.type === 'text' && form.textContent && (
          <div style={textPreviewStyle}>{form.textContent}</div>
        )}
        {form.type === 'image' && (form.fileBase64 || form.url) && (
          <img
            src={
              form.fileBase64
                ? `data:${form.fileMime};base64,${form.fileBase64}`
                : form.url
            }
            alt="preview"
            style={mediaPreviewImageStyle}
            onError={e => { e.currentTarget.style.opacity = '0.4'; }}
          />
        )}
        {form.type === 'video' && (form.fileBase64 || form.url) && (
          <video
            src={
              form.fileBase64
                ? `data:${form.fileMime};base64,${form.fileBase64}`
                : form.url
            }
            style={mediaPreviewVideoStyle}
            controls
          />
        )}
        {form.type !== 'text' && !form.fileBase64 && !form.url && (
          <div style={emptyPreviewNoteStyle}>
            Select a file or enter a URL to preview.
          </div>
        )}
      </div>

      <div style={actionsRowStyle}>
        <button
          type="button"
            onClick={onCancel}
          style={buttonStyle('#f1f5f9', '#334155')}
        >
          <X size={16} /> Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={buttonStyle('#2563eb', '#fff')}
        >
          <Save size={16} />
          {submitting ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

/* Field wrapper */
function Field({ label, required, children }) {
  return (
    <div style={fieldStyle}>
      <div>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </div>
      {children}
    </div>
  );
}

/* Styles */
const formWrapperStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle = { margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' };

const gridStyle = {
  display: 'grid',
  gap: 18,
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))'
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  fontWeight: 500,
  color: '#334155'
};

const inputStyle = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit'
};

const typeBtnBase = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '10px 8px',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  border: '1px solid #e2e8f0',
  background: '#f8fafc'
};

const iconBtnStyle = (bg, color) => ({
  background: bg,
  color,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  cursor: 'pointer'
});

const previewBoxStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 16,
  background: '#f8fafc'
};

const previewLabelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 8
};

const textPreviewStyle = {
  padding: 16,
  borderRadius: 8,
  background: 'linear-gradient(135deg,#e0f2fe,#ede9fe)',
  color: '#1e293b',
  fontSize: 14,
  lineHeight: 1.4
};

const mediaPreviewImageStyle = {
  maxWidth: '100%',
  borderRadius: 8,
  border: '1px solid #cbd5e1'
};

const mediaPreviewVideoStyle = {
  maxWidth: '100%',
  borderRadius: 8
};

const emptyPreviewNoteStyle = { fontSize: 13, color: '#64748b' };

const actionsRowStyle = {
  display: 'flex',
  gap: 12,
  justifyContent: 'flex-end'
};

const buttonStyle = (bg, color) => ({
  background: bg,
  color,
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  minWidth: 120
});

// NEW: helpers for "Now" buttons in schedule section
const miniBtn = {
  padding:'6px 10px',
  borderRadius:8,
  border:'1px solid #cbd5e1',
  background:'#f8fafc',
  color:'#334155',
  fontSize:12,
  fontWeight:700,
  cursor:'pointer'
};

const miniBtnAlt = {
  ...miniBtn,
  background:'#eef2ff',
  border:'1px solid #c7d2fe',
  color:'#3730a3'
};

const nowHHMM = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
};

const tvGrid = {
  display:'grid',
  gap:8,
  gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))'
};

const tvChipBase = {
  display:'flex',
  alignItems:'center',
  gap:8,
  padding:'10px 12px',
  borderRadius:10,
  border:'1px solid #cbd5e1',
  background:'#fff',
  color:'#0f172a',
  cursor:'pointer',
  textAlign:'left',
  minWidth:0
};

const tvChipSelected = {
  border:'1px solid #2563eb',
  background:'#eff6ff',
  boxShadow:'inset 0 0 0 1px #2563eb'
};

const tvBadge = {
  display:'inline-flex',
  alignItems:'center',
  gap:6,
  padding:'4px 8px',
  borderRadius:999,
  background:'#eef2ff',
  border:'1px solid #c7d2fe',
  color:'#3730a3',
  fontSize:12,
  fontWeight:700
};

const tvBadgeX = {
  marginLeft:2,
  border:'none',
  background:'transparent',
  color:'#3730a3',
  cursor:'pointer',
  fontSize:14,
  lineHeight:1
};

const ddMenu = {
  position:'absolute',
  top:'calc(100% + 6px)',
  left:0,
  right:0,
  zIndex:50,
  background:'#fff',
  border:'1px solid #e2e8f0',
  borderRadius:12,
  boxShadow:'0 12px 28px rgba(0,0,0,.12)',
  padding:10
};

const ddActions = {
  display:'flex',
  gap:8,
  justifyContent:'flex-start',
  marginBottom:8
};

const ddScroll = {
  maxHeight: 280,
  overflowY:'auto',
  border:'1px solid #e2e8f0',
  borderRadius:10,
  padding:6
};

const ddItem = {
  display:'flex',
  alignItems:'center',
  gap:8,
  padding:'8px 6px',
  borderRadius:8,
  cursor:'pointer'
};