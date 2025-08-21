import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, FileText, Video, Save, X } from 'lucide-react';
import tvService from '../services/tvService';

const typeOptions = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video }
];

export default function ContentForm({ initial, onSubmit, onCancel, submitting }) {
  const [tvs, setTvs] = useState([]);
  const [mediaList, setMediaList] = useState([]); // [{ name, preview, fileBase64, fileMime, url }]
  const [errors, setErrors] = useState({}); // ADD: validation errors

  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    type: initial?.type || 'text',
    url: initial?.url || '',
    textContent: initial?.content || '',
    // CHANGED: default to empty (Auto)
    layout: initial?.layout || 'auto', // default to Auto
    tv: initial?.tv?._id || initial?.tv || '',
    fileBase64: initial?.mediaDataUrl ? initial.mediaDataUrl.split(',')[1] : '',
    fileMime: initial?.mediaDataUrl ? initial.mediaDataUrl.match(/^data:(.*?);/)[1] : '',
    scheduleEnabled: true,
    daysOfWeek: [0,1,2,3,4,5,6],
    startTime: '00:00',
    endTime: '23:59',
    startDate: '',
    endDate: ''
  }));

  useEffect(() => {
    tvService.getTVs().then(setTvs).catch(console.error);
  }, []);

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

  // NEW: handle multiple file selection
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        const mime = result.match(/^data:(.*?);/)[1];
        setMediaList(prev => [
          ...prev,
          { name: file.name, preview: result, fileBase64: base64, fileMime: mime, url: '' }
        ]);
        setForm(p => ({ ...p, fileBase64: '', fileMime: '', url: '' }));
        setErrors(prev => ({ ...prev, media: undefined })); // clear media error
      };
      reader.readAsDataURL(file);
    });
  };

  // Keep single-file setter for backward compatibility, but prefer multi
  const handleFile = (file) => {
    if (!file) {
      setForm(p => ({ ...p, fileBase64: '', fileMime: '', url: '' }));
      return;
    }
    // if user picks a single file via the main input, route to multi list too
    handleFiles([file]);
  };

  // NEW: add URL as another media item
  const addUrlItem = () => {
    const u = (form.url || '').trim();
    if (!u) return;
    setMediaList(prev => [
      ...prev,
      { name: u.split('/').pop() || 'URL', preview: u, fileBase64: '', fileMime: '', url: u }
    ]);
    setForm(p => ({ ...p, url: '', fileBase64: '', fileMime: '' }));
    setErrors(prev => ({ ...prev, media: undefined })); // clear media error
  };

  const removeMediaAt = (idx) => {
    setMediaList(prev => prev.filter((_, i) => i !== idx));
  };

  // UPDATED: submit always requires TV + schedule
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate TV
    if (!form.tv) {
      alert('Select a target TV (scheduling is required).');
      return;
    }

    // Validate media when type is image/video
    if (form.type !== 'text') {
      const hasMedia = mediaList.length > 0 || !!form.fileBase64 || !!form.url;
      if (!hasMedia) {
        setErrors(prev => ({ ...prev, media: `Please add at least one ${form.type}.` }));
        return;
      }
    }

    const common = {
      description: form.description.trim(),
      type: form.type,
      // Only send layout if user chose one; blank means Auto (Display decides)
      layout: form.layout || 'auto', // ensure a value is sent
      tv: form.tv || null,
      content: form.type === 'text' ? form.textContent.trim() : undefined,
      schedule: {
        enabled: true,
        daysOfWeek: form.daysOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      }
    };

    // Single text OR no multi-media selected -> fallback to single payload
    if (form.type === 'text' || mediaList.length === 0) {
      const payload = {
        ...common,
        title: form.title.trim(),
        url: form.type !== 'text' && !form.fileBase64 ? (form.url ? form.url.trim() : undefined) : undefined,
        fileBase64: form.fileBase64 || undefined,
        fileMime: form.fileBase64 ? form.fileMime : undefined
      };
      await onSubmit(payload);
      return;
    }

    // Multi-create: one payload per media item
    const baseTitle = form.title.trim();
    for (let i = 0; i < mediaList.length; i++) {
      const m = mediaList[i];
      const title =
        baseTitle
          ? (mediaList.length > 1 ? `${baseTitle} ${i + 1}` : baseTitle)
          : (m.name || `${form.type} ${i + 1}`);

      const payload = {
        ...common,
        title,
        url: m.url || undefined,
        fileBase64: m.fileBase64 || undefined,
        fileMime: m.fileMime || undefined
      };
      // onSubmit may return a promise; await to avoid overloading backend
      // eslint-disable-next-line no-await-in-loop
      await onSubmit(payload);
    }
    // Optional: close modal after bulk
    // onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} style={formWrapperStyle}>
      <div style={headerRowStyle}>
        <h3 style={titleStyle}>{initial ? 'Edit Content' : 'Add New Content'}</h3>
        <button type="button" onClick={onCancel} style={iconBtnStyle('#e2e8f0', '#334155')}>
          <X size={18} />
        </button>
      </div>

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

        <Field label="Layout">
          <select
            value={form.layout}
            onChange={e => setForm(p => ({ ...p, layout: e.target.value }))}
            style={inputStyle}
          >
            <option value="auto">Auto (Display decides)</option>
            <option value="fullscreen">Full Screen</option>
            <option value="split2">2 Split</option>
            <option value="split4">4 Split</option>
          </select>
          <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>
            Leave as Auto to let the Display choose layout dynamically.
          </div>
        </Field>

        <Field label="Target TV">
          <select
            value={form.tv}
            onChange={e => handleChange('tv', e.target.value)}
            style={inputStyle}
            required
          >
            <option value="" disabled>Select TV</option>
            {tvs.map(tv => (
              <option key={tv._id || tv.id} value={tv._id || tv.id}>
                {tv.name || tv.tvId || 'TV'}
              </option>
            ))}
          </select>
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
            accept={form.type === 'image' ? 'image/*' : 'video/*'}
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
              {mediaList.map((m, idx) => (
                <div key={idx} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:8, background:'#fff' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#334155', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {m.name}
                  </div>
                  <div style={{ height:120, borderRadius:8, overflow:'hidden', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6 }}>
                    {form.type === 'image' && (
                      <img src={m.preview || m.url} alt={m.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    )}
                    {form.type === 'video' && (
                      <video src={m.preview || m.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted />
                    )}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <small style={{ color:'#64748b' }}>{m.fileMime || 'URL'}</small>
                    <button type="button" onClick={() => removeMediaAt(idx)} style={iconBtnStyle('#fee2e2', '#b91c1c')}>✕</button>
                  </div>
                </div>
              ))}
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

      {/* Always show schedule editor (since required) */}
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
    <label style={fieldStyle}>
      <span>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </span>
      {children}
    </label>
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