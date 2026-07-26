# Guion de la presentación — Grupo 1

**Trabajo Final Integrador — JYAA 2026**
Sistema de gestión del V Congreso Argentino de Agroecología

Abrir `presentacion/index.html` en el navegador y presionar `F` para pantalla completa.
Atajos: `→` / `Espacio` avanzar, `←` retroceder, `?` ayuda, `Ctrl+P` exportar a PDF.

---

## Reparto y tiempos (20 minutos exactos)

Los tres hablan prácticamente lo mismo: **~6:35 / 6:45 / 6:40**.

| # | Diapositiva | Quién | Dura | Acum. |
|---|-------------|-------|------|-------|
| 1 | Portada (+ presentación breve del equipo) | **Benjamín** | 0:40 | 0:40 |
| 2 | Separador — Bloque 1 | Lucas | 0:10 | 0:50 |
| 3 | El problema real | Lucas | 0:50 | 1:40 |
| 4 | Cómo nos acercamos | Lucas | 0:50 | 2:30 |
| 5 | Usuarios y adoptantes | Lucas | 0:45 | 3:15 |
| 6 | Separador — Bloque 2 | Benjamín | 0:05 | 3:20 |
| 7 | Línea de tiempo | **Benjamín** | 0:35 | 3:55 |
| 8 | Entrega 1 — Maquetado | Alcides | 0:45 | 4:40 |
| 9 | Entrega 2 — Modelo | **Benjamín** | 0:45 | 5:25 |
| 10 | Relaciones del modelo | **Benjamín** | 0:40 | 6:05 |
| 11 | Entrega 3 — Persistencia | **Benjamín** | 0:50 | 6:55 |
| 12 | Entrega 4 — REST | **Benjamín** | 0:55 | 7:50 |
| 13 | Sesión con JWT | Lucas | 0:40 | 8:30 |
| 14 | Entrega 5 — Angular | Alcides | 0:50 | 9:20 |
| 15 | Entrega 6 — Sistema completo | Alcides | 0:45 | 10:05 |
| 16 | Arquitectura | Lucas | 0:25 | 10:30 |
| 17 | Teoría aplicada | Lucas | 0:25 | 10:55 |
| 18 | Separador — Bloque 3 | Lucas | 0:05 | 11:00 |
| 19 | Reparto del grupo | Lucas | 0:55 | 11:55 |
| 20 | Herramientas y CI | Lucas | 1:00 | 12:55 |
| 21 | Separador — Bloque 4 | Alcides | 0:05 | 13:00 |
| 22 | **Demo en vivo** | Alcides | 4:30 | 17:30 |
| 23 | Dificultades | **Benjamín** | 0:55 | 18:25 |
| 24 | Aprendizajes | los tres (0:20 c/u) | 1:00 | 19:25 |
| 25 | Cierre | Lucas | 0:35 | 20:00 |

**Total por persona:** Benjamín **~6:25** · Alcides **~6:55** · Lucas **~6:40**

> Sacamos la diapositiva de “integrantes” para ir más rápido al problema. Los nombres
> quedan en la portada; Benjamín los presenta ahí en una frase.

> El PDF de la cátedra sugiere 8 minutos para el cierre. Nosotros usamos ~4:30 de demo
> y ~2 de balance. Si la demo va fluida, extenderla; si algo falla, cortar en el paso 5 y
> pasar directo al balance.

**Regla de oro del ensayo:** cada uno cronometra **su** bloque por separado antes del
ensayo completo. El 90 % de los grupos se pasa de tiempo en el Bloque 2, que es el más denso.

---

## Bloque 0 — Apertura (Benjamín, 0:40)

**Diapositiva 1 — Portada**

Presentar al grupo en una frase y pasar al problema:

> Buenas tardes. Somos el Grupo 1 — Benjamín, Alcides y Lucas — y vamos a contarles cómo
> construimos el sistema de gestión del V Congreso Argentino de Agroecología. No es una
> demo de pantallas: es el relato de seis entregas y de las decisiones que tomamos.

---

## Bloque 1 — El problema (Lucas, ~2:30)

**Diapositiva 2 — Separador.** Sólo leerla y avanzar.

**Diapositiva 3 — El problema real.**

Hablarle al equipo organizador del congreso, que está en la sala:

> El congreso no es un formulario de inscripción. Son cinco procesos que corren en
> paralelo durante meses: inscripción y cobro, envío y evaluación de trabajos, armado
> del programa, comunicación y certificación. Hoy eso se coordina con planillas y
> listas de correo, y el costo es concreto: datos duplicados, plazos que se pasan y
> trabajos que se quedan sin evaluador.

**Diapositiva 4 — Cómo nos acercamos.**

Contar el método, no la lista. El punto fuerte es la tarjeta verde:

> La decisión que ordenó todo el proyecto fue no escribir las reglas del congreso en el
> código. El congreso tiene etapas con fechas y catálogos de ejes y modalidades, y todo
> eso lo configura el organizador. El sistema no sabe cuándo cierra el envío de trabajos:
> lo pregunta.

**Diapositiva 5 — Usuarios y adoptantes.**

No leer la tabla entera. Señalar los seis roles y detenerse en uno:

> El adoptante principal es el comité académico. Es quien hoy hace a mano la asignación
> de evaluadores, y es el que más gana con el sistema.

---

## Bloque 2 — Las seis entregas (7:40 · Benjamín, Alcides y Lucas)

**Diapositiva 6 — Separador** (Benjamín).

**Diapositiva 7 — Línea de tiempo** (Benjamín, 0:35).

> Cada entrega vivió en su propia rama y se integró a `main` sólo con el pipeline en
> verde. Nunca perdimos una entrega ya aprobada por estar trabajando en la siguiente.

**Diapositiva 8 — Entrega 1** (Alcides, 0:45).
Objetivo → herramientas → **la dificultad**. Rematar con:

> Maquetar nos hizo descubrir reglas que no estaban en el enunciado: qué pasa si dos
> evaluadores empatan, o si a un evaluador le toca su propio trabajo. Las anotamos y
> las llevamos al modelo en lugar de improvisarlas tres entregas después.

**Diapositiva 9 — Entrega 2** (Benjamín, 0:45).
El punto central es la entidad `AsignacionEvaluacion`:

> Una asignación no es una simple relación entre trabajo y evaluador. Tiene aceptación,
> rechazo, dictamen y desempate. Convertirla en entidad propia fue la decisión que
> sostuvo todo lo que vino después.

**Diapositiva 10 — Relaciones del modelo** (Benjamín, 0:40).
Recorrer las cuatro cajas rápido; detenerse en la agenda:

> Dos `@ManyToMany` encadenadas. Por eso validar que una actividad no se solape y que
> no supere el cupo del aula fue lo más difícil de toda la persistencia.

**Diapositiva 11 — Entrega 3** (Benjamín, 0:50).
Contar las tres dificultades reales, son las que muestran proceso:

> Listar las entidades a mano en `persistence.xml` porque Tomcat no escanea como un
> servidor Jakarta EE completo; pasar el `@Lob` a `LONGBLOB` porque los PDF no entraban;
> y escribir nuestras propias migraciones SQL porque `hbm2ddl` en modo `update` agrega
> columnas pero nunca las corrige.

**Diapositiva 12 — Entrega 4** (Benjamín, 0:55).
Es la diapositiva más densa: nombrar los grupos, no cada anotación.

> Jersey para los recursos, CDI con Weld para inyectar los servicios, filtros para
> autenticación y CORS, y ExceptionMappers para que un error de negocio llegue al
> usuario como un mensaje y no como un stack trace.

**Diapositiva 13 — JWT** (Lucas, 0:40).
El gancho es la limitación del token:

> Un token es una foto del momento en que se emitió. Si el administrador te inhabilita
> la cuenta, el token viejo seguiría siendo válido cuatro horas. Por eso el filtro valida
> la firma pero vuelve a leer los roles y el estado desde la base en cada request.

**Diapositiva 14 — Entrega 5** (Alcides, 0:50).
Las cuatro dificultades son muy concretas; contarlas como anécdotas cortas.

**Diapositiva 15 — Entrega 6** (Alcides, 0:45).
Enumerar lo que se sumó sin leer todo, y rematar con la verificación del WAR:

> Nos pasó que el contenedor se desplegaba con un frontend viejo por la caché de Docker.
> Ahora el Dockerfile abre el WAR y verifica que adentro esté el frontend correcto. Si no
> está, la imagen no se construye. El error aparece en el pipeline, no en una demo.

**Diapositiva 16 — Arquitectura** (Lucas, 0:25). Recorrerla de arriba abajo, en una frase.

**Diapositiva 17 — Teoría aplicada** (Lucas, 0:25). No leerla. Decir:

> Cada tema de la cursada terminó en un archivo concreto del proyecto. No quedó ninguno
> afuera; el trabajo final los integró a todos en un mismo despliegue.

---

## Bloque 3 — Organización del grupo (Lucas, 2:00)

**Diapositiva 18 — Separador.**

**Diapositiva 19 — Reparto.** El mensaje es el cambio de criterio:

> Arrancamos dividiéndonos por capas y chocábamos todo el tiempo en los mismos archivos.
> A partir de la Entrega 3 cada uno se hizo dueño de un flujo completo, de la entidad JPA
> hasta la pantalla. Bajó los conflictos casi a cero y nos obligó a aprender todas las capas.

**Diapositiva 20 — Herramientas y CI.** Mostrar la captura del pipeline.

> Un push a `main` reconstruye Angular, arma el WAR, verifica su contenido, baja el
> contenedor viejo y levanta el nuevo detrás de Traefik con certificado automático.

---

## Bloque 4 — Demo en vivo (Alcides, 4:00)

**Diapositiva 21 — Separador.**
**Diapositiva 22 — Guion de la demo.** Mostrarla dos segundos y pasar al navegador.

### Preparación (hacerla ANTES de entrar a la sala)

- Cuatro pestañas abiertas y logueadas: **asistente**, **admin**, **comité**, **evaluador**.
- Congreso con las etapas de envío, evaluación e inscripción **vigentes**.
- Un trabajo en borrador listo para enviar y un PDF a mano en el escritorio.
- Aranceles publicados y al menos un aula con cupo y coordenadas cargadas.
- Contraseña de los usuarios demo: `12345678`.

### Recorrido (4 minutos, sin volver atrás)

| # | Rol | Acción | Se demuestra |
|---|-----|--------|--------------|
| 1 | Público | Home → Programa con el mapa de aulas | Acceso sin sesión, Leaflet, datos reales |
| 2 | Asistente | Inscripción por pasos + comprobante de transferencia | Wizard, subida de archivo, reglas por categoría |
| 3 | Admin | Aprueba el pago | Cambio de estado y notificación al asistente |
| 4 | Autor | Envía el trabajo con el PDF | Validaciones y cambio a estado `ENVIADO` |
| 5 | Comité | Precheck + asigna dos evaluadores | Cupos por eje y recusación del trabajo propio |
| 6 | Evaluador | Acepta y emite el dictamen | Flujo de evaluación por pares completo |
| 7 | Autor | Ve la devolución | El circuito cierra en el mismo lugar donde empezó |

**Frase de cierre de la demo:**

> Lo importante no es cada pantalla por separado, sino que la acción de un rol cambia
> inmediatamente lo que ve otro rol, sobre la misma base de datos.

**Plan B:** si la red falla, pasar al video de respaldo (`img/demo-respaldo.mp4`) sin
disculparse ni perder tiempo: *"lo tenemos grabado, así no gastamos tiempo de la charla"*.

---

## Bloque 4 — Balance y reflexión (2:00)

**Diapositiva 23 — Dificultades** (Benjamín, 0:55). Elegir **dos** de las cinco y contarlas
bien; el resto queda en pantalla para quien quiera leerlo.

**Diapositiva 24 — Aprendizajes** (los tres, 20 segundos cada uno). Una tarjeta cada uno:

- **Benjamín** → *"El modelo de datos es la decisión más cara"*.
- **Alcides** → *"Configurable le gana a hardcodeado"*.
- **Lucas** → *"Las capas no son burocracia"* (el cambio de React a Angular sin tocar el backend)
  y *"desplegar temprano y seguido"*.

Cerrar reconociendo lo que falta —contraseñas hasheadas, `@RolesAllowed`, Bean Validation
y tests en el pipeline—. Mostrar el límite propio suma; ocultarlo, no.

**Diapositiva 25 — Cierre** (Lucas, 0:20). Dejarla en pantalla durante las preguntas: tiene la URL de la app.

---

## Preguntas que probablemente nos hagan

| Pregunta | Respuesta corta |
|----------|-----------------|
| ¿Por qué JWT y no `HttpSession`? | Para que el backend no guarde estado: simplifica correr en contenedores y servir a un cliente de otro origen. Y como el token no refleja cambios de rol, el filtro relee roles y estado desde la base en cada request. |
| ¿Las contraseñas están hasheadas? | No, y lo sabemos. Es lo primero de la lista de pendientes: BCrypt en el alta y en el login. |
| ¿Por qué DAO propio y no Spring Data? | Porque la cursada trabaja sobre Jakarta EE puro. `GenericDAO` + `AbstractJpaDAO` nos dio el CRUD compartido sin sumar un framework fuera del alcance de la materia. |
| ¿Cómo evitan que un evaluador revise su propio trabajo? | La recusación está en el servicio: el trabajo propio no aparece en el listado del comité ni puede asignarse, evaluarse ni dictaminarse. |
| ¿Qué pasa si dos evaluadores empatan 1 a 1? | El trabajo queda en evaluación y se habilita un tercer evaluador. El empate se guarda en la base para que quede trazado. |
| ¿Cómo manejan los archivos? | Se guardan como BLOB en la tabla `archivos` y se sirven por `GET /api/archivos/{id}`; el cliente los abre como blob con el token. |
| ¿Hay tests automatizados? | Hay un servlet de pruebas de ABM sobre los DAOs y verificaciones del WAR dentro del pipeline, pero no tests unitarios. Es el otro pendiente. |
| ¿El sistema soporta otra edición del congreso? | Sí: etapas, ejes, modalidades, aranceles y cupos son configurables desde la aplicación, sin tocar código ni volver a desplegar. |

---

## Checklist del día

- [ ] Las 7 capturas colocadas en `presentacion/img/` (ver `CAPTURAS.md`)
- [ ] Deck exportado a PDF como respaldo (`Ctrl+P` → Guardar como PDF, horizontal, sin márgenes)
- [ ] Video de respaldo de la demo grabado
- [ ] Pipeline en verde y la app respondiendo en `grupo1.jyaa-ci.linti.unlp.edu.ar`
- [ ] Datos de demo cargados y sesiones abiertas por rol
- [ ] Ensayo completo cronometrado (al menos dos veces)
- [ ] Presentación subida al aula virtual **y** al repositorio de GitLab de la cátedra
