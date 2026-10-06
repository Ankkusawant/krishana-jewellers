/**
 * Krishana Jewellers — Google Apps Script API
 * Deploy as Web App: Execute as "Me", Access "Anyone".
 *
 * Script Properties required (File → Project settings → Script properties):
 *   SPREADSHEET_ID       - the target Sheet ID
 *   ADMIN_PASSWORD_HASH  - SHA-256 hex of the admin password
 *   SESSION_SECRET       - random string used for token seeding
 *
 * To generate ADMIN_PASSWORD_HASH, run makeHash('yourStrongPassword') below
 * in the Apps Script editor once and paste the result into Script Properties.
 */

const API_VERSION = 'v1';
const SESSION_TTL_SECONDS = 60 * 60 * 6;   // 6 hours

/* ---------------- Entry points ---------------- */

function doGet(e){
  return handle_(e, 'GET');
}
function doPost(e){
  return handle_(e, 'POST');
}

function handle_(e, method){
  try{
    const params = (e && e.parameter) || {};
    const action = String(params.action || '').trim();

    /* Public read */
    if(action === 'getSiteData') return json_(getSiteData());

    /* Public write */
    if(action === 'submitEnquiry' && method === 'POST')   return json_(submitEnquiry(parseBody_(e)));
    if(action === 'submitAppointment' && method === 'POST') return json_(submitAppointment(parseBody_(e)));

    /* Auth */
    if(action === 'login'  && method === 'POST') return json_(login_(parseBody_(e)));
    if(action === 'logout' && method === 'POST') return json_(logout_(parseBody_(e)));
    if(action === 'ping') return json_({success:true, data:{pong:true, v:API_VERSION, ts:new Date().toISOString()}});

    /* Admin reads */
    if(action === 'adminData'){
      requireAuth_(tokenFrom_(e));
      return json_(adminData_());
    }

    /* Admin mutations */
    const adminActions = {
      saveProduct:'saveProduct_',       deleteProduct:'deleteProduct_',
      saveCategory:'saveCategory_',     deleteCategory:'deleteCategory_',
      saveGallery:'saveGallery_',       deleteGallery:'deleteGallery_',
      saveTestimonial:'saveTestimonial_', deleteTestimonial:'deleteTestimonial_',
      saveSettings:'saveSettings_',     saveTheme:'saveTheme_',
      saveNavigation:'saveNavigation_', deleteNavigation:'deleteNavigation_',
      saveFeatures:'saveFeatures_',
      updateEnquiry:'updateEnquiry_',   updateAppointment:'updateAppointment_'
    };
    if(method === 'POST' && adminActions[action]){
      const body = parseBody_(e);
      requireAuth_(body.token);
      const handler = this[adminActions[action]] || globalThis[adminActions[action]];
      if(typeof handler !== 'function') return err_('UNKNOWN_ACTION','Unsupported action: '+action);
      return json_({success:true, data: handler(body)});
    }

    return err_('UNKNOWN_ACTION', 'Unsupported action: '+action);
  }catch(e){
    return err_(e && e.code || 'SERVER_ERROR', (e && e.message) || 'Server error');
  }
}

/* ---------------- Helpers ---------------- */

function parseBody_(e){
  if(!e) return {};
  if(e.postData && e.postData.contents){
    try{ return JSON.parse(e.postData.contents); }catch(err){ return {}; }
  }
  return {};
}
function tokenFrom_(e){
  const h = (e && e.headers) || {};
  return h['X-Session-Token'] || (e && e.parameter && e.parameter.token) || '';
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function err_(code, message){
  return json_({success:false, error:{code:code, message:message}});
}

function props_(){
  return PropertiesService.getScriptProperties();
}

function sheet_(name){
  const id = props_().getProperty('SPREADSHEET_ID');
  if(!id) throw {code:'NO_SPREADSHEET', message:'SPREADSHEET_ID not configured'};
  const ss = SpreadsheetApp.openById(id);
  const sh = ss.getSheetByName(name);
  if(!sh) throw {code:'NO_SHEET', message:'Missing sheet: '+name};
  return sh;
}

function readRows_(name){
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  const headers = values[0].map(h => String(h||'').trim());
  const out = [];
  for(let i=1;i<values.length;i++){
    const row = values[i];
    if(row.every(c => c === '' || c === null)) continue;
    const obj = {};
    for(let j=0;j<headers.length;j++) obj[headers[j]] = row[j];
    out.push(obj);
  }
  return out;
}

function writeRow_(name, obj){
  const sh = sheet_(name);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(h=>String(h||'').trim());
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sh.appendRow(row);
  return obj;
}

function updateRowById_(name, id, obj){
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return null;
  const headers = values[0].map(h=>String(h||'').trim());
  const idCol = headers.indexOf('id');
  if(idCol < 0) throw {code:'NO_ID_COL', message:'Sheet missing id column: '+name};
  for(let i=1;i<values.length;i++){
    if(String(values[i][idCol]) === String(id)){
      headers.forEach((h,j)=>{
        if(h in obj && h !== 'id') sh.getRange(i+1, j+1).setValue(obj[h]);
      });
      return obj;
    }
  }
  return null;
}

function deleteRowById_(name, id){
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h=>String(h||'').trim());
  const idCol = headers.indexOf('id');
  if(idCol < 0) return false;
  for(let i=values.length-1;i>=1;i--){
    if(String(values[i][idCol]) === String(id)){
      sh.deleteRow(i+1);
      return true;
    }
  }
  return false;
}

function genId_(prefix){
  return (prefix||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function sha256_(str){
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str), Utilities.Charset.UTF_8);
  return raw.map(b => ((b<0?b+256:b).toString(16)).padStart(2,'0')).join('');
}

/* Utility to make the password hash. Run once in the editor. */
function makeHash(pw){
  const h = sha256_(pw);
  Logger.log(h);
  return h;
}

/* ---------------- Public reads ---------------- */

function getSiteData(){
  return {
    success:true,
    data:{
      settings:     readSettings_(),
      theme:        readTheme_(),
      products:     readRows_('PRODUCTS').filter(p => String(p.enabled).toUpperCase() !== 'FALSE'),
      categories:   readRows_('CATEGORIES').filter(c => String(c.enabled).toUpperCase() !== 'FALSE'),
      gallery:      readRows_('GALLERY').filter(g => String(g.enabled).toUpperCase() !== 'FALSE'),
      testimonials: readRows_('TESTIMONIALS').filter(t => String(t.enabled).toUpperCase() !== 'FALSE'),
      navigation:   readRows_('NAVIGATION').filter(n => String(n.enabled).toUpperCase() !== 'FALSE'),
      features:     readFeatures_(),
      version:      API_VERSION
    }
  };
}

function readSettings_(){
  const rows = readRows_('SETTINGS');
  const out = {};
  rows.forEach(r => { if(r.key) out[r.key] = r.value; });
  return out;
}
function readTheme_(){
  const rows = readRows_('THEME');
  const out = {};
  rows.forEach(r => { if(r.key) out[r.key] = r.value; });
  return out;
}
function readFeatures_(){
  const rows = readRows_('FEATURES');
  const out = {};
  rows.forEach(r => { if(r.key) out[r.key] = r.value !== '' ? r.value : (r.enabled || 'TRUE'); });
  return out;
}

/* ---------------- Public writes ---------------- */

function submitEnquiry(body){
  const row = {
    id:        genId_('enq'),
    createdAt: new Date().toISOString(),
    name:      sanitize_(body.name, 120),
    phone:     sanitize_(body.phone, 40),
    email:     sanitize_(body.email, 120),
    product:   sanitize_(body.product, 200),
    message:   sanitize_(body.message, 2000),
    status:    'New'
  };
  if(!row.name || !row.phone) return err_('BAD_INPUT','Name and phone required');
  writeRow_('ENQUIRIES', row);
  return {success:true, data:{id:row.id}};
}

function submitAppointment(body){
  const row = {
    id:        genId_('apt'),
    createdAt: new Date().toISOString(),
    name:      sanitize_(body.name, 120),
    phone:     sanitize_(body.phone, 40),
    email:     sanitize_(body.email, 120),
    date:      sanitize_(body.date, 30),
    time:      sanitize_(body.time, 30),
    service:   sanitize_(body.service, 80),
    message:   sanitize_(body.message, 2000),
    status:    'New'
  };
  if(!row.name || !row.phone) return err_('BAD_INPUT','Name and phone required');
  writeRow_('APPOINTMENTS', row);
  return {success:true, data:{id:row.id}};
}

function sanitize_(v, max){
  const s = String(v == null ? '' : v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

/* ---------------- Auth ---------------- */

function login_(body){
  const pw = String(body.password || '');
  const expected = props_().getProperty('ADMIN_PASSWORD_HASH');
  if(!expected) return err_('NOT_CONFIGURED','ADMIN_PASSWORD_HASH not set');
  if(!pw) return err_('BAD_INPUT','Password required');
  if(sha256_(pw) !== expected) return err_('UNAUTHORIZED','Invalid credentials');

  const token = issueToken_();
  return {success:true, data:{token: token.value, expiresAt: token.expiresAt, v: API_VERSION}};
}

function logout_(body){
  const token = String(body.token||'');
  if(token) {
    const cache = CacheService.getScriptCache();
    cache.remove('sess_'+token);
  }
  return {success:true, data:{revoked:true}};
}

function issueToken_(){
  const raw = Utilities.getUuid() + '.' + Utilities.getUuid();
  const secret = props_().getProperty('SESSION_SECRET') || '';
  const value = sha256_(raw + secret).slice(0, 48);
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const cache = CacheService.getScriptCache();
  cache.put('sess_'+value, JSON.stringify({created:Date.now(), expiresAt}), SESSION_TTL_SECONDS);
  return {value, expiresAt};
}

function requireAuth_(token){
  if(!token) throw {code:'UNAUTHORIZED', message:'Authentication required'};
  const cache = CacheService.getScriptCache();
  const raw = cache.get('sess_'+token);
  if(!raw) throw {code:'UNAUTHORIZED', message:'Session invalid or expired'};
  try{
    const s = JSON.parse(raw);
    if(!s.expiresAt || s.expiresAt < Date.now()) throw {code:'UNAUTHORIZED', message:'Session expired'};
  }catch(e){
    throw {code:'UNAUTHORIZED', message:'Session invalid'};
  }
}

/* ---------------- Admin reads ---------------- */

function adminData_(){
  return {
    success:true,
    data:{
      settings:     readSettings_(),
      theme:        readTheme_(),
      products:     readRows_('PRODUCTS'),
      categories:   readRows_('CATEGORIES'),
      gallery:      readRows_('GALLERY'),
      testimonials: readRows_('TESTIMONIALS'),
      navigation:   readRows_('NAVIGATION'),
      features:     readFeatures_(),
      enquiries:    readRows_('ENQUIRIES'),
      appointments: readRows_('APPOINTMENTS'),
      version:      API_VERSION
    }
  };
}

/* ---------------- Admin mutations ---------------- */

function saveProduct_(b){
  const id = b.id || genId_('prd');
  const slug = b.slug || slugify_(b.name);
  const payload = {
    id: id, slug: slug, name: b.name||'', category: b.category||'',
    collection: b.collection||'', material: b.material||'', purity: b.purity||'',
    weight: b.weight||'', price: b.price||'', sku: b.sku||'',
    featured: b.featured||'FALSE', newArrival: b.newArrival||'FALSE', bridal: b.bridal||'FALSE',
    gender: b.gender||'', occasion: b.occasion||'', description: b.description||'',
    image: b.image||'', image2: b.image2||'', image3: b.image3||'', image4: b.image4||'',
    enabled: b.enabled||'TRUE', sortOrder: b.sortOrder||0
  };
  if(b.id){ const upd = updateRowById_('PRODUCTS', b.id, payload); return upd ? payload : null; }
  writeRow_('PRODUCTS', payload);
  return payload;
}
function deleteProduct_(b){ return {deleted: deleteRowById_('PRODUCTS', b.id)}; }

function saveCategory_(b){
  const id = b.id || genId_('cat');
  const payload = {
    id: id, name: b.name||'', slug: b.slug||slugify_(b.name),
    description: b.description||'', image: b.image||'',
    enabled: b.enabled||'TRUE', sortOrder: b.sortOrder||0
  };
  if(b.id){ const upd = updateRowById_('CATEGORIES', b.id, payload); return upd ? payload : null; }
  writeRow_('CATEGORIES', payload);
  return payload;
}
function deleteCategory_(b){ return {deleted: deleteRowById_('CATEGORIES', b.id)}; }

function saveGallery_(b){
  const id = b.id || genId_('gal');
  const payload = {
    id: id, image: b.image||'', caption: b.caption||'', url: b.url||'',
    enabled: b.enabled||'TRUE', sortOrder: b.sortOrder||0
  };
  if(b.id){ const upd = updateRowById_('GALLERY', b.id, payload); return upd ? payload : null; }
  writeRow_('GALLERY', payload);
  return payload;
}
function deleteGallery_(b){ return {deleted: deleteRowById_('GALLERY', b.id)}; }

function saveTestimonial_(b){
  const id = b.id || genId_('tst');
  const payload = {
    id: id, name: b.name||'', rating: b.rating||5, review: b.review||'',
    enabled: b.enabled||'TRUE', sortOrder: b.sortOrder||0
  };
  if(b.id){ const upd = updateRowById_('TESTIMONIALS', b.id, payload); return upd ? payload : null; }
  writeRow_('TESTIMONIALS', payload);
  return payload;
}
function deleteTestimonial_(b){ return {deleted: deleteRowById_('TESTIMONIALS', b.id)}; }

function saveNavigation_(b){
  const id = b.id || genId_('nav');
  const payload = {
    id: id, label: b.label||'', href: b.href||'',
    enabled: b.enabled||'TRUE', sortOrder: b.sortOrder||0
  };
  if(b.id){ const upd = updateRowById_('NAVIGATION', b.id, payload); return upd ? payload : null; }
  writeRow_('NAVIGATION', payload);
  return payload;
}
function deleteNavigation_(b){ return {deleted: deleteRowById_('NAVIGATION', b.id)}; }

function saveSettings_(b){
  const settings = b.settings || {};
  return replaceKeyValueSheet_('SETTINGS', settings);
}
function saveTheme_(b){
  const theme = b.theme || {};
  return replaceKeyValueSheet_('THEME', theme);
}
function saveFeatures_(b){
  const features = b.features || {};
  return replaceKeyValueSheet_('FEATURES', features, true);
}

function replaceKeyValueSheet_(sheetName, obj, isBoolean){
  const sh = sheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if(values.length < 1) { sh.appendRow(['key','value','type','enabled']); }
  const lastRow = sh.getLastRow();
  const existing = {};
  for(let i=2;i<=lastRow;i++){
    const k = sh.getRange(i,1).getValue();
    if(k) existing[String(k)] = i;
  }
  Object.keys(obj).forEach(k => {
    const v = isBoolean ? (String(obj[k]).toUpperCase()==='TRUE' ? 'TRUE' : 'FALSE') : obj[k];
    if(existing[k]) sh.getRange(existing[k], 2).setValue(v);
    else sh.appendRow([k, v, '', isBoolean ? 'TRUE' : '']);
  });
  return obj;
}

function updateEnquiry_(b){
  return updateStatus_('ENQUIRIES', b.id, b.status);
}
function updateAppointment_(b){
  return updateStatus_('APPOINTMENTS', b.id, b.status);
}
function updateStatus_(sheetName, id, status){
  const sh = sheet_(sheetName);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h=>String(h||'').trim());
  const idCol = headers.indexOf('id');
  const stCol = headers.indexOf('status');
  if(idCol<0 || stCol<0) return {updated:false};
  for(let i=1;i<values.length;i++){
    if(String(values[i][idCol]) === String(id)){
      sh.getRange(i+1, stCol+1).setValue(status);
      return {updated:true, id:id, status:status};
    }
  }
  return {updated:false};
}

function slugify_(s){
  return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || genId_('p');
}
