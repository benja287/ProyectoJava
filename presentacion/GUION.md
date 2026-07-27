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
| 9 | E2 — Qué diseño / decisiones | **Benjamín** | 0:50 | 5:30 |
| 10 | Diagrama completo (zoom) | **Benjamín** | 0:45 | 6:15 |
| 11 | E2 — Factory / SOLID (mapa) | **Benjamín** | 0:40 | 6:55 |
| 12 | Entrega 3 — Persistencia | **Benjamín** | 0:45 | 7:40 |
| 13 | Entrega 4 — REST + CDI | **Benjamín** | 0:50 | 8:30 |
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

Nombres ya están en pantalla. Presentar al grupo en una frase y pasar al problema:

> Buenas tardes. Somos el Grupo 1 — Benjamín, Alcides y Lucas — y vamos a contarles cómo
> construimos el sistema de gestión del V Congreso Argentino de Agroecología. No es una
> demo de pantallas: es el relato de seis entregas y de las decisiones que tomamos.

---

## Bloque 1 — El problema (Lucas, ~2:30) · diapositivas 2 a 5

> **Acordado hasta acá con el grupo.** Las diapositivas 1–5 ya están cerradas en contenido;
> el resto se sigue ajustando.

**Diapositiva 2 — Separador (“El problema”).**  
Leer el título y la línea de abajo (“qué congreso…, cómo nos acercamos y para quién”) y avanzar.

**Diapositiva 3 — El problema real**  
(“Un congreso no es un formulario: son cinco procesos en paralelo”)

Hablarle al equipo organizador del congreso, si está en la sala. No leer las seis tarjetas:
señalar que son procesos en paralelo y cerrar con el costo.

> El congreso no es un formulario de inscripción. Son cinco procesos que corren juntos:
> inscripción y cobro, envío y evaluación de trabajos, armado del programa, comunicación
> y certificación. Hoy eso se coordina con planillas y mails, y el costo es concreto:
> datos duplicados, plazos que se pasan y trabajos sin evaluador.

**Diapositiva 4 — Cómo nos acercamos al problema**  
(Entrega 1 · tres puntos · referencia: *Análisis del Problema Sobre el V Congreso*)

Contar el recorrido en orden:

1. **Congreso real** — primer encuentro 2027 + ediciones anteriores (crecimiento,
   problemas con mails/planillas).  
2. **Primero fijo, después configurable** — tres días; plazos del momento; después
   plazos del comité.  
3. **Tareas a mano → roles → épicas (módulos) → HU → prototipo**  
   Primero: hoy distintas personas hacen tareas a mano.  
   Después: roles concretos.  
   Después: solución por **épicas** (= grandes módulos del sistema) e **historias de
   usuario** (= qué quiere hacer cada rol y para qué).  
   Después: prototipo solo de interfaz. **Conecta con la diapositiva 5.**

> Decir “épicas” está bien (quien conoce el término lo reconoce). Siempre traducir en
> la misma frase: “épicas, o sea módulos” / “historias de usuario: qué quiere hacer
> cada rol”. Así sirve para los dos públicos.

Frase oral sugerida:

> Hoy esas tareas se hacen a mano: inscribir, cobrar, enviar trabajos, evaluar, armar
> el programa. Eso nos mostró que no hay un usuario genérico, sino roles. Con esa base
> armamos la solución por épicas —grandes módulos del sistema— y dentro de cada una
> escribimos historias de usuario. Antes de codear las recorrimos en un prototipo.

**Diapositiva 5 — Usuarios y adoptantes**  
(tabla de 6 roles · “qué hace” detallado + “por qué le importa”)

No leer toda la columna del medio. Entrada:

> Los roles salieron de las tareas que hoy se hacen a mano. Armamos la solución por
> épicas e historias de usuario.

Después:

1. Recorrer los seis roles **nombrando 2 o 3 acciones clave** de cada uno (el resto
   queda en pantalla). Si alguien de la organización está en la sala, en Admin explicar:
   *aranceles = cuánto paga cada categoría* y *arqueo = control de lo cobrado en el día*.
   En Comité decir **prevalidación de trabajos**, no “precheck”.  
2. En cada uno, rematar con la columna **por qué le importa**.  
3. Detenerse un segundo más en el **comité académico** (adoptante principal).

Frase de cierre:

> El adoptante principal es el comité: hoy hace a mano precheck, asignaciones y
> desempates. Al resto de roles el sistema les da un lugar claro en el mismo flujo.

---

## Bloque 2 — Las seis entregas (7:40 · Benjamín, Alcides y Lucas)

**Diapositiva 6 — Separador** (Benjamín).

**Diapositiva 7 — Línea de tiempo**

| # | En criollo |
|---|------------|
| 1 | Informe de análisis + PDF de maquetado (prototipo React) |
| 2 | **POJO** = clase Java simple del dominio + diagrama |
| 3 | Rama `entrega-3`: **JPA** + **DAO** + **MySQL** (motor BD). Primer REST con Jersey aún **mezclando capas** (recursos → DAOs a mano) |
| 4 | Rama `entrega-4`: API con capas limpias — Jersey + **CDI** + JWT + Swagger |
| 5 | Rama `entrega-5`: **SPA Angular** habla con esa API |
| 6 | Todo junto y desplegado |

> Cada entrega en su rama; a `main` solo con el pipeline en verde.

**Diapositiva 8 — Entrega 1 (HU)**

Productos: informe de análisis + maquetado. Nombrar las HU clave (no todas):

> HU de entrada (registro/login), inscripción y validación de pago, envío de trabajo,
> dictamen del evaluador, programa del admin y agenda personal. Salen del análisis.

Cerrar con la dificultad (empate / trabajo propio → anotadas y al modelo E2).

**Diapositiva 8b — Maquetado 1/2** (HU-01, HU-06, HU-07)  
Tres capturas grandes: registro, inscripción+comprobante, admin aprueba/rechaza.

**Diapositiva 8c — Maquetado 2/2** (HU-11, HU-12, HU-13/14)  
Tres capturas grandes: envío de trabajo, dictamen evaluador, programa.

**Diapositiva — ¿Cuál es nuestro diseño?**

> Diseño = modelo de objetos del dominio (POJOs). Ejemplo: Trabajo,
> AsignacionEvaluacion, Evaluacion. Todavía no hay MySQL.
> Problema: al apagar el server se pierde. ¿Quién guarda? → el DAO.

**Diapositiva — Por qué DAOs**

> DAO es un patrón, no magia de JPA. En el código: interfaz + impl
> (`UsuarioDAO` / `UsuarioDAOImpl`) cuya única responsabilidad es
> guardar/buscar/actualizar/borrar UNA entidad. JPA es la herramienta
> que usa el DAO. Evitamos SQL dentro de Usuario/servlet.
> Cadena conceptual: HU → clase → entidad JPA →
> tabla → DAO → Factory → CDI en E4.

**Diapositiva — Diagrama (zoom)** — igual que les gustó.
> Al hacer zoom: cada caja con id ≈ un DAO en E3.

**Diapositiva — Una caja → un DAO**

> Tabla Usuario/Trabajo/Pago → sus DAOs. GenericDAO = CRUD común.
> Factory = único lugar que crea los DAOs (no new Impl en cada pantalla).
> Cierre: JPA convierte objeto↔fila; DAO pide guardar/buscar; Factory centraliza la creación.

**Diapositiva — Entrega 3** (`entrega-3`)

> Persistimos el modelo E2. Factory + DAO + JPA. REST aún con new/factory
> (capas mezcladas) → se limpia en E4.

**Diapositiva — Entrega 4** (`entrega-4`)

> Acá entra SOLID DIP: Resource → Service → DAO con CDI/@Inject.
> Ya no DAOFactory desde el REST. Jersey + JWT + Swagger.

**Diapositiva 13 — JWT**

> El token es una foto: el filtro relee roles y estado desde la base en cada request.

**Diapositiva 14 — Entrega 5** (`entrega-5`)

> El prototipo React de la E1 se reemplazó por Angular contra la API real de la E4.

**Diapositiva 15 — Entrega 6**

> Dockerfile verifica el WAR; pipeline en verde = app actualizada.

**Diapositiva 16 — Arquitectura**

> Contar el arco: primero capas mezcladas (E3), después CDI (E4), hoy el diagrama.

**Diapositiva 17 — Teoría aplicada**

> Cada tema de la cursada quedó en un archivo concreto; CDI aparece en la Entrega 4.

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
