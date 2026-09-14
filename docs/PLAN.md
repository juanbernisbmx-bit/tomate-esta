# Plan de trabajo — Tomate

- **Frontend:** este repo (`tomate-esta`). Armado y funcionando con datos mock.
- **Backend:** [`tomate-esta-backend`](https://github.com/juanbernisbmx-bit/tomate-esta-backend)
  — repo creado, todavía vacío. Spring Boot + Java.
- **Base de datos:** Postgres administrado por Supabase, proyecto `Tomate Esta`
  (`xtcjptgbvplbfpjpdegy`, Postgres 17, región `us-east-1`). Se usa **solo como Postgres** —
  nada de Supabase Auth, RLS ni Realtime: toda la seguridad y la lógica viven en el backend
  de Spring Boot. El frontend nunca habla con Supabase directamente, solo con la API propia.

División de personas: **Persona A = backend (Spring Boot)**, **Persona B = frontend**.

---

## 1. Stack del backend

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Lenguaje / framework | Java 21 + Spring Boot 3.x | Lo que ya definieron. |
| Build | Maven | Estándar, mejor soporte de ejemplos que Gradle para arrancar rápido. |
| Web | Spring Web (MVC clásico, no reactivo) | No hay necesidad de WebFlux para este volumen de tráfico; MVC es más simple de razonar entre dos personas. |
| Persistencia | Spring Data JPA + Hibernate | Estándar de facto en Spring. |
| Migraciones | **Flyway** | Las tablas se versionan como archivos SQL dentro del propio repo del backend (`src/main/resources/db/migration/`), no se tocan a mano desde el dashboard de Supabase. Así el esquema queda en git, no en la nube. |
| Seguridad | Spring Security + JWT | Ver sección 2. |
| **Otra tecnología: Redis** | Redis (Docker local, o Upstash/Redis Cloud en prod) | Dos usos concretos: **(a)** guardar el estado de los refresh tokens (rotación + revocación, ver abajo) y **(b)** limitar cuántos escaneos de IA hace cada usuario por día (una llamada a un modelo de visión cuesta plata; con un contador con TTL en Redis alcanza). |
| Llamada al modelo de visión | `RestClient` de Spring (síncrono, no hace falta reactivo) | Para pegarle a la API de un modelo de visión (Claude/GPT-4V) desde el endpoint de escaneo. |
| Documentación de API | springdoc-openapi (Swagger UI) | Para que el frontend siempre tenga el contrato actualizado sin preguntar. |
| Tests | JUnit 5 + Testcontainers (Postgres) | Tests de integración contra un Postgres real, no contra H2. |
| Otros | Lombok, Bean Validation (`jakarta.validation`) | Menos boilerplate, validación de DTOs declarativa. |
| Infra local | Docker Compose (Spring Boot + Redis; Postgres apunta directo a Supabase) | Para no depender de tener Postgres local. |

### Conexión a Postgres (Supabase)

En el dashboard de Supabase → **Project Settings → Database → Connect** hay tres modos de
conexión. Para Spring Boot (que ya trae su propio pool de conexiones con HikariCP) conviene
el **Session pooler**, no el Transaction pooler (puerto 6543) — el modo transacción de
PgBouncer rompe prepared statements de Hibernate si no se desactivan explícitamente. Con el
Session pooler funciona todo sin tocar configuración extra de Hibernate.

```yaml
# application-prod.yml (los valores reales van en variables de entorno, no hardcodeados)
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/postgres
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate   # el esquema lo maneja Flyway, no Hibernate
  flyway:
    enabled: true
```

La contraseña de la base la generó quien creó el proyecto de Supabase — está en el mismo
dashboard (Project Settings → Database) o se puede resetear ahí si no la tienen a mano.

---

## 2. Seguridad: JWT de dos tokens

El patrón que buscabas es **refresh token rotation con detección de reuso**. Así queda:

- **Access token**: JWT firmado, vida corta (**15 min**), stateless — no pega contra la base
  para validarse, solo se verifica la firma. Viaja en `Authorization: Bearer <token>`.
- **Refresh token**: string random opaco (256 bits, no es un JWT), vida larga (**30 días**).
  Se guarda en la tabla `refresh_tokens` **hasheado** (SHA-256), nunca en texto plano.

Cómo rota:

1. Login exitoso → se emiten los dos tokens. El refresh token queda en la DB con un
   `family_id` (identifica la "cadena" de refrescos de esa sesión).
2. Cuando el access token vence, el cliente llama a `POST /auth/refresh` con el refresh
   token. El backend: valida el hash contra la DB, **lo marca como usado**, emite un
   access token nuevo **y un refresh token nuevo** (mismo `family_id`).
3. **Detección de reuso**: si alguna vez llega un refresh token que ya estaba marcado como
   usado, quiere decir que alguien tiene una copia vieja (token robado) → se revoca **toda
   la familia** de tokens y se obliga a loguearse de nuevo.
4. Logout → se revoca el refresh token (y opcionalmente toda la familia).

Redis guarda dos cosas relacionadas con esto:
- Un set de `family_id` revocados, con TTL igual a la vida del refresh token más largo vivo
  (consulta O(1) en cada refresh sin ir a Postgres).
- Nada de contraseñas ni tokens en texto plano — eso vive solo en Postgres, hasheado.

```sql
create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  family_id uuid not null,
  token_hash text not null unique,      -- sha256(refresh_token)
  used boolean not null default false,
  revoked boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

Passwords: BCrypt (`PasswordEncoder` de Spring Security), nunca en texto plano ni siquiera
para el equipo.

---

## 3. Esquema de datos (Flyway, borrador)

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  nombre text not null,
  peso numeric not null check (peso between 30 and 300),
  edad int not null check (edad >= 18),
  sexo text not null check (sexo in ('H','M','X')),
  created_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- 4 caracteres, sin O/0/I/1
  name text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table tragos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  label text not null,
  ml numeric not null,
  kind text not null,                   -- cerveza | vino | espumante | sidra | trago | shot
  abv numeric not null,
  grams numeric not null,               -- ml * (abv/100) * 0.789 — calculado en el service, no confiar en el cliente
  via text not null check (via in ('boton','scan','preset')),
  created_at timestamptz not null default now()
);

create table nights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  peak_bac numeric not null,
  tragos_count int not null,
  grams numeric not null,
  puesto int,
  closed_at timestamptz not null default now()
);
```

**Importante:** `grams` (y por lo tanto el ‰) se recalculan **en el backend** a partir de
`ml`/`abv` al insertar el trago — nunca se confía en un número que mande el cliente. La
fórmula es la misma que ya está en el frontend (`src/lib/alcohol.ts`): sirve como referencia
exacta de qué constantes usar (`ELIMINATION_PER_HOUR = 0.15`, `ABSORPTION_MIN = 20`,
`R_FACTOR = { H: 0.68, M: 0.55, X: 0.615 }`, densidad del etanol `0.789`).

---

## 4. Endpoints que el backend expone

Esto es el contrato que Persona B va a consumir. Los primeros cuatro reemplazan uno a uno
las funciones que ya existen en `src/api/client.ts` del frontend.

| Método | Ruta | Reemplaza en el front | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | (nuevo, no existía) | no |
| `POST` | `/api/auth/login` | (nuevo) | no |
| `POST` | `/api/auth/refresh` | (nuevo) | no (usa el refresh token) |
| `POST` | `/api/auth/logout` | (nuevo) | sí |
| `GET` / `PUT` | `/api/me` | (nuevo — hoy el perfil es solo local) | sí |
| `POST` | `/api/groups` | "Crear un grupo nuevo" en `GroupJoin.tsx` | sí |
| `POST` | `/api/groups/{code}/join` | `fetchGroup` + unirse | sí |
| `GET` | `/api/groups/{code}` | `fetchGroup` / `pollGroup` (trae grupo + tabla calculada) | sí |
| `POST` | `/api/groups/{code}/tragos` | `pushTrago` | sí |
| `DELETE` | `/api/tragos/{id}` | el "deshacer" del toast (hoy solo local) | sí |
| `POST` | `/api/groups/{code}/rescue` | botón "Solicitar rescate" en `Home.tsx` (`notifyRescue`) | sí |
| `POST` | `/api/scan` | `analyzeGlass` | sí |
| `POST` | `/api/nights/close` | cerrar noche en `Profile.tsx`/`Recap.tsx` (hoy solo local) | sí |
| `GET` | `/api/nights` | historial de `Profile.tsx` | sí |

`GET /api/groups/{code}` devuelve el grupo **con la tabla ya calculada** (el ‰ de cada
miembro en ese instante), para que el frontend no tenga que traer los tragos crudos de
todo el grupo y recalcular. Esa cuenta va en un `LeaderboardService` del backend, con la
misma fórmula del punto 3.

### Tiempo real de la tabla

Para el MVP: el frontend sigue haciendo polling (ya está así, cada 45 s en `Rank.tsx`, solo
cambia la URL). **No hace falta WebSocket para arrancar.** Si después sobra tiempo, se puede
agregar `spring-boot-starter-websocket` con STOMP sobre `/topic/groups/{code}` para que el
backend empuje cuando alguien suma un trago — queda en el backlog (sección 6), no bloquea el
MVP.

---

## 5. Tareas del backend (Persona A)

### M0 — Esqueleto del proyecto
- [ ] `spring initializr`: Java 21, Maven, dependencias Web, Data JPA, Security, Validation,
      PostgreSQL Driver, Flyway, Lombok, springdoc-openapi.
- [ ] `docker-compose.yml` con Redis (Postgres queda remoto, en Supabase).
- [ ] `application.yml` con perfiles `local` y `prod`; credenciales de Supabase por variables
      de entorno, nunca commiteadas (`.env` en `.gitignore`).
- [ ] Endpoint `GET /actuator/health` (Spring Boot Actuator) para confirmar que levanta y que
      llega a la base.

### M1 — Auth y JWT de dos tokens
- [ ] Migración Flyway `V1__users_and_tokens.sql` (tablas `users`, `refresh_tokens`).
- [ ] `PasswordEncoder` (BCrypt), DTOs de registro/login con `jakarta.validation`.
- [ ] Generación/verificación de JWT (librería `jjwt` o Nimbus), claims mínimos (`sub`, `exp`).
- [ ] `POST /api/auth/register`, `POST /api/auth/login`.
- [ ] `POST /api/auth/refresh` con la rotación + detección de reuso de la sección 2.
- [ ] `POST /api/auth/logout` (revoca el refresh token / la familia).
- [ ] `SecurityFilterChain` de Spring Security: filtro que lee el `Authorization: Bearer`,
      valida el JWT y puebla el contexto de seguridad. Rutas de `/api/auth/**` públicas, el
      resto autenticado.
- [ ] Manejador global de excepciones (`@ControllerAdvice`) para devolver errores en un
      formato consistente (401 sin token, 403 sin permiso, 409 email duplicado, etc.).

### M2 — Perfil
- [ ] `GET /api/me`, `PUT /api/me` (peso/edad/sexo/nombre del usuario autenticado).

### M3 — Grupos
- [ ] Migración `V2__groups.sql` (`groups`, `group_members`).
- [ ] Generador de código de 4 caracteres sin ambigüedad (sin `O`/`0`/`I`/`1`), reintenta si
      choca con uno existente.
- [ ] `POST /api/groups` (crea y suma al creador como miembro), `POST /api/groups/{code}/join`.
- [ ] `GET /api/groups/{code}`: grupo + miembros + tabla calculada (ver `LeaderboardService`).

### M4 — Tragos y noches
- [ ] Migración `V3__tragos_and_nights.sql`.
- [ ] `LeaderboardService`: recalcula ‰ de cada miembro con la fórmula de la sección 3
      (mismo criterio que `src/lib/alcohol.ts` del frontend — no reinventar los números).
- [ ] `POST /api/groups/{code}/tragos`: valida `kind`/`ml`/`abv` contra rangos razonables
      (no confiar en el cliente), calcula `grams` en el servidor, inserta.
- [ ] `DELETE /api/tragos/{id}` (solo el dueño del trago puede borrarlo, y solo si es
      reciente — ej. últimos 5 minutos, para que el "deshacer" tenga sentido y no se pueda
      borrar historial viejo).
- [ ] `POST /api/nights/close`, `GET /api/nights`.

### M5 — Escaneo con IA
- [ ] Decidir el modelo de visión (Claude vision vía API, o el que prefieran) y guardar la
      API key como variable de entorno / secret, nunca en el repo.
- [ ] `POST /api/scan`: recibe `{ photoBase64, kind }`, arma el prompt, llama al modelo con
      `RestClient`, devuelve `{ ml, abv, confidence, vesselLabel, note }` (mismo contrato que
      `ScanResult` en `src/lib/types.ts` del frontend).
- [ ] Rate limit en Redis: contador `scan:{userId}:{fecha}` con TTL a medianoche, tope
      configurable (ej. 40 por día) → 429 si se pasa.
- [ ] Mientras esto no esté listo, puede devolver un resultado fijo/semi-random para no
      bloquear a Persona B (que sigue probando contra el mock del frontend de todas formas).

### M6 — Calidad y despliegue
- [ ] springdoc-openapi expuesto en `/swagger-ui.html` — mandarle el link a Persona B.
- [ ] Tests de integración con Testcontainers: registro+login+refresh, crear grupo y sumar
      tragos, cálculo del `LeaderboardService` con casos conocidos.
- [ ] `Dockerfile` multi-stage (build con Maven, runtime con JRE liviano).
- [ ] GitHub Actions: `mvn verify` en cada push/PR.
- [ ] Elegir dónde deploya (Railway/Render/Fly.io son las opciones más simples para arrancar
      con Spring Boot sin pelearse con infra).

---

## 6. Tareas del frontend (Persona B)

### Conectar contra la API real
- [ ] `VITE_API_URL` pasa a apuntar al backend de Spring Boot (no a Supabase).
- [ ] Implementar las llamadas reales dentro de `src/api/client.ts` (las firmas ya están
      definidas, solo hay que llenar los `fetch`): `analyzeGlass`, `fetchGroup`, `pollGroup`,
      `pushTrago`. Agregar las que faltan: `register`, `login`, `refresh`, `logout`,
      `getMe`/`updateMe`, `undoTrago` (hoy es 100% local), `closeNight` (idem), `getNights`.
- [ ] Extender el wrapper `apiFetch` para que, ante un 401, llame a `/api/auth/refresh`
      automáticamente y reintente una vez la request original antes de mandar al usuario al
      login.
- [ ] **Dónde guardar los tokens**: el access token en memoria (estado de React, no
      localStorage — si se recarga la página se pide uno nuevo con el refresh). El refresh
      token, lo ideal es que el backend lo mande como cookie `httpOnly` + `Secure` en vez de
      que el frontend lo maneje directamente (así un XSS no puede robarlo) — coordinar esto
      con Persona A antes de implementar el login, porque cambia si `fetch` necesita
      `credentials: 'include'` y cómo se arma el endpoint de refresh.

### Pantallas nuevas (hoy no existen)
- [ ] Login / registro — antes de `Welcome` o como parte del primer paso. Hoy `Onboarding`
      asume que ya hay "alguien" con perfil local; falta la puerta de entrada real.
- [ ] Pantalla/estado de error de red genérico (hoy nunca falla nada porque todo es mock).
- [ ] Loading states reales: el mock resuelve todo al toque o en 1,7 s fijos; con la API real
      van a variar los tiempos y puede haber timeouts — falta feedback visual acorde
      (spinners, estados "reintentando…").

### Mejoras generales (independientes del backend, se pueden hacer ya)
- [ ] **Tests**: hoy no hay ningún test. Arrancar con Vitest + Testing Library — lo más
      valioso primero es testear `src/lib/alcohol.ts` (funciones puras, fácil de cubrir con
      casos concretos) y el reducer de `src/state/store.tsx`.
- [ ] **Estados vacíos y de error** en general: qué se ve si el código de grupo no existe, si
      el grupo tiene un solo miembro, si se pierde la conexión a mitad del escaneo, etc. —
      hoy todos estos casos "funcionan" solo porque el mock nunca falla.
- [ ] **Accesibilidad**: revisar contraste de textos secundarios (hay bastante texto en
      `text-ink/50` y `/55` sobre fondo oscuro), tamaños de tap target en los steppers
      pequeños de `Profile.tsx` y `Onboarding.tsx`, `aria-label` en botones que son solo
      ícono.
- [ ] **Responsive**: hoy está pensado para el ancho de un teléfono dentro del marco de
      `Shell.tsx`; probar en pantallas más chicas (SE) y más grandes (Pro Max/tablet) que no
      se corte nada.
- [ ] **Cámara nativa**: cuando se empaquete con Capacitor, reemplazar el `getUserMedia` de
      `Scan.tsx` por `@capacitor/camera` (mejor calidad, permisos nativos del sistema).
- [ ] **Revisión de copys**: unificar mayúsculas/minúsculas y tono en los mensajes de error
      que se agreguen ahora que van a existir (hoy todos los textos son "felices" porque
      nunca hay un error real que mostrar).
- [ ] Pulir animaciones/transiciones entre pantallas si da el tiempo (hoy son cambios secos
      de un `screen` a otro en `App.tsx`).

---

## 7. Backlog (después del MVP)

- WebSocket/STOMP para que la tabla del grupo se actualice push en vez de poll.
- Sign in with Apple / Google.
- Push notifications ("Fer acaba de pasar 0,8 ‰").
- Guardar las fotos de los vasos (hoy alcanza con analizarlas y descartarlas).
- Rate limiting más fino (por IP además de por usuario) en `/api/scan` y `/api/auth/*`.
- Push notifications reales para `POST /api/groups/{code}/rescue` (botón "Solicitar rescate"):
  el frontend ya manda lat/lng del que pide ayuda, pero hoy nadie lo recibe porque no hay
  push configurado. Hace falta registrar el push token de Expo de cada usuario (tabla nueva,
  ej. `push_tokens`) y que el endpoint dispare una notificación a todos los miembros del grupo
  (Expo Push API o FCM/APNs directo). Sin esto el botón solo abre WhatsApp con la ubicación,
  que ya funciona hoy sin backend.
