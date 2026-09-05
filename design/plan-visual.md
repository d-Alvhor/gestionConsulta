# Cuadrante — plan visual

**Sujeto:** el cuadrante semanal de una consulta de psicología (autónomo/a, España).
**Audiencia:** una persona, cada día, en escritorio y móvil.
**Trabajo de la página:** ver la semana de un vistazo, mover pacientes de hueco con el dedo o el ratón, y dejar que el programa recoloque respetando lo que cada paciente puede y no puede.

**Tratamiento:** utilitario-cálido. Es una herramienta que se opera, no un póster: la
jerarquía la lleva la información (huecos, conflictos, quién está fijo), el color de marca
se gasta en un solo sitio (acción principal + marcador de "ahora") y el resto queda quieto
para que las cajas de pacientes puedan llevar color propio.

## Color (oklch, luego hex)

| token | uso | claro | oscuro |
|---|---|---|---|
| `--paper` | fondo de página | `#F6F7F4` (blanco con sesgo verde-gris, sat < 0.02) | `#141A19` |
| `--card` | superficies (panel, tarjetas) | `#FFFFFF` | `#1C2423` |
| `--ink` | texto principal | `#1B2726` (negro teal) | `#E8ECEA` |
| `--muted` | texto secundario, rejilla | `#66746F` | `#93A29C` |
| `--line` | reglas de la agenda | `#D9DFDB` | `#2C3634` |
| `--accent` | acción principal, hoy/ahora, foco | `#2F6E68` (eucalipto) | `#5FB3AA` |
| `--accent-2` | "ahora", pendientes, avisos suaves | `#C5892F` (ocre) | `#E0A64F` |
| `--danger` | conflicto duro (no puede ese día) | `#B5433C` | `#E27A73` |

Paleta categórica de pacientes (8 tintas suaves, texto oscuro del mismo tono; contraste ≥ 4.5 en claro y oscuro):
musgo `#DCE8D2/#2E4A22`, cielo `#D6E4F0/#1F3F5C`, lila `#E3DCEF/#42305E`, arena `#F0E4CC/#5A4416`,
rosa `#F2DADA/#6A2E2E`, menta `#D3ECE6/#1F4E45`, melocotón `#F5DFD0/#6B3A1D`, pizarra `#DEE2E7/#2F3A47`.
Un paciente elige su color (o se asigna por orden). No se usan barras laterales de color ni bordes izquierdos.

## Tipografía (Google Fonts)

- **UI y cuerpo:** IBM Plex Sans (400/500/600) — humanista con carácter técnico, buenas versalitas y tabulares, cómoda en español.
- **Horas y datos:** IBM Plex Mono (400/500) con `font-variant-numeric: tabular-nums` en el canal de horas y en contadores.
- **Nombre de la app y titulares grandes:** Newsreader 500 itálica — un solo gesto editorial, en el wordmark y en el título de la semana.

Escala: 12 / 13 / 14 / 16 / 20 / 28 / 40. Etiquetas en mayúsculas con `letter-spacing: .06em`. Cuerpo a 14–15 px en la rejilla, 16 px en formularios.

## Layout

Escritorio (≥ 1024): barra superior fina (wordmark · selector de semana · botón "Recolocar" · guardar/exportar) · a la izquierda el **cajón de pacientes** (lista + bandeja "sin hueco") · centro la **rejilla semanal** (canal de horas mono + 5–6 columnas de día, filas por franja de sesión) · a la derecha, al abrir un paciente, la **ficha** (días que puede / no puede, motivos, notas).

Móvil (< 768): pestañas inferiores **Semana · Pacientes**; la semana se ve día a día con un carrusel de días; arrastrar con pulsación larga; cada caja tiene además un menú "Mover a…" para no depender del arrastre.

Metáfora: la agenda de papel de la consulta — reglas horizontales finas por franja, horas en el margen, cajas como fichas de cartulina tintadas. Nada de gradientes ni sombras grandes: una sombra corta solo mientras se arrastra.

## Estado en la forma

- Caja normal: tinta del paciente, nombre + duración, chip pequeño "online" si aplica.
- Fijo (pin): icono de chincheta SVG en la esquina; el recolocador no lo mueve.
- Quincenal: la caja se parte en dos mitades "A / B" o muestra "sem. A".
- Conflicto: borde punteado `--danger` + explicación en tooltip ("Martes: no puede — turno de tarde").
- Hueco válido al arrastrar: fondo `--accent` al 10 %; hueco inválido: rayado diagonal suave + cursor no-drop.
- Ahora: línea ocre fina cruzando el día actual.

## Facturación (añadido tras el mensaje del usuario)

Flujo: **Semana → "Dar el OK"** (cada sesión de la semana queda *realizada* / *cancelada* / *no vino*; por defecto realizada) → las sesiones realizadas y no facturadas se acumulan por paciente → **Facturas → "Generar borradores"** (una por paciente y mes, o por sesión si el paciente lo prefiere) → la persona revisa → **"Emitir"** asigna el número correlativo de la serie y bloquea el borrador → imprimir / guardar PDF / exportar CSV para la gestoría.

Pantallas:
- **Cierre de semana**: lista de sesiones de la semana con tres estados en chips (realizada · cancelada · no vino) y un botón grande "Dar el OK a la semana". Resumen arriba: sesiones, importe pendiente de facturar.
- **Facturas**: tabla (nº · paciente · periodo · sesiones · importe · estado) con filtros por mes; borradores en ocre, emitidas en tinta; acciones Emitir · Ver · Imprimir · CSV.
- **Factura (impresión)**: A4, cabecera con datos del emisor, bloque de cliente, líneas (fecha · concepto genérico "Sesión de psicología" · importe), pie con la mención de exención de IVA y forma de pago. Tipografía IBM Plex; sin color salvo el wordmark.
- **Ajustes**: datos fiscales del emisor, serie y siguiente número, texto de exención, forma de pago, tarifa por defecto, duración de sesión y horario de trabajo.
