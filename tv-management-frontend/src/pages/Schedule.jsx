import React, { useEffect, useMemo, useState } from 'react';
import tvService from '../services/tvService';
import contentService from '../services/contentService';
import scheduleService from '../services/scheduleService';

const input = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14
};

export default function Schedule() {
  const [tvs, setTvs] = useState([]);
  const [selectedTv, setSelectedTv] = useState('');
  const [allContent, setAllContent] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // { content, schedule? }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [tvList, contentList] = await Promise.all([
          tvService.getTVs(),
          contentService.getAll()
        ]);
        if (!mounted) return;
        setTvs(tvList);
        setAllContent(contentList);
        // Preselect first TV
        const first = tvList?.[0]?._id || tvList?.[0]?.id || '';
        setSelectedTv(first || '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedTv) {
      setSchedules([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const list = await scheduleService.getByTv(selectedTv);
        if (!mounted) return;
        setSchedules(list || []);
      } catch (e) {
        console.error('Failed to load schedules', e);
        setSchedules([]);
      }
    })();
    return () => { mounted = false; };
  }, [selectedTv]);

  const scheduleMap = useMemo(() => {
    const m = new Map();
    schedules.forEach(s => {
      const key = String(s.contentId?._id || s.contentId);
      m.set(key, s);
    });
    return m;
  }, [schedules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Show content that is global (no tv) or targeted to the selected TV
    const scoped = allContent.filter(c => {
      if (!selectedTv) return false;
      if (!c.tv) return true;
      const cid = c.tv._id || c.tv;
      return String(cid) === String(selectedTv);
    });
    if (!q) return scoped;
    return scoped.filter(c => {
      const s = [
        c.title, c.description, c.type, c.layout, c.content, c.url
      ].filter(Boolean).join(' ').toLowerCase();
      return s.includes(q);
    });
  }, [allContent, selectedTv, search]);

  const openEditor = (content) => {
    const existing = scheduleMap.get(String(content._id || content.id));
    setEditing({
      content,
      schedule: existing ? {
        id: existing._id || existing.id,
        enabled: existing.enabled !== false,
        daysOfWeek: Array.isArray(existing.daysOfWeek) ? existing.daysOfWeek : [0,1,2,3,4,5,6],
        startTime: existing.startTime || '00:00',
        endTime: existing.endTime || '23:59',
        startDate: existing.startDate ? isoDate(existing.startDate) : '',
        endDate: existing.endDate ? isoDate(existing.endDate) : '',
        timezone: existing.timezone || guessTz()
      } : {
        enabled: true,
        daysOfWeek: [0,1,2,3,4,5,6],
        startTime: '00:00',
        endTime: '23:59',
        startDate: '',
        endDate: '',
        timezone: guessTz()
      }
    });
  };

  const clearSchedule = async (content) => {
    const existing = scheduleMap.get(String(content._id || content.id));
    if (!existing) return;
    if (!window.confirm('Remove schedule for this content on this TV?')) return;
    try {
      setSaving(true);
      await scheduleService.remove(existing._id || existing.id);
      setSchedules(prev => prev.filter(s => String(s._id || s.id) !== String(existing._id || existing.id)));
    } catch (e) {
      console.error(e);
      alert('Failed to remove schedule');
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    if (!editing || !selectedTv) return;
    const c = editing.content;
    const s = editing.schedule;
    const payload = {
      tvId: selectedTv,
      contentId: c._id || c.id,
      daysOfWeek: s.daysOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      startDate: s.startDate || null,
      endDate: s.endDate || null,
      timezone: s.timezone || guessTz(),
      enabled: !!s.enabled
    };
    try {
      setSaving(true);
      const existing = scheduleMap.get(String(c._id || c.id));
      if (existing) {
        const updated = await scheduleService.update(existing._id || existing.id, payload);
        setSchedules(prev => prev.map(x => String(x._id || x.id) === String(existing._id || existing.id) ? updated : x));
      } else {
        const created = await scheduleService.create(payload);
        setSchedules(prev => [...prev, created]);
      }
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{maxWidth:1300, margin:'0 auto', padding:'2.5rem 2rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h2 style={{margin:0, fontSize:28, fontWeight:700, color:'#1e293b'}}>Scheduling</h2>
        <div style={{display:'flex', gap:10}}>
          <select
            value={selectedTv}
            onChange={e => setSelectedTv(e.target.value)}
            style={{ ...input, minWidth: 220 }}
          >
            <option value="" disabled>Select TV</option>
            {tvs.map(tv => (
              <option key={tv._id || tv.id} value={tv._id || tv.id}>
                {tv.name} {tv.department ? `• ${tv.department}` : ''}
              </option>
            ))}
          </select>
          <input
            placeholder="Search content..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ ...input, width: 260 }}
          />
        </div>
      </div>

      {!selectedTv && <div style={{padding:20, background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>Select a TV to manage schedules.</div>}

      {selectedTv && (
        <>
          <div style={{fontSize:12, color:'#64748b', marginBottom:8}}>
            {loading ? 'Loading...' : `${filtered.length} content item(s)`}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {filtered.map(c => {
              const sc = scheduleMap.get(String(c._id || c.id));
              return (
                <div key={c._id || c.id} style={{ background:'#fff', borderRadius:12, padding:14, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
                    <div>
                      <div style={{fontWeight:700, color:'#111827'}}>{c.title}</div>
                      <div style={{fontSize:12, color:'#64748b'}}>{(c.type||'-').toUpperCase()} • {c.layout || '-'}</div>
                    </div>
                    <span style={{
                      alignSelf:'flex-start',
                      background: sc ? '#dcfce7' : '#fee2e2',
                      color: sc ? '#166534' : '#991b1b',
                      borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700
                    }}>
                      {sc ? 'Scheduled' : 'None'}
                    </span>
                  </div>
                  <div style={{fontSize:12, color:'#334155', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:10, minHeight:48}}>
                    {sc ? renderSummary(sc) : 'No schedule for this TV.'}
                  </div>
                  <div style={{display:'flex', gap:8, marginTop:'auto'}}>
                    <button
                      onClick={() => openEditor(c)}
                      style={btn('#f1f5f9','#111827',true)}
                    >
                      Edit schedule
                    </button>
                    {sc && (
                      <button
                        onClick={() => clearSchedule(c)}
                        style={btn('#fee2e2','#b91c1c')}
                        disabled={saving}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <ScheduleEditor
            content={editing.content}
            value={editing.schedule}
            onChange={v => setEditing(prev => ({ ...prev, schedule: v }))}
            onCancel={() => setEditing(null)}
            onSave={saveSchedule}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

function renderSummary(s) {
  const days = Array.isArray(s.daysOfWeek) ? s.daysOfWeek : [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const daysText = days.length === 7 ? 'Every day' : days.map(d => dayNames[d]).join(', ') || '—';
  const range = s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : 'All day';
  const dates = (s.startDate || s.endDate)
    ? `${s.startDate ? isoDate(s.startDate) : ''} ${s.endDate ? `→ ${isoDate(s.endDate)}` : ''}`.trim()
    : '';
  return `${daysText} • ${range}${dates ? ` • ${dates}` : ''} ${s.timezone ? `(${s.timezone})` : ''}`;
}

function isoDate(d) {
  try {
    return new Date(d).toISOString().slice(0,10);
  } catch {
    return '';
  }
}
function guessTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch { return 'UTC'; }
}

function btn(bg, color, primary=false) {
  return {
    background: bg,
    color,
    border: '1px solid ' + (primary ? '#e5e7eb' : 'transparent'),
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer'
  };
}

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:12, padding:16, width:'min(720px,92vw)', boxShadow:'0 10px 30px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  );
}

function ChipToggle({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding:'6px 10px', borderRadius:8,
      border:'1px solid ' + (active ? '#2563eb' : '#cbd5e1'),
      background: active ? '#2563eb' : '#fff',
      color: active ? '#fff' : '#334155',
      fontSize:12, fontWeight:700, cursor:'pointer'
    }}>{label}</button>
  );
}

function ScheduleEditor({ content, value, onChange, onSave, onCancel, saving }) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const set = (k,v) => onChange({ ...value, [k]: v });
  const toggleDay = (d) => {
    const setDays = new Set(value.daysOfWeek || []);
    setDays.has(d) ? setDays.delete(d) : setDays.add(d);
    set('daysOfWeek', Array.from(setDays).sort((a,b)=>a-b));
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div style={{fontSize:18, fontWeight:800, color:'#111827'}}>Schedule: {content?.title}</div>
        <button onClick={onCancel} style={btn('#f1f5f9','#111827')}>Close</button>
      </div>
      <div style={{fontSize:12, color:'#64748b', marginBottom:12}}>
        {(content?.type || '-').toUpperCase()} • {content?.layout || '-'}
      </div>

      <div style={{display:'grid', gap:12}}>
        <label style={{display:'flex', alignItems:'center', gap:8}}>
          <input type="checkbox" checked={!!value.enabled} onChange={e=>set('enabled', e.target.checked)} />
          <span style={{color:'#334155'}}>Enable schedule</span>
        </label>

        <div>
          <div style={{fontSize:12, color:'#64748b', marginBottom:6}}>Days of week</div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {days.map((d, i) => (
              <ChipToggle key={i} label={d} active={(value.daysOfWeek||[]).includes(i)} onClick={() => toggleDay(i)} />
            ))}
          </div>
        </div>

        <div>
          <div style={{fontSize:12, color:'#64748b', marginBottom:6}}>Time window (local)</div>
          <div style={{display:'flex', gap:10}}>
            <input type="time" value={value.startTime || '00:00'} onChange={e=>set('startTime', e.target.value)} style={input} />
            <span style={{alignSelf:'center', color:'#64748b'}}>to</span>
            <input type="time" value={value.endTime || '23:59'} onChange={e=>set('endTime', e.target.value)} style={input} />
          </div>
          <div style={{fontSize:12, color:'#64748b', marginTop:6}}>
            Overnight windows supported (e.g., 22:00 to 06:00).
          </div>
        </div>

        <div>
          <div style={{fontSize:12, color:'#64748b', marginBottom:6}}>Date range (optional)</div>
          <div style={{display:'flex', gap:10}}>
            <input type="date" value={value.startDate || ''} onChange={e=>set('startDate', e.target.value)} style={input} />
            <span style={{alignSelf:'center', color:'#64748b'}}>to</span>
            <input type="date" value={value.endDate || ''} onChange={e=>set('endDate', e.target.value)} style={input} />
          </div>
        </div>

        <div>
          <div style={{fontSize:12, color:'#64748b', marginBottom:6}}>Timezone</div>
          <input value={value.timezone || guessTz()} onChange={e=>set('timezone', e.target.value)} style={{...input, width:260}} />
        </div>

        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button onClick={onSave} disabled={saving} style={btn('#2563eb','#fff')}>{saving ? 'Saving…' : 'Save schedule'}</button>
          <button onClick={onCancel} style={btn('#f1f5f9','#111827')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}