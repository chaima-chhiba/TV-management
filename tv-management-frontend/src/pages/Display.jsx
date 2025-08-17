import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import contentService from '../services/contentService';
import profileService from '../services/profileService';
import scheduleService from '../services/scheduleService';

export default function Display() {
  const { tvId } = useParams();
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const pollRef = useRef();
  const timerRef = useRef();

  // single page index (0..3)
  const [pageIdx, setPageIdx] = useState(0);
  const [schedules, setSchedules] = React.useState([]);

  // Load & pick last 4 (profiles override)
  const load = async () => {
    try {
      setLoading(true);
      // fetch schedules for this TV (protected; ensure token exists)
      const tvSchedules = await scheduleService.getByTv(tvId);
      setSchedules(tvSchedules);

      const [allProfiles, allContent] = await Promise.all([
        profileService.getAll(),
        contentService.getAll()
      ]);

      const tvProfiles = allProfiles.filter(p => {
        const tvField = p.tv && (p.tv._id || p.tv);
        return tvField && tvField.toString() === tvId;
      });

      let chosen = tvProfiles.length
        ? tvProfiles
        : allContent.filter(c => {
            if (!c.tv) return true;
            const tvField = c.tv._id || c.tv;
            return tvField.toString() === tvId;
          });

      // normalize duration/layout then take last 4 by createdAt (timestamps ensure chronological)
      chosen = chosen
        .map(it => ({
          ...it,
            duration: it.duration || 8,
            layout: it.layout || 'fullscreen'
          }))
        .sort((a, b) => {
          const da = new Date(a.createdAt || 0).getTime();
          const db = new Date(b.createdAt || 0).getTime();
          return da - db; // oldest first
        });

      const lastFour = chosen.slice(-4);
      setRawItems(lastFour);
      setErr('');
      setPageIdx(0); // reset rotation after reload
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 30000);
    return () => clearInterval(pollRef.current);
  }, [tvId]);

  // Determine mode (fullscreen wins, else split2, else split4)
  const full = rawItems.filter(i => i.layout === 'fullscreen');
  const split2 = rawItems.filter(i => i.layout === 'split2');
  const split4 = rawItems.filter(i => i.layout === 'split4');

  let mode = 'none';
  if (full.length) mode = 'fullscreen';
  else if (split2.length) mode = 'split2';
  else if (split4.length) mode = 'split4';

  // Build 4 pages based on mode (reuse items to ensure 4 pages)
  const pages = buildPages(mode, full, split2, split4);

  // Schedule page rotation (duration = max item duration on page)
  useEffect(() => {
    if (!pages.length) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const currentPage = pages[pageIdx];
    const pageDuration =
      (currentPage.items.length
        ? Math.max(...currentPage.items.map(i => i.duration || 8))
        : 8) * 1000;
    timerRef.current = setTimeout(
      () => setPageIdx(prev => (prev + 1) % 4),
      pageDuration
    );
    return () => clearTimeout(timerRef.current);
  }, [pages, pageIdx]);

  if (loading) return <Status text="Loading..." />;
  if (err) return <Status text={err} />;
  if (!pages.length) return <DefaultScreen />;

  const page = pages[pageIdx];

  if (mode === 'fullscreen') {
    return (
      <Wrapper>
        <Fade key={pageIdx}>
          <Render item={page.items[0]} />
        </Fade>
      </Wrapper>
    );
  }

  if (mode === 'split2') {
    const [a, b] = page.items;
    return (
      <Wrapper split2>
        <div style={split2Left}><Render item={a} /></div>
        <div style={split2Right}><Render item={b} /></div>
      </Wrapper>
    );
  }

  if (mode === 'split4') {
    return (
      <Wrapper split4>
        {page.items.map((it, i) => (
          <div key={i} style={quadCell}>
            <Render item={it} />
          </div>
        ))}
      </Wrapper>
    );
  }

  return <Status text="No layout content" />;
}

function buildPages(mode, full, split2, split4) {
  const pages = [];
  if (mode === 'fullscreen') {
    // up to 4 items; repeat to 4 pages
    for (let i = 0; i < 4; i++) {
      pages.push({ items: [full[i % full.length]] });
    }
  } else if (mode === 'split2') {
    // pair selection with wrap; ensure at least 1 item
    const list = split2.length ? split2 : [];
    if (!list.length) return [];
    for (let i = 0; i < 4; i++) {
      const firstIdx = (i * 2) % list.length;
      const secondIdx = (firstIdx + 1) % list.length;
      pages.push({ items: [list[firstIdx], list[secondIdx]] });
    }
  } else if (mode === 'split4') {
    const list = split4.length ? split4 : [];
    if (!list.length) return [];
    for (let i = 0; i < 4; i++) {
      const start = (i * 4) % list.length;
      const items = [];
      for (let k = 0; k < 4; k++) {
        items.push(list[(start + k) % list.length]);
      }
      pages.push({ items });
    }
  }
  return pages;
}

function getMediaSrc(item) {
  if (!item) return '';
  if (item.mediaDataUrl) return item.mediaDataUrl;
  if (item.filePath) return `http://localhost:5000/${item.filePath}`;
  if (item.url) return item.url;
  const media = item.media;
  if (media?.contentType && media?.data) {
    const mime = media.contentType;
    const data = media.data;
    if (typeof data === 'string') return `data:${mime};base64,${data}`;
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : null);
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

function Render({ item }) {
  if (!item) return null;
  if (item.type === 'text') {
    return (
      <div style={textBox}>
        <div style={textTitle}>{item.title}</div>
        <div style={textBody}>{item.content}</div>
      </div>
    );
  }
  if (item.type === 'image') {
    return <img src={getMediaSrc(item)} alt={item.title} style={imgStyle} />;
  }
  if (item.type === 'video') {
    return <video src={getMediaSrc(item)} style={vidStyle} autoPlay muted loop playsInline />;
  }
  return null;
}

function Status({ text }) {
  return (
    <div style={{
      width:'100vw', height:'100vh', background:'#000',
      color:'#94a3b8', display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:'3vmin', fontFamily:'system-ui'
    }}>{text}</div>
  );
}

function Wrapper({ children, split2, split4 }) {
  return (
    <div style={{
      width:'100vw', height:'100vh', background:'#000', overflow:'hidden',
      display:'flex',
      flexDirection: split4 ? 'row' : (split2 ? 'row' : 'column'),
      flexWrap: split4 ? 'wrap' : 'nowrap'
    }}>
      {children}
    </div>
  );
}

const Fade = ({ children }) => (
  <div style={{
    width:'100%',height:'100%',display:'flex',alignItems:'center',
    justifyContent:'center',animation:'fade .6s ease'
  }}>
    <style>{`@keyframes fade{from{opacity:0}to{opacity:1}}`}</style>
    {children}
  </div>
);

/* Styles */
const textBox = {
  color:'#fff', padding:'4vmin 6vmin', maxWidth:'90vw',
  maxHeight:'90vh', overflow:'hidden', display:'flex',
  flexDirection:'column', justifyContent:'center',
  fontFamily:'system-ui'
};
const textTitle = { fontSize:'4vmin', fontWeight:700, marginBottom:'2vmin' };
const textBody = { fontSize:'2.6vmin', lineHeight:1.4, whiteSpace:'pre-wrap' };
const imgStyle = { maxWidth:'100%', maxHeight:'100%', objectFit:'contain' };
const vidStyle = { width:'100%', height:'100%', objectFit:'cover' };
const split2Left = { flex:1, borderRight:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center' };
const split2Right = { flex:1, display:'flex', alignItems:'center', justifyContent:'center' };
const quadCell = { width:'50%', height:'50%', border:'1px solid #000', boxSizing:'border-box', display:'flex', alignItems:'center', justifyContent:'center' };

function DefaultScreen() {
  const [now, setNow] = useState(new Date());
  const [wx, setWx] = useState({ temp: null, pressure: null, place: '' });
  const texts = [
    'Welcome to the TV board',
    'Have a great day!',
    'System is running smoothly',
    'Remember to take breaks'
  ];
  const [txtIdx, setTxtIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const rt = setInterval(() => setTxtIdx(i => (i + 1) % texts.length), 10000);
    return () => { clearInterval(t); clearInterval(rt); };
  }, []);

  useEffect(() => {
    const fetchWx = (lat, lon) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,pressure_msl`)
        .then(r => r.json())
        .then(d => {
          const cur = d.current || {};
          setWx({
            temp: typeof cur.temperature_2m === 'number' ? cur.temperature_2m : null,
            pressure: typeof cur.pressure_msl === 'number' ? cur.pressure_msl : null,
            place: ''
          });
        })
        .catch(() => {});
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWx(pos.coords.latitude, pos.coords.longitude),
        () => fetchWx(40.7128, -74.0060) // fallback NYC
      );
    } else {
      fetchWx(40.7128, -74.0060);
    }
  }, []);

  return (
    <div style={{
      width:'100vw', height:'100vh', background:'linear-gradient(180deg,#0f172a,#0b1220)',
      color:'#e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'system-ui, sans-serif', textAlign:'center', padding:'4vmin'
    }}>
      <div style={{fontSize:'10vmin', fontWeight:800, letterSpacing:2}}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{opacity:.8, marginTop:'1vmin', fontSize:'3vmin'}}>
        {now.toLocaleDateString()}
      </div>
      <div style={{display:'flex', gap:'4vmin', marginTop:'6vmin', flexWrap:'wrap', justifyContent:'center'}}>
        <Metric label="Temperature" value={
          wx.temp !== null ? `${wx.temp.toFixed(1)}°C` : 'N/A'
        } />
        <Metric label="Pressure" value={
          wx.pressure !== null ? `${Math.round(wx.pressure)} hPa` : 'N/A'
        } />
      </div>
      <div style={{
        marginTop:'6vmin', fontSize:'3vmin', color:'#cbd5e1',
        background:'rgba(255,255,255,0.06)', padding:'2vmin 3vmin', borderRadius:16, maxWidth:'80vw'
      }}>
        {texts[txtIdx]}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{
      minWidth:'26vmin', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
      padding:'2vmin 3vmin', borderRadius:16
    }}>
      <div style={{fontSize:'2.2vmin', opacity:.8}}>{label}</div>
      <div style={{fontSize:'4vmin', fontWeight:700}}>{value}</div>
    </div>
  );
}