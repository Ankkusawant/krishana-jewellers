
/* Krishana Jewellers — public site
   Renders from window.APP_DATA (fetched by api.js).
   No gold rate code anywhere. */
(function(){
  const CFG = window.APP_CONFIG;
  let APP_DATA = null;          // set by boot()
  let RING_3D_CLEANUP = null;

  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function waLink(msg){
    const num = (APP_DATA?.settings?.whatsapp||'').replace(/\D/g,'');
    if(!num) return '#';
    return 'https://wa.me/'+num+'?text='+encodeURIComponent(msg||'Hello, I would like to know more about your jewellery.');
  }
  function toast(m){
    const t=$('#toast'); if(!t) return; t.textContent=m; t.classList.add('show');
    clearTimeout(t._tid); t._tid=setTimeout(()=>t.classList.remove('show'),2600);
  }
  function fmtDate(iso){try{return new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return iso;}}
  function slugify(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
  function debounce(fn,ms){let t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}

  /* ---------- Icons ---------- */
  const ICONS = {
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5l1.5-1.5-2-1-1 .5c-1-.5-1.5-1-2-2l.5-1-1-2z" fill="currentColor" stroke="none"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>',
    gem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l4 6-4 14L8 8z"/><path d="M2 8h20M12 2v20"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };

  /* ---------- placeholders ---------- */
  function jewelImg(seed){
    const p=[['#F2ECE1','#E8D7B5'],['#FAF7F0','#EFE4CE'],['#F5EFE3','#E3D2AE'],['#F7F1E6','#DFCDA5']][Math.abs(seed)%4];
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs><rect width="600" height="750" fill="url(#g)"/><g transform="translate(300,375)" fill="none" stroke="#B88A2E" stroke-width="4"><path d="M0,-130 L78,0 L0,130 L-78,0 Z"/><circle r="14" fill="#B88A2E" stroke="none"/></g></svg>';
    return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
  }
  function heroImg(){
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2622"/><stop offset="1" stop-color="#1d1a17"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>';
    return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
  }
  function imgOr(url, seed){
    if(url && typeof url === 'string' && url.trim()) return url;
    return jewelImg(seed||1);
  }

  /* ---------- product card ---------- */
  function productCard(p){
    const wish = isWished(p.id);
    const price = p.price ? '₹'+Number(p.price).toLocaleString('en-IN') : 'Price on Request';
    return '<article class="prod-card">'+
      '<div class="prod-media">'+
        '<div class="prod-tags">'+(p.newArrival?'<span class="tag new">New</span>':'')+'</div>'+
        (CFG.DEFAULT_FEATURES.enableWishlist==='TRUE' ? '<button class="wish '+(wish?'on':'')+'" data-wish="'+esc(p.id)+'" aria-label="Wishlist">'+ICONS.heart+'</button>' : '')+
        '<a href="#/product/'+esc(p.slug)+'" aria-label="'+esc(p.name)+'"><img src="'+esc(imgOr(p.image, p.id.charCodeAt(1)||1))+'" alt="'+esc(p.name)+'" loading="lazy" onerror="this.src=\''+jewelImg(1)+'\'"></a>'+
      '</div>'+
      '<div class="prod-body">'+
        '<span class="prod-cat">'+esc(p.category)+'</span>'+
        '<h3 class="prod-name"><a href="#/product/'+esc(p.slug)+'">'+esc(p.name)+'</a></h3>'+
        '<div class="prod-price">'+esc(price)+'</div>'+
        '<div class="prod-actions"><a class="btn btn-outline btn-sm btn-block" href="#/product/'+esc(p.slug)+'">View Details</a></div>'+
      '</div>'+
    '</article>';
  }

  /* ---------- wishlist (localStorage convenience only) ---------- */
  const WISH_KEY='kj_wishlist_v2';
  function getWish(){try{return JSON.parse(localStorage.getItem(WISH_KEY)||'[]');}catch(e){return [];}}
  function isWished(id){return getWish().indexOf(id)>=0;}
  function toggleWish(id){
    let w=getWish();const i=w.indexOf(id);
    if(i>=0)w.splice(i,1);else w.push(id);
    try{localStorage.setItem(WISH_KEY,JSON.stringify(w));}catch(e){}
    toast(i>=0?'Removed from wishlist':'Added to wishlist');
    render();
  }

  /* ---------- crumbs + chrome ---------- */
  function crumb(items){
    return '<div class="container"><div class="crumb">'+items.map((it,i)=>(i<items.length-1&&it.href)?'<a href="'+it.href+'">'+esc(it.label)+'</a><span>/</span>':'<span style="opacity:1;color:var(--ink)">'+esc(it.label)+'</span>').join('')+'</div></div>';
  }

  function renderChrome(){
    const s = APP_DATA.settings || {};
    const nav = (APP_DATA.navigation||[]).filter(n=>String(n.enabled).toUpperCase()==='TRUE').sort((a,b)=>a.sortOrder-b.sortOrder);
    document.getElementById('announce').textContent = s.announcement || '';
    const navHtml = nav.map(l=>'<a href="'+esc(l.href)+'">'+esc(l.label)+'</a>').join('');
    document.getElementById('mainNav').innerHTML = navHtml;
    document.getElementById('mobileNav').innerHTML = navHtml + '<a href="#/book-appointment">Book Appointment</a>';
    const wa = waLink();
    document.getElementById('waBtn').href = wa;
    document.getElementById('igBtn').href = s.instagramUrl || '#';
    if(s.brandName) document.title = document.title.replace(/Krishana Jewellers/, s.brandName);

    /* favicon */
    if(s.favicon){
      const l = document.querySelector('link[rel="icon"]');
      if(l) l.href = s.favicon;
    }

    document.getElementById('footer').innerHTML =
      '<div class="container">'+
        '<div class="footer-grid">'+
          '<div class="footer-brand"><div class="logo-mark">'+esc(s.brandName||'Krishana Jewellers')+'</div>'+
            '<div class="logo-sub">Est. Showroom</div>'+
            '<p>Discover elegant gold jewellery designed for celebrations, traditions and everyday memories.</p>'+
            '<div class="footer-social">'+
              '<a href="'+esc(s.instagramUrl||'#')+'" target="_blank" rel="noopener" aria-label="Instagram">'+ICONS.ig+'</a>'+
              '<a href="'+esc(wa)+'" target="_blank" rel="noopener" aria-label="WhatsApp">'+ICONS.wa+'</a>'+
              '<a href="tel:'+esc((s.phone||'').replace(/\s/g,''))+'" aria-label="Call">'+ICONS.phone+'</a>'+
            '</div>'+
          '</div>'+
          '<div><h4>Collections</h4><ul>'+
            '<li><a href="#/gold-jewellery">Gold Jewellery</a></li>'+
            '<li><a href="#/bridal-jewellery">Bridal</a></li>'+
            '<li><a href="#/catalogue">Catalogue</a></li>'+
            '<li><a href="#/new-arrivals">New Arrivals</a></li>'+
          '</ul></div>'+
          '<div><h4>Customer Care</h4><ul>'+
            '<li><a href="#/contact">Contact</a></li>'+
            '<li><a href="#/book-appointment">Book Appointment</a></li>'+
            '<li><a href="'+esc(wa)+'" target="_blank" rel="noopener">WhatsApp</a></li>'+
            '<li><a href="#/showroom">Showroom</a></li>'+
          '</ul></div>'+
          '<div><h4>Company</h4><ul>'+
            '<li><a href="#/about">About</a></li>'+
            '<li><a href="#/showroom">Showroom</a></li>'+
            '<li><a href="'+esc(s.instagramUrl||'#')+'" target="_blank" rel="noopener">Instagram</a></li>'+
          '</ul></div>'+
          '<div><h4>Legal</h4><ul>'+
            '<li><a href="#/privacy">Privacy Policy</a></li>'+
            '<li><a href="#/terms">Terms</a></li>'+
          '</ul></div>'+
        '</div>'+
        '<div class="footer-bottom"><span>© 2026 '+esc(s.brandName||'Krishana Jewellers')+'. All Rights Reserved.</span>'+
          '<div class="footer-legal"><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a></div>'+
        '</div>'+
      '</div>';

    document.getElementById('mobileBar').innerHTML =
      '<a href="tel:'+esc((s.phone||'').replace(/\s/g,''))+'">'+ICONS.phone+'<span>Call</span></a>'+
      '<a href="'+esc(wa)+'" target="_blank" rel="noopener">'+ICONS.wa+'<span>WhatsApp</span></a>'+
      '<a href="'+esc(s.mapsUrl||'#')+'" target="_blank" rel="noopener">'+ICONS.pin+'<span>Directions</span></a>';
  }

  /* ---------- structured data ---------- */
  function updateStructuredData(match){
    const s = APP_DATA.settings||{};
    const store = {
      "@context":"https://schema.org","@type":"JewelryStore",
      "name": s.brandName || "Krishana Jewellers",
      "image": s.heroImage || undefined,
      "telephone": s.phone || undefined,
      "email": s.email || undefined,
      "address": s.address ? {"@type":"PostalAddress","streetAddress":s.address,"addressLocality":s.city||""} : undefined,
      "url": location.origin + location.pathname,
      "openingHours": s.hours || undefined,
      "sameAs": s.instagramUrl ? [s.instagramUrl] : undefined
    };
    Object.keys(store).forEach(k=>{ if(store[k]===undefined) delete store[k]; });
    document.getElementById('ld-store').textContent = JSON.stringify(store);

    let page = {"@context":"https://schema.org","@type":"WebPage","name":document.title,"url":location.href};
    if(match && match.route.path === '/product/:slug'){
      const p = APP_DATA.products.find(x=>x.slug===match.params.slug);
      if(p){
        page = {"@context":"https://schema.org","@type":"Product","name":p.name,"description":p.description||p.name,"sku":p.sku||undefined,"brand":{"@type":"Brand","name":s.brandName||"Krishana Jewellers"},"image":p.image||undefined};
        if(p.price){
          page.offers = {"@type":"Offer","priceCurrency":"INR","price":String(p.price),"availability":"https://schema.org/InStock"};
        }
        Object.keys(page).forEach(k=>{ if(page[k]===undefined) delete page[k]; });
      }
    }
    document.getElementById('ld-page').textContent = JSON.stringify(page);
  }

  /* ---------- views ---------- */
  function viewHome(){
    const s=APP_DATA.settings||{};
    const cats=(APP_DATA.categories||[]).filter(c=>String(c.enabled).toUpperCase()==='TRUE').slice(0,6);
    const featured=(APP_DATA.products||[]).filter(p=>String(p.featured).toUpperCase()==='TRUE').slice(0,8);
    const newArr=(APP_DATA.products||[]).filter(p=>String(p.newArrival).toUpperCase()==='TRUE').slice(0,4);
    const wa=waLink();
    const feats=APP_DATA.features||{};

    let html='';

    /* Hero */
    html+='<section class="hero"><div class="hero-bg"><img src="'+esc(imgOr(s.heroImage,0))+'" alt=""></div>'+
      '<div class="hero-content">'+
        '<span class="eyebrow">'+esc(s.brandName||'Krishana Jewellers')+'</span>'+
        '<h1>'+esc(s.heroTitle||'Jewellery Made for Your Moments')+'</h1>'+
        '<p class="hero-sub">'+esc(s.heroDescription||'Discover elegant gold jewellery designed for celebrations, traditions and everyday memories.')+'</p>'+
        '<div class="hero-cta">'+
          '<a class="btn btn-gold" href="#/catalogue">Explore Collection</a>'+
          '<a class="btn btn-outline-light" href="'+esc(wa)+'" target="_blank" rel="noopener">WhatsApp Us</a>'+
        '</div>'+
        '<div class="hero-visit"><a href="#/showroom">Visit Our Showroom →</a></div>'+
      '</div></section>';

    /* Quick actions */
    html+='<section class="quick">'+
      '<a href="#/catalogue">'+ICONS.gem+'<span>Explore Jewellery</span></a>'+
      '<a href="'+esc(wa)+'" target="_blank" rel="noopener">'+ICONS.wa+'<span>WhatsApp Us</span></a>'+
      '<a href="#/book-appointment">'+ICONS.cal+'<span>Book a Visit</span></a>'+
      '<a href="'+esc(s.mapsUrl||'#')+'" target="_blank" rel="noopener">'+ICONS.pin+'<span>Get Directions</span></a>'+
    '</section>';

    /* NOTE: "Today's Gold Rate" section intentionally removed. */

    /* Categories */
    if(cats.length){
      html+='<section class="section"><div class="container">'+
        '<div class="center mb-3"><span class="eyebrow">Shop by</span><h2>Jewellery Categories</h2>'+
        '<p class="lede">Browse our collections by category and find the piece that fits your moment.</p></div>'+
        '<div class="cat-grid">'+
          cats.map((c,i)=>'<a class="cat-card" href="#/category/'+esc(c.slug)+'">'+
            '<img src="'+esc(imgOr(c.image, i+3))+'" alt="'+esc(c.name)+'" loading="lazy" onerror="this.src=\''+jewelImg(i+3)+'\'">'+
            '<div class="cat-body"><h3>'+esc(c.name)+'</h3><p>'+esc(c.description||'')+'</p><span class="explore">Explore →</span></div>'+
          '</a>').join('')+
        '</div>'+
      '</div></section>';
    }

    /* Featured */
    if(featured.length){
      html+='<section class="section" style="background:var(--beige)"><div class="container">'+
        '<div class="center mb-3"><span class="eyebrow">Featured</span><h2>Featured Jewellery</h2></div>'+
        '<div class="prod-grid">'+featured.map(productCard).join('')+'</div>'+
        '<div class="center mt-3"><a class="btn btn-outline" href="#/catalogue">View All Jewellery</a></div>'+
      '</div></section>';
    }

    /* Bridal */
    html+='<section class="section"><div class="container"><div class="split">'+
      '<div class="split-media"><img src="'+jewelImg(2)+'" alt="Bridal jewellery" loading="lazy"></div>'+
      '<div class="split-body"><span class="eyebrow">Bridal</span>'+
        '<h2>Your Wedding. Your Jewellery. Your Story.</h2>'+
        '<p class="lede">Explore bridal sets, necklaces, earrings, bangles, mangalsutra and rings — chosen to make your day feel like yours.</p>'+
        '<div style="display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1.5rem">'+
          '<a class="btn btn-primary" href="#/bridal-jewellery">Explore Bridal</a>'+
          '<a class="btn btn-outline" href="#/book-appointment">Book a Bridal Consultation</a>'+
        '</div></div></div></div></section>';

    /* New arrivals */
    if(newArr.length){
      html+='<section class="section-tight" style="background:var(--beige)"><div class="container">'+
        '<div class="center mb-3"><span class="eyebrow">Just In</span><h2>New Arrivals</h2></div>'+
        '<div class="prod-grid">'+newArr.map(productCard).join('')+'</div>'+
      '</div></section>';
    }

    /* Trust */
    if(String(feats.showTrustSection||'TRUE').toUpperCase()==='TRUE'){
      html+='<section class="section"><div class="container">'+
        '<div class="center mb-3"><span class="eyebrow">Why '+esc((s.brandName||'Krishana').split(' ')[0])+'</span><h2>Why '+esc(s.brandName||'Krishana Jewellers')+'</h2></div>'+
        '<div class="trust-grid">'+
          '<div class="trust-card"><div class="trust-icon">'+ICONS.sparkle+'</div><h3>Personal Service</h3><p>A jewellery experience centered around your needs.</p></div>'+
          '<div class="trust-card"><div class="trust-icon">'+ICONS.gem+'</div><h3>Beautiful Craftsmanship</h3><p>Thoughtfully selected designs for meaningful occasions.</p></div>'+
          '<div class="trust-card"><div class="trust-icon">'+ICONS.pin+'</div><h3>Showroom Experience</h3><p>See and experience jewellery in person.</p></div>'+
          '<div class="trust-card"><div class="trust-icon">'+ICONS.shield+'</div><h3>Trust &amp; Transparency</h3><p>Clear product information and personal assistance.</p></div>'+
        '</div>'+
      '</div></section>';
    }

    /* Showroom */
    if(String(feats.showShowroom||'TRUE').toUpperCase()==='TRUE'){
      html+='<section class="showroom"><div class="container section"><div class="split">'+
        '<div><span class="eyebrow">Visit Us</span><h2>Visit Us in Person</h2>'+
          '<p class="lede">Step into our showroom to see the collections up close.</p>'+
          '<div class="showroom-info mt-3">'+
            '<div class="info-row">'+ICONS.pin+'<div><strong>Address</strong><span>'+esc(s.address||'')+'</span></div></div>'+
            '<div class="info-row">'+ICONS.phone+'<div><strong>Phone</strong><span>'+esc(s.phone||'')+'</span></div></div>'+
            '<div class="info-row">'+ICONS.wa+'<div><strong>WhatsApp</strong><span>'+esc(s.whatsapp||'')+'</span></div></div>'+
            '<div class="info-row">'+ICONS.clock+'<div><strong>Opening Hours</strong><span>'+esc(s.hours||'')+'</span></div></div>'+
          '</div>'+
          '<div class="showroom-cta">'+
            '<a class="btn btn-gold" href="'+esc(s.mapsUrl||'#')+'" target="_blank" rel="noopener">Get Directions</a>'+
            '<a class="btn btn-outline-light" href="tel:'+esc((s.phone||'').replace(/\s/g,''))+'">Call Now</a>'+
            '<a class="btn btn-wa" href="'+esc(wa)+'" target="_blank" rel="noopener">WhatsApp Us</a>'+
          '</div>'+
        '</div>'+
        '<div class="map-embed">'+(s.mapsUrl ? '<a href="'+esc(s.mapsUrl)+'" target="_blank" rel="noopener" style="color:inherit">Open in Google Maps →</a>' : 'Google Maps link not configured.')+'</div>'+
      '</div></div></section>';
    }

    /* Instagram */
    const gallery=(APP_DATA.gallery||[]).filter(g=>String(g.enabled).toUpperCase()==='TRUE');
    if(String(feats.showInstagram||'TRUE').toUpperCase()==='TRUE' && gallery.length){
      html+='<section class="section"><div class="container">'+
        '<div class="center mb-3"><span class="eyebrow">Instagram</span><h2>Follow '+esc(s.brandName||'Krishana Jewellers')+'</h2>'+
        '<p class="lede">@'+esc(s.instagram||'')+'</p></div>'+
        '<div class="ig-grid">'+gallery.slice(0,6).map((g,i)=>
          '<a class="ig-item" href="'+esc(g.url||'#')+'" target="_blank" rel="noopener" aria-label="'+esc(g.caption||'')+'">'+
            '<img src="'+esc(imgOr(g.image, i+10))+'" alt="'+esc(g.caption||'')+'" loading="lazy" onerror="this.src=\''+jewelImg(i+10)+'\'">'+
          '</a>').join('')+'</div>'+
        '<div class="center mt-3"><a class="btn btn-primary" href="'+esc(s.instagramUrl||'#')+'" target="_blank" rel="noopener">Follow on Instagram</a></div>'+
      '</div></section>';
    }

    /* Testimonials */
    const tests=(APP_DATA.testimonials||[]).filter(t=>String(t.enabled).toUpperCase()==='TRUE');
    if(String(feats.showTestimonials||'TRUE').toUpperCase()==='TRUE' && tests.length){
      html+='<section class="section-tight" style="background:var(--beige)"><div class="container">'+
        '<div class="center mb-3"><span class="eyebrow">Kind Words</span><h2>What Our Customers Say</h2></div>'+
        '<div class="prod-grid" style="grid-template-columns:repeat(3,1fr)">'+
          tests.slice(0,3).map(t=>'<div class="trust-card"><p style="font-family:var(--font-heading);font-size:1.05rem">“'+esc(t.review)+'”</p>'+
            '<strong style="font-size:.8rem;letter-spacing:.1em;text-transform:uppercase">'+esc(t.name)+'</strong></div>').join('')+
        '</div>'+
      '</div></section>';
    }

    return html;
  }

  function viewCatalogue(){
    const params=new URLSearchParams((location.hash.split('?')[1]||''));
    const cat=params.get('cat')||'all';
    const q=(params.get('q')||'').toLowerCase();
    const sort=params.get('sort')||'featured';

    let items=(APP_DATA.products||[]).filter(p=>String(p.enabled).toUpperCase()!=='FALSE');
    if(cat!=='all') items=items.filter(p=>String(p.category||'').toLowerCase().includes(cat.toLowerCase()));
    if(q) items=items.filter(p=>((p.name||'')+' '+(p.category||'')+' '+(p.collection||'')+' '+(p.description||'')).toLowerCase().includes(q));

    if(sort==='price-asc') items.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
    else if(sort==='price-desc') items.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
    else if(sort==='newest') items.sort((a,b)=>(String(b.newArrival).toUpperCase()==='TRUE'?1:0)-(String(a.newArrival).toUpperCase()==='TRUE'?1:0));
    else items.sort((a,b)=>(String(b.featured).toUpperCase()==='TRUE'?1:0)-(String(a.featured).toUpperCase()==='TRUE'?1:0));

    const cats=['all',...((APP_DATA.categories||[]).filter(c=>String(c.enabled).toUpperCase()==='TRUE').map(c=>c.name))];

    return crumb([{label:'Home',href:'#/'},{label:'Jewellery'}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">Catalogue</span><h1>Jewellery Catalogue</h1>'+
      '<p class="lede">Browse, search and enquire on WhatsApp.</p></div>'+
      '<div class="filters">'+
        '<div class="filter-search">'+ICONS.search+'<input type="search" id="catSearch" placeholder="Search jewellery…" value="'+esc(q)+'" aria-label="Search"></div>'+
        '<select id="sortSelect" aria-label="Sort">'+
          '<option value="featured"'+(sort==='featured'?' selected':'')+'>Featured</option>'+
          '<option value="newest"'+(sort==='newest'?' selected':'')+'>Newest</option>'+
          '<option value="price-asc"'+(sort==='price-asc'?' selected':'')+'>Price: Low to High</option>'+
          '<option value="price-desc"'+(sort==='price-desc'?' selected':'')+'>Price: High to Low</option>'+
        '</select>'+
      '</div>'+
      '<div class="filter-chips">'+cats.map(c=>'<button class="chip'+(c===cat?' active':'')+'" data-cat="'+esc(c)+'">'+esc(c==='all'?'All':c)+'</button>').join('')+'</div>'+
      (items.length?'<div class="prod-grid">'+items.map(productCard).join('')+'</div>':'<div class="empty">No products match your search.</div>')+
    '</div></section>';
  }

  function viewCategory(params){
    const cat=(APP_DATA.categories||[]).find(c=>c.slug===params.slug);
    if(!cat) return viewNotFound();
    const items=(APP_DATA.products||[]).filter(p=>p.category===cat.name && String(p.enabled).toUpperCase()!=='FALSE');
    return crumb([{label:'Home',href:'#/'},{label:'Jewellery',href:'#/catalogue'},{label:cat.name}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">Category</span><h1>'+esc(cat.name)+'</h1>'+
      '<p class="lede">'+esc(cat.description||'')+'</p></div>'+
      (items.length?'<div class="prod-grid">'+items.map(productCard).join('')+'</div>':'<div class="empty">No products in this category yet.</div>')+
    '</div></section>';
  }

  function viewProduct(params){
    const p=(APP_DATA.products||[]).find(x=>x.slug===params.slug);
    if(!p) return viewNotFound();
    const s=APP_DATA.settings||{};
    const imgs=[p.image,p.image2,p.image3,p.image4].filter(Boolean);
    if(!imgs.length) imgs.push(jewelImg(p.id.charCodeAt(1)||1));
    const msg='Hello '+(s.brandName||'Krishana Jewellers')+', I am interested in '+p.name+' ('+(p.sku||'')+'). Please share more details.';
    const wa=waLink(msg);
    const price=p.price?'₹'+Number(p.price).toLocaleString('en-IN'):'Price on Request';

    return crumb([{label:'Home',href:'#/'},{label:'Jewellery',href:'#/catalogue'},{label:p.name}])+
    '<section class="section-tight"><div class="container"><div class="pd">'+
      '<div class="pd-gallery">'+
        '<div class="pd-main"><img id="pdMain" src="'+esc(imgs[0])+'" alt="'+esc(p.name)+'" onerror="this.src=\''+jewelImg(1)+'\'"></div>'+
        (imgs.length>1?'<div class="pd-thumbs">'+imgs.map((src,i)=>'<button class="pd-thumb'+(i===0?' active':'')+'" data-src="'+esc(src)+'"><img src="'+esc(src)+'" alt="" onerror="this.src=\''+jewelImg(i)+'\'"></button>').join('')+'</div>':'')+
      '</div>'+
      '<div class="pd-info">'+
        '<span class="pd-cat">'+esc(p.category||'')+' · '+esc(p.collection||'')+'</span>'+
        '<h1>'+esc(p.name)+'</h1>'+
        '<div class="pd-price">'+esc(price)+'<small>'+(p.price?'Contact us for making charges as applicable':'Contact us for current pricing')+'</small></div>'+
        '<p class="pd-desc">'+esc(p.description||'')+'</p>'+
        '<table class="spec-table">'+
          (p.sku?'<tr><th>SKU</th><td>'+esc(p.sku)+'</td></tr>':'')+
          (p.material?'<tr><th>Material</th><td>'+esc(p.material)+'</td></tr>':'')+
          (p.purity?'<tr><th>Purity</th><td>'+esc(p.purity)+'</td></tr>':'')+
          (p.weight?'<tr><th>Weight</th><td>'+esc(p.weight)+'</td></tr>':'')+
          (p.gender?'<tr><th>Gender</th><td>'+esc(p.gender)+'</td></tr>':'')+
          (p.occasion?'<tr><th>Occasion</th><td>'+esc(p.occasion)+'</td></tr>':'')+
        '</table>'+
        '<div class="pd-cta">'+
          '<a class="btn btn-wa" href="'+esc(wa)+'" target="_blank" rel="noopener">'+ICONS.wa+' Enquire on WhatsApp</a>'+
          '<div class="pd-cta-row">'+
            '<a class="btn btn-primary" href="#/book-appointment?product='+encodeURIComponent(p.name)+'">Book a Visit</a>'+
            '<a class="btn btn-outline" href="tel:'+esc((s.phone||'').replace(/\s/g,''))+'">Call Us</a>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div></div></section>';
  }

  function viewBridal(){
    const items=(APP_DATA.products||[]).filter(p=>String(p.bridal).toUpperCase()==='TRUE'&&String(p.enabled).toUpperCase()!=='FALSE');
    const s=APP_DATA.settings||{};
    const wa=waLink('Hello, I would like a bridal jewellery consultation.');
    return crumb([{label:'Home',href:'#/'},{label:'Bridal Jewellery'}])+
    '<section class="hero" style="min-height:56vh">'+
      '<div class="hero-bg"><img src="'+jewelImg(2)+'" alt=""></div>'+
      '<div class="hero-content"><span class="eyebrow">Bridal</span>'+
        '<h1 style="font-size:clamp(2rem,4.5vw,3.4rem)">Your Wedding. Your Jewellery. Your Story.</h1>'+
        '<p class="hero-sub">Bridal sets, necklaces, earrings, bangles, mangalsutra and rings — chosen for your day.</p>'+
        '<div class="hero-cta">'+
          '<a class="btn btn-gold" href="#/catalogue?cat=Bridal%20Jewellery">Explore Bridal</a>'+
          '<a class="btn btn-outline-light" href="'+esc(wa)+'" target="_blank" rel="noopener">Book a Bridal Consultation</a>'+
        '</div>'+
      '</div>'+
    '</section>'+
    '<section class="section"><div class="container">'+
      (items.length?'<div class="prod-grid">'+items.map(productCard).join('')+'</div>':'<div class="empty">Bridal collection coming soon.</div>')+
    '</div></section>';
  }

  function viewNewArrivals(){
    const items=(APP_DATA.products||[]).filter(p=>String(p.newArrival).toUpperCase()==='TRUE'&&String(p.enabled).toUpperCase()!=='FALSE');
    return crumb([{label:'Home',href:'#/'},{label:'New Arrivals'}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">Just In</span><h1>New Arrivals</h1>'+
      '<p class="lede">The newest pieces added to our showroom.</p></div>'+
      (items.length?'<div class="prod-grid">'+items.map(productCard).join('')+'</div>':'<div class="empty">No new arrivals yet.</div>')+
    '</div></section>';
  }

  function viewAbout(){
    const s=APP_DATA.settings||{};
    return crumb([{label:'Home',href:'#/'},{label:'About'}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">About</span><h1>Our Story</h1></div>'+
      '<div class="about-block">'+
        '<h2>Our Story</h2><p>'+esc(s.brandName||'Krishana Jewellers')+' is a jewellery destination built around personal service and thoughtfully selected designs.</p>'+
        '<h2>Our Craftsmanship</h2><p>Every piece in our collection is chosen with attention to detail.</p>'+
        '<h2>Our Values</h2><p>We value clear information, honest guidance and a warm showroom experience.</p>'+
        '<h2>Our Promise</h2><p>We promise personal assistance, transparent product details, and a jewellery experience centred around you.</p>'+
        '<div class="mt-3"><a class="btn btn-primary" href="#/book-appointment">Book a Visit</a></div>'+
      '</div>'+
    '</div></section>';
  }

  function viewShowroom(){
    const s=APP_DATA.settings||{};
    const wa=waLink('Hello, I would like to visit your showroom.');
    return crumb([{label:'Home',href:'#/'},{label:'Showroom'}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">Visit Us</span><h1>Our Showroom</h1>'+
      '<p class="lede">We would love to welcome you in person.</p></div>'+
      '<div class="split"><div class="showroom-info">'+
        '<div class="info-row">'+ICONS.pin+'<div><strong>Address</strong><span>'+esc(s.address||'')+'</span></div></div>'+
        '<div class="info-row">'+ICONS.phone+'<div><strong>Phone</strong><span>'+esc(s.phone||'')+'</span></div></div>'+
        '<div class="info-row">'+ICONS.wa+'<div><strong>WhatsApp</strong><span>'+esc(s.whatsapp||'')+'</span></div></div>'+
        '<div class="info-row">'+ICONS.mail+'<div><strong>Email</strong><span>'+esc(s.email||'')+'</span></div></div>'+
        '<div class="info-row">'+ICONS.clock+'<div><strong>Hours</strong><span>'+esc(s.hours||'')+'</span></div></div>'+
        '<div class="showroom-cta">'+
          '<a class="btn btn-primary" href="'+esc(s.mapsUrl||'#')+'" target="_blank" rel="noopener">Get Directions</a>'+
          '<a class="btn btn-outline" href="tel:'+esc((s.phone||'').replace(/\s/g,''))+'">Call Now</a>'+
          '<a class="btn btn-wa" href="'+esc(wa)+'" target="_blank" rel="noopener">WhatsApp Us</a>'+
        '</div>'+
      '</div>'+
      '<div class="map-embed">'+(s.mapsUrl ? '<a href="'+esc(s.mapsUrl)+'" target="_blank" rel="noopener" style="color:inherit">Open in Google Maps →</a>' : 'Google Maps link not configured.')+'</div>'+
    '</div></div></section>';
  }

  function viewContact(){
    const s=APP_DATA.settings||{};
    const wa=waLink('Hello, I have a question.');
    return crumb([{label:'Home',href:'#/'},{label:'Contact'}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">Contact</span><h1>Get in Touch</h1>'+
      '<p class="lede">We are happy to answer your questions.</p></div>'+
      '<div class="split"><div>'+
        '<div class="showroom-info">'+
          '<div class="info-row">'+ICONS.phone+'<div><strong>Phone</strong><span>'+esc(s.phone||'')+'</span></div></div>'+
          '<div class="info-row">'+ICONS.wa+'<div><strong>WhatsApp</strong><span>'+esc(s.whatsapp||'')+'</span></div></div>'+
          '<div class="info-row">'+ICONS.mail+'<div><strong>Email</strong><span>'+esc(s.email||'')+'</span></div></div>'+
          '<div class="info-row">'+ICONS.pin+'<div><strong>Address</strong><span>'+esc(s.address||'')+'</span></div></div>'+
        '</div>'+
        '<div class="mt-3"><a class="btn btn-wa" href="'+esc(wa)+'" target="_blank" rel="noopener">Chat on WhatsApp</a></div>'+
      '</div>'+
      '<form id="contactForm" class="admin-form" novalidate>'+
        '<h3>Send a Message</h3>'+
        '<div class="field"><label for="cName">Name</label><input id="cName" name="name" required></div>'+
        '<div class="field"><label for="cPhone">Phone</label><input id="cPhone" name="phone" required></div>'+
        '<div class="field"><label for="cEmail">Email</label><input id="cEmail" name="email" type="email"></div>'+
        '<div class="field"><label for="cMsg">Message</label><textarea id="cMsg" name="message" required></textarea></div>'+
        '<button class="btn btn-primary btn-block" type="submit">Send Message</button>'+
        '<p class="form-note">We will reply as soon as possible.</p>'+
      '</form>'+
    '</div></div></section>';
  }

  function viewBook(){
    const params=new URLSearchParams((location.hash.split('?')[1]||''));
    const pre=params.get('product')||'';
    const wa=waLink('Hello, I would like to book a showroom visit.');
    const interests=['Gold Jewellery','Bridal Jewellery','Diamond Jewellery','Rings','Bangles','Necklaces','Other'];
    return crumb([{label:'Home',href:'#/'},{label:'Book Appointment'}])+
    '<section class="section-tight"><div class="container">'+
      '<div class="page-head"><span class="eyebrow">Appointment</span><h1>Book a Showroom Visit</h1>'+
      '<p class="lede">Tell us when you would like to visit and we will confirm.</p></div>'+
      '<div class="split"><form id="bookForm" class="admin-form" novalidate>'+
        '<h3>Appointment Details</h3>'+
        '<div class="form-grid">'+
          '<div class="field"><label for="bName">Name *</label><input id="bName" required></div>'+
          '<div class="field"><label for="bMobile">Mobile *</label><input id="bMobile" required></div>'+
          '<div class="field full"><label for="bEmail">Email</label><input id="bEmail" type="email"></div>'+
          '<div class="field"><label for="bDate">Preferred Date</label><input id="bDate" type="date"></div>'+
          '<div class="field"><label for="bTime">Preferred Time</label><input id="bTime" type="time"></div>'+
          '<div class="field full"><label for="bInterest">Jewellery Interest</label><select id="bInterest">'+
            interests.map(i=>'<option>'+i+'</option>').join('')+
          '</select></div>'+
          '<div class="field full"><label for="bMsg">Message</label><textarea id="bMsg">'+(pre?('Interested in: '+esc(pre)):'')+'</textarea></div>'+
        '</div>'+
        '<button class="btn btn-primary btn-block" type="submit">Book My Visit</button>'+
      '</form>'+
      '<div><div class="trust-card"><h3>Prefer WhatsApp?</h3><p>Send us a message and we will arrange a time.</p>'+
      '<a class="btn btn-wa mt-2" href="'+esc(wa)+'" target="_blank" rel="noopener">Book Through WhatsApp</a></div>'+
      '<div class="trust-card mt-3"><h3>Call Us</h3><p>Speak to our team directly.</p>'+
      '<a class="btn btn-outline mt-2" href="tel:'+esc((APP_DATA.settings.phone||'').replace(/\s/g,''))+'">Call Now</a></div></div>'+
    '</div></div></section>';
  }

  function viewPrivacy(){return crumb([{label:'Home',href:'#/'},{label:'Privacy Policy'}])+'<section class="section-tight"><div class="container"><div class="page-head"><h1>Privacy Policy</h1></div><div class="about-block"><p>Replace this text with your actual privacy policy before going live.</p></div></div></section>';}
  function viewTerms(){return crumb([{label:'Home',href:'#/'},{label:'Terms'}])+'<section class="section-tight"><div class="container"><div class="page-head"><h1>Terms of Use</h1></div><div class="about-block"><p>Replace this text with your actual terms before going live.</p></div></div></section>';}
  function viewNotFound(){return '<section class="section-tight"><div class="container"><div class="page-head"><h1>Page Not Found</h1><p class="lede">The page you were looking for could not be found.</p><div class="mt-3"><a class="btn btn-primary" href="#/">Back to Home</a></div></div></div></section>';}

  /* ---------- routes ---------- */
  const ROUTES=[
    {path:'/',view:viewHome},
    {path:'/catalogue',view:viewCatalogue},
    {path:'/gold-jewellery',view:viewCatalogue},
    {path:'/bridal-jewellery',view:viewBridal},
    {path:'/new-arrivals',view:viewNewArrivals},
    {path:'/about',view:viewAbout},
    {path:'/showroom',view:viewShowroom},
    {path:'/contact',view:viewContact},
    {path:'/book-appointment',view:viewBook},
    {path:'/privacy',view:viewPrivacy},
    {path:'/terms',view:viewTerms},
    {path:'/product/:slug',view:viewProduct},
    {path:'/category/:slug',view:viewCategory},
    {path:'/admin',view:viewAdminPlaceholder}
  ];

  function viewAdminPlaceholder(){
    /* Admin UI is rendered by admin.js which takes over #main. */
    return '<section class="section-tight"><div class="container"><div class="empty">Loading admin…</div></div></section>';
  }

  function currentRoute(){return (location.hash.replace(/^#/,'')||'/').split('?')[0];}
  function matchRoute(path){
    for(const r of ROUTES){
      const rp=r.path.split('/').filter(Boolean), pp=path.split('/').filter(Boolean);
      if(rp.length!==pp.length) continue;
      const params={};let ok=true;
      for(let i=0;i<rp.length;i++){
        if(rp[i].startsWith(':')) params[rp[i].slice(1)]=decodeURIComponent(pp[i]);
        else if(rp[i]!==pp[i]){ok=false;break;}
      }
      if(ok) return {route:r,params};
    }
    return null;
  }

  /* ---------- render ---------- */
  function render(){
    const path=currentRoute();
    const match=matchRoute(path);
    const app=document.getElementById('main');

    if(path==='/admin' && window.Admin){
      window.Admin.mount(app, APP_DATA);
      document.title='Admin — Krishana Jewellers';
      /* cleanup 3D */
      if(RING_3D_CLEANUP){try{RING_3D_CLEANUP();}catch(e){}RING_3D_CLEANUP=null;}
      return;
    }

    if(match){
      document.title=pageTitle(match);
      app.innerHTML=match.route.view(match.params);
    } else {
      document.title='Page Not Found — Krishana Jewellers';
      app.innerHTML=viewNotFound();
    }
    renderChrome();
    updateStructuredData(match);
    bindEvents();

    /* cleanup previous 3D */
    if(RING_3D_CLEANUP){try{RING_3D_CLEANUP();}catch(e){}RING_3D_CLEANUP=null;}
  }

  function pageTitle(match){
    const p=match.route.path;
    const s=APP_DATA.settings||{};
    const brand=s.brandName||'Krishana Jewellers';
    const map={
      '/':brand+' — Gold & Bridal Jewellery Showroom',
      '/catalogue':'Jewellery Catalogue — '+brand,
      '/gold-jewellery':'Gold Jewellery — '+brand,
      '/bridal-jewellery':'Bridal Jewellery — '+brand,
      '/new-arrivals':'New Arrivals — '+brand,
      '/about':'About — '+brand,
      '/showroom':'Showroom — '+brand,
      '/contact':'Contact — '+brand,
      '/book-appointment':'Book Appointment — '+brand,
      '/privacy':'Privacy Policy — '+brand,
      '/terms':'Terms — '+brand
    };
    if(map[p]) return map[p];
    if(p.startsWith('/product/')){
      const prod=(APP_DATA.products||[]).find(x=>x.slug===match.params.slug);
      if(prod) return prod.name+' — '+brand;
    }
    if(p.startsWith('/category/')){
      const c=(APP_DATA.categories||[]).find(x=>x.slug===match.params.slug);
      if(c) return c.name+' — '+brand;
    }
    return brand;
  }

  /* ---------- events ---------- */
  function bindEvents(){
    const header=document.getElementById('header');
    if(header){
      if(window.scrollY>20) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    }

    const mt=document.getElementById('menuToggle'), mn=document.getElementById('mobileNav');
    if(mt&&mn&&!mt._bound){
      mt._bound=true;
      mt.addEventListener('click',()=>{const open=mn.classList.toggle('open');mt.setAttribute('aria-expanded',String(open));});
      mn.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mn.classList.remove('open');mt.setAttribute('aria-expanded','false');}));
    }

    const sb=document.getElementById('searchBtn');
    if(sb&&!sb._bound){sb._bound=true;sb.onclick=()=>{location.hash='#/catalogue';};}

    $$('[data-wish]').forEach(b=>{b.onclick=(e)=>{e.preventDefault();toggleWish(b.dataset.wish);};});

    const cs=document.getElementById('catSearch');
    if(cs&&!cs._bound){
      cs._bound=true;
      cs.addEventListener('input',debounce(()=>{
        const q=cs.value.trim();
        const params=new URLSearchParams(location.hash.split('?')[1]||'');
        if(q) params.set('q',q); else params.delete('q');
        location.hash='#/catalogue'+(params.toString()?'?'+params.toString():'');
      },350));
    }
    const ss=document.getElementById('sortSelect');
    if(ss&&!ss._bound){ss._bound=true;ss.onchange=()=>{
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      params.set('sort',ss.value);
      location.hash='#/catalogue?'+params.toString();
    };}
    $$('.chip[data-cat]').forEach(ch=>{ch.onclick=()=>{
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      if(ch.dataset.cat==='all') params.delete('cat'); else params.set('cat',ch.dataset.cat);
      location.hash='#/catalogue'+(params.toString()?'?'+params.toString():'');
    };});

    const pdMain=document.getElementById('pdMain');
    if(pdMain){
      $$('.pd-thumb').forEach(t=>{t.onclick=()=>{
        pdMain.src=t.dataset.src;
        $$('.pd-thumb').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
      };});
      pdMain.onclick=()=>{openModal('<img src="'+pdMain.src+'" alt="" style="width:100%;border-radius:var(--radius)">');};
    }

    const cf=document.getElementById('contactForm');
    if(cf&&!cf._bound){
      cf._bound=true;
      cf.onsubmit=async(e)=>{
        e.preventDefault();
        const name=document.getElementById('cName').value.trim();
        const phone=document.getElementById('cPhone').value.trim();
        const email=document.getElementById('cEmail').value.trim();
        const message=document.getElementById('cMsg').value.trim();
        if(!name||!phone||!message){toast('Please fill the required fields.');return;}
        const btn=cf.querySelector('button[type=submit]');
        btn.disabled=true;btn.textContent='Sending…';
        try{
          await window.API.submitEnquiry({name,phone,email,message});
          cf.reset();
          toast('Thank you. We will get back to you soon.');
        }catch(err){
          toast('Could not send right now. Please WhatsApp us.');
        } finally {
          btn.disabled=false;btn.textContent='Send Message';
        }
      };
    }

    const bf=document.getElementById('bookForm');
    if(bf&&!bf._bound){
      bf._bound=true;
      bf.onsubmit=async(e)=>{
        e.preventDefault();
        const name=document.getElementById('bName').value.trim();
        const phone=document.getElementById('bMobile').value.trim();
        if(!name||!phone){toast('Please enter your name and mobile.');return;}
        const payload={
          name,phone,
          email:document.getElementById('bEmail').value.trim(),
          date:document.getElementById('bDate').value,
          time:document.getElementById('bTime').value,
          service:document.getElementById('bInterest').value,
          message:document.getElementById('bMsg').value.trim()
        };
        const btn=bf.querySelector('button[type=submit]');
        btn.disabled=true;btn.textContent='Booking…';
        try{
          await window.API.submitAppointment(payload);
          bf.reset();
          openModal('<h3>Appointment Received</h3><p>Thank you, '+esc(name)+'. We have received your request and will contact you to confirm.</p><button class="btn btn-primary" onclick="closeModal()">Close</button>');
        }catch(err){
          toast('Could not book right now. Please WhatsApp us.');
        } finally {
          btn.disabled=false;btn.textContent='Book My Visit';
        }
      };
    }
  }

  /* ---------- modal helpers ---------- */
  function openModal(html){
    const mb=document.getElementById('modalBg'), m=document.getElementById('modal');
    m.innerHTML='<button class="icon-btn modal-close" onclick="closeModal()" aria-label="Close">✕</button>'+html;
    mb.classList.add('open');
  }
  function closeModal(){document.getElementById('modalBg').classList.remove('open');}
  window.closeModal=closeModal;

  /* ---------- boot ---------- */
  async function boot(){
    /* apply bundled defaults instantly so page isn't blank */
    window.Theme.apply(CFG.DEFAULT_THEME);
    APP_DATA={settings:CFG.DEFAULT_SETTINGS,theme:CFG.DEFAULT_THEME,products:[],categories:[],gallery:[],testimonials:[],navigation:CFG.DEFAULT_NAVIGATION,features:CFG.DEFAULT_FEATURES};
    if(!location.hash) location.hash='#/';
    render();

    /* then fetch live data */
    const result=await window.API.getSiteData();
    if(result.ok){
      APP_DATA=result.data;
      /* merge safe defaults so missing fields never blank the UI */
      APP_DATA.settings=Object.assign({},CFG.DEFAULT_SETTINGS,APP_DATA.settings||{});
      APP_DATA.theme=Object.assign({},CFG.DEFAULT_THEME,APP_DATA.theme||{});
      APP_DATA.features=Object.assign({},CFG.DEFAULT_FEATURES,APP_DATA.features||{});
      APP_DATA.navigation=(APP_DATA.navigation&&APP_DATA.navigation.length)?APP_DATA.navigation:CFG.DEFAULT_NAVIGATION;
      window.Theme.apply(APP_DATA.theme);
      render();

      /* subtle stale notice */
      if(result.stale && !result.noCache){
        showSyncBanner('Showing cached content. Some updates may be delayed.');
      } else if(result.noCache){
        showSyncBanner('Live data unavailable. Contact the showroom for details.');
      }
    }
    /* expose for admin.js */
    window.APP_DATA=APP_DATA;
  }

  function showSyncBanner(msg){
    const b=document.getElementById('syncBanner');
    if(!b) return;
    b.textContent=msg;b.hidden=false;
    setTimeout(()=>{b.hidden=true;},7000);
  }

  /* ---------- listeners ---------- */
  window.addEventListener('hashchange',render);
  window.addEventListener('scroll',()=>{
    const h=document.getElementById('header'); if(!h) return;
    if(window.scrollY>20) h.classList.add('scrolled'); else h.classList.remove('scrolled');
  },{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeModal();});
  document.getElementById('modalBg').addEventListener('click',e=>{if(e.target.id==='modalBg') closeModal();});

  /* Boot when DOM ready */
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
