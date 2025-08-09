import React, { useState } from 'react';
import ContentCard from '../components/ContentCard'; // adjust path as needed

export default function ContentLibrary() {
  const [content, setContent] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    type: 'text',
    content: '',
    duration: 10,
  });

  const addContent = () => {
    if (newContent.title) {
      setContent([
        ...content,
        {
          id: Date.now(),
          ...newContent,
          createdAt: new Date().toISOString(),
          url:
            newContent.type === 'image'
              ? 'https://via.placeholder.com/800x600/6366f1/white?text=' +
                encodeURIComponent(newContent.title)
              : undefined,
        },
      ]);
      setNewContent({ title: '', type: 'text', content: '', duration: 10 });
      setShowAddForm(false);
    }
  };

  const deleteContent = (id) => {
    setContent(content.filter((item) => item.id !== id));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f9fc',
      width: '100vw',
      overflowX: 'hidden'
    }}>
      <main style={{
        flex: 1,
        padding: '2.5rem 2rem',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        minWidth: 0
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#22223b' }}>Content Library</h2>
            <p style={{ fontSize: 14, color: '#64748b' }}>Manage your text, image, and video content</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: '#4f46e5',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            + Add Content
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: 24,
            marginBottom: 32
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Add New Content</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <input
                type="text"
                placeholder="Title"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14
                }}
              />
              <select
                value={newContent.type}
                onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14
                }}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <input
                type="number"
                placeholder="Duration (seconds)"
                value={newContent.duration}
                onChange={(e) => setNewContent({ ...newContent, duration: parseInt(e.target.value) })}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 14
                }}
              />
              {newContent.type === 'text' && (
                <textarea
                  placeholder="Content Text"
                  value={newContent.content}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    height: 80
                  }}
                />
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={addContent}
                  style={{
                    background: '#22c55e',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {content.map(item => (
            <ContentCard key={item.id} item={item} onDelete={deleteContent} />
          ))}
          {content.length === 0 && (
            <div style={{
              flex: '1 1 100%',
              background: '#f5f7fa',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 14
            }}>
              No content added yet. Click “Add Content” to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
