# Combate D&D

Gestor de recursos para personajes de **D&D 5e** pensado para usar en la mesa, desde el navegador del PC.
Lleva la cuenta de tu turno, tus puntos de golpe, espacios de conjuro, usos de rasgos, estados y todo lo que
se gasta y se recupera durante una sesión.

> No tira dados: tú tiras en la mesa y la app lleva la cuenta.

## Qué hace

**Turno**
- Acción, acción adicional, reacción y movimiento de cada turno, con Ataque extra.
- Botón **Nuevo turno** que renueva todo y descuenta la duración de los efectos.
- Haz clic en una casilla para gastarla en algo que no está en tu lista (por ejemplo, Esquivar).

**Rasgos y conjuros**
- Cada rasgo cuesta acción, adicional, reacción o nada, y puede gastar un recurso.
- Conjuros con espacio de conjuro, lanzamiento a nivel superior y concentración.
- Buscador, filtros por costo, secciones plegables y "solo lo que puedo usar ahora".
- Si algo no se puede usar, dice por qué ("Ya usaste tu acción", "Sin espacios de nivel 1").
- Descripción desplegable en cada rasgo para la CD, el daño o las reglas del objeto.

**Puntos de golpe y concentración**
- Daño, curación y PG temporales, con las últimas cantidades a un clic.
- Al recibir daño concentrado, pide la salvación de CON con su CD y botones **Pasé / Fallé**.
- Salvaciones contra muerte cuando llegas a 0 PG.

**Recursos**
- Espacios de conjuro, Ki, Furia, munición, pociones… con recarga por turno, descanso corto, descanso largo o manual.
- Marca lo que gastaste **en este combate**.
- Vista previa de lo que recupera cada descanso antes de tomarlo.

**Estados, ventajas y defensas**
- Estados con duración en rondas y los más comunes a un clic.
- Sección de **ventajas, desventajas, resistencias e inmunidades** del personaje.
- Los estados del SRD (Derribado, Envenenado…) muestran solos lo que implican mientras duran.

**Descansos**
- Descanso corto y largo (con confirmación) y **recordatorios al descansar**: preguntas que aparecen al terminar
  un descanso y pueden añadir un estado con sus reglas, como una tirada diaria que cambia lo que puedes hacer.

**Otros**
- Notas libres de la sesión, guardadas con el personaje.
- Deshacer (también con `Ctrl+Z`) y registro de todo lo que haces.
- Varios personajes, editor completo y respaldo en JSON (exportar e importar).
- Al importar un personaje que ya tienes puedes **actualizar la ficha** sin perder tus PG, usos gastados ni estados.

### Atajos de teclado

| Atajo | Qué hace |
|---|---|
| `N` | Nuevo turno |
| `Ctrl+Z` | Deshacer |
| `/` | Ir al buscador de rasgos |
| `Esc` (en el buscador) | Limpiar la búsqueda |
| `Enter` (en PG) | Aplicar daño |
| `Shift+Enter` (en PG) | Curar |

Los atajos no se activan mientras escribes en un campo.

## Cómo funciona

### La pantalla de combate

En un monitor ancho la pantalla se divide en tres columnas:

| Izquierda: lo vital | Centro: lo que haces | Derecha: lo que te queda |
|---|---|---|
| Recordatorios tras descansar, **Nuevo turno**, puntos de golpe y concentración, tu turno (acción, adicional, reacción, movimiento), estados | Rasgos y conjuros, descansos, registro y notas | Recursos y ventajas y defensas |

Las columnas de los lados se quedan fijas al bajar, así que siempre ves tus PG, tu turno y tus recursos.
En pantallas más angostas pasa a dos columnas y luego a una.

### 1. Prepara el personaje

En **Personajes** crea uno con **+ Nuevo** o importa un JSON con **Importar archivo…**. En el editor defines:

- **Datos básicos**: nivel, velocidad, PG máximos y ataques por acción (2 con Ataque extra).
- **Recursos**: todo lo que se gasta y se recupera. Cada uno tiene un máximo, cuándo se recarga (por turno,
  descanso corto, descanso largo o nunca) y cuánto recupera (todo, la mitad o uno). El botón de espacios de conjuro
  los crea solos según tu nivel. El campo **Grupo** los ordena en secciones.
- **Rasgos y conjuros**: lo que aparece como botón en combate. Cada uno indica qué cuesta (acción, adicional,
  reacción o gratis), qué recurso gasta, si es de concentración, cuántas rondas dura y una descripción opcional.
  Si gasta un espacio de conjuro, puedes permitir lanzarlo a nivel superior.
- **Ventajas y defensas**: con qué tienes ventaja o desventaja y a qué eres resistente o inmune.
- **Recordatorios al descansar**: preguntas que salen al terminar un descanso (ver más abajo).

### 2. Empieza el combate

Pulsa **Nuevo combate** (pide confirmación). La app vuelve a la ronda 1 y anota cómo están tus recursos, para
marcarte luego en naranja lo que gastes en esta pelea.

### 3. Juega tu turno

- Al empezar cada turno pulsa **Nuevo turno** (o `N`). Se renuevan acción, adicional, reacción y movimiento, y los
  efectos con duración pierden una ronda; los que terminan te los avisa.
- Pulsa un **rasgo o conjuro** para usarlo: gasta su costo en el turno y su recurso. Si se puede lanzar a nivel
  superior, te deja elegir el espacio. Si es de concentración, reemplaza la concentración anterior.
- **Atacar** gasta la acción y abre tus ataques (con Ataque extra, dos).
- Para algo que no está en tu lista, como Esquivar, pulsa directamente la casilla de **Acción**, **Adicional** o
  **Reacción**.
- Para moverte usa los botones de pies o escribe la cantidad.
- Si un botón está apagado, debajo dice por qué.

### 4. Recibe daño o cúrate

Escribe la cantidad en **Puntos de golpe** y pulsa **Daño** (o `Enter`), **Curar** (o `Shift+Enter`) o **Temp**.
Las cantidades que usas quedan como botones para repetirlas.

Si estás concentrado, cada golpe deja pendiente una **salvación de CON** con su CD. Tú tiras en la mesa y marcas
**Pasé** o **Fallé**; al fallar se termina la concentración y los efectos que dependían de ella.

A 0 PG aparecen las salvaciones contra muerte.

### 5. Estados

En **Estados y efectos** añade un estado con los botones rápidos o escribiendo su nombre, con duración en rondas
o sin ella. Si es un estado del SRD (Derribado, Envenenado, Asustado…), la sección **Ventajas y defensas** muestra
en naranja lo que implica mientras dure. Quítalo con la ✕.

### 6. Descansa

Pasa el mouse por **Descanso corto** o **Descanso largo** para ver qué recuperarías. El corto recarga lo de
descanso corto; el largo (pide confirmación) recarga todo, te cura al máximo y quita los estados.

Si el personaje tiene **recordatorios al descansar**, justo después del descanso aparece arriba de la columna
izquierda una tarjeta **"Tras el descanso"** con la pregunta. Al elegir una respuesta se añade su estado con sus
reglas (por ejemplo, *Voces susurrantes: desventaja en salvaciones de SAB*), y en el siguiente descanso la nueva
respuesta reemplaza a la anterior. También puedes omitirla.

### 7. Si te equivocas

**Deshacer** (o `Ctrl+Z`) revierte la última acción, hasta 50 pasos atrás. El **Registro** muestra todo lo que
pasó en la sesión. Las **Notas** se guardan solas y deshacer nunca las borra.

### 8. Actualiza la ficha

Si cambias el personaje fuera de la app (por ejemplo, regenerando el JSON desde tu hoja de personaje) e importas
uno que ya existe, la app pregunta qué hacer:

- **Actualizar ficha**: trae los rasgos, recursos, máximos y ventajas nuevos, pero conserva tus PG, usos gastados,
  estados, concentración y ronda.
- **Reemplazar todo**: deja el personaje tal como viene en el archivo, todo recargado.

## Instalación

Necesitas [Node.js](https://nodejs.org) 20 o más reciente y [pnpm](https://pnpm.io).

```bash
git clone https://github.com/hey1125/dnd-combate.git
cd dnd-combate
pnpm install
pnpm dev
```

Abre la dirección que muestra la terminal (normalmente http://localhost:5173).

### Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | Revisa tipos y genera la versión de producción en `dist/` |
| `pnpm preview` | Sirve la versión de producción para probarla |
| `pnpm test` | Ejecuta los tests (Vitest) |
| `pnpm lint` | Revisa el código con ESLint |

## Dónde se guardan los datos

Todo se guarda **en tu navegador** (IndexedDB), sin servidor ni cuenta. Funciona sin internet.

Eso también significa que los personajes viven solo en ese navegador de ese equipo: si borras los datos del sitio
o cambias de PC, se pierden. Usa **Personajes → Exportar todos** de vez en cuando para tener un respaldo.

## Formato de los personajes

El respaldo es un JSON con esta forma:

```json
{
  "app": "dnd-combate",
  "version": 1,
  "exportedAt": "2026-10-28T03:10:00.000Z",
  "characters": [ { "id": "seraphine-delmark", "name": "Seraphine Delmark", "...": "..." } ]
}
```

También se puede importar una lista de personajes o un personaje suelto. Cada personaje se valida al importarlo
(`src/core/schema.ts`), y los que no pasan se omiten avisando por qué.

Los `id` de recursos y rasgos deben ser estables entre versiones de la ficha: es lo que permite que
**Actualizar ficha** conserve los usos gastados. Los espacios de conjuro usan los ids `slot-1` a `slot-9`.

## Cómo está organizado

```
src/
  core/   Reglas del juego: tipos, turno, recursos, PG, efectos, descansos, validación e importación.
          Sin React ni base de datos, con tests para cada parte.
  data/   Dónde se guardan los personajes (IndexedDB con Dexie), detrás de una interfaz.
  store/  Estado de la app con Zustand: personaje activo, historial para deshacer y registro.
  ui/     Pantallas y paneles en React.
```

El núcleo (`core/`) no depende de la interfaz, así que las reglas se pueden probar y cambiar sin tocar las pantallas.
El guardado está detrás de `CharacterRepository` (`data/repository.ts`) para poder cambiar IndexedDB por otra
fuente (por ejemplo, una API) sin tocar el resto.

## Hecho con

[React](https://react.dev), [Vite](https://vite.dev), [TypeScript](https://www.typescriptlang.org),
[Zustand](https://zustand.docs.pmnd.rs), [Dexie.js](https://dexie.org), [Zod](https://zod.dev) y
[Vitest](https://vitest.dev).

## Créditos y avisos

Hecho por Daniel, con ayuda de Claude (Anthropic).

Las reglas de los estados que muestra la app son un resumen basado en el
[System Reference Document 5.1](https://dnd.wizards.com/resources/systems-reference-document) de Wizards of the Coast LLC,
publicado bajo licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

Proyecto de fans sin fines de lucro. No está afiliado ni respaldado por Wizards of the Coast ni por
[Nivel20](https://nivel20.com). Dungeons & Dragons y D&D son marcas de Wizards of the Coast LLC.

## Licencia

Todavía sin licencia. Mientras no se elija una, el código se puede ver pero no reutilizar.
Si quieres que otros puedan usarlo, añade un archivo `LICENSE` (por ejemplo, [MIT](https://choosealicense.com/licenses/mit/)).
