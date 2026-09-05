// Pruebas del núcleo: node app/tests.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const Core = require('./src/core.js');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e) { failed++; console.log(`FAIL  ${name}\n      ${e.message}`); }
}

function fixture() {
  const st = Core.defaultState();
  st.settings.weekAnchor = '2026-09-07';
  const mk = (alias, extra) => { const p = Core.newPatient(st, { alias, ...extra }); st.patients.push(p); return p; };
  const noDay = (p, d, motivo) => { p.avail[d].m = 0; p.avail[d].t = 0; p.avail[d].motivo = motivo || ''; };
  const pref = (p, d, b) => { p.avail[d][b] = 2; };

  const marta = mk('Marta R.');
  const jorge = mk('Jorge L.', { freq: 'quincenalA' });
  const irene = mk('Irene G.', { freq: 'quincenalB' });
  const lucia = mk('Lucía P.');
  noDay(lucia, 'M', 'turno de tarde'); pref(lucia, 'J', 't'); pref(lucia, 'L', 't'); pref(lucia, 'X', 't');
  const andres = mk('Andrés M.', { fixed: true });
  const hugo = mk('Hugo F.');
  noDay(hugo, 'X', 'cuida a su madre');
  const pareja = mk('Carla y Dani', { dur: 90, tarifa: 80 });
  st.slots.push(
    { id: 's_marta', patientId: marta.id, day: 'L', hour: 10 },
    { id: 's_jorge', patientId: jorge.id, day: 'M', hour: 17 },
    { id: 's_irene', patientId: irene.id, day: 'M', hour: 17 },
    { id: 's_lucia', patientId: lucia.id, day: 'X', hour: 16 },
    { id: 's_andres', patientId: andres.id, day: 'L', hour: 17 },
    { id: 's_hugo', patientId: hugo.id, day: 'X', hour: 18 },   // conflicto: no puede miércoles
    { id: 's_pareja', patientId: pareja.id, day: 'J', hour: 18 },
  );
  return { st, marta, jorge, irene, lucia, andres, hugo, pareja };
}

await test('calendario: semana ISO, lunes y paridad', () => {
  assert.equal(Core.isoWeekId(new Date(2026, 8, 9)), '2026-W37');
  assert.equal(Core.toISODate(Core.weekIdToMonday('2026-W37')), '2026-09-07');
  assert.equal(Core.isoWeekId(new Date(2027, 0, 1)), '2026-W53');
  assert.equal(Core.toISODate(Core.weekIdToMonday('2026-W53')), '2026-12-28');
  assert.equal(Core.weekParity('2026-W37', '2026-09-07'), 'A');
  assert.equal(Core.weekParity('2026-W38', '2026-09-07'), 'B');
  assert.equal(Core.weekParity('2026-W35', '2026-09-07'), 'A');
  assert.equal(Core.shiftWeek('2026-W37', 1), '2026-W38');
  assert.equal(Core.toISODate(Core.dateOfDay('2026-W37', 'J')), '2026-09-10');
});

await test('horario de trabajo excluye descansos', () => {
  const s = Core.defaultSettings();
  assert.deepEqual(Core.workingHours(s), [9, 10, 11, 12, 13, 16, 17, 18, 19]);
  assert.equal(Core.band(s, 13), 'm');
  assert.equal(Core.band(s, 16), 't');
});

await test('canPlace: reglas duras con motivo', () => {
  const { st, lucia, jorge, irene, marta, pareja } = fixture();
  const ctx = { settings: st.settings, patients: st.patients, sessions: Core.templateSessions(st) };
  let v = Core.canPlace(ctx, lucia.id, 'M', 17);
  assert.equal(v.ok, false); assert.match(v.reason, /Martes: no puede — turno de tarde/);
  v = Core.canPlace(ctx, lucia.id, 'L', 10);
  assert.equal(v.ok, false); assert.match(v.reason, /Ocupado por Marta R\./);
  v = Core.canPlace(ctx, lucia.id, 'L', 14);
  assert.equal(v.ok, false); assert.match(v.reason, /Fuera de tu horario/);
  v = Core.canPlace(ctx, lucia.id, 'J', 17);
  assert.equal(v.ok, true); assert.equal(v.pref, true);
  // quincenales de paridad opuesta comparten hueco; un semanal no cabe ahí
  v = Core.canPlace(ctx, marta.id, 'M', 17);
  assert.equal(v.ok, false); assert.match(v.reason, /Ocupado por Jorge L\. y Irene G\./);
  const ctx2 = { settings: st.settings, patients: st.patients, sessions: Core.templateSessions(st).filter(s => s.id !== 's_irene') };
  v = Core.canPlace(ctx2, irene.id, 'M', 17);
  assert.equal(v.ok, true, 'Irene (B) puede compartir con Jorge (A)');
  // sesión de 90 min ocupa dos huecos y no cabe antes del descanso
  v = Core.canPlace(ctx, pareja.id, 'L', 13);
  assert.equal(v.ok, false); assert.match(v.reason, /no cabe/);
  v = Core.canPlace(ctx, marta.id, 'J', 19);
  assert.equal(v.ok, false, 'la pareja de 18–20 ocupa las 19'); assert.match(v.reason, /Carla y Dani/);
});

await test('canPlace: sin despacho para presencial, ignorar mi propia sesión, máximo por día', () => {
  const { st, lucia, marta } = fixture();
  st.settings.office.V = { m: true, t: false };
  const ctx = { settings: st.settings, patients: st.patients, sessions: Core.templateSessions(st) };
  let v = Core.canPlace(ctx, lucia.id, 'V', 17);
  assert.equal(v.ok, false); assert.match(v.reason, /sin despacho/);
  lucia.modalidad = 'online';
  v = Core.canPlace(ctx, lucia.id, 'V', 17);
  assert.equal(v.ok, true);
  // moverse a su propio hueco: hay que ignorar su sesión
  const ctx2 = { settings: st.settings, patients: st.patients, sessions: Core.templateSessions(st), ignoreIds: new Set(['s_marta']) };
  assert.equal(Core.canPlace(ctx2, marta.id, 'L', 10).ok, true);
  st.settings.maxPerDay = 1;
  const ctx3 = { settings: st.settings, patients: st.patients, sessions: Core.templateSessions(st) };
  v = Core.canPlace(ctx3, lucia.id, 'L', 11);
  assert.equal(v.ok, false); assert.match(v.reason, /Ya tienes 1 sesiones/);
});

await test('solver: resuelve conflictos, respeta fijos, coloca a los sin hueco y es determinista', () => {
  const { st, hugo, andres, lucia } = fixture();
  const nerea = Core.newPatient(st, { alias: 'Nerea O.' }); nerea.avail.M.m = 0; nerea.avail.M.t = 0;
  for (const d of ['L', 'X', 'J', 'V']) nerea.avail[d].m = 0; // solo tardes
  st.patients.push(nerea);
  const r1 = Core.propose(st, { seed: 1, now: () => 0 });
  const r2 = Core.propose(st, { seed: 1, now: () => 0 });
  assert.deepEqual(r1.units, r2.units, 'misma semilla → mismo resultado');
  assert.equal(r1.score.hardAfter, 0, 'sin violaciones duras');
  assert.equal(r1.pending.length, 0, 'todos colocados: ' + JSON.stringify(r1.pending));
  const hu = r1.units.find(u => u.patientId === hugo.id);
  assert.notEqual(hu.to.day, 'X', 'Hugo sale del miércoles');
  const an = r1.units.find(u => u.patientId === andres.id);
  assert.deepEqual(an.to, { day: 'L', hour: 17 }, 'Andrés (fijo) no se mueve');
  const ne = r1.units.find(u => u.patientId === nerea.id);
  assert.ok(ne.isNew && ne.to && ne.to.hour >= 16, 'Nerea colocada por la tarde');
  const lu = r1.units.find(u => u.patientId === lucia.id);
  assert.ok(Core.availState(st.settings, lucia, lu.to.day, lu.to.hour).pref, 'Lucía en franja preferida');
  assert.ok(r1.diff.every(d => typeof d.reason === 'string' && d.reason.length > 5));
  const changes = Core.applyProposal(st, r1);
  assert.ok(changes >= 2);
  assert.ok(st.slots.some(s => s.patientId === nerea.id));
  const after = Core.propose(st, { seed: 1, now: () => 0 });
  assert.equal(after.diff.length, 0, 'tras aplicar, una nueva propuesta no cambia nada');
});

await test('solver: explica por qué alguien queda pendiente', () => {
  const st = Core.defaultState();
  st.settings.hours = { start: 17, end: 18, breaks: [] };
  st.settings.days = ['L'];
  const a = Core.newPatient(st, { alias: 'A' }); const b = Core.newPatient(st, { alias: 'B' });
  st.patients.push(a, b);
  st.slots.push({ id: 'sa', patientId: a.id, day: 'L', hour: 17 });
  const r = Core.propose(st, { seed: 3, now: () => 0 });
  assert.equal(r.pending.length, 1);
  assert.match(r.pending[0].reason, /Solo puede Lun; esas horas están ocupadas por A/);
});

await test('semana concreta: paridad, cambios solo esa semana y sesiones extra', () => {
  const { st, jorge, irene, lucia, marta } = fixture();
  let ws = Core.weekSessions(st, '2026-W37'); // semana A
  assert.ok(ws.some(s => s.patientId === jorge.id) && !ws.some(s => s.patientId === irene.id));
  ws = Core.weekSessions(st, '2026-W38'); // semana B
  assert.ok(!ws.some(s => s.patientId === jorge.id) && ws.some(s => s.patientId === irene.id));
  st.weeks['2026-W37'] = { moves: { s_lucia: { day: 'J', hour: 17 }, s_marta: null, x1: { patientId: irene.id, day: 'V', hour: 11 } }, sessions: {} };
  ws = Core.weekSessions(st, '2026-W37');
  const lu = ws.find(s => s.patientId === lucia.id);
  assert.deepEqual([lu.day, lu.hour, lu.moved], ['J', 17, true]);
  assert.ok(!ws.some(s => s.patientId === marta.id), 'Marta no viene esta semana');
  assert.ok(ws.some(s => s.id === 'x1' && s.extra), 'Irene añadida solo esta semana');
  assert.equal(Core.weekSessions(st, '2026-W39').find(s => s.patientId === lucia.id).day, 'X', 'la plantilla no cambia');
});

await test('cierre de semana y facturación: borradores, emisión, numeración, snapshot, CSV', () => {
  const { st, marta, lucia, pareja } = fixture();
  marta.billing = { nombreFiscal: 'Marta Ruiz', nif: '12345678Z', direccion: 'C/ Mayor 1', modo: 'mensual', retencion: 0 };
  pareja.billing.modo = 'sesion';
  st.settings.emisor.nombre = 'Psicóloga Ejemplo';
  const rev = Core.weekReview(st, '2026-W37');
  assert.ok(rev.every(r => r.status === 'realizada'));
  const hugo = rev.find(r => r.patientId === st.patients.find(p => p.alias === 'Hugo F.').id);
  hugo.status = 'novino'; hugo.cobrar = true;
  const luc = rev.find(r => r.patientId === lucia.id); luc.status = 'cancelada';
  Core.closeWeek(st, '2026-W37', rev, '2026-09-11T20:00:00Z');
  const rev2 = Core.weekReview(st, '2026-W38');
  Core.closeWeek(st, '2026-W38', rev2, '2026-09-18T20:00:00Z');
  const billable = Core.billableSessions(st);
  assert.ok(!billable.some(b => b.patientId === lucia.id && b.weekId === '2026-W37'), 'cancelada sin cobro no se factura');
  assert.ok(billable.some(b => b.patientId === lucia.id && b.weekId === '2026-W38'), 'la semana siguiente sí');
  assert.ok(billable.some(b => b.patientId === hugo.patientId && b.status === 'novino'), 'no vino con cobro sí');
  let n = 0;
  const drafts = Core.generateDrafts(st, { idGen: () => `inv${++n}`, today: '2026-09-30' });
  const dm = drafts.find(d => d.patientId === marta.id);
  assert.equal(dm.lineas.length, 2, 'Marta: dos sesiones del mes en una factura');
  assert.equal(dm.tipo, 'completa');
  assert.equal(dm.total, 120);
  const dp = drafts.filter(d => d.patientId === pareja.id);
  assert.equal(dp.length, 2, 'pareja: una factura por sesión');
  assert.equal(dp[0].tipo, 'simplificada');
  st.invoices.push(...drafts);
  assert.equal(Core.generateDrafts(st).length, 0, 'nada queda sin facturar');
  const before = st.settings.siguiente;
  const issued = Core.issueInvoice(st, dm.id, '2026-09-30');
  assert.equal(issued.numero, `F-${new Date().getFullYear()}-${String(before).padStart(3, '0')}`);
  assert.equal(st.settings.siguiente, before + 1);
  assert.equal(issued.cliente.nif, '12345678Z');
  assert.equal(issued.emisor.nombre, 'Psicóloga Ejemplo');
  assert.match(issued.textoExencion, /20\.Uno\.3/);
  st.settings.emisor.nombre = 'Otro nombre';
  assert.equal(issued.emisor.nombre, 'Psicóloga Ejemplo', 'la emitida no cambia al cambiar ajustes');
  assert.throws(() => Core.issueInvoice(st, dm.id), /Solo se emiten borradores/);
  const csv = Core.csvMonth(st, '2026-09');
  assert.equal(csv.split('\r\n').length, 2);
  assert.match(csv, /Marta Ruiz;12345678Z;2026-09;2;120,00;0;0,00;0;0,00;120,00;emitida/);
  const rect = Core.rectifyDraft(st, dm.id, 'Error en el importe', { idGen: () => 'r1', today: '2026-10-01' });
  assert.equal(rect.total, -120);
  st.invoices.push(rect);
  const ri = Core.issueInvoice(st, 'r1', '2026-10-01');
  assert.match(ri.numero, /^R-\d{4}-001$/);
  assert.throws(() => Core.rectifyDraft(st, dm.id), /ya tiene rectificativa/);
});

await test('retención IRPF y IVA 21 %', () => {
  const t = Core.invoiceTotals([{ importe: 100 }, { importe: 50 }], 21, 15);
  assert.deepEqual(t, { base: 150, iva: 31.5, retencion: 22.5, total: 159 });
  assert.equal(Core.fmtEuro(1234.5).replace(/ /g, ' '), '1234,50 €');
});

await test('migración: rellena huecos y rechaza versiones futuras', () => {
  const doc = { v: 1, patients: [{ id: 'p1', alias: 'X', avail: { L: { m: 0, t: 2 } } }], slots: [{ patientId: 'p1', day: 'L', hour: 17 }] };
  const st = Core.migrate(doc);
  assert.equal(st.patients[0].avail.M.m, 1);
  assert.equal(st.patients[0].avail.L.t, 2);
  assert.ok(st.slots[0].id, 'los huecos reciben id');
  assert.equal(st.patients[0].billing.modo, 'mensual');
  assert.throws(() => Core.migrate({ v: 99, patients: [] }), /versión más nueva/);
  assert.throws(() => Core.migrate({ foo: 1 }), /no reconocido/);
});

console.log(`\n${passed} ok, ${failed} fallos`);
process.exit(failed ? 1 : 0);
