/* Cuadrante de consulta — interfaz */
(() => {
  'use strict';
  const C = Core;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORAGE_KEY = 'cuadrante.v1';
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  const I = {
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 3 5 5-5 5"/></svg>',
    reflow: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4"/><path d="M12.5 1.5v3h-3M3.5 14.5v-3h3"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8.5 3 3 7-7"/></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    pin: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 1.5 14.5 6.5 11.5 7.5 8.5 10.5 8 14 2 8 5.5 7.5 8.5 4.5z"/><path d="M2 14l3.5-3.5"/></svg>',
    video: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1.5" y="4" width="9" height="8" rx="1.5"/><path d="m10.5 7 4-2v6l-4-2z"/></svg>',
    warn: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2.5 14.5 13.5h-13z" stroke-linejoin="round"/><path d="M8 6.5v3.2M8 11.6v.4"/></svg>',
    grip: '<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor"><circle cx="3" cy="3" r="1.4"/><circle cx="7" cy="3" r="1.4"/><circle cx="3" cy="8" r="1.4"/><circle cx="7" cy="8" r="1.4"/><circle cx="3" cy="13" r="1.4"/><circle cx="7" cy="13" r="1.4"/></svg>',
    search: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
    cal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    doc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></svg>',
    gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    download: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11"/></svg>',
    print: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6V2.5h8V6M4 12H2.5V7h11v5H12M4 10h8v3.5H4z"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  };

  // ======================================================================
  // Estado de la aplicación
  // ======================================================================
  const App = {
    state: null, view: 'semana', weekId: C.isoWeekId(new Date()), mobileDay: null,
    selectedPatient: null, editing: null, patientSearch: '', patientFilter: 'activos',
    selectedInvoice: null, invoiceMonth: new Date().toISOString().slice(0, 7), invoiceFilter: 'todas',
    undo: [], crypto: { key: null, salt: null, iter: 600000 }, encrypted: false, locked: false,
    lastActivity: Date.now(), settingsDraft: null, saveError: null, saveTimer: null,
  };

  // ======================================================================
  // Almacenamiento (localStorage + cifrado opcional con WebCrypto)
  // ======================================================================
  const b64 = { enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))), dec: s => Uint8Array.from(atob(s), c => c.charCodeAt(0)) };
  const Storage = {
    read() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
    write(env) { localStorage.setItem(STORAGE_KEY, JSON.stringify(env)); },
    async deriveKey(password, salt, iter) {
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    },
    async encrypt(doc, key, saltB64, iter) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const aad = new TextEncoder().encode(`cuadrante:v1:${doc.v}`);
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, new TextEncoder().encode(JSON.stringify(doc)));
      return { enc: true, v: 1, kdf: 'PBKDF2-SHA256', iter, salt: saltB64, iv: b64.enc(iv), schema: doc.v, ct: b64.enc(ct) };
    },
    async decrypt(env, password) {
      const key = await this.deriveKey(password, b64.dec(env.salt), env.iter);
      const aad = new TextEncoder().encode(`cuadrante:v1:${env.schema}`);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(env.iv), additionalData: aad }, key, b64.dec(env.ct));
      return { doc: JSON.parse(new TextDecoder().decode(pt)), key };
    },
  };

  async function persistNow() {
    try {
      const env = App.crypto.key ? await Storage.encrypt(App.state, App.crypto.key, App.crypto.salt, App.crypto.iter) : { enc: false, doc: App.state };
      Storage.write(env);
      if (App.saveError) { App.saveError = null; render(); }
    } catch (e) {
      App.saveError = e.name === 'QuotaExceededError' ? 'No queda espacio para guardar en este navegador. Exporta una copia ya.' : `No se ha podido guardar: ${e.message}`;
      render();
    }
  }
  function save() { clearTimeout(App.saveTimer); App.saveTimer = setTimeout(persistNow, 120); }

  // ======================================================================
  // Mutaciones, deshacer, avisos
  // ======================================================================
  function snapshot() { const st = App.state; return JSON.stringify({ slots: st.slots, weeks: st.weeks, patients: st.patients, invoices: st.invoices, siguiente: st.settings.siguiente, siguienteRect: st.settings.siguienteRect }); }
  function commit(fn, opts = {}) {
    if (opts.undo) { App.undo.push(snapshot()); if (App.undo.length > 20) App.undo.shift(); }
    fn(App.state);
    save();
    render();
    if (opts.toast) toast(opts.toast, opts.undo ? { label: 'Deshacer', fn: undo } : null);
    if (opts.announce) $('#live').textContent = opts.announce;
  }
  function undo() {
    const s = App.undo.pop();
    if (!s) return;
    const snap = JSON.parse(s);
    Object.assign(App.state, { slots: snap.slots, weeks: snap.weeks, patients: snap.patients, invoices: snap.invoices });
    App.state.settings.siguiente = snap.siguiente; App.state.settings.siguienteRect = snap.siguienteRect;
    App.editing = null; if (App.selectedInvoice && !App.state.invoices.some(i => i.id === App.selectedInvoice)) App.selectedInvoice = null;
    save(); render(); toast('Deshecho');
  }
  let toastTimer = null;
  function toast(msg, action, opts = {}) {
    const el = $('#toast');
    el.className = 'toast' + (opts.error ? ' err' : '');
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" id="toast-action">${esc(action.label)}</button>` : ''}`;
    el.hidden = false;
    if (action) $('#toast-action').onclick = () => { el.hidden = true; action.fn(); };
    clearTimeout(toastTimer);
    if (!opts.sticky) toastTimer = setTimeout(() => { el.hidden = true; }, opts.ms || 5000);
  }

  // ======================================================================
  // Ayudas de dominio
  // ======================================================================
  const pmap = () => C.patientMap(App.state.patients);
  const patient = id => pmap().get(id);
  const colorOf = p => C.COLORS[p.color] || C.COLORS.pizarra;
  const styleOf = p => { const c = colorOf(p); return `--pb:${c.bg};--pf:${c.fg}`; };
  const initials = s => String(s || '').trim().split(/\s+/).map(w => w[0] ? w[0].toUpperCase() + '.' : '').join(' ');
  const shown = p => App.state.settings.discreet ? initials(p.alias) : (p.alias || 'Sin nombre');
  const freqLabel = f => ({ semanal: 'Semanal', quincenalA: 'Quincenal · sem. A', quincenalB: 'Quincenal · sem. B', puntual: 'Puntual' }[f] || f);
  const weekParity = () => C.weekParity(App.weekId, App.state.settings.weekAnchor);
  const weekSessions = () => C.weekSessions(App.state, App.weekId);
  const sessionCtx = (ignoreIds = []) => ({ settings: App.state.settings, patients: App.state.patients, sessions: weekSessions(), ignoreIds: new Set(ignoreIds) });
  const slotsOf = p => App.state.slots.filter(s => s.patientId === p.id).length;
  const trayPatients = () => App.state.patients.filter(p => p.activo !== false && !p.enEspera && slotsOf(p) < Math.max(1, p.sesiones || 1) && !(slotsOf(p) === 0 && weekSessions().some(s => s.patientId === p.id)));
  const PRIO = { urgente: 0, continuidad: 1, normal: 2 };
  const waitPatients = () => App.state.patients.filter(p => p.activo !== false && p.enEspera).sort((a, b) => (PRIO[a.prioridad] ?? 2) - (PRIO[b.prioridad] ?? 2) || a.alias.localeCompare(b.alias));
  const isoOfDay = d => C.toISODate(C.dateOfDay(App.weekId, d));
  const closedOf = d => C.closedInfo(App.state.settings, isoOfDay(d));
  const isTodayWeek = () => App.weekId === C.isoWeekId(new Date());
  const todayLetter = () => C.DAYS[(new Date().getDay() + 6) % 7];
  const emittedKeys = () => { const s = new Set(); for (const i of App.state.invoices) if (i.estado !== 'borrador' && i.estado !== 'anulada') for (const k of i.sesiones || []) s.add(k); return s; };

  function conflictOf(session) {
    const v = C.canPlace(sessionCtx([session.id]), session.patientId, session.day, session.hour, 'AB');
    if (v.ok) return null;
    return v.reason;
  }

  function dayGlyphs(p) {
    return `<span class="days">${App.state.settings.days.map(d => {
      const a = p.avail[d] || { m: 1, t: 1 };
      const cls = (a.m === 0 && a.t === 0) ? 'd-no' : ((a.m === 2 || a.t === 2) ? 'd-pref' : 'd-ok');
      return `<span class="d ${cls}" title="${esc(C.DAY_NAMES[d])}">${d}</span>`;
    }).join('')}</span>`;
  }

  function boxHtml(p, session, extra = {}) {
    const st = App.state.settings;
    const conflict = session ? conflictOf(session) : null;
    const cls = ['box'];
    if (p.fixed) cls.push('fixed');
    if (conflict) cls.push('conflict');
    if (session && session.moved) cls.push('moved');
    if (session && p.dur > st.slotMin) cls.push('span2');
    if (extra.cls) cls.push(extra.cls);
    const icons = [];
    if (p.modalidad === 'online') icons.push(`<span title="online">${I.video}</span>`);
    if (p.fixed) icons.push(`<span title="hueco fijo">${I.pin}</span>`);
    if (conflict) icons.push(`<span title="${esc(conflict)}">${I.warn}</span>`);
    const sub = conflict ? conflict : (!session && slotsOf(p) > 0) ? `${slotsOf(p) + 1}.ª sesión semanal · arrastra a un hueco` : `${p.dur} min · ${p.modalidad}${p.freq.startsWith('quincenal') ? ' · quincenal' : ''}${session && session.moved ? ' · solo esta semana' : ''}`;
    return `<div class="${cls.join(' ')}" style="${styleOf(p)}" data-sid="${esc(session ? session.id : 'new')}" data-pid="${esc(p.id)}" role="button" tabindex="0" aria-label="${esc(p.alias)}${session ? `, ${C.DAY_NAMES[session.day]} ${C.fmtHour(session.hour)}` : ', sin hueco'}">
      <div class="t"><span class="n">${esc(shown(p))}</span><span class="icons">${icons.join('')}<span class="grip" aria-hidden="true">${I.grip}</span></span></div>
      <small>${esc(sub)}</small>
    </div>`;
  }

  // ======================================================================
  // Render principal
  // ======================================================================
  function render() {
    const root = $('#app');
    if (!App.state) { root.innerHTML = ''; return; }
    if (App.locked) { root.innerHTML = lockHtml(); return; }
    if (!App.state.settings.onboarded && !App.state.patients.length) { root.innerHTML = welcomeHtml(); return; }
    const views = { semana: semanaHtml, pacientes: pacientesHtml, facturas: facturasHtml, ajustes: ajustesHtml };
    root.innerHTML = topbarHtml() + (App.saveError ? `<div class="notice notice-danger" style="margin:8px 16px 0">${esc(App.saveError)} <button class="link" data-action="go" data-view="ajustes">Ir a copias de seguridad</button></div>` : '') + views[App.view]() + bottombarHtml();
    if (App.view === 'semana') afterRenderSemana();
  }

  function topbarHtml() {
    const st = App.state.settings;
    const wl = C.weekLabel(App.weekId, st.days);
    const wk = App.state.weeks[App.weekId];
    const tabs = ['semana', 'pacientes', 'facturas', 'ajustes'].map(v => `<button class="tab ${App.view === v ? 'on' : ''}" data-action="go" data-view="${v}">${{ semana: 'Semana', pacientes: 'Pacientes', facturas: 'Facturas', ajustes: 'Ajustes' }[v]}</button>`).join('');
    const weeknav = App.view === 'semana' ? `<div class="weeknav">
        <button class="btn btn-icon btn-sm" data-action="week" data-n="-1" aria-label="Semana anterior">${I.prev}</button>
        <span class="title">Semana ${wl.num} <span class="muted" style="font-weight:400">· ${esc(wl.range)}</span> <span class="chip chip-accent" title="Paridad para pacientes quincenales">sem. ${weekParity()}</span></span>
        <button class="btn btn-icon btn-sm" data-action="week" data-n="1" aria-label="Semana siguiente">${I.next}</button>
        ${isTodayWeek() ? '' : `<button class="btn btn-sm today" data-action="week-today">Hoy</button>`}
      </div>` : '';
    const actions = App.view === 'semana' ? `
        <button class="btn" data-action="recolocar">${I.reflow}<span class="btn-text">Recolocar</span></button>
        ${wk && wk.ok ? `<button class="btn" data-action="ok-week">${I.check}<span class="btn-text">OK dado · corregir</span></button>` : `<button class="btn btn-primary" data-action="ok-week">${I.check}<span class="btn-text">Dar el OK a la semana</span></button>`}` : '';
    const lock = App.encrypted ? `<button class="btn btn-icon" data-action="lock" title="Bloquear ahora">${I.lock}</button>` : '';
    return `<header class="topbar"><div class="wordmark">Cuadrante</div><nav class="tabs">${tabs}</nav>${weeknav}<div class="actions">${actions}${lock}</div></header>`;
  }

  function bottombarHtml() {
    const b = (v, icon, label) => `<button class="${App.view === v ? 'on' : ''}" data-action="go" data-view="${v}">${icon}${label}</button>`;
    return `<nav class="bottombar">${b('semana', I.cal, 'Semana')}${b('pacientes', I.user, 'Pacientes')}${b('facturas', I.doc, 'Facturas')}${b('ajustes', I.gear, 'Ajustes')}</nav>`;
  }

  // ---------------------------------------------------------------- Semana
  function semanaHtml() {
    const st = App.state.settings;
    const sessions = weekSessions();
    const active = App.state.patients.filter(p => p.activo !== false && !p.enEspera);
    const tray = trayPatients();
    const wait = waitPatients();
    const hours = C.workingHours(st);
    const freeSlots = st.days.length * hours.length - sessions.reduce((n, s) => n + C.span(st, patient(s.patientId)), 0);
    const conflicts = sessions.filter(conflictOf).length;
    const q = App.patientSearch.trim().toLowerCase();
    const listed = active.filter(p => !q || (p.alias + ' ' + p.nombre).toLowerCase().includes(q)).sort((a, b) => a.alias.localeCompare(b.alias));

    const drawer = `<aside class="drawer">
      <div class="searchbox">${I.search}<input class="input" id="pat-search" placeholder="Buscar paciente" value="${esc(App.patientSearch)}" aria-label="Buscar paciente"></div>
      ${tray.length ? `<div class="stack"><div class="row" style="justify-content:space-between;padding:0 4px"><span class="label" style="color:var(--ochre)">Sin hueco · ${tray.length}</span><span class="hint">arrastra a la semana</span></div><div class="tray">${tray.map(p => boxHtml(p, null)).join('')}</div></div>` : ''}
      ${wait.length ? `<div class="stack" style="gap:2px"><div class="row" style="justify-content:space-between;padding:0 4px 4px"><span class="label">En espera · ${wait.length}</span><span class="hint">toca un hueco libre</span></div>${wait.map(p => `<button class="pat ${App.selectedPatient === p.id ? 'sel' : ''}" data-action="select" data-pid="${esc(p.id)}" style="${styleOf(p)}"><span class="dot"></span><span class="name">${esc(p.alias)} <span class="sub">· ${esc(p.prioridad || 'normal')}</span></span>${dayGlyphs(p)}</button>`).join('')}</div>` : ''}
      <div class="stack" style="gap:2px">
        <div class="row" style="justify-content:space-between;padding:0 4px 6px"><span class="label">Pacientes · ${active.length}</span><button class="link" data-action="new-patient" style="font-size:12px">+ Nuevo</button></div>
        ${listed.map(p => `<button class="pat ${App.selectedPatient === p.id ? 'sel' : ''}" data-action="select" data-pid="${esc(p.id)}" style="${styleOf(p)}"><span class="dot"></span><span class="name">${esc(p.alias)}</span>${dayGlyphs(p)}</button>`).join('') || '<div class="hint" style="padding:4px">Aún no hay pacientes.</div>'}
      </div>
    </aside>`;

    const summary = `<div class="summary"><span><strong>${sessions.length}</strong> sesiones esta semana</span><span><strong>${freeSlots}</strong> huecos libres</span>${conflicts ? `<span class="danger-text"><strong>${conflicts}</strong> con conflicto</span>` : ''}${tray.length ? `<span style="color:var(--ochre)"><strong>${tray.length}</strong> sin hueco</span>` : ''}${st.discreet ? '<span class="chip">modo discreto</span>' : ''}</div>`;

    const mobileTray = tray.length ? `<div class="mobile-tray">${tray.map(p => boxHtml(p, null)).join('')}</div>` : '';
    return `<div class="main">${drawer}<section class="center">${summary}${mobileTray}${daystripHtml(sessions)}${gridHtml(sessions)}${daylistHtml(sessions)}</section>${App.selectedPatient ? sheetHtml() : ''}</div>`;
  }

  function dayheadHtml(d, cls = '') {
    const date = C.dateOfDay(App.weekId, d);
    const closed = closedOf(d);
    const today = isTodayWeek() && todayLetter() === d;
    return `<div class="dayhead ${today ? 'today' : ''} ${closed ? 'closed' : ''} ${cls}"><span class="label">${C.DAY_SHORT[d]}${today ? ' · hoy' : ''}${closed ? ' · ' + esc(closed.motivo || 'cerrado') : ''}</span><span class="num">${date.getDate()}</span></div>`;
  }

  function gridHtml(sessions) {
    const st = App.state.settings;
    const hours = C.workingHours(st);
    const bySlot = new Map();
    for (const s of sessions) bySlot.set(`${s.day}-${s.hour}`, s);
    const covered = new Set();
    for (const s of sessions) { const n = C.span(st, patient(s.patientId)); for (let k = 1; k < n; k++) covered.add(`${s.day}-${s.hour + k}`); }
    const now = new Date();
    let html = `<div class="gridwrap"><div class="grid" style="--cols:${st.days.length}"><div class="dayhead"></div>${st.days.map(d => dayheadHtml(d)).join('')}`;
    let prev = null;
    for (const h of hours) {
      if (prev !== null && h !== prev + 1) html += `<div class="breakrow">Descanso ${C.fmtHour(prev + 1)} – ${C.fmtHour(h)}</div>`;
      html += `<div class="hour mono">${C.fmtHour(h)}</div>`;
      for (const d of st.days) {
        const s = bySlot.get(`${d}-${h}`);
        const closed = closedOf(d);
        const nowline = isTodayWeek() && todayLetter() === d && now.getHours() === h ? `<div class="nowline" style="top:${(now.getMinutes() / 60 * 100).toFixed(1)}%"></div>` : '';
        html += `<div class="cell ${closed ? 'closed' : ''}" data-cell data-day="${d}" data-hour="${h}" ${covered.has(`${d}-${h}`) ? 'data-covered="1"' : ''}>${nowline}${s ? boxHtml(patient(s.patientId), s) : ''}</div>`;
      }
      prev = h;
    }
    return html + '</div></div>';
  }

  function daystripHtml(sessions) {
    const st = App.state.settings;
    if (!App.mobileDay || !st.days.includes(App.mobileDay)) App.mobileDay = (isTodayWeek() && st.days.includes(todayLetter())) ? todayLetter() : st.days[0];
    return `<div class="daystrip">${st.days.map(d => {
      const date = C.dateOfDay(App.weekId, d);
      const n = sessions.filter(s => s.day === d).length;
      const today = isTodayWeek() && todayLetter() === d;
      return `<button class="daychip ${App.mobileDay === d ? 'on' : ''}" data-action="mobile-day" data-day="${d}"><span class="label">${C.DAY_SHORT[d]}${today ? ' · hoy' : ''}</span>${date.getDate()}<span class="cnt">${n ? n + ' ses.' : '—'}</span></button>`;
    }).join('')}</div>`;
  }

  function daylistHtml(sessions) {
    const st = App.state.settings;
    const d = App.mobileDay;
    const hours = C.workingHours(st);
    const closed = closedOf(d);
    const bySlot = new Map(sessions.filter(s => s.day === d).map(s => [s.hour, s]));
    const now = new Date();
    let html = `<div class="daylist">${closed ? `<div class="notice notice-warn" style="margin:10px 12px">${esc(C.DAY_NAMES[d])}: ${esc(closed.motivo || 'consulta cerrada')}</div>` : ''}`;
    let prev = null;
    for (const h of hours) {
      if (prev !== null && h !== prev + 1) html += `<div class="slot"><div class="breakrow">Descanso ${C.fmtHour(prev + 1)} – ${C.fmtHour(h)}</div></div>`;
      const s = bySlot.get(h);
      const nowline = isTodayWeek() && todayLetter() === d && now.getHours() === h ? `<div class="nowline" style="top:${(now.getMinutes() / 60 * 100).toFixed(1)}%"></div>` : '';
      html += `<div class="slot ${closed ? 'closed' : ''}"><div class="hour mono">${C.fmtHour(h)}</div><div class="cell" data-cell data-day="${d}" data-hour="${h}">${nowline}${s ? boxHtml(patient(s.patientId), s) : ''}</div></div>`;
      prev = h;
    }
    return html + '</div>';
  }

  function sheetHtml() {
    const p = patient(App.selectedPatient);
    if (!p) { App.selectedPatient = null; return ''; }
    const st = App.state.settings;
    const sess = weekSessions().filter(s => s.patientId === p.id);
    const tmpl = App.state.slots.filter(s => s.patientId === p.id);
    const where = p.enEspera ? 'En lista de espera' : sess.length ? sess.map(s => `${C.DAY_SHORT[s.day]} ${C.fmtHour(s.hour)}${s.moved ? ' (esta semana)' : ''}`).join(', ') : (tmpl.length ? 'No viene esta semana' : 'Sin hueco');
    const motivos = st.days.filter(d => (p.avail[d] || {}).motivo).map(d => `<div class="row" style="align-items:flex-start;gap:8px;font-size:13px"><span class="mono" style="color:${(p.avail[d].m === 0 && p.avail[d].t === 0) ? 'var(--danger)' : 'var(--muted)'};flex:none;width:32px">${C.DAY_SHORT[d]}</span><span>${esc(p.avail[d].motivo)}</span></div>`).join('');
    const closedKeys = emittedKeys();
    return `<aside class="sheet" aria-label="Ficha de ${esc(p.alias)}">
      <div class="row" style="justify-content:space-between">
        <div class="row" style="${styleOf(p)}"><span class="dot" style="width:14px;height:14px"></span><h3>${esc(p.alias)}</h3></div>
        <div class="row" style="gap:6px"><button class="btn btn-sm" data-action="edit-patient" data-pid="${esc(p.id)}">Editar</button><button class="btn btn-icon btn-sm" data-action="select" data-pid="" aria-label="Cerrar">${I.close}</button></div>
      </div>
      ${p.nombre && !st.discreet ? `<div class="hint">${esc(p.nombre)}</div>` : ''}
      <div class="kv">
        <div><span class="label">Frecuencia</span><div class="v">${freqLabel(p.freq)}</div></div>
        <div><span class="label">Sesión</span><div class="v">${p.dur} min · ${p.modalidad}</div></div>
        <div><span class="label">Tarifa</span><div class="v mono">${C.fmtEuro(p.tarifa)}</div></div>
        <div><span class="label">Hueco</span><div class="v">${esc(where)}</div></div>
      </div>
      <div class="field"><span class="label">Disponibilidad</span>${availMatrixHtml(p, false)}<div class="legend"><span><i style="background:var(--accent)"></i>prefiere</span><span><i style="background:var(--accent-soft-2)"></i>puede</span><span><i style="background:var(--danger-soft)"></i>no puede</span></div></div>
      ${motivos ? `<div class="field"><span class="label">Motivos</span>${motivos}</div>` : ''}
      ${p.notas ? `<div class="field"><span class="label">Notas</span><div style="font-size:13px;line-height:1.45">${esc(p.notas)}</div></div>` : ''}
      <div class="field"><span class="label">Mover a…</span><div class="hint">Solo se muestran los huecos donde puede esta semana.</div>${moveListHtml(p, sess[0])}</div>
      <div class="stack" style="margin-top:auto;padding-top:12px;border-top:1px solid var(--line-2)">
        <div class="row" style="justify-content:space-between"><span class="row" style="gap:8px;font-size:13px">${I.pin} Hueco fijo (Recolocar no lo mueve)</span><button class="toggle ${p.fixed ? 'on' : ''}" data-action="toggle-fixed" data-pid="${esc(p.id)}" role="switch" aria-checked="${p.fixed ? 'true' : 'false'}" aria-label="Hueco fijo"></button></div>
        ${p.enEspera ? `<div class="notice">En lista de espera · prioridad ${esc(p.prioridad || 'normal')}. Elige un hueco en "Mover a…" o toca un hueco libre del cuadrante para darle de alta.</div>` : ''}
        ${sess.length ? `<button class="btn btn-sm" data-action="copy-reminder" data-pid="${esc(p.id)}">Copiar recordatorio de la cita</button>` : ''}
        ${!p.enEspera && slotsOf(p) >= Math.max(1, p.sesiones || 1) ? `<button class="btn btn-sm" data-action="add-session" data-pid="${esc(p.id)}">Añadir otra sesión semanal</button>` : ''}
        ${sess.length ? `<button class="btn btn-sm" data-action="skip-week" data-sid="${esc(sess[0].id)}" ${closedKeys.has(`${App.weekId}:${sess[0].id}`) ? 'disabled title="Esta sesión ya está en una factura emitida"' : ''}>No viene esta semana</button>` : ''}
        ${tmpl.length ? `<button class="btn btn-sm" data-action="remove-slot" data-pid="${esc(p.id)}">Quitar del cuadrante (a "sin hueco")</button>` : ''}
      </div>
    </aside>`;
  }

  function availMatrixHtml(p, editable) {
    const st = App.state.settings;
    const cell = (d, b) => {
      const v = (p.avail[d] || {})[b] ?? 1;
      const txt = v === 0 ? 'no' : (v === 2 ? 'mejor' : 'puede');
      return editable ? `<button type="button" class="av av-${v}" data-action="av-cycle" data-day="${d}" data-band="${b}" aria-label="${C.DAY_NAMES[d]} ${b === 'm' ? 'mañana' : 'tarde'}: ${txt}">${txt}</button>` : `<span class="av av-${v}">${txt}</span>`;
    };
    return `<div class="avail" style="--n:${st.days.length}"><span></span>${st.days.map(d => `<span class="label" style="text-align:center">${C.DAY_SHORT[d]}</span>`).join('')}
      <span class="hint">Mañana</span>${st.days.map(d => cell(d, 'm')).join('')}
      <span class="hint">Tarde</span>${st.days.map(d => cell(d, 't')).join('')}
      ${editable ? `<span class="hint">Horas</span>${st.days.map(d => `<input class="input input-sm mono" data-field="hours" data-day="${d}" value="${esc(hoursText(p.avail[d]))}" placeholder="todas" aria-label="Horas concretas ${C.DAY_NAMES[d]}" title="Ej.: 16-20">`).join('')}` : (st.days.some(d => (p.avail[d] || {}).hours) ? `<span class="hint">Horas</span>${st.days.map(d => `<span class="hint mono" style="text-align:center">${esc(hoursText(p.avail[d]) || '—')}</span>`).join('')}` : '')}
    </div>`;
  }
  const hoursText = a => (a && Array.isArray(a.hours) && a.hours.length === 2) ? `${a.hours[0]}-${a.hours[1]}` : '';

  function moveListHtml(p, session) {
    const ctx = sessionCtx(session ? [session.id] : []);
    const valid = C.validSlots(ctx, p.id, 'AB').filter(v => v.ok && !(session && v.day === session.day && v.hour === session.hour));
    if (!valid.length) return '<div class="hint">No hay ningún hueco libre compatible esta semana.</div>';
    return `<div class="movelist">${valid.map(v => `<button type="button" data-action="move-to" data-pid="${esc(p.id)}" data-sid="${esc(session ? session.id : 'new')}" data-day="${v.day}" data-hour="${v.hour}"><span>${C.DAY_NAMES[v.day]} <span class="mono">${C.fmtHour(v.hour)}</span></span>${v.pref ? '<span class="pref">prefiere</span>' : ''}</button>`).join('')}</div>`;
  }

  function afterRenderSemana() {
    const input = $('#pat-search');
    if (input) { input.addEventListener('input', e => { App.patientSearch = e.target.value; const pos = e.target.selectionStart; render(); const el = $('#pat-search'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }); }
    const wrap = $('.gridwrap');
    if (wrap && !wrap.dataset.scrolled) {
      wrap.dataset.scrolled = '1';
      const nl = $('.nowline', wrap);
      if (nl) nl.closest('.cell').scrollIntoView({ block: 'center' });
    }
  }

  // ======================================================================
  // Arrastrar y soltar (Pointer Events)
  // ======================================================================
  const Drag = { active: null };
  function dragStart(e, box) {
    const sid = box.dataset.sid, pid = box.dataset.pid;
    const p = patient(pid);
    if (!p || p.fixed) return;
    if (e.pointerType === 'touch' && !e.target.closest('.grip')) return;
    if (e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    const rect = box.getBoundingClientRect();
    Drag.active = { sid, pid, box, startX: e.clientX, startY: e.clientY, offX: e.clientX - rect.left, offY: e.clientY - rect.top, width: rect.width, started: false, over: null, valid: null, dayTimer: null, raf: null, lastX: 0, lastY: 0, pointerId: e.pointerId };
    box.setPointerCapture(e.pointerId);
  }
  function dragBegin() {
    const d = Drag.active;
    d.started = true;
    document.body.classList.add('dragging');
    const session = d.sid === 'new' ? null : weekSessions().find(s => s.id === d.sid);
    const ctx = sessionCtx(session ? [session.id] : []);
    d.valid = new Map();
    for (const v of C.validSlots(ctx, d.pid, 'AB')) {
      let swap = null;
      if (!v.ok && v.occupiedBy.length === 1 && session) {
        const other = ctx.sessions.find(s => s.id === v.occupiedBy[0]);
        const op = patient(other.patientId);
        if (op && !op.fixed && !other.extra) {
          const ctx2 = sessionCtx([session.id, other.id]);
          const back = C.canPlace(ctx2, other.patientId, session.day, session.hour, 'AB');
          const mine = C.canPlace(ctx2, d.pid, v.day, v.hour, 'AB');
          if (back.ok && mine.ok) swap = other;
        }
      }
      d.valid.set(`${v.day}-${v.hour}`, { ...v, swap });
    }
    for (const cell of $$('[data-cell]')) {
      const v = d.valid.get(`${cell.dataset.day}-${cell.dataset.hour}`);
      if (!v) continue;
      if (session && v.day === session.day && Number(v.hour) === session.hour) continue;
      cell.classList.add(v.ok || v.swap ? 'ok' : 'no');
      if (v.pref && (v.ok || v.swap)) cell.classList.add('pref');
      if (!v.ok && !v.swap) cell.dataset.reason = v.reason;
    }
    d.box.classList.add('lifted');
    const ghost = d.box.cloneNode(true);
    ghost.classList.remove('lifted', 'span2', 'half', 'b');
    ghost.classList.add('ghost');
    ghost.style.width = d.width + 'px';
    ghost.style.height = '';
    $('#ghost-layer').appendChild(ghost);
    d.ghost = ghost;
    if (navigator.vibrate) navigator.vibrate(20);
  }
  function dragMove(e) {
    const d = Drag.active;
    if (!d) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 5) return;
      dragBegin();
    }
    d.lastX = e.clientX; d.lastY = e.clientY;
    d.ghost.style.transform = `translate(${e.clientX - d.offX}px, ${e.clientY - d.offY}px)`;
    d.ghost.style.display = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    d.ghost.style.display = '';
    const cell = el && el.closest('[data-cell]');
    const chip = el && el.closest('.daychip');
    if (chip) {
      if (!d.dayTimer && chip.dataset.day !== App.mobileDay) {
        $$('.daychip').forEach(c => c.classList.remove('over')); chip.classList.add('over');
        d.dayTimer = setTimeout(() => { d.dayTimer = null; App.mobileDay = chip.dataset.day; render(); reapplyValid(); }, 350);
      }
    } else if (d.dayTimer) { clearTimeout(d.dayTimer); d.dayTimer = null; $$('.daychip').forEach(c => c.classList.remove('over')); }
    setOver(cell);
    if (!d.raf) d.raf = requestAnimationFrame(autoScroll);
  }
  function reapplyValid() {
    const d = Drag.active; if (!d) return;
    const session = d.sid === 'new' ? null : weekSessions().find(s => s.id === d.sid);
    for (const cell of $$('[data-cell]')) {
      const v = d.valid.get(`${cell.dataset.day}-${cell.dataset.hour}`);
      if (!v) continue;
      if (session && v.day === session.day && Number(v.hour) === session.hour) continue;
      cell.classList.add(v.ok || v.swap ? 'ok' : 'no');
      if (v.pref && (v.ok || v.swap)) cell.classList.add('pref');
    }
    const box = $(`.box[data-sid="${CSS.escape(d.sid)}"]`);
    if (box) box.classList.add('lifted');
  }
  function setOver(cell) {
    const d = Drag.active;
    if (d.over && d.over !== cell) { d.over.classList.remove('over', 'swap'); hideTip(); }
    d.over = cell;
    if (!cell) return;
    const v = d.valid.get(`${cell.dataset.day}-${cell.dataset.hour}`);
    cell.classList.add('over');
    if (v && v.swap) cell.classList.add('swap');
    if (v && !v.ok && !v.swap) showTip(v.reason, d.lastX, d.lastY);
    else if (v && v.swap) showTip(`Intercambiar con ${patient(v.swap.patientId).alias}`, d.lastX, d.lastY);
    else hideTip();
  }
  function autoScroll() {
    const d = Drag.active; if (!d || !d.started) { if (d) d.raf = null; return; }
    const sc = $('.gridwrap') && $('.gridwrap').offsetParent ? $('.gridwrap') : $('.daylist');
    if (sc) {
      const r = sc.getBoundingClientRect();
      const edge = 48;
      if (d.lastY < r.top + edge) sc.scrollTop -= 8;
      else if (d.lastY > r.bottom - edge) sc.scrollTop += 8;
      if (d.lastX < r.left + edge) sc.scrollLeft -= 8;
      else if (d.lastX > r.right - edge) sc.scrollLeft += 8;
    }
    d.raf = requestAnimationFrame(autoScroll);
  }
  function dragEnd(e, cancelled) {
    const d = Drag.active;
    if (!d) return;
    Drag.active = null;
    if (d.raf) cancelAnimationFrame(d.raf);
    if (d.dayTimer) clearTimeout(d.dayTimer);
    document.body.classList.remove('dragging');
    hideTip();
    if (!d.started) { if (!cancelled) openSheet(d.pid); return; }
    if (d.ghost) d.ghost.remove();
    $$('.cell.ok, .cell.no, .cell.over').forEach(c => { c.classList.remove('ok', 'no', 'pref', 'over', 'swap'); delete c.dataset.reason; });
    $$('.daychip.over').forEach(c => c.classList.remove('over'));
    $$('.box.lifted').forEach(b => b.classList.remove('lifted'));
    if (cancelled || !d.over) return;
    const v = d.valid.get(`${d.over.dataset.day}-${d.over.dataset.hour}`);
    if (!v) return;
    if (!v.ok && !v.swap) { toast(v.reason, null, { error: true }); return; }
    const session = d.sid === 'new' ? null : weekSessions().find(s => s.id === d.sid);
    if (session && session.day === v.day && session.hour === Number(v.hour)) return;
    askScope(d.lastX, d.lastY, scope => performMove(d.sid, d.pid, v.day, Number(v.hour), v.swap ? v.swap.id : null, scope));
  }
  let tipEl = null;
  function showTip(text, x, y) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); }
    tipEl.textContent = text;
    const w = tipEl.offsetWidth || 200;
    tipEl.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 14)) + 'px';
    tipEl.style.top = Math.max(8, y - 44) + 'px';
  }
  function hideTip() { if (tipEl) { tipEl.remove(); tipEl = null; } }

  /** Popover "¿Solo esta semana o todas?" */
  function askScope(x, y, cb) {
    closePopover();
    const pop = document.createElement('div');
    pop.className = 'popover';
    pop.innerHTML = `<button class="btn btn-sm" data-scope="week">Solo esta semana</button><button class="btn btn-sm btn-primary" data-scope="all">Todas las semanas (plantilla)</button><button class="btn btn-sm btn-ghost" data-scope="cancel">Cancelar</button>`;
    document.body.appendChild(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, y + 12)) + 'px';
    pop.addEventListener('click', e => { const b = e.target.closest('[data-scope]'); if (!b) return; closePopover(); if (b.dataset.scope !== 'cancel') cb(b.dataset.scope); });
    setTimeout(() => document.addEventListener('pointerdown', onOutside, { once: true }), 0);
    function onOutside(e) { if (!pop.contains(e.target)) closePopover(); }
  }
  function closePopover() { $$('.popover').forEach(p => p.remove()); }

  /** Mueve (o intercambia) una sesión: en la plantilla o solo en esta semana. */
  function performMove(sid, pid, day, hour, swapSid, scope) {
    const p = patient(pid);
    const session = sid === 'new' ? null : weekSessions().find(s => s.id === sid);
    const other = swapSid ? weekSessions().find(s => s.id === swapSid) : null;
    const label = `${p.alias} → ${C.DAY_NAMES[day]} ${C.fmtHour(hour)}${other ? ` (intercambio con ${patient(other.patientId).alias})` : ''}`;
    commit(st => {
      const pp = st.patients.find(x => x.id === pid);
      if (pp && pp.enEspera) { pp.enEspera = false; pp.activo = true; }
      const wk = st.weeks[App.weekId] || (st.weeks[App.weekId] = { moves: {}, sessions: {} });
      wk.moves = wk.moves || {};
      if (scope === 'week') {
        if (sid === 'new') wk.moves[C.uid('x')] = { patientId: pid, day, hour };
        else wk.moves[sid] = Object.assign(session && session.extra ? { patientId: pid } : {}, { day, hour });
        if (other) wk.moves[other.id] = Object.assign(other.extra ? { patientId: other.patientId } : {}, { day: session.day, hour: session.hour });
      } else {
        const slot = st.slots.find(s => s.id === sid);
        if (slot) { slot.day = day; slot.hour = hour; delete wk.moves[sid]; }
        else st.slots.push({ id: C.uid('s'), patientId: pid, day, hour });
        if (session && session.extra) delete wk.moves[sid];
        if (other) {
          const os = st.slots.find(s => s.id === other.id);
          if (os) { os.day = session.day; os.hour = session.hour; delete wk.moves[other.id]; }
        }
      }
    }, { undo: true, toast: label, announce: label });
  }

  // ---------------------------------------------------------------- Mover con teclado
  const Kb = { active: null };
  const cellEl = (day, hour) => $(`[data-cell][data-day="${day}"][data-hour="${hour}"]`);
  function kbStart(box) {
    const sid = box.dataset.sid, pid = box.dataset.pid; const p = patient(pid);
    if (!p || p.fixed) { if (p && p.fixed) toast('Hueco fijo: desactívalo en la ficha para moverlo.'); return; }
    const session = sid === 'new' ? null : weekSessions().find(s => s.id === sid);
    const list = C.validSlots(sessionCtx(session ? [session.id] : []), pid, 'AB').filter(v => v.ok && !(session && v.day === session.day && v.hour === session.hour));
    if (!list.length) { toast('No hay ningún hueco libre compatible esta semana.'); return; }
    let idx = 0;
    if (session) { const i = list.findIndex(v => C.DAYS.indexOf(v.day) > C.DAYS.indexOf(session.day) || (v.day === session.day && v.hour > session.hour)); idx = i >= 0 ? i : 0; }
    Kb.active = { sid, pid, list, idx };
    for (const v of list) { const c = cellEl(v.day, v.hour); if (c) { c.classList.add('ok'); if (v.pref) c.classList.add('pref'); } }
    kbHighlight();
    toast('Flechas para elegir hueco · Enter para soltar · Esc para cancelar', null, { sticky: true });
  }
  function kbHighlight() {
    const k = Kb.active; $$('.cell.kb').forEach(c => c.classList.remove('kb'));
    const v = k.list[k.idx]; const c = cellEl(v.day, v.hour);
    if (c) { c.classList.add('kb'); c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    $('#live').textContent = `${C.DAY_NAMES[v.day]} ${C.fmtHour(v.hour)}${v.pref ? ', hueco preferido' : ''}`;
  }
  function kbStep(dir, sameHour) {
    const k = Kb.active; const cur = k.list[k.idx];
    if (sameHour) {
      const di = C.DAYS.indexOf(cur.day);
      for (let d = di + dir; d >= 0 && d < 7; d += dir) { const j = k.list.findIndex(v => v.day === C.DAYS[d] && v.hour === cur.hour); if (j >= 0) { k.idx = j; kbHighlight(); return; } }
    }
    k.idx = (k.idx + dir + k.list.length) % k.list.length; kbHighlight();
  }
  function kbEnd(drop) {
    const k = Kb.active; if (!k) return; Kb.active = null;
    $$('.cell.ok, .cell.kb').forEach(c => c.classList.remove('ok', 'pref', 'kb'));
    $('#toast').hidden = true;
    if (!drop) return;
    const v = k.list[k.idx]; const c = cellEl(v.day, v.hour);
    const r = c ? c.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    askScope(r.left + r.width / 2, r.top + r.height / 2, scope => performMove(k.sid, k.pid, v.day, v.hour, null, scope));
  }

  // ---------------------------------------------------------------- Hueco libre → sugerir de la lista de espera
  function suggestForCell(cell, e) {
    const wait = waitPatients();
    if (!wait.length || cell.querySelector('.box') || cell.dataset.covered) return;
    const day = cell.dataset.day, hour = Number(cell.dataset.hour);
    const cands = C.suggestForSlot(App.state, weekSessions(), day, hour);
    if (!cands.length) { toast(`Nadie de la lista de espera puede el ${C.DAY_NAMES[day].toLowerCase()} a las ${C.fmtHour(hour)}.`); return; }
    closePopover();
    const pop = document.createElement('div'); pop.className = 'popover';
    pop.innerHTML = `<div class="label" style="padding:4px 6px">${C.DAY_NAMES[day]} ${C.fmtHour(hour)} · en espera</div>` + cands.slice(0, 6).map(c => `<button class="btn btn-sm" data-wpid="${esc(c.patient.id)}" style="justify-content:space-between;${styleOf(c.patient)}"><span class="row"><span class="dot"></span>${esc(c.patient.alias)}</span><span class="hint">${esc(c.patient.prioridad || 'normal')}${c.pref ? ' · prefiere' : ''}</span></button>`).join('') + `<button class="btn btn-sm btn-ghost" data-wpid="">Cancelar</button>`;
    document.body.appendChild(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, e.clientY + 8)) + 'px';
    pop.addEventListener('click', ev => { const b = ev.target.closest('[data-wpid]'); if (!b) return; const pid = b.dataset.wpid; closePopover(); if (pid) performMove('new', pid, day, hour, null, 'all'); });
    setTimeout(() => document.addEventListener('pointerdown', ev => { if (!pop.contains(ev.target)) closePopover(); }, { once: true }), 0);
  }

  // ======================================================================
  // Diálogos
  // ======================================================================
  function openDialog(html, opts = {}) {
    const root = $('#dialog-root');
    root.innerHTML = `<div class="overlay" data-overlay><div class="dialog ${opts.size || ''}" role="dialog" aria-modal="true">${html}</div></div>`;
    const first = $('.dialog [autofocus], .dialog input, .dialog button', root);
    if (first) first.focus();
    return root;
  }
  function closeDialog() { $('#dialog-root').innerHTML = ''; }
  function confirmDialog({ title, text, ok = 'Aceptar', danger = false }) {
    return new Promise(resolve => {
      openDialog(`<header><h2>${esc(title)}</h2>${text ? `<div class="sub">${text}</div>` : ''}</header><footer><div class="right"><button class="btn" data-action="dialog-cancel">Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="dialog-ok" autofocus>${esc(ok)}</button></div></footer>`, { size: 'dialog-sm' });
      $('#dialog-root').onclick = e => { if (e.target.closest('[data-action="dialog-ok"]')) { closeDialog(); resolve(true); } else if (e.target.closest('[data-action="dialog-cancel"]') || e.target.matches('[data-overlay]')) { closeDialog(); resolve(false); } };
    });
  }
  function promptDialog({ title, text, label = '', placeholder = '', type = 'text', ok = 'Aceptar', value = '' }) {
    return new Promise(resolve => {
      openDialog(`<header><h2>${esc(title)}</h2>${text ? `<div class="sub">${text}</div>` : ''}</header><div class="body" style="padding:14px 22px"><label class="field"><span class="label">${esc(label)}</span><input class="input" id="prompt-input" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" autofocus autocomplete="off"></label></div><footer><div class="right"><button class="btn" data-action="dialog-cancel">Cancelar</button><button class="btn btn-primary" data-action="dialog-ok">${esc(ok)}</button></div></footer>`, { size: 'dialog-sm' });
      const done = v => { closeDialog(); resolve(v); };
      $('#prompt-input').addEventListener('keydown', e => { if (e.key === 'Enter') done($('#prompt-input').value); if (e.key === 'Escape') done(null); });
      $('#dialog-root').onclick = e => { if (e.target.closest('[data-action="dialog-ok"]')) done($('#prompt-input').value); else if (e.target.closest('[data-action="dialog-cancel"]') || e.target.matches('[data-overlay]')) done(null); };
    });
  }

  // ---------------------------------------------------------------- Recolocar
  const Reflow = { opts: { keepFixed: true, minimalMoves: true, compact: false }, seed: 1, proposal: null };
  function openReflow() {
    if (!App.state.patients.some(p => p.activo !== false)) { toast('Primero añade pacientes.'); return; }
    Reflow.seed = 1;
    runReflow();
  }
  function runReflow() {
    Reflow.proposal = C.propose(App.state, { ...Reflow.opts, seed: Reflow.seed });
    renderReflow();
  }
  function renderReflow() {
    const pr = Reflow.proposal, sc = pr.score;
    const opt = (key, label) => `<label class="opt"><span>${label}</span><button class="toggle ${Reflow.opts[key] ? 'on' : ''}" data-action="reflow-opt" data-key="${key}" role="switch" aria-checked="${Reflow.opts[key]}"></button></label>`;
    const chip = (p, d) => d ? `<span class="chip" style="${styleOf(p)};background:var(--pb);color:var(--pf);border-color:transparent">${C.DAY_SHORT[d.day]} ${C.fmtHour(d.hour)}</span>` : '<span class="chip chip-ochre">sin hueco</span>';
    const rows = pr.diff.map(u => { const p = patient(u.patientId); return `<div class="move"><span class="row" style="${styleOf(p)}"><span class="dot"></span>${esc(p.alias)}</span>${chip(p, u.from)}<span class="muted">${I.arrow}</span>${chip(p, u.to)}<span class="why">${esc(u.reason)}</span></div>`; }).join('');
    const pend = pr.pending.map(x => { const p = patient(x.patientId); return `<div class="move"><span class="row" style="${styleOf(p)}"><span class="dot"></span>${esc(p.alias)}</span><span class="chip chip-danger">pendiente</span><span></span><span></span><span class="why">${esc(x.reason)}</span></div>`; }).join('');
    const same = sc.total - pr.diff.length - pr.pending.filter(x => !pr.diff.some(d => d.id === x.unitId)).length;
    const html = `<header>
        <div class="row wrap" style="justify-content:space-between;align-items:flex-start">
          <div><h2>Propuesta de recolocación</h2><div class="sub">Nada cambia hasta que pulses Aplicar. Podrás deshacer.</div></div>
          <div class="stats">
            <div><span class="label">Con hueco</span><div class="n mono">${sc.placedBefore} <span class="muted" style="font-weight:400">→</span> ${sc.placedAfter} <span class="hint">de ${sc.total}</span></div></div>
            <div><span class="label">Preferencias</span><div class="n mono">${sc.prefBefore} <span class="muted" style="font-weight:400">→</span> ${sc.prefAfter} <span class="hint">de ${sc.withPref}</span></div></div>
            <div><span class="label">Conflictos</span><div class="n mono" style="color:${sc.hardBefore ? 'var(--danger)' : 'inherit'}">${sc.hardBefore} <span class="muted" style="font-weight:400">→</span> <span style="color:${sc.hardAfter ? 'var(--danger)' : 'var(--accent)'}">${sc.hardAfter}</span></div></div>
          </div>
        </div>
        <div class="opts">${opt('keepFixed', 'Respetar huecos fijos')}${opt('minimalMoves', 'Mover lo mínimo posible')}${opt('compact', 'Compactar (sin huecos entre sesiones)')}</div>
      </header>
      <div class="body">
        <div class="move" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="label">Paciente</span><span class="label">Ahora</span><span></span><span class="label">Propuesto</span><span class="label">Por qué</span></div>
        ${rows || '<div class="hint" style="padding:14px 0">No hace falta mover a nadie: el cuadrante ya cumple todas las restricciones.</div>'}
        ${pend}
      </div>
      <footer><span class="hint">${pr.diff.length} cambios · ${same} se quedan donde están · propuesta nº ${Reflow.seed}</span><div class="right"><button class="btn" data-action="reflow-again">Otra propuesta</button><button class="btn" data-action="dialog-close">Descartar</button><button class="btn btn-primary" data-action="reflow-apply" ${pr.diff.length ? '' : 'disabled'}>${I.check}Aplicar ${pr.diff.length} cambios</button></div></footer>`;
    openDialog(html);
  }

  // ---------------------------------------------------------------- OK semanal
  const Review = { rows: null };
  function openReview() {
    Review.rows = C.weekReview(App.state, App.weekId);
    if (!Review.rows.length) { toast('Esta semana no tiene sesiones.'); return; }
    renderReview();
  }
  function renderReview() {
    const st = App.state.settings;
    const wk = App.state.weeks[App.weekId];
    const emitted = emittedKeys();
    const wl = C.weekLabel(App.weekId, st.days);
    const rows = Review.rows;
    const billable = rows.filter(r => r.status === 'realizada' || r.cobrar);
    const total = billable.reduce((n, r) => n + (Number(r.importe) || 0), 0);
    let html = '', lastDay = null;
    rows.forEach((r, i) => {
      const p = patient(r.patientId);
      const locked = emitted.has(`${App.weekId}:${r.id}`);
      if (r.day !== lastDay) { html += `<div class="dayhdr label">${C.DAY_NAMES[r.day]} ${C.dateOfDay(App.weekId, r.day).getDate()}${r.closed ? ' · ' + esc(r.closed) : ''}</div>`; lastDay = r.day; }
      const seg = (k, cls, label) => `<button type="button" class="${cls} ${r.status === k ? 'on' : ''}" data-action="rev-status" data-i="${i}" data-status="${k}" ${locked ? 'disabled' : ''}>${label}</button>`;
      html += `<div class="sess"><span class="mono muted">${C.fmtHour(r.hour)}</span><span class="row" style="${styleOf(p)}"><span class="dot"></span>${esc(p.alias)}${locked ? '<span class="chip" title="Ya está en una factura emitida">facturada</span>' : ''}</span>
        <div class="seg seg-sm">${seg('realizada', 'st-ok', 'Realizada')}${seg('cancelada', 'st-canc', 'Cancelada')}${seg('novino', 'st-nov', 'No vino')}</div>
        <span class="row" style="justify-content:flex-end;gap:6px">${r.status !== 'realizada' ? `<label class="check hint"><input type="checkbox" data-action="rev-cobrar" data-i="${i}" ${r.cobrar ? 'checked' : ''} ${locked ? 'disabled' : ''}>se cobra</label>` : ''}${(r.status === 'realizada' || r.cobrar) ? `<input class="input input-sm mono" type="number" min="0" step="0.5" value="${r.importe}" data-action="rev-importe" data-i="${i}" ${locked ? 'disabled' : ''} aria-label="Importe">` : ''}</span></div>`;
    });
    openDialog(`<header><div class="row wrap" style="justify-content:space-between;align-items:flex-start"><div><h2>${wk && wk.ok ? 'Corregir' : 'Dar el OK a'} la semana ${wl.num}</h2><div class="sub">Marca lo que pasó de verdad. Las sesiones realizadas (o cobradas) quedan listas para facturar.</div></div>
      <div class="stats"><div><span class="label">Sesiones</span><div class="n mono">${rows.length}</div></div><div><span class="label">Realizadas</span><div class="n mono" style="color:var(--accent)">${rows.filter(r => r.status === 'realizada').length}</div></div><div><span class="label">A facturar</span><div class="n mono">${C.fmtEuro(total)}</div></div></div></div></header>
      <div class="body">${html}</div>
      <footer><span class="hint">Podrás corregir una sesión mientras no esté en una factura emitida.</span><div class="right"><button class="btn" data-action="dialog-close">Cerrar sin OK</button><button class="btn btn-primary" data-action="review-ok">${I.check}Dar el OK · ${billable.length} sesiones</button></div></footer>`);
  }

  // ======================================================================
  // Pacientes
  // ======================================================================
  function pacientesHtml() {
    const all = App.state.patients.slice().sort((a, b) => a.alias.localeCompare(b.alias));
    const q = App.patientSearch.trim().toLowerCase();
    const matchF = (p, f) => f === 'todos' ? true : f === 'espera' ? (p.enEspera && p.activo !== false) : f === 'inactivos' ? p.activo === false : (p.activo !== false && !p.enEspera);
    const list = all.filter(p => matchF(p, App.patientFilter) && (!q || (p.alias + ' ' + p.nombre).toLowerCase().includes(q)));
    const slotOf = p => { if (p.enEspera) return 'en espera'; const s = App.state.slots.filter(x => x.patientId === p.id); return s.length ? s.map(x => `${C.DAY_SHORT[x.day]} ${C.fmtHour(x.hour)}`).join(', ') : '—'; };
    const side = `<aside class="page-side">
      <div class="searchbox">${I.search}<input class="input" id="pat-search" placeholder="Buscar" value="${esc(App.patientSearch)}" aria-label="Buscar paciente"></div>
      <div class="stack" style="gap:2px">${['activos', 'espera', 'todos', 'inactivos'].map(f => `<button class="fil ${App.patientFilter === f ? 'on' : ''}" data-action="pat-filter" data-f="${f}">${{ activos: 'Activos', espera: 'En espera', todos: 'Todos', inactivos: 'De baja' }[f]} · ${all.filter(p => matchF(p, f)).length}</button>`).join('')}</div>
      <button class="btn btn-primary" data-action="new-patient">${I.plus}Nuevo paciente</button>
      <div class="hint">Usa iniciales o un alias en la rejilla; el nombre fiscal solo hace falta para la factura.</div>
    </aside>`;
    const main = App.editing ? patientFormHtml() : `<div class="row wrap" style="justify-content:space-between;margin-bottom:12px"><h2>Pacientes</h2><div class="row mobile-only"><button class="btn btn-sm btn-primary" data-action="new-patient">${I.plus}Nuevo</button></div></div>
      <div class="row mobile-only" style="margin-bottom:10px"><div class="seg seg-sm grow">${['activos', 'espera', 'todos', 'inactivos'].map(f => `<button class="${App.patientFilter === f ? 'on' : ''}" data-action="pat-filter" data-f="${f}">${{ activos: 'Activos', espera: 'Espera', todos: 'Todos', inactivos: 'Baja' }[f]}</button>`).join('')}</div></div>
      <div class="card"><table class="table"><thead><tr><th>Paciente</th><th>Frecuencia</th><th>Sesión</th><th>Hueco</th><th>Disponibilidad</th><th class="r">Tarifa</th></tr></thead><tbody>
      ${list.map(p => `<tr data-action="edit-patient" data-pid="${esc(p.id)}" style="${styleOf(p)}"><td><span class="row"><span class="dot"></span><strong style="font-weight:500">${esc(p.alias)}</strong>${p.activo === false ? '<span class="chip">baja</span>' : ''}${p.enEspera ? `<span class="chip chip-ochre">espera · ${esc(p.prioridad || 'normal')}</span>` : ''}${p.fixed ? `<span title="hueco fijo">${I.pin}</span>` : ''}${(p.sesiones || 1) > 1 ? `<span class="chip">${p.sesiones}/sem</span>` : ''}</span></td><td>${freqLabel(p.freq)}</td><td>${p.dur} min · ${p.modalidad}</td><td class="mono">${esc(slotOf(p))}</td><td>${dayGlyphs(p)}</td><td class="r mono">${C.fmtEuro(p.tarifa)}</td></tr>`).join('') || `<tr><td colspan="6" class="hint">No hay pacientes en este filtro.</td></tr>`}
      </tbody></table></div>`;
    return `<div class="page">${side}<section class="page-main">${main}</section></div>`;
  }

  function startEdit(pid) {
    App.view = 'pacientes';
    App.editing = pid ? JSON.parse(JSON.stringify(patient(pid))) : C.newPatient(App.state);
    App.editing._isNew = !pid;
    render();
    const f = $('#f-alias'); if (f) f.focus();
  }

  function patientFormHtml() {
    const p = App.editing;
    const st = App.state.settings;
    const seg = (field, options) => `<div class="seg">${options.map(([v, l]) => `<button type="button" class="${p[field] === v ? 'on' : ''}" data-action="f-seg" data-field="${field}" data-value="${esc(v)}">${l}</button>`).join('')}</div>`;
    const bseg = (field, options) => `<div class="seg">${options.map(([v, l]) => `<button type="button" class="${String((p.billing || {})[field]) === String(v) ? 'on' : ''}" data-action="f-bseg" data-field="${field}" data-value="${esc(v)}">${l}</button>`).join('')}</div>`;
    const b = p.billing || {};
    const motivos = st.days.map(d => `<div class="row"><span class="mono hint" style="width:34px;flex:none;color:${(p.avail[d].m === 0 && p.avail[d].t === 0) ? 'var(--danger)' : 'var(--muted)'}">${C.DAY_SHORT[d]}</span><input class="input input-sm" data-field="motivo" data-day="${d}" value="${esc(p.avail[d].motivo || '')}" placeholder="Motivo (p. ej. turno de tarde, recoge a los niños)"></div>`).join('');
    return `<form class="form" id="patient-form" autocomplete="off">
      <div class="row wrap" style="justify-content:space-between"><h2>${p._isNew ? 'Nuevo paciente' : 'Ficha de paciente'}</h2><div class="hint">Cuanto menos identificable sea el alias, mejor.</div></div>
      <div class="cols-2">
        <label class="field"><span class="label">Alias (lo que se ve en el cuadrante)</span><input class="input" id="f-alias" data-field="alias" value="${esc(p.alias)}" placeholder="Lucía P." required></label>
        <label class="field"><span class="label">Nombre completo (opcional)</span><input class="input" data-field="nombre" value="${esc(p.nombre)}" placeholder="Solo si lo necesitas tú"></label>
      </div>
      <div class="field"><span class="label">Color</span><div class="row wrap">${C.COLOR_KEYS.map(k => `<button type="button" class="sw ${p.color === k ? 'on' : ''}" style="background:${C.COLORS[k].bg};border:1px solid ${C.COLORS[k].fg}" data-action="f-color" data-color="${k}" aria-label="${k}"></button>`).join('')}</div></div>
      <div class="cols-2">
        <div class="field"><span class="label">Frecuencia</span>${seg('freq', [['semanal', 'Semanal'], ['quincenalA', 'Quinc. A'], ['quincenalB', 'Quinc. B'], ['puntual', 'Puntual']])}</div>
        <div class="field"><span class="label">Duración</span>${seg('dur', [[50, '50 min'], [60, '60 min'], [90, '90 min']])}</div>
        <div class="field"><span class="label">Modalidad</span>${seg('modalidad', [['presencial', 'Presencial'], ['online', 'Online']])}</div>
        <label class="field"><span class="label">Tarifa por sesión (€)</span><input class="input mono" type="number" min="0" step="0.5" data-field="tarifa" value="${p.tarifa}"></label>
        <div class="field"><span class="label">Sesiones por semana</span>${seg('sesiones', [[1, '1'], [2, '2'], [3, '3']])}</div>
      </div>
      <div class="section">
        <div class="row" style="justify-content:space-between"><div><div style="font-weight:500">En lista de espera</div><div class="hint">No entra en el cuadrante. Al tocar un hueco libre te lo sugerirá por prioridad.</div></div><button type="button" class="toggle ${p.enEspera ? 'on' : ''}" data-action="f-toggle" data-field="enEspera" role="switch" aria-checked="${!!p.enEspera}"></button></div>
        ${p.enEspera ? `<div class="field"><span class="label">Prioridad</span>${seg('prioridad', [['urgente', 'Urgente'], ['continuidad', 'Continuidad'], ['normal', 'Normal']])}</div>` : ''}
      </div>
      <div class="section">
        <div class="stitle"><span class="label">Disponibilidad · toca una casilla para alternar: no → puede → mejor</span></div>
        ${availMatrixHtml(p, true)}
        <div class="hint">"Horas": franja concreta en formato 16-20 (deja vacío si vale cualquier hora del turno).</div>
        <div class="field"><span class="label">Motivos (para acordarte tú; no salen en ningún documento)</span><div class="stack" style="gap:6px">${motivos}</div></div>
      </div>
      <div class="section">
        <div class="row" style="justify-content:space-between"><div><div style="font-weight:500">${I.pin} Hueco fijo</div><div class="hint">Recolocar nunca lo mueve; solo tú, arrastrando.</div></div><button type="button" class="toggle ${p.fixed ? 'on' : ''}" data-action="f-toggle" data-field="fixed" role="switch" aria-checked="${!!p.fixed}"></button></div>
        <div class="row" style="justify-content:space-between"><div><div style="font-weight:500">En activo</div><div class="hint">Si lo desactivas, sale del cuadrante pero conserva su historial y facturas.</div></div><button type="button" class="toggle ${p.activo !== false ? 'on' : ''}" data-action="f-toggle" data-field="activo" role="switch" aria-checked="${p.activo !== false}"></button></div>
      </div>
      <div class="section">
        <div class="stitle"><span class="label">Datos de facturación</span><span class="hint">Con NIF y nombre fiscal se emite factura completa; sin ellos, simplificada (hasta ${C.SIMPLIFICADA_MAX} €).</span></div>
        <div class="cols-2">
          <label class="field"><span class="label">Nombre fiscal</span><input class="input" data-bfield="nombreFiscal" value="${esc(b.nombreFiscal || '')}"></label>
          <label class="field"><span class="label">NIF</span><input class="input mono" data-bfield="nif" value="${esc(b.nif || '')}"></label>
          <label class="field"><span class="label">Dirección</span><input class="input" data-bfield="direccion" value="${esc(b.direccion || '')}" placeholder="Calle, CP, ciudad"></label>
          <label class="field"><span class="label">Email (para enviarle la factura)</span><input class="input" data-bfield="email" value="${esc(b.email || '')}"></label>
          <div class="field"><span class="label">Una factura…</span>${bseg('modo', [['mensual', 'Al mes (recapitulativa)'], ['sesion', 'Por sesión']])}</div>
          <div class="field"><span class="label">Retención IRPF (solo si es empresa o profesional)</span>${bseg('retencion', [[0, 'No'], [7, '7 %'], [15, '15 %']])}</div>
        </div>
      </div>
      <label class="field"><span class="label">Notas</span><textarea class="textarea" data-field="notas" placeholder="Lo que te ayude a organizar sus citas">${esc(p.notas || '')}</textarea></label>
      <div class="row wrap" style="justify-content:space-between;padding-top:8px">
        <div>${p._isNew ? '' : `<button type="button" class="btn btn-danger btn-sm" data-action="delete-patient">Eliminar</button>`}</div>
        <div class="row"><button type="button" class="btn" data-action="cancel-edit">Cancelar</button><button type="submit" class="btn btn-primary">${I.check}Guardar ficha</button></div>
      </div>
    </form>`;
  }

  function readPatientForm() {
    const p = App.editing;
    for (const el of $$('#patient-form [data-field]')) {
      if (el.tagName === 'BUTTON') continue;
      const f = el.dataset.field;
      if (f === 'hours') { const m = el.value.trim().match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/); p.avail[el.dataset.day].hours = m ? [Number(m[1]), Number(m[2])] : null; }
      else if (f === 'motivo') p.avail[el.dataset.day].motivo = el.value.trim();
      else if (f === 'tarifa') p.tarifa = C.round2(Number(el.value) || 0);
      else p[f] = el.value.trim();
    }
    p.billing = p.billing || { modo: 'mensual', retencion: 0 };
    for (const el of $$('#patient-form [data-bfield]')) p.billing[el.dataset.bfield] = el.value.trim();
    return p;
  }

  function savePatient() {
    const p = readPatientForm();
    if (!p.alias) { toast('Ponle un alias al paciente.', null, { error: true }); $('#f-alias').focus(); return; }
    const isNew = p._isNew; delete p._isNew;
    commit(st => {
      const i = st.patients.findIndex(x => x.id === p.id);
      if (i >= 0) st.patients[i] = p; else st.patients.push(p);
      if (p.activo === false || p.enEspera) st.slots = st.slots.filter(s => s.patientId !== p.id);
    }, { undo: true, toast: isNew ? `${p.alias} añadido. Arrástralo a un hueco o pulsa Recolocar.` : 'Ficha guardada' });
    App.editing = null;
    if (isNew) { App.view = 'semana'; App.selectedPatient = p.id; }
    render();
  }

  // ======================================================================
  // Facturas
  // ======================================================================
  function facturasHtml() {
    const st = App.state;
    const month = App.invoiceMonth;
    const pending = C.billableSessions(st);
    const pendingTotal = pending.reduce((n, s) => n + s.importe, 0);
    const pendingPatients = new Set(pending.map(s => s.patientId)).size;
    const all = st.invoices.slice();
    const drafts = all.filter(i => i.estado === 'borrador');
    const inMonth = all.filter(i => i.estado !== 'borrador' && (i.fecha || '').startsWith(month));
    const list = (App.invoiceFilter === 'borradores' ? drafts : App.invoiceFilter === 'todas' ? drafts.concat(inMonth) : inMonth.filter(i => i.estado === App.invoiceFilter)).sort((a, b) => (a.estado === 'borrador') - (b.estado === 'borrador') || (b.numero || '').localeCompare(a.numero || ''));
    const emitted = inMonth.reduce((n, i) => n + i.total, 0);
    const paid = inMonth.filter(i => i.estado === 'pagada').reduce((n, i) => n + i.total, 0);
    const [y, m] = month.split('-').map(Number);
    const shift = n => { const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
    const stChip = i => ({ borrador: '<span class="chip chip-ochre">Borrador</span>', emitida: '<span class="chip chip-accent">Emitida</span>', pagada: '<span class="chip">Pagada</span>', anulada: '<span class="chip chip-danger">Anulada</span>' }[i.estado] || i.estado);
    const side = `<aside class="page-side">
      <div class="field"><span class="label">Mes</span><div class="row" style="justify-content:space-between;height:36px;padding:0 6px;border:1px solid var(--line);border-radius:8px;background:var(--card)"><button class="btn btn-ghost btn-icon btn-sm" data-action="inv-month" data-m="${shift(-1)}" aria-label="Mes anterior">${I.prev}</button><span style="font-weight:500">${esc(C.periodoLabel(month))}</span><button class="btn btn-ghost btn-icon btn-sm" data-action="inv-month" data-m="${shift(1)}" aria-label="Mes siguiente">${I.next}</button></div></div>
      <div class="stack" style="gap:2px">${[['todas', 'Todas'], ['borradores', 'Borradores'], ['emitida', 'Emitidas'], ['pagada', 'Pagadas']].map(([k, l]) => `<button class="fil ${App.invoiceFilter === k ? 'on' : ''}" data-action="inv-filter" data-f="${k}">${l} · ${k === 'todas' ? drafts.length + inMonth.length : k === 'borradores' ? drafts.length : inMonth.filter(i => i.estado === k).length}</button>`).join('')}</div>
      <div class="notice ${pending.length ? 'notice-warn' : ''}"><span class="label" style="color:${pending.length ? 'var(--ochre-ink)' : 'inherit'}">Pendiente de facturar</span><div class="mono" style="font-size:22px;font-weight:600;margin:4px 0">${C.fmtEuro(pendingTotal)}</div><div class="hint" style="color:inherit">${pending.length} sesiones con OK de ${pendingPatients} pacientes, aún sin borrador.</div>${pending.length ? `<button class="btn btn-primary" style="margin-top:10px;width:100%" data-action="inv-drafts">${I.plus}Generar borradores</button>` : ''}</div>
      <div class="notice"><span class="label">${esc(C.periodoLabel(month))}</span><div class="row" style="justify-content:space-between;font-size:13px;margin-top:6px"><span class="muted">Emitido</span><span class="mono">${C.fmtEuro(emitted)}</span></div><div class="row" style="justify-content:space-between;font-size:13px"><span class="muted">Cobrado</span><span class="mono">${C.fmtEuro(paid)}</span></div><div class="row" style="justify-content:space-between;font-size:13px"><span class="muted">Siguiente nº</span><span class="mono">${esc(C.nextNumero(st.settings))}</span></div><button class="btn btn-sm" style="margin-top:10px;width:100%" data-action="inv-csv">${I.download}CSV del mes (gestoría)</button><button class="btn btn-sm" style="margin-top:6px;width:100%" data-action="inv-aeat" title="Columnas del libro registro de facturas expedidas">${I.download}CSV libro AEAT (${esc(month.slice(0, 4))})</button></div>
      <div class="hint">Las facturas mensuales a particulares son recapitulativas: emítelas antes de que acabe el mes de las sesiones. Desde el 1 de julio de 2027 los autónomos deben emitir con un sistema Verifactu (o la app gratuita de la AEAT); hasta entonces puedes imprimir estas y llevar el CSV a la gestoría.</div>
    </aside>`;
    const main = `<div class="row wrap" style="justify-content:space-between;margin-bottom:12px"><h2>Facturas</h2><div class="row mobile-only">${pending.length ? `<button class="btn btn-sm btn-primary" data-action="inv-drafts">${I.plus}Borradores (${pending.length})</button>` : ''}<button class="btn btn-sm btn-icon" data-action="inv-month" data-m="${shift(-1)}">${I.prev}</button><span style="font-size:13px">${esc(C.periodoLabel(month))}</span><button class="btn btn-sm btn-icon" data-action="inv-month" data-m="${shift(1)}">${I.next}</button></div></div>
      <div class="card" style="overflow-x:auto"><table class="table"><thead><tr><th>Nº</th><th>Paciente</th><th>Periodo</th><th class="r">Ses.</th><th class="r">Importe</th><th>Estado</th></tr></thead><tbody>
      ${list.map(i => { const p = patient(i.patientId) || { alias: '?' }; return `<tr data-action="inv-select" data-id="${esc(i.id)}" class="${App.selectedInvoice === i.id ? 'sel' : ''}" style="${styleOf(p)}"><td class="mono">${esc(i.numero || '—')}${i.rectificaDe ? ' <span class="chip">rectif.</span>' : ''}</td><td><span class="row"><span class="dot"></span>${esc((i.cliente && i.cliente.nombre) || p.alias)}</span></td><td class="muted">${i.modo === 'sesion' && i.lineas[0] ? 'Sesión ' + C.fmtDate(C.fromISODate(i.lineas[0].fecha)) : esc(C.periodoLabel(i.periodo))}</td><td class="r mono">${i.lineas.length}</td><td class="r mono">${C.fmtEuro(i.total)}</td><td>${stChip(i)}</td></tr>`; }).join('') || `<tr><td colspan="6" class="hint">Nada que mostrar. ${pending.length ? 'Genera los borradores de las sesiones con OK.' : 'Da el OK a una semana para tener sesiones que facturar.'}</td></tr>`}
      </tbody></table></div>`;
    return `<div class="page">${side}<section class="page-main">${main}</section>${App.selectedInvoice ? invoiceDetailHtml() : ''}</div>`;
  }

  function invoiceDetailHtml() {
    const inv = App.state.invoices.find(i => i.id === App.selectedInvoice);
    if (!inv) { App.selectedInvoice = null; return ''; }
    const draft = inv.estado === 'borrador';
    const hasRect = App.state.invoices.some(i => i.rectificaDe === inv.id);
    return `<aside class="page-detail">
      <div class="row" style="justify-content:space-between"><h3 class="mono">${esc(inv.numero || 'Borrador')}</h3><button class="btn btn-icon btn-sm" data-action="inv-select" data-id="" aria-label="Cerrar">${I.close}</button></div>
      ${inv.aviso ? `<div class="notice notice-warn">${esc(inv.aviso)}</div>` : ''}
      ${inv.rectificaDe ? `<div class="notice">Rectificativa de <span class="mono">${esc(inv.rectificaNumero)}</span> · ${esc(inv.causa)}</div>` : ''}
      <div style="overflow:auto">${invoiceHtml(inv)}</div>
      ${draft ? `<div class="hint">Puedes ajustar los importes de las líneas antes de emitir.</div><div class="stack">${inv.lineas.map((l, i) => `<div class="row"><span class="mono hint" style="width:80px">${C.fmtDate(C.fromISODate(l.fecha))}</span><input class="input input-sm grow" data-action="inv-line-concepto" data-i="${i}" value="${esc(l.concepto)}"><input class="input input-sm mono" type="number" step="0.5" style="width:90px;text-align:right" data-action="inv-line-importe" data-i="${i}" value="${l.importe}">${inv.lineas.length > 1 ? `<button class="btn btn-sm btn-icon" data-action="inv-line-del" data-i="${i}" aria-label="Quitar línea">${I.close}</button>` : ''}</div>`).join('')}</div>` : ''}
      <div class="form" style="gap:8px"><div class="cols-2">
        ${draft ? `<button class="btn btn-primary" data-action="inv-issue">${I.check}Emitir</button><button class="btn btn-danger" data-action="inv-delete">Eliminar borrador</button><button class="btn" data-action="inv-pdf">${I.download}Ver borrador en PDF</button>` : `<button class="btn btn-primary" data-action="inv-pdf">${I.download}Descargar PDF</button><button class="btn" data-action="inv-print">${I.print}Imprimir</button><button class="btn" data-action="inv-download">${I.download}Descargar HTML</button>${inv.estado === 'emitida' ? `<button class="btn" data-action="inv-paid" data-v="pagada">Marcar pagada</button>` : inv.estado === 'pagada' ? `<button class="btn" data-action="inv-paid" data-v="emitida">Desmarcar pagada</button>` : ''}${!inv.rectificaDe && !hasRect && inv.estado !== 'anulada' ? `<button class="btn" data-action="inv-rectify">Rectificativa…</button>` : ''}`}
      </div></div>
      <div class="hint" style="margin-top:auto;padding-top:10px;border-top:1px solid var(--line-2)">${draft ? 'Al emitir se asigna el número correlativo y se congelan los datos: después ya no se puede editar ni borrar, solo rectificar.' : 'Las emitidas no se borran ni se renumeran. Si hay un error, emite una rectificativa.'}</div>
    </aside>`;
  }

  function invoiceHtml(inv) {
    const st = App.state.settings;
    const p = patient(inv.patientId) || {};
    const b = p.billing || {};
    const em = inv.emisor || st.emisor;
    const cl = inv.cliente || { nombre: b.nombreFiscal || p.nombre || p.alias || '', nif: b.nif || '', direccion: b.direccion || '' };
    const t = C.invoiceTotals(inv.lineas, inv.ivaPct || 0, inv.retPct || 0);
    const exento = (inv.ivaPct || 0) === 0;
    const texto = inv.textoExencion ?? (exento ? st.textoExencion : '');
    const pago = inv.formaPago ?? st.formaPago;
    const venc = inv.vencimientoDias ?? st.vencimientoDias;
    const fecha = inv.fecha ? C.fmtDate(C.fromISODate(inv.fecha)) : '[al emitir]';
    const tipo = inv.rectificaDe ? 'Factura rectificativa' : (inv.tipo === 'simplificada' ? 'Factura simplificada' : 'Factura');
    return `<div class="invoice">
      <div class="head"><div><div class="name">${esc(em.nombre || '[Tu nombre]')}</div><div class="g">${esc(em.colegiado ? 'Colegiado/a n.º ' + em.colegiado : '')}${em.registro ? ' · Registro sanitario ' + esc(em.registro) : ''}</div><div class="g">NIF ${esc(em.nif || '[NIF]')} · ${esc(em.direccion || '[Dirección]')}</div><div class="g">${esc([em.email, em.telefono].filter(Boolean).join(' · '))}</div></div>
        <div style="text-align:right"><div class="label">${tipo}</div><div class="num">${esc(inv.numero || 'BORRADOR')}</div><div class="g">Fecha de expedición <span class="mono" style="color:#1B2726">${fecha}</span></div>${inv.modo !== 'sesion' ? `<div class="g">Periodo ${esc(C.periodoLabel(inv.periodo))}</div>` : ''}${inv.rectificaDe ? `<div class="g">Rectifica la factura ${esc(inv.rectificaNumero)}</div>` : ''}</div></div>
      ${inv.tipo === 'simplificada' && !cl.nif ? '' : `<div class="client"><div class="label">Cliente</div><div style="font-weight:500">${esc(cl.nombre || '[Nombre]')}</div><div class="g">${cl.nif ? 'NIF ' + esc(cl.nif) : ''}${cl.nif && cl.direccion ? ' · ' : ''}${esc(cl.direccion || '')}</div></div>`}
      ${inv.rectificaDe ? `<div class="g">Causa: ${esc(inv.causa)}</div>` : ''}
      <table class="lines"><thead><tr><th style="width:90px">Fecha</th><th>Concepto</th><th class="r" style="width:90px">Importe</th></tr></thead><tbody>${inv.lineas.map(l => `<tr><td class="mono">${C.fmtDate(C.fromISODate(l.fecha))}</td><td>${esc(l.concepto)}</td><td class="r mono">${C.fmtEuro(l.importe)}</td></tr>`).join('')}</tbody></table>
      <div class="totals"><div><span class="g">Base imponible</span><span class="mono">${C.fmtEuro(t.base)}</span></div><div><span class="g">IVA${exento ? '' : ' ' + inv.ivaPct + ' %'}</span><span class="mono">${exento ? 'Exenta' : C.fmtEuro(t.iva)}</span></div>${inv.retPct ? `<div><span class="g">Retención IRPF ${inv.retPct} %</span><span class="mono">−${C.fmtEuro(t.retencion)}</span></div>` : ''}<div class="tot"><span>Total</span><span class="mono">${C.fmtEuro(t.total)}</span></div></div>
      <div class="foot">${texto ? `<div>${esc(texto)}</div>` : ''}<div>Forma de pago: ${esc(pago)}${venc ? ` · Vencimiento: ${venc} días desde la expedición` : ' · Vencimiento: a la recepción'}.</div><div>Sus datos se tratan con la única finalidad de emitir esta factura y cumplir las obligaciones fiscales.</div></div>
    </div>`;
  }

  function invoiceDocument(inv) {
    const css = $('style') ? $('style').textContent : '';
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(inv.numero || 'Borrador')}</title><style>${css}\nbody{background:#fff;padding:24px}.invoice{border:0;max-width:800px;margin:0 auto}</style></head><body>${invoiceHtml(inv)}</body></html>`;
  }

  async function saveFile(name, data, mime) {
    if (window.claude && typeof window.claude.use === 'function') {
      try {
        const dl = await window.claude.use('downloads');
        if (dl) { await dl.save({ filename: name, data }); toast(`Guardado ${name}`); return; }
      } catch (e) { if (e && e.code === 'declined') return; }
    }
    const blob = new Blob([data], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ======================================================================
  // Ajustes
  // ======================================================================
  function ajustesHtml() {
    if (!App.settingsDraft) App.settingsDraft = JSON.parse(JSON.stringify(App.state.settings));
    const s = App.settingsDraft;
    if (s.autoHolidays === undefined) s.autoHolidays = true;
    const hourOpts = (sel, from = 6, to = 23) => Array.from({ length: to - from + 1 }, (_, i) => from + i).map(h => `<option value="${h}" ${h === sel ? 'selected' : ''}>${C.fmtHour(h)}</option>`).join('');
    const br = s.hours.breaks[0] || null;
    const dayChecks = C.DAYS.map(d => `<label class="check"><input type="checkbox" data-sday="${d}" ${s.days.includes(d) ? 'checked' : ''}>${C.DAY_NAMES[d]}</label>`).join('');
    const office = s.days.map(d => `<div class="row" style="gap:12px"><span style="width:90px">${C.DAY_NAMES[d]}</span><label class="check"><input type="checkbox" data-office="${d}" data-band="m" ${(s.office[d] || {}).m !== false ? 'checked' : ''}>mañana</label><label class="check"><input type="checkbox" data-office="${d}" data-band="t" ${(s.office[d] || {}).t !== false ? 'checked' : ''}>tarde</label></div>`).join('');
    const closed = (s.closedDates || []).slice().sort((a, b) => a.date.localeCompare(b.date)).map((c, i) => `<div class="row"><span class="mono" style="width:100px">${C.fmtDate(C.fromISODate(c.date))}</span><span class="grow">${esc(c.motivo || '')}</span><button type="button" class="btn btn-sm btn-icon" data-action="closed-del" data-i="${i}" aria-label="Quitar">${I.close}</button></div>`).join('');
    const em = s.emisor;
    const persisted = App.persisted === true ? 'El navegador ha aceptado conservar los datos.' : App.persisted === false ? 'El navegador puede borrar los datos si no usas la app durante semanas: exporta copias.' : '';
    return `<div class="page"><section class="page-main"><form class="form" id="settings-form" autocomplete="off">
      <h2>Ajustes</h2>
      <div class="section"><div class="stitle"><h3>Tu horario</h3></div>
        <div class="field"><span class="label">Días de consulta</span><div class="row wrap" style="gap:14px">${dayChecks}</div></div>
        <div class="cols-4">
          <label class="field"><span class="label">Empiezas</span><select class="select" data-s="hours.start">${hourOpts(s.hours.start)}</select></label>
          <label class="field"><span class="label">Terminas</span><select class="select" data-s="hours.end">${hourOpts(s.hours.end, 7, 24)}</select></label>
          <label class="field"><span class="label">Descanso desde</span><select class="select" data-s="break.start"><option value="">sin descanso</option>${hourOpts(br ? br[0] : null)}</select></label>
          <label class="field"><span class="label">Descanso hasta</span><select class="select" data-s="break.end"><option value="">—</option>${hourOpts(br ? br[1] : null, 7, 24)}</select></label>
        </div>
        <div class="cols-4">
          <label class="field"><span class="label">La tarde empieza a las</span><select class="select" data-s="tardeDesde">${hourOpts(s.tardeDesde, 12, 18)}</select></label>
          <label class="field"><span class="label">Sesión (min)</span><input class="input mono" type="number" min="20" max="180" data-s="sessionMin" value="${s.sessionMin}"></label>
          <label class="field"><span class="label">Paso de rejilla (min)</span><input class="input mono" type="number" min="30" max="120" step="15" data-s="slotMin" value="${s.slotMin}"></label>
          <label class="field"><span class="label">Máx. sesiones/día</span><input class="input mono" type="number" min="1" max="20" data-s="maxPerDay" value="${s.maxPerDay}"></label>
        </div>
        <div class="cols-2">
          <label class="field"><span class="label">Semana "A" de referencia (para quincenales)</span><input class="input mono" type="date" data-s="weekAnchor" value="${esc(s.weekAnchor)}"></label>
          <div class="field"><span class="label">Modo discreto (iniciales en el cuadrante)</span><div class="row" style="height:38px"><button type="button" class="toggle ${s.discreet ? 'on' : ''}" data-action="s-toggle" data-key="discreet" role="switch" aria-checked="${!!s.discreet}"></button><span class="hint">Útil si alguien puede ver tu pantalla.</span></div></div>
        </div>
        <div class="field"><span class="label">Despacho disponible para sesiones presenciales</span><div class="hint">Desmarca las franjas en las que solo puedes atender online (p. ej. si alquilas despacho por horas).</div><div class="stack" style="gap:6px">${office}</div></div>
        <div class="field"><span class="label">Festivos y cierres</span><div class="row" style="justify-content:space-between;gap:12px"><span class="hint">Festivos nacionales automáticos${s.autoHolidays !== false ? ` (${new Date().getFullYear()}: ${C.spanishHolidays(new Date().getFullYear()).map(h => h.date.slice(8) + '/' + h.date.slice(5, 7)).join(', ')})` : ''}. Los autonómicos y locales, añádelos abajo.</span><button type="button" class="toggle ${s.autoHolidays !== false ? 'on' : ''}" data-action="s-toggle" data-key="autoHolidays" role="switch" aria-checked="${s.autoHolidays !== false}"></button></div>${closed || '<div class="hint">Ningún cierre manual.</div>'}<div class="row"><input class="input input-sm mono" type="date" id="closed-date" style="width:170px"><input class="input input-sm grow" id="closed-motivo" placeholder="Motivo (festivo, vacaciones, congreso…)"><button type="button" class="btn btn-sm" data-action="closed-add">Añadir</button></div></div>
      </div>
      <div class="section"><div class="stitle"><h3>Facturación</h3><span class="hint">Estos datos salen en cada factura que emitas a partir de ahora.</span></div>
        <div class="cols-2">
          <label class="field"><span class="label">Nombre y apellidos</span><input class="input" data-e="nombre" value="${esc(em.nombre)}"></label>
          <label class="field"><span class="label">NIF</span><input class="input mono" data-e="nif" value="${esc(em.nif)}"></label>
          <label class="field"><span class="label">Dirección de la consulta</span><input class="input" data-e="direccion" value="${esc(em.direccion)}"></label>
          <label class="field"><span class="label">Email</span><input class="input" data-e="email" value="${esc(em.email)}"></label>
          <label class="field"><span class="label">Teléfono</span><input class="input" data-e="telefono" value="${esc(em.telefono)}"></label>
          <label class="field"><span class="label">Nº de colegiado/a</span><input class="input" data-e="colegiado" value="${esc(em.colegiado)}"></label>
          <label class="field"><span class="label">Nº de registro sanitario (opcional)</span><input class="input" data-e="registro" value="${esc(em.registro)}"></label>
          <label class="field"><span class="label">IVA</span><select class="select" data-s="iva"><option value="0" ${s.iva === 0 ? 'selected' : ''}>Exento (psicología sanitaria, art. 20.Uno.3.º LIVA)</option><option value="21" ${s.iva === 21 ? 'selected' : ''}>21 % (coaching, formación, no sanitario)</option></select></label>
        </div>
        <div class="cols-4">
          <label class="field"><span class="label">Serie</span><input class="input mono" data-s="serie" value="${esc(s.serie)}"></label>
          <label class="field"><span class="label">Siguiente nº</span><input class="input mono" type="number" min="1" data-s="siguiente" value="${s.siguiente}"></label>
          <label class="field"><span class="label">Serie rectificativas</span><input class="input mono" data-s="serieRect" value="${esc(s.serieRect)}"></label>
          <label class="field"><span class="label">Siguiente nº rect.</span><input class="input mono" type="number" min="1" data-s="siguienteRect" value="${s.siguienteRect}"></label>
        </div>
        <div class="hint">La numeración es correlativa dentro de cada serie. Al cambiar de año, cambia la serie (p. ej. F-2027) y vuelve a empezar en 1.</div>
        <label class="field"><span class="label">Texto de exención (solo si IVA exento)</span><textarea class="textarea" data-s="textoExencion">${esc(s.textoExencion)}</textarea></label>
        <div class="cols-2">
          <label class="field"><span class="label">Forma de pago (sale en la factura)</span><input class="input" data-s="formaPago" value="${esc(s.formaPago)}" placeholder="Transferencia a ES00 0000 … / Bizum al 600 000 000"></label>
          <label class="field"><span class="label">Vencimiento (días; 0 = a la recepción)</span><input class="input mono" type="number" min="0" data-s="vencimientoDias" value="${s.vencimientoDias || 0}"></label>
        </div>
      </div>
      <div class="row" style="justify-content:flex-end"><button type="submit" class="btn btn-primary">${I.check}Guardar ajustes</button></div>
    </form>
    <div class="form" style="margin-top:24px">
      <div class="section"><div class="stitle"><h3>Tus datos y copias de seguridad</h3></div>
        <div class="notice">Todo se guarda <strong>solo en este navegador</strong>${App.encrypted ? ', cifrado con tu contraseña' : ''}. Nada sale a ningún servidor. ${persisted}<br>Exporta una copia cada semana y guárdala donde tú controles (tu disco, tu nube). Para usar la app en otro dispositivo, abre allí la misma dirección e importa la copia. No edites en dos dispositivos a la vez: se queda la última versión importada.${s.lastExport ? `<br>Última copia exportada: <span class="mono">${esc(s.lastExport)}</span>.` : '<br><strong>Aún no has exportado ninguna copia.</strong>'}</div>
        <div class="row wrap"><button class="btn btn-primary" data-action="export">${I.download}Exportar copia${App.encrypted ? ' (cifrada)' : ''}</button><button class="btn" data-action="import">Importar copia…</button>${App.encrypted ? `<button class="btn" data-action="export-plain">Exportar sin cifrar</button>` : ''}<button class="btn" data-action="export-ics" title="Próximas 8 semanas, sin nombres">Calendario .ics (sin nombres)</button></div>
        <div class="row wrap" style="gap:12px"><div><div style="font-weight:500">${I.lock} Contraseña</div><div class="hint">${App.encrypted ? 'Activada: los datos se guardan cifrados (AES-GCM) y la app se bloquea sola.' : 'Recomendada: la agenda contiene datos de salud. Si la olvidas, no hay recuperación.'}</div></div><div class="row" style="margin-left:auto">${App.encrypted ? `<button class="btn btn-sm" data-action="pw-change">Cambiar</button><button class="btn btn-sm" data-action="pw-remove">Quitar</button>` : `<button class="btn btn-sm btn-primary" data-action="pw-set">Activar contraseña</button>`}</div></div>
        ${App.encrypted ? `<label class="field" style="max-width:260px"><span class="label">Bloquear tras (minutos sin usar)</span><input class="input mono" type="number" min="1" max="120" id="lock-min" value="${s.lockMin}" data-action="lock-min"></label>` : ''}
        <div class="hint">Recuerda: conserva las facturas al menos 4 años (prescripción fiscal) y la información asistencial de cada paciente al menos 5 años desde el alta (Ley 41/2002). Da de baja a los pacientes en vez de eliminarlos.</div>
        <div class="row wrap"><button class="btn btn-sm" data-action="demo-load">Cargar datos de ejemplo</button><button class="btn btn-sm btn-danger" data-action="wipe">Borrar todos los datos de este navegador</button></div>
      </div>
      <div class="section"><div class="stitle"><h3>Acerca de</h3></div><div class="hint">Cuadrante de consulta · un solo fichero HTML, sin servidor. Arrastra desde el asa (⋮⋮) en el móvil; en el ordenador, desde cualquier parte de la caja o con teclado: Tab hasta la caja, Espacio la coge, flechas eligen hueco, Enter suelta. Ctrl/Cmd+Z deshace el último cambio.</div></div>
    </div></section></div>`;
  }

  function readSettingsForm() {
    const s = App.settingsDraft;
    const get = sel => $(sel, $('#settings-form'));
    s.days = C.DAYS.filter(d => get(`[data-sday="${d}"]`).checked);
    if (!s.days.length) s.days = ['L'];
    s.hours.start = Number(get('[data-s="hours.start"]').value);
    s.hours.end = Number(get('[data-s="hours.end"]').value);
    if (s.hours.end <= s.hours.start) s.hours.end = s.hours.start + 1;
    const bs = get('[data-s="break.start"]').value, be = get('[data-s="break.end"]').value;
    s.hours.breaks = (bs && be && Number(be) > Number(bs)) ? [[Number(bs), Number(be)]] : [];
    for (const k of ['tardeDesde', 'sessionMin', 'slotMin', 'maxPerDay', 'siguiente', 'siguienteRect', 'vencimientoDias', 'iva']) s[k] = Number(get(`[data-s="${k}"]`).value) || 0;
    if (s.slotMin < 30) s.slotMin = 30;
    for (const k of ['weekAnchor', 'serie', 'serieRect', 'textoExencion', 'formaPago']) s[k] = get(`[data-s="${k}"]`).value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.weekAnchor)) s.weekAnchor = C.toISODate(C.mondayOf(new Date()));
    for (const el of $$('#settings-form [data-e]')) s.emisor[el.dataset.e] = el.value.trim();
    for (const el of $$('#settings-form [data-office]')) { const d = el.dataset.office; s.office[d] = s.office[d] || { m: true, t: true }; s.office[d][el.dataset.band] = el.checked; }
    return s;
  }

  // ======================================================================
  // Bienvenida, bloqueo, contraseña, importar/exportar, demo
  // ======================================================================
  function welcomeHtml() {
    return `<div class="welcome">
      <div class="wordmark">Cuadrante</div>
      <p style="font-size:16px;line-height:1.5;margin:0">El cuadrante semanal de tu consulta: pacientes como cajas que arrastras, recolocación automática según lo que cada uno puede y no puede, el OK de cada semana y las facturas que salen de ahí.</p>
      <div class="notice">Tus datos se guardan <strong>solo en este navegador</strong>, nunca en un servidor. Podrás ponerles contraseña y exportar copias en Ajustes. Como contienen datos de salud, usa alias o iniciales y no compartas este navegador.</div>
      <div class="row wrap"><button class="btn btn-primary" data-action="demo-load">Empezar con datos de ejemplo</button><button class="btn" data-action="start-empty">Empezar en blanco</button></div>
    </div>`;
  }
  function lockHtml() {
    return `<div class="lock"><form class="card" id="lock-form"><div class="wordmark">Cuadrante</div><div class="hint">Los datos están cifrados. Escribe tu contraseña para abrir la agenda.</div><input class="input" type="password" id="lock-pw" placeholder="Contraseña" autocomplete="current-password" autofocus><div id="lock-err" class="danger-text" style="font-size:13px"></div><button class="btn btn-primary" type="submit">${I.lock}Abrir</button><div class="hint">Si has olvidado la contraseña no hay forma de recuperar los datos; podrás borrar todo e importar una copia.</div><button class="btn btn-sm btn-danger" type="button" data-action="wipe">Borrar todo y empezar de cero</button></form></div>`;
  }

  async function setPassword(change) {
    const pw = await promptDialog({ title: change ? 'Nueva contraseña' : 'Activar contraseña', text: 'Mínimo 8 caracteres. <strong>Si la olvidas, no hay recuperación posible.</strong> Apúntala en un sitio seguro.', label: 'Contraseña', type: 'password', ok: 'Continuar' });
    if (pw === null) return;
    if (pw.length < 8) { toast('La contraseña debe tener al menos 8 caracteres.', null, { error: true }); return; }
    const pw2 = await promptDialog({ title: 'Repite la contraseña', label: 'Contraseña', type: 'password', ok: 'Activar' });
    if (pw2 !== pw) { toast('Las contraseñas no coinciden.', null, { error: true }); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    App.crypto = { key: await Storage.deriveKey(pw, salt, 600000), salt: b64.enc(salt), iter: 600000 };
    App.encrypted = true;
    await persistNow();
    render();
    toast(change ? 'Contraseña cambiada' : 'Contraseña activada: los datos ya se guardan cifrados');
  }
  async function removePassword() {
    if (!(await confirmDialog({ title: 'Quitar la contraseña', text: 'Los datos quedarán guardados sin cifrar en este navegador.', ok: 'Quitar', danger: true }))) return;
    App.crypto = { key: null, salt: null, iter: 600000 };
    App.encrypted = false;
    await persistNow();
    render();
  }
  function lockNow() {
    if (!App.encrypted) return;
    App.locked = true; App.state = null; App.crypto.key = null; App.undo = []; App.selectedPatient = null; App.editing = null; App.settingsDraft = null;
    closeDialog();
    render();
  }
  async function unlock(pw) {
    const env = Storage.read();
    try {
      const { doc, key } = await Storage.decrypt(env, pw);
      App.state = C.migrate(doc);
      App.crypto = { key, salt: env.salt, iter: env.iter };
      App.locked = false; App.lastActivity = Date.now();
      render();
    } catch (e) { const el = $('#lock-err'); if (el) el.textContent = 'Contraseña incorrecta.'; }
  }

  async function exportData(plain) {
    const name = `cuadrante-${C.toISODate(new Date())}.json`;
    const env = (App.crypto.key && !plain) ? await Storage.encrypt(App.state, App.crypto.key, App.crypto.salt, App.crypto.iter) : { enc: false, doc: App.state };
    if (plain && App.encrypted && !(await confirmDialog({ title: 'Exportar sin cifrar', text: 'El fichero contendrá los datos de tus pacientes en claro. Guárdalo solo en un sitio seguro.', ok: 'Exportar' }))) return;
    await saveFile(name, JSON.stringify(env, null, 1), 'application/json');
    App.state.settings.lastExport = C.toISODate(new Date());
    App.settingsDraft = null;
    save(); render();
  }
  function importData() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files[0]; if (!file) return;
      try {
        const env = JSON.parse(await file.text());
        let doc;
        if (env.enc) {
          const pw = await promptDialog({ title: 'Copia cifrada', text: 'Escribe la contraseña con la que se exportó esta copia.', label: 'Contraseña', type: 'password', ok: 'Descifrar' });
          if (pw === null) return;
          doc = (await Storage.decrypt(env, pw)).doc;
        } else doc = env.doc || env;
        const next = C.migrate(doc);
        const ok = await confirmDialog({ title: 'Importar esta copia', text: `Contiene <strong>${next.patients.length} pacientes</strong>, ${next.slots.length} huecos y ${next.invoices.length} facturas. <strong>Sustituirá</strong> todo lo que hay ahora en este navegador.`, ok: 'Sustituir', danger: true });
        if (!ok) return;
        App.state = next; App.undo = []; App.selectedPatient = null; App.editing = null; App.settingsDraft = null;
        await persistNow();
        render(); toast('Copia importada');
      } catch (e) { toast(e.message.includes('decrypt') || e.name === 'OperationError' ? 'Contraseña incorrecta o fichero dañado.' : `No se pudo importar: ${e.message}`, null, { error: true, ms: 8000 }); }
    };
    input.click();
  }
  async function wipeAll() {
    if (!(await confirmDialog({ title: 'Borrar todos los datos', text: 'Se eliminan pacientes, cuadrante, semanas y facturas de este navegador. Si no tienes una copia exportada, no se pueden recuperar.', ok: 'Borrar todo', danger: true }))) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nada */ }
    App.crypto = { key: null, salt: null, iter: 600000 }; App.encrypted = false; App.locked = false;
    App.state = C.defaultState(); App.undo = []; App.selectedPatient = null; App.editing = null; App.settingsDraft = null; App.view = 'semana';
    render();
  }

  function loadDemo() {
    const st = C.defaultState();
    st.settings.onboarded = true;
    st.settings.weekAnchor = C.toISODate(C.mondayOf(new Date()));
    const mk = (alias, extra) => { const p = C.newPatient(st, { alias, ...extra }); st.patients.push(p); return p; };
    const no = (p, d, motivo) => { p.avail[d].m = 0; p.avail[d].t = 0; if (motivo) p.avail[d].motivo = motivo; };
    const pref = (p, d, b) => { p.avail[d][b] = 2; };
    const marta = mk('Marta R.', { color: 'musgo' }); no(marta, 'J', 'jueves recoge a los niños'); pref(marta, 'L', 'm');
    const jorge = mk('Jorge L.', { color: 'cielo', freq: 'quincenalA' }); no(jorge, 'L'); no(jorge, 'X', 'guardias');
    const lucia = mk('Lucía P.', { color: 'lila', nombre: 'Lucía Pérez Andrade', notas: 'Avisa con poca antelación si cambia el turno.', billing: { nombreFiscal: 'Lucía Pérez Andrade', nif: '00000000T', direccion: '[Dirección]', email: '', modo: 'mensual', retencion: 0 } });
    no(lucia, 'M', 'turno de tarde en el hospital; las mañanas duerme'); pref(lucia, 'L', 't'); pref(lucia, 'X', 't'); pref(lucia, 'J', 't'); lucia.avail.J.hours = [17, 19]; lucia.avail.J.motivo = 'sale a las 15:30; llega bien desde las 16:00';
    const andres = mk('Andrés M.', { color: 'arena', fixed: true });
    const pareja = mk('Carla y Dani', { color: 'rosa', dur: 90, tarifa: 80 }); for (const d of ['L', 'M', 'X']) no(pareja, d, 'solo pueden jueves o viernes tarde'); pareja.avail.J.m = 0; pareja.avail.V.m = 0;
    const nora = mk('Nora S.', { color: 'menta', modalidad: 'online' });
    const pablo = mk('Pablo V.', { color: 'melocoton' }); no(pablo, 'L'); no(pablo, 'M', 'viaja por trabajo lunes y martes');
    const irene = mk('Irene G.', { color: 'pizarra', freq: 'quincenalB' }); no(irene, 'X'); no(irene, 'V');
    const tomas = mk('Tomás B.', { color: 'musgo' });
    const elena = mk('Elena C.', { color: 'cielo' }); no(elena, 'M'); no(elena, 'V', 'cuida a su madre los viernes');
    const raul = mk('Raúl D.', { color: 'lila' }); for (const d of ['L', 'M', 'X']) no(raul, d, 'turno partido de lunes a miércoles');
    const sofia = mk('Sofía A.', { color: 'arena', modalidad: 'online' });
    const hugo = mk('Hugo F.', { color: 'rosa' }); no(hugo, 'X', 'cuida a su madre'); pref(hugo, 'J', 't');
    const nerea = mk('Nerea O.', { color: 'menta' }); for (const d of ['L', 'M', 'X', 'J', 'V']) nerea.avail[d].m = 0; no(nerea, 'M', 'solo tardes; martes clase'); no(nerea, 'V');
    const ivan = mk('Iván T.', { color: 'pizarra', freq: 'quincenalB', modalidad: 'online' }); no(ivan, 'J'); no(ivan, 'V');
    const paula = mk('Paula N.', { color: 'cielo', enEspera: true, prioridad: 'urgente' }); for (const d of ['L', 'M', 'X', 'J', 'V']) paula.avail[d].m = 0; paula.avail.M.motivo = 'solo tardes; llamó el 2 de septiembre';
    const oscar = mk('Óscar R.', { color: 'melocoton', enEspera: true, prioridad: 'normal', modalidad: 'online' });
    void paula; void oscar;
    const slot = (p, day, hour) => st.slots.push({ id: C.uid('s'), patientId: p.id, day, hour });
    slot(marta, 'L', 10); slot(tomas, 'L', 11); slot(andres, 'L', 17);
    slot(sofia, 'M', 10); slot(jorge, 'M', 17); slot(irene, 'M', 17);
    slot(nora, 'X', 12); slot(lucia, 'X', 16); slot(hugo, 'X', 18);
    slot(elena, 'J', 10); slot(pareja, 'J', 18);
    slot(pablo, 'V', 11); slot(raul, 'V', 17);
    // dos semanas anteriores con el OK dado, para tener sesiones que facturar
    for (const n of [-2, -1]) {
      const w = C.shiftWeek(C.isoWeekId(new Date()), n);
      const rev = C.weekReview(st, w);
      if (rev[2]) { rev[2].status = 'cancelada'; }
      C.closeWeek(st, w, rev);
    }
    App.state = st; App.undo = []; App.selectedPatient = null; App.editing = null; App.settingsDraft = null; App.view = 'semana';
    App.weekId = C.isoWeekId(new Date());
    save(); render();
    toast('Datos de ejemplo cargados. Son ficticios: bórralos cuando quieras desde Ajustes.', null, { ms: 7000 });
  }

  // ======================================================================
  // Eventos
  // ======================================================================
  function openSheet(pid) { App.selectedPatient = pid || null; render(); }

  document.addEventListener('click', async e => {
    const cellHit = e.target.closest('[data-cell]');
    if (cellHit && App.view === 'semana' && !e.target.closest('.box') && !e.target.closest('[data-action]') && !Drag.active && !Kb.active) { suggestForCell(cellHit, e); return; }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'button') return;
    const a = el.dataset.action;
    App.lastActivity = Date.now();
    switch (a) {
      case 'go': App.view = el.dataset.view; App.editing = null; App.settingsDraft = null; App.selectedInvoice = null; render(); break;
      case 'week': App.weekId = C.shiftWeek(App.weekId, Number(el.dataset.n)); render(); break;
      case 'week-today': App.weekId = C.isoWeekId(new Date()); App.mobileDay = null; render(); break;
      case 'mobile-day': App.mobileDay = el.dataset.day; render(); break;
      case 'select': openSheet(el.dataset.pid); break;
      case 'new-patient': startEdit(null); break;
      case 'edit-patient': startEdit(el.dataset.pid); break;
      case 'cancel-edit': App.editing = null; render(); break;
      case 'pat-filter': App.patientFilter = el.dataset.f; render(); break;
      case 'f-seg': { const f = el.dataset.field; readPatientForm(); App.editing[f] = (f === 'dur' || f === 'sesiones') ? Number(el.dataset.value) : el.dataset.value; render(); break; }
      case 'f-bseg': { readPatientForm(); App.editing.billing[el.dataset.field] = el.dataset.field === 'retencion' ? Number(el.dataset.value) : el.dataset.value; render(); break; }
      case 'f-color': readPatientForm(); App.editing.color = el.dataset.color; render(); break;
      case 'f-toggle': readPatientForm(); App.editing[el.dataset.field] = !App.editing[el.dataset.field]; if (el.dataset.field === 'activo' && App.editing.activo === undefined) App.editing.activo = false; render(); break;
      case 'av-cycle': { readPatientForm(); const av = App.editing.avail[el.dataset.day]; av[el.dataset.band] = (av[el.dataset.band] + 1) % 3; render(); break; }
      case 'delete-patient': {
        const p = App.editing;
        const hasInv = App.state.invoices.some(i => i.patientId === p.id);
        if (hasInv) { toast('Tiene facturas: dale de baja en lugar de eliminarlo.', null, { error: true }); break; }
        if (!(await confirmDialog({ title: `Eliminar a ${p.alias}`, text: 'Se borra la ficha y sus huecos. Si tiene historial que debas conservar, mejor dale de baja.', ok: 'Eliminar', danger: true }))) break;
        commit(st => { st.patients = st.patients.filter(x => x.id !== p.id); st.slots = st.slots.filter(s => s.patientId !== p.id); }, { undo: true, toast: 'Paciente eliminado' });
        App.editing = null; render(); break;
      }
      case 'toggle-fixed': commit(st => { const p = st.patients.find(x => x.id === el.dataset.pid); p.fixed = !p.fixed; }, {}); break;
      case 'skip-week': { const sid = el.dataset.sid; const p = patient(weekSessions().find(s => s.id === sid).patientId); commit(st => { const wk = st.weeks[App.weekId] || (st.weeks[App.weekId] = { moves: {}, sessions: {} }); wk.moves = wk.moves || {}; wk.moves[sid] = null; }, { undo: true, toast: `${p.alias} no viene esta semana` }); break; }
      case 'remove-slot': { const pid = el.dataset.pid; commit(st => { st.slots = st.slots.filter(s => s.patientId !== pid); }, { undo: true, toast: 'Quitado del cuadrante' }); break; }
      case 'move-to': { const r = el.getBoundingClientRect(); askScope(r.left + r.width / 2, r.top, scope => performMove(el.dataset.sid, el.dataset.pid, el.dataset.day, Number(el.dataset.hour), null, scope)); break; }
      case 'recolocar': openReflow(); break;
      case 'reflow-opt': Reflow.opts[el.dataset.key] = !Reflow.opts[el.dataset.key]; runReflow(); break;
      case 'reflow-again': Reflow.seed += 1; runReflow(); break;
      case 'reflow-apply': { const pr = Reflow.proposal; closeDialog(); commit(st => C.applyProposal(st, pr), { undo: true, toast: `${pr.diff.length} cambios aplicados`, announce: 'Cuadrante recolocado' }); break; }
      case 'ok-week': openReview(); break;
      case 'rev-status': { const r = Review.rows[Number(el.dataset.i)]; r.status = el.dataset.status; if (r.status === 'realizada') r.cobrar = false; renderReview(); break; }
      case 'rev-cobrar': { const r = Review.rows[Number(el.dataset.i)]; r.cobrar = el.checked; renderReview(); break; }
      case 'review-ok': { const rows = Review.rows; const n = rows.filter(r => r.status === 'realizada' || r.cobrar).length; closeDialog(); commit(st => C.closeWeek(st, App.weekId, rows), { toast: `OK dado: ${n} sesiones listas para facturar` }); break; }
      case 'dialog-close': closeDialog(); break;
      case 'inv-month': App.invoiceMonth = el.dataset.m; App.selectedInvoice = null; render(); break;
      case 'inv-filter': App.invoiceFilter = el.dataset.f; render(); break;
      case 'inv-select': App.selectedInvoice = el.dataset.id || null; render(); break;
      case 'inv-drafts': { const drafts = C.generateDrafts(App.state); if (!drafts.length) { toast('No hay sesiones pendientes de facturar.'); break; } commit(st => { st.invoices.push(...drafts); }, { undo: true, toast: `${drafts.length} borradores generados` }); App.invoiceFilter = 'borradores'; App.selectedInvoice = drafts[0].id; render(); break; }
      case 'inv-issue': {
        const inv = App.state.invoices.find(i => i.id === App.selectedInvoice);
        const num = C.nextNumero(App.state.settings, !!inv.rectificaDe);
        if (!App.state.settings.emisor.nombre || !App.state.settings.emisor.nif) { toast('Rellena tus datos fiscales en Ajustes antes de emitir.', null, { error: true }); break; }
        if (!(await confirmDialog({ title: `Emitir como ${num}`, text: `Se asigna el número <span class="mono">${esc(num)}</span> con fecha de hoy y se congelan los datos. Después no se podrá editar ni borrar, solo rectificar.`, ok: 'Emitir' }))) break;
        try { commit(st => C.issueInvoice(st, inv.id), { toast: `Factura ${num} emitida` }); App.undo = []; } catch (err) { toast(err.message, null, { error: true }); }
        break;
      }
      case 'inv-delete': { if (!(await confirmDialog({ title: 'Eliminar el borrador', text: 'Sus sesiones vuelven a "pendiente de facturar".', ok: 'Eliminar', danger: true }))) break; const id = App.selectedInvoice; App.selectedInvoice = null; commit(st => { st.invoices = st.invoices.filter(i => i.id !== id); }, { undo: true, toast: 'Borrador eliminado' }); break; }
      case 'inv-paid': { const v = el.dataset.v; commit(st => { const inv = st.invoices.find(i => i.id === App.selectedInvoice); inv.estado = v; if (v === 'pagada') inv.pagadaEl = C.toISODate(new Date()); else delete inv.pagadaEl; }, { toast: v === 'pagada' ? 'Marcada como pagada' : 'Desmarcada' }); break; }
      case 'inv-rectify': { const causa = await promptDialog({ title: 'Factura rectificativa', text: 'Se crea un borrador en la serie de rectificativas que anula la factura completa (importes en negativo). Para una rectificación parcial, ajusta después los importes de las líneas del borrador. Indica la causa.', label: 'Causa', placeholder: 'Error en el importe / sesión no realizada…', ok: 'Crear borrador' }); if (causa === null) break; try { const d = C.rectifyDraft(App.state, App.selectedInvoice, causa.trim() || undefined); commit(st => { st.invoices.push(d); }, { toast: 'Borrador de rectificativa creado' }); App.invoiceFilter = 'borradores'; App.selectedInvoice = d.id; render(); } catch (err) { toast(err.message, null, { error: true }); } break; }
      case 'inv-print': { const inv = App.state.invoices.find(i => i.id === App.selectedInvoice); $('#print-area').innerHTML = invoiceHtml(inv); try { window.print(); } catch (err) { toast('Este navegador no permite imprimir desde aquí: descarga el HTML y ábrelo.', null, { error: true }); } break; }
      case 'inv-download': { const inv = App.state.invoices.find(i => i.id === App.selectedInvoice); await saveFile(`${inv.numero || 'borrador'}.html`, invoiceDocument(inv), 'text/html'); break; }
      case 'inv-pdf': { const inv = App.state.invoices.find(i => i.id === App.selectedInvoice); const pdf = C.pdfInvoice(inv, { settings: App.state.settings, patient: patient(inv.patientId) }); const bytes = Uint8Array.from(pdf, ch => ch.charCodeAt(0)); await saveFile(`${inv.numero || 'borrador'}.pdf`, bytes, 'application/pdf'); break; }
      case 'inv-aeat': { const year = App.invoiceMonth.slice(0, 4); const csv = C.csvAEAT(App.state, year); if (csv.split('\r\n').length < 2) { toast(`No hay facturas emitidas en ${year}.`); break; } await saveFile(`libro-expedidas-${year}.csv`, '\ufeff' + csv, 'text/csv'); break; }
      case 'inv-line-del': { commit(st => { const inv = st.invoices.find(i => i.id === App.selectedInvoice); const i = Number(el.dataset.i); if (inv.lineas.length <= 1) return; inv.lineas.splice(i, 1); if (inv.sesiones && inv.sesiones.length > i) inv.sesiones.splice(i, 1); Object.assign(inv, C.invoiceTotals(inv.lineas, inv.ivaPct || 0, inv.retPct || 0)); }, { undo: true, toast: 'Línea quitada; esa sesión vuelve a pendiente de facturar' }); break; }
      case 'inv-csv': { const csv = C.csvMonth(App.state, App.invoiceMonth); if (csv.split('\r\n').length < 2) { toast('No hay facturas emitidas ese mes.'); break; } await saveFile(`facturas-${App.invoiceMonth}.csv`, '﻿' + csv, 'text/csv'); break; }
      case 's-toggle': readSettingsForm(); App.settingsDraft[el.dataset.key] = !App.settingsDraft[el.dataset.key]; render(); break;
      case 'closed-add': { readSettingsForm(); const d = $('#closed-date').value, m = $('#closed-motivo').value.trim(); if (!d) { toast('Elige una fecha.'); break; } App.settingsDraft.closedDates = (App.settingsDraft.closedDates || []).filter(c => c.date !== d).concat([{ date: d, motivo: m }]); render(); break; }
      case 'closed-del': { readSettingsForm(); const list = (App.settingsDraft.closedDates || []).slice().sort((a, b) => a.date.localeCompare(b.date)); list.splice(Number(el.dataset.i), 1); App.settingsDraft.closedDates = list; render(); break; }
      case 'export': exportData(false); break;
      case 'export-ics': await saveFile('consulta.ics', C.icsExport(App.state, C.isoWeekId(new Date()), 8), 'text/calendar'); break;
      case 'copy-reminder': { const p = patient(el.dataset.pid); const s = weekSessions().find(x => x.patientId === p.id); if (!s) break; const d = C.dateOfDay(App.weekId, s.day); const txt = `Hola, te recuerdo la cita del ${C.DAY_NAMES[s.day].toLowerCase()} ${d.getDate()} de ${C.MONTHS[d.getMonth()]} a las ${C.fmtHour(s.hour)}${p.modalidad === 'online' ? ' (online)' : ''}. Si no puedes venir, avísame con antelación. ¡Hasta entonces!`; try { await navigator.clipboard.writeText(txt); toast('Recordatorio copiado: pégalo en tu app de mensajes.'); } catch (err) { await promptDialog({ title: 'Recordatorio', label: 'Copia este texto', value: txt, ok: 'Cerrar' }); } break; }
      case 'add-session': commit(st => { const p = st.patients.find(x => x.id === el.dataset.pid); p.sesiones = Math.max(1, slotsOf(p)) + 1; }, { undo: true, toast: 'Añadido a "Sin hueco": arrástralo a otro hueco o pulsa Recolocar' }); break;
      case 'export-plain': exportData(true); break;
      case 'import': importData(); break;
      case 'pw-set': setPassword(false); break;
      case 'pw-change': setPassword(true); break;
      case 'pw-remove': removePassword(); break;
      case 'lock': lockNow(); break;
      case 'wipe': wipeAll(); break;
      case 'demo-load': if (App.state.patients.length && !(await confirmDialog({ title: 'Cargar datos de ejemplo', text: 'Sustituyen todo lo que hay ahora. ¿Seguro?', ok: 'Cargar', danger: true }))) break; loadDemo(); break;
      case 'start-empty': commit(st => { st.settings.onboarded = true; }, {}); App.view = 'ajustes'; render(); toast('Empieza por tu horario y tus datos de facturación.'); break;
      case 'undo': undo(); break;
      default: break;
    }
  });

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    App.lastActivity = Date.now();
    switch (el.dataset.action) {
      case 'rev-importe': Review.rows[Number(el.dataset.i)].importe = C.round2(Number(el.value) || 0); renderReview(); break;
      case 'inv-line-importe': case 'inv-line-concepto': {
        commit(st => { const inv = st.invoices.find(i => i.id === App.selectedInvoice); const l = inv.lineas[Number(el.dataset.i)]; if (el.dataset.action === 'inv-line-importe') l.importe = C.round2(Number(el.value) || 0); else l.concepto = el.value.trim(); Object.assign(inv, C.invoiceTotals(inv.lineas, inv.ivaPct || 0, inv.retPct || 0)); const p = st.patients.find(x => x.id === inv.patientId); const k = C.invoiceKind(p, inv.total); inv.tipo = k.tipo; inv.aviso = k.warning; }, {});
        break;
      }
      case 'lock-min': { const v = Math.max(1, Number(el.value) || 5); commit(st => { st.settings.lockMin = v; }, {}); break; }
      default: break;
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'patient-form') { e.preventDefault(); savePatient(); }
    else if (e.target.id === 'settings-form') { e.preventDefault(); const s = readSettingsForm(); commit(st => { st.settings = s; st.settings.onboarded = true; }, { toast: 'Ajustes guardados' }); App.settingsDraft = null; render(); }
    else if (e.target.id === 'lock-form') { e.preventDefault(); unlock($('#lock-pw').value); }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'pat-search' && App.view === 'pacientes') { App.patientSearch = e.target.value; const pos = e.target.selectionStart; render(); const el = $('#pat-search'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
  });

  document.addEventListener('pointerdown', e => {
    App.lastActivity = Date.now();
    const box = e.target.closest('.box');
    if (!box || !box.closest('#app') || box.closest('.ghost')) return;
    dragStart(e, box);
  });
  document.addEventListener('pointermove', e => { if (Drag.active) dragMove(e); });
  document.addEventListener('pointerup', e => { if (Drag.active) dragEnd(e, false); });
  document.addEventListener('pointercancel', e => { if (Drag.active) dragEnd(e, true); });
  document.addEventListener('contextmenu', e => { if (Drag.active || e.target.closest('.box')) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (e.target.closest('.box')) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    App.lastActivity = Date.now();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !e.target.closest('input, textarea')) { e.preventDefault(); undo(); }
    if (Kb.active) {
      if (e.key === 'ArrowRight') { e.preventDefault(); kbStep(1, true); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); kbStep(-1, true); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); kbStep(1, false); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); kbStep(-1, false); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kbEnd(true); return; }
      if (e.key === 'Escape') { e.preventDefault(); kbEnd(false); return; }
    }
    if (e.key === 'Escape') { if (Drag.active) dragEnd(e, true); closePopover(); if ($('#dialog-root').innerHTML) closeDialog(); else if (App.selectedPatient) openSheet(null); }
    if (e.key === ' ' && e.target.classList && e.target.classList.contains('box')) { e.preventDefault(); kbStart(e.target); return; }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('box')) { e.preventDefault(); openSheet(e.target.dataset.pid); }
  });
  document.addEventListener('click', e => { if (e.target.matches('[data-overlay]')) closeDialog(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkLock(); });
  function checkLock() {
    if (!App.encrypted || App.locked || !App.state) return;
    const min = App.state.settings.lockMin || 5;
    if (Date.now() - App.lastActivity > min * 60000) lockNow();
  }
  setInterval(checkLock, 30000);
  setInterval(() => { if (App.view === 'semana' && !Drag.active && !$('#dialog-root').innerHTML && App.state && !App.locked) { const nl = $('.nowline'); if (nl || isTodayWeek()) render(); } }, 5 * 60000);

  // ======================================================================
  // Arranque
  // ======================================================================
  async function init() {
    try { if (navigator.storage && navigator.storage.persist) App.persisted = await navigator.storage.persist(); } catch (e) { /* nada */ }
    const env = Storage.read();
    if (env && env.enc) { App.encrypted = true; App.locked = true; App.crypto = { key: null, salt: env.salt, iter: env.iter }; render(); return; }
    try { App.state = env && env.doc ? C.migrate(env.doc) : C.defaultState(); }
    catch (e) { App.state = C.defaultState(); toast(`No se pudieron leer los datos guardados: ${e.message}`, null, { error: true, sticky: true }); }
    render();
  }
  init();
})();
