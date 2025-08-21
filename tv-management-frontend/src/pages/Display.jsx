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
          if (!c.tv) return true; // global
          const cid = c.tv._id || c.tv;
          return String(cid) === String(resolvedId);
        });

        const baseItems = sourceContent.map(n => ({
          ...n,
          duration: Number(n.duration) > 0 ? Number(n.duration) : 8
        }));

        const allowed = baseItems.filter(c => isAllowedNow(c, tvSchedules));
        const built = buildDynamicPages(allowed);
        setPages(built);
        setPageIdx(0);
      } catch (e) {
        console.error('Display load failed:', e);
        setError(e.message || 'Failed to load');
        setPages([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [resolvedId]);

  // Auto-advance timer based on current page duration
  React.useEffect(() => {
    if (!pages.length) return;
    const durMs = (pages[pageIdx]?.duration || 10) * 1000;
    const t = setTimeout(() => setPageIdx(i => (i + 1) % pages.length), durMs);
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
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      {/* Arrows only when there are pages */}
      {!useFallback && (
        <div style={{ position:'fixed', inset:0, zIndex:25, pointerEvents:'none' }}>
          <button aria-label="Previous" onClick={goPrev} style={arrowBtn('left')}>‹</button>
          <button aria-label="Next" onClick={goNext} style={arrowBtn('right')}>›</button>
        </div>
      )}

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
            <Render key={(item?._id || item?.id || idx) + '_' + idx} item={item} layout={pages[pageIdx].layout} />
          ))}
        </Wrapper>
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
  if (!item) return <div style={{ background:'#000' }} />;

  // scale text sizes depending on layout
  const scale = layout === 'split4' ? 0.7 : layout === 'split2' ? 0.85 : 1;
  const titleFs = `${2.6 * scale}vmin`;
  const bodyFs = `${2.2 * scale}vmin`;

  if (item.type === 'text') {
    return (
      <div style={{
        width:'100%', height:'100%', padding:16, boxSizing:'border-box',
        background:'#0f172a', color:'#e2e8f0', borderRadius:0, overflow:'hidden'
      }}>
        <div style={{fontSize: titleFs, fontWeight:700, marginBottom:8}}>{item.title}</div>
        <div style={{fontSize: bodyFs, lineHeight:1.4, whiteSpace:'pre-wrap'}}>{item.content}</div>
      </div>
    );
  }
  if (item.type === 'image') {
    return (
      <img
        src={getMediaSrc(item)}
        alt={item.title}
        style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:0, display:'block' }}
      />
    );
  }
  if (item.type === 'video') {
    return (
      <video
        src={getMediaSrc(item)}
        style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:0, display:'block' }}
        autoPlay muted loop playsInline webkit-playsinline="true"
      />
    );
  }
  return <div />;
}

function Wrapper({ layout, children }) {
  const isPortrait = useIsPortrait();

  // Fill parent exactly, no gaps/padding
  const base = {
    display:'grid',
    width:'100%',
    height:'100%',
    boxSizing:'border-box',
    gap: 0
  };

  if (layout === 'split4') {
    return (
      <div style={{ ...base, gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr' }}>
        {children}
      </div>
    );
  }

  if (layout === 'split2') {
    const landscape = { ...base, gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr' };
    const portrait  = { ...base, gridTemplateColumns:'1fr', gridTemplateRows:'1fr 1fr' };
    return <div style={isPortrait ? portrait : landscape}>{children.slice(0, 2)}</div>;
  }

  // fullscreen
  return (
    <div style={{ width:'100%', height:'100%', boxSizing:'border-box' }}>
      <div style={{ width:'100%', height:'100%' }}>
        {children[0] || null}
      </div>
    </div>
  );
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