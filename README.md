# Tomate · React Native

Aplicación nativa con **Expo SDK 57, React Native 0.86 y React 19.2**, orientada a iPhone, con soporte de Android y vista web para desarrollo. Las ocho pantallas usan `View`, `Text`, `Pressable`, `ScrollView`, `Modal`, `TextInput` y controles nativos. No hay WebView, Vite, Tailwind ni Capacitor.

La app permite registrar bebidas, ajustar vasos, fotografiar recipientes, consultar estimaciones, acompañar al grupo, guardar el historial y abrir Uber. El enfoque pasó de competencia por consumo a **registro y cuidado**: sin ranking, medallas ni premios por tomar más. Tampoco se presenta un tiempo estimado como autorización para manejar.

## Ejecutar

Usar Node 22 LTS o una versión compatible con Expo SDK 57.

```bash
npm ci
cp .env.example .env
npm run dev
```

El servidor muestra el QR y las opciones disponibles. Expo Go necesita soportar SDK 57; para trabajar hacia App Store se recomienda un **development build** propio.

```bash
npm run ios          # Requiere macOS + Xcode + simulador/CocoaPods
npm run android      # Requiere Android Studio + SDK
npm run web          # Vista del mismo código con React Native Web
npm start            # Metro para un development build instalado
npm run typecheck
npm test
npm run doctor
npm run build        # Exporta bundles JS/Hermes y assets a dist/; NO genera un .ipa
```

Las fuentes Anton y Space Grotesk están empaquetadas en la app y funcionan sin conexión.

## Pantallas y comportamiento

| Pantalla         | Implementación                                                                    |
| ---------------- | --------------------------------------------------------------------------------- |
| Bienvenida       | Presentación de registro y cuidado                                                |
| Calibración      | Peso, sexo, edad, confirmación 18+ y permiso opcional de cámara                   |
| Grupo            | Buscar código, crear grupo demo/por API o continuar individualmente               |
| Registro         | Estimación actual, absorción pendiente, vaso, registro con deshacer y eliminación |
| Escaneo          | Bebida → cámara trasera → análisis → corrección → guardar, o carga manual         |
| Grupo compartido | Primero tu registro, luego integrantes por nombre; sin posiciones                 |
| Perfil           | Nombre, calibración, últimas noches, historial y borrado local confirmado         |
| Resumen          | Totales, compartir con el sistema y archivar la noche por separado                |

Los modales usan áreas seguras y scroll interno. El reloj se actualiza al volver del segundo plano. La cámara se desmonta al salir y al poner la app en segundo plano. Sin permiso se puede usar la carga manual o abrir Ajustes. Uber solicita ubicación solo al tocar el botón; si falla o se deniega, usa el enlace universal con `pickup=my_location`.

## Estado y almacenamiento

- `src/state/model.ts`: reducer y tipos de estado.
- `src/state/persistence.ts`: validación de datos guardados y cola de escrituras para evitar que una operación lenta sobrescriba otra posterior.
- `src/state/store.tsx`: Context y AsyncStorage; espera la lectura inicial antes de mostrar pantallas.
- Se guardan perfil, grupo, vaso/foto, registros e historial de hasta 30 noches. Pantalla y avisos son transitorios.
- La clave sigue siendo `tomate.v1`. Se toleran resúmenes antiguos con `puesto`, pero no se muestran posiciones.
- **El almacenamiento del navegador no se transfiere automáticamente al iPhone.** El formato es compatible, pero cada instalación tiene su propio almacenamiento. Si hay datos web reales para conservar, hay que implementar una exportación/importación o una migración mediante el backend.
- El borrado elimina los datos de este dispositivo. No elimina cuentas ni datos remotos.

## Backend: alcance real

El repositorio original era un frontend con mocks y sigue sin incluir servidor, cuentas ni modelo de visión. Dejar `EXPO_PUBLIC_API_URL` vacía activa una **demo explícita**: personas de ejemplo y resultado de escaneo determinista, con confianza 0 y aviso de simulación. El poll demo no inventa consumos nuevos.

```dotenv
EXPO_PUBLIC_API_URL=https://tu-api.example
EXPO_PUBLIC_UBER_CLIENT_ID=
APP_BUNDLE_IDENTIFIER=com.tuorganizacion.tomate
EAS_PROJECT_ID=
```

`EXPO_PUBLIC_*` termina dentro del bundle: no poner contraseñas, tokens privados ni claves del proveedor de IA.

| Operación              | Endpoint                               | Estado                                                                     |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Analizar foto          | `POST /api/scan` con `{ photo, kind }` | Adaptador conectado al escaneo                                             |
| Buscar/refrescar grupo | `GET /api/groups/:code`                | Conectado, refresco cada 45 s mientras se ve la pantalla y al reanudar     |
| Crear grupo            | `POST /api/groups` con `{ name }`      | Contrato propuesto, requiere implementación del servidor                   |
| Publicar un registro   | `POST /api/groups/:code/tragos`        | Función `pushTrago` conservada; pendiente de integrar con identidad/sesión |

**Agregar, deshacer, cerrar noche y borrar datos operan localmente. La sincronización entre usuarios no está implementada.** Antes de habilitar grupos reales hay que definir e integrar autenticación, pertenencia al grupo, consentimiento, identificador del usuario actual (para no duplicarlo en la lista), creación/cierre de noches, idempotencia, eliminaciones y reintentos offline. No basta con cambiar la URL para tener el producto conectado completo.

El análisis envía JPEG con ancho máximo de 640 px y calidad 0,7, codificado como data URL. La foto no se envía si se usa entrada manual. Los errores HTTP, tiempo de espera, resultados inválidos y respuestas 204 tienen manejo explícito. Revisar contrato de `ScanResult` y `Group` en `src/lib/types.ts`.

## Estimaciones

Se conserva la lógica existente en `src/lib/alcohol.ts`: gramos = ml × (% vol / 100) × 0,789; distribución de Widmark; absorción lineal de 20 minutos y eliminación de 0,15 ‰ por hora desde el primer registro. Es un modelo simplificado heredado, **no validado clínicamente**. No contempla todas las diferencias individuales ni sesiones separadas por pausas largas.

El campo legado `peakBac` en el historial representa la carga teórica acumulada sin eliminación; no es un pico medido ni observado. No se muestra como medición. Cerrar la noche reinicia el registro visible, pero no significa que el alcohol haya desaparecido del organismo. Antes de publicar corresponde revisar las estimaciones y las afirmaciones del producto.

## iOS / TestFlight / App Store

Ver [la guía de publicación](docs/IOS_RELEASE.md). Se incluyen `app.config.ts`, perfiles EAS, textos de cámara y ubicación en español, splash, ícono de 1024 px y proyecto regenerable con Expo.

Los identificadores por defecto son de desarrollo. Elegir el bundle ID real, vincular el proyecto EAS y configurar Apple Developer antes de generar un build firmado. No se realizó ninguna publicación ni carga a App Store Connect.

## Verificación de esta migración

- TypeScript sin errores. `npm run typecheck` valida dos configuraciones: `tsconfig.json` para la app y `tsconfig.tests.json` para los tests. Están separadas porque TypeScript 6 dejó de incluir `@types/node` automáticamente y los tests importan `node:test`; el código de la app no debe ver tipos de Node, para que un `Buffer` o un `fs` no compile como válido.
- 8 pruebas de estado, hidratación/legado, almacenamiento corrupto, orden de escrituras, absorción, API, mocks y concordancia de plurales.
- Expo Doctor: 20/21 controles. El único que falla es «native tooling versions», porque en esta Mac no está instalado CocoaPods; no depende del proyecto.
- Exportación de bundles de iOS, Android y web.
- Generación del proyecto iOS sin instalar Pods ni firmar.
- Recorrido completo de los flujos con React Native Web en tamaño móvil: calibración con el bloqueo de 18+, grupo, registro y deshacer, escaneo con carga manual, cierre de noche, historial y persistencia tras recargar. No sustituye pruebas en iPhone.

En esta Mac no está instalado Xcode: quedan pendientes compilación nativa, cámara física, permisos del sistema, compartir/Uber en dispositivo y TestFlight. Ver matriz de pruebas manuales en la guía.
