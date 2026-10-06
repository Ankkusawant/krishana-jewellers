
/* Krishana Jewellers — Admin panel (session-token auth via Apps Script) */
(function(){
  const CFG = window.APP_CONFIG;
  const SESSION_KEY = 'kj_admin_session_v1';   // sessionStorage ONLY, never localStorage

  let state = {
    token: null,
    data: null,
    tab: 'dashboard',
    loading: false,
    lastError: null,
    lastAction: null,
    lastSyncAt: null,
    apiStatus: null
  };

  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const toast = m => { const t=document.getElementById('toast'); if(!t) return; t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2600); };

  function getStoredToken(){ try{ return sessionStorage.getItem(SESSION_KEY); }catch(e){ return null; } }
  function setStoredToken(t){ try{ if(t) sessionStorage.setItem(SESSION_KEY,t); else sessionStorage.removeItem(SESSION_KEY); }catch(e){} }
  function clearSession(){ state.token=null; state.data=null; setStoredToken(null); }

  /* ---------------- mount ---------------- */
  function mount(root, publicData){
    state.token = getStoredToken();
    if(!state.token){ renderLogin(root); return; }
    /* Verify token with server */
    root.innerHTML = '<div class="admin-shell"><div class="admin-side"><h4>Loading…</h4></div><div class="admin-main"><div class="empty">Verifying session…</div></div></div>';
    API.adminData(state.token).then(res=>{
      if(res && res.success && res.data){
        state.data = res.data;
        state.lastSyncAt = Date.now();
        renderShell(root);
      } else {
        clearSession();
        renderLogin(root, 'Session expired. Please sign in again.');
      }
    }).catch(()=>{
      clearSession();
      renderLogin(root, 'Could not reach the API. Check the endpoint in config.js.');
    });
  }

  /* ---------------- Login ---------------- */
  function renderLogin(root, message){
    root.innerHTML =
      '<div class="admin-shell" style="grid-template-columns:1fr">'+
        '<div class="admin-main" style="display:grid;place-items:center;min-height:100vh">'+
          '<div class="admin-form" style="max-width:400px;width:100%">'+
            '<h3 style="text-align:center">Admin Sign In</h3>'+
            (message?'<p class="form-note" style="text-align:center;color:#c0392b">'+esc(message)+'</p>':'')+
            '<form id="adminLogin">'+
              '<div class="field"><label for="aPass">Password</label><input id="aPass" type="password" required autocomplete="current-password"></div>'+
              '<button class="btn btn-primary btn-block" type="submit">Sign In</button>'+
            '</form>'+
            '<p class="form-note" style="text-align:center;margin-top:1.5rem">Passwords are verified server-side in Apps Script. No secrets are stored in this website.</p>'+
            '<div style="text-align:center;margin-top:1rem"><a href="#/" style="font-size:.8rem;color:var(--muted)">← Back to website</a></div>'+
          '</div>'+
        '</div>'+
      '</div>';

    document.getElementById('adminLogin').onsubmit = async (e) => {
      e.preventDefault();
      const pass = document.getElementById('aPass').value;
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Signing in…';
      try{
        const res = await API.adminLogin(pass);
        if(res && res.success && res.data && res.data.token){
          state.token = res.data.token;
          setStoredToken(state.token);
          mount(root);
        } else {
          toast(res && res.error ? res.error.message : 'Invalid credentials');
          btn.disabled = false; btn.textContent = 'Sign In';
        }
      }catch(err){
        toast('Could not reach the API. Try again.');
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    };
  }

  /* ---------------- Shell ---------------- */
  const TABS = [
    ['dashboard','Dashboard'],
    ['products','Products'],
    ['categories','Categories'],
    ['gallery','Gallery'],
    ['testimonials','Testimonials'],
    ['enquiries','Enquiries'],
    ['appointments','Appointments'],
    ['settings','Settings'],
    ['theme','Theme'],
    ['navigation','Navigation'],
    ['features','Features'],
    ['api','API Status']
  ];

  function renderShell(root){
    root.innerHTML =
      '<div class="admin-shell">'+
        '<aside class="admin-side">'+
          '<h4>Krishana Admin</h4>'+
          '<div id="adminTabs"></div>'+
          '<div style="padding:1.5rem;border-top:1px solid rgba(255,255,255,.1);margin-top:1rem">'+
            '<button id="adminLogout" class="btn btn-outline-light btn-sm btn-block">Sign Out</button>'+
            '<div style="margin-top:1rem;font-size:.7rem;color:rgba(255,255,255,.4);line-height:1.6">'+
              '<div>Status: <span id="sideStatus">…</span></div>'+
              '<div>Sync: <span id="sideSync">—</span></div>'+
            '</div>'+
          '</div>'+
        '</aside>'+
        '<section class="admin-main" id="adminMain"></section>'+
      '</div>';

    document.getElementById('adminTabs').innerHTML = TABS.map(([k,label])=>
      '<button data-tab="'+k+'" class="'+(state.tab===k?'active':'')+'">'+label+'</button>'
    ).join('');

    $$('#adminTabs button').forEach(b=>b.onclick=()=>{ state.tab=b.dataset.tab; renderTab(); });
    document.getElementById('adminLogout').onclick = async ()=>{
      try{ await API.adminLogout(state.token); }catch(e){}
      clearSession();
      location.hash='#/';
    };

    document.getElementById('sideStatus').textContent = 'Connected';
    document.getElementById('sideSync').textContent = state.lastSyncAt ? new Date(state.lastSyncAt).toLocaleTimeString() : '—';

    renderTab();
  }

  /* ---------------- Tab renderer ---------------- */
  function renderTab(){
    const main = document.getElementById('adminMain');
    const d = state.data || {};
    const tab = state.tab;

    if(tab==='dashboard') return renderDashboard(main,d);
    if(tab==='products') return renderProducts(main,d);
    if(tab==='categories') return renderCategories(main,d);
    if(tab==='gallery') return renderGallery(main,d);
    if(tab==='testimonials') return renderTestimonials(main,d);
    if(tab==='enquiries') return renderEnquiries(main,d);
    if(tab==='appointments') return renderAppointments(main,d);
    if(tab==='settings') return renderSettings(main,d);
    if(tab==='theme') return renderTheme(main,d);
    if(tab==='navigation') return renderNavigation(main,d);
    if(tab==='features') return renderFeatures(main,d);
    if(tab==='api') return renderApiStatus(main);
  }

  function adminHead(title, subtitle){
    return '<div class="admin-head"><div><h1>'+esc(title)+'</h1>'+
      (subtitle?'<p class="form-note" style="margin:0">'+esc(subtitle)+'</p>':'')+
      '</div><div style="display:flex;gap:.5rem;flex-wrap:wrap">'+
      '<button class="btn btn-outline btn-sm" id="refreshData">Refresh from Sheets</button>'+
      '<button class="btn btn-outline btn-sm" onclick="location.hash=\'#/\'">View Site</button>'+
      '</div></div>';
  }

  function bindRefresh(){
    const b = document.getElementById('refreshData');
    if(b) b.onclick = async ()=>{
      b.disabled = true; b.textContent='Refreshing…';
      try{
        const res = await API.adminData(state.token);
        if(res && res.success){ state.data = res.data; state.lastSyncAt=Date.now(); renderShell(document.getElementById('main')); }
        else toast('Refresh failed');
      }catch(e){ toast('Refresh failed'); }
      finally{ b.disabled=false; b.textContent='Refresh from Sheets'; }
    };
  }

  /* ---------------- Dashboard ---------------- */
  function renderDashboard(main,d){
    const counts = {
      products: (d.products||[]).length,
      categories: (d.categories||[]).length,
      newEnq: (d.enquiries||[]).filter(e=>String(e.status||'New')==='New').length,
      appts: (d.appointments||[]).filter(a=>['New','Confirmed'].includes(String(a.status))).length,
      testimonials: (d.testimonials||[]).length
    };
    main.innerHTML = adminHead('Dashboard')+
      '<div class="stat-grid">'+
        '<div class="stat"><strong>'+counts.products+'</strong><span>Products</span></div>'+
        '<div class="stat"><strong>'+counts.categories+'</strong><span>Categories</span></div>'+
        '<div class="stat"><strong>'+counts.newEnq+'</strong><span>New Enquiries</span></div>'+
        '<div class="stat"><strong>'+counts.appts+'</strong><span>Active Appointments</span></div>'+
      '</div>'+
      '<div class="admin-form">'+
        '<h3>Session</h3>'+
        '<div class="api-row"><span>Admin token</span><span>'+esc(state.token ? state.token.slice(0,8)+'…' : '—')+'</span></div>'+
        '<div class="api-row"><span>Last sync</span><span>'+esc(state.lastSyncAt?new Date(state.lastSyncAt).toLocaleString():'—')+'</span></div>'+
        '<div class="api-row"><span>Last action</span><span>'+esc(state.lastAction||'—')+'</span></div>'+
        '<div class="api-row"><span>Theme applied</span><span>'+esc((d.theme&&d.theme.accentColor)||'—')+'</span></div>'+
      '</div>';
    bindRefresh();
  }

  /* ---------------- Products ---------------- */
  function renderProducts(main,d){
    const list = (d.products||[]);
    main.innerHTML = adminHead('Products', list.length+' total')+
      '<div class="admin-form"><h3 id="prodFormTitle">Add Product</h3>'+
        '<form id="prodForm">'+
          '<input type="hidden" id="pId">'+
          '<div class="form-grid">'+
            '<div class="field"><label>Name *</label><input id="pName" required></div>'+
            '<div class="field"><label>Slug</label><input id="pSlug"></div>'+
            '<div class="field"><label>SKU</label><input id="pSku"></div>'+
            '<div class="field"><label>Category</label><select id="pCat">'+
              (d.categories||[]).map(c=>'<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>').join('')+
            '</select></div>'+
            '<div class="field"><label>Collection</label><input id="pColl"></div>'+
            '<div class="field"><label>Material</label><input id="pMat"></div>'+
            '<div class="field"><label>Purity</label><input id="pPur"></div>'+
            '<div class="field"><label>Weight</label><input id="pWt"></div>'+
            '<div class="field"><label>Price (blank = on request)</label><input id="pPrice" type="number"></div>'+
            '<div class="field"><label>Gender</label><input id="pGen"></div>'+
            '<div class="field"><label>Occasion</label><input id="pOcc"></div>'+
            '<div class="field"><label>Sort order</label><input id="pSort" type="number"></div>'+
            '<div class="field full"><label>Description</label><textarea id="pDesc"></textarea></div>'+
            '<div class="field full"><label>Image URL</label><input id="pImg"></div>'+
            '<div class="field"><label>Image 2</label><input id="pImg2"></div>'+
            '<div class="field"><label>Image 3</label><input id="pImg3"></div>'+
            '<div class="field"><label>Image 4</label><input id="pImg4"></div>'+
            '<div class="field"><label><input type="checkbox" id="pFeat"> Featured</label></div>'+
            '<div class="field"><label><input type="checkbox" id="pNew"> New Arrival</label></div>'+
            '<div class="field"><label><input type="checkbox" id="pBridal"> Bridal</label></div>'+
            '<div class="field"><label><input type="checkbox" id="pEnabled" checked> Enabled</label></div>'+
          '</div>'+
          '<div style="display:flex;gap:.5rem"><button class="btn btn-primary btn-sm" type="submit">Save Product</button>'+
          '<button class="btn btn-outline btn-sm" type="button" id="clearProd">Clear</button></div>'+
        '</form>'+
      '</div>'+
      '<table class="admin-table"><thead><tr><th>Name</th><th>Category</th><th>SKU</th><th>Flags</th><th>Actions</th></tr></thead><tbody>'+
        (list.length ? list.map(p=>'<tr>'+
          '<td>'+esc(p.name)+'</td>'+
          '<td>'+esc(p.category||'')+'</td>'+
          '<td>'+esc(p.sku||'')+'</td>'+
          '<td>'+(String(p.featured).toUpperCase()==='TRUE'?'★ ':'')+(String(p.newArrival).toUpperCase()==='TRUE'?'N ':'')+(String(p.bridal).toUpperCase()==='TRUE'?'B ':'')+(String(p.enabled).toUpperCase()==='FALSE'?'(off)':'')+'</td>'+
          '<td class="actions">'+
            '<button class="mini-btn" data-edit="'+esc(p.id)+'">Edit</button>'+
            '<button class="mini-btn danger" data-del="'+esc(p.id)+'">Delete</button>'+
          '</td></tr>').join('') : '<tr><td colspan="5" class="empty">No products yet.</td></tr>')+
      '</tbody></table>';

    bindRefresh();

    const form = document.getElementById('prodForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('pId').value || undefined,
        name: document.getElementById('pName').value.trim(),
        slug: document.getElementById('pSlug').value.trim(),
        sku: document.getElementById('pSku').value.trim(),
        category: document.getElementById('pCat').value,
        collection: document.getElementById('pColl').value.trim(),
        material: document.getElementById('pMat').value.trim(),
        purity: document.getElementById('pPur').value.trim(),
        weight: document.getElementById('pWt').value.trim(),
        price: document.getElementById('pPrice').value || '',
        gender: document.getElementById('pGen').value.trim(),
        occasion: document.getElementById('pOcc').value.trim(),
        sortOrder: document.getElementById('pSort').value || 0,
        description: document.getElementById('pDesc').value.trim(),
        image: document.getElementById('pImg').value.trim(),
        image2: document.getElementById('pImg2').value.trim(),
        image3: document.getElementById('pImg3').value.trim(),
        image4: document.getElementById('pImg4').value.trim(),
        featured: document.getElementById('pFeat').checked ? 'TRUE' : 'FALSE',
        newArrival: document.getElementById('pNew').checked ? 'TRUE' : 'FALSE',
        bridal: document.getElementById('pBridal').checked ? 'TRUE' : 'FALSE',
        enabled: document.getElementById('pEnabled').checked ? 'TRUE' : 'FALSE'
      };
      if(!payload.name){ toast('Name is required'); return; }
      await mutate('saveProduct', payload, 'Product saved');
    };

    document.getElementById('clearProd').onclick = () => {
      form.reset();
      document.getElementById('pId').value='';
      document.getElementById('prodFormTitle').textContent='Add Product';
    };

    $$('[data-edit]').forEach(b=>b.onclick=()=>{
      const p = list.find(x=>x.id===b.dataset.edit);
      if(!p) return;
      document.getElementById('pId').value = p.id||'';
      document.getElementById('pName').value = p.name||'';
      document.getElementById('pSlug').value = p.slug||'';
      document.getElementById('pSku').value = p.sku||'';
      document.getElementById('pCat').value = p.category||'';
      document.getElementById('pColl').value = p.collection||'';
      document.getElementById('pMat').value = p.material||'';
      document.getElementById('pPur').value = p.purity||'';
      document.getElementById('pWt').value = p.weight||'';
      document.getElementById('pPrice').value = p.price||'';
      document.getElementById('pGen').value = p.gender||'';
      document.getElementById('pOcc').value = p.occasion||'';
      document.getElementById('pSort').value = p.sortOrder||0;
      document.getElementById('pDesc').value = p.description||'';
      document.getElementById('pImg').value = p.image||'';
      document.getElementById('pImg2').value = p.image2||'';
      document.getElementById('pImg3').value = p.image3||'';
      document.getElementById('pImg4').value = p.image4||'';
      document.getElementById('pFeat').checked = String(p.featured).toUpperCase()==='TRUE';
      document.getElementById('pNew').checked = String(p.newArrival).toUpperCase()==='TRUE';
      document.getElementById('pBridal').checked = String(p.bridal).toUpperCase()==='TRUE';
      document.getElementById('pEnabled').checked = String(p.enabled).toUpperCase()!=='FALSE';
      document.getElementById('prodFormTitle').textContent='Edit Product';
      window.scrollTo({top:0,behavior:'smooth'});
    });
    $$('[data-del]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Delete this product? This cannot be undone.')) return;
      await mutate('deleteProduct', {id:b.dataset.del}, 'Product deleted');
    });
  }

  /* ---------------- Categories ---------------- */
  function renderCategories(main,d){
    const list = d.categories||[];
    main.innerHTML = adminHead('Categories', list.length+' total')+
      '<div class="admin-form"><h3>Add / Edit Category</h3>'+
        '<form id="catForm">'+
          '<input type="hidden" id="cId">'+
          '<div class="form-grid">'+
            '<div class="field"><label>Name *</label><input id="cName" required></div>'+
            '<div class="field"><label>Slug</label><input id="cSlug"></div>'+
            '<div class="field full"><label>Description</label><input id="cDesc"></div>'+
            '<div class="field full"><label>Image URL</label><input id="cImg"></div>'+
            '<div class="field"><label>Sort order</label><input id="cSort" type="number"></div>'+
            '<div class="field"><label><input type="checkbox" id="cEnabled" checked> Enabled</label></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">Save Category</button>'+
        '</form>'+
      '</div>'+
      '<table class="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Enabled</th><th>Actions</th></tr></thead><tbody>'+
        (list.length ? list.map(c=>'<tr>'+
          '<td>'+esc(c.name)+'</td><td>'+esc(c.slug)+'</td>'+
          '<td>'+esc(c.enabled)+'</td>'+
          '<td class="actions">'+
            '<button class="mini-btn" data-edit="'+esc(c.id)+'">Edit</button>'+
            '<button class="mini-btn danger" data-del="'+esc(c.id)+'">Delete</button>'+
          '</td></tr>').join('') : '<tr><td colspan="4" class="empty">No categories yet.</td></tr>')+
      '</tbody></table>';

    bindRefresh();
    const form = document.getElementById('catForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('cId').value || undefined,
        name: document.getElementById('cName').value.trim(),
        slug: document.getElementById('cSlug').value.trim(),
        description: document.getElementById('cDesc').value.trim(),
        image: document.getElementById('cImg').value.trim(),
        sortOrder: document.getElementById('cSort').value || 0,
        enabled: document.getElementById('cEnabled').checked ? 'TRUE' : 'FALSE'
      };
      if(!payload.name){ toast('Name is required'); return; }
      await mutate('saveCategory', payload, 'Category saved');
    };
    $$('[data-edit]').forEach(b=>b.onclick=()=>{
      const c = list.find(x=>x.id===b.dataset.edit); if(!c) return;
      document.getElementById('cId').value=c.id||'';
      document.getElementById('cName').value=c.name||'';
      document.getElementById('cSlug').value=c.slug||'';
      document.getElementById('cDesc').value=c.description||'';
      document.getElementById('cImg').value=c.image||'';
      document.getElementById('cSort').value=c.sortOrder||0;
      document.getElementById('cEnabled').checked=String(c.enabled).toUpperCase()!=='FALSE';
    });
    $$('[data-del]').forEach(b=>b.onclick=async()=>{
      const inUse = (d.products||[]).some(p=>p.category === (list.find(c=>c.id===b.dataset.del)||{}).name);
      if(inUse){ toast('Reassign products in this category before deleting.'); return; }
      if(!confirm('Delete this category?')) return;
      await mutate('deleteCategory', {id:b.dataset.del}, 'Category deleted');
    });
  }

  /* ---------------- Gallery ---------------- */
  function renderGallery(main,d){
    const list = d.gallery||[];
    main.innerHTML = adminHead('Gallery', list.length+' images')+
      '<div class="admin-form"><h3>Add Gallery Image</h3>'+
        '<form id="galForm">'+
          '<input type="hidden" id="gId">'+
          '<div class="form-grid">'+
            '<div class="field full"><label>Image URL *</label><input id="gImg" required></div>'+
            '<div class="field"><label>Caption</label><input id="gCap"></div>'+
            '<div class="field"><label>Link (Instagram)</label><input id="gUrl"></div>'+
            '<div class="field"><label>Sort order</label><input id="gSort" type="number"></div>'+
            '<div class="field"><label><input type="checkbox" id="gEnabled" checked> Enabled</label></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">Save Image</button>'+
        '</form>'+
      '</div>'+
      '<table class="admin-table"><thead><tr><th>Caption</th><th>URL</th><th>Enabled</th><th></th></tr></thead><tbody>'+
        (list.length ? list.map(g=>'<tr>'+
          '<td>'+esc(g.caption||'')+'</td>'+
          '<td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(g.image||'')+'</td>'+
          '<td>'+esc(g.enabled)+'</td>'+
          '<td class="actions"><button class="mini-btn" data-edit="'+esc(g.id)+'">Edit</button>'+
          '<button class="mini-btn danger" data-del="'+esc(g.id)+'">Delete</button></td>'+
        '</tr>').join('') : '<tr><td colspan="4" class="empty">No gallery images yet.</td></tr>')+
      '</tbody></table>';

    bindRefresh();
    document.getElementById('galForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('gId').value || undefined,
        image: document.getElementById('gImg').value.trim(),
        caption: document.getElementById('gCap').value.trim(),
        url: document.getElementById('gUrl').value.trim(),
        sortOrder: document.getElementById('gSort').value || 0,
        enabled: document.getElementById('gEnabled').checked ? 'TRUE' : 'FALSE'
      };
      if(!payload.image){ toast('Image URL is required'); return; }
      await mutate('saveGallery', payload, 'Gallery updated');
    };
    $$('[data-edit]').forEach(b=>b.onclick=()=>{
      const g = list.find(x=>x.id===b.dataset.edit); if(!g) return;
      document.getElementById('gId').value=g.id||'';
      document.getElementById('gImg').value=g.image||'';
      document.getElementById('gCap').value=g.caption||'';
      document.getElementById('gUrl').value=g.url||'';
      document.getElementById('gSort').value=g.sortOrder||0;
      document.getElementById('gEnabled').checked=String(g.enabled).toUpperCase()!=='FALSE';
    });
    $$('[data-del]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Delete this image?')) return;
      await mutate('deleteGallery', {id:b.dataset.del}, 'Image deleted');
    });
  }

  /* ---------------- Testimonials ---------------- */
  function renderTestimonials(main,d){
    const list = d.testimonials||[];
    main.innerHTML = adminHead('Testimonials', list.length+' total')+
      '<div class="admin-form"><h3>Add / Edit Testimonial</h3>'+
        '<form id="testForm">'+
          '<input type="hidden" id="tId">'+
          '<div class="form-grid">'+
            '<div class="field"><label>Name *</label><input id="tName" required></div>'+
            '<div class="field"><label>Rating (1–5)</label><input id="tRate" type="number" min="1" max="5" value="5"></div>'+
            '<div class="field full"><label>Review *</label><textarea id="tRev" required></textarea></div>'+
            '<div class="field"><label>Sort order</label><input id="tSort" type="number"></div>'+
            '<div class="field"><label><input type="checkbox" id="tEnabled" checked> Enabled</label></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">Save Testimonial</button>'+
        '</form>'+
      '</div>'+
      '<table class="admin-table"><thead><tr><th>Name</th><th>Rating</th><th>Review</th><th>Enabled</th><th></th></tr></thead><tbody>'+
        (list.length ? list.map(t=>'<tr>'+
          '<td>'+esc(t.name)+'</td><td>'+esc(t.rating)+'</td>'+
          '<td style="max-width:300px">'+esc((t.review||'').slice(0,80))+'…</td>'+
          '<td>'+esc(t.enabled)+'</td>'+
          '<td class="actions"><button class="mini-btn" data-edit="'+esc(t.id)+'">Edit</button>'+
          '<button class="mini-btn danger" data-del="'+esc(t.id)+'">Delete</button></td>'+
        '</tr>').join('') : '<tr><td colspan="5" class="empty">No testimonials yet. Section is hidden until you add one.</td></tr>')+
      '</tbody></table>';

    bindRefresh();
    document.getElementById('testForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('tId').value || undefined,
        name: document.getElementById('tName').value.trim(),
        rating: document.getElementById('tRate').value,
        review: document.getElementById('tRev').value.trim(),
        sortOrder: document.getElementById('tSort').value || 0,
        enabled: document.getElementById('tEnabled').checked ? 'TRUE' : 'FALSE'
      };
      if(!payload.name || !payload.review){ toast('Name and review required'); return; }
      await mutate('saveTestimonial', payload, 'Testimonial saved');
    };
    $$('[data-edit]').forEach(b=>b.onclick=()=>{
      const t = list.find(x=>x.id===b.dataset.edit); if(!t) return;
      document.getElementById('tId').value=t.id||'';
      document.getElementById('tName').value=t.name||'';
      document.getElementById('tRate').value=t.rating||5;
      document.getElementById('tRev').value=t.review||'';
      document.getElementById('tSort').value=t.sortOrder||0;
      document.getElementById('tEnabled').checked=String(t.enabled).toUpperCase()!=='FALSE';
    });
    $$('[data-del]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Delete this testimonial?')) return;
      await mutate('deleteTestimonial', {id:b.dataset.del}, 'Testimonial deleted');
    });
  }

  /* ---------------- Enquiries ---------------- */
  function renderEnquiries(main,d){
    const list = (d.enquiries||[]).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    main.innerHTML = adminHead('Enquiries', list.length+' total')+
      '<table class="admin-table"><thead><tr><th>Date</th><th>Name</th><th>Phone</th><th>Message</th><th>Status</th></tr></thead><tbody>'+
        (list.length ? list.map(e=>'<tr>'+
          '<td>'+esc(e.createdAt||'')+'</td>'+
          '<td>'+esc(e.name||'')+'</td>'+
          '<td>'+esc(e.phone||'')+'</td>'+
          '<td style="max-width:320px">'+esc((e.message||'').slice(0,120))+'</td>'+
          '<td><select data-eid="'+esc(e.id)+'">'+
            ['New','Contacted','Completed','Cancelled'].map(s=>'<option'+(String(e.status)===s?' selected':'')+'>'+s+'</option>').join('')+
          '</select></td>'+
        '</tr>').join('') : '<tr><td colspan="5" class="empty">No enquiries yet.</td></tr>')+
      '</tbody></table>';
    bindRefresh();
    $$('[data-eid]').forEach(sel=>sel.onchange=async()=>{
      await mutate('updateEnquiry', {id:sel.dataset.eid, status:sel.value}, 'Enquiry updated');
    });
  }

  /* ---------------- Appointments ---------------- */
  function renderAppointments(main,d){
    const list = (d.appointments||[]).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    main.innerHTML = adminHead('Appointments', list.length+' total')+
      '<table class="admin-table"><thead><tr><th>Date</th><th>Name</th><th>Phone</th><th>Preferred</th><th>Service</th><th>Status</th></tr></thead><tbody>'+
        (list.length ? list.map(a=>'<tr>'+
          '<td>'+esc(a.createdAt||'')+'</td>'+
          '<td>'+esc(a.name||'')+'</td>'+
          '<td>'+esc(a.phone||'')+'</td>'+
          '<td>'+esc((a.date||'')+' '+(a.time||''))+'</td>'+
          '<td>'+esc(a.service||'')+'</td>'+
          '<td><select data-aid="'+esc(a.id)+'">'+
            ['New','Confirmed','Completed','Cancelled'].map(s=>'<option'+(String(a.status)===s?' selected':'')+'>'+s+'</option>').join('')+
          '</select></td>'+
        '</tr>').join('') : '<tr><td colspan="6" class="empty">No appointments yet.</td></tr>')+
      '</tbody></table>';
    bindRefresh();
    $$('[data-aid]').forEach(sel=>sel.onchange=async()=>{
      await mutate('updateAppointment', {id:sel.dataset.aid, status:sel.value}, 'Appointment updated');
    });
  }

  /* ---------------- Settings ---------------- */
  function renderSettings(main,d){
    const s = d.settings||{};
    main.innerHTML = adminHead('Settings')+
      '<div class="admin-form"><h3>Store Information</h3>'+
        '<form id="setForm">'+
          '<div class="form-grid">'+
            '<div class="field"><label>Brand Name</label><input id="sBrand" value="'+esc(s.brandName||'')+'"></div>'+
            '<div class="field"><label>Instagram Handle</label><input id="sIg" value="'+esc(s.instagram||'')+'"></div>'+
            '<div class="field"><label>Instagram URL</label><input id="sIgUrl" value="'+esc(s.instagramUrl||'')+'"></div>'+
            '<div class="field"><label>WhatsApp (digits only, e.g. 919876543210)</label><input id="sWa" value="'+esc(s.whatsapp||'')+'"></div>'+
            '<div class="field"><label>Phone</label><input id="sPhone" value="'+esc(s.phone||'')+'"></div>'+
            '<div class="field"><label>Email</label><input id="sEmail" value="'+esc(s.email||'')+'"></div>'+
            '<div class="field full"><label>Address</label><input id="sAddress" value="'+esc(s.address||'')+'"></div>'+
            '<div class="field"><label>City</label><input id="sCity" value="'+esc(s.city||'')+'"></div>'+
            '<div class="field full"><label>Google Maps URL</label><input id="sMaps" value="'+esc(s.mapsUrl||'')+'"></div>'+
            '<div class="field full"><label>Opening Hours</label><input id="sHours" value="'+esc(s.hours||'')+'"></div>'+
            '<div class="field full"><label>Announcement Bar</label><input id="sAnnounce" value="'+esc(s.announcement||'')+'"></div>'+
            '<div class="field"><label>Hero Title</label><input id="sHeroTitle" value="'+esc(s.heroTitle||'')+'"></div>'+
            '<div class="field"><label>Hero Image URL</label><input id="sHeroImg" value="'+esc(s.heroImage||'')+'"></div>'+
            '<div class="field full"><label>Hero Description</label><input id="sHeroDesc" value="'+esc(s.heroDescription||'')+'"></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">Save Settings</button>'+
        '</form>'+
      '</div>';
    bindRefresh();
    document.getElementById('setForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        brandName: document.getElementById('sBrand').value.trim(),
        instagram: document.getElementById('sIg').value.trim(),
        instagramUrl: document.getElementById('sIgUrl').value.trim(),
        whatsapp: document.getElementById('sWa').value.trim(),
        phone: document.getElementById('sPhone').value.trim(),
        email: document.getElementById('sEmail').value.trim(),
        address: document.getElementById('sAddress').value.trim(),
        city: document.getElementById('sCity').value.trim(),
        mapsUrl: document.getElementById('sMaps').value.trim(),
        hours: document.getElementById('sHours').value.trim(),
        announcement: document.getElementById('sAnnounce').value.trim(),
        heroTitle: document.getElementById('sHeroTitle').value.trim(),
        heroImage: document.getElementById('sHeroImg').value.trim(),
        heroDescription: document.getElementById('sHeroDesc').value.trim()
      };
      await mutate('saveSettings', {settings: payload}, 'Settings saved');
    };
  }

  /* ---------------- Theme ---------------- */
  function renderTheme(main,d){
    const t = Object.assign({}, CFG.DEFAULT_THEME, d.theme||{});
    const colorFields = [
      ['primaryColor','Primary'],
      ['secondaryColor','Secondary'],
      ['accentColor','Accent / Gold'],
      ['backgroundColor','Background'],
      ['surfaceColor','Surface'],
      ['textColor','Text'],
      ['mutedColor','Muted'],
      ['darkColor','Dark Sections'],
      ['buttonColor','Button Background'],
      ['buttonTextColor','Button Text'],
      ['announcementColor','Announcement BG'],
      ['announcementTextColor','Announcement Text']
    ];
    main.innerHTML = adminHead('Theme / Colors')+
      '<div class="admin-form">'+
        '<h3>Color Palette</h3>'+
        '<div class="color-grid">'+
          colorFields.map(([k,label])=>
            '<div class="color-field">'+
              '<label>'+esc(label)+'</label>'+
              '<input type="color" id="col_'+k+'" value="'+esc(t[k]||'#000000')+'">'+
              '<input type="text" id="txt_'+k+'" value="'+esc(t[k]||'')+'" spellcheck="false">'+
            '</div>'
          ).join('')+
        '</div>'+
        '<h3 class="mt-3">Typography &amp; Shape</h3>'+
        '<div class="form-grid">'+
          '<div class="field"><label>Heading font</label><input id="fHead" value="'+esc(t.fontHeading||'')+'"></div>'+
          '<div class="field"><label>Body font</label><input id="fBody" value="'+esc(t.fontBody||'')+'"></div>'+
          '<div class="field"><label>Border radius</label><input id="fRadius" value="'+esc(t.borderRadius||'3px')+'"></div>'+
        '</div>'+
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">'+
          '<button class="btn btn-primary btn-sm" id="saveTheme">Save Theme</button>'+
          '<button class="btn btn-outline btn-sm" id="previewTheme">Preview</button>'+
          '<button class="btn btn-outline btn-sm" id="resetTheme">Reset to Default</button>'+
        '</div>'+
      '</div>';

    /* bind color inputs */
    colorFields.forEach(([k])=>{
      const c = document.getElementById('col_'+k), x = document.getElementById('txt_'+k);
      c.oninput = () => { x.value = c.value; };
      x.oninput = () => { if(/^#?[0-9a-f]{3,8}$/i.test(x.value.trim())) c.value = x.value.trim(); };
    });

    function collect(){
      const out = {};
      colorFields.forEach(([k])=>{ out[k] = document.getElementById('txt_'+k).value.trim() || document.getElementById('col_'+k).value; });
      out.fontHeading = document.getElementById('fHead').value.trim();
      out.fontBody = document.getElementById('fBody').value.trim();
      out.borderRadius = document.getElementById('fRadius').value.trim();
      return out;
    }

    document.getElementById('previewTheme').onclick = () => {
      window.Theme.apply(collect());
      toast('Preview applied — not yet saved');
    };
    document.getElementById('resetTheme').onclick = () => {
      if(!confirm('Reset theme to defaults?')) return;
      Object.keys(CFG.DEFAULT_THEME).forEach(k=>{
        const c = document.getElementById('col_'+k), x = document.getElementById('txt_'+k);
        if(c) c.value = CFG.DEFAULT_THEME[k];
        if(x) x.value = CFG.DEFAULT_THEME[k];
      });
      document.getElementById('fHead').value = CFG.DEFAULT_THEME.fontHeading;
      document.getElementById('fBody').value = CFG.DEFAULT_THEME.fontBody;
      document.getElementById('fRadius').value = CFG.DEFAULT_THEME.borderRadius;
      window.Theme.apply(CFG.DEFAULT_THEME);
      toast('Reset to default — click Save Theme to persist');
    };
    document.getElementById('saveTheme').onclick = async () => {
      const payload = collect();
      await mutate('saveTheme', {theme: payload}, 'Theme saved');
      window.Theme.apply(payload);
    };

    bindRefresh();
  }

  /* ---------------- Navigation ---------------- */
  function renderNavigation(main,d){
    const list = (d.navigation||[]).slice().sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
    main.innerHTML = adminHead('Navigation')+
      '<div class="admin-form"><h3>Add / Edit Nav Item</h3>'+
        '<form id="navForm">'+
          '<input type="hidden" id="nId">'+
          '<div class="form-grid">'+
            '<div class="field"><label>Label *</label><input id="nLabel" required></div>'+
            '<div class="field"><label>Href *</label><input id="nHref" placeholder="#/catalogue" required></div>'+
            '<div class="field"><label>Sort order</label><input id="nSort" type="number"></div>'+
            '<div class="field"><label><input type="checkbox" id="nEnabled" checked> Enabled</label></div>'+
          '</div>'+
          '<button class="btn btn-primary btn-sm" type="submit">Save Nav Item</button>'+
        '</form>'+
      '</div>'+
      '<table class="admin-table"><thead><tr><th>Label</th><th>Href</th><th>Order</th><th>Enabled</th><th></th></tr></thead><tbody>'+
        (list.length ? list.map(n=>'<tr>'+
          '<td>'+esc(n.label)+'</td><td>'+esc(n.href)+'</td><td>'+esc(n.sortOrder)+'</td><td>'+esc(n.enabled)+'</td>'+
          '<td class="actions"><button class="mini-btn" data-edit="'+esc(n.id)+'">Edit</button>'+
          '<button class="mini-btn danger" data-del="'+esc(n.id)+'">Delete</button></td>'+
        '</tr>').join('') : '<tr><td colspan="5" class="empty">No navigation items yet.</td></tr>')+
      '</tbody></table>';

    bindRefresh();
    document.getElementById('navForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('nId').value || undefined,
        label: document.getElementById('nLabel').value.trim(),
        href: document.getElementById('nHref').value.trim(),
        sortOrder: document.getElementById('nSort').value || 0,
        enabled: document.getElementById('nEnabled').checked ? 'TRUE' : 'FALSE'
      };
      if(!payload.label || !payload.href){ toast('Label and href required'); return; }
      await mutate('saveNavigation', payload, 'Nav item saved');
    };
    $$('[data-edit]').forEach(b=>b.onclick=()=>{
      const n = list.find(x=>x.id===b.dataset.edit); if(!n) return;
      document.getElementById('nId').value=n.id||'';
      document.getElementById('nLabel').value=n.label||'';
      document.getElementById('nHref').value=n.href||'';
      document.getElementById('nSort').value=n.sortOrder||0;
      document.getElementById('nEnabled').checked=String(n.enabled).toUpperCase()!=='FALSE';
    });
    $$('[data-del]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Delete this navigation item?')) return;
      await mutate('deleteNavigation', {id:b.dataset.del}, 'Nav item deleted');
    });
  }

  /* ---------------- Features ---------------- */
  function renderFeatures(main,d){
    const f = Object.assign({}, CFG.DEFAULT_FEATURES, d.features||{});
    const rows = Object.keys(f).map(k =>
      '<tr><td>'+esc(k)+'</td>'+
      '<td><select data-fk="'+esc(k)+'">'+
        '<option'+(String(f[k]).toUpperCase()==='TRUE'?' selected':'')+'>TRUE</option>'+
        '<option'+(String(f[k]).toUpperCase()==='FALSE'?' selected':'')+'>FALSE</option>'+
      '</select></td></tr>'
    ).join('');
    main.innerHTML = adminHead('Features')+
      '<div class="admin-form"><h3>Toggle Site Features</h3>'+
        '<table class="admin-table"><thead><tr><th>Feature</th><th>Enabled</th></tr></thead><tbody>'+rows+'</tbody></table>'+
      '</div>';
    bindRefresh();
    $$('[data-fk]').forEach(sel=>sel.onchange=async()=>{
      const next = Object.assign({}, f); next[sel.dataset.fk] = sel.value;
      await mutate('saveFeatures', {features: next}, 'Feature updated');
    });
  }

  /* ---------------- API Status ---------------- */
  function renderApiStatus(main){
    main.innerHTML = adminHead('API Status')+
      '<div class="api-panel">'+
        '<div class="api-row"><span>Endpoint</span><span style="word-break:break-all;max-width:60%">'+esc(CFG.API_BASE)+'</span></div>'+
        '<div class="api-row"><span>API version</span><span>'+esc(CFG.API_VERSION)+'</span></div>'+
        '<div class="api-row"><span>Session token</span><span>'+esc(state.token?state.token.slice(0,12)+'…':'none')+'</span></div>'+
        '<div class="api-row"><span>Last sync</span><span id="apiLastSync">'+esc(state.lastSyncAt?new Date(state.lastSyncAt).toLocaleString():'—')+'</span></div>'+
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1.5rem">'+
          '<button class="btn btn-primary btn-sm" id="doPing">Check API</button>'+
          '<button class="btn btn-outline btn-sm" id="doReload">Refresh Site Data</button>'+
        '</div>'+
        '<div id="apiResult" class="mt-3" style="font-size:.88rem"></div>'+
      '</div>';

    document.getElementById('doPing').onclick = async () => {
      const out = document.getElementById('apiResult');
      out.textContent = 'Pinging…';
      const res = await API.ping(state.token);
      out.innerHTML = '<div class="api-row"><span>API reachable</span><span>'+(res.ok?'<span class="badge ok">YES</span>':'<span class="badge err">NO</span>')+'</span></div>'+
        '<div class="api-row"><span>Response time</span><span>'+res.ms+' ms</span></div>'+
        (res.error?'<div class="api-row"><span>Error</span><span style="color:#c0392b">'+esc(res.error)+'</span></div>':'');
    };
    document.getElementById('doReload').onclick = async () => {
      const out = document.getElementById('apiResult');
      out.textContent = 'Refreshing…';
      try{
        const res = await API.adminData(state.token);
        if(res && res.success){ state.data = res.data; state.lastSyncAt = Date.now(); out.textContent='Refreshed.'; setTimeout(()=>renderShell(document.getElementById('main')),400); }
        else out.textContent = 'Refresh failed.';
      }catch(e){ out.textContent = 'Refresh failed.'; }
    };
    bindRefresh();
  }

  /* ---------------- mutate helper ---------------- */
  async function mutate(action, payload, successMsg){
    try{
      const res = await API.adminMutation(action, state.token, payload);
      if(res && res.success){
        state.lastAction = action+' @ '+new Date().toLocaleTimeString();
        toast(successMsg||'Saved');
        const fresh = await API.adminData(state.token);
        if(fresh && fresh.success){ state.data = fresh.data; state.lastSyncAt=Date.now(); }
        renderShell(document.getElementById('main'));
        return true;
      }
      if(res && res.error && res.error.code === 'UNAUTHORIZED'){
        clearSession();
        toast('Session expired — sign in again.');
        mount(document.getElementById('main'));
        return false;
      }
      toast(res && res.error ? res.error.message : 'Save failed');
      return false;
    }catch(err){
      toast('Could not reach the server. Try again.');
      return false;
    }
  }

  window.Admin = { mount };
})();
