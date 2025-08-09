import React, { useEffect, useState } from 'react';

import { Monitor, Upload } from 'lucide-react';
import tvService from '../services/tvService';
// import getContent if needed

export default function Dashboard() {
  const [tvs, setTvs] = useState([]);
  const [content, setContent] = useState([]);

 useEffect(() => {
  tvService.getTVs().then(data => setTvs(data));
  // tvService.getContent().then(data => setContent(data)); // if you add content fetching later
}, []);


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
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 32 }}>
          <StatCard
            icon={<Monitor color="#4f7cff" size={32} />}
            label="Total TVs"
            value={tvs.length}
            color="#4f7cff"
          />
          <StatCard
            icon={<Monitor color="#22c55e" size={32} />}
            label="Online TVs"
            value={tvs.filter(tv => tv.status === 'online').length}
            color="#22c55e"
          />
          <StatCard
            icon={<Upload color="#a21caf" size={32} />}
            label="Total Content"
            value={content.length}
            color="#a21caf"
          />
        </div>

        {/* TV Status Overview */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#4f7cff' }}>TV Status Overview</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {tvs.map(tv => (
              <div key={tv._id || tv.id} style={{
                flex: '1 1 220px',
                background: '#f5f7fa',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tv.status === 'online' ? '#22c55e' : '#dc2626',
                    display: 'inline-block'
                  }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{tv.name || tv.tvId}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{tv.department}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    fontSize: 13,
                    background: '#e0e7ff',
                    color: '#3730a3',
                    borderRadius: 6,
                    padding: '2px 10px'
                  }}>
                    {tv.layout === 1 ? 'Full Screen' : tv.layout ? `${tv.layout} Split` : '-'}
                  </span>
                  <span style={{
                    fontSize: 13,
                    background: tv.status === 'online' ? '#bbf7d0' : '#fecaca',
                    color: tv.status === 'online' ? '#166534' : '#991b1b',
                    borderRadius: 6,
                    padding: '2px 10px'
                  }}>
                    {tv.status || '-'}
                  </span>
                </div>
              </div>
            ))}
            {tvs.length === 0 && (
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
                No TVs found. Please add a new TV.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: color + '20',
      borderRadius: 12,
      padding: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ color, fontWeight: 500, fontSize: 15 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#22223b' }}>{value}</div>
      </div>
      {icon}
    </div>
  );
}