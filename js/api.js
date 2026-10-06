/* Krishana Jewellers — API layer
   - Single-source-of-truth fetcher with cache fallback
   - Never treats localStorage as authoritative
   - Hides raw errors from customers
   - Uses URL query params for tokens (Apps Script cannot handle CORS preflight) */
(function(){
  const CFG = window.APP_CONFIG;

  /* ---------- low-level fetch with timeout ---------- */
  function fetchJSON(url, opts, timeoutMs){
    timeoutMs = timeoutMs || 12000;
    return new Promise((resolve, reject) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => { ctrl.abort(); reject(new Error('timeout')); }, timeoutMs);
      fetch(url, Object.assign({signal: ctrl.signal}, opts||{}))
        .then(r => { clearTimeout(timer); return r.text(); })
        .then(text => {
          try { resolve(JSON.parse(text)); }
          catch(e){ reject(new Error('invalid_json')); }
        })
        .catch(err => { clearTimeout(timer); reject(err); });
    });
  }

  /* ---------- public cache ---------- */
  function readCache(){
    try{
      const raw = localStorage.getItem(CFG.PUBLIC_CACHE_KEY);
      if(!raw) return null;
      const obj = JSON.parse(raw);
      if(!obj || !obj.data) return null;
      return obj;
    }catch(e){ return null; }
  }
  function writeCache(data){
    try{
      localStorage.setItem(CFG.PUBLIC_CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        data
      }));
    }catch(e){ /* quota — ignore */ }
  }

  /* ---------- bundled fallback ---------- */
  function bundledFallback(){
    return {
      settings: Object.assign({}, CFG.DEFAULT_SETTINGS),
      theme: Object.assign({}, CFG.DEFAULT_THEME),
      products: CFG.DEFAULT_PRODUCTS.slice(),
      categories: CFG.DEFAULT_CATEGORIES.slice(),
      gallery: CFG.DEFAULT_GALLERY.slice(),
      testimonials: CFG.DEFAULT_TESTIMONIALS.slice(),
      navigation: CFG.DEFAULT_NAVIGATION.slice(),
      features: Object.assign({}, CFG.DEFAULT_FEATURES),
      _source: 'bundled'
    };
  }

  /* ---------- public site data ---------- */
  async function getSiteData(){
    try{
      const url = CFG.API_BASE + '?action=getSiteData&v=' + CFG.API_VERSION;
      const res = await fetchJSON(url, {method:'GET', cache:'no-store'}, 12000);
      if(res && res.success && res.data){
        const data = res.data;
        data._source = 'live';
        data._fetchedAt = Date.now();
        writeCache(data);
        return { ok:true, data, stale:false };
      }
      throw new Error(res && res.error && res.error.code || 'api_error');
    }catch(err){
      const cached = readCache();
      if(cached){
        const data = cached.data;
        data._source = 'cache';
        data._fetchedAt = cached.savedAt;
        return { ok:true, data, stale:true, reason: String(err.message || err) };
      }
      const data = bundledFallback();
      return { ok:true, data, stale:true, reason: String(err.message || err), noCache:true };
    }
  }

  /* ---------- public form submissions ---------- */
  async function submitEnquiry(payload){
    const url = CFG.API_BASE + '?action=submitEnquiry&v=' + CFG.API_VERSION;
    return fetchJSON(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload)
    }, 12000);
  }
  async function submitAppointment(payload){
    const url = CFG.API_BASE + '?action=submitAppointment&v=' + CFG.API_VERSION;
    return fetchJSON(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload)
    }, 12000);
  }

  /* ---------- admin endpoints ---------- */

  async function adminLogin(password){
    const url = CFG.API_BASE + '?action=login&v=' + CFG.API_VERSION;
    return fetchJSON(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({password: String(password||'')})
    }, 12000);
  }

  async function adminLogout(token){
    const url = CFG.API_BASE + '?action=logout&v=' + CFG.API_VERSION;
    return fetchJSON(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({token: String(token||'')})
    }, 8000);
  }

  /* Token goes in the URL — custom headers trigger CORS preflight,
     which Apps Script Web Apps cannot answer. */
  async function adminData(token){
    const url = CFG.API_BASE + '?action=adminData&v=' + CFG.API_VERSION
              + '&token=' + encodeURIComponent(token || '');
    return fetchJSON(url, {method:'GET', cache:'no-store'}, 12000);
  }

  async function adminMutation(action, token, payload){
    const url = CFG.API_BASE + '?action=' + encodeURIComponent(action)
              + '&v=' + CFG.API_VERSION;
    return fetchJSON(url, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(Object.assign({}, payload || {}, {token: token}))
    }, 15000);
  }

  async function ping(token){
    const t0 = performance.now();
    const url = CFG.API_BASE + '?action=ping&v=' + CFG.API_VERSION
              + (token ? '&token=' + encodeURIComponent(token) : '');
    try{
      const r = await fetchJSON(url, {method:'GET', cache:'no-store'}, 6000);
      return { ok: !!(r && r.success), ms: Math.round(performance.now() - t0), raw: r };
    }catch(e){
      return { ok:false, ms: Math.round(performance.now() - t0), error: String(e.message||e) };
    }
  }

  window.API = {
    getSiteData, submitEnquiry, submitAppointment,
    adminLogin, adminLogout, adminData, adminMutation, ping,
    readCache, writeCache
  };
})();
