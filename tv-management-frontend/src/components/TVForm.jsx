import React, { useState, useEffect } from 'react';
import profileService from '../services/profileService';

export default function TVForm({ tv, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    profileName: ''
  });

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingProfiles(true);
        const list = await profileService.getAll();
        if (!mounted) return;
        setProfiles(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Failed to load profiles', e);
        setProfiles([]);
      } finally {
        setLoadingProfiles(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (tv) {
      setFormData({
        name: tv.name || '',
        department: tv.department || '',
        profileName: tv.profileName || ''
      });
    }
  }, [tv]);

  const sanitize = (v) => (typeof v === 'string' ? v.trim() : v);

  const validate = (data) => {
    const errs = {};
    if (!data.name) errs.name = 'TV name is required';
    if (!data.profileName) errs.profileName = 'Select a profile';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = sanitize(value);
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: sanitize(formData.name),
      department: sanitize(formData.department),
      profileName: sanitize(formData.profileName)
    };
    if (!validate(payload)) return;
    try {
      setSubmitting(true);
      const maybePromise = onSubmit(payload);
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise;
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={backdrop}>
      <form onSubmit={handleSubmit} style={formBox}>
        <h2 style={title}>{tv ? 'Edit TV' : 'Add New TV'}</h2>

        <div>
          <input
            name="name"
            type="text"
            placeholder="TV Name"
            value={formData.name}
            onChange={handleChange}
            style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : '#d1d5db' }}
            disabled={submitting}
          />
          {errors.name && <div style={errText}>{errors.name}</div>}
        </div>

        <div>
          <input
            name="department"
            type="text"
            placeholder="Department (optional)"
            value={formData.department}
            onChange={handleChange}
            style={inputStyle}
            disabled={submitting}
          />
        </div>

        <div>
          <select
            name="profileName"
            value={formData.profileName}
            onChange={handleChange}
            style={{ ...inputStyle, appearance: 'auto', borderColor: errors.profileName ? '#ef4444' : '#d1d5db' }}
            disabled={loadingProfiles || submitting}
          >
            <option value="">Select profile</option>
            {profiles.map(p => (
              <option key={p._id || p.id} value={p.title || ''}>
                {p.title || '(untitled)'} {p.type ? `• ${p.type}` : ''} {p.layout ? `• ${p.layout}` : ''}
              </option>
            ))}
          </select>
          {errors.profileName && <div style={errText}>{errors.profileName}</div>}
          {loadingProfiles && <div style={hintText}>Loading profiles…</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            style={btnSecondary}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={btnPrimary}
            disabled={loadingProfiles || submitting}
          >
            {submitting ? 'Saving…' : tv ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      {(loadingProfiles || submitting) && (
        <div style={loaderOverlay}>
          <div style={spinner} />
        </div>
      )}
    </div>
  );
}

const backdrop = {
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  width: '100vw',
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999
};

const formBox = {
  background: '#fff',
  padding: 32,
  borderRadius: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minWidth: 300,
  maxWidth: 500,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  position: 'relative'
};

const title = { marginBottom: 12, fontSize: 22, fontWeight: 700, color: '#1e293b' };

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  color: '#1e293b',
  width: '100%'
};

const btnSecondary = {
  background: '#f3f4f6',
  color: '#1e293b',
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer'
};

const btnPrimary = {
  background: '#4f7cff',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer'
};

const errText = { color: '#ef4444', fontSize: 12, marginTop: 6 };
const hintText = { color: '#64748b', fontSize: 12, marginTop: 6 };

const loaderOverlay = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const spinner = {
  width: 42,
  height: 42,
  border: '4px solid rgba(255,255,255,0.6)',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: 'spin 0.9s linear infinite'
};
