# Entrega 5 — Frontend Angular — JYAA Grupo 1

Cliente SPA en **Angular 19** integrado al REST Jersey de la Entrega 4.  
El React de la raíz del repo **no se modifica**; esta entrega vive en `frontend/`.

---

## Requisitos

- Node.js LTS (18+)
- npm
- Backend desplegado en grupo1 (para dev con proxy o producción)

---

## Cómo levantar Angular para probar

### Opción A — Desarrollo local (recomendada)

```bash
cd frontend
npm install
npm start
```

- Abrís: **http://localhost:4200**
- Usa `apiUrl: '/api'` en `src/environments/environment.ts`
- El **proxy** (`proxy.conf.json`) reenvía `/api` → `https://grupo1.jyaa-ci.linti.unlp.edu.ar`
- No necesitás Tomcat local si el proxy apunta a grupo1

### Opción B — Contra grupo1 con CORS

```bash
npm run start:cors
```

- Usa `environment.cors.ts` (URL absoluta de grupo1, sin proxy)
- Requiere que el backend con filtros CORS esté deployado en GitLab

### Opción C — Producción (post `git push gitlab main`)

- App: **https://grupo1.jyaa-ci.linti.unlp.edu.ar/**
- API: **https://grupo1.jyaa-ci.linti.unlp.edu.ar/api/health**
- Swagger: **https://grupo1.jyaa-ci.linti.unlp.edu.ar/swagger-ui/**
- Angular y API en el **mismo host** (sin CORS)

### Build local (verificar compilación)

```bash
npm run build
```

En producción el WAR empaqueta `dist/jyaa-frontend` junto al backend (ver `Dockerfile` en la raíz).

---

## Estructura relevante

```
frontend/src/app/
  auth/           LoginService, guards (auth, rol, selección perfil)
  servicios/      HttpClient → REST (/api/...)
  pages/          Pantallas por rol (admin, participante, etc.)
  components/     archivo-link (PDFs vía blob)
  utils/          mensajeErrorApi, formatFechaActividad
  app.routes.ts   Rutas y menús por perfil
```

---

## Rutas principales

| Ruta | Perfil | Función |
|------|--------|---------|
| `/` | Público | Inicio (login/registro o bienvenida logueado) |
| `/login` | Público | Iniciar sesión |
| `/registro` | Público | Alta participante (`POST /api/registro`) |
| `/seleccion-rol` | Multi-rol | Elegir perfil tras login |
| `/admin/*` | Administrador | Usuarios, pagos, actividades, trabajos |
| `/organizador/*` | OC | Asignaciones, promover evaluador |
| `/evaluador/*` | Evaluador | Aceptar/rechazar asignaciones |
| `/autor/*` | Autor | Crear/enviar trabajos |
| `/participante/*` | Participante | Cronograma, pago, trabajos (+ rol Autor) |

---

## Herramienta de verificación (como Swagger)

1. Abrí la app en el navegador
2. **F12 → Network** → filtrá por `api`
3. Cada acción en pantalla debe disparar la llamada REST correspondiente
4. Los errores de negocio muestran el mensaje del backend (`{ "error": "..." }`)
5. (Opcional) phpMyAdmin: **https://dbadmin.jyaa-ci.linti.unlp.edu.ar/** → base `jyaa2026_bd1`

---

## Usuarios demo

Password para todos: **`12345678`**

| Rol | Email |
|-----|-------|
| Administrador | `mantillabenja153@gmail.com` |
| Organizador científico | `rodriguezmantilla123@gmail.com` |
| Evaluador | `alci0483@gmail.com` |
| Autor | `autor.demo@jyaa.unlp.edu.ar` |
| Participante (multi-rol con Evaluador) | `lucasbudnik@hotmail.com.ar` |

---

## Guía de pruebas — Entrega 5

### PASO 0 — Público (sin login)

| Qué probar | Dónde | API |
|------------|-------|-----|
| Pantalla inicial | `/` | — |
| Solo login/registro si no hay sesión | `/` | — |
| Registro participante | `/registro` | `POST /api/registro` |
| Tras registro → login | `/login` | — |

**Ejemplo:** registrarse como participante (ej. leandro@gmail.com) → `/login` → panel participante.

El admin también puede dar de alta usuarios en `/admin/usuarios/nuevo` (`POST /api/usuarios`).

---

### PASO 1 — Login y sesión

| Qué probar | Dónde | Network / resultado |
|------------|-------|---------------------|
| Login OK | `/login` | `POST /api/login` → 200 |
| Credenciales incorrectas | `/login` | Mensaje: *Credenciales inválidas* |
| Cuenta deshabilitada | Admin inhabilita en detalle → login | *Cuenta deshabilitada* |
| Multi-rol → elegir perfil | Tras login → `/seleccion-rol` | `PUT /api/usuarios/{id}/roles` |
| Cambiar perfil | Header → menú o *Cambiar perfil* | mismo `PUT .../roles` |
| Inicio logueado | `/` | No aparece “Acceso / Iniciar sesión” |
| `/login` ya logueado | redirige al panel | — |
| Guard de rol | Participante va a `/admin` | Redirige a `/` |
| Salir | Header → Cerrar sesión | `sessionStorage` limpio |

**Tip coloquio:** no hay JWT; el rol activo vive en sesión (`rolActual`) y los **guards** bloquean rutas de otros perfiles.

**Multi-rol:** `lucasbudnik@hotmail.com.ar` → `/seleccion-rol` (Evaluador / Participante) o cambio desde el header.

---

### PASO 2 — Administrador

Login: `mantillabenja153@gmail.com` → `/admin`

| Pantalla | Ruta | API |
|----------|------|-----|
| Listado usuarios | `/admin/usuarios` | `GET /api/usuarios` |
| Nuevo usuario | `/admin/usuarios/nuevo` | `POST /api/usuarios` |
| Detalle / modificar / roles / activo | `/admin/usuarios/:id` | `GET/PUT /api/usuarios/{id}`, `.../roles`, `.../activo` |
| Pagos pendientes | `/admin/pagos` | `GET /api/pagos/pendientes`, `PUT .../validacion` |
| Todos los pagos (limpieza) | `/admin/pagos/todos` | `GET/DELETE /api/pagos` |
| ABM actividades | `/admin/actividades` | `GET/POST/PUT/DELETE /api/actividades` |
| Trabajos (limpieza) | `/admin/trabajos` | `GET/DELETE /api/trabajos` |

**Usuarios:** listar, alta, detalle, modificar datos, asignar roles, habilitar/inhabilitar, baja.

**Pagos (flujo recomendado):**
1. Participante registra pago + sube PDF en `/participante/pago`
2. Admin aprueba/rechaza en `/admin/pagos` (rechazo pide motivo)
3. Participante ve estado actualizado en `/participante/pago`
4. *Ver comprobante* abre el PDF vía `GET /api/archivos/{id}` (blob)

**Actividades:**
- Crear mesa temática (ej. Aula 101, 10:00–12:00)
- Editar sin conflicto
- Conflicto misma sala/horario → *Conflicto de horario en la sala...*
- Fin anterior al inicio → *La hora de fin debe ser posterior al inicio*
- Baja desde listado

---

### PASO 3 — Participante

Login: `lucasbudnik@hotmail.com.ar` o usuario registrado.

| Pantalla | Ruta | API |
|----------|------|-----|
| Estado de pago | `/participante/pago` | `POST /api/pagos`, `POST .../comprobante`, `GET .../usuario/{id}/estado` |
| Mi cronograma | `/participante/cronograma` | `GET/POST/DELETE /api/cronograma/{id}/actividades/{actividadId}` |
| Mis trabajos | `/participante/trabajos` | `POST /api/trabajos` (+ promoción a **AUTOR**) |

**Cronograma — conflicto de horarios personales:**
1. Admin crea actividad 1 (ej. 10:00–12:30) y actividad 2 superpuesta (11:00–13:00)
2. Participante agrega actividad 1 → OK
3. Agrega actividad 2 → *Conflicto de horario con la actividad: ...*
4. Quitar actividad del cronograma → `DELETE` en cronograma

**Trabajos desde participante:** al crear el primer trabajo el backend agrega rol **AUTOR**; subir PDF y **Enviar** igual que en `/autor/trabajos`.

---

### PASO 4 — Autor

Login: `autor.demo@jyaa.unlp.edu.ar` → `/autor/trabajos`

| Acción | API |
|--------|-----|
| Crear borrador | `POST /api/trabajos` |
| Subir PDF | `POST /api/trabajos/{id}/documento` |
| Enviar | `PUT /api/trabajos/{id}/enviar` → estado `ENVIADO` |

---

### PASO 5 — Organizador científico

Login: `rodriguezmantilla123@gmail.com`

| Acción | Ruta | API |
|--------|------|-----|
| Promover evaluador | `/organizador/promover` | `PUT /api/usuarios/{id}/promover-evaluador` |
| Asignar trabajo | `/organizador/asignaciones` | `POST /api/asignaciones-evaluacion` |
| Desasignar | listado asignaciones | `DELETE /api/asignaciones-evaluacion/{id}` |

**Preparación:** tener trabajos en estado `ENVIADO` (desde autor o participante).

**Errores esperados:** mismo evaluador dos veces → mensaje del backend en pantalla.

---

### PASO 6 — Evaluador

Login: `alci0483@gmail.com` o evaluador promovido → `/evaluador/asignaciones`

| Acción | API |
|--------|-----|
| Ver asignaciones | `GET /api/asignaciones-evaluacion?evaluadorId=...` |
| Aceptar / Rechazar | `PUT .../respuesta` `{ "aceptar": true/false }` |
| Ver PDF | link **PDF** → `/api/archivos/{id}` |

---

### PASO 7 — Recorrido coloquio (15–20 min)

```
1. / → registro o login
2. Admin → usuarios + actividades
3. Participante → pago + comprobante
4. Admin → aprobar pago
5. Participante → cronograma (+ probar conflicto)
6. Participante o Autor → crear + PDF + enviar trabajo
7. OC → promover + asignar evaluador
8. Evaluador → aceptar/rechazar
9. Multi-rol → /seleccion-rol + header
10. Deploy: https://grupo1.jyaa-ci.linti.unlp.edu.ar/
```

---

## Checklist Entrega 5

- [ ] `npm start` o URL grupo1 carga la SPA
- [ ] Registro + login + logout
- [ ] Selector `/seleccion-rol` y menú header
- [ ] Guards por rol
- [ ] Admin: usuarios, pagos, actividades, trabajos
- [ ] Participante: pago, cronograma, trabajos → Autor
- [ ] Autor: trabajo + PDF + enviar
- [ ] OC: promover + asignar
- [ ] Evaluador: aceptar/rechazar + PDF
- [ ] Errores del API visibles en pantalla
- [ ] PDFs (comprobante/trabajo) se abren correctamente

---

## Rama Git

```bash
git checkout -b entrega-5
# ... commit y push ...
git push -u gitlab entrega-5
git push -u origin entrega-5
```

---

## Documentación relacionada

- Swagger / pruebas API: `backend/GUIA-PRUEBAS-SWAGGER-ENTREGA4.txt`
- Deploy híbrido: `DEPLOY-CORS-NETLIFY.md` (raíz del repo)
- Práctica 8 Angular: `frontend/GUIA-PRACTICA-8.txt`

---

**Grupo 1 — JYAA 2026 — V Congreso Argentino de Agroecología**
