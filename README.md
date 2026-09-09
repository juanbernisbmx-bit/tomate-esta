# Tomate

App para medir (estimando) cuánto tomó cada uno en la noche y ver quién va ganando la carrera
dentro del grupo. Le sacás una foto al vaso, la IA calcula el tamaño, vos elegís qué estás
tomando y con eso sale el alcohol puro y el ‰ estimado.

Esto es **solo el frontend**. Todos los datos salen de mocks locales (`src/api/client.ts`),
listos para reemplazar por el back sin tocar las pantallas.

## Arrancar

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`. El server escucha en la red, así que desde el celular
(misma wifi) entrás a `http://<ip-de-tu-compu>:5173` y lo probás con la cámara real.

Otros comandos:

```bash
npm run build      # build de producción a dist/
npm run preview    # sirve el build
npm run typecheck  # TypeScript
```

## Cómo funciona la app

| Pantalla | Archivo | Qué hace |
| --- | --- | --- |
| Bienvenida | `src/screens/Welcome.tsx` | Logo y entrada |
| Onboarding | `src/screens/Onboarding.tsx` | Peso, sexo, edad y permiso de cámara (los 3 datos que necesita el cálculo) |
| Grupo | `src/screens/GroupJoin.tsx` | Entrar con código de 4 caracteres o crear grupo |
| Nivel (home) | `src/screens/Home.tsx` | Tu ‰, tu vaso predeterminado y **los dos botones** |
| Escaneo | `src/screens/Scan.tsx` | Elegir bebida → foto → análisis → resultado |
| La carrera | `src/screens/Rank.tsx` | Tabla del grupo en vivo (ahora / pico / tragos) |
| Perfil | `src/screens/Profile.tsx` | Estadísticas, calibración y cierre de noche |
| Resumen | `src/screens/Recap.tsx` | Medalla, totales y compartir |

### Los dos botones

En la home hay dos acciones, y la barra de abajo las repite desde cualquier pantalla:

1. **Sumar trago** (verde, grande) — suma al instante el **vaso predeterminado**, sin preguntar
   nada. Sale un aviso con "deshacer" por si fue sin querer.
2. **Escanear vaso con IA** (botón oscuro + cámara naranja de la barra) — abre el flujo de foto.

El vaso predeterminado se cambia de tres formas:

- escaneando uno nuevo (queda como predeterminado apenas lo guardás),
- tocando un preset (Vaso de previa 1 L, Cerveza 1 L, Vaso de trago, Shot…),
- armando uno **a medida** con ml y graduación en la hoja "Elegí tu vaso".

### El flujo de escaneo

`Paso 1` la persona elige qué está tomando (cerveza, vino, trago, shot, espumante, sidra): eso
define la graduación. `Paso 2` saca la foto — la IA solo tiene que estimar el recipiente y el
volumen, que es lo que se puede ver en una imagen. En el resultado se puede corregir a mano el
tamaño y la graduación antes de guardar.

Si el celular no da cámara, la pantalla entra en "modo estimación" y el resto funciona igual.

## El cálculo (`src/lib/alcohol.ts`)

```
gramos    = ml × (%vol / 100) × 0,789        (densidad del etanol)
‰ de pico = gramos / (peso_kg × r)           (Widmark; r = 0,68 H · 0,55 M · 0,615 X)
‰ ahora   = Σ (pico_i × absorción_i) − 0,15 × horas_desde_el_primer_trago
absorción = rampa lineal de 20 min desde que se cargó el trago
```

Como la absorción no es instantánea, la home muestra "+0,39 subiendo" con lo que todavía falta
entrar en sangre: así el botón da feedback inmediato sin mentir con el número actual.

Los valores están en constantes exportadas (`ELIMINATION_PER_HOUR`, `ABSORPTION_MIN`,
`R_FACTOR`) para que el back use exactamente los mismos y no haya diferencias entre lo que
muestra la app y lo que guarda el servidor.

**Es una estimación para jugar entre amigos.** No es un alcoholímetro ni sirve como prueba
legal, y así se aclara en la bienvenida, el onboarding y el pie de la tabla.

## Conectar el back

Todo pasa por `src/api/client.ts`. Poné la URL en `.env`:

```
VITE_API_URL=https://api.tomate.app
```

Con esa variable definida, el cliente deja de usar mocks y pega contra:

| Función | Endpoint | Devuelve |
| --- | --- | --- |
| `analyzeGlass(photo, kind)` | `POST /api/scan` | `{ ml, abv, confidence, vesselLabel, note }` |
| `fetchGroup(code)` | `GET /api/groups/:code` | `Group` |
| `pollGroup(group)` | `GET /api/groups/:code` | `Group` (hoy se llama cada 45 s; el día de mañana, websocket) |
| `pushTrago(group, trago)` | `POST /api/groups/:code/tragos` | — |

Los tipos están en `src/lib/types.ts`. La foto viaja como dataURL JPEG de 640 px de ancho
(`image/jpeg`, calidad 0,7) para no mandar 4 MB por trago.

Lo que falta del lado del back: usuarios y sesión, grupos reales con invitación, persistencia
de la noche y el modelo de visión que estime el volumen.

## Estado

`src/state/store.tsx` es un Context + reducer con persistencia en `localStorage`
(clave `tomate.v1`): perfil, grupo, vaso predeterminado, tragos de la noche e historial.
`src/state/selectors.ts` arma la tabla del grupo y el ‰ vivo.

## Ir a la App Store

El proyecto ya está preparado para envolverlo con [Capacitor](https://capacitorjs.com)
(`base: './'` en `vite.config.ts`, safe areas, sin scroll de body, viewport `viewport-fit=cover`):

```bash
npm i @capacitor/core @capacitor/ios
npm i -D @capacitor/cli
npx cap init Tomate app.tomate --web-dir=dist
npm run build && npx cap add ios && npx cap open ios
```

Después hay que:

- reemplazar `getUserMedia` por `@capacitor/camera` si querés la cámara nativa (mejor calidad y
  permisos del sistema); el resto del flujo no cambia,
- agregar `NSCameraUsageDescription` en el `Info.plist`,
- self-hostear las fuentes Anton y Space Grotesk (hoy vienen de Google Fonts) para que la app
  no dependa de internet al abrir,
- generar los íconos desde `public/icon.svg`.

Ojo con la revisión de Apple: una app de alcohol necesita clasificación 17+ y conviene dejar
bien visible que la medición es orientativa (ya está en el copy).

## Diseño

Sale del prototipo: fondo `#0A0908`, verde `#C6F24E`, ámbar `#FFB020`, rojo `#E8402A`,
tipografías Anton (títulos) y Space Grotesk (texto). Los tokens están en `src/index.css`
dentro de `@theme`, así que se usan como clases normales de Tailwind (`bg-night`, `text-lime`,
`font-display`).
