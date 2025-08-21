import React from 'react';

const ToastCtx = React.createContext(null);
export function useToast() {
  return React.useContext(ToastCtx);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const push = (type, message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, type, message };
    setToasts(s => [...s, t]);
    setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), opts.duration ?? 3000);
  };
  const api = {
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('error', m, o),
    info: (m, o) => push('info', m, o)
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={wrap}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...toast, ...(t.type === 'success' ? ok : t.type === 'error' ? err : inf) }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const wrap = {
  position: 'fixed',
  top: 16,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  zIndex: 9999,
  pointerEvents: 'none'
};
const toast = {
  pointerEvents: 'auto',
  minWidth: 200,
  maxWidth: 360,
  padding: '10px 14px',
  borderRadius: 10,
  color: '#0b1220',
  fontWeight: 600,
  boxShadow: '0 6px 20px rgba(0,0,0,.12)',
  background: '#fff',
  border: '1px solid #e5e7eb'
};
const ok = { borderColor: '#bbf7d0', background: '#ecfdf5', color: '#065f46' };
const err = { borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' };
const inf = { borderColor: '#c7d2fe', background: '#eef2ff', color: '#3730a3' };