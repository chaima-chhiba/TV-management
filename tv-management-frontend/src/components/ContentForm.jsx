import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, FileText, Video, Save, X } from 'lucide-react';
import tvService from '../services/tvService';

const layoutOptions = [
  { value: 'fullscreen', label: 'Full Screen' },
  { value: 'split2', label: '2 Split' },
  { value: 'split4', label: '4 Split' }
];

const typeOptions = [
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video }
];

export default function ContentForm({ initial, onSubmit, onCancel, submitting }) {
  const [tvs, setTvs] = useState([]);

  useEffect(() => {
    tvService.getTVs().then(setTvs).catch(console.error);
  }, []);

  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    type: initial?.type || 'text',
    url: initial?.url || '',
    textContent: initial?.content || '',
    layout: initial?.layout || 'fullscreen',
    tv: initial?.tv?._id || initial?.tv || '',
    fileBase64: initial?.mediaDataUrl ? initial.mediaDataUrl.split(',')[1] : '',
    fileMime: initial?.mediaDataUrl ? initial.mediaDataUrl.match(/^data:(.*?);/)[1] : '',
    // ADD: schedule defaults
    scheduleEnabled: false,
    daysOfWeek: [0,1,2,3,4,5,6],
    startTime: '00:00',
    endTime: '23:59',
    startDate: '',
    endDate: ''
  }));

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

  const handleFile = (file) => {
    if (!file) {
      setForm(p => ({ ...p, fileBase64: '', fileMime: '', url: '' }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result; // data URL
      const base64 = result.split(',')[1];
      const mime = result.match(/^data:(.*?);/)[1];
      setForm(p => ({ ...p, fileBase64: base64, fileMime: mime, url: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.scheduleEnabled && !form.tv) {
      alert('Select a target TV to schedule this content.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      layout: form.layout,
      tv: form.tv || null,
      url: form.fileBase64 ? undefined : (form.type !== 'text' && form.url ? form.url.trim() : undefined),
      content: form.type === 'text' ? form.textContent.trim() : undefined,
      fileBase64: form.fileBase64 || undefined,
      fileMime: form.fileBase64 ? form.fileMime : undefined,
      // ADD: schedule payload
      schedule: form.scheduleEnabled ? {
        enabled: true,
        daysOfWeek: form.daysOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      } : { enabled: false }
    };
    onSubmit(payload);
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

        <Field label="Layout" required>
            <select
              value={form.layout}
              onChange={e => handleChange('layout', e.target.value)}
              style={inputStyle}
            >
              {layoutOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
        </Field>

        <Field label="Target TV">
          <select
            value={form.tv}
            onChange={e => handleChange('tv', e.target.value)}
            style={inputStyle}
          >
            <option value="">All / None</option>
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
        <Field label={form.type === 'image' ? 'Image File or URL' : 'Video File or URL'}>
          <input
            type="file"
            accept={form.type === 'image' ? 'image/*' : 'video/*'}
            onChange={e => handleFile(e.target.files?.[0])}
            style={{ marginBottom: 8 }}
          />
          <input
            value={form.url}
            onChange={e =>
              setForm(p => ({ ...p, url: e.target.value, fileBase64: '', fileMime: '' }))
            }
            style={inputStyle}
            placeholder="Or external URL (optional)"
          />
          {(form.fileBase64 || form.url) && (
            <small style={{ color: '#64748b' }}>
              {form.fileBase64
                ? 'Using embedded file.'
                : 'Using external URL.'}
            </small>
          )}
        </Field>
      )}

      {/* Schedule toggle */}
      <Field label="Schedule (optional)">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input
            type="checkbox"
            checked={form.scheduleEnabled}
            onChange={e => handleChange('scheduleEnabled', e.target.checked)}
          />
          <span style={{ color:'#475569' }}>Enable schedule for this content</span>
        </div>
      </Field>

      {form.scheduleEnabled && (
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
            <div style={{ display:'flex', gap:10 }}>
              <input type="time" value={form.startTime} onChange={e=>handleChange('startTime', e.target.value)} style={inputStyle} />
              <span style={{ alignSelf:'center', color:'#64748b' }}>to</span>
              <input type="time" value={form.endTime} onChange={e=>handleChange('endTime', e.target.value)} style={inputStyle} />
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