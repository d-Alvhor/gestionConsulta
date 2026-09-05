/* Cuadrante de consulta — núcleo sin DOM: calendario, reglas, solver, semanas y facturación. */
const Core = (() => {
  'use strict';

  // ---------- constantes ----------
  const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const DAY_NAMES = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };
  const DAY_SHORT = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };
  const COLORS = {
    musgo: { bg: '#DCE8D2', fg: '#2E4A22' },
    cielo: { bg: '#D6E4F0', fg: '#1F3F5C' },
    lila: { bg: '#E3DCEF', fg: '#42305E' },
    arena: { bg: '#F0E4CC', fg: '#5A4416' },
    rosa: { bg: '#F2DADA', fg: '#6A2E2E' },
    menta: { bg: '#D3ECE6', fg: '#1F4E45' },
    melocoton: { bg: '#F5DFD0', fg: '#6B3A1D' },
    pizarra: { bg: '#DEE2E7', fg: '#2F3A47' },
  };
  const COLOR_KEYS = Object.keys(COLORS);
  const SCHEMA_VERSION = 1;
  const WEIGHTS = { pref: 10, stability: 8, stabilityLow: 2, deadGap: 3, pairBiweekly: -5, unplaced: 1000 };
  const SIMPLIFICADA_MAX = 400;

  // ---------- ids ----------
  let uidCounter = 0;
  function uid(prefix) {
    uidCounter += 1;
    return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  // ---------- estado por defecto ----------
  function defaultOffice() {
    const o = {};
    for (const d of DAYS) o[d] = { m: true, t: true };
    return o;
  }

  function defaultSettings() {
    const year = new Date().getFullYear();
    return {
      slotMin: 60,
      sessionMin: 50,
      days: ['L', 'M', 'X', 'J', 'V'],
      hours: { start: 9, end: 20, breaks: [[14, 16]] },
      tardeDesde: 15,
      maxPerDay: 7,
      weekAnchor: '2026-09-07',
      office: defaultOffice(),            // despacho disponible para sesiones presenciales (por día y franja)
      closedDates: [],                    // [{ date: 'YYYY-MM-DD', motivo }]
      autoHolidays: true,                 // festivos nacionales de España calculados solos
      discreet: false,
      lockMin: 5,
      emisor: { nombre: '', nif: '', direccion: '', email: '', telefono: '', colegiado: '', registro: '' },
      serie: `F-${year}`, siguiente: 1,
      serieRect: `R-${year}`, siguienteRect: 1,
      iva: 0,
      textoExencion: 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992, del Impuesto sobre el Valor Añadido (asistencia sanitaria prestada por profesional sanitario).',
      formaPago: 'Pago por transferencia bancaria o Bizum.',
      vencimientoDias: 0,
      lastExport: null,
      onboarded: false,
    };
  }

  function defaultState() {
    return { v: SCHEMA_VERSION, settings: defaultSettings(), patients: [], slots: [], weeks: {}, invoices: [] };
  }

  function emptyAvail(days) {
    const a = {};
    for (const d of DAYS) a[d] = { m: days.includes(d) ? 1 : 0, t: days.includes(d) ? 1 : 0, hours: null, motivo: '' };
    return a;
  }

  function newPatient(state, partial = {}) {
    const idx = state.patients.length;
    return Object.assign({
      id: uid('p'),
      alias: '', nombre: '',
      color: COLOR_KEYS[idx % COLOR_KEYS.length],
      freq: 'semanal',
      dur: state.settings.sessionMin,
      modalidad: 'presencial',
      tarifa: 60,
      activo: true,
      avail: emptyAvail(state.settings.days),
      fixed: false,
      sesiones: 1,                        // sesiones por semana
      enEspera: false, prioridad: 'normal', // lista de espera
      notas: '',
      billing: { nombreFiscal: '', nif: '', direccion: '', email: '', modo: 'mensual', retencion: 0 },
    }, partial);
  }

  // ---------- calendario ----------
  const pad2 = n => String(n).padStart(2, '0');
  const toISODate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const fromISODate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDate = d => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  const fmtHour = h => `${pad2(Math.floor(h))}:${pad2(Math.round((h % 1) * 60))}`;
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

  function mondayOf(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return addDays(d, -((d.getDay() + 6) % 7));
  }

  function isoWeekId(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${pad2(week)}`;
  }

  function weekIdToMonday(weekId) {
    const [y, w] = weekId.split('-W').map(Number);
    return addDays(mondayOf(new Date(y, 0, 4)), (w - 1) * 7);
  }

  const shiftWeek = (weekId, n) => isoWeekId(addDays(weekIdToMonday(weekId), n * 7));
  const dateOfDay = (weekId, day) => addDays(weekIdToMonday(weekId), DAYS.indexOf(day));

  function weekParity(weekId, anchorISO) {
    const anchor = mondayOf(fromISODate(anchorISO));
    const monday = weekIdToMonday(weekId);
    const diffWeeks = Math.round((monday - anchor) / (7 * 86400000));
    return ((diffWeeks % 2) + 2) % 2 === 0 ? 'A' : 'B';
  }

  function weekLabel(weekId, days) {
    const mon = weekIdToMonday(weekId);
    const last = addDays(mon, Math.max(4, DAYS.indexOf((days || ['V']).slice(-1)[0])));
    const same = mon.getMonth() === last.getMonth();
    const num = Number(weekId.split('-W')[1]);
    const range = same
      ? `${mon.getDate()} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`
      : `${mon.getDate()} ${MONTHS_SHORT[mon.getMonth()]} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]} ${last.getFullYear()}`;
    return { num, range };
  }

  function periodoLabel(periodo) {
    const [y, m] = periodo.split('-').map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  }

  function workingHours(settings) {
    const out = [];
    for (let h = settings.hours.start; h < settings.hours.end; h++) if (isWorkingHour(settings, h)) out.push(h);
    return out;
  }

  function isWorkingHour(settings, h) {
    if (h < settings.hours.start || h >= settings.hours.end) return false;
    return !(settings.hours.breaks || []).some(([a, b]) => h >= a && h < b);
  }

  const band = (settings, hour) => hour < (settings.tardeDesde ?? 15) ? 'm' : 't';

  function closedInfo(settings, isoDate) {
    const manual = (settings.closedDates || []).find(c => c.date === isoDate);
    if (manual) return manual;
    if (settings.autoHolidays === false) return null;
    return spanishHolidays(Number(isoDate.slice(0, 4))).find(c => c.date === isoDate) || null;
  }

  /** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
  function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  /** Festivos nacionales de España (los de todas las comunidades). Los autonómicos y locales se añaden a mano. */
  function spanishHolidays(year) {
    const e = easterSunday(year);
    const fixed = [['01-01', 'Año Nuevo'], ['01-06', 'Epifanía'], ['05-01', 'Fiesta del Trabajo'], ['08-15', 'Asunción'], ['10-12', 'Fiesta Nacional'], ['11-01', 'Todos los Santos'], ['12-06', 'Día de la Constitución'], ['12-08', 'Inmaculada'], ['12-25', 'Navidad']];
    const out = fixed.map(([md, motivo]) => ({ date: `${year}-${md}`, motivo, auto: true }));
    out.push({ date: toISODate(addDays(e, -2)), motivo: 'Viernes Santo', auto: true });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ---------- reglas ----------
  function parityOf(patient) {
    if (patient.freq === 'quincenalA') return 'A';
    if (patient.freq === 'quincenalB') return 'B';
    return 'AB';
  }
  const paritiesOverlap = (a, b) => a === 'AB' || b === 'AB' || a === b;
  const span = (settings, patient) => Math.max(1, Math.ceil((patient.dur || settings.sessionMin) / settings.slotMin));

  function availState(settings, patient, day, hour) {
    const a = (patient.avail && patient.avail[day]) || { m: 1, t: 1, hours: null, motivo: '' };
    const b = band(settings, hour);
    const st = a[b] ?? 1;
    if (st === 0) {
      const other = a[b === 'm' ? 't' : 'm'] ?? 1;
      const scope = other === 0 ? '' : (b === 'm' ? ' por la mañana' : ' por la tarde');
      return { ok: false, pref: false, reason: `${DAY_NAMES[day]}: no puede${scope}${a.motivo ? ' — ' + a.motivo : ''}` };
    }
    if (Array.isArray(a.hours) && a.hours.length === 2) {
      const [h0, h1] = a.hours;
      if (hour < h0 || hour >= h1) return { ok: false, pref: false, reason: `${DAY_NAMES[day]}: solo de ${fmtHour(h0)} a ${fmtHour(h1)}${a.motivo ? ' — ' + a.motivo : ''}` };
    }
    return { ok: true, pref: st === 2, reason: '' };
  }

  function patientMap(patients) {
    return patients instanceof Map ? patients : new Map(patients.map(p => [p.id, p]));
  }

  /**
   * ctx = { settings, patients, sessions: [{id, patientId, day, hour, parity}], ignoreIds?: Set }
   * → { ok, reason, occupiedBy: [sessionId], pref }
   */
  function canPlace(ctx, patientId, day, hour, parityOverride) {
    const settings = ctx.settings;
    const pmap = ctx.pmap || (ctx.pmap = patientMap(ctx.patients));
    const patient = pmap.get(patientId);
    if (!patient) return { ok: false, reason: 'Paciente desconocido', occupiedBy: [] };
    if (!settings.days.includes(day)) return { ok: false, reason: `${DAY_NAMES[day]}: no pasas consulta`, occupiedBy: [] };
    const n = span(settings, patient);
    for (let k = 0; k < n; k++) {
      if (!isWorkingHour(settings, hour + k)) return { ok: false, reason: k === 0 ? 'Fuera de tu horario' : `Una sesión de ${patient.dur} min no cabe ahí`, occupiedBy: [] };
    }
    if (patient.modalidad === 'presencial') {
      const off = (settings.office || {})[day];
      if (off && off[band(settings, hour)] === false) return { ok: false, reason: `${DAY_NAMES[day]} ${band(settings, hour) === 'm' ? 'mañana' : 'tarde'}: sin despacho (solo online)`, occupiedBy: [] };
    }
    const av = availState(settings, patient, day, hour);
    if (!av.ok) return { ok: false, reason: av.reason, occupiedBy: [] };
    const myPar = parityOverride || parityOf(patient);
    const ignore = ctx.ignoreIds || new Set();
    const occupiedBy = [];
    let countDay = 0;
    for (const s of ctx.sessions) {
      if (ignore.has(s.id) || s.day !== day) continue;
      const other = pmap.get(s.patientId);
      const sPar = s.parity || (other ? parityOf(other) : 'AB');
      if (!paritiesOverlap(myPar, sPar)) continue;
      countDay++;
      const sn = other ? span(settings, other) : 1;
      if ((s.hour < hour + n) && (hour < s.hour + sn)) occupiedBy.push(s.id);
    }
    if (occupiedBy.length) {
      const names = [...new Set(occupiedBy.map(id => { const s = ctx.sessions.find(x => x.id === id); return (pmap.get(s.patientId) || {}).alias || '?'; }))].join(' y ');
      return { ok: false, reason: `Ocupado por ${names}`, occupiedBy, pref: av.pref };
    }
    if (countDay >= settings.maxPerDay) return { ok: false, reason: `Ya tienes ${settings.maxPerDay} sesiones ese día`, occupiedBy: [] };
    return { ok: true, reason: '', occupiedBy: [], pref: av.pref };
  }

  function templateSessions(state) {
    const pmap = patientMap(state.patients);
    return state.slots
      .filter(s => pmap.has(s.patientId) && pmap.get(s.patientId).activo !== false && !pmap.get(s.patientId).enEspera)
      .map(s => ({ id: s.id, patientId: s.patientId, day: s.day, hour: s.hour, parity: parityOf(pmap.get(s.patientId)) }));
  }

  function validSlots(ctx, patientId, parityOverride) {
    const out = [];
    for (const day of ctx.settings.days) for (const hour of workingHours(ctx.settings)) {
      out.push({ day, hour, ...canPlace(ctx, patientId, day, hour, parityOverride) });
    }
    return out;
  }

  // ---------- coste blando ----------
  const hasAnyPref = p => Object.values(p.avail || {}).some(a => a.m === 2 || a.t === 2);

  function softCost(settings, patient, day, hour, current, opts, dayLoad) {
    let c = 0;
    if (!availState(settings, patient, day, hour).pref && hasAnyPref(patient)) c += WEIGHTS.pref;
    if (current && (current.day !== day || current.hour !== hour)) c += opts.minimalMoves ? WEIGHTS.stability : WEIGHTS.stabilityLow;
    if (opts.compact && dayLoad) {
      const hs = dayLoad[day] || new Set();
      if (hs.size && !hs.has(hour - 1) && !hs.has(hour + 1)) c += WEIGHTS.deadGap;
    }
    return c;
  }

  // ---------- solver ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * propose(state, opts) → { units, diff, pending, score }
   * Unidades = huecos de plantilla de pacientes activos + un hueco nuevo por paciente activo sin hueco.
   * opts: { keepFixed, minimalMoves, compact, seed, maxIter, budgetMs, now }
   */
  function propose(state, opts = {}) {
    const o = Object.assign({ keepFixed: true, minimalMoves: true, compact: false, seed: 1, maxIter: 3000, budgetMs: 1500 }, opts);
    const now = o.now || (() => Date.now());
    const rng = mulberry32(o.seed);
    const settings = state.settings;
    const pmap = patientMap(state.patients);
    const active = state.patients.filter(p => p.activo !== false && !p.enEspera);
    const activeIds = new Set(active.map(p => p.id));

    const units = [];
    for (const s of state.slots) if (activeIds.has(s.patientId)) units.push({ id: s.id, patientId: s.patientId, current: { day: s.day, hour: s.hour }, isNew: false });
    for (const p of active) {
      const have = units.filter(u => u.patientId === p.id).length;
      for (let k = have; k < Math.max(1, p.sesiones || 1); k++) units.push({ id: `new_${p.id}_${k}`, patientId: p.id, current: null, isNew: true });
    }
    const unitById = new Map(units.map(u => [u.id, u]));

    const assign = new Map(); // unitId → {day,hour}
    const fixedIds = new Set();
    for (const u of units) {
      const p = pmap.get(u.patientId);
      if (u.current && ((p.fixed && o.keepFixed) || p.freq === 'puntual')) { assign.set(u.id, u.current); fixedIds.add(u.id); }
    }

    const sessionsOf = (map, exceptId) => {
      const arr = [];
      for (const [id, s] of map) if (id !== exceptId) arr.push({ id, patientId: unitById.get(id).patientId, day: s.day, hour: s.hour, parity: parityOf(pmap.get(unitById.get(id).patientId)) });
      return arr;
    };

    const domain = new Map();
    for (const u of units) {
      if (fixedIds.has(u.id)) continue;
      const ctx = { settings, patients: pmap, sessions: [] };
      const d = [];
      for (const day of settings.days) for (const hour of workingHours(settings)) {
        const v = canPlace(ctx, u.patientId, day, hour);
        if (v.ok) d.push({ day, hour, pref: v.pref });
      }
      domain.set(u.id, d);
    }

    const dayLoadOf = map => { const load = {}; for (const [, s] of map) (load[s.day] = load[s.day] || new Set()).add(s.hour); return load; };
    const costOf = (uid_, slot, map) => softCost(settings, pmap.get(unitById.get(uid_).patientId), slot.day, slot.hour, unitById.get(uid_).current, o, o.compact ? dayLoadOf(map) : null);
    const free = (uid_, slot, map) => canPlace({ settings, patients: pmap, sessions: sessionsOf(map, uid_) }, unitById.get(uid_).patientId, slot.day, slot.hour).ok;

    // greedy MRV
    const toPlace = units.filter(u => !fixedIds.has(u.id));
    toPlace.sort((a, b) => {
      const da = domain.get(a.id).length, db = domain.get(b.id).length;
      if (da !== db) return da - db;
      const pa = parityOf(pmap.get(a.patientId)) === 'AB' ? 0 : 1, pb = parityOf(pmap.get(b.patientId)) === 'AB' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.id.localeCompare(b.id);
    });
    let pending = [];
    for (const u of toPlace) {
      const cands = domain.get(u.id).filter(s => free(u.id, s, assign));
      if (!cands.length) { pending.push(u.id); continue; }
      const scored = cands.map(s => ({ s, c: costOf(u.id, s, assign), r: rng() }));
      scored.sort((x, y) => (x.c - y.c) || (x.r - y.r));
      assign.set(u.id, { day: scored[0].s.day, hour: scored[0].s.hour });
    }

    const totalCost = (map, pend) => {
      // quedarse sin hueco cuesta más si ya se tenía uno (estabilidad también aquí)
      let c = 0;
      for (const id of pend) c += WEIGHTS.unplaced + (unitById.get(id).current ? WEIGHTS.stability : 0);
      for (const [id, s] of map) if (!fixedIds.has(id)) c += costOf(id, s, map);
      const byKey = {};
      for (const [id, s] of map) {
        if (parityOf(pmap.get(unitById.get(id).patientId)) === 'AB') continue;
        const k = `${s.day}-${s.hour}`; byKey[k] = (byKey[k] || 0) + 1;
      }
      for (const k in byKey) if (byKey[k] >= 2) c += WEIGHTS.pairBiweekly;
      return c;
    };

    // reparación min-conflicts con recocido suave (determinista con la semilla; el tiempo solo es tope de seguridad)
    let T = 5;
    const deadline = now() + o.budgetMs;
    let cur = { map: new Map(assign), pend: pending.slice(), cost: totalCost(assign, pending) };
    let best = { map: new Map(cur.map), pend: cur.pend.slice(), cost: cur.cost };
    let iter = 0;
    while (iter < o.maxIter && now() < deadline) {
      iter++;
      const pool = cur.pend.length && rng() < 0.7 ? cur.pend : toPlace.map(u => u.id);
      const id = pool[Math.floor(rng() * pool.length)];
      const dom = domain.get(id);
      if (!dom.length) continue;
      const slot = dom[Math.floor(rng() * dom.length)];
      const trial = new Map(cur.map);
      const trialPend = cur.pend.filter(x => x !== id);
      const v = canPlace({ settings, patients: pmap, sessions: sessionsOf(trial, id) }, unitById.get(id).patientId, slot.day, slot.hour);
      if (!v.ok) {
        if (v.occupiedBy.length !== 1) continue;
        const other = v.occupiedBy[0];
        if (fixedIds.has(other)) continue;
        const mine = trial.get(id);
        trial.delete(other);
        trial.set(id, { day: slot.day, hour: slot.hour });
        if (mine && canPlace({ settings, patients: pmap, sessions: sessionsOf(trial, other) }, unitById.get(other).patientId, mine.day, mine.hour).ok) trial.set(other, mine);
        else trialPend.push(other);
      } else {
        trial.set(id, { day: slot.day, hour: slot.hour });
      }
      const c = totalCost(trial, trialPend);
      const delta = c - cur.cost;
      if (delta < 0 || rng() < Math.exp(-delta / Math.max(T, 0.01))) {
        cur = { map: trial, pend: trialPend, cost: c };
        if (c < best.cost) best = { map: new Map(trial), pend: trialPend.slice(), cost: c };
      }
      T *= 0.98;
    }

    // validación final: nada colocado puede violar una regla dura
    const finalMap = new Map(best.map);
    const finalPend = best.pend.slice();
    for (const [id, s] of best.map) {
      if (fixedIds.has(id)) continue;
      const v = canPlace({ settings, patients: pmap, sessions: sessionsOf(finalMap, id) }, unitById.get(id).patientId, s.day, s.hour);
      if (!v.ok) { finalMap.delete(id); finalPend.push(id); }
    }

    const outUnits = units.map(u => ({ id: u.id, patientId: u.patientId, isNew: u.isNew, from: u.current, to: finalMap.get(u.id) || null, fixed: fixedIds.has(u.id) }));
    const diff = outUnits.filter(u => !(u.from && u.to && u.from.day === u.to.day && u.from.hour === u.to.hour) && !(!u.from && !u.to))
      .map(u => ({ ...u, reason: explainMove(state, pmap.get(u.patientId), u.from, u.to) }));
    const pendingOut = finalPend.map(id => ({ unitId: id, patientId: unitById.get(id).patientId, reason: explainPending(state, pmap.get(unitById.get(id).patientId), finalMap, unitById) }));
    const before = new Map(units.filter(u => u.current).map(u => [u.id, u.current]));
    const score = {
      placedBefore: before.size, placedAfter: finalMap.size, total: units.length,
      prefBefore: countPref(state, before, unitById), prefAfter: countPref(state, finalMap, unitById),
      withPref: units.filter(u => hasAnyPref(pmap.get(u.patientId))).length,
      hardBefore: countHard(state, before, unitById), hardAfter: countHard(state, finalMap, unitById),
      iterations: iter, seed: o.seed,
    };
    return { units: outUnits, diff, pending: pendingOut, score };
  }

  function countPref(state, map, unitById) {
    let n = 0;
    const pmap = patientMap(state.patients);
    for (const [id, s] of map) {
      const p = pmap.get(unitById.get(id).patientId);
      if (hasAnyPref(p) && availState(state.settings, p, s.day, s.hour).pref) n++;
    }
    return n;
  }

  function countHard(state, map, unitById) {
    const pmap = patientMap(state.patients);
    const sessions = [];
    for (const [id, s] of map) sessions.push({ id, patientId: unitById.get(id).patientId, day: s.day, hour: s.hour, parity: parityOf(pmap.get(unitById.get(id).patientId)) });
    let n = 0;
    for (const [id, s] of map) {
      if (!canPlace({ settings: state.settings, patients: pmap, sessions, ignoreIds: new Set([id]) }, unitById.get(id).patientId, s.day, s.hour).ok) n++;
    }
    return n;
  }

  function explainMove(state, p, from, to) {
    const settings = state.settings;
    if (!to) return 'Se queda sin hueco compatible.';
    const parts = [];
    if (!from) parts.push('Estaba sin hueco');
    else {
      const old = canPlace({ settings, patients: state.patients, sessions: [] }, p.id, from.day, from.hour);
      parts.push(old.ok ? `Libera ${DAY_SHORT[from.day]} ${fmtHour(from.hour)}` : old.reason);
    }
    const av = availState(settings, p, to.day, to.hour);
    parts.push(av.pref ? `${DAY_NAMES[to.day]} ${band(settings, to.hour) === 'm' ? 'mañana' : 'tarde'} es su preferencia` : `${DAY_NAMES[to.day]} ${fmtHour(to.hour)} está entre sus opciones`);
    return parts.join('. ') + '.';
  }

  function explainPending(state, p, map, unitById) {
    const settings = state.settings;
    const pmap = patientMap(state.patients);
    const okSlots = [];
    for (const day of settings.days) for (const hour of workingHours(settings)) {
      if (canPlace({ settings, patients: pmap, sessions: [] }, p.id, day, hour).ok) okSlots.push({ day, hour });
    }
    if (!okSlots.length) return 'No tiene ningún día ni franja marcados como posibles (o no cabe en tu horario).';
    const sessions = [];
    for (const [id, s] of map) sessions.push({ id, patientId: unitById.get(id).patientId, day: s.day, hour: s.hour, parity: parityOf(pmap.get(unitById.get(id).patientId)) });
    const blockers = new Set();
    for (const s of okSlots) {
      const v = canPlace({ settings, patients: pmap, sessions }, p.id, s.day, s.hour);
      for (const sid of v.occupiedBy) blockers.add((pmap.get(unitById.get(sid).patientId) || {}).alias || '?');
    }
    const days = [...new Set(okSlots.map(s => DAY_SHORT[s.day]))].join(', ');
    return `Solo puede ${days}; esas horas están ocupadas por ${[...blockers].slice(0, 4).join(', ')}${blockers.size > 4 ? '…' : ''}.`;
  }

  /** Aplica una propuesta a state.slots (muta). Devuelve el nº de cambios. */
  function applyProposal(state, proposal) {
    const byId = new Map(state.slots.map(s => [s.id, s]));
    let changes = 0;
    for (const u of proposal.units) {
      if (u.isNew) {
        if (u.to) { state.slots.push({ id: uid('s'), patientId: u.patientId, day: u.to.day, hour: u.to.hour }); changes++; }
        continue;
      }
      const s = byId.get(u.id);
      if (!s) continue;
      if (!u.to) { state.slots = state.slots.filter(x => x.id !== u.id); changes++; continue; }
      if (s.day !== u.to.day || s.hour !== u.to.hour) { s.day = u.to.day; s.hour = u.to.hour; changes++; }
    }
    return changes;
  }

  // ---------- semana concreta ----------
  /** Sesiones de una semana: plantilla filtrada por paridad + cambios solo de esa semana. */
  function weekSessions(state, weekId) {
    const pmap = patientMap(state.patients);
    const parity = weekParity(weekId, state.settings.weekAnchor);
    const wk = state.weeks[weekId] || {};
    const moves = wk.moves || {};
    const out = [];
    const seen = new Set();
    for (const s of state.slots) {
      const p = pmap.get(s.patientId);
      if (!p || p.activo === false || p.enEspera) continue;
      const par = parityOf(p);
      if (par !== 'AB' && par !== parity) continue;
      seen.add(s.id);
      if (Object.prototype.hasOwnProperty.call(moves, s.id)) {
        const m = moves[s.id];
        if (m === null) continue;
        out.push({ id: s.id, patientId: p.id, day: m.day, hour: m.hour, parity: 'AB', moved: true, dur: p.dur });
      } else out.push({ id: s.id, patientId: p.id, day: s.day, hour: s.hour, parity: 'AB', moved: false, dur: p.dur });
    }
    for (const id in moves) {
      const m = moves[id];
      if (seen.has(id) || m === null || !m.patientId) continue;
      const p = pmap.get(m.patientId);
      if (!p) continue;
      out.push({ id, patientId: p.id, day: m.day, hour: m.hour, parity: 'AB', moved: true, dur: p.dur, extra: true });
    }
    out.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.hour - b.hour);
    return out;
  }

  function weekReview(state, weekId) {
    const wk = state.weeks[weekId] || {};
    const saved = wk.sessions || {};
    const pmap = patientMap(state.patients);
    return weekSessions(state, weekId).map(s => {
      const p = pmap.get(s.patientId);
      const st = saved[s.id] || {};
      const closed = closedInfo(state.settings, toISODate(dateOfDay(weekId, s.day)));
      return {
        id: s.id, patientId: s.patientId, day: s.day, hour: s.hour, dur: s.dur,
        status: st.status || (closed ? 'cancelada' : 'realizada'),
        cobrar: st.cobrar ?? false,
        importe: st.importe ?? p.tarifa ?? 0,
        closed: closed ? closed.motivo || 'cerrado' : null,
      };
    });
  }

  function closeWeek(state, weekId, review, nowISO) {
    const wk = state.weeks[weekId] || (state.weeks[weekId] = { moves: {}, sessions: {} });
    wk.sessions = {};
    for (const r of review) wk.sessions[r.id] = { patientId: r.patientId, status: r.status, cobrar: !!r.cobrar, importe: round2(Number(r.importe) || 0), day: r.day, hour: r.hour };
    wk.ok = true;
    wk.closedAt = nowISO || new Date().toISOString();
    return wk;
  }

  // ---------- facturación ----------
  const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

  function fmtEuro(n) {
    try { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    catch (e) { return `${round2(n).toFixed(2).replace('.', ',')} €`; }
  }

  function invoicedKeys(state) {
    const set = new Set();
    for (const inv of state.invoices) if (inv.estado !== 'anulada') for (const k of inv.sesiones || []) set.add(k);
    return set;
  }

  /** Sesiones con OK, cobrables y aún sin factura. */
  function billableSessions(state) {
    const done = invoicedKeys(state);
    const pmap = patientMap(state.patients);
    const out = [];
    for (const weekId in state.weeks) {
      const wk = state.weeks[weekId];
      if (!wk.ok) continue;
      for (const sid in wk.sessions || {}) {
        const s = wk.sessions[sid];
        const billable = s.status === 'realizada' || (s.cobrar && s.status !== 'realizada');
        if (!billable || !(s.importe > 0)) continue;
        const key = `${weekId}:${sid}`;
        if (done.has(key)) continue;
        const p = pmap.get(s.patientId);
        if (!p) continue;
        const date = dateOfDay(weekId, s.day);
        out.push({ key, patientId: p.id, date, iso: toISODate(date), weekId, day: s.day, hour: s.hour, importe: s.importe, status: s.status, dur: p.dur });
      }
    }
    out.sort((a, b) => a.date - b.date);
    return out;
  }

  function invoiceTotals(lineas, ivaPct, retPct) {
    const base = round2(lineas.reduce((n, l) => n + (Number(l.importe) || 0), 0));
    const iva = round2(base * (Number(ivaPct) || 0) / 100);
    const retencion = round2(base * (Number(retPct) || 0) / 100);
    return { base, iva, retencion, total: round2(base + iva - retencion) };
  }

  function lineConcept(p, s) {
    const what = s.status === 'realizada' ? 'Sesión de psicología' : (s.status === 'novino' ? 'Sesión reservada no asistida' : 'Sesión cancelada con cargo');
    return `${what} · ${p.dur || 50} min`;
  }

  function invoiceKind(patient, total) {
    const b = patient.billing || {};
    if (b.nif && b.nombreFiscal) return { tipo: 'completa', warning: null };
    if (total <= SIMPLIFICADA_MAX) return { tipo: 'simplificada', warning: null };
    return { tipo: 'simplificada', warning: `Supera ${SIMPLIFICADA_MAX} €: hace falta nombre fiscal y NIF para una factura completa` };
  }

  /** Genera borradores (no muta). */
  function generateDrafts(state, opts = {}) {
    const pmap = patientMap(state.patients);
    const groups = new Map();
    for (const s of billableSessions(state)) {
      const p = pmap.get(s.patientId);
      const modo = (p.billing && p.billing.modo) || 'mensual';
      const periodo = s.iso.slice(0, 7);
      const key = modo === 'sesion' ? `${p.id}:${s.iso}` : `${p.id}:${periodo}`;
      if (!groups.has(key)) groups.set(key, { patientId: p.id, periodo, modo, sessions: [] });
      groups.get(key).sessions.push(s);
    }
    const drafts = [];
    for (const g of groups.values()) {
      const p = pmap.get(g.patientId);
      const lineas = g.sessions.map(s => ({ fecha: s.iso, concepto: lineConcept(p, s), importe: round2(s.importe) }));
      const retPct = Number((p.billing || {}).retencion) || 0;
      const t = invoiceTotals(lineas, state.settings.iva, retPct);
      const kind = invoiceKind(p, t.total);
      drafts.push({
        id: (opts.idGen || (() => uid('inv')))(),
        numero: null, fecha: null, estado: 'borrador', tipo: kind.tipo, aviso: kind.warning,
        patientId: p.id, periodo: g.periodo, modo: g.modo,
        lineas, ivaPct: state.settings.iva, retPct, ...t,
        sesiones: g.sessions.map(s => s.key),
        creada: opts.today || toISODate(new Date()),
      });
    }
    drafts.sort((a, b) => a.periodo.localeCompare(b.periodo) || ((pmap.get(a.patientId) || {}).alias || '').localeCompare((pmap.get(b.patientId) || {}).alias || ''));
    return drafts;
  }

  const nextNumero = (settings, rect) => rect ? `${settings.serieRect}-${String(settings.siguienteRect).padStart(3, '0')}` : `${settings.serie}-${String(settings.siguiente).padStart(3, '0')}`;

  /** Emite: congela emisor, cliente, textos y totales; asigna número correlativo. */
  function issueInvoice(state, invoiceId, today) {
    const inv = state.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Factura no encontrada');
    if (inv.estado !== 'borrador') throw new Error('Solo se emiten borradores');
    if (!inv.lineas.length) throw new Error('La factura no tiene líneas');
    const p = patientMap(state.patients).get(inv.patientId) || {};
    const b = p.billing || {};
    const t = invoiceTotals(inv.lineas, inv.ivaPct ?? state.settings.iva, inv.retPct || 0);
    const kind = invoiceKind(p, t.total);
    const rect = !!inv.rectificaDe;
    const numero = nextNumero(state.settings, rect);
    Object.assign(inv, t, {
      numero, fecha: today || toISODate(new Date()), estado: 'emitida', tipo: kind.tipo, aviso: null,
      emisor: Object.assign({}, state.settings.emisor),
      cliente: { nombre: b.nombreFiscal || p.nombre || p.alias || '', nif: b.nif || '', direccion: b.direccion || '', email: b.email || '' },
      textoExencion: (inv.ivaPct ?? state.settings.iva) === 0 ? state.settings.textoExencion : '',
      formaPago: state.settings.formaPago,
      vencimientoDias: state.settings.vencimientoDias || 0,
    });
    if (rect) state.settings.siguienteRect += 1; else state.settings.siguiente += 1;
    return inv;
  }

  /** Crea un borrador de rectificativa por anulación total de una emitida (no muta). */
  function rectifyDraft(state, invoiceId, causa, opts = {}) {
    const orig = state.invoices.find(i => i.id === invoiceId);
    if (!orig || orig.estado === 'borrador') throw new Error('Solo se rectifican facturas emitidas');
    if (state.invoices.some(i => i.rectificaDe === orig.id && i.estado !== 'anulada')) throw new Error('Esta factura ya tiene rectificativa');
    const lineas = orig.lineas.map(l => ({ fecha: l.fecha, concepto: `Anulación: ${l.concepto}`, importe: -Math.abs(l.importe) }));
    const t = invoiceTotals(lineas, orig.ivaPct || 0, orig.retPct || 0);
    return {
      id: (opts.idGen || (() => uid('inv')))(),
      numero: null, fecha: null, estado: 'borrador', tipo: orig.tipo, aviso: null,
      patientId: orig.patientId, periodo: orig.periodo, modo: orig.modo,
      lineas, ivaPct: orig.ivaPct || 0, retPct: orig.retPct || 0, ...t,
      sesiones: [],
      rectificaDe: orig.id, rectificaNumero: orig.numero, causa: causa || 'Anulación de la factura original',
      creada: opts.today || toISODate(new Date()),
    };
  }

  function csvMonth(state, periodo) {
    const pmap = patientMap(state.patients);
    const sep = ';';
    const dec = n => round2(n).toFixed(2).replace('.', ',');
    const rows = [['Número', 'Fecha', 'Tipo', 'Cliente', 'NIF', 'Periodo', 'Sesiones', 'Base', 'IVA %', 'Cuota IVA', 'Retención %', 'Retención', 'Total', 'Estado', 'Rectifica a'].join(sep)];
    const list = state.invoices.filter(i => i.estado !== 'borrador' && (i.fecha || '').startsWith(periodo)).sort((a, b) => (a.numero || '').localeCompare(b.numero || ''));
    for (const i of list) {
      const p = pmap.get(i.patientId) || {};
      const c = i.cliente || {};
      rows.push([i.numero, fmtDate(fromISODate(i.fecha)), i.rectificaDe ? 'rectificativa' : (i.tipo || 'completa'), csvCell(c.nombre || p.alias || ''), csvCell(c.nif || ''), i.periodo, i.lineas.length, dec(i.base), i.ivaPct ?? 0, dec(i.iva), i.retPct || 0, dec(i.retencion || 0), dec(i.total), i.estado, i.rectificaNumero || ''].join(sep));
    }
    return rows.join('\r\n');
  }

  const csvCell = s => /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;


  // ---------- lista de espera ----------
  const PRIORITY = { urgente: 0, continuidad: 1, normal: 2 };
  /** Pacientes en espera que podrían ocupar (day, hour) esta semana, por prioridad. */
  function suggestForSlot(state, weekSessions_, day, hour) {
    const pmap = patientMap(state.patients);
    const out = [];
    for (const p of state.patients) {
      if (!p.enEspera || p.activo === false) continue;
      const v = canPlace({ settings: state.settings, patients: pmap, sessions: weekSessions_ }, p.id, day, hour, 'AB');
      if (v.ok) out.push({ patient: p, pref: v.pref });
    }
    out.sort((a, b) => (PRIORITY[a.patient.prioridad] ?? 2) - (PRIORITY[b.patient.prioridad] ?? 2) || (b.pref - a.pref) || (a.patient.alias || '').localeCompare(b.patient.alias || ''));
    return out;
  }

  // ---------- calendario ICS anonimizado ----------
  function icsExport(state, fromWeekId, weeks = 8) {
    const pad = n => String(n).padStart(2, '0');
    const stamp = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cuadrante de consulta//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Consulta'];
    let w = fromWeekId;
    for (let i = 0; i < weeks; i++) {
      for (const s of weekSessions(state, w)) {
        const p = patientMap(state.patients).get(s.patientId);
        const start = dateOfDay(w, s.day); start.setHours(s.hour, 0, 0, 0);
        const end = new Date(start.getTime() + (p.dur || state.settings.sessionMin) * 60000);
        lines.push('BEGIN:VEVENT', `UID:${w}-${s.id}@cuadrante`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:Sesión${p.modalidad === 'online' ? ' (online)' : ''}`, 'END:VEVENT');
      }
      w = shiftWeek(w, 1);
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  // ---------- CSV con las columnas del libro registro de facturas expedidas (AEAT) ----------
  function csvAEAT(state, year) {
    const sep = ';';
    const dec = n => round2(n).toFixed(2).replace('.', ',');
    const head = ['Fecha Expedición', 'Fecha Operación', 'Serie', 'Número', 'NIF Destinatario', 'Nombre Destinatario', 'Clave de Operación', 'Calificación de la Operación', 'Operación Exenta', 'Tipo IVA', 'Base Imponible', 'Cuota IVA', 'Total Factura', 'Ingreso Computable', 'Tipo Retención', 'Importe Retención', 'Rectificativa de'];
    const rows = [head.join(sep)];
    const list = state.invoices.filter(i => i.estado !== 'borrador' && (i.fecha || '').startsWith(String(year))).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.numero || '').localeCompare(b.numero || ''));
    for (const i of list) {
      const c = i.cliente || {};
      const [serie, num] = splitNumero(i.numero || '');
      const lastOp = i.lineas.map(l => l.fecha).sort().slice(-1)[0] || i.fecha;
      const exenta = (i.ivaPct || 0) === 0;
      rows.push([fmtDate(fromISODate(i.fecha)), fmtDate(fromISODate(lastOp)), serie, num, csvCell(c.nif || ''), csvCell(c.nombre || ''), '01', exenta ? 'S1' : 'S1', exenta ? 'E1' : '', exenta ? '' : String(i.ivaPct), dec(i.base), dec(i.iva || 0), dec(i.total), dec(i.base), i.retPct ? String(i.retPct) : '', dec(i.retencion || 0), i.rectificaNumero || ''].join(sep));
    }
    return rows.join('\r\n');
  }
  function splitNumero(numero) {
    const m = numero.match(/^(.*)-(\d+)$/);
    return m ? [m[1], String(Number(m[2]))] : ['', numero];
  }

  // ---------- PDF mínimo (Helvetica, WinAnsi) sin librerías ----------
  const WINANSI = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '·': 0xB7 };
  function toWinAnsi(str) {
    let out = '';
    for (const ch of String(str)) {
      const code = ch.codePointAt(0);
      let b;
      if (code < 128) b = code;
      else if (WINANSI[ch] !== undefined) b = WINANSI[ch];
      else if (code >= 0xA0 && code <= 0xFF) b = code;
      else b = 0x3F;
      out += String.fromCharCode(b);
    }
    return out.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, ' ');
  }
  // anchos aproximados de Helvetica (por 1000 unidades) para ajustar texto
  const HELV_W = { ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778, 'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778, 'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667, 'Y': 667, 'Z': 611, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556, '`': 333, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556, 'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556, 'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722, 'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584 };
  function textWidth(str, size) {
    let w = 0;
    for (const ch of String(str)) w += HELV_W[ch] ?? 556;
    return w * size / 1000;
  }
  function wrapText(str, size, maxWidth) {
    const words = String(str).split(/\s+/), lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (textWidth(t, size) <= maxWidth || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /** Construye un PDF A4 a partir de "ops": [{t:'text', x, y, s, size, bold, align:'l'|'r'}, {t:'line', x1,y1,x2,y2,w}, {t:'rect', x,y,w,h}]. Coordenadas en puntos desde arriba-izquierda. */
  function buildPdf(pages) {
    const W = 595.28, H = 841.89;
    const objs = [];
    const add = body => { objs.push(body); return objs.length; };
    const fontR = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontB = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageIds = [];
    const pagesId = objs.length + 1 + pages.length * 2; // se calcula al final; placeholder
    const contentIds = [];
    for (const ops of pages) {
      let c = '';
      for (const o of ops) {
        if (o.t === 'text') {
          const size = o.size || 10;
          let x = o.x;
          if (o.align === 'r') x = o.x - textWidth(o.s, size);
          if (o.align === 'c') x = o.x - textWidth(o.s, size) / 2;
          const g = o.gray != null ? `${o.gray} g ` : '0 g ';
          c += `BT ${g}/${o.bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${(H - o.y).toFixed(2)} Td (${toWinAnsi(o.s)}) Tj ET\n`;
        } else if (o.t === 'line') {
          c += `${(o.gray ?? 0)} G ${o.w || 0.6} w ${o.x1.toFixed(2)} ${(H - o.y1).toFixed(2)} m ${o.x2.toFixed(2)} ${(H - o.y2).toFixed(2)} l S\n`;
        } else if (o.t === 'rect') {
          c += `${(o.gray ?? 0)} G 0.6 w ${o.x.toFixed(2)} ${(H - o.y - o.h).toFixed(2)} ${o.w.toFixed(2)} ${o.h.toFixed(2)} re S\n`;
        }
      }
      contentIds.push(add(`<< /Length ${c.length} >>\nstream\n${c}endstream`));
    }
    // páginas
    const pagesObj = objs.length + 1 + pages.length; // id del objeto Pages
    for (let i = 0; i < pages.length; i++) {
      pageIds.push(add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontR} 0 R /F2 ${fontB} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`));
    }
    const realPages = add(`<< /Type /Pages /Kids [${pageIds.map(id => id + ' 0 R').join(' ')}] /Count ${pages.length} >>`);
    const catalog = add(`<< /Type /Catalog /Pages ${realPages} 0 R >>`);
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];
    objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return out;
  }

  /** PDF de una factura (mismo contenido que la vista imprimible). Devuelve string binario (latin1). */
  function pdfInvoice(inv, ctx) {
    const st = ctx.settings, p = ctx.patient || {}, b = p.billing || {};
    const em = inv.emisor || st.emisor;
    const cl = inv.cliente || { nombre: b.nombreFiscal || p.nombre || p.alias || '', nif: b.nif || '', direccion: b.direccion || '' };
    const t = invoiceTotals(inv.lineas, inv.ivaPct || 0, inv.retPct || 0);
    const exento = (inv.ivaPct || 0) === 0;
    const texto = inv.textoExencion ?? (exento ? st.textoExencion : '');
    const pago = inv.formaPago ?? st.formaPago;
    const venc = inv.vencimientoDias ?? st.vencimientoDias;
    const tipo = inv.rectificaDe ? 'Factura rectificativa' : (inv.tipo === 'simplificada' ? 'Factura simplificada' : 'Factura');
    const L = 56, R = 595.28 - 56, G = 0.4;
    const pages = []; let ops = []; let y = 64;
    const text = (s, x, opt = {}) => ops.push({ t: 'text', s, x, y: opt.y ?? y, size: opt.size || 10, bold: !!opt.bold, align: opt.align || 'l', gray: opt.gray });
    const line = (y1, gray = 0.75) => ops.push({ t: 'line', x1: L, y1, x2: R, y2: y1, gray });
    // cabecera
    text(em.nombre || '[Tu nombre]', L, { size: 18, bold: true }); y += 20;
    const emLines = [[em.colegiado ? `Colegiado/a n.º ${em.colegiado}` : '', em.registro ? `Registro sanitario ${em.registro}` : ''].filter(Boolean).join(' · '), `NIF ${em.nif || '[NIF]'} · ${em.direccion || '[Dirección]'}`, [em.email, em.telefono].filter(Boolean).join(' · ')].filter(Boolean);
    for (const l of emLines) { text(l, L, { gray: G, size: 9.5 }); y += 13; }
    text(tipo.toUpperCase(), R, { y: 64, align: 'r', size: 8.5, gray: G });
    text(inv.numero || 'BORRADOR', R, { y: 84, align: 'r', size: 16, bold: true });
    text(`Fecha de expedición ${inv.fecha ? fmtDate(fromISODate(inv.fecha)) : '[al emitir]'}`, R, { y: 100, align: 'r', size: 9.5, gray: G });
    let yr = 113;
    if (inv.modo !== 'sesion') { text(`Periodo ${periodoLabel(inv.periodo)}`, R, { y: yr, align: 'r', size: 9.5, gray: G }); yr += 13; }
    if (inv.rectificaDe) { text(`Rectifica la factura ${inv.rectificaNumero}`, R, { y: yr, align: 'r', size: 9.5, gray: G }); yr += 13; }
    y = Math.max(y, yr) + 18;
    // cliente
    if (!(inv.tipo === 'simplificada' && !cl.nif)) {
      ops.push({ t: 'rect', x: L, y: y - 4, w: R - L, h: 48, gray: 0.8 });
      text('CLIENTE', L + 12, { y: y + 10, size: 8, gray: G });
      text(cl.nombre || '[Nombre]', L + 12, { y: y + 24, size: 11, bold: true });
      text([cl.nif ? `NIF ${cl.nif}` : '', cl.direccion || ''].filter(Boolean).join(' · '), L + 12, { y: y + 37, size: 9.5, gray: G });
      y += 64;
    }
    if (inv.rectificaDe) { text(`Causa: ${inv.causa || ''}`, L, { size: 9.5, gray: G }); y += 16; }
    // líneas
    const colImp = R, colDate = L, colCon = L + 80;
    const header = () => { text('FECHA', colDate, { size: 8, gray: G }); text('CONCEPTO', colCon, { size: 8, gray: G }); text('IMPORTE', colImp, { size: 8, gray: G, align: 'r' }); y += 6; line(y, 0); y += 14; };
    header();
    for (const l of inv.lineas) {
      if (y > 760) { pages.push(ops); ops = []; y = 64; header(); }
      const wrapped = wrapText(l.concepto, 10, colImp - 90 - colCon);
      text(fmtDate(fromISODate(l.fecha)), colDate, {});
      text(fmtEuro(l.importe), colImp, { align: 'r' });
      wrapped.forEach((w, i) => text(w, colCon, { y: y + i * 12 }));
      y += Math.max(1, wrapped.length) * 12 + 4;
      line(y - 10, 0.85);
    }
    y += 10;
    if (y > 700) { pages.push(ops); ops = []; y = 64; }
    const tx = R - 220;
    const tot = (label, val, opt = {}) => { text(label, tx, { gray: opt.bold ? 0 : G, size: opt.bold ? 12 : 10, bold: !!opt.bold }); text(val, R, { align: 'r', size: opt.bold ? 12 : 10, bold: !!opt.bold }); y += opt.bold ? 18 : 15; };
    tot('Base imponible', fmtEuro(t.base));
    tot(exento ? 'IVA' : `IVA ${inv.ivaPct} %`, exento ? 'Exenta' : fmtEuro(t.iva));
    if (inv.retPct) tot(`Retención IRPF ${inv.retPct} %`, `-${fmtEuro(t.retencion)}`);
    ops.push({ t: 'line', x1: tx, y1: y - 6, x2: R, y2: y - 6, gray: 0 }); y += 6;
    tot('Total', fmtEuro(t.total), { bold: true });
    // pie
    let fy = 841.89 - 56 - 60;
    const foot = [texto, `Forma de pago: ${pago}${venc ? ` · Vencimiento: ${venc} días desde la expedición` : ' · Vencimiento: a la recepción'}.`, 'Sus datos se tratan con la única finalidad de emitir esta factura y cumplir las obligaciones fiscales.'].filter(Boolean);
    const footLines = foot.flatMap(f => wrapText(f, 8.5, R - L));
    fy = 841.89 - 56 - footLines.length * 11;
    ops.push({ t: 'line', x1: L, y1: fy - 10, x2: R, y2: fy - 10, gray: 0.85 });
    for (const f of footLines) { text(f, L, { y: fy, size: 8.5, gray: G }); fy += 11; }
    pages.push(ops);
    return buildPdf(pages);
  }

  // ---------- migración ----------
  function migrate(doc) {
    if (!doc || typeof doc !== 'object' || !('patients' in doc)) throw new Error('Fichero no reconocido');
    if (doc.v > SCHEMA_VERSION) throw new Error(`Este fichero es de una versión más nueva (${doc.v}) que la app (${SCHEMA_VERSION})`);
    const out = defaultState();
    out.settings = Object.assign(defaultSettings(), doc.settings || {});
    out.settings.emisor = Object.assign(defaultSettings().emisor, (doc.settings || {}).emisor || {});
    out.settings.office = Object.assign(defaultOffice(), (doc.settings || {}).office || {});
    out.patients = (doc.patients || []).map(p => Object.assign({ activo: true, fixed: false, notas: '', modalidad: 'presencial', freq: 'semanal', sesiones: 1, enEspera: false, prioridad: 'normal' }, p, {
      avail: Object.assign(emptyAvail(out.settings.days), p.avail || {}),
      billing: Object.assign({ nombreFiscal: '', nif: '', direccion: '', email: '', modo: 'mensual', retencion: 0 }, p.billing || {}),
    }));
    out.slots = (doc.slots || []).map(s => Object.assign({ id: uid('s') }, s));
    out.weeks = doc.weeks || {};
    out.invoices = doc.invoices || [];
    return out;
  }

  return {
    DAYS, DAY_NAMES, DAY_SHORT, MONTHS, COLORS, COLOR_KEYS, SCHEMA_VERSION, WEIGHTS, SIMPLIFICADA_MAX,
    defaultState, defaultSettings, defaultOffice, newPatient, emptyAvail, uid,
    toISODate, fromISODate, fmtDate, fmtHour, addDays, mondayOf, isoWeekId, weekIdToMonday, shiftWeek, dateOfDay, weekParity, weekLabel, periodoLabel, workingHours, isWorkingHour, band, closedInfo,
    parityOf, paritiesOverlap, span, availState, canPlace, validSlots, templateSessions, patientMap, hasAnyPref, easterSunday, spanishHolidays,
    suggestForSlot, icsExport, csvAEAT, pdfInvoice, buildPdf, wrapText, textWidth,
    propose, applyProposal, weekSessions, weekReview, closeWeek,
    billableSessions, generateDrafts, issueInvoice, rectifyDraft, invoiceTotals, invoiceKind, nextNumero, csvMonth, fmtEuro, round2,
    migrate,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Core;
