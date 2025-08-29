import React from 'react';
import { useParams } from 'react-router-dom';
import contentPublicService from '../services/contentPublicService';
import schedulePublicService from '../services/schedulePublicService';
import tvService from '../services/tvService';
import tvPublicService from '../services/tvPublicService';

export default function Display() {
  const { tvId } = useParams(); // this can now be an id or a name

  const [resolvedId, setResolvedId] = React.useState(null);
  const [resolveErr, setResolveErr] = React.useState('');

  const [pages, setPages] = React.useState([]); // [{ layout, slots, duration }]
  const [pageIdx, setPageIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const containerRef = React.useRef(null);

  // HUD state (time + weather)
  const [now, setNow] = React.useState(new Date());
  const [weather, setWeather] = React.useState(null);
  const [message, setMessage] = React.useState(''); // ADD
  const [bandText, setBandText] = React.useState(''); // NEW: global top band text

  // swipe state
  const startX = React.useRef(null);
  const isPointerDown = React.useRef(false);

  // Resolve tvId (id or name) to a concrete DB id for APIs
  React.useEffect(() => {
    setResolvedId(null);
    setResolveErr('');
    if (!tvId) return;

    const isObjectId = /^[a-f0-9]{24}$/i.test(tvId);
    if (isObjectId) {
      setResolvedId(tvId);
      return;
    }
    // Resolve by name via public endpoint
    (async () => {
      try {
        const tv = await tvPublicService.getByName(tvId);
        setResolvedId(tv._id || tv.id);
      } catch (e) {
        setResolveErr('TV not found');
      }
    })();
  }, [tvId]);

  // Fetch content/schedules once we have the concrete id
  React.useEffect(() => {
    if (!resolvedId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');

        const [allContent, tvSchedules] = await Promise.all([
          contentPublicService.getAll().catch(() => []),
          schedulePublicService.getByTv(resolvedId).catch(() => [])
        ]);

        if (!mounted) return;

        const sourceContent = allContent.filter(c => {
          if (Array.isArray(c.tvs) && c.tvs.length) {
            return c.tvs.some(t => String(t?._id || t) === String(resolvedId));
          }
          if (!c.tv) return true;
          const cid = c.tv._id || c.tv;
          return String(cid) === String(resolvedId);
        });

        const baseItems = sourceContent.map(n => ({
          ...n,
          duration: Number(n.duration) > 0 ? Number(n.duration) : 8
        }));

        const allowed = baseItems.filter(c => isAllowedNow(c, tvSchedules));

        // Bottom band: include any text content and text assets
        const texts = [];
        for (const c of allowed) {
          if (c.type === 'text') {
            const t = (c.content || c.textContent || c.title || '').trim();
            if (t) texts.push(t);
          }
          if (Array.isArray(c.assets)) {
            c.assets.forEach(a => {
              if (a?.type === 'text') {
                const t = (a.title || '').trim();
                if (t) texts.push(t);
              }
            });
          }
        }
        const uniq = Array.from(new Set(texts));
        setBandText(uniq.join(' • '));

        // Visual pages: expand image/video assets; skip text (shown in band)
        const visual = [];
        for (const c of allowed) {
          if (Array.isArray(c.assets) && c.assets.length) {
            for (const a of c.assets) {
              if (a?.type === 'text') continue;
              const candidate = {
                _id: `${c._id || c.id}_${a.title || a.url || Math.random()}`,
                type: a.type || c.type,
                url: a.url || '',
                filePath: a.filePath || undefined,
                media: a.media || undefined,
                mediaDataUrl: a.mediaDataUrl,
                title: c.title || a.title || '',
                layout: c.layout || 'auto',
                duration: Number(a.duration) > 0 ? Number(a.duration) : (c.duration || 8),
                createdAt: c.createdAt
              };
              const src = getMediaSrc(candidate);
              if (!src) continue; // SKIP empty media
              visual.push(candidate);
            }
          } else if (c.type !== 'text') {
            const src = getMediaSrc(c);
            if (!src) continue; // SKIP empty legacy
            visual.push(c);
          }
        }

        const built = buildDynamicPages(visual);
        setPages(built);
        setPageIdx(0);
      } catch (e) {
        console.error('Display load failed:', e);
        setError(e.message || 'Failed to load');
        setPages([]);
        setBandText('');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [resolvedId]);

  // Auto-advance every 5s if there’s more than 1 page
  React.useEffect(() => {
    if (pages.length <= 1) return;
    const t = setTimeout(() => setPageIdx(i => (i + 1) % pages.length), 5000);
    return () => clearTimeout(t);
  }, [pages, pageIdx]);

  // Keyboard arrows
  React.useEffect(() => {
    const onKey = (e) => {
      if (!pages.length) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages.length]);

  // NEW: click arrows helpers
  const goNext = React.useCallback(() => {
    if (!pages.length) return;
    setPageIdx(i => (i + 1) % pages.length);
  }, [pages.length]);

  const goPrev = React.useCallback(() => {
    if (!pages.length) return;
    setPageIdx(i => (i - 1 + pages.length) % pages.length);
  }, [pages.length]);

  const onPointerDown = (e) => {
    isPointerDown.current = true;
    startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  };
  const onPointerMove = (e) => {
    if (!isPointerDown.current) return;

  };
  const onPointerUp = (e) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const dx = endX - (startX.current ?? 0);
    const threshold = 50; // px
    if (Math.abs(dx) >= threshold && pages.length) {
      if (dx < 0) goNext(); // swipe left -> next
      else goPrev();        // swipe right -> prev
    }
  };

  // clock
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // weather (OpenWeather)
  React.useEffect(() => {
    const key = import.meta.env?.VITE_WEATHER_API_KEY;
    const city = import.meta.env?.VITE_WEATHER_CITY;
    if (!key || !city) return;
    let alive = true;
    const fetchWx = async () => {
      try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`);
        if (!r.ok) return;
        const d = await r.json();
        if (!alive) return;
        setWeather({
          temp: d?.main?.temp,
          pressure: d?.main?.pressure,
          humidity: d?.main?.humidity
        });
      } catch {}
    };
    fetchWx();
    const t = setInterval(fetchWx, 10 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Lock page scrolling while Display is mounted
  React.useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.documentElement.style.overflow = prevHtml || '';
      document.body.style.overflow = prevBody || '';
    };
  }, []);

  // Public ping uses resolved id
  React.useEffect(() => {
    if (!resolvedId) return;

    const ping = async (status = 'online') => {
      try { await tvPublicService.ping(resolvedId, status); } catch {}
    };

    ping('online');
    const hb = setInterval(() => ping('online'), 30000);
    const onVis = () => ping(document.visibilityState === 'visible' ? 'online' : 'offline');
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(hb);
      document.removeEventListener('visibilitychange', onVis);
      ping('offline');
    };
  }, [resolvedId]);

  React.useEffect(() => {
    // pick a random message and rotate every 60s
    const msgs = [
      'Welcome!',
      'Have a great day!',
      'Stay safe!',
      'Remember to hydrate.',
      'Be kind. Work hard.',
      'Keep smiling!',
      'You are awesome!'
    ];
    const pick = () => setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    pick();
    const t = setInterval(pick, 60000);
    return () => clearInterval(t);
  }, []);

  // ADD: inject keyframes once for the ticker animation
  React.useEffect(() => {
    if (document.getElementById('display-ticker-styles')) return;
    const style = document.createElement('style');
    style.id = 'display-ticker-styles';
    style.textContent = `
      @keyframes ticker-left {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100%); }
      }
      @media (prefers-reduced-motion: reduce) {
        .ticker-anim { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (loading) return <Status text="Loading..." />;
  if (error) return <Status text={error} />;
  if (resolveErr) return <Status text={resolveErr} />;

  const useFallback = pages.length === 0; // ADD
  const hudOff = new URLSearchParams(window.location.search).get('hud') === '0';

  return (
    <div
      ref={containerRef}
      style={{
        position:'fixed', inset:0,
        background:'#000',
        touchAction:'none',
        overflow:'hidden'
      }}
    >
      {/* Slide controls removed; auto-advance handles cycling */}

      {/* HUD (keep for pages; hidden in fallback because fallback shows time/info centered) */}
      {!useFallback && !hudOff && (
        <div style={{
          position:'fixed', top:12, right:12, zIndex:20, color:'#fff',
          textShadow:'0 1px 2px rgba(0,0,0,.7)', display:'flex', flexDirection:'column', alignItems:'flex-end',
          fontFamily:'system-ui, Segoe UI, Roboto, sans-serif'
        }}>
          <div style={{ fontSize:'4vmin', fontWeight:800 }}>
            {now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </div>
          <div style={{ fontSize:'1.8vmin', opacity:.85 }}>
            {now.toLocaleDateString()}
          </div>
          {weather && (
            <div style={{ marginTop:6, fontSize:'1.8vmin', opacity:.9 }}>
              {Math.round(weather.temp)}°C • {weather.pressure} hPa{weather.humidity != null ? ` • ${weather.humidity}%` : ''}
            </div>
          )}
        </div>
      )}

      {useFallback ? (
        <DefaultScreen now={now} weather={weather} message={message} />
      ) : (
        <Wrapper layout={pages[pageIdx].layout}>
          {pages[pageIdx].slots.map((item, idx) => (
            <div key={(item?._id || item?.id || idx) + '_' + idx} style={slotStyle}>
              <Render item={item} layout={pages[pageIdx].layout} />
            </div>
          ))}
        </Wrapper>
      )}

      {/* Bottom text band overlay (always above content and HUD) */}
      {bandText && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, pointerEvents:'none' }}>
          <TickerBand text={bandText} position="bottom" />
        </div>
      )}
    </div>
  );
}

// ADD: centered default screen when there is no content for this TV
function DefaultScreen({ now, weather, message }) {
  return (
    <div style={{
      position:'absolute', inset:0, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', color:'#fff',
      textAlign:'center', padding:24, gap:10, fontFamily:'system-ui, Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{ fontSize:'16vmin', fontWeight:900, lineHeight:1, letterSpacing:2 }}>
        {now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
      </div>
      <div style={{ fontSize:'3.6vmin', opacity:.9 }}>
        {now.toLocaleDateString()}
      </div>
      {weather && (
        <div style={{ fontSize:'3vmin', opacity:.9, marginTop:12 }}>
          {Math.round(weather.temp)}°C • {weather.pressure} hPa{weather.humidity != null ? ` • ${weather.humidity}%` : ''}
        </div>
      )}
      <div style={{ fontSize:'4vmin', fontWeight:700, marginTop:18, color:'#a5b4fc' }}>
        {message}
      </div>
    </div>
  );
}

// ADD: button style helper
function arrowBtn(side) {
  const pos = side === 'left'
    ? { left:12, transform:'translateY(-50%)' }
    : { right:12, transform:'translateY(-50%)' };
  return {
    position:'absolute', top:'50%', ...pos,
    width:72, height:72, borderRadius:'50%',
    background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,.25)',
    color:'#fff', fontSize:36, fontWeight:800, lineHeight:1,
    cursor:'pointer', pointerEvents:'auto', display:'flex', alignItems:'center', justifyContent:'center'
  };
}

const slotStyle = {
  position: 'relative',
  background: '#000',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  minWidth: 0,
  minHeight: 0
};

const mediaFit = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain', // key to fit completely without cropping
  background: '#000'
};

function isAllowedNow(content, schedules) {
  const id = String(content._id || content.id || '');
  const matches = schedules.filter(s => String(s.contentId?._id || s.contentId) === id);
  if (matches.length === 0) return true; 

  const now = new Date();
  const day = now.getDay(); 
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const cur = `${hh}:${mm}`;

  return matches.some(s => {
    if (s.enabled === false) return false;
    if (Array.isArray(s.daysOfWeek) && !s.daysOfWeek.includes(day)) return false;

    const startDate = s.startDate ? new Date(s.startDate) : null;
    const endDate = s.endDate ? new Date(s.endDate) : null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (startDate && today < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) return false;
    if (endDate && today > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())) return false;

    const start = s.startTime || '00:00';
    const end = s.endTime || '23:59';
    if (start <= end) return cur >= start && cur <= end;
    return cur >= start || cur <= end; // overnight window
  });
}

// Build pages: fullscreen items get their own page; others auto-chunk up to 4
function buildDynamicPages(items) {
  const sorted = [...items].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const pages = [];
  let autoBucket = [];    // items with no explicit layout (auto)
  let split2Bucket = [];  // items explicitly marked split2

  const flushAuto = () => {
    if (!autoBucket.length) return;
    const count = autoBucket.length;
    const layout = decideLayout(count); // fullscreen, split2, or split4
    const duration = Math.max(...autoBucket.map(s => Number(s?.duration) || 0), 10);
    let slots = [...autoBucket];
    if (layout === 'split4') {
      while (slots.length < 4) slots.push(null);
    }
    pages.push({ layout, slots, duration });
    autoBucket = [];
  };

  const flushSplit2Pairs = () => {
    while (split2Bucket.length >= 2) {
      const pair = split2Bucket.splice(0, 2);
      const duration = Math.max(...pair.map(s => Number(s?.duration) || 0), 10);
      pages.push({ layout: 'split2', slots: pair, duration });
    }
  };

  for (const it of sorted) {
    const layout = (it.layout || '').toLowerCase();
    if (layout === 'fullscreen') {
      flushSplit2Pairs();
      if (split2Bucket.length === 1) autoBucket.push(split2Bucket.pop()); // avoid half-empty split2
      flushAuto();
      pages.push({ layout: 'fullscreen', slots: [it], duration: Number(it.duration) || 10 });
      continue;
    }
    if (layout === 'split2') {
      split2Bucket.push(it);
      flushSplit2Pairs();
      continue;
    }
    // auto
    autoBucket.push(it);
    if (autoBucket.length === 4) flushAuto();
  }

  // End flush
  flushSplit2Pairs();
  if (split2Bucket.length === 1) autoBucket.push(split2Bucket.pop());
  flushAuto();

  return pages;
}

// 1 -> fullscreen, 2 -> split2, 3-4 -> split4
function decideLayout(count) {
  if (count <= 1) return 'fullscreen';
  if (count === 2) return 'split2';
  return 'split4';
}

// Use backend base (falls back to http://localhost:5000 in dev)
const API_BASE = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function getMediaSrc(item) {
  if (!item) return null;
  if (item.mediaDataUrl) return item.mediaDataUrl;
  if (item.filePath) {
    const path = String(item.filePath).replace(/^\/+/, '');
    return path ? `${API_BASE}/${path}` : null;
  }
  if (item.url) return item.url;
  const m = item.media;
  if (m?.contentType && m?.data) {
    if (typeof m.data === 'string') return `data:${m.contentType};base64,${m.data}`;
    const arr = Array.isArray(m.data?.data) ? m.data.data : (Array.isArray(m.data) ? m.data : null);
    if (arr) {
      const bytes = new Uint8Array(arr);
      let binary = ''; const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return `data:${m.contentType};base64,${btoa(binary)}`;
    }
  }
  return null; // IMPORTANT
}

// Add a tiny hook to detect orientation
function useIsPortrait() {
  const [isPortrait, setIsPortrait] = React.useState(() => window.innerHeight >= window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight >= window.innerWidth);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return isPortrait;
}

function Render({ item, layout }) {
  if (!item) return null;

  // Images
  if (item.type === 'image') {
    const src = getMediaSrc(item);
    if (!src) return null;
    return <img src={src} alt={item.title || 'image'} style={mediaFit} draggable={false} />;
  }
  if (item.type === 'video') {
    const src = getMediaSrc(item);
    if (!src) return null;
    return <video src={src} style={mediaFit} autoPlay loop muted playsInline controls={false} />;
  }

  // Text is rendered globally in the top band
  if (item.type === 'text') return null;

  // Fallback: generic URL (iframe)
  if (item.url) {
    return (
      <iframe
        src={item.url}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#000' }}
      />
    );
  }

  return null;
}

// Band: smaller height, starts from left, continuous loop
function TickerBand({ text, position = 'top' }) {
  const clean = text.replace(/\s*\n+\s*/g, ' • ').replace(/\s{2,}/g, ' ').trim();
  const estChars = Math.max(20, clean.length);
  const duration = Math.min(40, Math.max(14, Math.round(estChars / 3))); // 14–40s

  const band = {
    position: 'relative',
    height: '7vh',
    minHeight: 28,
    background: 'rgba(0,0,0,0.75)',
    borderBottom: position === 'top' ? '1px solid rgba(255,255,255,0.12)' : undefined,
    borderTop: position !== 'top' ? '1px solid rgba(255,255,255,0.12)' : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    padding: '0 12px',
    pointerEvents: 'none'
  };

  const mask = { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' };

  const track = {
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    willChange: 'transform',
    animation: `ticker-left ${duration}s linear infinite`
  };

  const chunk = { display: 'inline-flex', alignItems: 'center', gap: 24, paddingRight: 48 };
  const txt = { color: '#fff', fontSize: '2.4vmin', lineHeight: 1.2, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,.6)' };
  const dot = { width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' };

  return (
    <div style={band}>
      <div style={mask}>
        <div className="ticker-anim" style={track}>
          {/* duplicate so it loops seamlessly; starts from the very left */}
          <div style={chunk}>
            <span style={txt}>{clean}</span>
            <span style={dot} />
            <span style={txt}>{clean}</span>
          </div>
          <div style={chunk}>
            <span style={txt}>{clean}</span>
            <span style={dot} />
            <span style={txt}>{clean}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Wrapper({ layout, children }) {
  const base = {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    gap: 8,
    padding: 8,
    background: '#000'
  };
  const style =
    layout === 'fullscreen'
      ? { ...base, gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
      : layout === 'split2'
      ? { ...base, gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
      : { ...base, gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }; // split4/default

  return <div style={style}>{children}</div>;
}

function Status({ text }) {
  return (
    <div style={{
      position:'fixed', inset:0,     // full overlay, no scrollbars
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'#000', color:'#fff'
    }}>
      {text}
    </div>
  );
}