# Cuadrante de consulta — diseño

**Fecha:** 2026-09-05 · **Estado:** construido bajo supuestos explícitos (§10); pendiente de revisión del usuario
**Canvas de diseño:** https://claude.ai/code/artifact/189459db-cab8-4937-8d13-686ef99dbb9a
**Código:** `app/src/` (core.js, ui.js, styles.css, index.html) → `node app/build.mjs` → `app/cuadrante-de-consulta.html`
**Pruebas del núcleo:** `node app/tests.mjs`

## 1. Qué es y para quién

Una app web de un solo fichero para que un/a psicólogo/a autónomo/a lleve el **cuadrante semanal** de sus pacientes:

- Ver la semana (escritorio) o el día (móvil) con cada paciente como una **caja arrastrable**.
- Mantener una **mini base de datos de pacientes** con qué días/franjas pueden, no pueden o prefieren, motivos y notas.
- Pulsar **Recolocar** para que el programa proponga un cuadrante que respete esas restricciones, y aplicarlo o no.
- **Dar el OK a la semana** (qué sesiones se hicieron) y **generar las facturas** de cada paciente a partir de eso.
- Entrar desde cualquier dispositivo (URL), con los datos guardados en el propio dispositivo y copia de seguridad exportable.

Fuera de alcance en v1: varios terapeutas o salas, reserva online, recordatorios automáticos, historia clínica, sincronización automática entre dispositivos, envío a Verifactu/AEAT, frecuencias de 3–4 semanas, restricciones entre pacientes (no coincidir en sala de espera).

## 2. Decisiones y alternativas

| Decisión | Elegido | Descartado y por qué |
|---|---|---|
| Arquitectura | **Un solo `.html`** (HTML+CSS+JS vanilla, sin build de terceros, sin dependencias). Se abre en local, se sube a cualquier hosting estático o se publica como Artifact. | SPA con framework + backend: más piezas para una sola persona. Artifact con `db` en servidor: mete datos de salud en un tercero sin contrato de encargado. |
| Rejilla | **Franjas discretas** = duración de sesión + descanso (60 min = 50 + 10 por defecto), L–V (+sábado opcional), horario de trabajo con descanso pintado; sesiones de 90 min ocupan dos franjas. | Calendario continuo de 15/30 min: produce "citas a las 16:20" y complica drag y solver (queja nº 1 en Jane/iPad según la investigación). |
| Arrastrar | **Pointer Events propios**: en escritorio desde cualquier punto de la caja; en táctil desde el asa (`touch-action: none` solo ahí, el resto hace scroll). Clon fantasma, `elementFromPoint`, autoscroll, huecos válidos/inválidos con motivo, **intercambio** al soltar sobre otra caja si ambos caben, y **"Mover a…"** como vía sin arrastre. En móvil, pasar el dedo por un chip de día cambia el día visible. | HTML5 DnD nativo (no funciona con el dedo en iOS). SortableJS/FullCalendar/dnd-kit: bundle y modelo de calendario continuo innecesarios. Pulsación larga: roba el scroll. |
| Plantilla y semanas | La rejilla muestra siempre una **semana concreta**; al soltar se pregunta **"¿Solo esta semana o todas?"**. La plantilla (`slots`) vale para todas; los cambios de una semana viven en `weeks[w].moves` (incluido "no viene esta semana"). Quincenales por **paridad A/B** respecto a una semana ancla. | Vista de "plantilla" separada: dos sitios donde mirar. Ancla por paciente: equivale a quincenal A/B con ancla global. |
| Recolocar | **Greedy por MRV + reparación min-conflicts** con recocido suave, **determinista** (semilla + tope de iteraciones; el tiempo solo es tope de seguridad), como **propuesta** con diff explicado, "Otra propuesta" (semilla+1), estabilidad para mover lo mínimo, respeto a huecos fijos, **validación final** de reglas duras y motivo explicable para quien queda sin hueco. | ILP/OR-Tools: sobredimensionado para 15–60 pacientes × ~50 franjas. Aplicar sin previsualizar: destruye el cuadrante. |
| Datos | **Local-first** en `localStorage` (con `navigator.storage.persist()`), **cifrado opcional con contraseña** (PBKDF2-SHA256 600k → AES-256-GCM, sal 16 B, IV nuevo en cada guardado, AAD con versión de esquema; clave solo en memoria; bloqueo por inactividad) y **exportar/importar** el mismo sobre. Modo discreto (iniciales). CSP estricta sin conexiones salientes. | IndexedDB: no evita el borrado de Safari y añade asincronía sin beneficio a este tamaño (≪ 5 MB). Sync con Baserow/Supabase: encargado de tratamiento y contrato; fase 2 si se pide. |
| Facturas | **Borradores** desde las sesiones con OK; **Emitir** asigna número correlativo, fecha de hoy y **congela** emisor, cliente y textos; **completa** si hay nombre fiscal + NIF, **simplificada** si no (≤ 400 €, con aviso si supera); mensual = **recapitulativa** por mes natural o por sesión; IVA exento por defecto (texto editable) o 21 %; **retención IRPF** 0/7/15 % por paciente (solo empresas); **rectificativa** por anulación total en serie propia; imprimir/PDF, descargar HTML y **CSV mensual** para la gestoría. | Integración con Stripe/Verifactu: no en v1 (obligatorio para autónomos desde el 1-7-2027; hasta entonces esta plantilla vale como Word/Excel según la FAQ de la AEAT). |

## 3. Modelo de datos (un único documento JSON versionado, `v: 1`)

```js
{
  v: 1,
  settings: {
    slotMin: 60, sessionMin: 50, days: ['L','M','X','J','V'],
    hours: { start: 9, end: 20, breaks: [[14, 16]] }, tardeDesde: 15, maxPerDay: 7,
    weekAnchor: '2026-09-07',                 // lunes de una "semana A"
    office: { L: { m: true, t: true }, … },   // despacho disponible para presenciales (por día y franja)
    closedDates: [{ date: '2026-10-12', motivo: 'festivo' }],
    discreet: false, lockMin: 5,
    emisor: { nombre, nif, direccion, email, telefono, colegiado, registro },
    serie: 'F-2026', siguiente: 1, serieRect: 'R-2026', siguienteRect: 1,
    iva: 0, textoExencion: '…art. 20.Uno.3.º Ley 37/1992…', formaPago: '…', vencimientoDias: 0,
    lastExport: null, onboarded: true
  },
  patients: [{
    id, alias: 'Lucía P.', nombre: '', color: 'lila',
    freq: 'semanal' | 'quincenalA' | 'quincenalB' | 'puntual',
    dur: 50, modalidad: 'presencial' | 'online', tarifa: 60, activo: true,
    avail: { L: { m: 0|1|2, t: 0|1|2, hours: [16, 20] | null, motivo: '' }, … }, // 0 no puede · 1 puede · 2 mejor
    fixed: false, notas: '',
    billing: { nombreFiscal, nif, direccion, email, modo: 'mensual' | 'sesion', retencion: 0 | 7 | 15 }
  }],
  slots: [{ id, patientId, day: 'L', hour: 17 }],        // plantilla; un paciente puede tener varios
  weeks: {
    '2026-W37': {
      ok: true, closedAt,
      moves: { [slotId]: { day, hour } | null, [xId]: { patientId, day, hour } },  // solo esa semana
      sessions: { [slotId]: { patientId, status: 'realizada'|'cancelada'|'novino', cobrar, importe, day, hour } }
    }
  },
  invoices: [{
    id, numero: null | 'F-2026-041', fecha, estado: 'borrador'|'emitida'|'pagada'|'anulada',
    tipo: 'completa'|'simplificada', aviso, patientId, periodo: '2026-09', modo,
    lineas: [{ fecha, concepto, importe }], ivaPct, retPct, base, iva, retencion, total,
    sesiones: ['2026-W37:slotId'],               // una sesión solo puede estar en una factura
    // congelado al emitir:
    emisor, cliente: { nombre, nif, direccion, email }, textoExencion, formaPago, vencimientoDias,
    // rectificativas:
    rectificaDe, rectificaNumero, causa
  }]
}
```

Derivados en runtime: paridad de una semana = `floor(semanasDesde(weekAnchor)) % 2` → A/B; sesiones de una semana = `slots` filtrados por paridad + `weeks[w].moves`; dominio de un paciente = franjas válidas según `avail`, horario, descansos, despacho y duración.

## 4. Módulos

| Módulo | Fichero | Responsabilidad |
|---|---|---|
| Núcleo | `core.js` (sin DOM; probado con node) | calendario ISO y paridad · reglas `canPlace`/`validSlots` con motivo · `propose`/`applyProposal` · `weekSessions`/`weekReview`/`closeWeek` · `billableSessions`/`generateDrafts`/`issueInvoice`/`rectifyDraft`/`csvMonth` · `migrate` |
| Interfaz | `ui.js` | estado de la app, render por vistas, arrastre, diálogos (recolocar, OK, confirmación, contraseña), almacenamiento + cifrado, exportar/importar, deshacer, bloqueo, datos de ejemplo |
| Estilos | `styles.css` | tokens claro/oscuro, rejilla, cajas, vistas, impresión de factura, móvil |
| Ensamblado | `build.mjs` | inyecta los tres en `index.html` → fichero autónomo + variante para Artifact |

## 5. Flujos

1. **Arrastrar:** pointerdown → umbral de 5 px → se calculan huecos válidos (y posibles intercambios) → resaltado y motivo al pasar por uno inválido → al soltar, popover "¿Solo esta semana o todas?" → snapshot para deshacer → guardar → aviso con "Deshacer" (también Ctrl/Cmd+Z).
2. **Recolocar:** opciones (respetar fijos, mover lo mínimo, compactar) → propuesta con resumen (con hueco, preferencias, conflictos), tabla de cambios con motivo y pendientes con explicación → Aplicar / Otra propuesta / Descartar.
3. **Dar el OK:** lista de la semana con realizada/cancelada/no vino, "se cobra" e importe editable → `weeks[w].ok`. Se puede corregir después salvo lo ya facturado en una emitida. Los días marcados como festivo/cierre salen como canceladas por defecto.
4. **Facturas:** pendiente de facturar → "Generar borradores" (por paciente y mes natural, o por sesión) → revisar/ajustar líneas → **Emitir** (exige datos fiscales del emisor; confirma el número) → imprimir/PDF, descargar HTML, marcar pagada, rectificativa, CSV del mes.
5. **Datos:** Ajustes → exportar (cifrado si hay contraseña; opción sin cifrar con aviso) / importar (sustituye todo, con confirmación) / activar, cambiar o quitar contraseña / bloqueo por inactividad / borrar todo / datos de ejemplo.

## 6. Reglas

**Duras:** día o franja "no puede"; fuera de las horas concretas del paciente; fuera del horario o en descanso; sesión larga que no cabe; presencial sin despacho en esa franja; hueco ocupado en la misma paridad (también por el propio paciente); más de `maxPerDay` sesiones ese día; huecos fijos se colocan antes y no se tocan.

**Blandas (coste):** franja "puede" en lugar de "mejor" (10, solo si el paciente tiene alguna preferencia); mover respecto al hueco actual (8 con "mover lo mínimo", 2 sin ella); perder un hueco que ya se tenía (1000 + 8) frente a no conseguir uno nuevo (1000); huecos muertos nuevos (3, solo con "compactar"); quincenales compartiendo hueco (−5).

**Facturas:** el número solo se asigna al emitir; las emitidas no se editan ni se borran (rectificativa); una sesión no puede facturarse dos veces; toda sesión sanitaria realizada debe facturarse (la app lo muestra como "pendiente de facturar"); base = suma de líneas, IVA 0 (exenta, con texto) o 21 %, retención sobre la base.

## 7. Errores y casos límite

- Sin sitio para alguien: aparece en "Sin hueco" (bandeja) y en Recolocar como pendiente con motivo ("Solo puede Mar, Jue; esas horas están ocupadas por X e Y").
- Guardar falla (cuota, navegación privada): aviso persistente y enlace a exportar.
- Contraseña olvidada: no hay recuperación; se avisa al activarla y en la pantalla de bloqueo (se puede borrar todo e importar una copia).
- Importar versión posterior: se rechaza; anterior: se migra y se rellenan campos.
- Emitir sin datos fiscales del emisor: se bloquea con aviso.
- Simplificada > 400 € sin NIF: aviso en el borrador.
- Paciente con facturas: no se puede eliminar, solo dar de baja.

## 8. Pruebas

- `node app/tests.mjs` (10 casos): semanas ISO y paridad; horario con descansos; reglas duras con motivos (día prohibido, ocupado, fuera de horario, quincenales compartiendo, 90 min, despacho, máximo diario); solver (resuelve conflicto, respeta fijos, coloca sin-hueco, preferencia, determinista, idempotente tras aplicar, explica pendientes); semanas concretas (paridad, movimientos, extras); cierre + borradores + emisión + numeración + congelado + CSV + rectificativa; totales con IVA/IRPF; migración.
- Navegador (hecho en esta sesión, escritorio en tema oscuro): bienvenida → datos de ejemplo → arrastre con popover de alcance y deshacer → Recolocar (13→15 con hueco, 1→0 conflictos) → Dar el OK con "no vino" → Facturas → 22 borradores → emisión. Pendiente de probar por el usuario: Safari iOS real.

## 9. Privacidad

La agenda con pacientes es dato de salud (art. 9 RGPD). La app no envía nada a ningún servidor; la CSP bloquea cualquier conexión saliente (solo tipografías de Google); alias por defecto y modo discreto; cifrado opcional y bloqueo automático; exports y facturas sin datos clínicos ("Sesión de psicología"); aviso en Ajustes: datos solo en este dispositivo, exporta copia semanal, conserva facturas 4 años y la información asistencial 5 años desde el alta (Ley 41/2002), da de baja en vez de borrar, no edites en dos dispositivos a la vez.

## 10. Supuestos tomados sin poder preguntar (revisar)

1. Una sola persona y una sala. 2. Sesiones de 50 min en huecos de 60, L–V 9–14 y 16–20 (configurable). 3. Psicólogo/a sanitario/a → IVA exento por defecto. 4. Los nombres del cuadrante son alias; el fiscal solo va en la factura. 5. El OK semanal es el único origen de sesiones facturables. 6. Contraseña opcional (recomendada), no obligatoria. 7. Un paciente puede tener varios huecos semanales (el modelo lo permite; la ficha crea uno).

## 11. Revisión adversarial (Codex) y qué se hizo

Aceptado: huecos con identidad propia (`slots[].id`, sesiones y movimientos por id); facturas emitidas como instantánea (emisor, cliente, textos congelados); parámetros de cifrado versionados y CSP; solver determinista con validación final y explicación; series anuales y rectificativas desde v1; tratamiento fiscal por factura (IVA y retención); "Mover a…" como flujo principal en móvil además del arrastre. Descartado con motivo: IndexedDB (no evita el borrado de Safari a este tamaño), ancla A/B por paciente (equivalente), cifrado obligatorio (riesgo de bloqueo total para quien no lo quiera). Preguntas abiertas para el usuario: ¿dos sesiones semanales de un mismo paciente?, ¿inicios fuera de la hora en punto?, ¿política de cobro de cancelaciones?, ¿clientes empresa con retención?, ¿quién guarda las copias y con qué frecuencia?

## 12. Ampliación (misma tarde, a petición del usuario)

Añadido: lista de espera con prioridad y sugerencias al tocar un hueco libre; varias sesiones por semana por paciente (`sesiones`); mover cajas con teclado (Espacio, flechas, Enter, Esc); recordatorio de cita para copiar (sin la palabra "psicología"); festivos nacionales de España calculados (Pascua por Meeus) con interruptor en Ajustes; exportar calendario `.ics` anonimizado de 8 semanas; PDF de factura generado sin librerías (escritor PDF mínimo, Helvetica WinAnsi); CSV con las columnas del libro registro de facturas expedidas de la AEAT; quitar líneas de un borrador (rectificación parcial editando importes); deshacer también para fichas y borradores (se vacía al emitir). Descartado por decisión del usuario: instalación como app en pantalla de inicio y enlaces de pago de Stripe. Pendiente: pruebas automáticas de interfaz y sincronización entre dispositivos.
