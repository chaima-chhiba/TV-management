import React, { useState, useEffect } from 'react';

export default function TVForm({ tv, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
  profileName: '',
  });

  useEffect(() => {
    if (tv) {
      setFormData({
        name: tv.name || '',
        department: tv.department || '',
       profileName: tv.profileName || '',
      });
    }
  }, [tv]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'layout' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
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
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          minWidth: 300,
          maxWidth: 500,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <h2 style={{ marginBottom: 12, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
          {tv ? 'Edit TV' : 'Add New TV'}
        </h2>

        <input
          name="name"
          type="text"
          placeholder="TV Name"
          value={formData.name}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="department"
          type="text"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          style={inputStyle}
        />
        <input
          name="profileName"
          type="text"
          placeholder="Profile Name"
          value={formData.profileName}
          onChange={handleChange}
          style={inputStyle}
        />  

     
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#f3f4f6',
              color: '#1e293b',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: '#4f7cff',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500
            }}
          >
            {tv ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  color: '#1e293b'
};
