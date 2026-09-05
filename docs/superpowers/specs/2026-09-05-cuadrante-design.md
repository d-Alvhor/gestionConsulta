# Cuadrante de consulta — diseño

**Fecha:** 2026-09-05 · **Estado:** propuesto (construido bajo supuestos explícitos; revisar y corregir)
**Canvas de diseño:** https://claude.ai/code/artifact/189459db-cab8-4937-8d13-686ef99dbb9a

## 1. Qué es y para quién

Una app web de un solo fichero para que un/a psicólogo/a autónomo/a lleve el **cuadrante semanal** de sus pacientes:

- Ver la semana (escritorio) o el día (móvil) con cada paciente como una **caja arrastrable**.
- Mantener una **mini base de datos de pacientes** con qué días/franjas pueden, no pueden o prefieren, los motivos y notas.
- Pulsar **Recolocar** para que el programa proponga un cuadrante que respete esas restricciones, y aplicarlo o no.
- **Dar el OK a la semana** (qué sesiones se hicieron) y **generar las facturas** de cada paciente a partir de eso.
- Entrar desde cualquier dispositivo (URL), con los datos guardados en el propio dispositivo y copia de seguridad exportable.

Fuera de alcance en v1: varios terapeutas o salas, reserva online, recordatorios automáticos, historia clínica, sincronización automática entre dispositivos, envío de facturas a Verifactu/AEAT.

## 2. Decisiones y alternativas

| Decisión | Elegido | Descartado y por qué |
|---|---|---|
| Arquitectura | **Un solo `.html`** (HTML+CSS+JS vanilla, sin build, sin dependencias). Se abre en local, se sube a cualquier hosting estático o se publica como Artifact. | SPA con framework + backend: más piezas que mantener para una sola persona. Artifact con `db` en servidor: mete datos de salud en un tercero sin contrato de encargado. |
| Rejilla | **Franjas discretas** = duración de sesión + descanso (por defecto 60 min = 50 + 10), L–V (+sábado opcional), horario de trabajo con descansos pintados. | Calendario continuo de 15/30 min: produce "citas a las 16:20" y complica el drag y el solver (hallazgo de la investigación: queja nº 1 en Jane/iPad). |
| Arrastrar | **Pointer Events propios** con asa de arrastre (`touch-action: none` en el asa, `pan-y` en la rejilla), clon fantasma, `elementFromPoint`, **intercambio** al soltar sobre una caja si ambos caben en el hueco del otro, y **"Mover a…"** como vía sin arrastre (móvil/teclado). | HTML5 DnD nativo (no funciona con el dedo en iOS). SortableJS/FullCalendar/dnd-kit: bundle y modelo de calendario continuo que no necesitamos. Pulsación larga: roba el scroll y es lenta; el asa es inmediata. |
| Recolocar | **Greedy por MRV + reparación min-conflicts** con presupuesto de 300 ms, como **propuesta** (diff + "Aplicar"/"Otra"/"Descartar"), con coste de estabilidad para mover lo mínimo y respeto a huecos fijos. | ILP/OR-Tools: sobredimensionado para 15–60 pacientes × ~50 franjas. Aplicar sin previsualizar: destruye el cuadrante publicado. |
| Datos | **Local-first**: `localStorage` (con `navigator.storage.persist()`), **cifrado opcional con contraseña** (PBKDF2 → AES-GCM) y **exportar/importar** el mismo blob. Modo discreto (alias en la rejilla). | Sync automático con Baserow/Supabase: encargado de tratamiento, contrato y cifrado en cliente igualmente; queda para una fase 2 si se pide. |
| Facturas | **Borradores** generados desde las sesiones con OK; **Emitir** asigna número correlativo de serie y bloquea; imprimir/PDF desde el navegador, descarga HTML y **CSV mensual para la gestoría**. IVA **exento** por defecto (art. 20.Uno.3.º LIVA) con texto editable; opción 21 % si no es sanitario. | Integración con Stripe/Verifactu: no en v1; la app prepara, la persona emite y envía (regla de frontera del método). |

## 3. Modelo de datos (un único documento JSON versionado)

```js
{
  v: 1,
  settings: {
    slotMin: 60, sessionMin: 50,                 // paso de rejilla y duración por defecto
    days: ['L','M','X','J','V'],                 // + 'S' opcional
    hours: { start: 9, end: 20, breaks: [[14, 16]] },
    maxPerDay: 7,
    weekAnchor: '2026-09-07',                    // lunes de una "semana A"
    discreet: false, lockMin: 5,
    emisor: { nombre, nif, direccion, email, telefono, colegiado, registro, iban, bizum },
    serie: 'F-2026', siguiente: 1,
    iva: 0,                                      // 0 = exento; 21 si procede
    textoExencion: 'Operación exenta de IVA conforme al artículo 20.Uno.3.º de la Ley 37/1992…',
    formaPago: 'Transferencia a [IBAN]'
  },
  patients: [{
    id, alias: 'Lucía P.', nombre: '', color: 'lila',
    freq: 'semanal' | 'quincenalA' | 'quincenalB' | 'puntual',
    dur: 50, modalidad: 'presencial' | 'online', tarifa: 60, activo: true,
    avail: { L: { m: 0|1|2, t: 0|1|2, hours: [16, 20] | null, motivo: '' }, M: {...}, ... },
    //        m/t = mañana/tarde; 0 = no puede, 1 = puede, 2 = mejor (preferencia blanda)
    fixed: false,                                // hueco fijo: el solver no lo mueve
    notas: '',
    billing: { nombreFiscal, nif, direccion, email, modo: 'mensual' | 'sesion' }
  }],
  slots: [{ patientId, day: 'L', hour: 17 }],   // plantilla semanal; la paridad la da freq
  weeks: {                                       // por semana ISO concreta
    '2026-W37': {
      ok: true,
      moves: { [patientId]: { day, hour } | null },          // solo esta semana (null = no viene)
      sessions: { [patientId]: { status: 'realizada'|'cancelada'|'novino', cobrar: bool, day, hour } }
    }
  },
  invoices: [{
    id, numero: null | 'F-2026-041', fecha, patientId, periodo: '2026-09',
    lineas: [{ fecha: '2026-09-10', concepto: 'Sesión de psicología · 50 min', importe: 60 }],
    base, iva, total, estado: 'borrador' | 'emitida' | 'pagada',
    sesiones: ['2026-W37:pid']                   // qué sesiones cubre (para no facturar dos veces)
  }]
}
```

Derivados en runtime: paridad de una semana = `floor(díasDesde(weekAnchor)/7) % 2` → A/B; sesiones de una semana concreta = `slots` filtrados por paridad + `weeks[w].moves`; dominio de cada paciente = franjas válidas según `avail`, horario de trabajo y descansos.

## 4. Módulos (todo dentro del mismo fichero, separados por secciones)

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `state` | Documento, `load/save`, migraciones por `v`, pila de deshacer (20 snapshots). | `storage` |
| `storage` | `localStorage` + cifrado opcional (WebCrypto) + export/import de fichero + bloqueo por inactividad. | — |
| `calendar` | Semanas ISO, paridad A/B, franjas de trabajo, "hoy/ahora". | `state.settings` |
| `rules` | `canPlace(patient, day, hour)` con motivo; `softCost(patient, day, hour)`; ocupación y solapes. | `calendar` |
| `solver` | `propose(state, opts) → { slots, diff, pendientes, score }` (greedy MRV + min-conflicts, 300 ms). | `rules` |
| `dnd` | Arrastre con Pointer Events, resaltado de huecos válidos/inválidos, swap, "Mover a…". | `rules`, `state` |
| `views` | Semana (escritorio/móvil), Pacientes (lista + ficha), Facturas, Ajustes, diálogos (Recolocar, OK semana). | todo |
| `billing` | Sesiones facturables, generación de borradores, emisión con numeración, factura imprimible, CSV. | `state`, `calendar` |

## 5. Flujos

1. **Arrastrar:** pointerdown en el asa → se calculan las franjas válidas del paciente (con motivo para las inválidas) → al mover, se resalta el hueco bajo el puntero (válido / inválido / intercambio) → al soltar: en la vista de plantilla se cambia `slots`; en una semana concreta se pregunta "¿Solo esta semana o todas?" → snapshot para deshacer → guardar.
2. **Recolocar:** diálogo con opciones (respetar fijos, mover lo mínimo, compactar) → `solver.propose` → tabla de cambios con motivos y resumen (con hueco, preferencias cumplidas, conflictos) → Aplicar / Otra propuesta / Descartar.
3. **Dar el OK a la semana:** lista de sesiones de la semana con estado (realizada por defecto; cancelada; no vino) y "se cobra" para las no realizadas → `weeks[w].ok = true` → esas sesiones son facturables.
4. **Facturas:** "Generar borradores" agrupa las sesiones con OK no facturadas por paciente (mensual o por sesión según su ficha) → borrador editable → **Emitir** asigna `serie-número`, fecha de hoy y bloquea → Imprimir/PDF, Descargar, Marcar pagada, CSV del mes.
5. **Copia de seguridad:** Ajustes → Exportar (JSON, cifrado si hay contraseña) / Importar; aviso si hace más de 7 días de la última exportación.

## 6. Reglas

**Duras** (nunca se violan; el solver no genera candidatos que las violen y el drag las marca en rojo): día/franja "no puede"; fuera de las horas concretas del paciente si las tiene; fuera del horario de trabajo o en descanso; hueco ocupado en la misma paridad; más de `maxPerDay` sesiones ese día; hueco fijo de otro paciente.

**Blandas** (coste): franja "puede" en lugar de "mejor" (10); mover a un paciente respecto a su hueco actual (8 si "mover lo mínimo", 2 si no); huecos muertos nuevos en el día del terapeuta (3, solo con "compactar"); quincenales que no comparten hueco con otro quincenal (−5 bonus si comparten).

**Paridad:** semanal ocupa A y B; quincenal A solo semanas A; dos quincenales de paridad opuesta pueden compartir hueco.

**Facturas:** una sesión solo puede estar en una factura; las emitidas no se borran ni renumeran (queda "anular/rectificar" para v1.1); el número es `serie-NNN` correlativo; base = suma de líneas; IVA = 0 (exento) con texto legal, o 21 %.

## 7. Errores y casos límite

- Sin sitio para un paciente: aparece en "Sin hueco" con el motivo ("solo puede martes tarde y está ocupado por X e Y").
- Guardar falla (`QuotaExceededError`, navegación privada): aviso persistente arriba y botón Exportar.
- Contraseña olvidada: no hay recuperación; se dice en el momento de activarla.
- Importar un fichero de versión posterior: se rechaza con mensaje; anterior: se migra.
- Semana con OK ya dado: se puede corregir una sesión mientras no esté en una factura emitida.
- Cambiar frecuencia de un paciente: se recalcula su paridad; si ahora choca, pasa a "Sin hueco".

## 8. Pruebas

- **Unitarias (node, sin navegador):** `rules.canPlace`, `solver.propose` (respeta duras, no mueve fijos, coloca a todos cuando hay solución trivial, es determinista con semilla), paridad de semanas, numeración de facturas, agrupación mensual, redondeos de importes. Se ejecutan con `node app/tests.mjs` cargando los módulos del propio HTML.
- **Navegador:** arrastre en escritorio y móvil (Browser pane), recolocación con conflicto, OK semana → borradores → emitir → impresión.

## 9. Privacidad

La agenda con pacientes es dato de salud (art. 9 RGPD). La app: no envía nada a ningún servidor; no carga scripts externos; usa alias por defecto en la rejilla (modo discreto); ofrece cifrado con contraseña y bloqueo por inactividad; los exports de calendario/CSV no llevan datos clínicos; las facturas usan concepto genérico ("Sesión de psicología"). Aviso en Ajustes con el texto recomendado por la investigación (datos solo en este dispositivo; exporta copia semanal; conserva 5 años; no edites en dos dispositivos a la vez).

## 10. Supuestos tomados sin poder preguntar

1. Una sola persona, una sola sala. 2. Sesión de 50 min en huecos de 60, L–V 9–14 y 16–20 (todo configurable). 3. Psicólogo/a sanitario/a → IVA exento por defecto. 4. Los nombres en la rejilla son alias/iniciales; el nombre fiscal solo va en la factura. 5. El OK semanal es el único origen de las sesiones facturables (no se facturan sesiones sin OK).
