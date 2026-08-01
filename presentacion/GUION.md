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
| 12 | E3 — Objetivo + conceptos + herramientas | **Benjamín** | 0:55 | 7:50 |
| 13 | E3 — JPA + DAO + dificultades | **Benjamín** | 0:55 | 8:45 |
| 14 | Entrega 4 — REST + CDI | **Benjamín** | 0:45 | 9:30 |
| 15 | Entrega 5 — Angular | Alcides | 0:50 | 10:20 |
| 16 | Entrega 6 — Sistema completo | Alcides | 0:45 | 11:05 |
| 16 | Arquitectura | Lucas | 0:30 | 11:00 |
| 17 | Separador — Bloque 3 | Lucas | 0:05 | 11:05 |
| 18 | Reparto del grupo | Lucas | 0:55 | 12:00 |
| 19 | Herramientas y CI | Lucas | 1:00 | 13:00 |
| 20 | Separador — Bloque 4 | Alcides | 0:05 | 13:05 |
| 21 | **Demo en vivo** | Alcides | 5:00 | 18:05 |
| 22 | Aprendizajes | los tres (0:25 c/u) | 1:15 | 19:20 |
| 23 | Cierre | Lucas | 0:40 | 20:00 |

> La diapositiva de **trazabilidad / 14 clases teóricas** está fuera del deck por ahora.

**Total por persona:** Benjamín **~5:30** · Alcides **~7:25** · Lucas **~7:05**

> Sacamos la diapositiva de “integrantes” para ir más rápido al problema. Los nombres
> quedan en la portada; Benjamín los presenta ahí en una frase.

> El PDF de la cátedra pide demo en vivo + aprendizajes. Las dificultades técnicas
> ya salen dentro de cada entrega (E3, E5, E6); no hace falta repetirlas en una tabla.
> Si la demo va fluida, extenderla.

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
| 4 | Rama `entrega-4`: API con capas limpias — Jersey + **CDI** + Swagger |
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

**Diapositiva — E3 · 1/7 Objetivo**

> Modelo E2 → datos que no se pierden. Roadmap de 6 slides. CDI = E4.

**Diapositiva — E3 · 2/7 Conceptos**

> Sin código ni nombres de clases. WAR/Tomcat/Jakarta = empaquetar y ejecutar.
> Ciclo de vida = arranque (conectar BD + datos iniciales) y apagado limpio.
> Servlet = responsable por URL. Cliente–servidor + JSON vs página para humanos.
> Persistencia OO = objetos + capa que traduce a tablas.

**Diapositiva — E3 · 3/7 Herramientas (flujo A→D)**

> A Maven arma WAR · B Hibernate+MySQL · C Gson+Logback · D Docker/CI/Traefik.
> No es lista: es cómo las usamos en cadena.

**Diapositiva — E3 · 4/7 JPA**

> Entidad = ficha/tabla. Relaciones del diagrama. persistence.xml.
> EMF una vez; EM por operación; transacción commit/rollback.

**Diapositiva — E3 · 5/7 DAO + Factory**

> Por qué no SQL en el Servlet. GenericDAO→AbstractJpaDAO→Impl.
> Factory un solo lugar. Ejemplo POST /api/trabajos paso a paso + /test-persistencia.

**Diapositiva — E3 · 6/7 Dificultades → E4**

> Unknown entity; lazy; capas mezcladas → E4:
> Resource (puerta HTTP) · Service (aplicación) · DAO (infraestructura) + dominio limpio.
> Remate: la captura de la siguiente diapositiva muestra el FALLO real.

**Diapositiva — E3 · 7/7 Evidencia `/test-persistencia`**

> Salida legible del servlet (misma info que la captura): 13 OK + 1 FALLO en Actividad.trabajos (lazy).
> Honestidad académica: la batería detectó el hueco; no todo salió perfecto.

**Diapositiva — E4 · 1/13 Puente Práctica 6**

> Mismo flujo POST → Tomcat → Jersey → Jackson → DAO → Hibernate.
> Problema: Resource dependía de UsuarioDAOImpl concreta.

**Diapositiva — E4 · 2/13 Arquitectura en capas**

> Presentación / Servicio / Dominio / Infraestructura.
> Qué sí y qué no sabe UsuarioResource. DTOs (qué son, entrada/salida, protegen el contrato API).

**Diapositiva — E4 · 3/13 DIP**

> Alto nivel (Resource, Service) y bajo nivel (DAOImpl). Interfaz UsuarioDAO en el medio.

**Diapositiva — E4 · 4/13 DI**

> Constructor, field, setter. Cómo Weld elige el bean. Field injection en esta entrega.

**Diapositiva — E4 · 5/13 IoC**

> Antes: el programador decide cuándo. Ahora: Weld. Inversión = el control pasó al framework.
> DI = qué pieza; IoC = cuándo crearla/destruirla.

**Diapositiva — E4 · 6/13 CDI y Weld (1/2)**

> Framework concreto: CDI = estándar (solo reglas); Weld = motor.
> Escaneo de scopes + beans.xml annotated. Resource bean + jersey-cdi1x-servlet.

**Diapositiva — E4 · 7/13 CDI y Weld (2/2)**

> @RequestScoped con ejemplos usuarios/pago. @ApplicationScoped + Producer.
> Puente: qué bean entrega @Inject.

**Diapositiva — E4 · 8/13 EntityManager**

> @Inject (clase o interfaz). Historia del pago a medias → atomicidad.
> EntityManagerProducer: commit/rollback de los tres DAOs juntos.

**Diapositiva — E4 · 9/13 Arranque JPA**

> Por qué no @PostConstruct/@PreDestroy. ServletContextListener / JpaBootstrapListener.
> EMF (una vez) vs EM (por petición).

**Diapositiva — E4 · 10/13 Flujo A–C**

> Historia cotidiana + técnica: formulario → Weld arma el equipo → Service valida.

**Diapositiva — E4 · 11/13 Flujo D–E**

> Guardar en la base. Bifurcación: ¿email ya existía? 400 vs DTO/201.

**Diapositiva — E4 · 12/13 Swagger**

> @Tag / @Operation / @ApiResponse. OpenApiResource → openapi.json → UI en /swagger-ui/.
> Verificación: GET en la misma pantalla después del POST.

**Diapositiva — E4 · 13/13 Evidencia**

> Qué pedía E4: API REST + CDI en capas + MySQL + Swagger + DTOs + archivos.
> Capturas reales `/swagger-ui/`: tag Usuarios + tag Login (`img/e4-swagger.png`, `img/e4-swagger-login.png`).

**Diapositiva — Entrega 5** (`entrega-5`)

> El prototipo React de la E1 se reemplazó por Angular contra la API real de la E4.

**Diapositiva — E5 · 1/11 Objetivo**

> Angular en el navegador habla con Java en otro servidor.

**Diapositiva — E5 · 2/11 CORS**

> Origen A localhost:4200 vs origen B grupo1. Regla del navegador, no de Angular/Java.

**Diapositiva — E5 · 3/11 Desarrollo**

> Forma 1 esconde el cruce (proxy); Forma 2 deja ver el cruce (CORS real). Ninguna es producción.

**Diapositiva — E5 · 4/11 Permiso CORS**

> Solo Forma 2: preflight OPTIONS + CorsConfig / CorsRequestFilter / CorsResponseFilter; ejemplo login.

**Diapositiva — E5 · 5/11 Forma 3**

> Producción = entorno desplegado (grupo1) para quien usa el congreso; no localhost del programador.

**Diapositiva — E5 · 6/11 Objetivos**

> Cliente real, entender CORS, camino a producción en grupo1. Remate del “para qué” antes del detalle técnico.

**Diapositiva — E5 · 7/11 Consumo Angular**

> Listar usuarios: servicio + HttpClient + Observable; camino en prosa; piezas Angular; igual en las 3 formas.

**Diapositiva — E5 · 8/11 Conceptos Angular**

> DI `@Injectable`, router, guards, HttpClient/Observable; cierre conectando con CDI.

**Diapositiva — E5 · 9/11 Conceptos Java**

> Remate E3→E4→E5: Servlets→Jersey, CDI=`@Injectable`, filtros Jersey para CORS.

**Diapositiva — E5 · 10/11 Herramientas**

> Pedido real (Angular/HttpClient/Jersey) + armado/despliegue (Maven/Docker/Tomcat/CI/Traefik) + npm local.

**Diapositiva — E5 · 11/11 Dificultades**

> CORS vs Swagger; push obligatorio; fusión WAR en Docker.

**Diapositiva — E6 · 1/4 Objetivo**

> E5 = Angular habla con la API; E6 = producto completo + JWT + config + grupo1.

**Diapositiva — E6 · 2/4 Producto**

> Por rol: admin (aranceles/caja/cierre), comité (catálogos/cupos/desempate), autores/evaluadores/público.

**Diapositiva — E6 · 3/4 Seguridad y API**

> JWT + filtro + interceptor/guards; API ampliada; configurable sin redeploy.

**Diapositiva — E6 · 4/4 Despliegue**

> WAR único multi-stage; dificultad caché Docker + verificación en Dockerfile.

**Diapositiva — Arquitectura**

> Arco E3→E6 + diagrama. Remate: el trabajo final integra los temas de la cursada en un mismo WAR.

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

---

## Bloque 4 — Reflexión (1:15)

**Diapositiva — Aprendizajes.** Contar el arco en una pasada (no leer las cinco cajas):

> Nos llevamos una forma de hacer una aplicación: partimos de los requerimientos del
> congreso, los bajamos a historias de usuario, eso se convirtió en objetos, esos objetos
> se persistieron, y después se consumieron por la API y las pantallas. En paralelo,
> GitLab y el pipeline hicieron que cada avance se viera en grupo1, no solo en la notebook.

Los tres pueden repartirse así si quieren: uno dice 1–2 (requerimientos → HU), otro 3–4
(objetos → persistir), el tercero 5 + paralelo (consumir + deploy).

Cerrar en una frase con lo pendiente: contraseñas hasheadas, permisos por rol, validar
datos en la API y tests en el pipeline.

**Diapositiva — Cierre** (Lucas). Dejarla en pantalla durante las preguntas: tiene la URL de la app.

---

## Preguntas que probablemente nos hagan

| Pregunta | Respuesta corta |
|----------|-----------------|
| ¿Por qué JWT y no `HttpSession`? (sistema completo / E6) | Para que el backend no guarde estado: simplifica correr en contenedores y servir a un cliente de otro origen. Y como el token no refleja cambios de rol, el filtro relee roles y estado desde la base en cada request. |
| ¿Las contraseñas están hasheadas? | No, y lo sabemos. Es lo primero de la lista de pendientes: BCrypt en el alta y en el login. |
| ¿Por qué DAO propio y no Spring Data? | Porque la cursada trabaja sobre Jakarta EE puro. `GenericDAO` + `AbstractJpaDAO` nos dio el CRUD compartido sin sumar un framework fuera del alcance de la materia. |
| ¿Cómo evitan que un evaluador revise su propio trabajo? | La recusación está en el servicio: el trabajo propio no aparece en el listado del comité ni puede asignarse, evaluarse ni dictaminarse. |
| ¿Qué pasa si dos evaluadores empatan 1 a 1? | El trabajo queda en evaluación y se habilita un tercer evaluador. El empate se guarda en la base para que quede trazado. |
| ¿Cómo manejan los archivos? | Se guardan como BLOB en la tabla `archivos` y se sirven por `GET /api/archivos/{id}`; el cliente los abre como blob con el token. |
| ¿Hay tests automatizados? | Hay un servlet de pruebas de ABM sobre los DAOs y verificaciones del WAR dentro del pipeline, pero no tests unitarios. Es el otro pendiente. |
| ¿El sistema soporta otra edición del congreso? | Sí: etapas, ejes, modalidades, aranceles y cupos son configurables desde la aplicación, sin tocar código ni volver a desplegar. |

---

## Checklist del día

- [ ] Deck exportado a PDF como respaldo (`Ctrl+P` → Guardar como PDF, horizontal, sin márgenes)
- [ ] Pipeline en verde y la app respondiendo en `grupo1.jyaa-ci.linti.unlp.edu.ar`
- [ ] Datos de demo cargados y sesiones abiertas por rol
- [ ] Ensayo completo cronometrado (al menos dos veces)
- [ ] Presentación subida al aula virtual **y** al repositorio de GitLab de la cátedra
