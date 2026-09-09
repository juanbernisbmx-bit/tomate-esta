# Publicar Tomate para iPhone

La migración técnica usa Expo Continuous Native Generation. `ios/` y `android/` son generados y están ignorados por Git; toda configuración permanente debe quedar en `app.config.ts` o en un plugin. Los recursos se regeneran desde `public/icon.svg` con `npm run assets:generate`.

## Preparar el proyecto del equipo

1. Elegir un bundle ID disponible en Apple Developer y cargarlo como `APP_BUNDLE_IDENTIFIER`. El valor `app.tomate.mobile` es solo el predeterminado para desarrollo.
2. Iniciar sesión en Expo con la cuenta del equipo y ejecutar `npx eas-cli init`.
3. Copiar el ID resultante a `EAS_PROJECT_ID`. El archivo dinámico ya lo expone en `extra.eas.projectId`.
4. Configurar estas variables también en los entornos EAS correspondientes; `.env` está ignorado y no debe contenerse en el repositorio.
5. Para distribución real, conectar el backend y terminar la identidad y sincronización descritas en README. No presentar los mocks como funcionalidad de producción.

Los comandos interactivos para Apple Developer/EAS deben ejecutarse con las cuentas y credenciales del equipo. No guardar contraseñas o certificados en el repositorio.

## Probar una app nativa

Con Xcode y CocoaPods instalados:

```bash
npm ci
npm run ios
```

Para generar archivos nativos sin compilar:

```bash
npx expo prebuild --platform ios --no-install
```

Expo SDK 57 regenera el directorio nativo por defecto: no guardar modificaciones manuales allí sin convertirlas en configuración reproducible.

Con EAS, después de vincular el proyecto:

```bash
npx eas-cli build --platform ios --profile development
npm start
```

El perfil `development` genera un cliente para dispositivos registrados. `simulator` produce un build para simulador; `preview` distribuye una app interna. Ninguno equivale a una publicación en App Store.

## Build para TestFlight

```bash
npm run typecheck
npm test
npm run doctor
npm run build
npm run build:ios
```

`build:ios` inicia un build EAS con distribución de tienda y número de build autoincremental. Requiere Apple Developer y firma válida. `npm run build` solamente genera bundles y no valida compilación Swift/Objective-C, Pods, firma o instalación.

Una vez creado el registro de la app en App Store Connect y validado el build:

```bash
npm run submit:ios
```

EAS Submit sube el binario a App Store Connect; completar los requisitos de TestFlight y la revisión de App Store es un paso posterior. Este repositorio no contiene Apple ID, Team ID, App Store Connect App ID ni certificados: se seleccionan/configuran con el equipo.

## Producto y ficha de revisión

- Eliminar cualquier contenido residual que incentive consumir más. La migración ya quitó carreras, posiciones, premios y mensajes de “punto justo”. La [regla 1.4.3 de Apple](https://developer.apple.com/app-store/review/guidelines/#physical-harm) prohíbe fomentar cantidades excesivas de alcohol; el cambio de lenguaje por sí solo no garantiza aprobación.
- Revisar la precisión, metodología y presentación de las estimaciones. Una foto estima el recipiente, no la graduación ni una medición real de alcohol en sangre. Revisar [seguridad física / información médica](https://developer.apple.com/app-store/review/guidelines/#physical-harm).
- Preparar política de privacidad y URL de soporte, responsable de tratamiento, retención/eliminación de datos y declaraciones de App Privacy acordes a lo que realmente transmita el backend. Si se agregan cuentas, implementar eliminación de cuenta además del borrado local.
- Completar el cuestionario vigente de clasificación por edad en App Store Connect según el contenido y los territorios. La confirmación 18+ de la app no fija la clasificación de Apple.
- Preparar capturas de iPhone de la app real, descripción, icono, notas para revisión y acceso al backend/cuenta de prueba si corresponde.
- El plugin de ubicación configura solo permiso durante el uso; no se pide acceso permanente, movimiento ni ubicación en segundo plano. No se pide micrófono ni fototeca.

## Matriz manual de dispositivo

| Caso                                              | Resultado esperado                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Primera apertura, pantalla pequeña y texto grande | Contenido legible, scroll y botones alcanzables; sin recortes por notch/teclado |
| Calibración                                       | Límites de peso/edad, confirmación 18+, sexo, volver pasos y cámara opcional    |
| Registro rápido, taps consecutivos, deshacer      | Un evento por tap; deshacer elimina el evento correcto                          |
| Vaso por preset y a medida                        | Se guarda como predeterminado; volumen/graduación correctos                     |
| Cerrar/abrir app                                  | Perfil, foto, grupo, registros e historial se conservan                         |
| Cámara permitida                                  | Preview trasero, toma JPEG, revisión/corrección y guardado                      |
| Cámara denegada/restringida                       | Carga manual disponible; Ajustes cuando corresponde                             |
| Cámara → segundo plano → primer plano             | Sesión liberada y reiniciada; no capturas duplicadas                            |
| Escaneo con red caída, timeout o JSON inválido    | Error recuperable, reintento y alternativa manual                               |
| Grupo con búsqueda lenta/código cambiado          | Nunca muestra una respuesta de un código anterior                               |
| Compartir cancelado                               | No borra ni cierra la noche                                                     |
| Cerrar noche                                      | Archiva una vez, limpia registros y conserva el vaso                            |
| Borrado local cancelado/confirmado                | Cancelar conserva; confirmar limpia y persiste el reset                         |
| Uber con GPS permitido/denegado/sin señal         | Enlace con coordenadas o `my_location`; fallback web si no hay app              |
| VoiceOver                                         | Botones etiquetados, controles accesibles y modal enfocado                      |

Referencias técnicas: [Expo SDK 57](https://expo.dev/changelog/sdk-57), [cámara](https://docs.expo.dev/versions/latest/sdk/camera/), [EAS Build iOS](https://docs.expo.dev/build-reference/ios-builds/), [EAS Submit iOS](https://docs.expo.dev/submit/ios/).
